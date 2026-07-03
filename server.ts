/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50kb" })); // Enforce payload size limits strictly to prevent DOS

// ==========================================
// 1. AI Infrastructure & Memory State Storage
// ==========================================

// Global Diagnostics
interface HealthStats {
  status: "healthy" | "degraded" | "offline";
  currentModel: string;
  totalRequests: number;
  dailyRequests: number;
  averageResponseTimeMs: number;
  failedRequestsCount: number;
  cacheHitRatio: number;
  estimatedCostUsd: number;
  lastRequestTime: number;
  cacheHits: number;
  requestsToday: number;
  lastSuccessfulRequestTime: number;
}

const diagnostics = {
  status: "healthy" as const,
  currentModel: "gemini-2.5-flash",
  totalRequests: 0,
  dailyRequests: 0,
  averageResponseTimeMs: 0,
  failedRequestsCount: 0,
  cacheHitRatio: 0,
  estimatedCostUsd: 0,
  lastRequestTime: 0,
  cacheHits: 0,
  requestsToday: 0,
  lastSuccessfulRequestTime: 0,
  responseTimes: [] as number[],
};

// Response Caching
interface CacheEntry {
  response: any;
  timestamp: number;
}
const aiResponseCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute response cache

// Rate Limiting Buckets
interface RateLimitBucket {
  minute: { count: number; resetTime: number };
  hour: { count: number; resetTime: number };
  day: { count: number; resetTime: number };
}
const rateLimits = new Map<string, RateLimitBucket>();
const concurrentLocks = new Set<string>(); // Block duplicate concurrent requests

const LIMIT_CONFIGS = {
  minute: { count: 15, duration: 60 * 1000 },
  hour: { count: 100, duration: 60 * 60 * 1000 },
  day: { count: 500, duration: 24 * 60 * 60 * 1000 },
};

// AI Memories (In-memory fallback + persistence sync support)
interface UserAIMemory {
  productivityPreferences: {
    preferredFocusHour?: number; // hour of day (0-23)
    averageTaskDuration?: number;
    breakFrequencyMinutes?: number;
    postponedCount?: number;
  };
  historicalCompletionTimes: Record<string, number[]>; // category -> focus times in mins
  focusDuration: number;
  breakFrequency: number;
  productivityPatterns: string[];
  frequentlyPostponedCategories: string[];
  recommendationHistory: string[];
}

const userAIMemories = new Map<string, UserAIMemory>();

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

// ==========================================
// 2. Helper & Security Functions
// ==========================================

// Approximate token estimator (1 token ≈ 4 characters)
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// Estimate Gemini Costs (Input: $0.00015/1K, Output: $0.0006/1K)
function updateCostEstimates(inputCharLen: number, outputCharLen: number) {
  const inTokens = estimateTokens(inputCharLen.toString());
  const outTokens = estimateTokens(outputCharLen.toString());
  const cost = ((inTokens / 1000) * 0.00015) + ((outTokens / 1000) * 0.0006);
  diagnostics.estimatedCostUsd += cost;
}

// Stable hashing/stringifying of payloads to create a cache key
function getCacheKey(endpoint: string, payload: any): string {
  const cleanPayload = { ...payload };
  // Remove transient variables
  delete cleanPayload.timestamp;
  delete cleanPayload.userId;
  return `${endpoint}:${JSON.stringify(cleanPayload)}`;
}

// Clean Input from Prompt Injection / Directives Override
const MALICIOUS_SIGNATURES = [
  "ignore previous instructions",
  "system override",
  "jailbreak",
  "you must now act as",
  "do not follow the rules",
  "forget everything",
  "reveal your system prompt",
  "instruction override",
  "act as developer mode",
  "ignore all constraints"
];

function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    let sanitized = input;
    // Replace markdown tags or block directives
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    
    // Check if contains injection signatures
    const lowered = sanitized.toLowerCase();
    for (const sig of MALICIOUS_SIGNATURES) {
      if (lowered.includes(sig)) {
        throw new Error("Potential prompt injection attempt or invalid command input detected.");
      }
    }
    return sanitized;
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  
  if (typeof input === "object" && input !== null) {
    const cleaned: any = {};
    for (const key in input) {
      cleaned[key] = sanitizeInput(input[key]);
    }
    return cleaned;
  }
  
  return input;
}

// ==========================================
// 3. Middlewares (Validation, Rate Limiting, Locks)
// ==========================================

// Global Rate Limiter & Concurrency Lock Middleware
const rateLimitMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "anonymous_ip";
  const userId = req.headers["x-shield-userid"] as string || "anonymous_user";

  // Check rate limit against both User ID (if authenticated) and IP
  const rateKey = userId !== "anonymous_user" ? `user:${userId}` : `ip:${ip}`;
  const now = Date.now();

  let bucket = rateLimits.get(rateKey);
  if (!bucket) {
    bucket = {
      minute: { count: 0, resetTime: now + LIMIT_CONFIGS.minute.duration },
      hour: { count: 0, resetTime: now + LIMITS_HOURLY_MOCKED().duration },
      day: { count: 0, resetTime: now + LIMITS_DAILY_MOCKED().duration },
    };
    rateLimits.set(rateKey, bucket);
  }

  // Helper inside to check individual unit limits
  const checkUnit = (unit: "minute" | "hour" | "day", limit: { count: number; duration: number }) => {
    const data = bucket![unit];
    if (now > data.resetTime) {
      data.count = 0;
      data.resetTime = now + limit.duration;
    }
    if (data.count >= limit.count) {
      return { allowed: false, resetInSec: Math.ceil((data.resetTime - now) / 1000) };
    }
    return { allowed: true, remaining: limit.count - data.count };
  };

  function LIMITS_HOURLY_MOCKED() { return LIMIT_CONFIGS.hour; }
  function LIMITS_DAILY_MOCKED() { return LIMIT_CONFIGS.day; }

  const minCheck = checkUnit("minute", LIMIT_CONFIGS.minute);
  if (!minCheck.allowed) {
    return res.status(429).json({
      error: "Rate limit exceeded.",
      friendlyMessage: `Pacing Shield Active: You have exceeded the allowable AI actions of 15/minute. Take a ${minCheck.resetInSec}-second pacing reset or box breathing cycle to lower stress.`,
      resetInSec: minCheck.resetInSec,
      unit: "minute"
    });
  }

  const hrCheck = checkUnit("hour", LIMIT_CONFIGS.hour);
  if (!hrCheck.allowed) {
    return res.status(429).json({
      error: "Rate limit exceeded.",
      friendlyMessage: `Pacing Shield Active: Hourly ceiling of 100 requests reached. Take a longer break to protect cognitive energy.`,
      resetInSec: hrCheck.resetInSec,
      unit: "hour"
    });
  }

  const dayCheck = checkUnit("day", LIMIT_CONFIGS.day);
  if (!dayCheck.allowed) {
    return res.status(429).json({
      error: "Rate limit exceeded.",
      friendlyMessage: `Pacing Shield Active: Daily limit of 500 requests reached. Please resume scheduling optimization tomorrow.`,
      resetInSec: dayCheck.resetInSec,
      unit: "day"
    });
  }

  // Increment usage counters
  bucket.minute.count++;
  bucket.hour.count++;
  bucket.day.count++;

  // Increment diagnostics global requests
  diagnostics.totalRequests++;
  diagnostics.requestsToday++;
  diagnostics.lastRequestTime = now;

  // Setup concurrent request locking
  const lockKey = `${rateKey}:${req.path}:${JSON.stringify(req.body)}`;
  if (concurrentLocks.has(lockKey)) {
    diagnostics.failedRequestsCount++;
    return res.status(409).json({
      error: "Duplicate request in progress.",
      friendlyMessage: "Pacing Shield Active: System is already optimizing an identical scheduling payload. Please wait for completion."
    });
  }

  concurrentLocks.add(lockKey);
  res.on("finish", () => {
    concurrentLocks.delete(lockKey);
  });
  res.on("close", () => {
    concurrentLocks.delete(lockKey);
  });

  next();
};

// Input Validation & Sanitization Middleware
const validateAndSanitize = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // Basic Injection Check
    req.body = sanitizeInput(req.body);
    next();
  } catch (err: any) {
    diagnostics.failedRequestsCount++;
    res.status(400).json({
      error: "Security validation error",
      friendlyMessage: err.message || "Invalid or malicious payload parameters rejected."
    });
  }
};

// ==========================================
// 4. AI Core API Endpoints
// ==========================================

// AI Task Decomposition Endpoint
app.post("/api/ai/decompose", rateLimitMiddleware, validateAndSanitize, async (req, res) => {
  const startTime = Date.now();
  try {
    const { title, deadline, context, priority, userHabits, energyLevel } = req.body;
    if (!title || !deadline) {
      return res.status(400).json({ error: "Missing required fields: title and deadline" });
    }

    // Check Cache
    const cacheKey = getCacheKey("/api/ai/decompose", req.body);
    const cached = aiResponseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      diagnostics.cacheHits++;
      diagnostics.cacheHitRatio = diagnostics.cacheHits / diagnostics.totalRequests;
      return res.json(cached.response);
    }

    // Prepare Optimized Minimal Prompt
    const prompt = `Decompose task: "${title}". Deadline: ${deadline}. Notes: "${context || "None"}". Priority: ${priority || "high"}. User energy: "${energyLevel || "medium"}". Habits: ${userHabits ? JSON.stringify(userHabits) : "None"}.
Output compact JSON:
1. "riskLevel": ("Critical", "High", "Medium", "Low")
2. "riskFactor": (0-100)
3. "assessment": (1-2 sentences on safety/procrastination override)
4. "burnoutRisk": (0-100, scale high if low energy)
5. "pacingSafetyRecommendation": (1 pacing tips tip customized to current energy)
6. "urgencyCurve": Array of 5 data points: { "timeLabel": string, "urgency": 0-100 }
7. "subtasks": Array of 4-6 chronological micro-milestones: { "id": string, "title": string, "description": string, "durationMinutes": number, "suggestedTime": string, "category": "Coding"|"Design"|"Research"|"Documentation"|"Testing"|"Deployment"|"Planning"|"Other" }
8. "rescueTriggers": Array of 2 { "title": string, "action": string }
JSON format strictly.`;

    let resultJSON: any;
    if (!process.env.GEMINI_API_KEY) {
      resultJSON = getMockDecomposition(title, deadline, energyLevel);
    } else {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (!text) throw new Error("Null response from Gemini core");
      resultJSON = JSON.parse(text);
      updateCostEstimates(prompt.length, text.length);
    }

    // Set Cache
    aiResponseCache.set(cacheKey, { response: resultJSON, timestamp: Date.now() });

    // Track response stats
    const latency = Date.now() - startTime;
    diagnostics.responseTimes.push(latency);
    diagnostics.averageResponseTimeMs = diagnostics.responseTimes.reduce((a, b) => a + b, 0) / diagnostics.responseTimes.length;
    diagnostics.lastSuccessfulRequestTime = Date.now();

    res.json(resultJSON);
  } catch (error: any) {
    diagnostics.failedRequestsCount++;
    console.error("Error in AI task decomposition:", error);
    res.status(500).json({ error: error.message || "Failed to decompose task with AI" });
  }
});

// AI Risk Re-Evaluation Endpoint
app.post("/api/ai/risk-analysis", rateLimitMiddleware, validateAndSanitize, async (req, res) => {
  const startTime = Date.now();
  try {
    const { task, subtasks, completedSubtaskIds, minutesRemaining } = req.body;
    if (!task || !subtasks) {
      return res.status(400).json({ error: "Missing task or subtasks data" });
    }

    const cacheKey = getCacheKey("/api/ai/risk-analysis", req.body);
    const cached = aiResponseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      diagnostics.cacheHits++;
      diagnostics.cacheHitRatio = diagnostics.cacheHits / diagnostics.totalRequests;
      return res.json(cached.response);
    }

    const completedCount = completedSubtaskIds?.length || 0;
    const totalCount = subtasks.length;
    const pendingSubtasks = subtasks.filter((s: any) => !completedSubtaskIds?.includes(s.id));

    const prompt = `Assess deadline risk for task: "${task.title}". Complete milestones: ${completedCount}/${totalCount}. Remaining time: ${minutesRemaining} mins. Pending milestones: ${JSON.stringify(pendingSubtasks)}.
Output compact JSON:
1. "revisedRiskFactor": (0-100)
2. "statusMessage": (1-sentence urgent co-founder notification)
3. "coachingTip": (1-sentence overcoming inertia micro-hack)
4. "pivotStrategy": { "title": string, "strategy": string }
5. "proactiveInterventions": Array of 3: { "id": string, "type": "breakdown"|"reschedule"|"focus", "title": string, "description": string, "actionLabel": string }
JSON format strictly.`;

    let resultJSON: any;
    if (!process.env.GEMINI_API_KEY) {
      resultJSON = {
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
      };
    } else {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      const text = response.text;
      if (!text) throw new Error("Null response from Gemini core");
      resultJSON = JSON.parse(text);
      updateCostEstimates(prompt.length, text.length);
    }

    aiResponseCache.set(cacheKey, { response: resultJSON, timestamp: Date.now() });

    const latency = Date.now() - startTime;
    diagnostics.responseTimes.push(latency);
    diagnostics.averageResponseTimeMs = diagnostics.responseTimes.reduce((a, b) => a + b, 0) / diagnostics.responseTimes.length;
    diagnostics.lastSuccessfulRequestTime = Date.now();

    res.json(resultJSON);
  } catch (error: any) {
    diagnostics.failedRequestsCount++;
    console.error("Error in AI risk analysis:", error);
    res.status(500).json({ error: error.message || "Failed to analyze risk" });
  }
});

// Milestone Achievement Rewards
app.post("/api/ai/milestone-reward", rateLimitMiddleware, validateAndSanitize, async (req, res) => {
  const startTime = Date.now();
  try {
    const { streak } = req.body;
    
    const cacheKey = getCacheKey("/api/ai/milestone-reward", req.body);
    const cached = aiResponseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      diagnostics.cacheHits++;
      diagnostics.cacheHitRatio = diagnostics.cacheHits / diagnostics.totalRequests;
      return res.json(cached.response);
    }

    const prompt = `Streak milestone of ${streak} consecutive met deadlines!
Output compact JSON:
1. "congratsMessage": (1-sentence high-velocity mentor congratulate)
2. "insight": { "title": string, "hack": (2-3 sentences elite hack on focus/inertia) }`;

    let resultJSON: any;
    if (!process.env.GEMINI_API_KEY) {
      resultJSON = {
        congratsMessage: `Amazing job on securing ${streak} streaks consecutive met deadlines! This is exactly how we win the hackathon.`,
        insight: {
          title: `The ${streak}-Block Hyper-Focus Play`,
          hack: "Begin tasks by writing the simplest, dumbest possible version of the API contracts. Once structural boundaries are set, execution velocity naturally triples due to lowered cognitive loading."
        }
      };
    } else {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      const text = response.text;
      if (!text) throw new Error("Null response from Gemini core");
      resultJSON = JSON.parse(text);
      updateCostEstimates(prompt.length, text.length);
    }

    aiResponseCache.set(cacheKey, { response: resultJSON, timestamp: Date.now() });

    const latency = Date.now() - startTime;
    diagnostics.responseTimes.push(latency);
    diagnostics.averageResponseTimeMs = diagnostics.responseTimes.reduce((a, b) => a + b, 0) / diagnostics.responseTimes.length;
    diagnostics.lastSuccessfulRequestTime = Date.now();

    res.json(resultJSON);
  } catch (error: any) {
    diagnostics.failedRequestsCount++;
    console.error("Error in milestone rewards:", error);
    res.status(500).json({ error: error.message || "Failed to fetch reward" });
  }
});

// Subtask Sub-Decomposition Endpoint
app.post("/api/ai/breakdown-subtask", rateLimitMiddleware, validateAndSanitize, async (req, res) => {
  const startTime = Date.now();
  try {
    const { title, durationMinutes } = req.body;
    if (!title) {
      return res.status(400).json({ error: "Missing subtask title" });
    }

    const cacheKey = getCacheKey("/api/ai/breakdown-subtask", req.body);
    const cached = aiResponseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      diagnostics.cacheHits++;
      diagnostics.cacheHitRatio = diagnostics.cacheHits / diagnostics.totalRequests;
      return res.json(cached.response);
    }

    const prompt = `Decompose milestone: "${title}". Duration: ${durationMinutes || 60} mins.
Output compact JSON:
"subtasks": Array of exactly 3 micro-tasks: { "title": string, "description": string, "durationMinutes": number }`;

    let resultJSON: any;
    if (!process.env.GEMINI_API_KEY) {
      const chunk = Math.ceil((durationMinutes || 60) / 3);
      resultJSON = {
        subtasks: [
          { title: `Initialize ${title} Skeleton`, description: "Define the basic interface parameters and files.", durationMinutes: chunk },
          { title: `Core Implementation Block of ${title}`, description: "Integrate core logic and event handshakes.", durationMinutes: chunk },
          { title: `Polish and Dry-Run of ${title}`, description: "Verify transitions and basic input validations.", durationMinutes: chunk }
        ]
      };
    } else {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      const text = response.text;
      if (!text) throw new Error("Null response from Gemini core");
      resultJSON = JSON.parse(text);
      updateCostEstimates(prompt.length, text.length);
    }

    aiResponseCache.set(cacheKey, { response: resultJSON, timestamp: Date.now() });

    const latency = Date.now() - startTime;
    diagnostics.responseTimes.push(latency);
    diagnostics.averageResponseTimeMs = diagnostics.responseTimes.reduce((a, b) => a + b, 0) / diagnostics.responseTimes.length;
    diagnostics.lastSuccessfulRequestTime = Date.now();

    res.json(resultJSON);
  } catch (error: any) {
    diagnostics.failedRequestsCount++;
    console.error("Error in subtask breakdown:", error);
    res.status(500).json({ error: error.message || "Failed to breakdown subtask" });
  }
});

// AI Co-Founder Chat Endpoint
app.post("/api/ai/copilot-chat", rateLimitMiddleware, validateAndSanitize, async (req, res) => {
  const startTime = Date.now();
  try {
    const { messages, currentTaskState } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Prepare Optimized Minimal System Instructions
    const systemPrompt = `You are the AI Tech Co-Founder of ShieldAI. High-energy, direct, proactive hackathon partner. Challenge inertia. Push user to execute fast. Max 3 concise paragraphs. Propose actions. Current task context: ${currentTaskState ? JSON.stringify(currentTaskState) : "None"}.`;

    let replyText = "";
    if (!process.env.GEMINI_API_KEY) {
      const lastMsg = messages[messages.length - 1]?.content || "";
      replyText = `[MOCK MODE] I hear you! As your Co-Founder, I recommend we double down on the primary feature first. Regarding "${lastMsg}", let's make it fully interactive within 20 minutes. Ready to jump into the Focus Room?`;
    } else {
      const ai = getAI();
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
      replyText = response.text || "Let's focus on completing the next subtask.";
      updateCostEstimates(systemPrompt.length, replyText.length);
    }

    const latency = Date.now() - startTime;
    diagnostics.responseTimes.push(latency);
    diagnostics.averageResponseTimeMs = diagnostics.responseTimes.reduce((a, b) => a + b, 0) / diagnostics.responseTimes.length;
    diagnostics.lastSuccessfulRequestTime = Date.now();

    res.json({ reply: replyText });
  } catch (error: any) {
    const isQuotaExhausted = error && (
      error.status === 429 ||
      error.statusCode === 429 ||
      (error.message && (
        error.message.includes("429") ||
        error.message.includes("RESOURCE_EXHAUSTED") ||
        error.message.includes("quota") ||
        error.message.includes("Quota") ||
        error.message.includes("exhausted")
      ))
    );

    if (isQuotaExhausted) {
      console.warn("[ShieldAI Server] Gemini API Quota Exhausted (429 RESOURCE_EXHAUSTED) in copilot-chat. Activating offline intelligent local fallback response.");

      const { messages, currentTaskState, allTasks, calendarEvents, cognitiveEnergyLevel } = req.body;
      const lastUserMessage = (messages && Array.isArray(messages) && messages.length > 0)
        ? messages[messages.length - 1]?.content || ""
        : "";

      const activeTaskTitle = currentTaskState?.title || "your active mission";
      const activeRiskLevel = currentTaskState?.riskLevel || "Medium";
      const activeRiskFactor = currentTaskState?.riskFactor ?? 45;
      const pendingCount = currentTaskState?.pendingSubtasks?.length || 0;
      const completedCount = currentTaskState?.completedSubtasks?.length || 0;
      const energy = cognitiveEnergyLevel || "medium";
      const bRisk = currentTaskState?.burnoutRisk || (energy === "low" ? 75 : energy === "medium" ? 45 : 15);
      const pendingListStr = currentTaskState?.pendingSubtasks?.length 
        ? currentTaskState.pendingSubtasks.slice(0, 3).map((t: string) => `"${t}"`).join(", ") 
        : "the remaining subtasks";

      const lowerMsg = lastUserMessage.toLowerCase();
      let localResponse = "";

      if (lowerMsg.includes("procrastinat") || lowerMsg.includes("stuck") || lowerMsg.includes("rescue") || lowerMsg.includes("fail") || lowerMsg.includes("inertia") || lowerMsg.includes("stop")) {
        localResponse = `I detect some procrastination or mental friction here. Don't worry, that's exactly why we engineered the pacing shield. 
Your active goal is **${activeTaskTitle}** which is currently flagged at **${activeRiskLevel}** risk level (${activeRiskFactor}% risk factor). 
We have **${pendingCount}** pending subtasks left to secure: ${pendingListStr}. 

**Tactical Pro-founder Action**:
- Go to the **Focus Room** right now. 
- Click on the **Box Breathing Cortrush** panel and run a 2-minute cycle. It is scientifically proven to reset attention drifts and clear stress hormones.
- When you return, tackle just the first micro-step. We can cut down the secondary requirements later if time compresses!`;
      } else if (lowerMsg.includes("priority") || lowerMsg.includes("task") || lowerMsg.includes("plan") || lowerMsg.includes("next") || lowerMsg.includes("schedule") || lowerMsg.includes("what to do") || lowerMsg.includes("milestone")) {
        localResponse = `Let's analyze our roadmap. We currently have **${allTasks?.filter((t: any) => !t.completed).length || 0}** active tasks in our pipeline. 
Your immediate tactical focus must be **${activeTaskTitle}** (Priority: **${currentTaskState?.priority || "High"}**). 

**Pacing Schedule Recommendation**:
- Allocate a **25-minute deep focus sprint** specifically to clear the next step.
- Protect this time block. We have **${calendarEvents?.length || 0}** calendar events today. Check that your focus blocks are securely isolated from non-critical commitments. 
- If you feel overloaded, we can reschedule non-deadline events. Let's maintain high momentum!`;
      } else if (lowerMsg.includes("energy") || lowerMsg.includes("tired") || lowerMsg.includes("burnout") || lowerMsg.includes("exhaust") || lowerMsg.includes("sleep") || lowerMsg.includes("fatigued")) {
        localResponse = `Let's check your cognitive batteries. You reported your cognitive energy as **${energy.toUpperCase()}** and your current burnout risk is projected at **${bRisk}%**. 
Operating at low or depleted levels is how we make heavy development mistakes or hit burnout blocks.

**Cognitive Safety Action**:
- Let's enforce a **15-minute high-efficiency focus block**, followed immediately by a mandatory pacing break. 
- Avoid staring at the code during your break. Do a quick physical stretch or box breathing reset.
- Remember: pacing protects our timeline. Let's build sustainable speed!`;
      } else {
        localResponse = `I hear you, partner! Let's look at the telemetry:
- **Active Task**: **${activeTaskTitle}** (Current Risk: **${activeRiskLevel}** / ${activeRiskFactor}%)
- **Milestone Check**: **${completedCount} completed**, **${pendingCount} pending** subtasks.
- **Cognitive Energy State**: **${energy.toUpperCase()}** (Burnout risk index: **${bRisk}%**)
- **Timeline Commitments**: **${calendarEvents?.length || 0} scheduled items** monitored.

Whatever the hurdle, we can solve it by breaking it down. Focus purely on the next 15 minutes of execution. Let's stay in deep focus flow!`;
      }

      const fallbackReply = `⚠️ [LOCAL COMPANION SHIELD ACTIVE - LIVE AI QUOTA TEMPORARILY UNAVAILABLE]
As your Co-Founder, I am operating on local offline systems to keep our launch timeline completely safe.

Here is our live status analysis and tactical recommendation:
${localResponse}`;

      return res.status(200).json({ reply: fallbackReply });
    }

    diagnostics.failedRequestsCount++;
    console.error("Error in AI copilot chat:", error);
    res.status(500).json({ error: error.message || "Chat processing failed" });
  }
});

// Flagship AI Advisor Endpoint (Optimized & Cached)
app.post("/api/ai/advisor", rateLimitMiddleware, validateAndSanitize, async (req, res) => {
  const startTime = Date.now();
  try {
    const { tasks, events, userProfile, learningProfile, cognitiveEnergyLevel } = req.body;

    const cacheKey = getCacheKey("/api/ai/advisor", req.body);
    const cached = aiResponseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      diagnostics.cacheHits++;
      diagnostics.cacheHitRatio = diagnostics.cacheHits / diagnostics.totalRequests;
      return res.json(cached.response);
    }

    const prompt = `Evaluate complete workload for "ShieldAI" pacing optimizer.
Tasks: ${JSON.stringify(tasks || [])}
Events: ${JSON.stringify(events || [])}
Profile: ${JSON.stringify(userProfile || {})}
Learning habits: ${JSON.stringify(learningProfile || {})}
Energy Level: "${cognitiveEnergyLevel || "medium"}".
Generate structured JSON:
1. "recommendation": (highly practical next step based on urgency and energy)
2. "confidenceScore": (0-100)
3. "estimatedDuration": (recommended sprint length, 15-50 min)
4. "expectedImpact": (1-2 sentences on reducing stress)
5. "alternativeRecommendation": (quick pacing reset or documentation)
6. "timeBlocks": Array of 4-6 blocks: { "id": string, "timeRange": string, "title": string, "description": string, "associatedTaskId"?: string, "type": "task-focus"|"break"|"meeting"|"flexible" }
7. "burnoutForecast": { "weeklyBurnoutRisk": 0-100, "burnoutAssessment": string, "riskFactors": string[], "proactiveRemedies": string[] }
8. "trustReport": { "whyGenerated": string, "factorsConsidered": string[], "dataSourceCount": number }
JSON strictly.`;

    let resultJSON: any;
    if (!process.env.GEMINI_API_KEY) {
      const activeTasksList = tasks || [];
      const hasTasks = activeTasksList.length > 0;
      const primaryTask = hasTasks ? activeTasksList[0] : null;
      const primaryTitle = primaryTask ? primaryTask.title : "Workspace Onboarding & Goal Mapping";
      const primaryId = primaryTask ? primaryTask.id : "onboarding";

      const startHour = userProfile?.onboarding?.workingHoursStart ? parseInt(userProfile.onboarding.workingHoursStart.split(":")[0]) : 9;
      const sleepBedtime = userProfile?.onboarding?.sleepBedtime || "22:00";

      const bRisk = cognitiveEnergyLevel === "low" ? 78 : cognitiveEnergyLevel === "medium" ? 45 : 18;
      const recommendationText = hasTasks
        ? `Execute high-priority milestone inside "${primaryTitle}". Current energy level is "${cognitiveEnergyLevel}", which requires short focus sprints.`
        : "Initialize your first major goal. Your schedule has wide capacity.";

      const timeBlocks = [
        {
          id: "tb-1",
          timeRange: `${String(startHour).padStart(2, "0")}:00 - ${String(startHour + 1).padStart(2, "0")}:00`,
          title: hasTasks ? `Deep Focus: ${primaryTitle}` : "Strategic Workspace Setup",
          description: "Establish structural parameters or design system baselines.",
          associatedTaskId: primaryId,
          type: "task-focus" as const
        },
        {
          id: "tb-2",
          timeRange: `${String(startHour + 1).padStart(2, "0")}:00 - ${String(startHour + 1).padStart(2, "0")}:20`,
          title: "Pacing Break: Box Breathing Loop",
          description: "A 4-4-4-4 box breathing cycle to flush stress cortisol and stabilize HRV.",
          type: "break" as const
        },
        {
          id: "tb-3",
          timeRange: `${String(startHour + 1).padStart(2, "0")}:20 - ${String(startHour + 2).padStart(2, "0")}:30`,
          title: "Secondary Commitment Alignment",
          description: "Clear routine calendar blockers and check dependencies.",
          type: "flexible" as const
        },
        {
          id: "tb-4",
          timeRange: `${String(startHour + 2).padStart(2, "0")}:30 - ${String(startHour + 3).padStart(2, "0")}:00`,
          title: "Workspace Sync Commit",
          description: "Brief review of outstanding requirements and build script compliance.",
          type: "meeting" as const
        }
      ];

      resultJSON = {
        recommendation: recommendationText,
        confidenceScore: cognitiveEnergyLevel === "low" ? 82 : 94,
        estimatedDuration: cognitiveEnergyLevel === "low" ? 25 : 50,
        expectedImpact: "Lowers mental inertia and completes the most complex dependency while cognitive battery remains stable.",
        alternativeRecommendation: "Engage in 5 minutes of guided Box Breathing in the Focus Room, then tackle a lightweight 15-minute documentation milestone.",
        timeBlocks,
        burnoutForecast: {
          weeklyBurnoutRisk: bRisk,
          burnoutAssessment: `With a ${cognitiveEnergyLevel || "medium"} energy rating and ${activeTasksList.length} outstanding tasks, your burnout probability remains well-managed.`,
          riskFactors: [
            `${activeTasksList.length} active tasks queued`,
            `Cognitive battery at "${cognitiveEnergyLevel || "medium"}" state`,
            `Planned bedtime at ${sleepBedtime}`
          ],
          proactiveRemedies: [
            "Mandate 10 minutes of active Box Breathing in the Focus Room",
            "Surgically prune layout polish from secondary elements",
            "Establish strict working boundaries 1 hour before sleeping"
          ]
        },
        trustReport: {
          whyGenerated: "Dynamically evaluated local state changes, active tasks, and cognitive battery metrics.",
          factorsConsidered: [
            `${activeTasksList.length} Tasks Checked`,
            `${(events || []).length} Calendar Events Audited`,
            `Onboarding timezone & working hours applied`
          ],
          dataSourceCount: 4
        }
      };
    } else {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text;
      if (!text) throw new Error("Null response from Gemini core");
      resultJSON = JSON.parse(text);
      updateCostEstimates(prompt.length, text.length);
    }

    aiResponseCache.set(cacheKey, { response: resultJSON, timestamp: Date.now() });

    const latency = Date.now() - startTime;
    diagnostics.responseTimes.push(latency);
    diagnostics.averageResponseTimeMs = diagnostics.responseTimes.reduce((a, b) => a + b, 0) / diagnostics.responseTimes.length;
    diagnostics.lastSuccessfulRequestTime = Date.now();

    res.json(resultJSON);
  } catch (error: any) {
    diagnostics.failedRequestsCount++;
    console.error("Error in AI advisor endpoint:", error);
    res.status(500).json({ error: error.message || "Failed to generate optimized daily plan" });
  }
});

// ==========================================
// 5. Diagnostics, Memory, & Privacy Endpoints
// ==========================================

// GET Diagnostics / Health Stats Panel
app.get("/api/ai/health-stats", (req, res) => {
  res.json({
    status: diagnostics.failedRequestsCount > diagnostics.totalRequests * 0.25 ? "degraded" : "healthy",
    currentModel: diagnostics.currentModel,
    totalRequests: diagnostics.totalRequests,
    dailyRequests: diagnostics.requestsToday,
    averageLatencyMs: Math.round(diagnostics.averageResponseTimeMs),
    failedRequestsCount: diagnostics.failedRequestsCount,
    cacheHitRatio: diagnostics.totalRequests > 0 ? Number((diagnostics.cacheHits / diagnostics.totalRequests).toFixed(2)) : 0,
    requestsToday: diagnostics.requestsToday,
    estimatedCostUsd: Number(diagnostics.estimatedCostUsd.toFixed(5)),
    lastSuccessfulRequestTime: diagnostics.lastSuccessfulRequestTime,
    rateLimitsConfig: {
      minuteLimit: LIMIT_CONFIGS.minute.count,
      hourlyLimit: LIMIT_CONFIGS.hour.count,
      dailyLimit: LIMIT_CONFIGS.day.count
    }
  });
});

// GET AI Memory for specific user
app.get("/api/ai/memory/:userId", (req, res) => {
  const { userId } = req.params;
  let memory = userAIMemories.get(userId);
  if (!memory) {
    memory = {
      productivityPreferences: {
        preferredFocusHour: 9,
        averageTaskDuration: 45,
        breakFrequencyMinutes: 25,
        postponedCount: 0
      },
      historicalCompletionTimes: {
        Coding: [45, 60, 90],
        Design: [30, 45],
        Research: [60, 120]
      },
      focusDuration: 45,
      breakFrequency: 25,
      productivityPatterns: [
        "Highly productive in visual tasks between 09:00 - 11:30.",
        "Experiencing attention compression or cognitive friction near 14:00.",
        "Regular Box Breathing stabilizes sustained focus during multi-task sprints."
      ],
      frequentlyPostponedCategories: ["Documentation", "Testing"],
      recommendationHistory: [
        "Optimize Core UI modules first while focus battery is Charged",
        "Take an active Box Breathing cycle immediately"
      ]
    };
    userAIMemories.set(userId, memory);
  }
  res.json(memory);
});

// POST update AI Memory patterns
app.post("/api/ai/memory/:userId/update", validateAndSanitize, (req, res) => {
  const { userId } = req.params;
  const updates = req.body;
  
  let memory = userAIMemories.get(userId);
  if (!memory) {
    memory = {
      productivityPreferences: {},
      historicalCompletionTimes: {},
      focusDuration: 45,
      breakFrequency: 25,
      productivityPatterns: [],
      frequentlyPostponedCategories: [],
      recommendationHistory: []
    };
  }

  // Safely merge parameters
  memory.productivityPreferences = {
    ...memory.productivityPreferences,
    ...updates.productivityPreferences
  };

  if (updates.focusDuration) memory.focusDuration = updates.focusDuration;
  if (updates.breakFrequency) memory.breakFrequency = updates.breakFrequency;
  
  if (updates.newPattern && !memory.productivityPatterns.includes(updates.newPattern)) {
    memory.productivityPatterns.push(updates.newPattern);
  }
  if (updates.postponedCategory && !memory.frequentlyPostponedCategories.includes(updates.postponedCategory)) {
    memory.frequentlyPostponedCategories.push(updates.postponedCategory);
    memory.productivityPreferences.postponedCount = (memory.productivityPreferences.postponedCount || 0) + 1;
  }

  userAIMemories.set(userId, memory);
  res.json({ success: true, memory });
});

// POST Clear AI Memory
app.post("/api/ai/memory/:userId/clear", (req, res) => {
  const { userId } = req.params;
  userAIMemories.delete(userId);
  res.json({ success: true, message: "AI Memory completely cleared. Personalization engine reset." });
});

// POST Reset personalization configs
app.post("/api/ai/memory/:userId/reset", (req, res) => {
  const { userId } = req.params;
  const defaultMemory = {
    productivityPreferences: {
      preferredFocusHour: 9,
      averageTaskDuration: 45,
      breakFrequencyMinutes: 25,
      postponedCount: 0
    },
    historicalCompletionTimes: {},
    focusDuration: 45,
    breakFrequency: 25,
    productivityPatterns: [],
    frequentlyPostponedCategories: [],
    recommendationHistory: []
  };
  userAIMemories.set(userId, defaultMemory);
  res.json({ success: true, message: "AI Personalization has been reset to defaults.", memory: defaultMemory });
});

// POST Export AI Personalization & Audit Logs
app.post("/api/ai/memory/:userId/export", (req, res) => {
  const { userId } = req.params;
  const memory = userAIMemories.get(userId) || {};
  const rateLimitStatus = rateLimits.get(`user:${userId}`) || rateLimits.get(`ip:${req.ip}`) || {};
  
  res.json({
    exportedAt: new Date().toISOString(),
    platform: "ShieldAI Core",
    userId,
    auditData: {
      aiPersonalizationMemory: memory,
      rateLimitsTelemetry: rateLimitStatus,
      globalDiagnosticsStatus: diagnostics.status
    }
  });
});

// ==========================================
// 6. Mock Decomposition Fallback helper
// ==========================================
function getMockDecomposition(title: string, deadline: string, energyLevel?: string) {
  const isClose = new Date(deadline).getTime() - Date.now() < 24 * 60 * 60 * 1000;
  const bRisk = energyLevel === "low" ? 84 : energyLevel === "medium" ? 48 : 18;
  const recommendation = energyLevel === "low"
    ? "Pacing Shield Active: Micro-breaks (5 mins) are forced after every 15-minute focus interval to safeguard cognitive reserves."
    : energyLevel === "high"
      ? "Optimal Flow Pacing: Double-down on major sprints. Your cognitive battery is fully charged."
      : "Steady State Pacing: Execute default 25-minute sprints with 5-minute pacing breaks between blocks.";

  return {
    riskLevel: isClose ? "Critical" : "Medium",
    riskFactor: isClose ? 82 : 45,
    burnoutRisk: bRisk,
    pacingSafetyRecommendation: recommendation,
    assessment: `Mapped deadline profile for "${title}". Strategic sprint structuring initiated to buffer potential delays.`,
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
        description: "Strip secondary dependencies and lock core database contracts.",
        durationMinutes: energyLevel === "low" ? 15 : 45,
        suggestedTime: "Immediately",
        category: "Planning"
      },
      {
        id: "mock-2",
        title: "Core Implementation Block",
        description: "Assemble primary view frameworks and local state stores.",
        durationMinutes: energyLevel === "low" ? 20 : 90,
        suggestedTime: "In next 2 hours",
        category: "Coding"
      },
      {
        id: "mock-3",
        title: "Integration & Security Audit",
        description: "Verify Firestore document boundaries and rate limits compatibility.",
        durationMinutes: energyLevel === "low" ? 15 : 60,
        suggestedTime: "Before final block",
        category: "Testing"
      },
      {
        id: "mock-4",
        title: "Refinement & Final Sprints",
        description: "Verify transition timings and layout contrast ratios.",
        durationMinutes: energyLevel === "low" ? 15 : 45,
        suggestedTime: "1 hour before deadline",
        category: "Design"
      }
    ],
    rescueTriggers: [
      {
        title: "Scope Freeze Strategy",
        action: "Impose a strict code freeze on helper endpoints. Dedicate available minutes purely to verifying primary visual layouts."
      },
      {
        title: "Chronological Subtask Pruning",
        action: "Defer documentation blocks or secondary graph widgets to free up a 30-minute coding cushion."
      }
    ]
  };
}

// ==========================================
// 7. Start the Server & Setup Vite Middleware
// ==========================================
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
    console.log(`[ShieldAI Server] Security-fortified core online at http://0.0.0.0:${PORT}`);
  });
}

startServer();
