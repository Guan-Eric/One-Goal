// types/Goal.ts
export type Goal = {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  title: string;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  reflection?: string; // Optional one-line reflection
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
