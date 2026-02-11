// app/settings.tsx
import { View, Text, Pressable, Switch, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as storage from "../storage";
import Purchases from "react-native-purchases";
import { usePremium, THEMES, ThemeId } from "../context/PremiumContext";

export default function Settings() {
  const router = useRouter();
  const { isPremium, setIsPremium, activeTheme: t, selectedThemeId, setTheme, refreshPremiumStatus } = usePremium();
  const [reminderEnabled, setReminderEnabled] = useState(false);

  useEffect(() => {
    refreshPremiumStatus();
  }, []);

  async function handleUpgrade() {
    router.push("/(onboarding)/paywall");
  }

  async function handleManageSubscription() {
    Alert.alert("Manage Subscription", "Manage your subscription in the App Store.", [
      { text: "Cancel", style: "cancel" },
      { text: "Open Settings", onPress: () => Purchases.showManageSubscriptions() },
    ]);
  }

  async function handleRestore() {
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active["premium"]) {
        const user = await storage.getUser();
        if (user) await storage.saveUser({ ...user, isPremium: true });
        setIsPremium(true);
        Alert.alert("Success", "Premium subscription restored!");
      } else {
        Alert.alert("No Purchases Found", "You don't have any active subscriptions.");
      }
    } catch {
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
            await storage.clearAllGoals();
            await storage.clearStreak();
            Alert.alert("Data Cleared", "All data has been deleted.");
          },
        },
      ]
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 32, paddingTop: 64, paddingBottom: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Pressable onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={28} color={t.textPrimary} />
            </Pressable>
            <Text style={{ color: t.textPrimary, fontSize: 22, fontWeight: "bold" }}>Settings</Text>
            <View style={{ width: 28 }} />
          </View>
        </View>

        <View style={{ paddingHorizontal: 32 }}>
          {/* Premium Status / Upgrade Banner */}
          {!isPremium ? (
            <Pressable onPress={handleUpgrade} style={{ marginBottom: 24, borderRadius: 20, overflow: "hidden" }}>
              <LinearGradient
                colors={["#ffffff", "#e8e8e8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20 }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                      <MaterialCommunityIcons name="crown" size={22} color="#000000" />
                      <Text style={{ color: "#000000", fontSize: 18, fontWeight: "bold", marginLeft: 8 }}>
                        Upgrade to Premium
                      </Text>
                    </View>
                    <Text style={{ color: "#00000099", fontSize: 13 }}>
                      History • Stats • Themes • Reflections
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={26} color="#000000" />
                </View>
              </LinearGradient>
            </Pressable>
          ) : (
            <View style={{
              backgroundColor: t.surfaceElevated, borderRadius: 20, padding: 20,
              marginBottom: 24, borderWidth: 1, borderColor: t.success + "55",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <MaterialCommunityIcons name="crown" size={22} color={t.success} />
                <Text style={{ color: t.textPrimary, fontSize: 18, fontWeight: "bold", marginLeft: 8 }}>Premium Active</Text>
              </View>
              <Text style={{ color: t.textSecondary, fontSize: 13, marginBottom: 16 }}>
                You have access to all premium features
              </Text>
              <Pressable
                onPress={handleManageSubscription}
                style={{ backgroundColor: t.border, paddingVertical: 12, borderRadius: 12, alignItems: "center" }}
              >
                <Text style={{ color: t.textPrimary, fontWeight: "600" }}>Manage Subscription</Text>
              </Pressable>
            </View>
          )}

          {/* ─── Custom Themes (Premium) ─────────────────────────────── */}
          <SectionLabel label="Theme" t={t} />
          <View style={{
            backgroundColor: t.surfaceElevated, borderRadius: 20,
            padding: 16, marginBottom: 24, borderWidth: 1, borderColor: t.border,
          }}>
            {!isPremium ? (
              <View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                  {THEMES.map((theme) => (
                    <View
                      key={theme.id}
                      style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: theme.primary,
                        opacity: 0.35,
                        borderWidth: 2, borderColor: theme.border,
                      }}
                    />
                  ))}
                </View>
                <Pressable onPress={handleUpgrade} style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialCommunityIcons name="lock" size={14} color={t.primary} />
                  <Text style={{ color: t.primary, fontSize: 13, marginLeft: 6 }}>
                    Unlock 8 themes with Premium
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {THEMES.map((theme) => {
                  const isSelected = theme.id === selectedThemeId;
                  return (
                    <Pressable
                      key={theme.id}
                      onPress={() => setTheme(theme.id as ThemeId)}
                      style={{ alignItems: "center", width: 56 }}
                    >
                      <View style={{
                        width: 44, height: 44, borderRadius: 22,
                        backgroundColor: theme.primary,
                        borderWidth: isSelected ? 3 : 2,
                        borderColor: isSelected ? t.textPrimary : theme.border,
                        marginBottom: 4,
                        alignItems: "center", justifyContent: "center",
                      }}>
                        {isSelected && (
                          <MaterialCommunityIcons name="check" size={20} color={theme.background} />
                        )}
                      </View>
                      <Text style={{ color: t.textMuted, fontSize: 10, textAlign: "center" }}>
                        {theme.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* ─── Daily Reminder ────────────────────────────────────────── */}
          <SectionLabel label="Notifications" t={t} />
          <View style={{
            backgroundColor: t.surfaceElevated, borderRadius: 20, padding: 20,
            marginBottom: 24, borderWidth: 1, borderColor: t.border,
          }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.textPrimary, fontSize: 16, fontWeight: "600", marginBottom: 2 }}>
                  Daily Reminder
                </Text>
                <Text style={{ color: t.textSecondary, fontSize: 13 }}>
                  Get notified to set your daily goal
                </Text>
              </View>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: t.border, true: t.primary + "80" }}
                thumbColor={reminderEnabled ? t.primary : t.textMuted}
                disabled
              />
            </View>
            <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 8 }}>Coming soon</Text>
          </View>

          {/* ─── Restore / About ────────────────────────────────────────── */}
          <SectionLabel label="Account" t={t} />
          <View style={{
            backgroundColor: t.surfaceElevated, borderRadius: 20,
            marginBottom: 24, borderWidth: 1, borderColor: t.border, overflow: "hidden",
          }}>
            {!isPremium && (
              <Pressable
                onPress={handleRestore}
                style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: t.border }}
              >
                <Text style={{ color: t.textPrimary, fontSize: 16, fontWeight: "600", marginBottom: 2 }}>
                  Restore Purchases
                </Text>
                <Text style={{ color: t.textSecondary, fontSize: 13 }}>
                  Already purchased? Restore your subscription
                </Text>
              </Pressable>
            )}

            <View style={{ padding: 20 }}>
              <Text style={{ color: t.textPrimary, fontSize: 16, fontWeight: "600", marginBottom: 2 }}>About</Text>
              <Text style={{ color: t.textSecondary, fontSize: 13 }}>One Goal v1.0</Text>
              <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>
                One goal. Today. That's it.
              </Text>
            </View>
          </View>

          {/* ─── Danger Zone ─────────────────────────────────────────────── */}
          <Pressable
            onPress={clearAllData}
            style={{
              padding: 20, backgroundColor: t.surfaceElevated,
              borderRadius: 20, borderWidth: 1, borderColor: t.incomplete + "44",
              marginBottom: 40,
            }}
          >
            <Text style={{ color: t.incomplete, fontSize: 16, fontWeight: "600", marginBottom: 2 }}>
              Clear All Data
            </Text>
            <Text style={{ color: t.textMuted, fontSize: 13 }}>
              Delete all goals and reset streak
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label, t }: { label: string; t: any }) {
  return (
    <Text style={{
      color: t.textMuted, fontSize: 11, fontWeight: "700",
      letterSpacing: 1.2, textTransform: "uppercase",
      marginBottom: 8, marginLeft: 4,
    }}>
      {label}
    </Text>
  );
}