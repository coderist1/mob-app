
import { Stack, router } from 'expo-router';
import { TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function LandlordLayout() {
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            router.replace('/');
          }
        }
      ]
    );
  };

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
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={{ marginRight: 15 }}>
              <Feather name="log-out" size={24} color="#fff" />
            </TouchableOpacity>
          ),
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