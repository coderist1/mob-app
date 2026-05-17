// context/FeedbackContext.js
// Feedback & Reviews system linking feedback to rental bookings
// Tracks feedback from owner→renter and renter→owner

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../services/api';

const FeedbackContext = createContext(null);
const FEEDBACK_KEY = 'carRental.feedback.v1';

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

      // 2) Try fetching from backend (multiple possible endpoints)
      const endpoints = ['/api/feedback/', '/api/reviews/', '/api/ratings/'];
      let remote = null;
      for (const ep of endpoints) {
        try {
          const data = await apiRequest(ep, { method: 'GET' });
          if (Array.isArray(data)) { remote = data; break; }
        } catch (e) {
          // try next
        }
      }

      if (!mounted) return;
      if (Array.isArray(remote)) {
        // Normalize remote items
        const normalized = remote.map((f) => ({
          id: f.id ?? f.pk ?? `fb_${Date.now()}`,
          bookingId: f.bookingId ?? f.booking_id ?? f.rental ?? f.rentalId ?? null,
          fromUserId: f.fromUserId ?? f.from_user_id ?? f.from_user ?? null,
          fromUserEmail: f.fromUserEmail ?? f.from_user_email ?? null,
          fromUserRole: f.fromUserRole ?? f.from_user_role ?? null,
          toUserId: f.toUserId ?? f.to_user_id ?? f.to_user ?? null,
          toUserEmail: f.toUserEmail ?? f.to_user_email ?? null,
          toUserRole: f.toUserRole ?? f.to_user_role ?? null,
          rating: f.rating ?? 5,
          message: f.message ?? f.comment ?? '',
          type: f.type ?? 'general', // 'general', 'complaint', 'praise'
          createdAt: f.createdAt ?? f.created_at ?? new Date().toISOString(),
          ...f,
        }));

        // Merge remote and local (remote authoritative)
        const byId = new Map();
        normalized.forEach(r => byId.set(String(r.id), r));
        (localFeedback || []).forEach(l => { if (!byId.has(String(l.id))) byId.set(String(l.id), l); });
        const merged = Array.from(byId.values());
        setFeedback(merged);
        // persist merged cache
        AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(merged)).catch(() => {});
      }
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
    const local = {
      ...feedbackData,
      id: feedbackData.id || `fb_${Date.now()}`,
      createdAt: feedbackData.createdAt || new Date().toISOString(),
    };

    // optimistic local add
    mutate((prev) => [...prev, local]);

    // Try to persist remotely
    (async () => {
      const endpoints = ['/api/feedback/', '/api/reviews/', '/api/ratings/'];
      for (const ep of endpoints) {
        try {
          const created = await apiRequest(ep, { method: 'POST', body: feedbackData });
          if (created) {
            const normalized = {
              id: created.id ?? created.pk ?? local.id,
              bookingId: created.bookingId ?? created.booking_id ?? local.bookingId,
              fromUserId: created.fromUserId ?? created.from_user_id ?? local.fromUserId,
              fromUserEmail: created.fromUserEmail ?? created.from_user_email ?? local.fromUserEmail,
              fromUserRole: created.fromUserRole ?? created.from_user_role ?? local.fromUserRole,
              toUserId: created.toUserId ?? created.to_user_id ?? local.toUserId,
              toUserEmail: created.toUserEmail ?? created.to_user_email ?? local.toUserEmail,
              toUserRole: created.toUserRole ?? created.to_user_role ?? local.toUserRole,
              rating: created.rating ?? local.rating ?? 5,
              message: created.message ?? local.message ?? '',
              type: created.type ?? local.type ?? 'general',
              createdAt: created.createdAt ?? created.created_at ?? local.createdAt,
              ...created,
            };
            mutate(prev => prev.map(f => (String(f.id) === String(local.id) ? normalized : f)));
          }
          break;
        } catch (e) {
          // try next
        }
      }
    })();

    return local;
  }, [mutate]);

  // Get feedback for a specific booking
  const getFeedbackForBooking = useCallback((bookingId) => {
    if (!bookingId) return [];
    return feedback.filter(f => f.bookingId === bookingId || String(f.bookingId) === String(bookingId));
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
        .filter(f => f.bookingId === booking.id)
        .reduce((sum, f) => sum + (f.rating || 0), 0) / Math.max(feedback.filter(f => f.bookingId === booking.id).length, 1) || 0,
    }));
  }, [feedback]);

  // Update feedback (for editing before backend submission)
  const updateFeedback = useCallback((feedbackId, updates) => {
    mutate((prev) =>
      prev.map((item) => (item.id === feedbackId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    );

    // attempt to patch on server
    (async () => {
      const endpoints = [`/api/feedback/${feedbackId}/`, `/api/reviews/${feedbackId}/`, `/api/ratings/${feedbackId}/`];
      for (const ep of endpoints) {
        try {
          await apiRequest(ep, { method: 'PATCH', body: updates });
          break;
        } catch (e) {
          // try next
        }
      }
    })();
  }, [mutate]);

  // Delete feedback
  const deleteFeedback = useCallback((feedbackId) => {
    mutate((prev) => prev.filter((item) => item.id !== feedbackId));

    // attempt to delete on server
    (async () => {
      const endpoints = [`/api/feedback/${feedbackId}/`, `/api/reviews/${feedbackId}/`, `/api/ratings/${feedbackId}/`];
      for (const ep of endpoints) {
        try {
          await apiRequest(ep, { method: 'DELETE' });
          break;
        } catch (e) {
          // try next
        }
      }
    })();
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
