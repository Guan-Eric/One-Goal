// storage/index.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, User, Streak } from '../types/Goal';

const KEYS = {
  USER: '@onegoal:user',
  GOALS: '@onegoal:goals',
  STREAK: '@onegoal:streak',
};

// User management
export async function getUser(): Promise<User | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user:', error);
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
  const existingUser = await getUser();
  if (existingUser) return existingUser;

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

// Goal management
export async function getAllGoals(): Promise<Goal[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.GOALS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting goals:', error);
    return [];
  }
}

export async function getGoalForDate(date: string): Promise<Goal | null> {
  const goals = await getAllGoals();
  return goals.find(g => g.date === date) || null;
}

export async function saveGoal(goal: Goal): Promise<void> {
  try {
    const goals = await getAllGoals();
    const index = goals.findIndex(g => g.id === goal.id);
    
    if (index >= 0) {
      goals[index] = goal;
    } else {
      goals.push(goal);
    }
    
    await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(goals));
  } catch (error) {
    console.error('Error saving goal:', error);
  }
}

export async function deleteGoal(goalId: string): Promise<void> {
  try {
    const goals = await getAllGoals();
    const filtered = goals.filter(g => g.id !== goalId);
    await AsyncStorage.setItem(KEYS.GOALS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting goal:', error);
  }
}

// Streak management
export async function getStreak(): Promise<Streak> {
  try {
    const data = await AsyncStorage.getItem(KEYS.STREAK);
    return data ? JSON.parse(data) : { current: 0, longest: 0, lastUpdated: '' };
  } catch (error) {
    console.error('Error getting streak:', error);
    return { current: 0, longest: 0, lastUpdated: '' };
  }
}

export async function updateStreak(completedDate: string): Promise<Streak> {
  try {
    const streak = await getStreak();
    const goals = await getAllGoals();
    
    // Sort goals by date
    const sortedGoals = goals
      .filter(g => g.completed)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    if (sortedGoals.length === 0) {
      const newStreak = { current: 0, longest: 0, lastUpdated: completedDate };
      await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(newStreak));
      return newStreak;
    }
    
    // Calculate current streak
    let currentStreak = 0;
    let checkDate = new Date();
    
    for (let i = 0; i < sortedGoals.length; i++) {
      const goalDate = new Date(sortedGoals[i].date);
      const expectedDate = new Date(checkDate);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      // Check if this goal is for the expected date
      if (goalDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
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
  } catch (error) {
    console.error('Error updating streak:', error);
    return { current: 0, longest: 0, lastUpdated: completedDate };
  }
}

// Utility functions
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}
