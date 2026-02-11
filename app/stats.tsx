// app/stats.tsx
import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePremium } from "../context/PremiumContext";
import * as storage from "../storage";
import { Goal } from "../types/Goal";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function computeStats(goals: Goal[], streak: { current: number; longest: number }) {
    const completed = goals.filter((g) => g.completed);
    const total = goals.length;
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

    // Day of week breakdown
    const dowMap: Record<number, { c: number; t: number }> = {};
    for (let i = 0; i < 7; i++) dowMap[i] = { c: 0, t: 0 };
    goals.forEach((g) => {
        const d = new Date(g.date).getDay();
        dowMap[d].t++;
        if (g.completed) dowMap[d].c++;
    });
    const dayOfWeekBreakdown = DAYS.map((day, i) => ({ day, ...dowMap[i] }));
    const bestDow = [...dayOfWeekBreakdown].sort((a, b) =>
        b.t > 0 ? b.c / b.t - (a.t > 0 ? a.c / a.t : 0) : -1
    )[0];

    // Monthly breakdown (last 6 months)
    const monthMap: Record<string, { c: number; t: number }> = {};
    goals.forEach((g) => {
        const d = new Date(g.date);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        if (!monthMap[key]) monthMap[key] = { c: 0, t: 0 };
        monthMap[key].t++;
        if (g.completed) monthMap[key].c++;
    });
    const now = new Date();
    const monthlyBreakdown = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        return { month: MONTHS[d.getMonth()], ...(monthMap[key] ?? { c: 0, t: 0 }) };
    });

    // Average completion hour
    const hours = completed.filter((g) => g.completedAt).map((g) => new Date(g.completedAt!).getHours());
    const avgHour = hours.length > 0 ? Math.round(hours.reduce((a, b) => a + b, 0) / hours.length) : -1;
    const fmtHour = (h: number) => {
        if (h < 0) return "N/A";
        const period = h >= 12 ? "PM" : "AM";
        return `${h % 12 === 0 ? 12 : h % 12}:00 ${period}`;
    };

    // Last 30 days grid
    const last30: { date: string; completed: boolean; hasGoal: boolean }[] = [];
    const goalMap: Record<string, boolean> = {};
    goals.forEach((g) => { goalMap[g.date] = g.completed; });
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        last30.push({ date: key, completed: goalMap[key] ?? false, hasGoal: key in goalMap });
    }

    return {
        totalSet: total,
        totalCompleted: completed.length,
        completionRate,
        avgHour,
        fmtHour: fmtHour(avgHour),
        bestDay: bestDow?.day ?? "N/A",
        dayOfWeekBreakdown,
        monthlyBreakdown,
        last30,
        streak,
    };
}

export default function StatsScreen() {
    const router = useRouter();
    const { activeTheme: t, isPremium } = usePremium();
    const [stats, setStats] = useState<ReturnType<typeof computeStats> | null>(null);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        const goals = await storage.getAllGoals();
        const streak = await storage.getStreak();
        setStats(computeStats(goals, streak));
    }

    if (!isPremium) {
        return (
            <View style={{ flex: 1, backgroundColor: t.background, alignItems: "center", justifyContent: "center", padding: 32 }}>
                <MaterialCommunityIcons name="lock" size={48} color={t.textMuted} />
                <Text style={{ color: t.textPrimary, fontSize: 24, fontWeight: "bold", marginTop: 16, textAlign: "center" }}>
                    Premium Feature
                </Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
                    <Text style={{ color: t.primary, fontSize: 16 }}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const maxMonthlyTotal = Math.max(...(stats?.monthlyBreakdown.map((m) => m.t) ?? [1]), 1);
    const maxDowTotal = Math.max(...(stats?.dayOfWeekBreakdown.map((d) => d.t) ?? [1]), 1);

    return (
        <View style={{ flex: 1, backgroundColor: t.background }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 32, paddingTop: 64, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Pressable onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color={t.textPrimary} />
                </Pressable>
                <Text style={{ color: t.textPrimary, fontSize: 22, fontWeight: "bold" }}>Statistics</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 32 }} showsVerticalScrollIndicator={false}>
                {!stats ? (
                    <Text style={{ color: t.textMuted, textAlign: "center" }}>Loading...</Text>
                ) : (
                    <>
                        {/* Top KPIs */}
                        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
                            <StatCard label="Total Goals" value={`${stats.totalSet}`} t={t} flex />
                            <StatCard label="Completed" value={`${stats.totalCompleted}`} t={t} flex />
                            <StatCard label="Rate" value={`${stats.completionRate}%`} t={t} flex accent />
                        </View>

                        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
                            <StatCard label="Current Streak" value={`${stats.streak.current}🔥`} t={t} flex />
                            <StatCard label="Best Streak" value={`${stats.streak.longest}`} t={t} flex />
                            <StatCard label="Best Time" value={stats.fmtHour} t={t} flex />
                        </View>

                        {/* Last 30 days heatmap */}
                        <SectionHeader label="Last 30 Days" t={t} />
                        <View style={{
                            backgroundColor: t.surfaceElevated, borderRadius: 16, padding: 16,
                            marginBottom: 24, borderWidth: 1, borderColor: t.border,
                        }}>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
                                {stats.last30.map((d) => (
                                    <View
                                        key={d.date}
                                        style={{
                                            width: 28, height: 28, borderRadius: 6,
                                            backgroundColor: d.completed
                                                ? t.success
                                                : d.hasGoal
                                                    ? t.incomplete + "66"
                                                    : t.border,
                                        }}
                                    />
                                ))}
                            </View>
                            <View style={{ flexDirection: "row", gap: 16, marginTop: 12 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: t.success }} />
                                    <Text style={{ color: t.textMuted, fontSize: 12 }}>Completed</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: t.incomplete + "66" }} />
                                    <Text style={{ color: t.textMuted, fontSize: 12 }}>Missed</Text>
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                    <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: t.border }} />
                                    <Text style={{ color: t.textMuted, fontSize: 12 }}>No goal</Text>
                                </View>
                            </View>
                        </View>

                        {/* Monthly bar chart */}
                        <SectionHeader label="Monthly Goals" t={t} />
                        <View style={{
                            backgroundColor: t.surfaceElevated, borderRadius: 16, padding: 16,
                            marginBottom: 24, borderWidth: 1, borderColor: t.border,
                        }}>
                            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8, height: 100 }}>
                                {stats.monthlyBreakdown.map((m) => (
                                    <View key={m.month} style={{ flex: 1, alignItems: "center" }}>
                                        <View style={{ width: "100%", justifyContent: "flex-end", height: 72 }}>
                                            {/* Total bar */}
                                            <View style={{
                                                width: "100%", height: Math.max(4, (m.t / maxMonthlyTotal) * 72),
                                                backgroundColor: t.border, borderRadius: 4, overflow: "hidden",
                                                justifyContent: "flex-end",
                                            }}>
                                                {/* Completed overlay */}
                                                <View style={{
                                                    width: "100%",
                                                    height: m.t > 0 ? `${(m.c / m.t) * 100}%` : 0,
                                                    backgroundColor: t.primary, borderRadius: 4,
                                                }} />
                                            </View>
                                        </View>
                                        <Text style={{ color: t.textMuted, fontSize: 11, marginTop: 4 }}>{m.month}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Day of week breakdown */}
                        <SectionHeader label="Best Days" t={t} />
                        <View style={{
                            backgroundColor: t.surfaceElevated, borderRadius: 16, padding: 16,
                            marginBottom: 24, borderWidth: 1, borderColor: t.border,
                        }}>
                            {stats.dayOfWeekBreakdown.map((d) => {
                                const rate = d.t > 0 ? d.c / d.t : 0;
                                return (
                                    <View key={d.day} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                                        <Text style={{ color: t.textSecondary, width: 36, fontSize: 13 }}>{d.day}</Text>
                                        <View style={{ flex: 1, height: 10, backgroundColor: t.border, borderRadius: 5, overflow: "hidden" }}>
                                            <View style={{ width: `${rate * 100}%`, height: "100%", backgroundColor: t.primary, borderRadius: 5 }} />
                                        </View>
                                        <Text style={{ color: t.textMuted, width: 36, textAlign: "right", fontSize: 12 }}>
                                            {d.t > 0 ? `${Math.round(rate * 100)}%` : "--"}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        <View style={{ height: 40 }} />
                    </>
                )}
            </ScrollView>
        </View>
    );
}

function StatCard({ label, value, t, flex, accent }: {
    label: string; value: string; t: any; flex?: boolean; accent?: boolean;
}) {
    return (
        <View style={{
            backgroundColor: t.surfaceElevated, borderRadius: 14, padding: 14,
            borderWidth: 1, borderColor: accent ? t.primary : t.border,
            ...(flex ? { flex: 1 } : {}),
        }}>
            <Text style={{ color: t.textMuted, fontSize: 11, marginBottom: 4 }}>{label}</Text>
            <Text style={{ color: accent ? t.primary : t.textPrimary, fontSize: 20, fontWeight: "bold" }}>{value}</Text>
        </View>
    );
}

function SectionHeader({ label, t }: { label: string; t: any }) {
    return (
        <Text style={{ color: t.textSecondary, fontSize: 13, fontWeight: "600", marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>
            {label}
        </Text>
    );
}