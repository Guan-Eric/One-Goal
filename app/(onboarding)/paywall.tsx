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

export default function PaywallScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("annual");
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    initializePurchases();
  }, []);

  async function initializePurchases() {
    try {
      // Initialize RevenueCat
      const apiKey = Constants.expoConfig?.extra?.revenuecatApiKey;
      if (apiKey && apiKey !== "your_revenuecat_api_key_here") {
        await Purchases.configure({ apiKey });

        // Get current user ID
        const user = await storage.getUser();
        if (user) {
          await Purchases.logIn(user.id);
        }

        // Fetch offerings
        const availableOfferings = await Purchases.getOfferings();
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
      // Demo mode - just continue
      await completeOnboarding();
      return;
    }

    setPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const packageIdentifier = selectedPlan === "annual" ? "$rc_annual" : "$rc_monthly";
      const pkg = offerings.availablePackages.find(p => p.identifier === packageIdentifier);

      if (!pkg) {
        Alert.alert("Error", "Selected plan not available");
        setPurchasing(false);
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(pkg);

      if (customerInfo.entitlements.active["premium"]) {
        // Update user premium status
        const user = await storage.getUser();
        if (user) {
          await storage.saveUser({
            ...user,
            isPremium: true,
            hasCompletedOnboarding: true,
          });
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Welcome to Premium! 🎉",
          "You now have access to all premium features.",
          [{ text: "Let's Go!", onPress: () => router.replace("/") }]
        );
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error("Purchase error:", error);
        Alert.alert("Purchase Failed", "Please try again.");
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function completeOnboarding() {
    const user = await storage.getUser();
    if (user) {
      await storage.saveUser({
        ...user,
        hasCompletedOnboarding: true,
        isPremium: false,
      });
    }
    router.replace("/");
  }

  async function handleSkip() {
    Alert.alert(
      "Continue with Free?",
      "You'll have access to core features. Upgrade anytime to unlock premium benefits.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue Free",
          onPress: completeOnboarding
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
          await storage.saveUser({
            ...user,
            isPremium: true,
            hasCompletedOnboarding: true,
          });
        }
        router.replace("/");
      } else {
        Alert.alert("No Purchases Found", "You don't have any active subscriptions.");
      }
    } catch (error) {
      console.error("Restore error:", error);
      Alert.alert("Restore Failed", "Please try again.");
    }
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-8 pt-20">
          {/* Header */}
          <Animated.View entering={FadeInUp.delay(100).duration(600)}>
            <Text className="text-text-primary text-5xl font-bold text-center mb-4">
              Unlock{"\n"}Premium
            </Text>

            <Text className="text-text-secondary text-xl text-center mb-12 leading-relaxed">
              Get the most out of your{"\n"}daily goal practice
            </Text>
          </Animated.View>

          {/* Premium Features */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            <View className="bg-surface-elevated rounded-3xl p-6 mb-8 border border-border">
              <PremiumFeature
                icon="history"
                title="Unlimited History"
                description="Access all your past goals forever"
              />
              <PremiumFeature
                icon="cloud-sync"
                title="Cloud Sync"
                description="Seamlessly sync across all devices"
              />
              <PremiumFeature
                icon="notebook-edit"
                title="Reflection Notes"
                description="Add thoughts after completing goals"
              />
              <PremiumFeature
                icon="chart-box"
                title="Advanced Stats"
                description="Detailed insights & patterns"
              />
              <PremiumFeature
                icon="palette"
                title="Custom Themes"
                description="8 beautiful color schemes"
              />
              <PremiumFeature
                icon="widgets"
                title="Home Screen Widget"
                description="See your goal without opening app"
                isLast
              />
            </View>
          </Animated.View>

          {/* Pricing Plans */}
          <Animated.View entering={FadeInDown.delay(500).duration(600)}>
            <Text className="text-text-primary text-2xl font-bold mb-4 text-center">
              Choose Your Plan
            </Text>

            {/* Annual Plan */}
            <Pressable
              onPress={() => {
                setSelectedPlan("annual");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={`mb-4 rounded-3xl overflow-hidden border-2 ${selectedPlan === "annual" ? 'border-primary' : 'border-border'
                }`}
            >
              <View className="bg-surface-elevated p-6">
                {/* Best Value Badge */}
                {selectedPlan === "annual" && (
                  <View className="absolute -top-2 right-4 bg-success rounded-full px-4 py-1">
                    <Text className="text-background text-xs font-bold">BEST VALUE</Text>
                  </View>
                )}

                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-text-primary text-2xl font-bold mb-1">
                      Annual
                    </Text>
                    <Text className="text-text-secondary text-sm">
                      Save 44% • Cancel anytime
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-text-primary text-4xl font-bold">
                      $19
                    </Text>
                    <Text className="text-text-secondary text-sm">
                      per year
                    </Text>
                  </View>
                </View>

                <View className="bg-primary/10 rounded-xl p-3 mt-4">
                  <Text className="text-primary text-center text-sm font-semibold">
                    Just $1.67/month • 7-day free trial
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Monthly Plan */}
            <Pressable
              onPress={() => {
                setSelectedPlan("monthly");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={`mb-6 rounded-3xl overflow-hidden border-2 ${selectedPlan === "monthly" ? 'border-primary' : 'border-border'
                }`}
            >
              <View className="bg-surface-elevated p-6">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-text-primary text-2xl font-bold mb-1">
                      Monthly
                    </Text>
                    <Text className="text-text-secondary text-sm">
                      Flexible • Cancel anytime
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="text-text-primary text-4xl font-bold">
                      $3
                    </Text>
                    <Text className="text-text-secondary text-sm">
                      per month
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>

          {/* Social Proof */}
          <Animated.View entering={FadeInUp.delay(700).duration(600)}>
            <View className="bg-success/10 border border-success/30 rounded-2xl p-4 mb-6">
              <View className="flex-row items-center justify-center mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <MaterialCommunityIcons key={i} name="star" size={16} color="#00ff00" />
                ))}
              </View>
              <Text className="text-success text-center text-sm font-semibold mb-1">
                "Changed my life in 30 days"
              </Text>
              <Text className="text-text-secondary text-center text-xs">
                Join thousands building better habits
              </Text>
            </View>
          </Animated.View>

          {/* Legal */}
          <Text className="text-text-muted text-xs text-center leading-relaxed px-4">
            Payment will be charged to your {Platform.OS === "ios" ? "Apple" : "Google"} account.
            Subscription auto-renews unless cancelled 24 hours before period ends.
            Cancel anytime in settings.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 px-8 pb-8 pt-4 bg-background border-t border-border">
        <Pressable
          onPress={handlePurchase}
          disabled={purchasing}
          className="overflow-hidden rounded-full mb-3 shadow-lg"
        >
          <LinearGradient
            colors={["#ffffff", "#f5f5f5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 20 }}
          >
            <Text className="text-background text-center text-xl font-bold">
              {purchasing ? "Processing..." : "Start 7-Day Free Trial"}
            </Text>
          </LinearGradient>
        </Pressable>

        <View className="flex-row justify-center items-center space-x-6">
          <Pressable onPress={handleSkip}>
            <Text className="text-text-secondary text-sm font-semibold">
              Continue Free
            </Text>
          </Pressable>

          <Text className="text-text-muted">•</Text>

          <Pressable onPress={handleRestore}>
            <Text className="text-text-secondary text-sm font-semibold">
              Restore Purchase
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function PremiumFeature({
  icon,
  title,
  description,
  isLast = false
}: {
  icon: string;
  title: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <View className={`flex-row items-start ${!isLast ? 'mb-5 pb-5 border-b border-border' : ''}`}>
      <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-4 mt-1">
        <MaterialCommunityIcons name={icon as any} size={20} color="#ffffff" />
      </View>
      <View className="flex-1">
        <Text className="text-text-primary text-lg font-semibold mb-1">
          {title}
        </Text>
        <Text className="text-text-secondary text-sm leading-relaxed">
          {description}
        </Text>
      </View>
    </View>
  );
}
