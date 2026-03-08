// app/_layout.js  –  Root layout
// Wraps every screen with AuthProvider so useAuth() works everywhere.

import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index"    />
        <Stack.Screen name="login"    />
        <Stack.Screen name="register" />
        <Stack.Screen name="dashboard"/>
        <Stack.Screen name="renter"   />
        <Stack.Screen name="profile"  />
      </Stack>
    </AuthProvider>
  );
}