// app/index.tsx
import { View, Text, Platform } from "react-native";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import * as storage from "../storage";
import Purchases from "react-native-purchases";
import Constants from "expo-constants";

type Destination = "/(onboarding)/welcome" | "/home" | null;

export default function Index() {
  const [destination, setDestination] = useState<Destination>(null);

  useEffect(() => {
    async function init() {
      try {
        // Initialize RevenueCat
        const apiKey = Constants.expoConfig?.extra?.revenuecatApiKey;
        if (apiKey && apiKey !== "your_revenuecat_api_key_here") {
          if (Platform.OS === "ios" || Platform.OS === "android") {
            await Purchases.configure({ apiKey });
          }
        }

        // Initialize user and decide where to go
        const user = await storage.initializeUser();
        setDestination(user.hasCompletedOnboarding ? "/home" : "/(onboarding)/welcome");
      } catch (error) {
        console.error("Initialization error:", error);
        setDestination("/home");
      }
    }

    init();
  }, []);

  // Show loading until we know where to go
  if (!destination) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#000000" }}>
        <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "bold" }}>One Goal</Text>
        <Text style={{ color: "#a0a0a0", fontSize: 14, marginTop: 8 }}>Loading...</Text>
      </View>
    );
  }

  // Let Expo Router handle the navigation declaratively
  return <Redirect href={destination} />;
}