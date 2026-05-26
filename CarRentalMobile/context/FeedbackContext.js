// context/FeedbackContext.js
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../services/api';
import { feedbackToApiPayload, fromApiFeedback } from '../utils/logReportUtils';

const FeedbackContext = createContext(null);
const FEEDBACK_KEY = 'carRental.feedback.v1';
const FEEDBACK_ENDPOINTS = ['/api/logreports/', '/api/log-reports/'];

const toStringValue = (value) => (value === null || value === undefined ? '' : String(value));

async function requestFeedback(method, pathSuffix = '', body) {
  let lastError;
  for (const base of FEEDBACK_ENDPOINTS) {
    try {
      return await apiRequest(`${base}${pathSuffix}`, {
        method,
        ...(body !== undefined ? { body } : {}),
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Feedback request failed');
}

async function fetchAllFeedback() {
  for (const base of FEEDBACK_ENDPOINTS) {
    try {
      const data = await apiRequest(base, { method: 'GET' });
      if (Array.isArray(data)) {
        return data.filter((item) => item.type === 'feedback').map(fromApiFeedback);
      }
    } catch {
      // try next
    }
  }
  return null;
}

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

  const persistFeedback = useCallback(async (next) => {
    setFeedback(next);
    try {
      await AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn('[FeedbackContext] Failed to persist feedback', error);
    }
  }, []);

  const loadFeedback = useCallback(async () => {
    try {
      const remote = await fetchAllFeedback();
      if (Array.isArray(remote)) {
        await persistFeedback(remote);
        return;
      }
    } catch (error) {
      console.warn('[FeedbackContext] remote load failed', error);
    }

    try {
      const raw = await AsyncStorage.getItem(FEEDBACK_KEY);
      const localFeedback = raw ? JSON.parse(raw) : [];
      setFeedback(Array.isArray(localFeedback) ? localFeedback : []);
    } catch (error) {
      console.warn('[FeedbackContext] Failed to load feedback', error);
    }
  }, [persistFeedback]);

  useEffect(() => {
    (async () => {
      await loadFeedback();
      setLoading(false);
    })();
  }, [loadFeedback]);

  const addFeedback = useCallback(async (feedbackData) => {
    const local = {
      ...feedbackData,
      id: feedbackData.id || `fb_${Date.now()}`,
      createdAt: feedbackData.createdAt || new Date().toISOString(),
    };

    setFeedback((prev) => {
      const next = [...prev, local];
      AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });

    try {
      const created = await requestFeedback('POST', '', feedbackToApiPayload(local));
      const normalized = fromApiFeedback(created);
      setFeedback((prev) => {
        const next = prev.map((item) => (String(item.id) === String(local.id) ? normalized : item));
        if (!next.some((item) => String(item.id) === String(normalized.id))) next.push(normalized);
        AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
      return normalized;
    } catch (error) {
      console.warn('[FeedbackContext] create failed', error);
      throw error;
    }
  }, [persistFeedback]);

  const updateFeedback = useCallback(async (feedbackId, updates) => {
    const existing = feedback.find((item) => String(item.id) === String(feedbackId));
    if (!existing) return;

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    setFeedback((prev) => {
      const next = prev.map((item) => (String(item.id) === String(feedbackId) ? merged : item));
      AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });

    const updated = await requestFeedback('PATCH', `${feedbackId}/`, feedbackToApiPayload(merged));
    const normalized = fromApiFeedback(updated);
    setFeedback((prev) => {
      const next = prev.map((item) => (String(item.id) === String(feedbackId) ? normalized : item));
      AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
    return normalized;
  }, [feedback]);

  const deleteFeedback = useCallback(async (feedbackId) => {
    setFeedback((prev) => {
      const next = prev.filter((item) => String(item.id) !== String(feedbackId));
      AsyncStorage.setItem(FEEDBACK_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });

    try {
      await requestFeedback('DELETE', `${feedbackId}/`);
    } catch (error) {
      console.warn('[FeedbackContext] delete failed', error);
      await loadFeedback();
      throw error;
    }
  }, [loadFeedback]);

  const getFeedbackForBooking = useCallback((bookingId) => {
    if (!bookingId) return [];
    return feedback.filter((f) => String(f.bookingId) === String(bookingId));
  }, [feedback]);

  const getFeedbackForOwner = useCallback((ownerIdOrEmail) => {
    if (!ownerIdOrEmail) return [];
    return feedback.filter((item) => isOwnerMatch(item, ownerIdOrEmail));
  }, [feedback]);

  const getFeedbackForRenter = useCallback((renterIdOrEmail) => {
    if (!renterIdOrEmail) return [];
    return feedback.filter((item) => isRenterMatch(item, renterIdOrEmail));
  }, [feedback]);

  const getFeedbackFromUser = useCallback((userEmail) => {
    if (!userEmail) return [];
    const normalized = userEmail.toLowerCase();
    return feedback.filter((f) => (f.fromUserEmail || '').toLowerCase() === normalized);
  }, [feedback]);

  const getFeedbackForUser = useCallback((userEmail) => {
    if (!userEmail) return [];
    const normalized = userEmail.toLowerCase();
    return feedback.filter((f) => (f.toUserEmail || '').toLowerCase() === normalized);
  }, [feedback]);

  const getRentalHistoryWithFeedback = useCallback((userEmail, userRole, bookings) => {
    if (!userEmail || !bookings) return [];
    const normalized = userEmail.toLowerCase();

    const userBookings = userRole === 'renter'
      ? bookings.filter((b) => (b.renterEmail || '').toLowerCase() === normalized)
      : bookings.filter((b) => b.ownerId === userEmail || (b.ownerEmail || '').toLowerCase() === normalized);

    return userBookings.map((booking) => ({
      ...booking,
      feedback: feedback.filter((f) => String(f.bookingId) === String(booking.id)),
      averageRating: feedback
        .filter((f) => String(f.bookingId) === String(booking.id))
        .reduce((sum, f) => sum + (f.rating || 0), 0) / Math.max(feedback.filter((f) => String(f.bookingId) === String(booking.id)).length, 1) || 0,
    }));
  }, [feedback]);

  const clearFeedback = useCallback(() => persistFeedback([]), [persistFeedback]);

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
