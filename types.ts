
export interface UserProfile {
  name: string;
  xp: number;
  streak: number;
  lastActive: string | null;
  badges: string[];
  level: number;
  recoveryNeeded?: boolean;
  totalFocusMinutes: number;
}

export interface QuestRecord {
  id: string;
  taskName: string;
  timestamp: number;
  plannedDuration: number; // in minutes
  status: 'completed' | 'missed' | 'late';
  xpChange: number;
}

export interface SubTask {
  id: string;
  title: string;
  description: string;
  detailedExplanation?: string;
  completed: boolean;
  scheduledStart?: number;
  scheduledEnd?: number;
  duration: number;
  status: 'upcoming' | 'live' | 'completed' | 'expired' | 'pending' | 'active' | 'failed';
  timeLeft: number;
  timerStartedAt?: number | null;
}

export interface Goal {
  id: string;
  title: string;
  category: string;
  topic: string;
  notes: string;
  subTasks: SubTask[];
  createdAt: number;
  status: 'active' | 'completed';
  lastCheckpointIndex?: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  requirement: string;
}

export enum AppTab {
  QUEST = 'QUEST',
  MENTOR = 'MENTOR',
  STATS = 'STATS',
  PROFILE = 'PROFILE'
}

export enum AppState {
  ONBOARDING = 'ONBOARDING',
  TUTORIAL = 'TUTORIAL',
  MAIN = 'MAIN',
  GOAL_ENTRY = 'GOAL_ENTRY',
  GOAL_BREAKDOWN = 'GOAL_BREAKDOWN',
  VOICE_HUB = 'VOICE_HUB',
  LIVE_SYNC = 'LIVE_SYNC',
  SUMMARY = 'SUMMARY'
}

export interface TimetableSlot {
  id: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  taskName: string;
  isCompleted: boolean;
  xpDeducted?: boolean;
  reminderSent?: boolean;
}
