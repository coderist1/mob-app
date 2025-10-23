
import { Stack } from 'expo-router';

export default function LandlordLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Landlord Portal',
          headerShown: true,
        }}
      />
    </Stack>
  );
}