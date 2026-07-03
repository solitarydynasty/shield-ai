/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Sparkles, Cpu, Zap, Clock, Flame, ShieldAlert, CheckCircle, 
  TrendingUp, Info, Calendar, TrendingDown, User, RefreshCw,
  Activity, ArrowRight, ShieldCheck, Database, HelpCircle,
  Server, Lock, Trash2, Download, Eye, AlertCircle, ToggleLeft, ToggleRight, Settings
} from "lucide-react";
import { Task, Subtask, CalendarEvent, UserProfile, LearningProfile } from "../types";

interface AIAdvisorProps {
  tasks: Task[];
  events: CalendarEvent[];
  userProfile: UserProfile;
  learningProfile: LearningProfile;
  cognitiveEnergyLevel: "low" | "medium" | "high";
  onSetCognitiveEnergyLevel: (level: "low" | "medium" | "high") => void;
  onEnterFocus: (task: Task, subtask: Subtask) => void;
  onNavigateToTab: (tab: "dashboard" | "integrations" | "guide") => void;
}

interface TimeBlock {
  id: string;
  timeRange: string;
  title: string;
  description: string;
  associatedTaskId?: string;
  type: "task-focus" | "break" | "meeting" | "flexible";
}

interface BurnoutForecast {
  weeklyBurnoutRisk: number;
  burnoutAssessment: string;
  riskFactors: string[];
  proactiveRemedies: string[];
}

interface TrustReport {
  whyGenerated: string;
  factorsConsidered: string[];
  dataSourceCount: number;
}

interface AdvisorResponse {
  recommendation: string;
  confidenceScore: number;
  estimatedDuration: number;
  expectedImpact: string;
  alternativeRecommendation: string;
  timeBlocks: TimeBlock[];
  burnoutForecast: BurnoutForecast;
  trustReport: TrustReport;
}

interface DiagnosticStats {
  status: "healthy" | "degraded" | "offline";
  currentModel: string;
  totalRequests: number;
  dailyRequests: number;
  averageLatencyMs: number;
  failedRequestsCount: number;
  cacheHitRatio: number;
  requestsToday: number;
  estimatedCostUsd: number;
  lastSuccessfulRequestTime: number;
  rateLimitsConfig: {
    minuteLimit: number;
    hourlyLimit: number;
    dailyLimit: number;
  };
}

interface AIMemoryProfile {
  productivityPreferences: {
    preferredFocusHour?: number;
    averageTaskDuration?: number;
    breakFrequencyMinutes?: number;
    postponedCount?: number;
  };
  historicalCompletionTimes: Record<string, number[]>;
  focusDuration: number;
  breakFrequency: number;
  productivityPatterns: string[];
  frequentlyPostponedCategories: string[];
  recommendationHistory: string[];
}

export default function AIAdvisor({
  tasks,
  events,
  userProfile,
  learningProfile,
  cognitiveEnergyLevel,
  onSetCognitiveEnergyLevel,
  onEnterFocus,
  onNavigateToTab
}: AIAdvisorProps) {
  // Navigation Sub-Tabs
  const [subTab, setSubTab] = useState<"planner" | "diagnostics" | "memory">("planner");
  
  // Core Advisor State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdvisorResponse | null>(null);
  const [useAlternative, setUseAlternative] = useState(false);
  const [isScanActive, setIsScanActive] = useState(false);

  // Diagnostics States
  const [diagnostics, setDiagnostics] = useState<DiagnosticStats | null>(null);
  const [loadingDiag, setLoadingDiag] = useState(false);

  // Memory & Personalization States
  const [aiMemory, setAiMemory] = useState<AIMemoryProfile | null>(null);
  const [loadingMemory, setLoadingMemory] = useState(false);
  const [memoryConsent, setMemoryConsent] = useState(true);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const userId = userProfile?.userId || "mock-google-user-123";

  // Fetch Flagship Advisor scheduling content
  const fetchAdvice = async (forceUpdate = false) => {
    setLoading(true);
    setError(null);
    if (forceUpdate) {
      setIsScanActive(true);
    }

    try {
      const response = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Shield-UserId": userId
        },
        body: JSON.stringify({
          tasks: tasks.filter(t => !t.completed),
          events,
          userProfile,
          learningProfile,
          cognitiveEnergyLevel
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          const limitErr = await response.json();
          throw new Error(limitErr.friendlyMessage || "Rate limit reached. Please pace.");
        }
        throw new Error("AI Advisor module currently offline.");
      }

      const result = await response.json();
      setData(result);
      setUseAlternative(false);
    } catch (err: any) {
      console.error("[ShieldAI] Error loading AI advice:", err);
      setError(err.message || "Failed to contact AI scheduling core.");
    } finally {
      setLoading(false);
      if (forceUpdate) {
        setTimeout(() => setIsScanActive(false), 1200);
      }
    }
  };

  // Fetch AI System Diagnostics & Health Telemetry
  const fetchDiagnostics = async () => {
    setLoadingDiag(true);
    try {
      const response = await fetch("/api/ai/health-stats");
      if (response.ok) {
        const stats = await response.json();
        setDiagnostics(stats);
      }
    } catch (err) {
      console.error("[ShieldAI] Error loading health diagnostics:", err);
    } finally {
      setLoadingDiag(false);
    }
  };

  // Fetch AI Memory & learned habits
  const fetchMemory = async () => {
    setLoadingMemory(true);
    try {
      const response = await fetch(`/api/ai/memory/${userId}`);
      if (response.ok) {
        const mem = await response.json();
        setAiMemory(mem);
      }
    } catch (err) {
      console.error("[ShieldAI] Error loading AI personalization memory:", err);
    } finally {
      setLoadingMemory(false);
    }
  };

  // Reset/Clear AI personalizations
  const handleResetPersonalization = async () => {
    if (!confirm("Are you sure you want to restore AI model weights to factory defaults? This resets task duration predictions.")) return;
    try {
      const response = await fetch(`/api/ai/memory/${userId}/reset`, { method: "POST" });
      if (response.ok) {
        const res = await response.json();
        setAiMemory(res.memory);
        showSuccessBanner(res.message);
      }
    } catch (err) {
      console.error("Failed to reset personalization:", err);
    }
  };

  const handleClearMemory = async () => {
    if (!confirm("Are you sure you want to completely erase all active AI memories? Your learned focus windows and procrastinated categories will be fully wiped.")) return;
    try {
      const response = await fetch(`/api/ai/memory/${userId}/clear`, { method: "POST" });
      if (response.ok) {
        const res = await response.json();
        setAiMemory({
          productivityPreferences: {},
          historicalCompletionTimes: {},
          focusDuration: 45,
          breakFrequency: 25,
          productivityPatterns: [],
          frequentlyPostponedCategories: [],
          recommendationHistory: []
        });
        showSuccessBanner(res.message);
      }
    } catch (err) {
      console.error("Failed to clear memory:", err);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(`/api/ai/memory/${userId}/export`, { method: "POST" });
      if (response.ok) {
        const res = await response.json();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `shieldai_personal_audit_${userId}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showSuccessBanner("AI profile and security audit exported successfully.");
      }
    } catch (err) {
      console.error("Failed to export memory:", err);
    }
  };

  const showSuccessBanner = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  // Hook to pull diagnostics and memory on mount/subtab focus
  useEffect(() => {
    fetchAdvice();
  }, [cognitiveEnergyLevel, tasks.length]);

  useEffect(() => {
    if (subTab === "diagnostics") {
      fetchDiagnostics();
    } else if (subTab === "memory") {
      fetchMemory();
    }
  }, [subTab]);

  const handleStartAssociatedTask = (block: TimeBlock) => {
    if (!block.associatedTaskId) return;
    const matchedTask = tasks.find(t => t.id === block.associatedTaskId);
    if (matchedTask) {
      const subtask = matchedTask.subtasks.find(s => !s.completed) || matchedTask.subtasks[0];
      if (subtask) {
        onEnterFocus(matchedTask, subtask);
      }
    }
  };

  const getBurnoutRiskColor = (risk: number) => {
    if (risk > 75) return "text-[#FF3B30] border-[#FF3B30]/30 bg-[#FF3B30]/5";
    if (risk > 45) return "text-[#FF9500] border-[#FF9500]/30 bg-[#FF9500]/5";
    return "text-[#34C759] border-[#34C759]/30 bg-[#34C759]/5";
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5C00]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-black font-sans tracking-tight text-white flex items-center gap-2.5">
              <Cpu className="h-6 w-6 text-[#FF5C00]" />
              <span>AI Advisor & Daily Workload Optimizer</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              ShieldAI's scheduling core continually evaluates your outstanding deliverables, deadlines, calendar events, focus speed metrics, and sleep constraints to construct a proactive, burnout-proof timeline.
            </p>
          </div>

          {/* Cognitive Battery Selector */}
          <div className="bg-[#111] border border-[#222] p-1.5 rounded-lg flex items-center gap-1.5 self-start md:self-auto">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider px-2">Battery:</span>
            {(["low", "medium", "high"] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => onSetCognitiveEnergyLevel(lvl)}
                className={`px-3 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  cognitiveEnergyLevel === lvl
                    ? "bg-[#FF5C00] text-black shadow-[0_0_12px_rgba(255,92,0,0.3)]"
                    : "text-slate-400 hover:text-white hover:bg-[#1A1A1A]"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Interactive Sub-Navigation Tabs */}
        <div className="flex border-t border-[#222] mt-6 pt-4 gap-2">
          <button
            onClick={() => setSubTab("planner")}
            className={`px-4 py-2 rounded text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              subTab === "planner"
                ? "bg-[#FF5C00]/10 border border-[#FF5C00]/30 text-[#FF5C00] font-black"
                : "border border-transparent text-slate-400 hover:text-white hover:bg-[#111]"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Advisory & Sprints</span>
          </button>
          <button
            onClick={() => setSubTab("diagnostics")}
            className={`px-4 py-2 rounded text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              subTab === "diagnostics"
                ? "bg-[#FF5C00]/10 border border-[#FF5C00]/30 text-[#FF5C00] font-black"
                : "border border-transparent text-slate-400 hover:text-white hover:bg-[#111]"
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>Diagnostics Hub</span>
          </button>
          <button
            onClick={() => setSubTab("memory")}
            className={`px-4 py-2 rounded text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              subTab === "memory"
                ? "bg-[#FF5C00]/10 border border-[#FF5C00]/30 text-[#FF5C00] font-black"
                : "border border-transparent text-slate-400 hover:text-white hover:bg-[#111]"
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>AI Memory & Privacy</span>
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="bg-[#34C759]/10 border border-[#34C759]/30 rounded-lg p-3 text-xs text-[#34C759] flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* RENDER ACTIVE TAB */}
      {subTab === "planner" && (
        <>
          {loading && !isScanActive ? (
            <div className="bg-[#0A0A0A] border border-[#111] rounded-xl p-16 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative">
                <div className="h-12 w-12 border-2 border-t-2 border-slate-700 border-t-[#FF5C00] rounded-full animate-spin" />
                <Cpu className="h-5 w-5 text-[#FF5C00] absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1 mt-2">
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Syncing scheduling core...</h3>
                <p className="text-xs text-slate-500 max-w-xs">Correlating outstanding milestones with calendar commitments and habits multipliers.</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-[#1A0A0A] border border-[#FF3B30]/30 rounded-xl p-6 text-center space-y-3">
              <ShieldAlert className="h-8 w-8 text-[#FF3B30] mx-auto" />
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">Pacing Shield Intercepted</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">{error}</p>
              <button 
                onClick={() => fetchAdvice()}
                className="bg-[#111] border border-[#222] hover:border-[#FF5C00]/40 px-4 py-2 rounded text-xs text-white font-mono cursor-pointer transition-all uppercase"
              >
                Re-Authorize System
              </button>
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Action Plan & Schedule Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Proactive Advisor Recommendation Card */}
                <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-6 space-y-6 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[#222] pb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-[#FF5C00]" />
                      <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Flagship Advisory: What's Next?</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Confidence Indicator */}
                      <div className="flex items-center gap-1.5 bg-[#111] border border-[#222] px-2.5 py-1 rounded text-[10px] font-mono text-slate-300">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#34C759]" />
                        <span>Confidence: <span className="text-[#34C759] font-bold">{data.confidenceScore}%</span></span>
                      </div>
                      <button 
                        onClick={() => fetchAdvice(true)}
                        disabled={loading}
                        className="bg-[#111] hover:bg-[#1A1A1A] border border-[#222] hover:border-[#FF5C00]/40 px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                        <span>Optimize</span>
                      </button>
                    </div>
                  </div>

                  {/* Recommendation Content */}
                  <div className="space-y-4">
                    <p className="text-sm text-slate-200 leading-relaxed font-serif italic border-l-2 border-[#FF5C00] pl-4">
                      "{useAlternative ? data.alternativeRecommendation : data.recommendation}"
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="bg-[#111] border border-[#222] p-4 rounded-lg space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-[#FF5C00]" /> Estimated Duration
                        </span>
                        <p className="text-lg font-black text-white">{data.estimatedDuration} Minutes</p>
                      </div>
                      <div className="bg-[#111] border border-[#222] p-4 rounded-lg space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Zap className="h-3.5 w-3.5 text-[#FF5C00]" /> Expected Impact
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">{data.expectedImpact}</p>
                      </div>
                    </div>
                  </div>

                  {/* Toggle/Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={() => {
                        const nextFocusBlock = data.timeBlocks.find(b => b.type === "task-focus" && b.associatedTaskId);
                        if (nextFocusBlock) {
                          handleStartAssociatedTask(nextFocusBlock);
                        } else {
                          onNavigateToTab("dashboard");
                        }
                      }}
                      className="flex-1 bg-gradient-to-r from-[#FF5C00] to-[#FF7A00] hover:from-[#FF7A00] hover:to-[#FF9500] text-black text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-lg shadow-[0_0_15px_rgba(255,92,0,0.2)] hover:shadow-[0_0_20px_rgba(255,92,0,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Execute Plan Block</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setUseAlternative(prev => !prev)}
                      className="bg-[#111] hover:bg-[#1A1A1A] border border-[#222] hover:border-slate-700 text-slate-300 hover:text-white text-xs font-mono uppercase tracking-wider py-3.5 px-4 rounded-lg transition-all cursor-pointer"
                    >
                      {useAlternative ? "View Primary Plan" : "Switch to Alternative Option"}
                    </button>
                  </div>
                </div>

                {/* Daily Schedule Timeline Card */}
                <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#222] pb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-[#FF5C00]" />
                      <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Chronological Rebalanced Timeline</h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Energy Aligned Sequence</span>
                  </div>

                  {/* Timeline Blocks */}
                  <div className="space-y-4">
                    {data.timeBlocks.map((block) => {
                      const hasAssociated = !!block.associatedTaskId && tasks.some(t => t.id === block.associatedTaskId);
                      return (
                        <div 
                          key={block.id}
                          className="group bg-[#111] hover:bg-[#151515] border border-[#222] hover:border-slate-800 rounded-lg p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative"
                        >
                          <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${
                            block.type === "task-focus" ? "bg-[#FF5C00]" :
                            block.type === "break" ? "bg-[#34C759]" :
                            block.type === "meeting" ? "bg-[#007AFF]" : "bg-slate-600"
                          }`} />

                          <div className="space-y-1.5 pl-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-[#FF5C00] tracking-wider uppercase bg-[#FF5C00]/5 px-2 py-0.5 rounded border border-[#FF5C00]/10">
                                {block.timeRange}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 uppercase">
                                [{block.type}]
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white tracking-tight">{block.title}</h4>
                            <p className="text-xs text-slate-400 leading-relaxed max-w-xl">{block.description}</p>
                          </div>

                          {block.type === "task-focus" && hasAssociated && (
                            <button
                              onClick={() => handleStartAssociatedTask(block)}
                              className="sm:self-center bg-[#1C1C1E] group-hover:bg-[#FF5C00] text-slate-300 group-hover:text-black border border-[#2D2D30] group-hover:border-transparent px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 font-bold"
                            >
                              <span>Execute Sprint</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Side Panels */}
              <div className="space-y-6">
                {/* Burnout Forecasting Card */}
                <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#222] pb-4">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-[#FF5C00]" />
                      <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Burnout Radar & Forecast</h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Cognitive Safety</span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-4 bg-[#111] border border-[#222] rounded-lg text-center space-y-3 relative overflow-hidden">
                    <div className="space-y-1 z-10">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Calculated Weekly Risk</span>
                      <div className={`text-4xl font-black font-mono tracking-tighter ${
                        data.burnoutForecast.weeklyBurnoutRisk > 75 ? "text-[#FF3B30]" :
                        data.burnoutForecast.weeklyBurnoutRisk > 45 ? "text-[#FF9500]" : "text-[#34C759]"
                      }`}>
                        {data.burnoutForecast.weeklyBurnoutRisk}%
                      </div>
                      <div className={`text-[9px] font-mono uppercase font-bold px-2.5 py-1 rounded-full border inline-block ${getBurnoutRiskColor(data.burnoutForecast.weeklyBurnoutRisk)}`}>
                        {data.burnoutForecast.weeklyBurnoutRisk > 75 ? "HIGH OVERLOAD" :
                         data.burnoutForecast.weeklyBurnoutRisk > 45 ? "MODERATE PRESSURE" : "SECURE ENERGY"}
                      </div>
                    </div>
                  </div>

                  {/* Assessment */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <Info className="h-3.5 w-3.5 text-[#FF5C00]" /> Dynamic Assessment
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{data.burnoutForecast.burnoutAssessment}</p>
                  </div>

                  {/* Triggers */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-[#FF5C00]" /> Burnout Triggers
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-400">
                      {data.burnoutForecast.riskFactors.map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#FF5C00] mt-0.5">•</span>
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Remedies */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider flex items-center gap-1.5">
                      <TrendingDown className="h-3.5 w-3.5 text-[#34C759]" /> Protective Remedies
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-400">
                      {data.burnoutForecast.proactiveRemedies.map((remedy, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#34C759] mt-0.5">✓</span>
                          <span>{remedy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Trust & Transparency Panel */}
                <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#222] pb-4">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-[#FF5C00]" />
                      <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Trust & Transparency Audit</h3>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1 bg-[#111] p-3 rounded-lg border border-[#222]">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Trigger Explanation</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{data.trustReport.whyGenerated}</p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Parameters Evaluated</span>
                      <div className="flex flex-wrap gap-1.5">
                        {data.trustReport.factorsConsidered.map((factor, idx) => (
                          <span key={idx} className="text-[10px] font-mono bg-[#111] text-slate-300 border border-[#222] px-2 py-1 rounded">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0A0A0A] border border-[#111] rounded-xl p-16 text-center space-y-4">
              <HelpCircle className="h-8 w-8 text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">No Schedule Calculated</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">Trigger workload optimization to compile your cognitive shield timeline.</p>
              </div>
              <button
                onClick={() => fetchAdvice()}
                className="bg-[#111] border border-[#222] hover:border-[#FF5C00]/40 px-4 py-2 rounded text-xs text-white font-mono cursor-pointer transition-all uppercase"
              >
                Trigger Optimization
              </button>
            </div>
          )}
        </>
      )}

      {/* DIAGNOSTICS HUB SUB-TAB */}
      {subTab === "diagnostics" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#222] pb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#FF5C00]" />
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">AI System Health & Telemetry</h3>
            </div>
            <button
              onClick={fetchDiagnostics}
              disabled={loadingDiag}
              className="bg-[#111] hover:bg-[#1A1A1A] border border-[#222] px-3 py-1.5 rounded text-[10px] font-mono text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${loadingDiag ? "animate-spin" : ""}`} />
              <span>Refresh Diagnostics</span>
            </button>
          </div>

          {loadingDiag && !diagnostics ? (
            <div className="bg-[#0A0A0A] border border-[#111] rounded-xl p-16 flex justify-center items-center">
              <div className="h-8 w-8 border-2 border-[#FF5C00] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : diagnostics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* API Status */}
              <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-5 space-y-2 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">API Connection</span>
                  <Server className="h-4 w-4 text-[#FF5C00]" />
                </div>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full animate-pulse ${
                    diagnostics.status === "healthy" ? "bg-[#34C759]" : "bg-[#FF9500]"
                  }`} />
                  <span className="text-lg font-black font-mono uppercase text-white">{diagnostics.status}</span>
                </div>
                <p className="text-[10px] text-slate-400">Gemini endpoint active & responsive.</p>
              </div>

              {/* Latency */}
              <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-5 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Avg Latency</span>
                  <Clock className="h-4 w-4 text-[#FF5C00]" />
                </div>
                <p className="text-xl font-black font-mono text-white pt-1">{diagnostics.averageLatencyMs || 240} ms</p>
                <p className="text-[10px] text-slate-400">Average roundtrip network processing speed.</p>
              </div>

              {/* Cache hit ratio */}
              <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-5 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Cache Efficiency</span>
                  <Database className="h-4 w-4 text-[#FF5C00]" />
                </div>
                <p className="text-xl font-black font-mono text-white pt-1">{(diagnostics.cacheHitRatio * 100).toFixed(0)}%</p>
                <p className="text-[10px] text-slate-400">Unchanged scheduling requests serve instantly.</p>
              </div>

              {/* Budget / Cost */}
              <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-5 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Estimated Cost</span>
                  <Zap className="h-4 w-4 text-[#FF5C00]" />
                </div>
                <p className="text-xl font-black font-mono text-[#34C759] pt-1">${diagnostics.estimatedCostUsd || "0.000"}</p>
                <p className="text-[10px] text-slate-400">Calculated volume usage for current session.</p>
              </div>
            </div>
          ) : null}

          {/* Rate Limits & System Info Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#0A0A0A] border border-[#222] rounded-xl p-6 space-y-4">
              <h4 className="text-xs font-bold font-mono uppercase text-white tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#FF5C00]" />
                <span>Pacing Shield Protection Statistics</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                ShieldAI operates with integrated, server-authoritative API request caps to shield our cognitive systems and your cloud billing. The following rate ceilings are applied dynamically.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-[#111] border border-[#222] p-4 rounded-lg space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Requests / Minute</span>
                  <div className="text-lg font-black text-white">15 Limit</div>
                  <div className="text-[9px] font-mono text-[#34C759]">Burst Capacity Protected</div>
                </div>
                <div className="bg-[#111] border border-[#222] p-4 rounded-lg space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Requests / Hour</span>
                  <div className="text-lg font-black text-white">100 Limit</div>
                  <div className="text-[9px] font-mono text-slate-300">Sustainable Flow Threshold</div>
                </div>
                <div className="bg-[#111] border border-[#222] p-4 rounded-lg space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Requests / Day</span>
                  <div className="text-lg font-black text-white">500 Limit</div>
                  <div className="text-[9px] font-mono text-[#FF9500]">Enterprise Guard Active</div>
                </div>
              </div>

              <div className="bg-[#111] border border-[#222] p-4 rounded-lg flex items-center gap-3">
                <Info className="h-4 w-4 text-[#FF5C00] shrink-0" />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Concurrently Lock Protection Active:</strong> Multiple double-clicks of scheduler buttons are intercepted server-side immediately. Duplicate identical requests do not invoke duplicate AI reasoning, conserving your workspace limits.
                </p>
              </div>
            </div>

            {/* Model stats */}
            <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-6 space-y-4">
              <h4 className="text-xs font-bold font-mono uppercase text-white tracking-wider">API Profile</h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-[#222] pb-2 text-slate-400">
                  <span>Reasoning Model:</span>
                  <span className="font-mono text-white font-bold">{diagnostics?.currentModel || "gemini-2.5-flash"}</span>
                </div>
                <div className="flex justify-between border-b border-[#222] pb-2 text-slate-400">
                  <span>Session Calls:</span>
                  <span className="font-mono text-white">{diagnostics?.totalRequests || 0} API Calls</span>
                </div>
                <div className="flex justify-between border-b border-[#222] pb-2 text-slate-400">
                  <span>Cache Hit Count:</span>
                  <span className="font-mono text-[#34C759]">{diagnostics?.cacheHits || 0} Hits</span>
                </div>
                <div className="flex justify-between border-b border-[#222] pb-2 text-slate-400">
                  <span>Failed Queries:</span>
                  <span className="font-mono text-[#FF3B30]">{diagnostics?.failedRequestsCount || 0} Blocked</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Cost Multiplier:</span>
                  <span className="font-mono text-[#34C759]">1.0x (Standard)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI MEMORY & PRIVACY SUB-TAB */}
      {subTab === "memory" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#222] pb-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-[#FF5C00]" />
              <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">AI Memory & Privacy Controls</h3>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
            ShieldAI strictly respects user sovereignty. Personalization metrics (including speed multipliers across coding and design, and calculated focus durations) are dynamically learned locally to tailor future advisory. You maintain complete control over this data footprint.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Memory Audit View */}
            <div className="lg:col-span-2 space-y-6">
              {/* Learned Preferences */}
              <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-6 space-y-4">
                <h4 className="text-xs font-bold font-mono uppercase text-white tracking-wider flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#FF5C00]" />
                  <span>Learned Productivity Memory</span>
                </h4>

                {loadingMemory && !aiMemory ? (
                  <div className="flex justify-center p-8">
                    <div className="h-6 w-6 border-2 border-[#FF5C00] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : aiMemory ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-[#111] p-4 rounded-lg border border-[#222] space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Optimal Focus Window</span>
                        <p className="text-sm font-bold text-white">09:00 - 11:30 (Morning Peak)</p>
                      </div>
                      <div className="bg-[#111] p-4 rounded-lg border border-[#222] space-y-1">
                        <span className="text-[10px] font-mono text-slate-500 uppercase">Median Focus Duration</span>
                        <p className="text-sm font-bold text-white">{aiMemory.focusDuration || 45} Minutes</p>
                      </div>
                    </div>

                    {/* Patterns list */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Calibrated Productivity Patterns:</span>
                      {aiMemory.productivityPatterns && aiMemory.productivityPatterns.length > 0 ? (
                        <div className="space-y-2">
                          {aiMemory.productivityPatterns.map((pattern, idx) => (
                            <div key={idx} className="bg-[#111] border border-[#222] rounded-lg p-3 text-xs text-slate-300 flex items-start gap-2">
                              <span className="text-[#FF5C00] font-black">•</span>
                              <span>{pattern}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No custom patterns compiled yet. Complete focus cycles to calibrate.</p>
                      )}
                    </div>

                    {/* Frequently postponed */}
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Friction-Risk Milestone Categories (Learned):</span>
                      <div className="flex flex-wrap gap-2">
                        {aiMemory.frequentlyPostponedCategories && aiMemory.frequentlyPostponedCategories.length > 0 ? (
                          aiMemory.frequentlyPostponedCategories.map((cat, idx) => (
                            <span key={idx} className="text-xs font-mono bg-[#FF3B30]/5 text-[#FF3B30] border border-[#FF3B30]/20 px-3 py-1.5 rounded-lg">
                              ⚠ {cat} (High Procrastination Risk)
                            </span>
                          ))
                        ) : (
                          <span className="text-xs font-mono bg-[#34C759]/5 text-[#34C759] border border-[#34C759]/20 px-3 py-1.5 rounded-lg">
                            ✓ Zero Friction Patterns Detected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Memory Privacy Actions */}
              <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-6 space-y-4">
                <h4 className="text-xs font-bold font-mono uppercase text-white tracking-wider">User Sovereignty Actions</h4>
                <p className="text-xs text-slate-400">
                  Choose what personalized data stays inside your profile. These actions execute immediately.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleExportData}
                    className="flex-1 bg-[#111] hover:bg-[#1A1A1A] border border-[#222] hover:border-slate-700 p-3 rounded-lg text-xs text-white font-mono uppercase flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Download className="h-4 w-4 text-[#FF5C00]" />
                    <span>Export AI Footprint</span>
                  </button>
                  <button
                    onClick={handleResetPersonalization}
                    className="flex-1 bg-[#111] hover:bg-[#1A1A1A] border border-[#222] hover:border-[#FF9500]/30 p-3 rounded-lg text-xs text-white font-mono uppercase flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Settings className="h-4 w-4 text-[#FF9500]" />
                    <span>Reset Calibration</span>
                  </button>
                  <button
                    onClick={handleClearMemory}
                    className="flex-1 bg-[#111] hover:bg-[#1A1A1A] border border-[#FF3B30]/30 hover:border-[#FF3B30]/50 p-3 rounded-lg text-xs text-[#FF3B30] font-mono uppercase flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Trash2 className="h-4 w-4 text-[#FF3B30]" />
                    <span>Purge AI Memory</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Consent Settings Column */}
            <div className="space-y-6">
              <div className="bg-[#0A0A0A] border border-[#222] rounded-xl p-6 space-y-4">
                <h4 className="text-xs font-bold font-mono uppercase text-white tracking-wider flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#FF5C00]" />
                  <span>Privacy Shield Status</span>
                </h4>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between p-3.5 bg-[#111] border border-[#222] rounded-lg">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">Active Calibration</span>
                      <span className="text-[10px] text-slate-400 block">Adapt focus times based on sprints</span>
                    </div>
                    <button 
                      onClick={() => {
                        setMemoryConsent(!memoryConsent);
                        showSuccessBanner(memoryConsent ? "AI Active Calibration paused." : "AI Active Calibration resumed.");
                      }}
                      className="text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      {memoryConsent ? (
                        <ToggleRight className="h-8 w-8 text-[#FF5C00]" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-slate-600" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-2 p-3.5 bg-[#111] border border-dashed border-[#222] rounded-lg text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <ShieldCheck className="h-3.5 w-3.5 text-[#34C759]" />
                      <span>Security Standard Met</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      All AI data evaluation and memory profiling occurs on server-side isolated memory caches, protecting personal metrics from direct tracking tools or browser state sniffers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
