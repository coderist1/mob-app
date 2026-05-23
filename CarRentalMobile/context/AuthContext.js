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
        const userData = { ...savedSession };
        delete userData.token;
        delete userData.access;
        delete userData.authToken;
        delete userData.key;
        delete userData.jwt;
        delete userData.accessToken;
        delete userData.access_token;
        
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
    const userData = { ...authData };
    delete userData.token;
    delete userData.access;
    delete userData.authToken;
    delete userData.key;
    delete userData.jwt;
    delete userData.accessToken;
    delete userData.access_token;
    
    const session = { ...userData };
    if (token) session.token = token;
    
    setUser(userData);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const loginData = await apiRequest('/api/login/', {
        method: 'POST',
        body: { username: normalizedEmail, password },
      });

      const me = loginData?.user || loginData;
      await persistAuth(loginData);
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
          first_name: userData?.firstName || '',
          last_name: userData?.lastName || '',
          middle_name: userData?.middleName || '',
          role: userData?.role || 'renter',
          sex: userData?.sex || '',
          date_of_birth: userData?.dateOfBirth || null,
        },
      });

      return await login(normalizedEmail, password);
    } catch (error) {
      return { ok: false, error: error.message || 'Registration failed.' };
    }
  }, [login]);

  const logout = useCallback(async () => {
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

      if (partial?.firstName !== undefined) payload.first_name = partial.firstName;
      if (partial?.lastName !== undefined) payload.last_name = partial.lastName;
      if (partial?.middleName !== undefined) payload.middle_name = partial.middleName;
      if (partial?.phone !== undefined) payload.phone = partial.phone;
      if (partial?.photoUri !== undefined) payload.photo_uri = partial.photoUri;

      if (partial?.first_name !== undefined) payload.first_name = partial.first_name;
      if (partial?.last_name !== undefined) payload.last_name = partial.last_name;
      if (partial?.middle_name !== undefined) payload.middle_name = partial.middle_name;
      if (partial?.phone_number !== undefined) payload.phone = partial.phone_number;
      if (partial?.photo_uri !== undefined) payload.photo_uri = partial.photo_uri;

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
        firstName: payload.first_name ?? nextUser.firstName ?? nextUser.first_name ?? user?.firstName ?? '',
        lastName: payload.last_name ?? nextUser.lastName ?? nextUser.last_name ?? user?.lastName ?? '',
        middleName: payload.middle_name ?? nextUser.middleName ?? nextUser.middle_name ?? user?.middleName ?? '',
        phone: payload.phone ?? nextUser.phone ?? nextUser.phoneNumber ?? nextUser.phone_number ?? user?.phone ?? '',
        photoUri: payload.photo_uri ?? nextUser.photoUri ?? nextUser.photo_uri ?? user?.photoUri ?? '',
      };

      const mergedUser = { ...user, ...normalizedResponse };
      setUser(mergedUser);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(mergedUser));

      return mergedUser;
    } catch (error) {
      console.error('[AuthContext] Failed to update user:', error);
      throw error;
    }
  }, [user]);
  const updatePhoto = useCallback((uri) => updateUser({ photo_uri: uri ?? null }), [updateUser]);

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