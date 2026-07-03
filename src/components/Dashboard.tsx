/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Clock, AlertTriangle, ShieldCheck, Flame, Compass, Play, 
  HelpCircle, Calendar, CheckSquare, PlusCircle, RefreshCw, Zap, ArrowRight, ArrowLeft, Trophy, Cpu
} from "lucide-react";
import { Task, Subtask } from "../types";

interface DashboardProps {
  tasks: Task[];
  activeTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEnterFocus: (subtask: Subtask) => void;
  onCalibrate: (task: Task) => void;
  onOpenCreateModal: () => void;
  userProfile?: any;
  learningProfile?: any;
  onApplyIntervention?: (type: "breakdown" | "reschedule" | "focus", interventionId: string) => void;
}

export default function Dashboard({
  tasks,
  activeTaskId,
  onSelectTask,
  onToggleSubtask,
  onEnterFocus,
  onCalibrate,
  onOpenCreateModal,
  userProfile,
  learningProfile,
  onApplyIntervention
}: DashboardProps) {
  const activeTask = tasks.find(t => t.id === activeTaskId) || null;
  const [countdownText, setCountdownText] = useState("");
  const [showRescue, setShowRescue] = useState(false);
  const [rescueNotice, setRescueNotice] = useState<string | null>(null);

  // Live countdown timer for the active task
  useEffect(() => {
    if (!activeTask) {
      setCountdownText("");
      return;
    }

    const updateCountdown = () => {
      const diffMs = new Date(activeTask.deadline).getTime() - Date.now();
      if (diffMs <= 0) {
        setCountdownText("Deadline reached");
        return;
      }

      const totalMins = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setCountdownText(`${days} day${days > 1 ? "s" : ""} and ${hours % 24} hr${hours % 24 > 1 ? "s" : ""} left`);
      } else {
        setCountdownText(`${hours}h ${mins}m ${secs}s remaining`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [activeTask]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Critical":
        return "text-red-500 bg-red-950/40 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
      case "High":
        return "text-orange-500 bg-orange-950/40 border-orange-500/30";
      case "Medium":
        return "text-yellow-500 bg-yellow-950/40 border-yellow-500/30";
      case "Low":
      default:
        return "text-emerald-500 bg-emerald-950/40 border-emerald-500/30";
    }
  };

  // Render glowing SVG Urgency curve
  const renderUrgencyCurve = () => {
    if (!activeTask || !activeTask.urgencyCurve || activeTask.urgencyCurve.length === 0) return null;
    
    const curve = activeTask.urgencyCurve;
    const width = 340;
    const height = 120;
    const padding = 20;

    const points = curve.map((pt, idx) => {
      const x = padding + (idx * (width - padding * 2)) / (curve.length - 1);
      const y = height - padding - (pt.urgency * (height - padding * 2)) / 100;
      return { x, y, label: pt.timeLabel, val: pt.urgency };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="bg-[#111] border border-[#222] rounded-xl p-4 select-none">
        <h5 className="text-[10px] font-mono uppercase tracking-widest text-[#FF5C00] flex items-center gap-1.5 mb-3 font-bold">
          <Clock className="h-3.5 w-3.5 text-[#FF5C00]" />
          Task Urgency Progression Curve
        </h5>
        
        <div className="relative flex items-center justify-center">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF5C00" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#FF5C00" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#334155" strokeWidth="0.5" strokeDasharray="3 3" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#1e293b" strokeWidth="0.5" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeWidth="0.5" />

            <path d={areaD} fill="url(#areaGrad)" />
            <path d={pathD} fill="none" stroke="#FF5C00" strokeWidth="2.5" className="drop-shadow-[0_0_5px_rgba(255,92,0,0.5)]" />

            {points.map((pt, idx) => (
              <g key={idx} className="group cursor-pointer">
                <circle cx={pt.x} cy={pt.y} r="4" fill="#FF5C00" stroke="#ffffff" strokeWidth="1" />
                <circle cx={pt.x} cy={pt.y} r="8" fill="#FF5C00" fillOpacity="0" className="hover:fill-opacity-20 transition-all duration-200" />
                <text x={pt.x} y={pt.y - 10} textAnchor="middle" className="text-[9px] font-mono fill-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  {pt.val}%
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="flex justify-between mt-1 px-4 text-[9px] font-mono text-slate-500">
          {curve.map((pt, idx) => (
            <span key={idx}>{pt.timeLabel}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div id="dashboard" className="space-y-6">
      {/* Overview stats bar & selector */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#111] border border-[#222] rounded-xl p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider">
            Monitor Mission:
          </label>
          {tasks.length === 0 ? (
            <span className="text-xs text-slate-500 italic">No missions active</span>
          ) : (
            <select
              value={activeTaskId || ""}
              onChange={(e) => onSelectTask(e.target.value)}
              className="bg-[#0A0A0A] border border-[#222] text-xs text-slate-100 rounded px-3 py-1.5 focus:outline-none focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] transition-all"
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.riskLevel} Risk)
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={onOpenCreateModal}
          className="bg-[#FF5C00] hover:bg-[#ff7526] text-black text-xs font-black uppercase tracking-wider px-4 py-2 rounded-none transition-all hover:shadow-[0_0_10px_rgba(255,92,0,0.4)] flex items-center gap-1.5 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" /> Analyze New Mission
        </button>
      </div>

      {rescueNotice && (
        <div className="bg-[#FF5C00]/10 border border-[#FF5C00]/30 text-slate-100 p-3 rounded flex items-center justify-between text-xs animate-fade-in font-mono">
          <span>
            <strong className="text-[#FF5C00] font-black">[RESCUE TRIGGER ACTIVATED]</strong> {rescueNotice}
          </span>
          <button 
            onClick={() => setRescueNotice(null)} 
            className="text-[#FF5C00] font-bold uppercase text-[10px] tracking-wider hover:text-[#ff7526] transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeTask ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Core Risk Profile Card, Urgency Curve, Gamification Streaks and Timing Habits */}
          <div className="space-y-6 lg:col-span-1">
            {/* Core Risk Profile Card */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                    Securing Mission
                  </span>
                  <h3 className="text-base font-bold text-slate-100 tracking-tight mt-1 line-clamp-1 font-serif italic">
                    {activeTask.title}
                  </h3>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border uppercase ${getRiskColor(activeTask.riskLevel)}`}>
                  {activeTask.riskLevel} Risk
                </span>
              </div>

              <div className="flex flex-col items-center py-4 select-none">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="62" className="stroke-slate-950 fill-none" strokeWidth="8" />
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="62" 
                      className={`fill-none transition-all duration-500 ${
                        activeTask.riskFactor > 75 ? "stroke-red-500" : activeTask.riskFactor > 40 ? "stroke-[#FF5C00]" : "stroke-emerald-500"
                      }`}
                      strokeWidth="8" 
                      strokeDasharray="390" 
                      strokeDashoffset={390 - (390 * activeTask.riskFactor) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center">
                    <span className="block text-3xl font-extrabold text-slate-100 font-mono tracking-tighter">
                      {activeTask.riskFactor}%
                    </span>
                    <span className="text-[8px] uppercase tracking-widest text-slate-500 block font-bold">
                      Failure Probability
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0A0A0A] border border-[#222] rounded p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="h-4 w-4 text-[#FF5C00]" />
                  <span className="font-mono text-slate-200">{countdownText}</span>
                </div>
                <button
                  onClick={() => onCalibrate(activeTask)}
                  title="Calibrate risk factor with Gemini AI"
                  className="p-1.5 hover:bg-[#111] rounded text-slate-400 hover:text-[#FF5C00] transition-colors flex items-center gap-1 text-[10px] font-mono border border-[#222] cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5 animate-[spin_4s_infinite_linear]" />
                  Recalculate
                </button>
              </div>

              {activeTask.assessment && (
                <div className="bg-[#FF5C00]/5 border border-[#FF5C00]/10 rounded p-3.5">
                  <h4 className="text-[10px] font-mono text-[#FF5C00] uppercase tracking-wider mb-1 font-bold flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Co-Founder's Assessment:
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed italic font-serif">
                    "{activeTask.assessment}"
                  </p>
                </div>
              )}
            </div>

            {/* Cognitive Energy Allocation & Burnout Risk Shield */}
            {activeTask && (
              <div className="bg-[#111] border border-[#222] rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#222]/40 pb-2">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-white flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-[#FF5C00]" />
                    Cognitive Safeguard
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Pacing Model
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#0A0A0A] border border-[#222] p-2.5 rounded">
                    <span className="text-[8px] font-mono uppercase text-slate-500 block">Mental Battery</span>
                    <span className="font-mono text-slate-200 font-bold block mt-1 uppercase flex items-center gap-1">
                      {activeTask.energyLevel === "low" ? "🪫 Depleted" : activeTask.energyLevel === "high" ? "🔋 Charged" : "⚡ Balanced"}
                    </span>
                  </div>
                  <div className="bg-[#0A0A0A] border border-[#222] p-2.5 rounded">
                    <span className="text-[8px] font-mono uppercase text-slate-500 block">Cognitive Burnout Risk</span>
                    <span className={`font-mono font-bold block mt-1 ${
                      (activeTask.burnoutRisk ?? 30) > 70 ? "text-red-500" : (activeTask.burnoutRisk ?? 30) > 40 ? "text-orange-500" : "text-emerald-400"
                    }`}>
                      {activeTask.burnoutRisk ?? 30}%
                    </span>
                  </div>
                </div>

                {activeTask.pacingSafetyRecommendation && (
                  <div className="bg-[#0A0A0A] border border-[#222] rounded p-3 text-[11px] leading-relaxed text-slate-300">
                    <div className="text-[9px] uppercase tracking-wider text-[#FF5C00] font-mono font-bold mb-1">
                      🛡️ Pacing Shield Recommendation:
                    </div>
                    "{activeTask.pacingSafetyRecommendation}"
                  </div>
                )}
              </div>
            )}

            {/* Gamification Streaks & Performance manual */}
            {userProfile && (
              <div className="bg-[#111] border border-[#222] rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#222]/40 pb-2">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-white flex items-center gap-1.5">
                    <Flame className="h-4 w-4 text-[#FF5C00]" />
                    Performance Record
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Streak: {userProfile.streak}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#0A0A0A] border border-[#222] p-2.5 rounded">
                    <span className="text-[8px] font-mono uppercase text-slate-500 block">Total Focus Time</span>
                    <span className="font-mono text-[#FF5C00] font-bold text-sm block mt-0.5">{userProfile.focusMinutesTotal} mins</span>
                  </div>
                  <div className="bg-[#0A0A0A] border border-[#222] p-2.5 rounded">
                    <span className="text-[8px] font-mono uppercase text-slate-500 block">Unlocked Milestones</span>
                    <span className="font-mono text-slate-200 font-bold text-sm block mt-0.5">{userProfile.unlockedMilestones?.length || 0} unlocked</span>
                  </div>
                </div>

                {userProfile.unlockedInsights && userProfile.unlockedInsights.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h5 className="text-[9px] font-mono uppercase text-slate-400 tracking-wider">Unlocked Performance Hacks</h5>
                    <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
                      {userProfile.unlockedInsights.map((insight: any) => (
                        <div key={insight.id} className="bg-[#0A0A0A] border border-emerald-500/20 rounded p-2.5">
                          <h6 className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                            <Trophy className="h-3 w-3 text-[#FF5C00]" />
                            {insight.title}
                          </h6>
                          <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">{insight.hack}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Adaptive Speed habits multiplier display */}
            {learningProfile && learningProfile.categories && (
              <div className="bg-[#111] border border-[#222] rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-1.5 border-b border-[#222]/40 pb-2">
                  <Cpu className="h-4 w-4 text-[#FF5C00]" />
                  <h4 className="text-xs font-bold font-mono uppercase tracking-widest text-white">
                    Adaptive timing profile
                  </h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  ShieldAI adapts timing budgets automatically as it measures your past focus completion rates.
                </p>

                <div className="space-y-2 pt-1">
                  {Object.keys(learningProfile.categories).map((catName) => {
                    const stat = learningProfile.categories[catName];
                    const speedMultiplier = stat.totalEstimatedMinutes > 0
                      ? Math.round((stat.totalActualMinutes / stat.totalEstimatedMinutes) * 100) / 100
                      : 1.0;

                    let statusText = "Buffered Pacing";
                    let color = "text-emerald-400";
                    if (speedMultiplier > 1.15) {
                      statusText = "Struggled (requires multiplier)";
                      color = "text-red-400";
                    } else if (speedMultiplier < 0.85) {
                      statusText = "Speedy (needs tighter deadlines)";
                      color = "text-cyan-400";
                    }

                    return (
                      <div key={catName} className="bg-[#0A0A0A] border border-[#222] p-2.5 rounded flex items-center justify-between text-xs font-mono">
                        <div>
                          <span className="font-bold text-slate-200 block">{catName}</span>
                          <span className={`text-[9px] block ${color}`}>{statusText}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Speed Coefficient</span>
                          <span className="font-bold text-[#FF5C00] block text-sm">{speedMultiplier}x</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {renderUrgencyCurve()}
          </div>

          {/* Column 2 & 3: Proactive Intervention, Tactical Milestones checklist */}
          <div className="space-y-6 lg:col-span-2">
            {/* PROACTIVE INTERVENTION SYSTEM CARD (IF IN HIGH RISK/CRITICAL) */}
            {activeTask.proactiveInterventions && activeTask.proactiveInterventions.length > 0 && (
              <div className="bg-gradient-to-r from-red-950/20 to-orange-950/20 border border-red-500/40 rounded-xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                  <div>
                    <h3 className="text-xs font-black tracking-widest uppercase text-red-400 font-mono">
                      Proactive Intervention suggestions
                    </h3>
                    <p className="text-[10px] text-slate-300">
                      Gemini's safety models analyzed a looming deadline breach risk. Deploy one of these measures immediately:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  {activeTask.proactiveInterventions.map((option) => (
                    <div key={option.id} className="bg-black/40 border border-red-500/10 p-3 rounded flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] font-mono text-red-400 uppercase tracking-widest block font-bold">
                          {option.type.toUpperCase()} VECTOR
                        </span>
                        <h4 className="text-xs font-bold text-slate-100 mt-1">{option.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{option.description}</p>
                      </div>

                      <button
                        onClick={() => onApplyIntervention && onApplyIntervention(option.type, option.id)}
                        className="mt-4 w-full bg-red-950/50 hover:bg-red-50 hover:text-black border border-red-500/30 text-red-300 font-bold uppercase text-[9px] tracking-wider py-1.5 transition-all cursor-pointer"
                      >
                        Enforce vector
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subtasks list card */}
            <div className="bg-[#111] border border-[#222] rounded-xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#222]/40 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2 font-serif italic">
                    <CheckSquare className="h-4 w-4 text-[#FF5C00]" />
                    Tactical Milestones Execution Plan
                  </h3>
                  <p className="text-xs text-slate-400">Mark off milestones. ShieldAI automatically updates risk indicators.</p>
                </div>
                <span className="text-xs font-mono text-[#FF5C00] font-bold">
                  {activeTask.subtasks.filter(s => s.completed).length}/{activeTask.subtasks.length} Done
                </span>
              </div>

              <div className="space-y-3">
                {activeTask.subtasks.map((sub, idx) => (
                  <div
                    key={sub.id}
                    className={`border rounded p-4 transition-all duration-300 flex items-start justify-between gap-4 ${
                      sub.completed
                        ? "bg-emerald-950/10 border-emerald-500/20 opacity-70"
                        : "bg-[#0A0A0A] border-[#222] hover:border-[#333]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onToggleSubtask(activeTask.id, sub.id)}
                        className="mt-0.5 cursor-pointer"
                      >
                        <div className={`h-5 w-5 rounded-none border flex items-center justify-center transition-colors ${
                          sub.completed
                            ? "bg-emerald-500 border-emerald-400 text-slate-950"
                            : "border-[#333] hover:border-[#FF5C00] bg-[#111]"
                        }`}>
                          {sub.completed && (
                            <svg className="h-3.5 w-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-500 font-bold">
                            Milestone 0{idx + 1}
                          </span>
                          <span className="text-slate-500 text-[10px]">•</span>
                          <span className="text-[10px] font-mono text-[#FF5C00] flex items-center gap-1 bg-[#FF5C00]/10 px-2 py-0.5 rounded border border-[#FF5C00]/10 font-bold">
                            {sub.durationMinutes} Mins
                          </span>
                          {sub.category && (
                            <span className="text-[10px] font-mono text-purple-400 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-500/10 font-bold uppercase">
                              {sub.category}
                            </span>
                          )}
                          {sub.suggestedTime && (
                            <span className="text-[10px] font-mono text-slate-400 bg-[#111] px-2 py-0.5 rounded border border-[#222]">
                              {sub.suggestedTime}
                            </span>
                          )}
                        </div>
                        <h4 className={`text-xs font-bold mt-1 transition-colors ${
                          sub.completed ? "text-slate-500 line-through" : "text-slate-100"
                        }`}>
                          {sub.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-sans">
                          {sub.description}
                        </p>
                      </div>
                    </div>

                    {!sub.completed && (
                      <button
                        onClick={() => onEnterFocus(sub)}
                        className="bg-[#FF5C00]/10 hover:bg-[#FF5C00] text-[#FF5C00] hover:text-black border border-[#FF5C00]/20 px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 hover:shadow-[0_0_8px_rgba(255,92,0,0.3)] cursor-pointer"
                      >
                        <Play className="h-3 w-3 fill-current" /> Focus Room
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Emergency Rescue Panel Toggle */}
              {activeTask.rescueTriggers && activeTask.rescueTriggers.length > 0 && (
                <div className="pt-2 border-t border-[#222]/40">
                  <button
                    onClick={() => setShowRescue(!showRescue)}
                    className="w-full bg-red-950/10 hover:bg-red-950/20 border border-red-500/20 hover:border-red-500/30 rounded p-3 flex items-center justify-between transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="h-4.5 w-4.5 text-red-500 animate-pulse" />
                      <div className="text-left">
                        <h4 className="text-xs font-black text-red-400 uppercase tracking-wider font-mono">
                          Emergency Rescue Activation Triggers
                        </h4>
                        <p className="text-[10px] text-slate-400 font-sans">
                          Falling behind? Tap to explore high-stakes scope recovery hacks.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-red-400 font-mono font-bold">
                      {showRescue ? "Collapse [-]" : "Expand [+]"}
                    </span>
                  </button>

                  {showRescue && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 animate-fade-in">
                      {activeTask.rescueTriggers.map((trig, index) => (
                        <div
                          key={index}
                          className="bg-[#0A0A0A] border border-red-950/30 rounded p-4 flex flex-col justify-between"
                        >
                          <div>
                            <span className="text-[9px] font-mono text-red-500 uppercase tracking-widest block font-bold">
                              Rescue Vector 0{index + 1}
                            </span>
                            <h4 className="text-xs font-bold text-slate-200 mt-1">
                              {trig.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-sans">
                              {trig.action}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => {
                              onCalibrate(activeTask); // triggering recalculations
                              setRescueNotice(`"${trig.title}" strategy has been initiated! Open the Active Co-Founder Channel to receive step-by-step guidance.`);
                            }}
                            className="mt-3 w-full bg-red-950/40 text-red-400 hover:bg-red-950/80 border border-red-500/20 py-1.5 rounded-none cursor-pointer font-bold uppercase text-[9px] tracking-wider transition-all"
                          >
                            Execute Rescue Strategy
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#111] border border-[#222] rounded-xl py-16 px-4 text-center max-w-lg mx-auto">
          <div className="relative w-14 h-14 bg-[#FF5C00]/10 border border-[#FF5C00]/20 rounded flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Clock className="h-7 w-7 text-[#FF5C00]" />
          </div>
          <h3 className="text-base font-bold text-slate-100 font-serif italic text-lg">No Active Mission Setup</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-[320px] mx-auto leading-relaxed font-sans">
            Welcome to ShieldAI. To launch your proactive protection system, enter your target objective and target deadline.
          </p>
          <button
            onClick={onOpenCreateModal}
            className="mt-6 bg-[#FF5C00] hover:bg-[#ff7526] text-black text-xs font-black uppercase tracking-wider px-5 py-2.5 rounded-none transition-all hover:shadow-[0_0_12px_rgba(255,92,0,0.4)] cursor-pointer"
          >
            Launch First Mission
          </button>
        </div>
      )}
    </div>
  );
}
