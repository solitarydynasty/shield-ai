/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, Trash2, Cpu, Zap, Compass } from "lucide-react";
import { ChatMessage, Task, CalendarEvent } from "../types";

interface ActiveAICopilotProps {
  activeTask: Task | null;
  onTriggerRescue: (actionTitle: string) => void;
  allTasks?: Task[];
  calendarEvents?: CalendarEvent[];
  cognitiveEnergyLevel?: "low" | "medium" | "high";
}

export default function ActiveAICopilot({ 
  activeTask, 
  onTriggerRescue,
  allTasks = [],
  calendarEvents = [],
  cognitiveEnergyLevel = "medium"
}: ActiveAICopilotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      role: "assistant",
      content: "Let's win this hackathon. Feed me your mission deadline, and we'll engineer an unbreakable path to launch. I'll proactively spot bottlenecks before they derail your submission.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "System: ShieldAI neural core ready.",
    "System: Waiting for active mission sequence..."
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Generate automated logs periodically to simulate "Active Companion Thinking"
  useEffect(() => {
    if (!activeTask) return;
    
    const interval = setInterval(() => {
      const liveLogs = [
        `[ShieldAI-Brain] Evaluating velocity: Subtask checklist is ${(activeTask.subtasks.filter(s => s.completed).length / activeTask.subtasks.length * 100).toFixed(0)}% secure.`,
        `[ShieldAI-Brain] Risk model output: Current risk coefficient is ${activeTask.riskFactor}%.`,
        `[ShieldAI-Brain] Calibrating deadline buffers for "${activeTask.title}"...`,
        `[ShieldAI-Brain] Verification protocol: All background threads healthy.`
      ];
      const randomLog = liveLogs[Math.floor(Math.random() * liveLogs.length)];
      setLogs(prev => [randomLog, ...prev.slice(0, 4)]);
    }, 15000);

    // Initial logs when task is loaded
    setLogs(prev => [
      `[ShieldAI-Brain] Active mission locked: "${activeTask.title}"`,
      `[ShieldAI-Brain] Initializing safety buffer of ${activeTask.riskLevel} threat level...`,
      ...prev
    ]);

    return () => clearInterval(interval);
  }, [activeTask]);

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText) return;

    if (!textToSend) {
      setInput("");
    }

    const newUserMsg: ChatMessage = {
      id: "user-" + Date.now(),
      role: "user",
      content: queryText,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      const chatHistory = [...messages, newUserMsg].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("/api/ai/copilot-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory,
          currentTaskState: activeTask ? {
            title: activeTask.title,
            riskFactor: activeTask.riskFactor,
            riskLevel: activeTask.riskLevel,
            completedSubtasks: activeTask.subtasks.filter(s => s.completed).map(s => s.title),
            pendingSubtasks: activeTask.subtasks.filter(s => !s.completed).map(s => s.title),
            burnoutRisk: activeTask.burnoutRisk || 0,
          } : null,
          allTasks: allTasks ? allTasks.map(t => ({
            title: t.title,
            priority: t.priority,
            riskLevel: t.riskLevel,
            completed: t.completed,
            burnoutRisk: t.burnoutRisk || 0
          })) : [],
          calendarEvents: calendarEvents ? calendarEvents.map(e => ({
            title: e.title,
            type: e.type,
            start: e.start,
            end: e.end
          })) : [],
          cognitiveEnergyLevel: cognitiveEnergyLevel || "medium"
        })
      });

      if (!response.ok) {
        throw new Error("Co-Founder took too long to respond.");
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: "ai-" + Date.now(),
        role: "assistant",
        content: data.reply || "I'm keeping track of our timeline. Let's stay focused.",
        createdAt: new Date().toISOString(),
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: "ai-err-" + Date.now(),
        role: "assistant",
        content: `Error: ${err.message || "Failed to sync. Let's bypass and maintain focus on the checklist."}`,
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: "init-2",
        role: "assistant",
        content: "Logs purged. Ready for fresh inputs, partner. Let's execute.",
        createdAt: new Date().toISOString(),
      }
    ]);
  };

  // Quick prompt suggestions
  const promptSuggestions = activeTask
    ? [
        "Give me an emergency feature cut strategy.",
        "How do I defeat procrastination right now?",
        "Explain my next priority milestone."
      ]
    : [
        "How does ShieldAI actively secure deadlines?",
        "Draft a target plan for a Hackathon project."
      ];

  // Helper to render message with basic bolding and bullet formatting
  const renderMessageContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      let styledLine = line;
      // Handle simple bullet formatting
      const isBullet = line.trim().startsWith("-") || line.trim().startsWith("*");
      if (isBullet) {
        styledLine = line.trim().substring(1).trim();
      }

      // Handle simple bold parsing: **text** -> <strong>text</strong>
      const parts = styledLine.split("**");
      const renderedParts = parts.map((part, i) => {
        if (i % 2 === 1) {
          return <strong key={i} className="text-[#FF5C00] font-bold">{part}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc text-slate-300 text-xs mb-1.5 leading-relaxed">
            {renderedParts}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-300 mb-2 leading-relaxed">
          {renderedParts}
        </p>
      );
    });
  };

  return (
    <div id="active-ai-copilot" className="bg-[#111] border border-[#222] rounded-xl flex flex-col h-[540px] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#0A0A0A] px-4 py-3 border-b border-[#222] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative h-2.5 w-2.5 rounded-full bg-[#FF5C00] shadow-[0_0_8px_rgba(255,92,0,0.8)] animate-pulse"></div>
          <div>
            <h4 className="text-xs font-bold text-slate-200 tracking-wide flex items-center gap-1 uppercase font-mono">
              <Bot className="h-3.5 w-3.5 text-[#FF5C00]" />
              Active Co-Founder Channel
            </h4>
            <p className="text-[10px] text-slate-500 font-mono">Agent state: Active Monitoring</p>
          </div>
        </div>
        <button 
          onClick={handleClear} 
          title="Clear Chat"
          className="p-1 hover:bg-[#222] rounded text-slate-600 hover:text-red-500 transition-colors cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Real-time AI logs marquee */}
      <div className="bg-[#0A0A0A] border-b border-[#222]/40 px-4 py-1.5 flex items-center gap-2 overflow-hidden h-7 select-none">
        <Cpu className="h-3 w-3 text-[#FF5C00] shrink-0" />
        <div className="w-full text-[9px] font-mono text-slate-500 truncate italic">
          {logs[0] || "Brain idle. Ready to analyze."}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role !== "user" && (
              <div className="h-7 w-7 rounded bg-[#0A0A0A] border border-[#222] flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-[#FF5C00]" />
              </div>
            )}
            
            <div className={`max-w-[82%] rounded-xl px-3.5 py-2.5 ${
              msg.role === "user" 
                ? "bg-[#FF5C00] text-black font-semibold rounded-tr-none" 
                : "bg-[#0A0A0A] border border-[#222] text-slate-300 rounded-tl-none"
            }`}>
              {msg.role === "user" ? (
                <p className="text-xs">{msg.content}</p>
              ) : (
                <div>{renderMessageContent(msg.content)}</div>
              )}
              <span className="block text-[8px] text-slate-500 mt-1.5 text-right font-mono">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {msg.role === "user" && (
              <div className="h-7 w-7 rounded bg-[#222] border border-[#333] flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-slate-300" />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2.5 justify-start">
            <div className="h-7 w-7 rounded bg-[#0A0A0A] border border-[#222] flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="h-4 w-4 text-[#FF5C00]" />
            </div>
            <div className="bg-[#0A0A0A] border border-[#222] rounded-xl rounded-tl-none px-3.5 py-2.5 flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 bg-[#FF5C00] rounded-full animate-bounce [animation-delay:0ms]"></div>
              <div className="h-1.5 w-1.5 bg-[#FF5C00] rounded-full animate-bounce [animation-delay:150ms]"></div>
              <div className="h-1.5 w-1.5 bg-[#FF5C00] rounded-full animate-bounce [animation-delay:300ms]"></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Prompts / Quick actions */}
      <div className="px-4 py-2 bg-[#0A0A0A]/40 border-t border-[#222]/40 flex gap-1.5 overflow-x-auto whitespace-nowrap select-none no-scrollbar">
        {promptSuggestions.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="text-[10px] bg-[#0A0A0A] hover:bg-[#1A1A1A] text-[#FF5C00] hover:text-[#ff7526] border border-[#222] hover:border-[#FF5C00]/30 px-2.5 py-1 rounded transition-all flex items-center gap-1 shrink-0 cursor-pointer font-mono uppercase"
          >
            <Compass className="h-3 w-3" />
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 bg-[#0A0A0A] border-t border-[#222] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask Co-Founder to optimize..."
          className="flex-1 bg-[#111] border border-[#222] focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-600 transition-all outline-none"
        />
        <button
          onClick={() => handleSend()}
          className="bg-[#FF5C00] hover:bg-[#ff7526] p-2 rounded text-black transition-all flex items-center justify-center shrink-0 hover:shadow-[0_0_10px_rgba(255,92,0,0.3)] cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
