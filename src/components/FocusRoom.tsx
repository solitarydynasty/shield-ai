/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, Flame, ShieldAlert, CheckCircle, Moon } from "lucide-react";
import { Subtask, FocusSession } from "../types";

interface FocusRoomProps {
  activeSubtask: Subtask | null;
  onSessionComplete: (session: FocusSession) => void;
  onExit: () => void;
}

export default function FocusRoom({ activeSubtask, onSessionComplete, onExit }: FocusRoomProps) {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60); // Default 25 min Pomodoro
  const [isActive, setIsActive] = useState(false);
  const [ambientSound, setAmbientSound] = useState<"none" | "binaural" | "storm" | "cyberpunk">("none");
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);
  const [streak, setStreak] = useState(3); // Mock initial streak for gamification
  const [encouragement, setEncouragement] = useState("Let's secure this block. No distractions, partner.");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeSubtask) {
      // Set to suggested duration or default to 25 mins
      const minutes = activeSubtask.durationMinutes || 25;
      setSecondsLeft(minutes * 60);
    }
  }, [activeSubtask]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleTimerExpiry();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  // AI encouragement changes dynamically based on time remaining or randomly
  useEffect(() => {
    if (!isActive) return;

    const phrases = [
      "Keep pushing. Procrastination is the only threat to our launch.",
      "The neural core is locked onto your progress. Stay on this tab.",
      "You are 40% more efficient when in Shield focus. Keep it up.",
      "Your Technical Co-founder is proud of this deep work block.",
      "Ignore the notifications. They are passive; we are active."
    ];

    const phraseInterval = setInterval(() => {
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];
      setEncouragement(phrase);
    }, 20000);

    return () => clearInterval(phraseInterval);
  }, [isActive]);

  const handleTimerExpiry = () => {
    setIsActive(false);
    setCompletedSessionsCount(prev => prev + 1);
    setStreak(prev => prev + 1);
    
    const newSession: FocusSession = {
      id: "session-" + Date.now(),
      subtaskId: activeSubtask?.id,
      durationMinutes: activeSubtask?.durationMinutes || 25,
      completedAt: new Date().toISOString(),
    };
    onSessionComplete(newSession);
    setEncouragement("Target milestone secured! Take a 5-minute breather, then let's secure the next.");
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    const minutes = activeSubtask?.durationMinutes || 25;
    setSecondsLeft(minutes * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // SVG Progress calculation
  const totalDuration = (activeSubtask?.durationMinutes || 25) * 60;
  const progressPercent = ((totalDuration - secondsLeft) / totalDuration) * 100;
  const strokeDashoffset = 283 - (283 * progressPercent) / 100;

  return (
    <div id="focus-room" className="bg-[#111] border border-[#222] rounded-xl p-8 relative overflow-hidden flex flex-col items-center justify-center max-w-xl mx-auto shadow-2xl">
      {/* Abstract Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#FF5C00_1px,transparent_1px),linear-gradient(to_bottom,#FF5C00_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-[0.015]"></div>
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#FF5C00]/5 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#FF5C00]/5 rounded-full blur-3xl"></div>

      <div className="flex items-center justify-between w-full mb-6 z-10">
        <button
          onClick={onExit}
          className="text-xs bg-[#0A0A0A] hover:bg-[#1A1A1A] text-slate-400 hover:text-slate-200 border border-[#222] px-3 py-1.5 rounded transition-colors cursor-pointer"
        >
          ← Leave Shield Focus
        </button>
        <div className="flex items-center gap-2 bg-[#FF5C00]/10 border border-[#FF5C00]/20 px-3 py-1 rounded text-[#FF5C00] text-xs font-mono">
          <Flame className="h-4 w-4 text-orange-400 animate-pulse" />
          <span>Streak: {streak} blocks</span>
        </div>
      </div>

      {activeSubtask && (
        <div className="text-center mb-8 z-10">
          <span className="text-[10px] bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/20 px-2.5 py-0.5 rounded font-mono uppercase tracking-widest">
            Active Milestone Focus
          </span>
          <h2 className="text-lg font-bold text-slate-100 mt-2 tracking-tight font-serif italic">
            {activeSubtask.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto line-clamp-1">
            {activeSubtask.description}
          </p>
        </div>
      )}

      {/* Primary Circular Countdown */}
      <div className="relative w-64 h-64 flex items-center justify-center z-10 mb-8 select-none">
        <svg className="w-full h-full transform -rotate-90">
          {/* Track Circle */}
          <circle
            cx="128"
            cy="128"
            r="110"
            className="stroke-slate-900 fill-none"
            strokeWidth="8"
          />
          {/* Progress Circle with neon glow */}
          <circle
            cx="128"
            cy="128"
            r="110"
            className="stroke-[#FF5C00] fill-none transition-all duration-300"
            strokeWidth="8"
            strokeDasharray="691"
            strokeDashoffset={691 - (691 * progressPercent) / 100}
            strokeLinecap="round"
          />
        </svg>

        {/* Inner timer value */}
        <div className="absolute text-center">
          <span className="block text-4xl font-extrabold text-slate-50 font-mono tracking-tighter">
            {formatTime(secondsLeft)}
          </span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 block mt-1">
            {isActive ? "Deep Work Block" : "Paused"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 z-10 mb-8">
        <button
          onClick={resetTimer}
          title="Reset timer"
          className="p-3 bg-[#0A0A0A] hover:bg-[#1A1A1A] text-slate-400 hover:text-slate-200 border border-[#222] rounded transition-all cursor-pointer"
        >
          <RotateCcw className="h-5 w-5" />
        </button>

        <button
          onClick={toggleTimer}
          className={`p-5 rounded-full transition-all flex items-center justify-center cursor-pointer ${
            isActive
              ? "bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(217,119,6,0.3)]"
              : "bg-[#FF5C00] hover:bg-[#ff7526] text-black shadow-[0_0_20px_rgba(255,92,0,0.3)]"
          }`}
        >
          {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 fill-current" />}
        </button>

        <div className="relative">
          <button
            onClick={() => {
              // Cycle ambient sounds
              const list: ("none" | "binaural" | "storm" | "cyberpunk")[] = ["none", "binaural", "storm", "cyberpunk"];
              const currentIdx = list.indexOf(ambientSound);
              const nextIdx = (currentIdx + 1) % list.length;
              setAmbientSound(list[nextIdx]);
            }}
            title="Toggle Ambient Focus Noise"
            className={`p-3 border rounded transition-all flex items-center gap-1.5 text-xs cursor-pointer ${
              ambientSound !== "none"
                ? "bg-[#FF5C00]/10 border-[#FF5C00]/40 text-[#FF5C00]"
                : "bg-[#0A0A0A] border-[#222] text-slate-400 hover:text-slate-200"
            }`}
          >
            {ambientSound === "none" ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5 animate-pulse" />}
            {ambientSound !== "none" && <span className="font-mono uppercase text-[9px]">{ambientSound}</span>}
          </button>
        </div>
      </div>

      {/* Interactive AI Companion Encourager */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-4 w-full z-10 text-center flex items-center gap-3">
        <div className="p-2 bg-[#FF5C00]/10 border border-[#FF5C00]/30 rounded shrink-0">
          <Sparkles className="h-4 w-4 text-[#FF5C00]" />
        </div>
        <p className="text-xs text-slate-300 text-left italic font-serif">
          "{encouragement}"
        </p>
      </div>

      {/* Simulated Waveform while active */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 overflow-hidden">
          <div className="h-full bg-[#FF5C00] w-1/3 animate-[translateX_3s_infinite_linear]"></div>
        </div>
      )}
    </div>
  );
}
