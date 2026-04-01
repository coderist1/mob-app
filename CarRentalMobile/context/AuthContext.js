import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);
const USER_STORAGE_KEY = 'auth_user_data';
const PHOTO_KEY_PREFIX = 'profile_photo_';

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    status: 'loading', 
  });

  // 1. Bootstrap: Check for existing session on app launch
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          // Optional: Fetch latest profile photo from storage here
          const photoUri = await AsyncStorage.getItem(`${PHOTO_KEY_PREFIX}${userData.id}`);
          
          setState({ 
            user: { ...userData, photoUri: photoUri || userData.photoUri }, 
            status: 'authenticated' 
          });
        } else {
          setState({ user: null, status: 'idle' });
        }
      } catch (e) {
        console.error("Auth Bootstrap Error:", e);
        setState({ user: null, status: 'idle' });
      }
    };

    bootstrapAsync();
  }, []);

  // 2. Login: Handles persistence and state update
  const login = useCallback(async (userData) => {
    // Set loading to prevent UI interaction during async work
    setState(prev => ({ ...prev, status: 'loading' }));

    try {
      if (!userData?.id) throw new Error("Invalid user data");

      const photoUri = await AsyncStorage.getItem(`${PHOTO_KEY_PREFIX}${userData.id}`);
      const finalUser = { ...userData, photoUri: photoUri || userData.photoUri || null };

      // Persist the session
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(finalUser));

      setState({
        user: finalUser,
        status: 'authenticated'
      });
    } catch (error) {
      console.error("Login Error:", error);
      setState({ user: null, status: 'idle' });
    }
  }, []);

  // 3. Logout: Clears storage and resets state
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.error("Logout Error:", e);
    } finally {
      // Always reset state even if storage removal fails
      setState({ user: null, status: 'idle' });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ 
        user: state.user, 
        isLoading: state.status === 'loading', 
        isAuthenticated: state.status === 'authenticated', 
        login, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}