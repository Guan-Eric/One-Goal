// app/history.tsx
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Goal } from "../types/Goal";
import * as storage from "../storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function History() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const allGoals = await storage.getAllGoals();
    const sorted = allGoals.sort((a, b) => b.date.localeCompare(a.date));
    setGoals(sorted);

    const currentStreak = await storage.getStreak();
    setStreak(currentStreak);
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateString === today.toISOString().split("T")[0]) {
      return "Today";
    } else if (dateString === yesterday.toISOString().split("T")[0]) {
      return "Yesterday";
    }

    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function getDayOfWeek(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { weekday: "short" });
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-8 pt-16 pb-6">
        <View className="flex-row items-center justify-between mb-6">
          <Pressable onPress={() => router.back()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={28}
              color="#ffffff"
            />
          </Pressable>

          <Text className="text-text-primary text-2xl font-bold">History</Text>

          <View style={{ width: 28 }} />
        </View>

        {/* Stats */}
        <View className="flex-row justify-between py-4 border-t border-b border-border">
          <View>
            <Text className="text-text-primary text-3xl font-bold">
              {streak.current}
            </Text>
            <Text className="text-text-secondary text-sm mt-1">
              Current Streak
            </Text>
          </View>

          <View>
            <Text className="text-text-primary text-3xl font-bold">
              {streak.longest}
            </Text>
            <Text className="text-text-secondary text-sm mt-1">
              Best Streak
            </Text>
          </View>

          <View>
            <Text className="text-text-primary text-3xl font-bold">
              {goals.filter((g) => g.completed).length}
            </Text>
            <Text className="text-text-secondary text-sm mt-1">
              Total Goals
            </Text>
          </View>
        </View>
      </View>

      {/* Goals List */}
      <ScrollView className="flex-1 px-8" showsVerticalScrollIndicator={false}>
        {goals.length === 0 ? (
          <View className="py-20 items-center">
            <Text className="text-text-muted text-center text-lg">
              No goals yet.{"\n"}Start today!
            </Text>
          </View>
        ) : (
          goals.map((goal) => (
            <View
              key={goal.id}
              className="py-6 border-b border-border"
            >
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-text-secondary text-sm">
                  {formatDate(goal.date)}
                </Text>
                <View
                  className={`px-2 py-0.5 rounded ${
                    goal.completed ? "bg-success/20" : "bg-incomplete/20"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      goal.completed ? "text-success" : "text-incomplete"
                    }`}
                  >
                    {goal.completed ? "✓ Done" : "✗ Missed"}
                  </Text>
                </View>
              </View>

              <Text
                className={`text-xl ${
                  goal.completed
                    ? "text-text-primary"
                    : "text-text-secondary"
                }`}
              >
                {goal.title}
              </Text>

              {goal.completed && goal.completedAt && (
                <Text className="text-text-muted text-xs mt-2">
                  {new Date(goal.completedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              )}
            </View>
          ))
        )}

        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
