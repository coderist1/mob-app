// context/FeedbackContext.js
// Feedback & Reviews system linking feedback to rental bookings
// Tracks feedback from owner→renter and renter→owner

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../services/api';

const FeedbackContext = createContext(null);
const FEEDBACK_KEY = 'carRental.feedback.v1';

const toStringValue = (value) => (value === null || value === undefined ? '' : String(value));

const normalizeFeedbackRecord = (feedbackItem) => {
  const bookingData = feedbackItem?.booking ?? feedbackItem?.rental ?? feedbackItem?.booking_data ?? null;
  const fromData = feedbackItem?.fromUser ?? feedbackItem?.from_user ?? feedbackItem?.author ?? null;
  const toData = feedbackItem?.toUser ?? feedbackItem?.to_user ?? feedbackItem?.recipient ?? null;

  return {
    ...feedbackItem,
    id: feedbackItem?.id ?? feedbackItem?.pk ?? `fb_${Date.now()}`,
    bookingId: feedbackItem?.bookingId ?? feedbackItem?.booking_id ?? feedbackItem?.rentalId ?? feedbackItem?.rental_id ?? (bookingData && typeof bookingData === 'object' ? bookingData.id ?? bookingData.pk : bookingData) ?? null,
    vehicleId: feedbackItem?.vehicleId ?? feedbackItem?.vehicle_id ?? feedbackItem?.carId ?? feedbackItem?.car_id ?? null,
    vehicleName: feedbackItem?.vehicleName ?? feedbackItem?.vehicle_name ?? feedbackItem?.carName ?? feedbackItem?.car_name ?? null,
    fromUserId: feedbackItem?.fromUserId ?? feedbackItem?.from_user_id ?? (fromData && typeof fromData === 'object' ? fromData.id ?? fromData.pk : fromData) ?? null,
    fromUserEmail: feedbackItem?.fromUserEmail ?? feedbackItem?.from_user_email ?? (fromData && typeof fromData === 'object' ? fromData.email : null) ?? null,
    fromUserRole: feedbackItem?.fromUserRole ?? feedbackItem?.from_user_role ?? null,
    toUserId: feedbackItem?.toUserId ?? feedbackItem?.to_user_id ?? (toData && typeof toData === 'object' ? toData.id ?? toData.pk : toData) ?? null,
    toUserEmail: feedbackItem?.toUserEmail ?? feedbackItem?.to_user_email ?? (toData && typeof toData === 'object' ? toData.email : null) ?? null,
    toUserRole: feedbackItem?.toUserRole ?? feedbackItem?.to_user_role ?? null,
    rating: Number(feedbackItem?.rating ?? 5),
    message: feedbackItem?.message ?? feedbackItem?.comment ?? '',
    type: feedbackItem?.type ?? 'general',
    createdAt: feedbackItem?.createdAt ?? feedbackItem?.created_at ?? new Date().toISOString(),
  };
};

const isOwnerMatch = (item, ownerIdOrEmail) => {
  const target = toStringValue(ownerIdOrEmail).trim().toLowerCase();
  if (!target) return false;
  const ownerId = toStringValue(item?.toUserId).trim().toLowerCase();
  const ownerEmail = toStringValue(item?.toUserEmail).trim().toLowerCase();
  return ownerId === target || ownerEmail === target;
};

const isRenterMatch = (item, renterIdOrEmail) => {
  const target = toStringValue(renterIdOrEmail).trim().toLowerCase();
  if (!target) return false;
  const renterId = toStringValue(item?.fromUserId).trim().toLowerCase();
  const renterEmail = toStringValue(item?.fromUserEmail).trim().toLowerCase();
  return renterId === target || renterEmail === target;
};

export function FeedbackProvider({ children }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeedback = useCallback(async () => {
    let mounted = true;
    try {
      // 1) Load local cache first
      const raw = await AsyncStorage.getItem(FEEDBACK_KEY);
      if (!mounted) return;
      const localFeedback = raw ? JSON.parse(raw) : [];
      if (Array.isArray(localFeedback) && localFeedback.length > 0) {
        setFeedback(localFeedback);
      }

      if (!mounted) return;
      // Backend does not expose a feedback/reviews resource yet, so keep the
      // mobile experience local-first and avoid noisy 404 calls.
      setFeedback(Array.isArray(localFeedback) ? localFeedback.map(normalizeFeedbackRecord) : []);
    } catch (error) {
      console.warn('[FeedbackContext] Failed to load feedback', error);
    } finally {
      if (mounted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const persist = useCallback(async (next) => {
    setFeedback(next);
    try {
      await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn('[FeedbackContext] Failed to persist feedback', error);
    }
  }, []);

  const mutate = useCallback((updater) => {
    setFeedback((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(next)).catch((error) => {
        console.warn('[FeedbackContext] Failed to persist feedback', error);
      });
      return next;
    });
  }, []);

  // Add feedback/review
  const addFeedback = useCallback((feedbackData) => {
    const local = normalizeFeedbackRecord({
      ...feedbackData,
      id: feedbackData.id || `fb_${Date.now()}`,
      createdAt: feedbackData.createdAt || new Date().toISOString(),
    });

    // optimistic local add
    mutate((prev) => [...prev, local]);

    // No backend feedback endpoint is currently available. Keep changes local.

    return local;
  }, [mutate]);

  // Get feedback for a specific booking
  const getFeedbackForBooking = useCallback((bookingId) => {
    if (!bookingId) return [];
    return feedback.filter(f => f.bookingId === bookingId || String(f.bookingId) === String(bookingId));
  }, [feedback]);

  const getFeedbackForOwner = useCallback((ownerIdOrEmail) => {
    if (!ownerIdOrEmail) return [];
    return feedback.filter((item) => isOwnerMatch(item, ownerIdOrEmail));
  }, [feedback]);

  const getFeedbackForRenter = useCallback((renterIdOrEmail) => {
    if (!renterIdOrEmail) return [];
    return feedback.filter((item) => isRenterMatch(item, renterIdOrEmail));
  }, [feedback]);

  // Get feedback sent by a user
  const getFeedbackFromUser = useCallback((userEmail) => {
    if (!userEmail) return [];
    const normalized = userEmail.toLowerCase();
    return feedback.filter(f => (f.fromUserEmail || '').toLowerCase() === normalized);
  }, [feedback]);

  // Get feedback received by a user
  const getFeedbackForUser = useCallback((userEmail) => {
    if (!userEmail) return [];
    const normalized = userEmail.toLowerCase();
    return feedback.filter(f => (f.toUserEmail || '').toLowerCase() === normalized);
  }, [feedback]);

  // Get feedback for all bookings of a user (rental history with feedback)
  const getRentalHistoryWithFeedback = useCallback((userEmail, userRole, bookings) => {
    if (!userEmail || !bookings) return [];
    const normalized = userEmail.toLowerCase();
    
    // Filter bookings by user
    const userBookings = userRole === 'renter'
      ? bookings.filter(b => (b.renterEmail || '').toLowerCase() === normalized)
      : bookings.filter(b => b.ownerId === userEmail || (b.ownerEmail || '').toLowerCase() === normalized);

    // Add feedback to each booking
    return userBookings.map(booking => ({
      ...booking,
      feedback: feedback.filter(f => f.bookingId === booking.id || String(f.bookingId) === String(booking.id)),
      averageRating: feedback
        .filter(f => f.bookingId === booking.id || String(f.bookingId) === String(booking.id))
        .reduce((sum, f) => sum + (f.rating || 0), 0) / Math.max(feedback.filter(f => f.bookingId === booking.id || String(f.bookingId) === String(booking.id)).length, 1) || 0,
    }));
  }, [feedback]);

  // Update feedback (for editing before backend submission)
  const updateFeedback = useCallback((feedbackId, updates) => {
    mutate((prev) =>
      prev.map((item) => (item.id === feedbackId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    );

    // No backend feedback endpoint is currently available. Keep changes local.
  }, [mutate]);

  // Delete feedback
  const deleteFeedback = useCallback((feedbackId) => {
    mutate((prev) => prev.filter((item) => item.id !== feedbackId));

    // No backend feedback endpoint is currently available. Keep changes local.
  }, [mutate]);

  const clearFeedback = useCallback(() => persist([]), [persist]);

  return (
    <FeedbackContext.Provider
      value={{
        feedback,
        loading,
        addFeedback,
        updateFeedback,
        deleteFeedback,
        getFeedbackForBooking,
        getFeedbackForOwner,
        getFeedbackForRenter,
        getFeedbackFromUser,
        getFeedbackForUser,
        getRentalHistoryWithFeedback,
        clearFeedback,
        refreshFeedback: loadFeedback,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used inside <FeedbackProvider>');
  return ctx;
}
