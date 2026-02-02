// app/(onboarding)/_layout.tsx
import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="philosophy" />
      <Stack.Screen name="demo" />
      <Stack.Screen name="paywall" />
    </Stack>
  );
}
