<<<<<<< HEAD

import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function LandlordLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Landlord Portal',
          headerShown: true,
          headerStyle: { 
            backgroundColor: Colors.primary,
            height: 80, // Set a smaller custom height
          },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />
      <Stack.Screen
        name="signup"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="create-listing"
        options={{ title: 'Create Listing', headerStyle: { backgroundColor: Colors.primary }, headerTintColor: '#fff' }}
      />
    </Stack>
=======
import { Tabs } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';

export default function LandlordLayout() {
  // Use a consistent primary color based on the existing components
  const primaryColor = '#667eea'; 

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#e5e5e5',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: '#666',
        headerStyle: {
          backgroundColor: primaryColor,
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* 1. Dashboard (Home) - Maps to index.js */}
      <Tabs.Screen
        name="index" 
        options={{
          title: 'Dashboard',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      
      {/* 2. Inquiries (Messages) - Maps to inquiries.js */}
      <Tabs.Screen
        name="inquiries" 
        options={{
          title: 'Messages',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      
      {/* 3. Create Listing (Add Listing) - Maps to create-listing.js */}
      <Tabs.Screen
        name="create-listing" 
        options={{
          title: 'Add Listing',
          headerShown: false, // Hiding the header for a full-screen form
          tabBarIcon: ({ color, size }) => (
            <Feather name="plus-square" size={size} color={color} />
          ),
        }}
      />
      
      {/* 4. Notifications - Maps to notifications.js */}
      <Tabs.Screen
        name="notifications" 
        options={{
          title: 'Alerts',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size} color={color} />
          ),
        }}
      />
      
      {/* 5. Menu (Account) - Maps to menu.js */}
      <Tabs.Screen
        name="menu" 
        options={{
          title: 'Account',
          headerShown: true,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="menu" size={size} color={color} />
          ),
        }}
      />
      
      {/* Hiding signup as it is a modal/initial flow screen */}
      <Tabs.Screen
        name="signup" 
        options={{
          href: null,
          headerShown: false,
        }}
      />
      
    </Tabs>
>>>>>>> 7b4001c (feat(landlord): Initial local commit with full 5-tab navigation)
  );
}