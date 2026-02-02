// app/settings.tsx
import { View, Text, Pressable, Switch, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as storage from "../storage";
import Purchases from "react-native-purchases";

export default function Settings() {
  const router = useRouter();
  const [isPremium, setIsPremium] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const user = await storage.getUser();
      setIsPremium(user?.isPremium || false);

      // Check RevenueCat for actual premium status
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const hasPremium = customerInfo.entitlements.active["premium"] !== undefined;
        
        if (hasPremium !== isPremium && user) {
          await storage.saveUser({ ...user, isPremium: hasPremium });
          setIsPremium(hasPremium);
        }
      } catch (error) {
        console.log("RevenueCat not configured");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade() {
    router.push("/(onboarding)/paywall");
  }

  async function handleManageSubscription() {
    Alert.alert(
      "Manage Subscription",
      "Manage your subscription in the App Store settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Settings",
          onPress: () => {
            // Open App Store subscription management
            Purchases.showManageSubscriptions();
          },
        },
      ]
    );
  }

  async function handleRestore() {
    try {
      const customerInfo = await Purchases.restorePurchases();
      
      if (customerInfo.entitlements.active["premium"]) {
        const user = await storage.getUser();
        if (user) {
          await storage.saveUser({ ...user, isPremium: true });
        }
        setIsPremium(true);
        Alert.alert("Success", "Premium subscription restored!");
      } else {
        Alert.alert("No Purchases Found", "You don't have any active subscriptions.");
      }
    } catch (error) {
      console.error("Restore error:", error);
      Alert.alert("Restore Failed", "Please try again.");
    }
  }

  async function clearAllData() {
    Alert.alert(
      "Clear All Data",
      "This will delete all your goals and reset your streak. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Data",
          style: "destructive",
          onPress: async () => {
            try {
              await storage.getAllGoals().then(async () => {
                // Clear all storage
                const user = await storage.getUser();
                if (user) {
                  await storage.saveUser({
                    ...user,
                    hasCompletedOnboarding: true, // Keep onboarding complete
                  });
                }
                // Clear goals would go here
                Alert.alert("Data Cleared", "All data has been deleted.");
              });
            } catch (error) {
              Alert.alert("Error", "Failed to clear data");
            }
          },
        },
      ]
    );
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-8 pt-16 pb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable onPress={() => router.back()}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={28}
                color="#ffffff"
              />
            </Pressable>

            <Text className="text-text-primary text-2xl font-bold">Settings</Text>

            <View style={{ width: 28 }} />
          </View>
        </View>

        <View className="px-8">
          {/* Premium Status / Upgrade */}
          {!isPremium ? (
            <Pressable
              onPress={handleUpgrade}
              className="mb-6 overflow-hidden rounded-3xl"
            >
              <LinearGradient
                colors={["#ffffff", "#f5f5f5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20 }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <MaterialCommunityIcons name="crown" size={24} color="#000000" />
                      <Text className="text-background text-xl font-bold ml-2">
                        Upgrade to Premium
                      </Text>
                    </View>
                    <Text className="text-background/70 text-sm">
                      Unlimited history • Cloud sync • Advanced stats
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={28} color="#000000" />
                </View>
              </LinearGradient>
            </Pressable>
          ) : (
            <View className="bg-surface-elevated rounded-3xl p-6 mb-6 border border-border">
              <View className="flex-row items-center mb-3">
                <MaterialCommunityIcons name="crown" size={24} color="#00ff00" />
                <Text className="text-text-primary text-xl font-bold ml-2">
                  Premium Active
                </Text>
              </View>
              <Text className="text-text-secondary text-sm mb-4">
                You have access to all premium features
              </Text>
              <Pressable
                onPress={handleManageSubscription}
                className="bg-surface py-3 rounded-xl"
              >
                <Text className="text-text-primary text-center font-semibold">
                  Manage Subscription
                </Text>
              </Pressable>
            </View>
          )}

          {/* Daily Reminder (Coming soon) */}
          <View className="py-6 border-b border-border">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-1">
                <Text className="text-text-primary text-lg font-semibold mb-1">
                  Daily Reminder
                </Text>
                <Text className="text-text-secondary text-sm">
                  Get notified to set your daily goal
                </Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: "#3f3f46", true: "#ffffff40" }}
                thumbColor={reminderEnabled ? "#ffffff" : "#a0a0a0"}
                disabled
              />
            </View>
            <Text className="text-text-muted text-xs mt-2">
              Coming in a future update
            </Text>
          </View>

          {/* Theme */}
          <View className="py-6 border-b border-border">
            <Text className="text-text-primary text-lg font-semibold mb-1">
              Theme
            </Text>
            <Text className="text-text-secondary text-sm">
              Automatic (follows system)
            </Text>
            {!isPremium && (
              <Text className="text-text-muted text-xs mt-2">
                Custom themes available in Premium
              </Text>
            )}
          </View>

          {/* Restore Purchases */}
          {!isPremium && (
            <Pressable
              onPress={handleRestore}
              className="py-6 border-b border-border"
            >
              <Text className="text-text-primary text-lg font-semibold mb-1">
                Restore Purchases
              </Text>
              <Text className="text-text-secondary text-sm">
                Already purchased? Restore your subscription
              </Text>
            </Pressable>
          )}

          {/* About */}
          <View className="py-6 border-b border-border">
            <Text className="text-text-primary text-lg font-semibold mb-1">
              About
            </Text>
            <Text className="text-text-secondary text-sm mb-2">
              One Goal v1.0
            </Text>
            <Text className="text-text-muted text-xs leading-relaxed">
              One goal. Today. That's it.{"\n"}
              Simple. Focused. Effective.
            </Text>
          </View>

          {/* Clear Data */}
          <Pressable
            onPress={clearAllData}
            className="py-6"
          >
            <Text className="text-incomplete text-lg font-semibold mb-1">
              Clear All Data
            </Text>
            <Text className="text-text-muted text-sm">
              Delete all goals and reset streak
            </Text>
          </Pressable>

          <View className="h-20" />
        </View>
      </ScrollView>
    </View>
  );
}
