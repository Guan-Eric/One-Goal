// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { useRouter, useSegments } from "expo-router";
import "../global.css";
import { initializeUser, getUser } from "../storage";
import Purchases from "react-native-purchases";
import Constants from "expo-constants";
import { Platform } from "react-native";

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    async function init() {
      try {
        // Initialize RevenueCat
        const apiKey = Constants.expoConfig?.extra?.revenuecatApiKey;
        if (apiKey && apiKey !== "your_revenuecat_api_key_here") {
          if (Platform.OS === "ios") {
            await Purchases.configure({ apiKey });
          } else if (Platform.OS === "android") {
            // Add Android key when available
            await Purchases.configure({ apiKey });
          }
        }

        // Initialize user
        const user = await initializeUser();

        // Route based on onboarding status
        if (!user.hasCompletedOnboarding) {
          router.replace("/(onboarding)/welcome");
        } else {
          router.replace("/");
        }
      } catch (error) {
        console.error("Initialization error:", error);
        router.replace("/");
      } finally {
        setInitializing(false);
      }
    }
    init();
  }, []);

  if (initializing) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-text-primary text-2xl font-bold">One Goal</Text>
        <Text className="text-text-secondary text-sm mt-2">Loading...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="index" />
      <Stack.Screen name="history" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
