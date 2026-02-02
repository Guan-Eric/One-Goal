// app/index.tsx
import { View, Text, TextInput, Pressable, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Goal } from "../types/Goal";
import * as storage from "../storage";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Purchases from "react-native-purchases";
import Constants from "expo-constants";

export default function Home() {
  const router = useRouter();
  const [initializing, setInitializing] = useState(true);
  const [todayGoal, setTodayGoal] = useState<Goal | null>(null);
  const [goalText, setGoalText] = useState("");
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const apiKey = Constants.expoConfig?.extra?.revenuecatApiKey;
        if (apiKey && apiKey !== "your_revenuecat_api_key_here") {
          if (Platform.OS === "ios") {
            await Purchases.configure({ apiKey });
          } else if (Platform.OS === "android") {
            await Purchases.configure({ apiKey });
          }
        }

        const user = await storage.initializeUser();

        if (!user.hasCompletedOnboarding) {
          router.replace("/(onboarding)/welcome");
          return;
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setInitializing(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!initializing) {
      loadTodayGoal();
      loadStreak();
    }
  }, [initializing]);

  async function loadTodayGoal() {
    const today = storage.getTodayDate();
    const goal = await storage.getGoalForDate(today);
    setTodayGoal(goal);
    setGoalText(goal?.title || "");
    setIsEditing(!goal);
    setLoading(false);
  }

  async function loadStreak() {
    const currentStreak = await storage.getStreak();
    setStreak(currentStreak);
  }

  async function createOrUpdateGoal() {
    if (!goalText.trim()) {
      Alert.alert("Empty goal", "Please write what you want to accomplish today.");
      return;
    }

    const today = storage.getTodayDate();

    if (todayGoal) {
      // Update existing goal
      const updated = { ...todayGoal, title: goalText.trim() };
      await storage.saveGoal(updated);
      setTodayGoal(updated);
      setIsEditing(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Create new goal
      const newGoal: Goal = {
        id: `goal_${Date.now()}`,
        userId: "local", // Will be replaced with actual user ID when auth is added
        date: today,
        title: goalText.trim(),
        completed: false,
        createdAt: Date.now(),
      };
      await storage.saveGoal(newGoal);
      setTodayGoal(newGoal);
      setIsEditing(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  async function completeGoal() {
    if (!todayGoal) return;

    const completed: Goal = {
      ...todayGoal,
      completed: true,
      completedAt: Date.now(),
    };

    await storage.saveGoal(completed);
    setTodayGoal(completed);

    // Update streak
    const newStreak = await storage.updateStreak(todayGoal.date);
    setStreak(newStreak);

    // Celebration haptics
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      "🎉 Goal Complete!",
      newStreak.current > 1
        ? `${newStreak.current} day streak!`
        : "Great job today!",
      [{ text: "Done", style: "default" }]
    );
  }

  async function editGoal() {
    if (todayGoal?.completed) {
      Alert.alert(
        "Goal Completed",
        "You can't edit a completed goal. This preserves your achievement.",
        [{ text: "OK" }]
      );
      return;
    }
    setIsEditing(true);
  }

  if (initializing) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-text-primary text-2xl font-bold">One Goal</Text>
        <Text className="text-text-secondary text-sm mt-2">Loading...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-text-primary text-2xl">One Goal</Text>
      </View>
    );
  }

  // Goal creation/editing view
  if (isEditing) {
    return (
      <View className="flex-1 bg-background px-8 justify-center">
        <Text className="text-text-primary text-4xl font-bold mb-2">
          Today
        </Text>
        <Text className="text-text-secondary text-lg mb-12">
          What's the one thing?
        </Text>

        <TextInput
          value={goalText}
          onChangeText={setGoalText}
          placeholder="Make it clear. Make it yours."
          placeholderTextColor="#666666"
          maxLength={100}
          multiline
          autoFocus
          className="text-text-primary text-2xl mb-8 min-h-[80px]"
          style={{ fontFamily: "System" }}
        />

        <Pressable
          onPress={createOrUpdateGoal}
          className="bg-primary py-6 rounded-2xl items-center scale-press"
        >
          <Text className="text-background text-xl font-semibold">
            {todayGoal ? "Update" : "Set Goal"}
          </Text>
        </Pressable>

        {todayGoal && (
          <Pressable
            onPress={() => setIsEditing(false)}
            className="py-4 items-center mt-4"
          >
            <Text className="text-text-secondary">Cancel</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => router.push("/history")}
          className="absolute top-16 right-8"
        >
          <MaterialCommunityIcons
            name="calendar-outline"
            size={28}
            color="#666666"
          />
        </Pressable>
      </View>
    );
  }

  // Goal view (main screen)
  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-8 pt-16 pb-4 flex-row justify-between items-center">
        <View>
          <Text className="text-text-secondary text-sm">
            {streak.current > 0 ? `🔥 ${streak.current} day streak` : "Start your streak"}
          </Text>
          {streak.longest > 0 && streak.longest !== streak.current && (
            <Text className="text-text-muted text-xs mt-1">
              Best: {streak.longest} days
            </Text>
          )}
        </View>

        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => router.push("/history")}>
            <MaterialCommunityIcons
              name="calendar-outline"
              size={28}
              color="#666666"
            />
          </Pressable>

          <Pressable onPress={() => router.push("/settings")}>
            <MaterialCommunityIcons
              name="cog-outline"
              size={28}
              color="#666666"
            />
          </Pressable>
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-8 justify-center">
        <Text className="text-text-muted text-sm mb-4">TODAY</Text>

        <Pressable
          onPress={todayGoal?.completed ? undefined : completeGoal}
          onLongPress={editGoal}
          disabled={todayGoal?.completed}
          className="scale-press"
        >
          <View className="flex-row items-start">
            <View
              className={`w-8 h-8 rounded-full mr-4 items-center justify-center mt-1 ${todayGoal?.completed
                ? "bg-success"
                : "border-2 border-text-secondary"
                }`}
            >
              {todayGoal?.completed && (
                <MaterialCommunityIcons name="check" size={20} color="#000000" />
              )}
            </View>

            <View className="flex-1">
              <Text
                className={`text-3xl leading-tight ${todayGoal?.completed
                  ? "text-text-secondary line-through"
                  : "text-text-primary"
                  }`}
                style={{ fontFamily: "System" }}
              >
                {todayGoal?.title}
              </Text>

              {todayGoal?.completed && todayGoal.completedAt && (
                <Text className="text-text-muted text-sm mt-2">
                  Completed at{" "}
                  {new Date(todayGoal.completedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              )}
            </View>
          </View>
        </Pressable>

        {!todayGoal?.completed && (
          <Text className="text-text-muted text-sm mt-8 text-center">
            Tap to complete • Long press to edit
          </Text>
        )}
      </View>

      {/* Bottom hint */}
      {todayGoal?.completed && (
        <View className="px-8 pb-12">
          <Text className="text-text-muted text-center text-sm">
            🎉 Done for today. See you tomorrow!
          </Text>
        </View>
      )}
    </View>
  );
}
