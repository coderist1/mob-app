import { Tabs } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
// Assuming you have a Colors file, which is often the case:
import { Colors } from '../../constants/Colors'; 

export default function LandlordLayout() {
  const primaryColor = Colors.primary || '#667eea'; 

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
          headerShown: false, 
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
      
      {/* Hiding signup as it is a pre-login flow screen */}
      <Tabs.Screen
        name="signup" 
        options={{
          href: null,
          headerShown: false,
        }}
      />
      
    </Tabs>
  );
}