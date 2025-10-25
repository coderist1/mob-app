import { Stack } from 'expo-router';

export default function TenantLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="signup"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="home"
        options={{ headerShown: false }} // Or configure as needed
      />
      {/* Add other tenant screens here in the future */}
    </Stack>
  );
}