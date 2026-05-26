import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../services/api';

const AuthContext = createContext(null);
const USER_STORAGE_KEY = 'auth_user_data';
const PHOTO_KEY_PREFIX = 'profile_photo_';

const SESSION_KEY = 'carRental.session.v2';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const session = await AsyncStorage.getItem(SESSION_KEY);
        if (!session) return;

        const savedSession = JSON.parse(session);
        const userData = savedSession?.user ? { ...savedSession.user } : { ...savedSession };
        delete userData.token;
        delete userData.access;
        delete userData.authToken;
        delete userData.key;
        delete userData.jwt;
        delete userData.accessToken;
        delete userData.access_token;

        userData.role = userData.role || 'renter';

        if (savedSession.token) {
          try {
            const fresh = await apiRequest('/api/me/');
            Object.assign(userData, fresh?.user || fresh);
            userData.role = userData.role || savedSession.role || 'renter';
            await AsyncStorage.setItem(
              SESSION_KEY,
              JSON.stringify({ ...userData, token: savedSession.token }),
            );
          } catch {
            // keep cached session when offline
          }
        }

        const photoKey = `${PHOTO_KEY_PREFIX}${userData.email || userData.id}`;
        const savedPhoto = await AsyncStorage.getItem(photoKey);
        if (savedPhoto) userData.photoUri = savedPhoto;

        if (!mounted) return;
        setUser(userData);
      } catch {
        if (!mounted) return;
        await AsyncStorage.removeItem(SESSION_KEY);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

const persistAuth = useCallback(async (authData) => {
    const token = authData?.token || authData?.access || authData?.authToken || authData?.key || authData?.jwt || authData?.accessToken || authData?.access_token;

    const userData = authData?.user ? { ...authData.user } : { ...authData };
    delete userData.token;
    delete userData.access;
    delete userData.authToken;
    delete userData.key;
    delete userData.jwt;
    delete userData.accessToken;
    delete userData.access_token;

    userData.role = userData.role || 'renter';

    setUser(userData);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ ...userData, token }));
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const loginData = await apiRequest('/api/login/', {
        method: 'POST',
        body: { username: normalizedEmail, password },
      });

      const me = loginData?.user || loginData;
      if (!me?.id && loginData?.token && String(loginData.token).match(/^\d+$/)) {
        me.id = Number(loginData.token);
      }
      await persistAuth({ ...loginData, user: me });
      return { ok: true, user: me };
    } catch (error) {
      return { ok: false, error: error.message || 'Invalid email or password.' };
    }
  }, [persistAuth]);

  const register = useCallback(async (userData, password) => {
    try {
      const normalizedEmail = (userData?.email || '').trim().toLowerCase();
      if (!normalizedEmail || !password) {
        return { ok: false, error: 'Email and password are required.' };
      }

      await apiRequest('/api/register/', {
        method: 'POST',
        body: {
          email: normalizedEmail,
          username: normalizedEmail,
          password,
          firstName: userData?.firstName || '',
          lastName: userData?.lastName || '',
          middleName: userData?.middleName || '',
          role: userData?.role || 'renter',
          sex: userData?.sex || '',
          dateOfBirth: userData?.dateOfBirth || null,
        },
      });

      return await login(normalizedEmail, password);
    } catch (error) {
      return { ok: false, error: error.message || 'Registration failed.' };
    }
  }, [login]);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/logout/', { method: 'POST' });
    } catch {
      // ignore logout errors
    }
    setUser(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  }, []);

// In AuthContext.js, replace the updateUser function with this:

const updateUser = useCallback(async (partial) => {
    try {
      const payload = {};
      const currentEmail = user?.email || user?.username || '';
      const nextEmail = partial?.email ?? partial?.username ?? currentEmail;
      console.log('[AuthContext] updateUser received:', partial);

      if (partial?.firstName !== undefined) payload.firstName = partial.firstName;
      if (partial?.lastName !== undefined) payload.lastName = partial.lastName;
      if (partial?.middleName !== undefined) payload.middleName = partial.middleName;
      if (partial?.sex !== undefined) payload.sex = partial.sex;
      if (partial?.dateOfBirth !== undefined) payload.dateOfBirth = partial.dateOfBirth;

      if (partial?.first_name !== undefined) payload.firstName = partial.first_name;
      if (partial?.last_name !== undefined) payload.lastName = partial.last_name;
      if (partial?.middle_name !== undefined) payload.middleName = partial.middle_name;
      if (partial?.date_of_birth !== undefined) payload.dateOfBirth = partial.date_of_birth;

      if (partial?.email !== undefined || partial?.username !== undefined || currentEmail) {
        payload.email = nextEmail;
      }

      if (partial?.username !== undefined) {
        payload.username = partial.username;
      } else if (payload.email) {
        payload.username = payload.email;
      }

      if (Object.keys(payload).length === 0) {
        return user;
      }

      console.log('[AuthContext] Sending PATCH to /api/me/ with payload:', JSON.stringify(payload));

      const updated = await apiRequest('/api/me/', {
        method: 'PATCH',
        body: payload,
      });

      console.log('[AuthContext] Update response:', updated);

      const nextUser = updated?.user || updated;
      
      // Normalize the response - prefer payload values (what we sent) over potentially stale API response
      // This handles cases where API returns old/cached data
      const normalizedResponse = {
        ...nextUser,
        firstName: payload.firstName ?? nextUser.firstName ?? nextUser.first_name ?? user?.firstName ?? '',
        lastName: payload.lastName ?? nextUser.lastName ?? nextUser.last_name ?? user?.lastName ?? '',
        middleName: payload.middleName ?? nextUser.middleName ?? nextUser.middle_name ?? user?.middleName ?? '',
        phone: payload.phone ?? nextUser.phone ?? nextUser.phoneNumber ?? nextUser.phone_number ?? user?.phone ?? '',
        photoUri: user?.photoUri ?? nextUser.photoUri ?? nextUser.photo_uri ?? '',
      };

      const mergedUser = { ...user, ...normalizedResponse };
      setUser(mergedUser);

      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      const existingSession = sessionRaw ? JSON.parse(sessionRaw) : {};
      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ ...existingSession, ...mergedUser, token: existingSession.token }),
      );

      return mergedUser;
    } catch (error) {
      console.error('[AuthContext] Failed to update user:', error);
      throw error;
    }
  }, [user]);
  const updatePhoto = useCallback(async (uri) => {
    const photoKey = `${PHOTO_KEY_PREFIX}${user?.email || user?.id || 'default'}`;
    if (uri) {
      await AsyncStorage.setItem(photoKey, uri);
    } else {
      await AsyncStorage.removeItem(photoKey);
    }
    const mergedUser = { ...(user || {}), photoUri: uri ?? null };
    setUser(mergedUser);
    const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
    const existingSession = sessionRaw ? JSON.parse(sessionRaw) : {};
    await AsyncStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ ...existingSession, ...mergedUser, token: existingSession.token }),
    );
    return mergedUser;
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, users: [], loading, login, register, logout, updateUser, updatePhoto }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}