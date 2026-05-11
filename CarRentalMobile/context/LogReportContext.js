// context/LogReportContext.js
// Provides log report CRUD for owners and renters.
// Uses @react-native-async-storage/async-storage for persistence.
// Run: npx expo install @react-native-async-storage/async-storage

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiRequest } from '../services/api';

let AsyncStorage = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (_) {
  // Package not yet installed — data will not persist between app restarts.
  // Fix: run  npx expo install @react-native-async-storage/async-storage
  console.warn('[LogReportContext] AsyncStorage not available. Data will not persist.');
}

// After the owner adds a checkout, mark the linked booking as completed.
async function markBookingCompleted(rentalId) {
  if (!rentalId) return;
  const endpoints = [
    `/api/bookings/${rentalId}/`,
    `/api/rentals/${rentalId}/`,
    `/api/reservations/${rentalId}/`,
  ];
  for (const ep of endpoints) {
    try {
      await apiRequest(ep, { method: 'PATCH', body: { status: 'completed' } });
      return; // success — stop trying
    } catch (_) {
      // try next endpoint
    }
  }
}

const LOG_KEY = 'logReports';

/* ─── Context ─── */
const LogReportContext = createContext(null);

export function LogReportProvider({ children }) {
  const [reports, setReports] = useState([]); // Initialize as empty array

  // New function to load log reports from API
  const loadReports = useCallback(async () => {
    try {
      const data = await apiRequest('/api/logreports/'); // Assuming this endpoint exists
      setReports(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading log reports:', e);
      setReports([]);
    }
  }, []);

  // Initial load of reports
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Poll every 8 seconds — replaces broken WebSocket real-time sync
  useEffect(() => {
    const interval = setInterval(() => {
      loadReports();
    }, 8000);
    return () => clearInterval(interval);
  }, [loadReports]);

  const createCheckin = useCallback(async (rental) => {
    try {
      const newReportData = {
        type:        'checkin',
        vehicleId:   rental.vehicleId,
        vehicleName: rental.vehicleName,
        rentalId:    rental.rentalId ?? rental.id,
        renterName:  rental.renterName || '',
        startDate:   rental.startDate,
        endDate:     rental.endDate,
        amount:      rental.amount,
        ownerName:   rental.ownerName || '',
        issues:      [],
        notes:       '',
        odometer:    '',
        fuelLevel:   '',
        photos:      [],
        customLabels: {},
        // Pass renterId under every alias the Django serializer checks
        reporterId:  rental.renterId ?? rental.reporterId ?? null,
        renterId:    rental.renterId ?? rental.reporterId ?? null,
      };
      const createdReport = await apiRequest('/api/logreports/', {
        method: 'POST',
        body: newReportData,
      });
      // The real-time event will update the state, but we can add it directly for immediate feedback
      setReports((prev) => [...prev, createdReport]);
      return createdReport;
    } catch (error) {
      console.error('Error creating checkin report:', error);
      return null;
    }
  }, []);

  const editCheckin = useCallback(async (id, updates) => {
    try {
      const updatedReport = await apiRequest(`/api/logreports/${id}/`, {
        method: 'PATCH',
        body: updates,
      });
      setReports((prev) => prev.map((r) => (r.id === id ? updatedReport : r)));
      return updatedReport;
    } catch (error) {
      console.error(`Error editing checkin report ${id}:`, error);
      return null;
    }
  }, []);

  const addCheckoutReport = useCallback(async (checkinId, data) => {
    try {
      let updatedReport;
      try {
        updatedReport = await apiRequest(`/api/logreports/${checkinId}/checkout/`, {
          method: 'POST',
          body: data,
        });
      } catch {
        updatedReport = await apiRequest(`/api/logreports/${checkinId}/`, {
          method: 'PATCH',
          body: { checkout: data },
        });
      }
      setReports((prev) => prev.map((r) => (r.id === checkinId ? updatedReport : r)));

      // FIX: After the owner saves a checkout, automatically mark the linked
      // booking as 'completed' so the renter sees the correct status.
      const rentalId = updatedReport?.rentalId ?? updatedReport?.rental_id
        ?? reports.find(r => r.id === checkinId)?.rentalId ?? null;
      await markBookingCompleted(rentalId);

      return updatedReport;
    } catch (error) {
      console.error(`Error adding checkout report for checkin ${checkinId}:`, error);
      return null;
    }
  }, [reports]);

  const editCheckout = useCallback(async (checkinId, updates) => {
    try {
      const updatedReport = await apiRequest(`/api/logreports/${checkinId}/`, {
        method: 'PATCH',
        body: { checkout: updates },
      });
      setReports((prev) => prev.map((r) => (r.id === checkinId ? updatedReport : r)));
      return updatedReport;
    } catch (error) {
      console.error(`Error editing checkout for checkin ${checkinId}:`, error);
      return null;
    }
  }, []);

  const removeReport = useCallback(async (id) => {
    try {
      await apiRequest(`/api/logreports/${id}/`, {
        method: 'DELETE',
      });
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error(`Error removing report ${id}:`, error);
    }
  }, []);

  const postComment = useCallback(async (reportId, comment) => {
    try {
      let updatedReport;
      try {
        updatedReport = await apiRequest(`/api/logreports/${reportId}/comments/`, {
          method: 'POST',
          body: comment,
        });
      } catch {
        updatedReport = await apiRequest(`/api/logreports/${reportId}/`, {
          method: 'PATCH',
          body: {
            commentsAppend: {
              ...comment,
              createdAt: new Date().toISOString(),
            },
          },
        });
      }
      setReports((prev) => prev.map((r) => (r.id === reportId ? updatedReport : r)));
      return updatedReport;
    } catch (error) {
      console.error(`Error posting comment for report ${reportId}:`, error);
      return null;
    }
  }, []);

  return (
    <LogReportContext.Provider value={{
      reports,
      refresh: loadReports, // refresh now triggers a full reload from API
      createCheckin,
      editCheckin,
      addCheckoutReport,
      editCheckout,
      removeReport,
      postComment,
      getReportsForVehicle: useCallback((vehicleId) => reports.filter(r => String(r.vehicleId || r.vehicle) === String(vehicleId)), [reports]),
      getReportsForRental: useCallback((rentalId) => reports.filter(r => String(r.rentalId || r.rental) === String(rentalId)), [reports]),
    }}>
      {children}
    </LogReportContext.Provider>
  );
}

export function useLogReport() {
  const ctx = useContext(LogReportContext);
  if (!ctx) throw new Error('useLogReport must be used within LogReportProvider');
  return ctx;
}

export default LogReportContext;