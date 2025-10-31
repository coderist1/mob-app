
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
  );
}