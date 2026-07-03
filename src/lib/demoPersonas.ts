import { Task, CalendarEvent, UserProfile, LearningProfile } from "../types";

export interface DemoPersonaData {
  user: {
    uid: string;
    displayName: string;
    email: string;
    photoURL: string;
  };
  userProfile: UserProfile;
  learningProfile: LearningProfile;
  tasks: Task[];
  events: CalendarEvent[];
  aiMessage: string;
}

export function getDemoPersonaData(persona: "student" | "professional" | "entrepreneur"): DemoPersonaData {
  const now = new Date();
  
  // Helper to get ISO dates relative to now
  const getRelativeISOString = (hoursOffset: number) => {
    const d = new Date(now);
    d.setHours(d.getHours() + hoursOffset);
    return d.toISOString();
  };

  switch (persona) {
    case "student":
      return {
        user: {
          uid: "demo-student-alex",
          displayName: "Alex Mercer",
          email: "alex.mercer@edu.com",
          photoURL: ""
        },
        userProfile: {
          userId: "demo-student-alex",
          streak: 4,
          lastActiveDate: now.toISOString().split("T")[0],
          focusMinutesTotal: 340,
          onboardingComplete: true,
          onboarding: {
            fullName: "Alex Mercer",
            occupation: "Computer Science Student",
            workingHoursStart: "08:00",
            workingHoursEnd: "14:00",
            focusWindow: "night",
            sleepBedtime: "02:00",
            sleepWakeTime: "09:00",
            timezone: "America/New_York",
            goals: ["procrastination", "deadline-shield"],
            notificationsEnabled: true
          },
          unlockedInsights: [
            { id: "insight-1", title: "CS Deep Coding Hack", hack: "Isolate network requests into modular helper.ts files before touching JSX components to prevent token-count compile warnings." }
          ],
          unlockedMilestones: [1, 2, 3]
        },
        learningProfile: {
          userId: "demo-student-alex",
          categories: {
            "Coding": { totalEstimatedMinutes: 120, totalActualMinutes: 145, count: 2 },
            "Design": { totalEstimatedMinutes: 60, totalActualMinutes: 50, count: 1 },
            "Research": { totalEstimatedMinutes: 180, totalActualMinutes: 220, count: 2 },
            "Documentation": { totalEstimatedMinutes: 40, totalActualMinutes: 30, count: 1 },
            "Testing": { totalEstimatedMinutes: 0, totalActualMinutes: 0, count: 0 },
            "Deployment": { totalEstimatedMinutes: 0, totalActualMinutes: 0, count: 0 },
            "Planning": { totalEstimatedMinutes: 30, totalActualMinutes: 25, count: 1 },
            "Other": { totalEstimatedMinutes: 0, totalActualMinutes: 0, count: 0 }
          }
        },
        tasks: [
          {
            id: "task-student-1",
            title: "Distributed DBMS Assignment",
            deadline: getRelativeISOString(14), // due tomorrow
            priority: "critical",
            riskLevel: "High",
            riskFactor: 78,
            createdAt: getRelativeISOString(-12),
            completed: false,
            energyLevel: "medium",
            burnoutRisk: 65,
            assessment: "Complex task with tight deadline. High risk of procrastination due to abstract database design requirements.",
            pacingSafetyRecommendation: "Shield Protection Enabled: Split implementation into 25-minute sprints with 5-minute Box Breathing breaks. Forced break triggered at 45 minutes.",
            urgencyCurve: [
              { timeLabel: "9 AM", urgency: 20 },
              { timeLabel: "2 PM", urgency: 45 },
              { timeLabel: "7 PM", urgency: 75 },
              { timeLabel: "11 PM", urgency: 95 }
            ],
            subtasks: [
              {
                id: "sub-st-1",
                title: "Draft 3NF Relational Schema",
                description: "Write table structures, identify dependencies, map keys.",
                durationMinutes: 45,
                suggestedTime: "11:00 PM",
                completed: false,
                category: "Planning"
              },
              {
                id: "sub-st-2",
                title: "Code Node.js DB Proxy Connectors",
                description: "Implement local pooled connections with robust handleDisconnect logic.",
                durationMinutes: 75,
                suggestedTime: "11:45 PM",
                completed: false,
                category: "Coding"
              },
              {
                id: "sub-st-3",
                title: "Run Integration Failure Tests",
                description: "Simulate container disconnection and verify state caching.",
                durationMinutes: 30,
                suggestedTime: "1:00 AM",
                completed: false,
                category: "Testing"
              }
            ],
            rescueTriggers: [
              {
                title: "Emergency Scope Compression",
                action: "Postpone secondary integration tests. Consolidate connectors into inline database arrays to secure main logic."
              },
              {
                title: "Partner Notification Signal",
                action: "Proactively alert study partner about focus block blockages."
              }
            ]
          },
          {
            id: "task-student-2",
            title: "UX Wireframe for Applet Shell",
            deadline: getRelativeISOString(36),
            priority: "medium",
            riskLevel: "Low",
            riskFactor: 15,
            createdAt: getRelativeISOString(-4),
            completed: true,
            energyLevel: "high",
            burnoutRisk: 20,
            subtasks: [
              {
                id: "sub-st-4",
                title: "Design Figma Interactive Flow",
                description: "Create interactive clickable wireframe of main dashboard views.",
                durationMinutes: 90,
                suggestedTime: "Completed",
                completed: true,
                category: "Design"
              }
            ]
          }
        ],
        events: [
          {
            id: "ev-student-1",
            title: "DBMS Submission Deadline",
            start: getRelativeISOString(14),
            end: getRelativeISOString(15),
            type: "deadline",
            taskId: "task-student-1"
          },
          {
            id: "ev-student-2",
            title: "CS Study Focus Block",
            start: getRelativeISOString(2),
            end: getRelativeISOString(4),
            type: "focus-block"
          }
        ],
        aiMessage: "Alex, your nocturnal CS shield is primed. Stressed by DBMS deadline? I've forced 25-minute intervals. Let's begin."
      };

    case "professional":
      return {
        user: {
          uid: "demo-prof-sarah",
          displayName: "Sarah Jenkins",
          email: "sarah.j@uxdesign.io",
          photoURL: ""
        },
        userProfile: {
          userId: "demo-prof-sarah",
          streak: 12,
          lastActiveDate: now.toISOString().split("T")[0],
          focusMinutesTotal: 1240,
          onboardingComplete: true,
          onboarding: {
            fullName: "Sarah Jenkins",
            occupation: "Senior Product Designer",
            workingHoursStart: "09:00",
            workingHoursEnd: "17:00",
            focusWindow: "morning",
            sleepBedtime: "22:30",
            sleepWakeTime: "06:30",
            timezone: "America/Los_Angeles",
            goals: ["burnout", "deep-work"],
            notificationsEnabled: true,
            emergencyContactName: "Eric (Manager)",
            emergencyContactPhone: "+1 (415) 888-2938"
          },
          unlockedInsights: [
            { id: "insight-p1", title: "Creative Focus Mastery", hack: "Schedule hard design phases for the first 3 hours of the day. Avoid emails before 10 AM." },
            { id: "insight-p2", title: "HRV Calibrator", hack: "Use the Box Breathing Cortisol Flush when stress exceeds 70% to drop adrenaline instantly." }
          ],
          unlockedMilestones: [1, 2, 3, 5, 10]
        },
        learningProfile: {
          userId: "demo-prof-sarah",
          categories: {
            "Coding": { totalEstimatedMinutes: 60, totalActualMinutes: 65, count: 1 },
            "Design": { totalEstimatedMinutes: 600, totalActualMinutes: 580, count: 12 },
            "Research": { totalEstimatedMinutes: 240, totalActualMinutes: 210, count: 4 },
            "Documentation": { totalEstimatedMinutes: 120, totalActualMinutes: 130, count: 3 },
            "Testing": { totalEstimatedMinutes: 0, totalActualMinutes: 0, count: 0 },
            "Deployment": { totalEstimatedMinutes: 0, totalActualMinutes: 0, count: 0 },
            "Planning": { totalEstimatedMinutes: 180, totalActualMinutes: 170, count: 6 },
            "Other": { totalEstimatedMinutes: 0, totalActualMinutes: 0, count: 0 }
          }
        },
        tasks: [
          {
            id: "task-prof-1",
            title: "Premium Design System Architecture",
            deadline: getRelativeISOString(26), // due in 1 day
            priority: "high",
            riskLevel: "Medium",
            riskFactor: 42,
            createdAt: getRelativeISOString(-24),
            completed: false,
            energyLevel: "high",
            burnoutRisk: 38,
            assessment: "Sarah's focus peaks in the morning. Task structure is set to highly focused 50-minute sprints. Alert levels are normal.",
            pacingSafetyRecommendation: "Zen Pacing Rule Active: 50 mins focus, 10 mins offline breathing. Alert levels green.",
            urgencyCurve: [
              { timeLabel: "8 AM", urgency: 30 },
              { timeLabel: "12 PM", urgency: 40 },
              { timeLabel: "4 PM", urgency: 55 },
              { timeLabel: "8 PM", urgency: 70 }
            ],
            subtasks: [
              {
                id: "sub-prof-1",
                title: "Refactor Component Palette Variables",
                description: "Map absolute Tailwind color structures to high-contrast variables for system themes.",
                durationMinutes: 50,
                suggestedTime: "9:30 AM",
                completed: false,
                category: "Design"
              },
              {
                id: "sub-prof-2",
                title: "Document Accessible Focus States",
                description: "Write strict interaction parameters for outline boundaries and screen reader labels.",
                durationMinutes: 30,
                suggestedTime: "10:30 AM",
                completed: false,
                category: "Documentation"
              }
            ],
            rescueTriggers: [
              {
                title: "Delegate Documentation",
                action: "Move the accessory documentation to secondary drafts and focus purely on variables."
              }
            ]
          }
        ],
        events: [
          {
            id: "ev-prof-1",
            title: "Design System Delivery",
            start: getRelativeISOString(26),
            end: getRelativeISOString(27),
            type: "deadline",
            taskId: "task-prof-1"
          },
          {
            id: "ev-prof-2",
            title: "Morning Peak Design Focus",
            start: getRelativeISOString(1),
            end: getRelativeISOString(3),
            type: "focus-block"
          }
        ],
        aiMessage: "Good morning Sarah. Your peak focus window is open. Component variable mapping is queued. Quiet focus activated."
      };

    case "entrepreneur":
      return {
        user: {
          uid: "demo-ent-marcus",
          displayName: "Marcus Chen",
          email: "marcus@antigravity.io",
          photoURL: ""
        },
        userProfile: {
          userId: "demo-ent-marcus",
          streak: 18,
          lastActiveDate: now.toISOString().split("T")[0],
          focusMinutesTotal: 4890,
          onboardingComplete: true,
          onboarding: {
            fullName: "Marcus Chen",
            occupation: "SaaS Tech Founder",
            workingHoursStart: "07:00",
            workingHoursEnd: "20:00",
            focusWindow: "afternoon",
            sleepBedtime: "00:00",
            sleepWakeTime: "06:00",
            timezone: "America/Denver",
            goals: ["procrastination", "burnout", "deep-work", "deadline-shield"],
            notificationsEnabled: true,
            emergencyContactName: "Valerie (Co-Founder)",
            emergencyContactPhone: "+1 (303) 555-0192"
          },
          unlockedInsights: [
            { id: "insight-e1", title: "Founder Speed Tactic", hack: "Perfect is the enemy of launch. Ship a modular feature that solves 90% of the friction, then let Firestore metrics decide improvements." },
            { id: "insight-e2", title: "Cognitive Battery Shielding", hack: "For 12-hour schedules, mandatory water hydration alerts and a 3-minute physical reset are required at Hour 4." }
          ],
          unlockedMilestones: [1, 2, 3, 5, 10, 15]
        },
        learningProfile: {
          userId: "demo-ent-marcus",
          categories: {
            "Coding": { totalEstimatedMinutes: 1800, totalActualMinutes: 1950, count: 24 },
            "Design": { totalEstimatedMinutes: 400, totalActualMinutes: 380, count: 8 },
            "Research": { totalEstimatedMinutes: 900, totalActualMinutes: 980, count: 10 },
            "Documentation": { totalEstimatedMinutes: 300, totalActualMinutes: 280, count: 5 },
            "Testing": { totalEstimatedMinutes: 200, totalActualMinutes: 210, count: 4 },
            "Deployment": { totalEstimatedMinutes: 400, totalActualMinutes: 430, count: 6 },
            "Planning": { totalEstimatedMinutes: 1200, totalActualMinutes: 1150, count: 18 },
            "Other": { totalEstimatedMinutes: 0, totalActualMinutes: 0, count: 0 }
          }
        },
        tasks: [
          {
            id: "task-ent-1",
            title: "Enterprise Deal Proposal & SLA Pitch",
            deadline: getRelativeISOString(8), // due in 8 hours!
            priority: "critical",
            riskLevel: "Critical",
            riskFactor: 94,
            createdAt: getRelativeISOString(-36),
            completed: false,
            energyLevel: "medium",
            burnoutRisk: 88,
            assessment: "Severe deadline congestion. Extremely high risk of burnout. The AI has activated extreme safety buffers.",
            pacingSafetyRecommendation: "EMERGENCY PACER DEPLOYED: Short 15-minute bursts. Forced rest interval enabled. Valerie has been flagged as emergency support contact.",
            urgencyCurve: [
              { timeLabel: "8 AM", urgency: 60 },
              { timeLabel: "10 AM", urgency: 75 },
              { timeLabel: "12 PM", urgency: 90 },
              { timeLabel: "2 PM", urgency: 100 }
            ],
            subtasks: [
              {
                id: "sub-ent-1",
                title: "Complete SLA Latency Indemnification Clause",
                description: "Formulate fallback response thresholds under multi-region cloud outages.",
                durationMinutes: 40,
                suggestedTime: "10:00 AM",
                completed: false,
                category: "Research"
              },
              {
                id: "sub-ent-2",
                title: "Configure Security Assertion Assertions (SAML)",
                description: "Run express connection test under tenant enterprise configurations.",
                durationMinutes: 60,
                suggestedTime: "11:00 AM",
                completed: false,
                category: "Coding"
              }
            ],
            rescueTriggers: [
              {
                title: "Valerie Intervention",
                action: "Delegate SAML configuration to Valerie immediately. Postpone minor SLAs."
              }
            ]
          }
        ],
        events: [
          {
            id: "ev-ent-1",
            title: "Enterprise SLA Pitch Delivery",
            start: getRelativeISOString(8),
            end: getRelativeISOString(9),
            type: "deadline",
            taskId: "task-ent-1"
          },
          {
            id: "ev-ent-2",
            title: "Emergency SLA Prep Sprint",
            start: getRelativeISOString(0.5),
            end: getRelativeISOString(2.5),
            type: "focus-block"
          }
        ],
        aiMessage: "Marcus, the shield is in high-stakes alarm. Valerie is designated as emergency delegate. Let's attack this 15-minute SLA block."
      };
  }
}
