// context/LogReportContext.js
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../services/api';
import {
  fromApiReport,
  toApiPayload,
  updatesToApiPatch,
} from '../utils/logReportUtils';

const LOG_KEY = 'logReports';
const LOG_ENDPOINTS = ['/api/logreports/', '/api/log-reports/'];

const LogReportContext = createContext(null);

async function requestLogReport(method, pathSuffix = '', body) {
  let lastError;
  for (const base of LOG_ENDPOINTS) {
    try {
      return await apiRequest(`${base}${pathSuffix}`, {
        method,
        ...(body !== undefined ? { body } : {}),
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Log report request failed');
}

export function LogReportProvider({ children }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const persistReports = useCallback(async (next) => {
    setReports(next);
    try {
      await AsyncStorage.setItem(LOG_KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('[LogReportContext] persist error', e);
    }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      const data = await requestLogReport('GET');
      if (Array.isArray(data)) {
        const normalized = data
          .filter((item) => item.type !== 'feedback' && item.type !== 'damage')
          .map((item) => fromApiReport(item));
        await persistReports(normalized);
        return;
      }
    } catch (e) {
      console.warn('[LogReportContext] remote load failed', e);
    }

    try {
      const raw = await AsyncStorage.getItem(LOG_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached)) {
          setReports(cached.map((item) => fromApiReport(item)));
        }
      }
    } catch (e) {
      console.warn('[LogReportContext] cache load error', e);
    }
  }, [persistReports]);

  useEffect(() => {
    (async () => {
      await loadReports();
      setLoading(false);
    })();
  }, [loadReports]);

  const addReport = useCallback(async (report) => {
    const optimistic = fromApiReport({
      ...toApiPayload(report),
      id: report.id || `lr_${Date.now()}`,
      createdAt: report.createdAt || new Date().toISOString(),
    });
    optimistic.rental = { ...optimistic.rental, ...(report.rental || {}) };
    optimistic.checkin = { ...optimistic.checkin, ...(report.checkin || {}) };
    optimistic.checkout = report.checkout ?? null;
    optimistic.comments = report.comments || [];

    setReports((prev) => {
      const next = [optimistic, ...prev.filter((r) => String(r.id) !== String(optimistic.id))];
      AsyncStorage.setItem(LOG_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });

    try {
      const created = await requestLogReport('POST', '', toApiPayload(report));
      const normalized = fromApiReport(created);
      setReports((prev) => {
        const next = prev.map((r) => (String(r.id) === String(optimistic.id) ? normalized : r));
        if (!next.some((r) => String(r.id) === String(normalized.id))) next.unshift(normalized);
        AsyncStorage.setItem(LOG_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
      return normalized;
    } catch (error) {
      console.warn('[LogReportContext] create failed', error);
      throw error;
    }
  }, [persistReports]);

  const addCheckout = useCallback(async (reportId, checkoutData) => {
    const checkout = { ...checkoutData, createdAt: new Date().toISOString() };

    setReports((prev) => {
      const next = prev.map((r) =>
        String(r.id) === String(reportId) ? { ...r, checkout } : r
      );
      AsyncStorage.setItem(LOG_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });

    await requestLogReport('POST', `${reportId}/checkout/`, checkout);

    const refreshed = await requestLogReport('GET');
    if (Array.isArray(refreshed)) {
      const match = refreshed.find((r) => String(r.id) === String(reportId));
      if (match) {
        const normalized = fromApiReport(match);
        setReports((prev) => {
          const next = prev.map((r) => (String(r.id) === String(reportId) ? normalized : r));
          AsyncStorage.setItem(LOG_KEY, JSON.stringify(next)).catch(() => {});
          return next;
        });
      }
    }
  }, []);

  const updateReport = useCallback(async (reportId, updates) => {
    const existing = reports.find((r) => String(r.id) === String(reportId));

    if (updates.checkout && !existing?.checkout) {
      await addCheckout(reportId, updates.checkout);
      return;
    }

    const merged = existing
      ? {
          ...existing,
          checkin: updates.checkin ? { ...existing.checkin, ...updates.checkin } : existing.checkin,
          checkout: updates.checkout !== undefined ? updates.checkout : existing.checkout,
          comments: updates.comments ?? existing.comments,
        }
      : null;

    if (merged) {
      setReports((prev) => {
        const next = prev.map((r) => (String(r.id) === String(reportId) ? merged : r));
        AsyncStorage.setItem(LOG_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    }

    const patch = updatesToApiPatch(updates, existing);
    if (Object.keys(patch).length === 0) return;

    const updated = await requestLogReport('PATCH', `${reportId}/`, patch);
    const normalized = fromApiReport(updated);
    setReports((prev) => {
      const next = prev.map((r) => (String(r.id) === String(reportId) ? normalized : r));
      AsyncStorage.setItem(LOG_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [addCheckout, reports]);

  const deleteReport = useCallback(async (reportId) => {
    setReports((prev) => {
      const next = prev.filter((r) => String(r.id) !== String(reportId));
      AsyncStorage.setItem(LOG_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });

    try {
      await requestLogReport('DELETE', `${reportId}/`);
    } catch (error) {
      console.warn('[LogReportContext] delete failed', error);
      await loadReports();
      throw error;
    }
  }, [loadReports]);

  const addComment = useCallback(async (reportId, comment) => {
    const payload = {
      author: comment.author || comment.name || 'Anonymous',
      message: comment.message || comment.text || '',
    };

    const result = await requestLogReport('POST', `${reportId}/comments/`, payload);
    const normalized = fromApiReport(result);
    setReports((prev) => {
      const next = prev.map((r) => (String(r.id) === String(reportId) ? normalized : r));
      AsyncStorage.setItem(LOG_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const value = {
    reports,
    loading,
    addReport,
    addCheckout,
    updateReport,
    deleteReport,
    addComment,
    refreshReports: loadReports,
  };

  return (
    <LogReportContext.Provider value={value}>
      {children}
    </LogReportContext.Provider>
  );
}

export function useLogReport() {
  const ctx = useContext(LogReportContext);
  if (!ctx) throw new Error('useLogReport must be used inside <LogReportProvider>');
  return ctx;
}

export default LogReportContext;
