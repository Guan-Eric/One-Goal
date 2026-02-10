// app/index.tsx
import { View, Text, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as storage from "../storage";
import Purchases from "react-native-purchases";
import Constants from "expo-constants";

export default function Index() {
  const router = useRouter();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Initialize RevenueCat
        const apiKey = Constants.expoConfig?.extra?.revenuecatApiKey;
        if (apiKey && apiKey !== "your_revenuecat_api_key_here") {
          if (Platform.OS === "ios" || Platform.OS === "android") {
            await Purchases.configure({ apiKey });
          }
        }

        // Initialize user
        const user = await storage.initializeUser();

        // Route based on onboarding status
        if (!user.hasCompletedOnboarding) {
          router.replace("/(onboarding)/welcome");
        } else {
          router.replace("/home");
        }
      } catch (error) {
        console.error("Initialization error:", error);
        // On error, still try to navigate to home
        router.replace("/home");
      } finally {
        setInitializing(false);
      }
    }
    init();
  }, []);

  // Loading screen
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-text-primary text-2xl font-bold">One Goal</Text>
      <Text className="text-text-secondary text-sm mt-2">Loading...</Text>
    </View>
  );
}