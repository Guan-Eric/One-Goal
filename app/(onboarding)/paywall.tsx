// app/(onboarding)/paywall.tsx
import { View, Text, Pressable, ScrollView, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Purchases, { PurchasesOffering } from "react-native-purchases";
import Constants from "expo-constants";
import * as storage from "../../storage";
import { usePremium } from "../../context/PremiumContext";

// ✅ These match your RevenueCat product identifiers exactly
const RC_YEARLY_ID = "one_goal_yearly";
const RC_WEEKLY_ID = "one_goal_weekly";

export default function PaywallScreen() {
  const router = useRouter();
  const { setIsPremium } = usePremium();
  const [selectedPlan, setSelectedPlan] = useState<"yearly" | "weekly">("yearly");
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    initializePurchases();
  }, []);

  async function initializePurchases() {
    try {
      const apiKey = Constants.expoConfig?.extra?.revenuecatApiKey;
      if (apiKey) {
        // Configure RC (safe to call multiple times)
        await Purchases.configure({ apiKey });

        const user = await storage.getUser();
        if (user) {
          await Purchases.logIn(user.id);
        }

        const availableOfferings = await Purchases.getOfferings();
        console.log(
          "Available packages:",
          availableOfferings.current?.availablePackages.map((p) => p.identifier)
        );
        if (availableOfferings.current) {
          setOfferings(availableOfferings.current);
        }
      }
    } catch (error) {
      console.error("Error initializing purchases:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase() {
    if (!offerings) {
      // No offerings loaded — likely simulator or no RC key; skip to app
      await completeOnboarding(false);
      return;
    }

    setPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Find the package by the custom identifier you set in RC dashboard
      const targetId = selectedPlan === "yearly" ? RC_YEARLY_ID : RC_WEEKLY_ID;
      const pkg = offerings.availablePackages.find(
        (p) => p.identifier === targetId || p.product.identifier === targetId
      );

      if (!pkg) {
        console.warn(
          `Package "${targetId}" not found. Available:`,
          offerings.availablePackages.map((p) => `${p.identifier} / ${p.product.identifier}`)
        );
        Alert.alert(
          "Plan Unavailable",
          `Could not find the ${selectedPlan} plan. Please try the other option or restore purchases.`
        );
        setPurchasing(false);
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);

      if (customerInfo.entitlements.active["premium"]) {
        await completeOnboarding(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Welcome to Premium! 🎉", "You now have access to all features.", [
          { text: "Let's Go!", onPress: () => router.replace("/home") },
        ]);
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error("Purchase error:", error);
        Alert.alert("Purchase Failed", "Please try again or restore purchases.");
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function completeOnboarding(isPremium: boolean) {
    const user = await storage.getUser();
    if (user) {
      await storage.saveUser({ ...user, hasCompletedOnboarding: true, isPremium });
    }
    setIsPremium(isPremium);
  }

  async function handleSkip() {
    Alert.alert(
      "Continue with Free?",
      "You'll have access to core features. Upgrade anytime in Settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue Free",
          onPress: async () => {
            await completeOnboarding(false);
            router.replace("/home");
          },
        },
      ]
    );
  }

  async function handleRestore() {
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active["premium"]) {
        await completeOnboarding(true);
        Alert.alert("Restored! 🎉", "Your premium subscription is active.", [
          { text: "Continue", onPress: () => router.replace("/home") },
        ]);
      } else {
        Alert.alert("No Active Subscription", "No premium purchases found for this account.");
      }
    } catch (error) {
      console.error("Restore error:", error);
      Alert.alert("Restore Failed", "Please try again.");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 220 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 32, paddingTop: 64 }}>
          {/* Header */}
          <Animated.View entering={FadeInUp.delay(100).duration(600)}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 44,
                fontWeight: "bold",
                textAlign: "center",
                marginBottom: 12,
              }}
            >
              Unlock{"\n"}Premium
            </Text>
            <Text
              style={{
                color: "#a0a0a0",
                fontSize: 18,
                textAlign: "center",
                marginBottom: 40,
                lineHeight: 26,
              }}
            >
              Everything you need to{"\n"}stay consistent
            </Text>
          </Animated.View>

          {/* Features */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            <View
              style={{
                backgroundColor: "#151515",
                borderRadius: 24,
                padding: 24,
                marginBottom: 32,
                borderWidth: 1,
                borderColor: "#1f1f1f",
              }}
            >
              {[
                { icon: "history", title: "Unlimited History", desc: "Access all your past goals forever" },
                { icon: "notebook-edit", title: "Reflection Notes", desc: "Add thoughts after completing goals" },
                { icon: "chart-box", title: "Advanced Statistics", desc: "Detailed insights & heatmaps" },
                { icon: "palette", title: "8 Custom Themes", desc: "Beautiful color schemes" },
                { icon: "widgets", title: "Home Screen Widget", desc: "See your goal without opening the app" },
              ].map((f, i, arr) => (
                <View
                  key={f.title}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    borderBottomWidth: i < arr.length - 1 ? 1 : 0,
                    borderBottomColor: "#1f1f1f",
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: "#ffffff22",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                    }}
                  >
                    <MaterialCommunityIcons name={f.icon as any} size={18} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "600" }}>{f.title}</Text>
                    <Text style={{ color: "#666666", fontSize: 13, marginTop: 2 }}>{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Plans */}
          <Animated.View entering={FadeInDown.delay(350).duration(600)}>
            <Text
              style={{
                color: "#ffffff",
                fontSize: 20,
                fontWeight: "bold",
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Choose Your Plan
            </Text>

            {/* Yearly — default/recommended */}
            <Pressable
              onPress={() => {
                setSelectedPlan("yearly");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={{
                marginBottom: 12,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: selectedPlan === "yearly" ? "#ffffff" : "#2a2a2a",
                backgroundColor: "#151515",
                overflow: "hidden",
              }}
            >
              {/* Best Value badge */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  backgroundColor: "#ffffff",
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderBottomLeftRadius: 14,
                }}
              >
                <Text style={{ color: "#000000", fontSize: 11, fontWeight: "800" }}>
                  BEST VALUE
                </Text>
              </View>

              <View style={{ padding: 22, paddingRight: 90 }}>
                <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>
                  Yearly
                </Text>
                <Text style={{ color: "#a0a0a0", fontSize: 13, marginBottom: 12 }}>
                  Try free for 3 days, then $19.99/year
                </Text>
                <View
                  style={{
                    backgroundColor: "#ffffff18",
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={{ color: "#ffffff", fontSize: 13, fontWeight: "600" }}>
                    $0.38/week • Save 76%
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Weekly */}
            <Pressable
              onPress={() => {
                setSelectedPlan("weekly");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={{
                marginBottom: 24,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: selectedPlan === "weekly" ? "#ffffff" : "#2a2a2a",
                backgroundColor: "#151515",
              }}
            >
              <View style={{ padding: 22 }}>
                <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>
                  Weekly
                </Text>
                <Text style={{ color: "#a0a0a0", fontSize: 13, marginBottom: 12 }}>
                  Try free for 3 days, then $1.99/week
                </Text>
                <Text style={{ color: "#666666", fontSize: 13 }}>Flexible • Cancel anytime</Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* Legal */}
          <Text
            style={{
              color: "#444444",
              fontSize: 11,
              textAlign: "center",
              lineHeight: 18,
              paddingHorizontal: 8,
            }}
          >
            Payment charged to your {Platform.OS === "ios" ? "Apple ID" : "Google account"} at
            confirmation. Subscription renews automatically unless cancelled at least 24 hours before
            the end of the current period. Cancel anytime in{" "}
            {Platform.OS === "ios" ? "App Store Settings" : "Google Play"}.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: 32,
          paddingBottom: 44,
          paddingTop: 16,
          backgroundColor: "#000000",
          borderTopWidth: 1,
          borderTopColor: "#1a1a1a",
        }}
      >
        <Pressable
          onPress={handlePurchase}
          disabled={purchasing}
          style={{
            backgroundColor: "#ffffff",
            paddingVertical: 20,
            borderRadius: 100,
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ color: "#000000", fontSize: 18, fontWeight: "bold" }}>
            {purchasing
              ? "Processing..."
              : `Start 3-Day Free Trial`}
          </Text>
          <Text style={{ color: "#00000088", fontSize: 13, marginTop: 2 }}>
            {selectedPlan === "yearly" ? "Then $19.99/year" : "Then $1.99/week"}
          </Text>
        </Pressable>

        <View style={{ flexDirection: "row", justifyContent: "center", gap: 32 }}>
          <Pressable onPress={handleSkip}>
            <Text style={{ color: "#666666", fontSize: 14, fontWeight: "600" }}>Continue Free</Text>
          </Pressable>
          <Text style={{ color: "#333333", fontSize: 14 }}>•</Text>
          <Pressable onPress={handleRestore}>
            <Text style={{ color: "#666666", fontSize: 14, fontWeight: "600" }}>
              Restore Purchase
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}