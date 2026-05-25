import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../services/api';

const BookingContext = createContext(null);
const BOOKINGS_KEY = 'carRental.bookings.v1';

const toStringValue = (value) => (value === null || value === undefined ? '' : String(value));

const normalizeBookingRecord = (booking, fallback = {}) => {
  const ownerData = booking?.owner ?? booking?.owner_user ?? booking?.ownerUser ?? booking?.user ?? booking?.user_data ?? null;
  const renterData = booking?.renter ?? booking?.renter_user ?? booking?.renterUser ?? booking?.user ?? booking?.user_data ?? null;
  const vehicleData = booking?.vehicle ?? booking?.car ?? booking?.vehicle_data ?? booking?.car_data ?? null;

  const ownerId = booking?.ownerId
    ?? booking?.owner_id
    ?? (ownerData && typeof ownerData === 'object' ? ownerData.id ?? ownerData.pk ?? ownerData.email : ownerData)
    ?? fallback.ownerId
    ?? fallback.owner_id
    ?? fallback.ownerEmail
    ?? null;

  const ownerEmail = booking?.ownerEmail
    ?? booking?.owner_email
    ?? (ownerData && typeof ownerData === 'object' ? ownerData.email : null)
    ?? (typeof ownerId === 'string' && ownerId.includes('@') ? ownerId : null)
    ?? fallback.ownerEmail
    ?? null;

  const renterEmail = booking?.renterEmail
    ?? booking?.renter_email
    ?? (renterData && typeof renterData === 'object' ? renterData.email : null)
    ?? fallback.renterEmail
    ?? null;

  const renterName = booking?.renterName
    ?? booking?.renter_name
    ?? (renterData && typeof renterData === 'object'
      ? renterData.name ?? renterData.fullName ?? renterData.username
      : renterData)
    ?? fallback.renterName
    ?? null;

  const vehicleId = booking?.vehicleId
    ?? booking?.vehicle_id
    ?? booking?.carId
    ?? booking?.car_id
    ?? (vehicleData && typeof vehicleData === 'object' ? vehicleData.id ?? vehicleData.pk : vehicleData)
    ?? fallback.vehicleId
    ?? fallback.vehicle_id
    ?? fallback.carId
    ?? null;

  const vehicleName = booking?.vehicleName
    ?? booking?.vehicle_name
    ?? booking?.carName
    ?? booking?.car_name
    ?? (vehicleData && typeof vehicleData === 'object' ? vehicleData.name ?? vehicleData.model : vehicleData)
    ?? fallback.vehicleName
    ?? null;

  const vehiclePhotoUri = booking?.vehiclePhotoUri
    ?? booking?.vehicle_photo_uri
    ?? booking?.carPhotoUri
    ?? booking?.photoUri
    ?? (vehicleData && typeof vehicleData === 'object' ? vehicleData.photoUri ?? vehicleData.photo_url ?? vehicleData.image_url ?? vehicleData.photo ?? vehicleData.image : null)
    ?? fallback.vehiclePhotoUri
    ?? fallback.photoUri
    ?? null;

  return {
    ...fallback,
    ...booking,
    id: booking?.id ?? booking?.pk ?? fallback.id ?? `bk_${Date.now()}`,
    ownerId,
    ownerEmail,
    renterEmail,
    renterName,
    vehicleId,
    vehicleName,
    vehiclePhotoUri,
    vehicleModel: booking?.vehicleModel ?? booking?.vehicle_model ?? booking?.carModel ?? fallback.vehicleModel ?? null,
    startDate: booking?.startDate ?? booking?.start_date ?? booking?.from ?? fallback.startDate ?? null,
    endDate: booking?.endDate ?? booking?.end_date ?? booking?.to ?? fallback.endDate ?? null,
    totalPrice: booking?.totalPrice ?? booking?.total_price ?? booking?.amount ?? booking?.price ?? fallback.totalPrice ?? null,
    status: booking?.status ?? fallback.status ?? 'pending',
    createdAt: booking?.createdAt ?? booking?.created_at ?? booking?.timestamp ?? fallback.createdAt ?? new Date().toISOString(),
    updatedAt: booking?.updatedAt ?? booking?.updated_at ?? fallback.updatedAt ?? null,
    rejectionReason: booking?.rejectionReason ?? booking?.rejection_reason ?? fallback.rejectionReason ?? '',
  };
};

const isOwnerMatch = (booking, ownerIdOrEmail) => {
  const target = toStringValue(ownerIdOrEmail).trim().toLowerCase();
  if (!target) return false;
  const ownerId = toStringValue(booking?.ownerId).trim().toLowerCase();
  const ownerEmail = toStringValue(booking?.ownerEmail).trim().toLowerCase();
  return ownerId === target || ownerEmail === target;
};

const isRenterMatch = (booking, renterEmail) => {
  const target = toStringValue(renterEmail).trim().toLowerCase();
  if (!target) return false;
  const bookingEmail = toStringValue(booking?.renterEmail).trim().toLowerCase();
  return bookingEmail === target;
};

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = useCallback(async () => {
    let mounted = true;
    try {
      const raw = await AsyncStorage.getItem(BOOKINGS_KEY);
      if (!mounted) return;
      const localBookings = raw ? JSON.parse(raw) : [];

      // Prefer backend data so the same records appear in web and mobile.
      const endpoints = ['/api/bookings/', '/api/rentals/', '/api/reservations/'];
      let remote = null;
      for (const ep of endpoints) {
        try {
          const data = await apiRequest(ep, { method: 'GET' });
          if (Array.isArray(data)) {
            remote = data;
            break;
          }
        } catch (e) {
          // try next
        }
      }

      if (!mounted) return;
      if (Array.isArray(remote)) {
        // Normalize remote items into local shape and preserve any cached fields.
        const normalized = remote.map((b) => {
          const localMatch = (localBookings || []).find((item) => String(item.id) === String(b?.id ?? b?.pk ?? ''));
          return normalizeBookingRecord(b, localMatch || {});
        });

        setBookings(normalized);
        AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(normalized)).catch(() => {});
        return;
      }

      if (Array.isArray(localBookings) && localBookings.length > 0) {
        setBookings(localBookings);
      }
    } catch (error) {
      console.warn('[BookingContext] Failed to load bookings', error);

      const raw = await AsyncStorage.getItem(BOOKINGS_KEY);
      const localBookings = raw ? JSON.parse(raw) : [];
      if (Array.isArray(localBookings) && localBookings.length > 0) {
        setBookings(localBookings);
      }
    } finally {
      if (mounted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const persist = useCallback(async (next) => {
    setBookings(next);
    try {
      await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
    } catch (error) {
      console.warn('[BookingContext] Failed to persist bookings', error);
    }
  }, []);

  const mutateBookings = useCallback((updater) => {
    setBookings((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(next)).catch((error) => {
        console.warn('[BookingContext] Failed to persist bookings', error);
      });
      return next;
    });
  }, []);

  const addBooking = useCallback((bookingData) => {
    // attempt to create on server, fallback to local
     const createRemote = async () => {
       const toNumericId = (value) => {
         const n = Number(value);
         return Number.isFinite(n) && n > 0 ? n : null;
       };

       // Read session first; backend usually expects auth user PK for renterId.
       let sessionUserId = null;
       let sessionEmail = null;
       try {
         const sessRaw = await AsyncStorage.getItem('carRental.session.v2');
         if (sessRaw) {
           const sess = JSON.parse(sessRaw);
           sessionUserId = toNumericId(sess?.id ?? sess?.pk ?? sess?.userId);
           sessionEmail = sess?.email ?? null;
         }
       } catch (e) {
         // ignore session read errors
       }

       // build a resilient payload that supplies multiple field variants
       const payload = {
         ...bookingData,
         // duplicate common fields under different names the backend might expect
         renterId: toNumericId(sessionUserId ?? bookingData.renterId ?? bookingData.renter_id ?? bookingData.renter),
         renter: bookingData.renter ?? bookingData.renter_email ?? bookingData.renterEmail ?? sessionEmail ?? null,
         vehicle: bookingData.vehicle ?? bookingData.vehicleId ?? bookingData.vehicle_id ?? bookingData.car ?? bookingData.carId ?? null,
         vehicleId: bookingData.vehicleId ?? bookingData.vehicle ?? bookingData.vehicle_id ?? null,
         start_date: bookingData.startDate ?? bookingData.start_date ?? bookingData.from ?? null,
         end_date: bookingData.endDate ?? bookingData.end_date ?? bookingData.to ?? null,
         total_price: bookingData.totalPrice ?? bookingData.total_price ?? bookingData.amount ?? bookingData.price ?? null,
       };

       // Provide alternate FK aliases often used by DRF serializers.
       if (payload.renterId) {
         payload.renter_id = payload.renterId;
         // Some serializers expect `renter` itself to be a numeric FK.
         payload.renter = payload.renterId;
       }

       // If we still don't have a numeric renterId but have an email, try to resolve the user id from the backend
       async function resolveUserIdByEmail(email) {
         if (!email) return null;
         const tryEndpoints = ['/users/', '/customers/', '/accounts/', '/profiles/'];
         for (const ep of tryEndpoints) {
           try {
             // many list endpoints accept ?email= query param
             const res = await apiRequest(`${ep}?email=${encodeURIComponent(email)}`, { method: 'GET' });
             if (Array.isArray(res) && res.length > 0) {
               const first = res[0];
               return first.user?.id ?? first.user?.pk ?? first.id ?? first.pk ?? first.userId ?? null;
             }
             if (res && (res.id || res.pk || res.user?.id || res.user?.pk)) {
               return res.user?.id ?? res.user?.pk ?? res.id ?? res.pk;
             }
           } catch (e) {
             // try next
           }
         }
         return null;
       }

       try {
         if ((!payload.renterId || payload.renterId === null) && payload.renter) {
           const resolved = await resolveUserIdByEmail(payload.renter);
           if (resolved) {
             console.warn('[BookingContext] resolved renterId from email', payload.renter, '->', resolved);
             payload.renterId = toNumericId(resolved);
             payload.renter_id = payload.renterId;
             payload.renter = payload.renterId;
           }
         }
       } catch (e) {
         // ignore resolve errors
       }

       // Remove non-numeric renterId values to avoid backend validation failures.
       if (!toNumericId(payload.renterId)) {
         delete payload.renterId;
         delete payload.renter_id;
       }

       // Clean undefined/null fields that would confuse some backends
       Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });

        const endpoints = ['/api/bookings/', '/api/rentals/', '/api/reservations/'];
       let created = null;
       for (const ep of endpoints) {
         try {
           console.log('[BookingContext] createRemote trying', ep, 'body:', payload);
           created = await apiRequest(ep, { method: 'POST', body: payload });
           break;
         } catch (e) {
           // try next endpoint
         }
       }
       return created;
     };

    const local = {
      ...normalizeBookingRecord(bookingData, {
        id: bookingData.id || `bk_${Date.now()}`,
        status: bookingData.status || 'pending',
        createdAt: bookingData.createdAt || new Date().toISOString(),
      }),
    };

    // optimistic local add
    mutateBookings((prev) => [...prev, local]);

    // Try to persist remotely and reconcile
    createRemote().then(async (created) => {
      if (created) {
        const normalized = normalizeBookingRecord(created, local);
        // replace local placeholder with server-normalized record
        mutateBookings(prev => prev.map(b => (String(b.id) === String(local.id) ? normalized : b)));

        try {
          const raw = await AsyncStorage.getItem(BOOKINGS_KEY);
          const cur = raw ? JSON.parse(raw) : [];
          const next = cur.map(b => (String(b.id) === String(local.id) ? normalized : b));
          // if local wasn't present for some reason, append
          if (!next.some(b => String(b.id) === String(normalized.id))) next.push(normalized);
          await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(next));
        } catch (e) {
          // ignore persisting error
        }
      }
    }).catch(()=>{});

    return local;
  }, [mutateBookings]);

  const updateBooking = useCallback((bookingId, updates) => {
    // update locally
    mutateBookings((prev) =>
      prev.map((item) => (item.id === bookingId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    );

      // attempt to patch on server (best-effort)
      (async () => {
        const endpoints = [`/api/bookings/${bookingId}/`, `/api/rentals/${bookingId}/`, `/api/reservations/${bookingId}/`];
        for (const ep of endpoints) {
          try {
            await apiRequest(ep, { method: 'PATCH', body: updates });
            break;
          } catch (e) {
            // try next
          }
        }
      })();
  }, [mutateBookings]);

  const setBookingStatus = useCallback((bookingId, status, rejectionReason = '') => {
    mutateBookings((prev) =>
      prev.map((item) =>
        item.id === bookingId
          ? {
              ...item,
              status,
              rejectionReason: status === 'rejected' ? rejectionReason : '',
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );

      // attempt to persist status change remotely
      (async () => {
        const payload = { status };
        if (status === 'rejected') payload.rejectionReason = rejectionReason;
        const endpoints = [`/api/bookings/${bookingId}/`, `/api/rentals/${bookingId}/`, `/api/reservations/${bookingId}/`];
        for (const ep of endpoints) {
          try {
            await apiRequest(ep, { method: 'PATCH', body: payload });
            break;
          } catch (e) {
            // try next
          }
        }
      })();
  }, [mutateBookings]);

  const getBookingsForRenter = useCallback((renterEmail) => {
    if (!renterEmail) return [];
    return bookings.filter((item) => isRenterMatch(item, renterEmail));
  }, [bookings]);

  const getBookingsForOwner = useCallback((ownerId) => {
    if (!ownerId) return [];
    return bookings.filter((item) => isOwnerMatch(item, ownerId));
  }, [bookings]);

  const getRentersForOwner = useCallback((ownerId) => {
    if (!ownerId) return [];
    const ownerBookings = bookings.filter((b) => isOwnerMatch(b, ownerId) && b.renterEmail);
    const map = new Map();
    ownerBookings.forEach((b) => {
      const email = (b.renterEmail || '').toLowerCase();
      if (!email) return;
      if (!map.has(email)) {
        map.set(email, {
          email,
          name: b.renterName || b.renterFullName || b.renter || '',
          renterId: b.renterId || b.renterEmail || null,
        });
      }
    });
    return Array.from(map.values());
  }, [bookings]);

  const returnVehicle = useCallback((bookingId, returnData = {}) => {
    // update locally with returned status and return info
    mutateBookings((prev) =>
      prev.map((item) =>
        item.id === bookingId
          ? {
              ...item,
              status: 'completed',
              returnedAt: returnData.returnedAt || new Date().toISOString(),
              returnNotes: returnData.returnNotes || '',
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );

      // attempt to persist return on backend
      (async () => {
        const payload = {
          status: 'completed',
          returnedAt: returnData.returnedAt || new Date().toISOString(),
          returnNotes: returnData.returnNotes || '',
        };

        const endpoints = [`/api/bookings/${bookingId}/`, `/api/rentals/${bookingId}/`, `/api/reservations/${bookingId}/`];
        for (const ep of endpoints) {
          try {
            await apiRequest(ep, { method: 'PATCH', body: payload });
            console.log('[BookingContext] Vehicle return recorded successfully', bookingId);
            break;
          } catch (e) {
            console.warn('[BookingContext] Failed to record vehicle return', e);
          }
        }
      })();
  }, [mutateBookings]);

  /**
   * Create a damage report tied to a booking and vehicle.
   * Adds an optimistic placeholder to the booking.damageReports array
   * and attempts to POST to backend endpoints used by various servers.
   */
  const addDamageReport = useCallback(async (bookingId, reportData) => {
    const placeholder = {
      id: reportData.id || `dr_${Date.now()}`,
      bookingId,
      vehicleId: reportData.vehicleId || reportData.vehicle_id || reportData.vehicle || null,
      reporterEmail: reportData.reporterEmail || reportData.reporter_email || reportData.email || null,
      description: reportData.description || reportData.note || reportData.details || '',
      photos: reportData.photos || reportData.images || [],
      status: reportData.status || 'open',
      createdAt: reportData.createdAt || new Date().toISOString(),
    };

    // optimistic attach to booking
    mutateBookings(prev => prev.map(b => b.id === bookingId ? { ...b, damageReports: [...(b.damageReports || []), placeholder] } : b));

    const payload = {
      booking: bookingId,
      bookingId,
      vehicle: placeholder.vehicleId,
      vehicleId: placeholder.vehicleId,
      reporter: placeholder.reporterEmail,
      reporterEmail: placeholder.reporterEmail,
      description: placeholder.description,
      photos: placeholder.photos,
    };

     const endpoints = ['/damage-reports/', '/damages/', '/reports/damage/'];
    let created = null;
    for (const ep of endpoints) {
      try {
        created = await apiRequest(ep, { method: 'POST', body: payload });
        if (created) break;
      } catch (e) {
        // try next
      }
    }

    if (created) {
      const normalized = {
        id: created.id ?? created.pk ?? placeholder.id,
        bookingId: created.bookingId ?? created.booking ?? bookingId,
        vehicleId: created.vehicleId ?? created.vehicle ?? placeholder.vehicleId,
        reporterEmail: created.reporterEmail ?? created.reporter ?? placeholder.reporterEmail,
        description: created.description ?? created.note ?? placeholder.description,
        photos: created.photos ?? created.images ?? placeholder.photos,
        status: created.status ?? placeholder.status,
        createdAt: created.createdAt ?? created.created_at ?? placeholder.createdAt,
      };

      // replace placeholder with normalized report inside booking
      mutateBookings(prev => prev.map(b => {
        if (b.id !== bookingId) return b;
        const nextReports = (b.damageReports || []).map(r => (String(r.id) === String(placeholder.id) ? normalized : r));
        // ensure normalized present
        if (!nextReports.some(r => String(r.id) === String(normalized.id))) nextReports.push(normalized);
        return { ...b, damageReports: nextReports };
      }));
    }

    return placeholder;
  }, [mutateBookings]);

  const getDamageReportsForBooking = useCallback((bookingId) => {
    const b = bookings.find(x => String(x.id) === String(bookingId));
    return (b && Array.isArray(b.damageReports)) ? b.damageReports : [];
  }, [bookings]);

  const clearBookings = useCallback(() => persist([]), [persist]);

  return (
    <BookingContext.Provider
      value={{
        bookings,
        loading,
        addBooking,
        updateBooking,
        setBookingStatus,
        returnVehicle,
        addDamageReport,
        getDamageReportsForBooking,
        getBookingsForRenter,
        getBookingsForOwner,
        getRentersForOwner,
        clearBookings,
        refreshBookings: loadBookings,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBookings must be used inside <BookingProvider>');
  return ctx;
}
