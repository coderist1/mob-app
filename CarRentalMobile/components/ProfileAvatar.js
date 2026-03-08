// components/ProfileAvatar.js
// Tap this in any dashboard header to go to /profile.
// Shows initials (or a colored circle if no name yet).

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS = {
  owner:  ['#f59e0b', '#d97706'],
  renter: ['#6366f1', '#4f46e5'],
  admin:  ['#a855f7', '#7e22ce'],
};

export default function ProfileAvatar({ size = 40 }) {
  const router = useRouter();
  const { user } = useAuth();

  const name    = user?.fullName || user?.firstName || 'U';
  const role    = user?.role || 'renter';
  const colors  = ROLE_COLORS[role] || ROLE_COLORS.renter;

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => (w[0] || '').toUpperCase())
    .join('');

  return (
    <TouchableOpacity
      onPress={() => router.push('/profile')}
      activeOpacity={0.8}
      style={[
        styles.avatar,
        {
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: colors[0],
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>
        {initials || 'U'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  initials: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});