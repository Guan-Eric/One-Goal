// app/history.tsx
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Goal } from "../types/Goal";
import * as storage from "../storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePremium } from "../context/PremiumContext";

const FREE_HISTORY_LIMIT = 7; // Free users see last 7 days

export default function History() {
  const router = useRouter();
  const { isPremium, activeTheme: t } = usePremium();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const allGoals = await storage.getAllGoals();
    const sorted = allGoals.sort((a, b) => b.date.localeCompare(a.date));
    setGoals(sorted);
    const s = await storage.getStreak();
    setStreak(s);
  }

  // Free users only see last 7 days
  const visibleGoals = isPremium ? goals : goals.slice(0, FREE_HISTORY_LIMIT);
  const hiddenCount = goals.length - visibleGoals.length;

  function formatDate(dateString: string): string {
    const today = storage.getTodayDate();
    const yesterday = storage.getYesterdayDate();
    if (dateString === today) return "Today";
    if (dateString === yesterday) return "Yesterday";
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: "short", month: "short", day: "numeric",
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 32, paddingTop: 64, paddingBottom: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <Pressable onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={t.textPrimary} />
          </Pressable>
          <Text style={{ color: t.textPrimary, fontSize: 22, fontWeight: "bold" }}>History</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Stats row */}
        <View style={{
          flexDirection: "row", justifyContent: "space-between",
          paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: t.border,
        }}>
          <StatBox label="Current Streak" value={`${streak.current}`} t={t} />
          <StatBox label="Best Streak" value={`${streak.longest}`} t={t} />
          <StatBox label="Completed" value={`${goals.filter((g) => g.completed).length}`} t={t} />
        </View>
      </View>

      {/* Goals List */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 32 }} showsVerticalScrollIndicator={false}>
        {goals.length === 0 ? (
          <View style={{ paddingVertical: 80, alignItems: "center" }}>
            <Text style={{ color: t.textMuted, textAlign: "center", fontSize: 18 }}>
              No goals yet.{"\n"}Start today!
            </Text>
          </View>
        ) : (
          <>
            {visibleGoals.map((goal) => (
              <View key={goal.id} style={{ paddingVertical: 20, borderBottomWidth: 1, borderColor: t.border }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <Text style={{ color: t.textSecondary, fontSize: 13 }}>{formatDate(goal.date)}</Text>
                  <View style={{
                    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
                    backgroundColor: goal.completed ? t.success + "33" : t.incomplete + "33",
                  }}>
                    <Text style={{ fontSize: 12, color: goal.completed ? t.success : t.incomplete }}>
                      {goal.completed ? "✓ Done" : "✗ Missed"}
                    </Text>
                  </View>
                </View>

                <Text style={{
                  fontSize: 18,
                  color: goal.completed ? t.textPrimary : t.textSecondary,
                  textDecorationLine: goal.completed ? "none" : "none",
                }}>
                  {goal.title}
                </Text>

                {goal.completed && goal.completedAt && (
                  <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>
                    {new Date(goal.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                )}

                {/* Reflection (premium only) */}
                {isPremium && goal.reflection ? (
                  <View style={{
                    marginTop: 8, paddingLeft: 12,
                    borderLeftWidth: 2, borderLeftColor: t.primary + "66",
                  }}>
                    <Text style={{ color: t.textSecondary, fontSize: 13, fontStyle: "italic" }}>
                      "{goal.reflection}"
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}

            {/* Free upsell banner */}
            {!isPremium && hiddenCount > 0 && (
              <Pressable
                onPress={() => router.push("/(onboarding)/paywall")}
                style={{
                  marginTop: 16, marginBottom: 32, padding: 20,
                  backgroundColor: t.surfaceElevated,
                  borderRadius: 16, borderWidth: 1, borderColor: t.primary + "55",
                  alignItems: "center",
                }}
              >
                <MaterialCommunityIcons name="lock" size={24} color={t.primary} />
                <Text style={{ color: t.textPrimary, fontWeight: "bold", fontSize: 16, marginTop: 8 }}>
                  {hiddenCount} more goal{hiddenCount > 1 ? "s" : ""} hidden
                </Text>
                <Text style={{ color: t.textSecondary, fontSize: 14, marginTop: 4, textAlign: "center" }}>
                  Upgrade to Premium for unlimited history
                </Text>
                <View style={{
                  marginTop: 12, backgroundColor: t.primary,
                  paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20,
                }}>
                  <Text style={{ color: t.background, fontWeight: "600" }}>Unlock Premium</Text>
                </View>
              </Pressable>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value, t }: { label: string; value: string; t: any }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ color: t.textPrimary, fontSize: 28, fontWeight: "bold" }}>{value}</Text>
      <Text style={{ color: t.textSecondary, fontSize: 12, marginTop: 4 }}>{label}</Text>
    </View>
  );
}