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
  const [distractionLevel, setDistractionLevel] = useState(20);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Rest">("Inhale");
  const [breathingSeconds, setBreathingSeconds] = useState(4);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Box Breathing Guide Timer Loop
  useEffect(() => {
    if (!breathingActive) return;

    const bTimer = setInterval(() => {
      setBreathingSeconds((prev) => {
        if (prev <= 1) {
          setBreathingPhase((curr) => {
            switch (curr) {
              case "Inhale":
                return "Hold";
              case "Hold":
                return "Exhale";
              case "Exhale":
                return "Rest";
              case "Rest":
              default:
                return "Inhale";
            }
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(bTimer);
  }, [breathingActive]);

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

      {/* Dynamic Procrastination & Distraction Check-in Slider */}
      <div className="w-full bg-[#111] border border-[#222] rounded-xl p-4 z-10 mb-5 space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
            Live Stress / Procrastination Radar:
          </label>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
            distractionLevel > 60 ? "text-red-400 bg-red-950/40 border border-red-500/20" : distractionLevel > 30 ? "text-orange-400 bg-orange-950/40" : "text-emerald-400 bg-emerald-950/40"
          }`}>
            {distractionLevel > 60 ? "⚠️ Heavy Distraction" : distractionLevel > 30 ? "⚡ Mild Drift" : "🎯 Laser Locked"}
          </span>
        </div>
        <input 
          type="range"
          min="0"
          max="100"
          value={distractionLevel}
          onChange={(e) => {
            const val = Number(e.target.value);
            setDistractionLevel(val);
            if (val > 60) {
              setEncouragement("Emergency focus break recommended! Push the 'Box Breathing' reset button below to flush cortisol.");
            } else if (val > 30) {
              setEncouragement("A slight attention leak detected. Stand up, roll your shoulders, and focus back.");
            } else {
              setEncouragement("Neural performance is optimal. Keep shipping.");
            }
          }}
          className="w-full accent-[#FF5C00] bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
        />
        
        {/* Dynamic Reset Action trigger if highly distracted or requested */}
        <div className="flex justify-between items-center pt-1 border-t border-[#222]/40">
          <span className="text-[10px] text-slate-400">Cortisol flush:</span>
          <button
            type="button"
            onClick={() => {
              const nextState = !breathingActive;
              setBreathingActive(nextState);
              if (nextState) {
                setBreathingPhase("Inhale");
                setBreathingSeconds(4);
              }
            }}
            className={`text-[9px] font-mono uppercase tracking-wider font-black px-3 py-1.5 rounded transition-all cursor-pointer ${
              breathingActive 
                ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                : "bg-slate-900 hover:bg-[#1A1A1A] border border-[#333] text-slate-300"
            }`}
          >
            {breathingActive ? "⏹️ Stop Box Breath" : "🧘 Start 1m Box Breath Reset"}
          </button>
        </div>

        {/* Beautiful Box Breathing Visual Panel */}
        {breathingActive && (
          <div className="bg-[#0A0A0A] border border-[#222] rounded p-4 flex flex-col items-center justify-center space-y-3 animate-fade-in">
            <div className="text-center">
              <span className="text-[9px] uppercase font-mono tracking-wider text-slate-500 block font-bold">
                Box Breathing Phase
              </span>
              <span className="text-sm font-black uppercase text-emerald-400 font-mono tracking-widest block mt-0.5">
                {breathingPhase} ({breathingSeconds}s)
              </span>
            </div>

            {/* Visual pulse circle */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className={`absolute rounded-full border border-double border-emerald-500/40 bg-emerald-500/10 transition-all duration-1000 ${
                breathingPhase === "Inhale" 
                  ? "w-20 h-20 scale-110 opacity-100" 
                  : breathingPhase === "Hold"
                    ? "w-20 h-20 scale-110 opacity-80 animate-pulse"
                    : breathingPhase === "Exhale"
                      ? "w-10 h-10 scale-90 opacity-40"
                      : "w-12 h-12 opacity-60"
              }`}></div>
              <span className="text-xs font-mono font-bold text-emerald-300 relative z-10">
                {breathingSeconds}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 text-center max-w-[240px] leading-relaxed">
              {breathingPhase === "Inhale" && "Draw air into your lungs slowly, expanding your abdomen."}
              {breathingPhase === "Hold" && "Hold the breath steady. Focus completely on stillness."}
              {breathingPhase === "Exhale" && "Slowly expel all air from your lungs, releasing all muscle tension."}
              {breathingPhase === "Rest" && "Hold empty, feeling complete clarity and stress release."}
            </p>
          </div>
        )}
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
