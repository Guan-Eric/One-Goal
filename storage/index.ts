// storage/index.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, User, Streak } from '../types/Goal';

const KEYS = {
  USER: '@onegoal:user',
  GOALS: '@onegoal:goals',
  STREAK: '@onegoal:streak',
  THEME: '@onegoal:theme',
};

// ─── User ────────────────────────────────────────────────────────────────────

export async function getUser(): Promise<User | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function saveUser(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
}

export async function initializeUser(): Promise<User> {
  const existing = await getUser();
  if (existing) return existing;

  const newUser: User = {
    id: `user_${Date.now()}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    createdAt: Date.now(),
    hasCompletedOnboarding: false,
    isPremium: false,
  };
  await saveUser(newUser);
  return newUser;
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export async function getAllGoals(): Promise<Goal[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.GOALS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function getGoalForDate(date: string): Promise<Goal | null> {
  const goals = await getAllGoals();
  return goals.find((g) => g.date === date) ?? null;
}

export async function saveGoal(goal: Goal): Promise<void> {
  try {
    const goals = await getAllGoals();
    const index = goals.findIndex((g) => g.id === goal.id);
    if (index >= 0) goals[index] = goal;
    else goals.push(goal);
    await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
  } catch (error) {
    console.error('Error saving goal:', error);
  }
}

export async function deleteGoal(goalId: string): Promise<void> {
  try {
    const goals = await getAllGoals();
    await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals.filter((g) => g.id !== goalId)));
  } catch (error) {
    console.error('Error deleting goal:', error);
  }
}

export async function clearAllGoals(): Promise<void> {
  await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify([]));
}

// ─── Streak ──────────────────────────────────────────────────────────────────

export async function getStreak(): Promise<Streak> {
  try {
    const data = await AsyncStorage.getItem(KEYS.STREAK);
    return data ? JSON.parse(data) : { current: 0, longest: 0, lastUpdated: '' };
  } catch {
    return { current: 0, longest: 0, lastUpdated: '' };
  }
}

export async function updateStreak(completedDate: string): Promise<Streak> {
  try {
    const streak = await getStreak();
    const goals = await getAllGoals();

    const sortedGoals = goals
      .filter((g) => g.completed)
      .sort((a, b) => b.date.localeCompare(a.date));

    if (sortedGoals.length === 0) {
      const newStreak = { current: 0, longest: 0, lastUpdated: completedDate };
      await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(newStreak));
      return newStreak;
    }

    let currentStreak = 0;
    const today = new Date();

    for (let i = 0; i < sortedGoals.length; i++) {
      const goalDate = sortedGoals[i].date;
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (goalDate === expected.toISOString().split('T')[0]) {
        currentStreak++;
      } else {
        break;
      }
    }

    const newStreak: Streak = {
      current: currentStreak,
      longest: Math.max(currentStreak, streak.longest),
      lastUpdated: completedDate,
    };
    await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(newStreak));
    return newStreak;
  } catch {
    return { current: 0, longest: 0, lastUpdated: completedDate };
  }
}

export async function clearStreak(): Promise<void> {
  await AsyncStorage.setItem(
    KEYS.STREAK,
    JSON.stringify({ current: 0, longest: 0, lastUpdated: '' })
  );
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export async function getTheme(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEYS.THEME);
  } catch {
    return null;
  }
}

export async function saveTheme(themeId: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.THEME, themeId);
}

// ─── Utilities ───────────────────────────────────────────────────────────────

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}
