// app/home.tsx
import {
    View, Text, TextInput, Pressable, Alert,
    KeyboardAvoidingView, Platform, Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { Goal } from "../types/Goal";
import * as storage from "../storage";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePremium } from "../context/PremiumContext";

const UNDO_WINDOW_SECS = 10;

export default function Home() {
    const router = useRouter();
    const { isPremium, activeTheme: t } = usePremium();

    const [todayGoal, setTodayGoal] = useState<Goal | null>(null);
    const [goalText, setGoalText] = useState("");
    const [streak, setStreak] = useState({ current: 0, longest: 0, lastUpdated: "" });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showReflection, setShowReflection] = useState(false);
    const [reflectionText, setReflectionText] = useState("");
    const [pendingCompleted, setPendingCompleted] = useState<Goal | null>(null);

    // Undo
    const [showUndo, setShowUndo] = useState(false);
    const [undoCountdown, setUndoCountdown] = useState(UNDO_WINDOW_SECS);
    const undoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const preCompleteSnapshot = useRef<Goal | null>(null);
    const preCompleteStreak = useRef({ current: 0, longest: 0, lastUpdated: "" });

    useEffect(() => {
        loadTodayGoal();
        loadStreak();
        return () => stopTimer();
    }, []);

    function stopTimer() {
        if (undoTimer.current) { clearInterval(undoTimer.current); undoTimer.current = null; }
    }

    function startUndoCountdown(onExpire: () => void) {
        setShowUndo(true);
        setUndoCountdown(UNDO_WINDOW_SECS);
        stopTimer();
        undoTimer.current = setInterval(() => {
            setUndoCountdown((prev) => {
                if (prev <= 1) {
                    stopTimer();
                    setShowUndo(false);
                    onExpire();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    async function loadTodayGoal() {
        const today = storage.getTodayDate();
        const goal = await storage.getGoalForDate(today);
        setTodayGoal(goal);
        setGoalText(goal?.title || "");
        setIsEditing(!goal);
        setLoading(false);
    }

    async function loadStreak() {
        const s = await storage.getStreak();
        setStreak(s);
    }

    async function createOrUpdateGoal() {
        if (!goalText.trim()) {
            Alert.alert("Empty goal", "Please write what you want to accomplish today.");
            return;
        }
        const today = storage.getTodayDate();
        if (todayGoal) {
            const updated = { ...todayGoal, title: goalText.trim() };
            await storage.saveGoal(updated);
            setTodayGoal(updated);
            setIsEditing(false);
        } else {
            const newGoal: Goal = {
                id: `goal_${Date.now()}`,
                userId: "local",
                date: today,
                title: goalText.trim(),
                completed: false,
                createdAt: Date.now(),
            };
            await storage.saveGoal(newGoal);
            setTodayGoal(newGoal);
            setIsEditing(false);
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    async function completeGoal() {
        if (!todayGoal || todayGoal.completed) return;

        // Save snapshot for undo
        preCompleteSnapshot.current = { ...todayGoal };
        preCompleteStreak.current = { current: streak.current, longest: streak.longest, lastUpdated: streak.lastUpdated };

        const completed: Goal = { ...todayGoal, completed: true, completedAt: Date.now() };
        await storage.saveGoal(completed);
        const newStreak = await storage.updateStreak(todayGoal.date);
        setTodayGoal(completed);
        setPendingCompleted(completed);
        setStreak(newStreak);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        startUndoCountdown(() => {
            // Undo window expired — show celebration
            if (isPremium) {
                setReflectionText(completed.reflection || "");
                setShowReflection(true);
            } else {
                storage.getStreak().then((s) => {
                    Alert.alert(
                        "🎉 Goal Complete!",
                        s.current > 1 ? `${s.current} day streak!` : "Great job today!",
                        [{ text: "Done" }]
                    );
                });
            }
        });
    }

    async function undoComplete() {
        if (!preCompleteSnapshot.current) return;
        stopTimer();
        setShowUndo(false);

        // Restore the goal to incomplete
        const restored: Goal = {
            ...preCompleteSnapshot.current,
            completed: false,
            completedAt: undefined,
        };
        await storage.saveGoal(restored);
        setTodayGoal(restored);
        setPendingCompleted(null);

        // Restore streak to pre-completion state
        await storage.saveStreak(preCompleteStreak.current);
        setStreak(preCompleteStreak.current);

        preCompleteSnapshot.current = null;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    async function saveReflection() {
        if (!pendingCompleted) return;
        const withReflection: Goal = { ...pendingCompleted, reflection: reflectionText.trim() };
        await storage.saveGoal(withReflection);
        setTodayGoal(withReflection);
        setShowReflection(false);
        setPendingCompleted(null);
        const s = await storage.getStreak();
        Alert.alert(
            "🎉 Goal Complete!",
            s.current > 1 ? `${s.current} day streak!` : "Great job today!",
            [{ text: "Done" }]
        );
    }

    async function editGoal() {
        if (todayGoal?.completed) {
            Alert.alert("Goal Completed", "You can't edit a completed goal.", [{ text: "OK" }]);
            return;
        }
        setIsEditing(true);
    }

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: t.background, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: t.textPrimary, fontSize: 24 }}>One Goal</Text>
            </View>
        );
    }

    if (isEditing) {
        return (
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1, backgroundColor: t.background }}
                keyboardVerticalOffset={100}
            >
                <View style={{ flex: 1, paddingHorizontal: 32, justifyContent: "center" }}>
                    <Text style={{ color: t.textPrimary, fontSize: 36, fontWeight: "bold", marginBottom: 8 }}>
                        Today
                    </Text>
                    <Text style={{ color: t.textSecondary, fontSize: 18, marginBottom: 48 }}>
                        What's the one thing?
                    </Text>

                    <TextInput
                        value={goalText}
                        onChangeText={setGoalText}
                        placeholder="Make it clear. Make it yours."
                        placeholderTextColor={t.textMuted}
                        maxLength={100}
                        multiline
                        autoFocus
                        style={{ color: t.textPrimary, fontSize: 24, marginBottom: 32, minHeight: 80 }}
                    />

                    <Pressable
                        onPress={createOrUpdateGoal}
                        style={{ backgroundColor: t.primary, paddingVertical: 24, borderRadius: 16, alignItems: "center" }}
                    >
                        <Text style={{ color: t.background, fontSize: 20, fontWeight: "600" }}>
                            {todayGoal ? "Update" : "Set Goal"}
                        </Text>
                    </Pressable>

                    {todayGoal && (
                        <Pressable
                            onPress={() => setIsEditing(false)}
                            style={{ paddingVertical: 16, alignItems: "center", marginTop: 16 }}
                        >
                            <Text style={{ color: t.textSecondary }}>Cancel</Text>
                        </Pressable>
                    )}

                    <Pressable
                        onPress={() => router.push("/history")}
                        style={{ position: "absolute", top: 64, right: 32 }}
                    >
                        <MaterialCommunityIcons name="calendar-outline" size={28} color={t.textMuted} />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: t.background }}>
            {/* Header */}
            <View
                style={{
                    paddingHorizontal: 32,
                    paddingTop: 64,
                    paddingBottom: 16,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <View>
                    <Text style={{ color: t.textSecondary, fontSize: 14 }}>
                        {streak.current > 0 ? `${streak.current} day streak 🔥` : "Start your streak"}
                    </Text>
                    {streak.longest > 0 && streak.longest !== streak.current && (
                        <Text style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>
                            Best: {streak.longest} days
                        </Text>
                    )}
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                    {isPremium && (
                        <Pressable onPress={() => router.push("/stats")}>
                            <MaterialCommunityIcons name="chart-line" size={28} color={t.textMuted} />
                        </Pressable>
                    )}
                    <Pressable onPress={() => router.push("/history")}>
                        <MaterialCommunityIcons name="calendar-outline" size={28} color={t.textMuted} />
                    </Pressable>
                    <Pressable onPress={() => router.push("/settings")}>
                        <MaterialCommunityIcons name="cog-outline" size={28} color={t.textMuted} />
                    </Pressable>
                </View>
            </View>

            {/* Main Content */}
            <View style={{ flex: 1, paddingHorizontal: 32, justifyContent: "center" }}>
                <Text style={{ color: t.textMuted, fontSize: 12, marginBottom: 16 }}>TODAY</Text>

                <Pressable
                    onPress={todayGoal?.completed ? undefined : completeGoal}
                    onLongPress={editGoal}
                    disabled={todayGoal?.completed || showUndo}
                >
                    <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                        <View
                            style={{
                                width: 32, height: 32, borderRadius: 16,
                                marginRight: 16, marginTop: 4,
                                alignItems: "center", justifyContent: "center",
                                ...(todayGoal?.completed
                                    ? { backgroundColor: t.success }
                                    : { borderWidth: 2, borderColor: t.textSecondary }),
                            }}
                        >
                            {todayGoal?.completed && (
                                <MaterialCommunityIcons name="check" size={20} color={t.background} />
                            )}
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    fontSize: 30, lineHeight: 38,
                                    color: todayGoal?.completed ? t.textSecondary : t.textPrimary,
                                    textDecorationLine: todayGoal?.completed ? "line-through" : "none",
                                }}
                            >
                                {todayGoal?.title}
                            </Text>

                            {todayGoal?.completed && todayGoal.completedAt && !showUndo && (
                                <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 8 }}>
                                    Completed at{" "}
                                    {new Date(todayGoal.completedAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </Text>
                            )}

                            {isPremium && todayGoal?.reflection && !showUndo ? (
                                <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 8, fontStyle: "italic" }}>
                                    "{todayGoal.reflection}"
                                </Text>
                            ) : null}
                        </View>
                    </View>
                </Pressable>

                {!todayGoal?.completed && !showUndo && (
                    <Text style={{ color: t.textMuted, fontSize: 14, marginTop: 32, textAlign: "center" }}>
                        Tap to complete • Long press to edit
                    </Text>
                )}
            </View>

            {/* Undo Bar — floats at bottom */}
            {showUndo && (
                <View
                    style={{
                        position: "absolute",
                        bottom: 48,
                        left: 24,
                        right: 24,
                        backgroundColor: t.surfaceElevated,
                        borderRadius: 18,
                        borderWidth: 1,
                        borderColor: t.border,
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 18,
                        paddingVertical: 14,
                        gap: 10,
                    }}
                >
                    <MaterialCommunityIcons name="check-circle" size={22} color={t.success} />
                    <Text style={{ flex: 1, color: t.textPrimary, fontSize: 15, fontWeight: "600" }}>
                        Goal completed!
                    </Text>
                    <Pressable
                        onPress={undoComplete}
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: t.primary + "22",
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 10,
                            gap: 6,
                        }}
                    >
                        <MaterialCommunityIcons name="undo" size={16} color={t.primary} />
                        <Text style={{ color: t.primary, fontWeight: "700", fontSize: 14 }}>
                            Undo ({undoCountdown}s)
                        </Text>
                    </Pressable>
                </View>
            )}

            {/* Done message */}
            {todayGoal?.completed && !showUndo && (
                <View style={{ paddingHorizontal: 32, paddingBottom: 48 }}>
                    <Text style={{ color: t.textMuted, textAlign: "center", fontSize: 14 }}>
                        Done for today. See you tomorrow! 👏
                    </Text>
                </View>
            )}

            {/* Reflection Modal (Premium) */}
            <Modal visible={showReflection} transparent animationType="slide">
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
                    <View
                        style={{
                            backgroundColor: t.surfaceElevated,
                            borderTopLeftRadius: 24, borderTopRightRadius: 24,
                            padding: 32, paddingBottom: 48,
                        }}
                    >
                        <Text style={{ color: t.textPrimary, fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
                            Goal Complete!
                        </Text>
                        <Text style={{ color: t.textSecondary, fontSize: 16, marginBottom: 24 }}>
                            {streak.current > 1 ? `${streak.current} day streak! ` : ""}Add a reflection?
                        </Text>

                        <TextInput
                            value={reflectionText}
                            onChangeText={setReflectionText}
                            placeholder="What did you learn or feel?"
                            placeholderTextColor={t.textMuted}
                            maxLength={200}
                            multiline
                            autoFocus
                            style={{
                                color: t.textPrimary, fontSize: 18, minHeight: 80,
                                borderBottomWidth: 1, borderBottomColor: t.border,
                                paddingBottom: 12, marginBottom: 24,
                            }}
                        />

                        <Pressable
                            onPress={saveReflection}
                            style={{
                                backgroundColor: t.primary, paddingVertical: 18,
                                borderRadius: 14, alignItems: "center", marginBottom: 12,
                            }}
                        >
                            <Text style={{ color: t.background, fontSize: 18, fontWeight: "600" }}>
                                {reflectionText.trim() ? "Save Reflection" : "Done"}
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => { setShowReflection(false); setPendingCompleted(null); }}
                            style={{ paddingVertical: 12, alignItems: "center" }}
                        >
                            <Text style={{ color: t.textSecondary, fontSize: 16 }}>Skip</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}