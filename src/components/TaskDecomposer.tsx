/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, Calendar, Clock, Send, AlertCircle, FileText } from "lucide-react";
import { Task } from "../types";

interface TaskDecomposerProps {
  onDecomposeComplete: (newTask: Task) => void;
  userHabits?: any;
}

export default function TaskDecomposer({ onDecomposeComplete, userHabits }: TaskDecomposerProps) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [context, setContext] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("high");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper to quickly set short deadlines for easy testing/demo
  const setQuickDeadline = (hours: number) => {
    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + hours);
    
    // Format to local datetime-local input string (YYYY-MM-DDTHH:MM)
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const hh = String(targetDate.getHours()).padStart(2, '0');
    const mm = String(targetDate.getMinutes()).padStart(2, '0');
    
    setDeadline(`${year}-${month}-${day}T${hh}:${mm}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please specify what mission needs securing.");
      return;
    }
    if (!deadline) {
      setError("Please specify the exact target deadline.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, deadline, context, priority, userHabits }),
      });

      if (!response.ok) {
        throw new Error("Gemini AI failed to build a safety profile.");
      }

      const rawData = await response.json();
      
      const subtasks = (rawData.subtasks || []).map((s: any) => ({
        ...s,
        completed: false,
      }));

      const newTask: Task = {
        id: "task-" + Date.now(),
        title,
        deadline,
        context,
        priority,
        riskLevel: rawData.riskLevel || "High",
        riskFactor: rawData.riskFactor || 70,
        assessment: rawData.assessment,
        urgencyCurve: rawData.urgencyCurve,
        subtasks,
        rescueTriggers: rawData.rescueTriggers,
        createdAt: new Date().toISOString(),
        completed: false,
      };

      onDecomposeComplete(newTask);
      
      // Clear fields
      setTitle("");
      setDeadline("");
      setContext("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to decompose mission. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="task-decomposer" className="bg-[#111] border border-[#222] rounded-xl p-6 shadow-xl">
      <div className="flex items-center gap-3 mb-5 border-b border-[#222] pb-3">
        <div className="p-2 bg-[#FF5C00]/10 border border-[#FF5C00]/30 rounded-lg">
          <Sparkles className="h-5 w-5 text-[#FF5C00]" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-100 tracking-tight font-serif italic text-lg">Active Deadline Analyzer</h3>
          <p className="text-xs text-slate-400">Insert any target and let Gemini design an unbreakable execution plan.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 px-4">
          <div className="relative w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#FF5C00]/30 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border border-[#FF5C00] animate-pulse bg-[#FF5C00]/10"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-[#FF5C00] animate-bounce" />
          </div>
          <span className="text-sm font-medium text-slate-200">Decomposing Tactical Milestones...</span>
          <p className="text-xs text-slate-400 text-center mt-2 max-w-[280px]">
            Gemini is plotting risk matrices, estimating step buffers, and formatting urgency schedules.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider font-mono">
              What is the target objective?
            </label>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Finalize Pitch Deck, Deploy Cloud Run backend..."
                className="w-full bg-[#0A0A0A] border border-[#222] focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded px-4 py-3 text-sm text-slate-100 placeholder-slate-600 transition-colors outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider font-mono">
                Target Deadline
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-[#222] focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded px-4 py-3 text-sm text-slate-100 transition-colors [color-scheme:dark] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider font-mono">
                Priority Threshold
              </label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#222] focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded px-4 py-3 text-sm text-slate-100 transition-colors [color-scheme:dark] outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority (Normal)</option>
                <option value="critical">Critical Deadline (Launch/Pitch)</option>
              </select>
            </div>
          </div>

          {/* Quick Sandbox Deadline buttons */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider font-mono">
              ⚡ Demo Time-Warp Sandbox
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setQuickDeadline(0.5)} // 30 mins
                className="px-3 py-1 bg-[#0A0A0A] border border-[#222] hover:border-red-500/40 hover:bg-[#1A1A1A] text-xs text-red-400 rounded transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Clock className="h-3 w-3" /> 30 Mins (CRITICAL CRUNCH)
              </button>
              <button
                type="button"
                onClick={() => setQuickDeadline(2)} // 2 hours
                className="px-3 py-1 bg-[#0A0A0A] border border-[#222] hover:border-[#FF5C00]/40 hover:bg-[#1A1A1A] text-xs text-[#FF5C00] rounded transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Clock className="h-3 w-3" /> 2 Hours (HIGH RISK)
              </button>
              <button
                type="button"
                onClick={() => setQuickDeadline(24)} // tomorrow
                className="px-3 py-1 bg-[#0A0A0A] border border-[#222] hover:border-emerald-500/40 hover:bg-[#1A1A1A] text-xs text-emerald-400 rounded transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Calendar className="h-3 w-3" /> 1 Day (NORMAL BUFFER)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider font-mono">
              Additional Scope Details / Constraints
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="e.g., Must integrate Firebase Auth, only have 1 active developer, using pre-configured layout..."
              rows={2}
              className="w-full bg-[#0A0A0A] border border-[#222] focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded px-4 py-3 text-sm text-slate-100 placeholder-slate-600 transition-colors resize-none outline-none"
            />
          </div>

          {error && (
            <div className="bg-red-950/30 border border-red-500/30 rounded p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span className="text-xs text-red-300">{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#FF5C00] hover:bg-[#ff7526] text-black py-3 rounded-none text-xs font-black uppercase tracking-wider transition-all hover:shadow-[0_0_15px_rgba(255,92,0,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="h-4 w-4" /> Start Active Monitoring
          </button>
        </form>
      )}
    </div>
  );
}
