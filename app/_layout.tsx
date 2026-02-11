// app/_layout.tsx
import { Stack } from "expo-router";
import "../global.css";
import { PremiumProvider } from "../context/PremiumContext";

export default function RootLayout() {
  return (
    <PremiumProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="history" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="stats" />
      </Stack>
    </PremiumProvider>
  );
}