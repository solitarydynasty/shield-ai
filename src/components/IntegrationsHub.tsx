/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Calendar, Slack, Bell, Mail, Phone, ShieldAlert, CheckCircle, Plus, 
  ExternalLink, UserCheck, AlertCircle 
} from "lucide-react";
import { Task, CalendarEvent } from "../types";

interface IntegrationsHubProps {
  activeTask: Task | null;
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
}

export default function IntegrationsHub({ activeTask, events, onAddEvent }: IntegrationsHubProps) {
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [slackConnected, setSlackConnected] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([
    "Workspace Integrations initialized successfully.",
    "Mock Notification: Proactive check on background services: Healthy."
  ]);

  const handleConnectCalendar = () => {
    setGoogleCalendarConnected(!googleCalendarConnected);
    const text = googleCalendarConnected 
      ? "Google Calendar disconnected." 
      : "Successfully connected Google Workspace Calendar via Google OAuth.";
    setNotifications(prev => [text, ...prev]);

    // Automatically map task milestones to calendar events if connected
    if (!googleCalendarConnected && activeTask) {
      activeTask.subtasks.forEach((sub, index) => {
        const start = new Date();
        start.setMinutes(start.getMinutes() + (index * 45));
        const end = new Date(start.getTime() + (sub.durationMinutes * 60 * 1000));
        
        onAddEvent({
          id: `ev-${sub.id}`,
          title: `[ShieldAI Block] ${sub.title}`,
          start: start.toISOString(),
          end: end.toISOString(),
          type: "focus-block",
          taskId: activeTask.id,
          subtaskId: sub.id
        });
      });
      setNotifications(prev => ["Created focus calendar blocks for all pending milestones automatically.", ...prev]);
    }
  };

  const handleConnectSlack = () => {
    setSlackConnected(!slackConnected);
    const text = slackConnected 
      ? "Slack alarms deactivated." 
      : "Slack integration verified. Alarm bot set to trigger at >75% risk threshold.";
    setNotifications(prev => [text, ...prev]);
  };

  const handleVerifyPhone = () => {
    setPhoneVerified(!phoneVerified);
    const text = phoneVerified 
      ? "SMS backups disabled." 
      : "Emergency Phone Verification active. High-Crunch voice calls armed.";
    setNotifications(prev => [text, ...prev]);
  };

  return (
    <div id="integrations-hub" className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
      {/* Integrations Control Panel */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-5 shadow-xl space-y-4 lg:col-span-1">
        <div>
          <h3 className="text-sm font-bold text-slate-100 tracking-tight font-serif italic text-lg">Active Integration Connectors</h3>
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">Link your primary professional workspace for proactive defense alarms.</p>
        </div>

        <div className="space-y-3">
          {/* Google Calendar */}
          <div className="bg-[#0A0A0A] border border-[#222] rounded p-4 flex flex-col justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#FF5C00]/10 border border-[#FF5C00]/30 rounded shrink-0">
                <Calendar className="h-5 w-5 text-[#FF5C00]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Google Calendar Sync</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Export milestone blocks, buffer schedules, and automated focus intervals directly into your GCal.
                </p>
              </div>
            </div>
            <button
              onClick={handleConnectCalendar}
              className={`w-full text-[10px] font-black uppercase tracking-wider py-2 rounded-none border transition-all cursor-pointer ${
                googleCalendarConnected
                  ? "bg-[#FF5C00]/10 text-[#FF5C00] border-[#FF5C00]/30"
                  : "bg-[#FF5C00] hover:bg-[#ff7526] text-black border-[#FF5C00]"
              }`}
            >
              {googleCalendarConnected ? "Disconnect Calendar" : "Sync Google Calendar"}
            </button>
          </div>

          {/* Slack Bot */}
          <div className="bg-[#0A0A0A] border border-[#222] rounded p-4 flex flex-col justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#FF5C00]/10 border border-[#FF5C00]/30 rounded shrink-0">
                <Slack className="h-5 w-5 text-[#FF5C00]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Slack Alarm Integrator</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  ShieldAI bot posts persistent active check-ins to lock your focus and warn you when trailing schedule.
                </p>
              </div>
            </div>
            <button
              onClick={handleConnectSlack}
              className={`w-full text-[10px] font-black uppercase tracking-wider py-2 rounded-none border transition-all cursor-pointer ${
                slackConnected
                  ? "bg-[#FF5C00]/10 text-[#FF5C00] border-[#FF5C00]/30"
                  : "bg-[#FF5C00] hover:bg-[#ff7526] text-black border-[#FF5C00]"
              }`}
            >
              {slackConnected ? "Disconnect Slack Alarms" : "Sync Slack Channel"}
            </button>
          </div>

          {/* SMS Voice Call */}
          <div className="bg-[#0A0A0A] border border-[#222] rounded p-4 flex flex-col justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-[#FF5C00]/10 border border-[#FF5C00]/30 rounded shrink-0">
                <Phone className="h-5 w-5 text-[#FF5C00]" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">High-Crunch Phone Backup</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Receive an automated emergency phone call if you miss high-risk milestone deadlines completely.
                </p>
              </div>
            </div>
            <button
              onClick={handleVerifyPhone}
              className={`w-full text-[10px] font-black uppercase tracking-wider py-2 rounded-none border transition-all cursor-pointer ${
                phoneVerified
                  ? "bg-[#FF5C00]/10 text-[#FF5C00] border-[#FF5C00]/30"
                  : "bg-[#FF5C00] hover:bg-[#ff7526] text-black border-[#FF5C00]"
              }`}
            >
              {phoneVerified ? "Disable Phone Sync" : "Activate Voice Backup"}
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Timeline and Alerts */}
      <div className="bg-[#111] border border-[#222] rounded-xl p-5 shadow-xl lg:col-span-2 space-y-5">
        <div className="flex justify-between items-center border-b border-[#222]/40 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-1.5 font-serif italic text-lg">
              <Calendar className="h-4.5 w-4.5 text-[#FF5C00]" />
              Simulated GCal Calendar View
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Chronological focus schedule synchronized directly with active deadlines.</p>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/20 px-2 py-0.5 rounded">
            Real-time Feed
          </span>
        </div>

        {/* Live Calendar Timeline list */}
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          {events.length === 0 ? (
            <div className="text-center py-10 bg-[#0A0A0A] border border-dashed border-[#222] rounded">
              <Calendar className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Google Calendar empty.</p>
              <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto mt-1">Enable "Google Calendar Sync" above to auto-create focus blocks.</p>
            </div>
          ) : (
            events.map(event => (
              <div 
                key={event.id}
                className="bg-[#0A0A0A] border border-[#222] rounded p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#FF5C00] shadow-[0_0_5px_rgba(255,92,0,0.8)]"></div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{event.title}</h4>
                    <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">
                      {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-mono bg-[#FF5C00]/10 text-[#FF5C00] border border-[#FF5C00]/10 px-2 py-0.5 rounded font-bold">
                  {event.type}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Workspace Active Logger Feed */}
        <div className="border-t border-[#222]/40 pt-4 space-y-2">
          <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1 font-bold">
            <Bell className="h-3.5 w-3.5 text-[#FF5C00]" />
            ShieldAI Workspace Action Logs
          </h4>
          <div className="bg-[#0A0A0A] border border-[#222] rounded p-3 max-h-[110px] overflow-y-auto space-y-1.5 font-mono text-[9px]">
            {notifications.map((note, index) => (
              <div key={index} className="flex items-start gap-1.5 text-slate-400">
                <span className="text-[#FF5C00] shrink-0 font-bold">➜</span>
                <span className="leading-normal">{note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
