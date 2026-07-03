/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Clock, AlertTriangle, ShieldCheck, Flame, Play, CheckSquare, 
  PlusCircle, RefreshCw, Zap, ArrowRight, BookOpen, Award, 
  Activity, FileText, Brain, Calendar, ChevronRight, Sparkles, 
  TrendingUp, CheckCircle2, ListCollapse, BookOpenCheck, RotateCcw
} from "lucide-react";
import { Task, Subtask } from "../types";

interface CommandCenterProps {
  tasks: Task[];
  events: any[];
  energyLevel: "low" | "medium" | "high";
  onSetEnergyLevel: (level: "low" | "medium" | "high") => void;
  userProfile: any;
  onboarding: any;
  onEnterFocus: (subtask: Subtask, task: Task) => void;
  onSaveTasks: (updatedTasks: Task[]) => void;
  onSaveEvents: (updatedEvents: any[]) => void;
  setAiState: (state: "calm" | "thinking" | "alarm" | "motivating") => void;
  setAiMessage: (message: string) => void;
}

export default function CommandCenter({
  tasks,
  events,
  energyLevel,
  onSetEnergyLevel,
  userProfile,
  onboarding,
  onEnterFocus,
  onSaveTasks,
  onSaveEvents,
  setAiState,
  setAiMessage
}: CommandCenterProps) {
  // Goal and Academic states
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDeadline, setGoalDeadline] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [isSubmittingGoal, setIsSubmittingGoal] = useState(false);

  // Curriculum State
  const [syllabusText, setSyllabusText] = useState("");
  const [isAnalyzingSyllabus, setIsAnalyzingSyllabus] = useState(false);
  const [analyzedSyllabus, setAnalyzedSyllabus] = useState<any>(null);

  // Multi-Subject Planning States
  const [isGeneratingMultiPlan, setIsGeneratingMultiPlan] = useState(false);
  const [multiSubjectPlan, setMultiSubjectPlan] = useState<any>(null);

  // Multi-Task Scheduler State
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [dailySchedule, setDailySchedule] = useState<any>(null);
  const [replanningReason, setReplanningReason] = useState<string | null>(null);

  // Trigger initial scheduler optimization
  useEffect(() => {
    optimizeDailySchedule();
  }, [tasks.length, events.length, energyLevel]);

  // Optimize daily schedule call
  const optimizeDailySchedule = async (replanningContext?: { changed: boolean; reason: string }) => {
    setScheduleLoading(true);
    setAiState("thinking");
    setAiMessage(replanningContext ? `ShieldAI is recalculating your daily defense sequence: ${replanningContext.reason}...` : "Recalibrating daily execution program...");

    try {
      const response = await fetch("/api/ai/optimize-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks.filter(t => !t.completed),
          calendarEvents: events,
          energyLevel,
          onboarding,
          replanningContext
        })
      });

      if (!response.ok) throw new Error("Schedule optimization offline");
      const data = await response.json();
      setDailySchedule(data);
      setReplanningReason(replanningContext ? replanningContext.reason : null);
      
      setAiState("calm");
      setAiMessage(data.recommendedNextAction ? `Priority Locked: "${data.recommendedNextAction.title}". ${data.replanningExplanation}` : "Schedule updated successfully.");
    } catch (err) {
      console.error("Failed to optimize schedule:", err);
      setAiMessage("Bypassed scheduler optimization. Active list is ready for manual study blocks.");
      setAiState("calm");
    } finally {
      setScheduleLoading(false);
    }
  };

  // Trigger Automatic Replanning (e.g. missed session or finished early)
  const triggerReplanning = (type: "missed" | "early" | "deadline_shift") => {
    const reasonText = type === "missed" 
      ? "User missed a scheduled study session" 
      : type === "early" 
      ? "User completed a session ahead of time" 
      : "Deadline modification detected";
    
    optimizeDailySchedule({
      changed: true,
      reason: reasonText
    });
  };

  // Create Goal-Based Tasks call
  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    setIsSubmittingGoal(true);
    setAiState("thinking");
    setAiMessage(`Decomposing main objective: "${goalTitle}"...`);

    try {
      const response = await fetch("/api/ai/create-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: goalTitle,
          deadline: goalDeadline
        })
      });

      if (!response.ok) throw new Error("Goal creator module offline.");
      const data = await response.json();

      // Convert suggested subtasks into actual tasks (children of this Goal)
      const goalId = `goal-${Date.now()}`;
      
      // First, create the parent Goal Task itself
      const parentGoalTask: Task = {
        id: goalId,
        title: `Goal: ${goalTitle}`,
        deadline: new Date(goalDeadline).toISOString(),
        context: data.assessment || "High-level goal parent objective.",
        priority: "high",
        riskLevel: "Medium",
        riskFactor: 40,
        assessment: data.assessment,
        completed: false,
        createdAt: new Date().toISOString(),
        subtasks: [],
        burnoutRisk: 30,
        energyLevel: "medium"
      };

      // Convert suggests tasks to individual task objects with subtasks
      const childTasks: Task[] = data.suggestedSubtasks.map((item: any, index: number) => {
        const d = new Date();
        d.setDate(d.getDate() + (item.suggestedTimeOffsetDays || 1));
        return {
          id: `task-child-${Date.now()}-${index}`,
          title: item.title,
          deadline: d.toISOString(),
          context: `Parent Goal: ${goalTitle}. ${item.context}`,
          priority: item.priority || "medium",
          riskLevel: item.difficulty === "hard" ? "High" : "Medium",
          riskFactor: item.difficulty === "hard" ? 60 : 35,
          completed: false,
          createdAt: new Date().toISOString(),
          subtasks: [
            {
              id: `sub-c-${Date.now()}-${index}-1`,
              title: `Review Core Materials`,
              description: `Prepare notes, active recall indices, and reference textbooks.`,
              durationMinutes: Math.floor(item.durationMinutes * 0.3),
              completed: false,
              suggestedTime: "First 30%",
              category: item.category || "Planning"
            },
            {
              id: `sub-c-${Date.now()}-${index}-2`,
              title: `Core Problem Solving & Implementation`,
              description: item.context || "Implement core frameworks, write queries, or analyze slide decks.",
              durationMinutes: Math.floor(item.durationMinutes * 0.7),
              completed: false,
              suggestedTime: "Main Focus block",
              category: item.category || "Coding"
            }
          ],
          energyLevel: item.difficulty === "hard" ? "high" : "medium",
          burnoutRisk: item.difficulty === "hard" ? 55 : 30
        };
      });

      // Update state
      const updatedTasks = [parentGoalTask, ...childTasks, ...tasks];
      onSaveTasks(updatedTasks);

      setGoalTitle("");
      setAiState("motivating");
      setAiMessage(`Success: Created Parent Goal "${goalTitle}" and generated ${childTasks.length} optimized academic subtasks chronologically aligned!`);
    } catch (err: any) {
      console.error(err);
      setAiMessage("Failed to connect with academic mentor core. Created generic goal template locally.");
      setAiState("calm");
    } finally {
      setIsSubmittingGoal(false);
    }
  };

  // Analyze Syllabus call
  const handleAnalyzeSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syllabusText.trim()) return;

    setIsAnalyzingSyllabus(true);
    setAiState("thinking");
    setAiMessage("Decoding syllabus topics, estimating study hours, and mapping revision dependencies...");

    try {
      const response = await fetch("/api/ai/analyze-syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: syllabusText })
      });

      if (!response.ok) throw new Error("Syllabus analyser offline.");
      const data = await response.json();
      setAnalyzedSyllabus(data);

      setAiState("motivating");
      setAiMessage(`Analysis Complete: Detected "${data.subjectName}" covering ${data.units?.length || 0} Units. Estimated ${data.estimatedStudyHours} total study hours required.`);
    } catch (err) {
      console.error(err);
      setAiMessage("Failed to analyze syllabus notes. Bypassed to offline model.");
      setAiState("calm");
    } finally {
      setIsAnalyzingSyllabus(false);
    }
  };

  // Convert Analyzed Syllabus into Tasks
  const handleAddSyllabusToPlan = () => {
    if (!analyzedSyllabus) return;

    const newSyllabusTasks: Task[] = [];
    analyzedSyllabus.units.forEach((unit: any, uIdx: number) => {
      unit.topics.forEach((topic: any, tIdx: number) => {
        const taskDeadlineDate = new Date();
        taskDeadlineDate.setDate(taskDeadlineDate.getDate() + (uIdx * 2) + 1);

        newSyllabusTasks.push({
          id: `syllabus-task-${Date.now()}-${uIdx}-${tIdx}`,
          title: `${analyzedSyllabus.subjectName} - Unit ${unit.number}: ${topic.name}`,
          deadline: taskDeadlineDate.toISOString(),
          context: `Study Unit from analyzed curriculum notes. Important concepts: ${topic.importantConcepts?.join(", ") || "None"}. Dependencies: ${topic.dependencies?.join(", ") || "None"}.`,
          priority: topic.difficulty === "hard" ? "high" : "medium",
          riskLevel: topic.difficulty === "hard" ? "High" : "Medium",
          riskFactor: topic.difficulty === "hard" ? 55 : 30,
          completed: false,
          createdAt: new Date().toISOString(),
          subtasks: [
            {
              id: `syll-sub-${Date.now()}-${uIdx}-${tIdx}-1`,
              title: `Active Recall Concept Drilling`,
              description: `Practice the following concepts: ${topic.importantConcepts?.join(", ") || "Vocabulary list"}.`,
              durationMinutes: Math.floor(topic.estimatedHours * 30),
              completed: false,
              suggestedTime: "First 50%",
              category: "Research"
            },
            {
              id: `syll-sub-${Date.now()}-${uIdx}-${tIdx}-2`,
              title: `Practice Exam Sprints`,
              description: `Solve 3-4 structural exam problems relating to ${topic.name}.`,
              durationMinutes: Math.floor(topic.estimatedHours * 30),
              completed: false,
              suggestedTime: "Second 50%",
              category: "Testing"
            }
          ],
          energyLevel: topic.difficulty === "hard" ? "high" : "medium"
        });
      });
    });

    onSaveTasks([...newSyllabusTasks, ...tasks]);
    setAiMessage(`Success: Imported ${newSyllabusTasks.length} topics from the ${analyzedSyllabus.subjectName} syllabus directly into your daily schedule!`);
    setAnalyzedSyllabus(null);
    setSyllabusText("");
  };

  // Optimize Multi-Subject Planning call
  const handleOptimizeMultiPlan = async () => {
    // Collect all subjects currently in tasks
    const uniqueSubjects = Array.from(new Set(tasks.map(t => t.title.split("-")[0].trim())));
    if (uniqueSubjects.length === 0) {
      setAiMessage("Create at least 1 goal or academic task first to run multi-subject exam optimization.");
      return;
    }

    setIsGeneratingMultiPlan(true);
    setAiState("thinking");
    setAiMessage("Analyzing multi-subject deadlines, workload overlapping, and exam urgency constraints...");

    try {
      const subjectObjects = uniqueSubjects.map((sub, idx) => ({
        name: sub,
        deadline: new Date(Date.now() + (idx + 1) * 3 * 24 * 60 * 60 * 1000).toISOString()
      }));

      const response = await fetch("/api/ai/multi-subject-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects: subjectObjects,
          preparations: tasks.map(t => ({ title: t.title, completed: t.completed, risk: t.riskLevel }))
        })
      });

      if (!response.ok) throw new Error("Multi-subject planning offline");
      const data = await response.json();
      setMultiSubjectPlan(data);

      setAiState("motivating");
      setAiMessage(`Optimized plan synthesized. Weakest focus is identified as "${data.weakestSubject}". Overlap leverages applied!`);
    } catch (err) {
      console.error(err);
      setAiMessage("Failed to generate multi-subject study plan. Please verify core connection.");
      setAiState("calm");
    } finally {
      setIsGeneratingMultiPlan(false);
    }
  };

  // Mark timeline session completed
  const handleToggleSessionComplete = (sessionIdx: number) => {
    if (!dailySchedule || !dailySchedule.todaySessions) return;
    const updatedSessions = [...dailySchedule.todaySessions];
    const item = updatedSessions[sessionIdx];
    item.completed = !item.completed;

    setDailySchedule({
      ...dailySchedule,
      todaySessions: updatedSessions
    });

    // Fire replanning when user finishes early
    if (item.completed) {
      triggerReplanning("early");
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. DAILY COMMAND CENTER - MAIN BENTO LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core Widget A: Active Pacing Status */}
        <div className="bg-[#111111] border border-[#222] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[160px] shadow-lg">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF5C00]/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#888] tracking-widest block font-bold">COGNITIVE ENERGY PROFILE</span>
            <h3 className="text-xl font-black text-white italic uppercase font-serif tracking-tight flex items-center gap-1.5">
              <Zap className="h-5 w-5 text-[#FF5C00] animate-pulse" />
              Pacer Shield Active
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Energy is reported as <strong className="text-white uppercase font-mono">{energyLevel}</strong>. Daily pace adjusted to protect mental batteries.
            </p>
          </div>
          <div className="flex gap-2 pt-3">
            {(["low", "medium", "high"] as const).map((level) => (
              <button
                key={level}
                onClick={() => onSetEnergyLevel(level)}
                className={`flex-1 py-1.5 px-2 font-mono text-[9px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                  energyLevel === level 
                    ? "bg-[#FF5C00] text-black border-[#FF5C00]" 
                    : "bg-black text-slate-400 border-[#222] hover:border-[#444]"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Core Widget B: AI Burnout Risk Meter */}
        <div className="bg-[#111111] border border-[#222] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[160px] shadow-lg">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#888] tracking-widest block font-bold">BURNOUT & PREPARATION ASSESSMENT</span>
            <div className="flex items-baseline justify-between">
              <h3 className="text-2xl font-black tracking-tighter text-white italic uppercase font-serif">
                {dailySchedule ? `${dailySchedule.burnoutRisk}%` : "32%"}
              </h3>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 border font-bold ${
                (dailySchedule?.burnoutRisk || 32) > 60 
                  ? "bg-red-950/40 text-red-400 border-red-500/20" 
                  : "bg-emerald-950/40 text-emerald-400 border-emerald-500/20"
              }`}>
                {(dailySchedule?.burnoutRisk || 32) > 60 ? "Critical Danger" : "Stable Buffer"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Remaining workload: <strong className="text-white">{dailySchedule?.remainingWorkloadHours || "4.5"} hours</strong>. Recommended pace includes defensive pacing breaks.
            </p>
          </div>
          <div className="w-full bg-[#1A1A1A] h-1.5 mt-4 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                (dailySchedule?.burnoutRisk || 32) > 60 ? "bg-red-500" : "bg-[#FF5C00]"
              }`} 
              style={{ width: `${dailySchedule?.burnoutRisk || 32}%` }}
            ></div>
          </div>
        </div>

        {/* Core Widget C: System Active Alerts */}
        <div className="bg-[#111111] border border-[#222] rounded-xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[160px] shadow-lg">
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-[#888] tracking-widest block font-bold">MISSION CONSTRAINTS & RISK ALERTS</span>
            <div className="space-y-1.5 max-h-[100px] overflow-y-auto">
              {dailySchedule?.riskAlerts && dailySchedule.riskAlerts.length > 0 ? (
                dailySchedule.riskAlerts.map((alert: string, index: number) => (
                  <div key={index} className="flex items-start gap-1.5 text-[10px] text-orange-400 font-mono">
                    <AlertTriangle className="h-3 w-3 text-[#FF5C00] shrink-0 mt-0.5 animate-pulse" />
                    <span>{alert}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Sovereign pacing systems: Nominal. No conflicts.</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-[9px] font-mono text-slate-500 pt-2 border-t border-[#222]">
            Active Tasks: {tasks.filter(t => !t.completed).length} | Completed: {tasks.filter(t => t.completed).length}
          </div>
        </div>

      </div>

      {/* 2. DYNAMIC SCHEDULE & DECISION PLANNER */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Left 3 Columns: Recommendations & Schedule */}
        <div className="xl:col-span-3 space-y-6">
          
          {/* AI Decision Explanation Banner */}
          {dailySchedule?.recommendedNextAction && (
            <div className="bg-gradient-to-r from-orange-950/20 to-black border border-[#FF5C00]/30 rounded-xl p-5 shadow-xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5C00]/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex items-start gap-3 justify-between">
                <div className="flex items-start gap-2.5">
                  <Brain className="h-5 w-5 text-[#FF5C00] shrink-0 mt-1" />
                  <div>
                    <span className="text-[9px] font-mono text-[#FF5C00] uppercase tracking-widest font-black block">
                      AI CRITICAL DECISION RECOMMENDATION
                    </span>
                    <h4 className="text-sm font-black text-slate-100 tracking-tight mt-0.5 uppercase">
                      {dailySchedule.recommendedNextAction.title}
                    </h4>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-slate-500 block">AI CONFIDENCE SCORE</span>
                  <span className="text-sm font-black text-[#FF5C00] font-serif">{dailySchedule.recommendedNextAction.confidenceScore}%</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[#FF5C00]/10 text-xs text-slate-300 leading-relaxed font-sans">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-wider font-bold">Why This Was Selected:</span>
                  <p className="mt-1 text-slate-200">{dailySchedule.recommendedNextAction.reason}</p>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-wider font-bold">Strategic Impact:</span>
                  <p className="mt-1 text-slate-200">{dailySchedule.recommendedNextAction.impact}</p>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-wider font-bold">Postponed Alternative Mitigation:</span>
                  <p className="mt-1 text-slate-200">{dailySchedule.recommendedNextAction.postponedAlternativeReason}</p>
                </div>
              </div>

              {replanningReason && (
                <div className="bg-black/40 border border-[#FF5C00]/10 px-3 py-1.5 rounded text-[10px] font-mono text-orange-400 flex items-center justify-between">
                  <span>AUTOPILOT REPLANNING ENGAGED: Recalculated due to: "{replanningReason}"</span>
                  <button onClick={() => setReplanningReason(null)} className="hover:text-white uppercase font-bold text-[8px]">Dismiss</button>
                </div>
              )}
            </div>
          )}

          {/* Today's study sessions timeline list */}
          <div className="bg-[#111111] border border-[#222] rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#222]/60 pb-4 gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2 font-serif italic text-lg">
                  <Calendar className="h-5 w-5 text-[#FF5C00]" />
                  Today's Optimized Study Timeline & Execution Checklist
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Do not think or decide what to do next. Simply follow the timeline sequence created by the Academic Planner.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => optimizeDailySchedule()}
                  disabled={scheduleLoading}
                  className="bg-[#111] hover:bg-[#1A1A1A] border border-[#333] hover:border-[#FF5C00]/30 text-xs font-bold text-slate-300 hover:text-[#FF5C00] uppercase tracking-wider px-3.5 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${scheduleLoading ? "animate-spin" : ""}`} />
                  Force Optimise
                </button>
                <button
                  onClick={() => triggerReplanning("missed")}
                  className="bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Missed Session
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {dailySchedule?.todaySessions && dailySchedule.todaySessions.length > 0 ? (
                dailySchedule.todaySessions.map((session: any, index: number) => {
                  const isBreak = session.type === "break";
                  return (
                    <div
                      key={index}
                      className={`border p-4 transition-all duration-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                        session.completed
                          ? "bg-emerald-950/10 border-emerald-500/20 opacity-70"
                          : isBreak
                          ? "bg-[#070707] border-[#222]/40 border-dashed"
                          : "bg-black border-[#222] hover:border-[#333]"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <button
                          onClick={() => handleToggleSessionComplete(index)}
                          className="mt-0.5 cursor-pointer"
                        >
                          <div className={`h-5 w-5 rounded-none border flex items-center justify-center transition-colors ${
                            session.completed
                              ? "bg-emerald-500 border-emerald-400 text-slate-950"
                              : "border-[#333] hover:border-[#FF5C00] bg-[#111]"
                          }`}>
                            {session.completed && (
                              <svg className="h-3.5 w-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono text-[#FF5C00] font-bold bg-[#FF5C00]/10 px-2 py-0.5 border border-[#FF5C00]/10">
                              {session.timeLabel}
                            </span>
                            <span className="text-slate-600 text-[10px]">•</span>
                            <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-900 px-2 py-0.5 border border-slate-800">
                              {session.durationMinutes} Mins
                            </span>
                            {session.difficulty && (
                              <span className={`text-[9px] font-mono uppercase px-2 py-0.5 border font-bold ${
                                session.difficulty === "hard" ? "text-orange-400 border-orange-500/20 bg-orange-950/20" : "text-slate-400 border-slate-800"
                              }`}>
                                {session.difficulty} difficulty
                              </span>
                            )}
                            <span className="text-[9px] font-mono text-purple-400 bg-purple-950/20 px-2 py-0.5 border border-purple-500/10 uppercase tracking-widest font-black">
                              {session.type}
                            </span>
                          </div>

                          <h4 className={`text-sm font-bold mt-1.5 tracking-tight ${
                            session.completed ? "text-slate-500 line-through" : "text-slate-100"
                          }`}>
                            {session.title}
                          </h4>
                        </div>
                      </div>

                      {!session.completed && !isBreak && (
                        <button
                          onClick={() => {
                            // Find matching task inside tasks array or create default focus subtask
                            const matchingTask = tasks[0] || null;
                            const fSub: Subtask = {
                              id: `sched-focus-${index}`,
                              title: session.title,
                              description: `Scheduled study block on timeline. Complexity: ${session.difficulty}`,
                              durationMinutes: session.durationMinutes,
                              suggestedTime: session.timeLabel,
                              completed: false
                            };
                            onEnterFocus(fSub, matchingTask);
                          }}
                          className="bg-[#FF5C00]/10 hover:bg-[#FF5C00] text-[#FF5C00] hover:text-black border border-[#FF5C00]/20 px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-center hover:shadow-[0_0_8px_rgba(255,92,0,0.3)] cursor-pointer"
                        >
                          <Play className="h-3 w-3 fill-current" /> Study Coach Mode
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  No scheduled study sessions for today. Add tasks or goals above to optimize your timeline.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right 1 Column: Actions Rail */}
        <div className="xl:col-span-1 space-y-6">
          
          {/* Goal Architect Form */}
          <div className="bg-[#111111] border border-[#222] rounded-xl p-5 shadow-xl space-y-4">
            <div className="border-b border-[#222]/60 pb-3">
              <h3 className="text-xs font-black tracking-widest uppercase text-white font-mono flex items-center gap-1.5">
                <Award className="h-4 w-4 text-[#FF5C00]" />
                Goal-Based Architect
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Enter high-level academic/life goals. AI will break them down into structured milestone tasks.
              </p>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-500 font-bold block mb-1">GOAL TITLE / STATEMENT</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S Grade in DBMS"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full bg-black border border-[#222] focus:border-[#FF5C00]/50 text-slate-200 text-xs px-3.5 py-2.5 transition-all outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-mono text-slate-500 font-bold block mb-1">TARGET DEADLINE / DATE</label>
                <input
                  type="date"
                  required
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="w-full bg-black border border-[#222] focus:border-[#FF5C00]/50 text-slate-200 text-xs px-3.5 py-2.5 transition-all outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingGoal}
                className="w-full bg-[#FF5C00] hover:bg-[#ff7526] text-black font-black uppercase text-xs tracking-wider py-2.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingGoal ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Generating Curriculum...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-3.5 w-3.5" />
                    Formulate Parent Goal
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Academic Syllabus Document Analyzer Form */}
          <div className="bg-[#111111] border border-[#222] rounded-xl p-5 shadow-xl space-y-4">
            <div className="border-b border-[#222]/60 pb-3">
              <h3 className="text-xs font-black tracking-widest uppercase text-white font-mono flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-[#FF5C00]" />
                Curriculum Analyzer
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Upload or paste syllabus text, notes, or course guidelines. The AI will extract units and study dependencies.
              </p>
            </div>

            <form onSubmit={handleAnalyzeSyllabus} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-500 font-bold block mb-1">Syllabus Text / Notes Details</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Paste syllabus, Units list, Lecture slides notes, list of topics, or questions..."
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  className="w-full bg-black border border-[#222] focus:border-[#FF5C00]/50 text-slate-200 text-xs px-3 py-2 transition-all outline-none resize-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isAnalyzingSyllabus}
                className="w-full bg-black hover:bg-[#111] border border-[#333] hover:border-[#FF5C00]/40 text-[#F5F5F5] hover:text-white font-bold uppercase text-[10px] tracking-widest py-2.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAnalyzingSyllabus ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Analyzing Curriculum...
                  </>
                ) : (
                  <>
                    <Brain className="h-3.5 w-3.5 text-[#FF5C00]" />
                    Run Document Audit
                  </>
                )}
              </button>
            </form>

            {analyzedSyllabus && (
              <div className="bg-black border border-[#FF5C00]/20 p-4 space-y-3 text-xs animate-fade-in">
                <div className="flex items-center justify-between border-b border-[#222] pb-2">
                  <span className="font-bold text-white uppercase text-[11px] tracking-tight">{analyzedSyllabus.subjectName}</span>
                  <span className="text-[9px] font-mono text-[#FF5C00] uppercase font-bold">{analyzedSyllabus.difficulty}</span>
                </div>
                
                <div className="space-y-2 max-h-[160px] overflow-y-auto font-sans leading-relaxed">
                  {analyzedSyllabus.units?.map((unit: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <span className="font-mono text-[9px] text-[#FF5C00] block font-bold">Unit {unit.number}: {unit.title}</span>
                      <ul className="list-disc list-inside text-slate-400 pl-1.5 space-y-0.5 text-[10px]">
                        {unit.topics?.map((topic: any, tIdx: number) => (
                          <li key={tIdx}>
                            {topic.name} ({topic.estimatedHours} hrs)
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#222] pt-2 text-[10px] text-slate-400">
                  <strong>Revision Plan:</strong> {analyzedSyllabus.revisionRequirements}
                </div>

                <button
                  onClick={handleAddSyllabusToPlan}
                  className="w-full bg-[#FF5C00] hover:bg-[#ff7526] text-black font-black uppercase text-[9px] tracking-wider py-1.5 transition-all cursor-pointer"
                >
                  Add curriculum to Study Plan
                </button>
              </div>
            )}
          </div>

          {/* Multi-Subject Planner Trigger */}
          <div className="bg-[#111111] border border-[#222] rounded-xl p-5 shadow-xl space-y-4">
            <div className="border-b border-[#222]/60 pb-3">
              <h3 className="text-xs font-black tracking-widest uppercase text-white font-mono flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#FF5C00]" />
                Multi-Subject Planner
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                Analyze ALL study subjects together to find the weakest, earliest exams, and build a master unified schedule.
              </p>
            </div>

            <button
              onClick={handleOptimizeMultiPlan}
              disabled={isGeneratingMultiPlan}
              className="w-full bg-black hover:bg-[#111] border border-[#333] hover:border-[#FF5C00]/30 text-slate-300 hover:text-[#FF5C00] font-bold uppercase text-[10px] tracking-wider py-2.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FF5C00] animate-pulse" />
              Build Unified Plan
            </button>

            {multiSubjectPlan && (
              <div className="bg-black border border-[#FF5C00]/20 p-4 space-y-3 text-xs animate-fade-in font-sans">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">WEAKEST ANGLE ALERT</span>
                  <span className="font-bold text-red-400 font-mono text-[11px] block">{multiSubjectPlan.weakestSubject}</span>
                </div>
                
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">EARLIEST DEADLINE CHALLENGE</span>
                  <span className="font-bold text-[#FF5C00] font-mono text-[11px] block">{multiSubjectPlan.earliestExam}</span>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">
                  <strong>Overlap Leverage:</strong> {multiSubjectPlan.overlapInsights}
                </p>

                <div className="border-t border-[#222] pt-2 space-y-1">
                  <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold">SUGGESTED SEQUENCE</span>
                  <div className="flex flex-col gap-1 text-[10px]">
                    {multiSubjectPlan.studyPlan?.map((item: any, idx: number) => (
                      <div key={idx} className="bg-[#111] p-1.5 rounded border border-[#222] flex flex-col gap-0.5">
                        <span className="font-bold text-slate-200">{item.subject}</span>
                        <span className="text-[9px] text-[#FF5C00] font-mono">{item.topic} ({item.durationMinutes}m)</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 italic">
                  {multiSubjectPlan.explanation}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
