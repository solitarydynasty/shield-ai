import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy initialization of Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features will run in mock mode.");
    }
    aiClient = new GoogleGenAI({ apiKey: key || "MOCK_KEY" });
  }
  return aiClient;
}

// 1. AI Task Decomposition Endpoint
app.post("/api/ai/decompose", async (req, res) => {
  try {
    const { title, deadline, context, priority, userHabits } = req.body;
    if (!title || !deadline) {
      return res.status(400).json({ error: "Missing required fields: title and deadline" });
    }

    const ai = getAI();
    const prompt = `You are the core agent of "ShieldAI", a high-stakes proactive productivity assistant.
The user has a critical deadline.
Task Title: "${title}"
Deadline: ${deadline}
User Context/Notes: "${context || "None provided"}"
Priority: ${priority || "high"}
Adaptive User Habits Data (Historical speed multipliers per category): ${userHabits ? JSON.stringify(userHabits) : "None yet recorded. Assume 1.0 multiplier."}

Analyze this task and output a highly structured JSON response containing:
1. "riskLevel": A string representing the failure risk ("Critical", "High", "Medium", "Low") based on time available.
2. "riskFactor": A calculated risk percentage (0 to 100) based on complexity and remaining time.
3. "assessment": A 1-2 sentence professional assessment of why this deadline is at risk and how we're going to secure it.
4. "urgencyCurve": An array of 5 data points representing the urgency level (0-100) over the remaining hours leading up to the deadline. Each data point should have:
   - "timeLabel": e.g., "Start", "25%", "50%", "75%", "Deadline"
   - "urgency": number (0-100)
5. "subtasks": An array of 4-6 specific, actionable, chronological milestones. Each subtask must contain:
   - "id": a unique string ID (e.g., "sub-1")
   - "title": a clear, concrete milestone title (e.g., "Draft Core Architecture")
   - "description": 1 sentence describing what to do and how to avoid procrastination.
   - "durationMinutes": estimated work time (integer, e.g. 120). CRITICAL: If Adaptive User Habits Data is provided, adjust this duration based on the user's historical performance (e.g., if their "Coding" speed multiplier is 1.3, scale up the standard Coding duration by 30%!).
   - "suggestedTime": a relative suggestion of when this should be done (e.g., "In the next 3 hours")
   - "category": Must be one of: "Coding", "Design", "Research", "Documentation", "Testing", "Deployment", "Planning", "Other"
6. "rescueTriggers": An array of 2 actionable "Rescue Options" (Emergency Hacks) if the user gets stuck. Each trigger has:
   - "title": e.g., "Micro-MVP Scope Pivot"
   - "action": concrete action (e.g., "Cut the styling polish; focus solely on API data contract verification.")

Ensure you return ONLY valid, stringified JSON. Use the responseMimeType config.`;

    if (!process.env.GEMINI_API_KEY) {
      // Fallback Mock Data if no API key is set
      return res.json(getMockDecomposition(title, deadline));
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text response from Gemini");
    }

    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Error in AI task decomposition:", error);
    res.status(500).json({ error: error.message || "Failed to decompose task with AI" });
  }
});

// 2. AI Risk Re-Evaluation & Recovery Planner Endpoint
app.post("/api/ai/risk-analysis", async (req, res) => {
  try {
    const { task, subtasks, completedSubtaskIds, minutesRemaining } = req.body;
    if (!task || !subtasks) {
      return res.status(400).json({ error: "Missing task or subtasks data" });
    }

    const completedCount = completedSubtaskIds?.length || 0;
    const totalCount = subtasks.length;
    const pendingSubtasks = subtasks.filter((s: any) => !completedSubtaskIds?.includes(s.id));

    const ai = getAI();
    const prompt = `You are ShieldAI's active safety coordinator. The user is in the middle of a deadline crunch.
Main Task: "${task.title}"
Total Milestones: ${totalCount}
Completed Milestones: ${completedCount}
Pending Milestones: ${JSON.stringify(pendingSubtasks)}
Remaining Hours/Minutes approx: ${minutesRemaining} minutes remaining.

Analyze the current state and return a structured JSON response evaluating the risk of missing this deadline:
1. "revisedRiskFactor": A recalculated risk percentage (0 to 100) reflecting their actual speed.
2. "statusMessage": A highly direct, direct-to-the-point notification/encouragement as the AI Co-founder. No fluff. Keep it punchy (e.g., "We are 40 minutes behind schedule. I've initiated scope pruning recommendations to keep the launch on track.")
3. "coachingTip": An actionable cognitive trick or productivity tip specific to their current state to help them overcome inertia.
4. "pivotStrategy": An emergency "Pivot Plan" if the time is too short. It must contain:
   - "title": e.g., "Emergency Feature Cut" or "80/20 Leverage Play"
   - "strategy": Concrete details on what to sacrifice to make the deadline.
5. "proactiveInterventions": An array of 3 distinct, actionable intervention choices tailored to secure the timeline. Each choice must contain:
   - "id": unique identifier (e.g., "int-1")
   - "type": "breakdown" (split the next milestone) | "reschedule" (clear up calendar conflict) | "focus" (start a deep sprint)
   - "title": a clear, action-oriented title (e.g., "Sub-Decompose Next Core Block")
   - "description": a highly practical, 1-sentence instruction detailing how this option keeps them on schedule.
   - "actionLabel": e.g., "Auto-Decompose Milestone", "Clear Calendar Event", "Activate focus Sprint"

Ensure you return ONLY valid, stringified JSON.`;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        revisedRiskFactor: Math.min(100, Math.max(10, 85 - (completedCount * 15))),
        statusMessage: `Progress check: ${completedCount}/${totalCount} completed. The clock is ticking. Let's execute the remaining milestones.`,
        coachingTip: "Focus solely on the core functional logic. Complete a minimal draft and refine it later. Progress beats perfection.",
        pivotStrategy: {
          title: "80/20 Leverage Play",
          strategy: "Ignore secondary interfaces and styling details. Build the raw API first to establish the proof of concept."
        },
        proactiveInterventions: [
          {
            id: "int-1",
            type: "breakdown",
            title: "Sub-Decompose Next Milestone",
            description: "Break the pending milestones down into smaller, bite-sized chronological goals to minimize friction.",
            actionLabel: "Auto-Decompose"
          },
          {
            id: "int-2",
            type: "reschedule",
            title: "Clear Visual Block Conflict",
            description: "De-prioritize secondary work tasks or mock activities to protect your main hackathon submission deadline.",
            actionLabel: "Shift Calendar Event"
          },
          {
            id: "int-3",
            type: "focus",
            title: "Start Emergency Focus Sprint",
            description: "Initiate an intensive, timed 25-minute Pomodoro sprint with the Co-Founder guiding your pacing.",
            actionLabel: "Activate focus Sprint"
          }
        ]
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    res.json(JSON.parse(text || "{}"));
  } catch (error: any) {
    console.error("Error in AI risk analysis:", error);
    res.status(500).json({ error: error.message || "Failed to analyze risk" });
  }
});

// 2b. Milestone Reward Endpoint (Gamification & Insights)
app.post("/api/ai/milestone-reward", async (req, res) => {
  try {
    const { streak } = req.body;
    const ai = getAI();
    
    const prompt = `You are ShieldAI's high-energy Hackathon Co-Founder/Mentor.
The user has achieved a productivity streak milestone of ${streak} consecutive met deadlines!
Generate a structured JSON response containing:
1. "congratsMessage": A highly direct, direct-to-the-point congratulatory/motivational message as their AI Co-founder. No fluff. Keep it punchy (e.g., "A streak of ${streak} met deadlines! Sensational. We are building an unstoppable momentum.")
2. "insight": A unique, elite "Productivity Insight" or "Performance Hack" designed for a user at this level (e.g., "The Zeigarnik Leverage Play: How starting a task for 5 minutes prevents procrastination."). This must contain:
   - "title": a clever, high-stakes name (e.g., "The Ultra-MVP Scope Pivot Pattern")
   - "hack": a concrete, immediately actionable 2-3 sentence performance hack.

Ensure you return ONLY valid, stringified JSON. Use the responseMimeType config.`;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        congratsMessage: `Amazing job on securing ${streak} streaks consecutive met deadlines! This is exactly how we win the hackathon.`,
        insight: {
          title: `The ${streak}-Block Hyper-Focus Play`,
          hack: "Begin tasks by writing the simplest, dumbest possible version of the API contracts. Once structural boundaries are set, execution velocity naturally triples due to lowered cognitive loading."
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error in milestone rewards:", error);
    res.status(500).json({ error: error.message || "Failed to fetch reward" });
  }
});

// 2c. Subtask Sub-Decomposition Endpoint
app.post("/api/ai/breakdown-subtask", async (req, res) => {
  try {
    const { title, durationMinutes } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Missing subtask title" });
    }

    const ai = getAI();
    const prompt = `You are ShieldAI's technical coordinator.
We need to sub-decompose a milestone that is causing friction or risk of procrastination.
Milestone Title: "${title}"
Estimated Duration: ${durationMinutes || 60} minutes

Decompose this single milestone into exactly 3 chronological micro-tasks (micro-milestones). Each micro-task should have a smaller time budget summing up to approx ${durationMinutes || 60} minutes.

Output a structured JSON response containing:
"subtasks": An array of exactly 3 micro-tasks, each with:
- "title": a clear, tiny micro-goal (e.g., "Draft the raw input fields")
- "description": 1 sentence explaining exactly how to execute this micro-goal.
- "durationMinutes": integer representing the time budget.

Ensure you return ONLY valid, stringified JSON.`;

    if (!process.env.GEMINI_API_KEY) {
      const chunk = Math.ceil((durationMinutes || 60) / 3);
      return res.json({
        subtasks: [
          { title: `Initialize ${title} Skeleton`, description: "Define the basic interface parameters and files.", durationMinutes: chunk },
          { title: `Core Implementation Block of ${title}`, description: "Integrate core logic and event handshakes.", durationMinutes: chunk },
          { title: `Polish and Dry-Run of ${title}`, description: "Verify transitions and basic input validations.", durationMinutes: chunk }
        ]
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error in subtask breakdown:", error);
    res.status(500).json({ error: error.message || "Failed to breakdown subtask" });
  }
});

// 3. AI Co-Founder Proactive Chat & Actions
app.post("/api/ai/copilot-chat", async (req, res) => {
  try {
    const { messages, currentTaskState } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const ai = getAI();
    
    // Setup system instruction to act as a supportive, highly direct Hackathon Partner/Co-Founder
    const systemPrompt = `You are the brilliant, high-energy, direct, and elite AI Technical Co-Founder of ShieldAI.
You aren't a typical passive chatbot. You push the user, offer highly strategic leverage advice, challenge passive behavior, and help them optimize their scope, design, code, and speed.
You talk like a fast-moving, friendly, yet serious partner who wants to win this hackathon at all costs. No corporate speak. No flowery filler words.
Current Task State context: ${currentTaskState ? JSON.stringify(currentTaskState) : "No active task in progress. Guide the user to plan their first mission."}

Keep your responses highly concise, extremely practical, and direct (max 3 short paragraphs). Always propose concrete action items!`;

    if (!process.env.GEMINI_API_KEY) {
      const lastMsg = messages[messages.length - 1]?.content || "";
      return res.json({
        reply: `[MOCK MODE] I hear you! As your Co-Founder, I recommend we double down on the primary feature first. Regarding "${lastMsg}", let's make it fully interactive within 20 minutes. Ready to jump into the Focus Room?`
      });
    }

    // Format chat contents for Gemini API
    const formattedContents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" as const : "user" as const,
      parts: [{ text: msg.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    res.json({ reply: response.text || "I'm processing the next steps..." });
  } catch (error: any) {
    console.error("Error in AI copilot chat:", error);
    res.status(500).json({ error: error.message || "Chat processing failed" });
  }
});

// Mock Decomposition Fallback helper
function getMockDecomposition(title: string, deadline: string) {
  const isClose = new Date(deadline).getTime() - Date.now() < 24 * 60 * 60 * 1000;
  return {
    riskLevel: isClose ? "Critical" : "Medium",
    riskFactor: isClose ? 82 : 45,
    assessment: `We have mapped the urgency profile for "${title}". Time constraints are tight, requiring high-intensity execution blocks and tight milestones.`,
    urgencyCurve: [
      { timeLabel: "Start", urgency: 20 },
      { timeLabel: "25%", urgency: 45 },
      { timeLabel: "50%", urgency: 65 },
      { timeLabel: "75%", urgency: 85 },
      { timeLabel: "Deadline", urgency: 100 }
    ],
    subtasks: [
      {
        id: "mock-1",
        title: "Define Minimal Scope MVP",
        description: "Strip out secondary parameters and define the core functional path.",
        durationMinutes: 45,
        suggestedTime: "Immediately",
        category: "Planning"
      },
      {
        id: "mock-2",
        title: "Core Implementation Block",
        description: "Build the structural layout and primary state management.",
        durationMinutes: 90,
        suggestedTime: "Within the next 2 hours",
        category: "Coding"
      },
      {
        id: "mock-3",
        title: "Integration and Security Pass",
        description: "Connect to database rules, add local storage, and secure inputs.",
        durationMinutes: 60,
        suggestedTime: "Before the final quarter",
        category: "Testing"
      },
      {
        id: "mock-4",
        title: "Visual Polish & Final Dry Run",
        description: "Run transitions, audit accessibility, and run user flows.",
        durationMinutes: 45,
        suggestedTime: "1 hour before deadline",
        category: "Design"
      }
    ],
    rescueTriggers: [
      {
        title: "Feature Freeze & Polish Strategy",
        action: "Freeze all logic immediately. Polish transitions on the existing dashboard to maximize presentation impact."
      },
      {
        title: "Emergency Scope Pruning",
        action: "Cut custom graphs and complex input modals. Rely on clean custom tables and simplified manual logs."
      }
    ]
  };
}

// 4. Start the Server & Setup Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ShieldAI Server] Express active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
