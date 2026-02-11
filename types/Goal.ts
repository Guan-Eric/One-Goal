// types/Goal.ts
export type Goal = {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  title: string;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  reflection?: string; // Premium: one-line reflection after completing
};

export type User = {
  id: string;
  timezone: string;
  createdAt: number;
  nickname?: string;
  hasCompletedOnboarding: boolean;
  isPremium: boolean;
  premiumExpiresAt?: number;
};

export type Streak = {
  current: number;
  longest: number;
  lastUpdated: string; // YYYY-MM-DD
};

export type Stats = {
  totalGoalsSet: number;
  totalGoalsCompleted: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  bestDayOfWeek: string;
  bestMonth: string;
  avgCompletionHour: number; // 0-23
  last30Days: { date: string; completed: boolean }[];
  monthlyBreakdown: { month: string; completed: number; total: number }[];
  dayOfWeekBreakdown: { day: string; completed: number; total: number }[];
};
