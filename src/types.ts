/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Subtask {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  suggestedTime: string;
  completed: boolean;
  completedAt?: string;
  category?: "Coding" | "Design" | "Research" | "Documentation" | "Testing" | "Deployment" | "Planning" | "Other";
}

export interface UrgencyCurvePoint {
  timeLabel: string;
  urgency: number;
}

export interface RescueTrigger {
  title: string;
  action: string;
}

export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO String
  context?: string;
  priority: "low" | "medium" | "high" | "critical";
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  riskFactor: number; // 0 - 100%
  assessment?: string;
  urgencyCurve?: UrgencyCurvePoint[];
  subtasks: Subtask[];
  rescueTriggers?: RescueTrigger[];
  proactiveInterventions?: ProactiveIntervention[];
  createdAt: string;
  completed: boolean;
  energyLevel?: "low" | "medium" | "high";
  burnoutRisk?: number; // 0 - 100%
  pacingSafetyRecommendation?: string;
}

export interface FocusSession {
  id: string;
  taskId?: string;
  subtaskId?: string;
  durationMinutes: number;
  completedAt: string;
  moodBefore?: string;
  moodAfter?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string;   // ISO string
  type: "deadline" | "milestone" | "focus-block";
  taskId?: string;
  subtaskId?: string;
}

export interface UserPreferences {
  streak: number;
  lastActive: string;
  focusMinutesTotal: number;
  aiNudgeTone: "coach" | "drill-sergeant" | "zen-guide" | "hackathon-founder";
}

export interface ProactiveIntervention {
  id: string;
  type: "breakdown" | "reschedule" | "focus";
  title: string;
  description: string;
  actionLabel: string;
}

export interface UserOnboardingData {
  fullName: string;
  occupation: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  focusWindow: "morning" | "afternoon" | "evening" | "night";
  sleepBedtime: string;
  sleepWakeTime: string;
  timezone: string;
  goals: string[];
  notificationsEnabled: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface UserProfile {
  userId: string;
  streak: number;
  lastActiveDate: string;
  focusMinutesTotal: number;
  unlockedInsights: { id: string; title: string; hack: string }[];
  unlockedMilestones: number[];
  onboardingComplete?: boolean;
  onboarding?: UserOnboardingData;
}

export interface CategoryStat {
  totalEstimatedMinutes: number;
  totalActualMinutes: number;
  count: number;
}

export interface LearningProfile {
  userId: string;
  categories: {
    [category: string]: CategoryStat;
  };
}
