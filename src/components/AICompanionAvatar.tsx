/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles, AlertTriangle, ShieldCheck, Zap } from "lucide-react";

interface AICompanionAvatarProps {
  state: "thinking" | "motivating" | "alarm" | "calm";
  text?: string;
  onClick?: () => void;
}

export default function AICompanionAvatar({ state, text, onClick }: AICompanionAvatarProps) {
  const getColors = () => {
    switch (state) {
      case "thinking":
        return {
          glow: "border-[#FF5C00] bg-[#111] shadow-[0_0_20px_rgba(255,92,0,0.15)]",
          ring: "border-[#FF5C00]/60 animate-spin",
          icon: <Sparkles className="h-8 w-8 text-[#FF5C00] animate-pulse" />,
          title: "ShieldAI Engine Active",
          colorText: "text-[#FF5C00] italic font-serif font-bold",
        };
      case "motivating":
        return {
          glow: "border-[#333] bg-[#111]",
          ring: "border-white/40 animate-pulse",
          icon: <Zap className="h-8 w-8 text-white" />,
          title: "Co-Founder Tactical Assist",
          colorText: "text-white uppercase tracking-wider font-bold",
        };
      case "alarm":
        return {
          glow: "border-red-600 bg-[#111] shadow-[0_0_25px_rgba(239,68,68,0.2)] animate-bounce",
          ring: "border-red-500 animate-ping [animation-duration:2s]",
          icon: <AlertTriangle className="h-8 w-8 text-red-500" />,
          title: "CRITICAL CRUNCH DETECTED",
          colorText: "text-red-500 uppercase font-black tracking-widest",
        };
      case "calm":
      default:
        return {
          glow: "border-emerald-600 bg-[#111] shadow-[0_0_15px_rgba(16,185,129,0.1)]",
          ring: "border-emerald-500 animate-pulse",
          icon: <ShieldCheck className="h-8 w-8 text-emerald-400" />,
          title: "Launch Timeline Secured",
          colorText: "text-emerald-400 uppercase tracking-widest font-bold",
        };
    }
  };

  const style = getColors();

  return (
    <div 
      id="ai-companion-avatar"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border ${style.glow} transition-all duration-500 cursor-pointer hover:scale-105 select-none`}
    >
      {/* External decorative scanning rings */}
      <div className="absolute inset-0 rounded-2xl border border-white/5 pointer-events-none"></div>
      
      {/* Outer Rotating/Pulse Core */}
      <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-2 border-dashed bg-black/40 shadow-inner">
        <div className={`absolute inset-0 rounded-full border border-double ${style.ring} opacity-60`}></div>
        {style.icon}
      </div>

      <div className="mt-4 text-center">
        <h4 className={`text-sm font-semibold tracking-wide uppercase ${style.colorText}`}>
          {style.title}
        </h4>
        {text && (
          <p className="mt-2 text-xs text-slate-300 italic max-w-[240px] leading-relaxed mx-auto">
            "{text}"
          </p>
        )}
      </div>

      {state === "alarm" && (
        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full uppercase font-mono tracking-widest animate-pulse border border-red-400">
          Act Now
        </span>
      )}
    </div>
  );
}
