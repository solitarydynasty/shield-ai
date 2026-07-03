import React, { useState } from "react";
import { 
  Sparkles, ShieldAlert, ArrowRight, ArrowLeft, Bot, Briefcase, 
  Clock, Moon, Sun, Award, Bell, Check, User, ChevronRight, HelpCircle
} from "lucide-react";
import { UserProfile, UserOnboardingData, Task, CalendarEvent } from "../types";
import { auth } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

interface AuthAndOnboardingProps {
  onAuthSuccess: (user: any, profile: UserProfile, isDemo: boolean, demoPersona?: string) => void;
  onLoadDemoData: (persona: "student" | "professional" | "entrepreneur") => void;
}

export default function AuthAndOnboarding({ onAuthSuccess, onLoadDemoData }: AuthAndOnboardingProps) {
  const [step, setStep] = useState<"login" | "onboarding">("login");
  const [activeSubStep, setActiveSubStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Temp user object for onboarding
  const [authUser, setAuthUser] = useState<any>(null);

  // Onboarding Form State
  const [formData, setFormData] = useState<UserOnboardingData>({
    fullName: "",
    occupation: "",
    workingHoursStart: "09:00",
    workingHoursEnd: "17:00",
    focusWindow: "morning",
    sleepBedtime: "23:00",
    sleepWakeTime: "07:00",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    goals: ["burnout"],
    notificationsEnabled: true,
    emergencyContactName: "",
    emergencyContactPhone: ""
  });

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    if (!auth) {
      // Fallback Demo Auth if Firebase not connected
      console.warn("[ShieldAI] Firebase Auth missing. Creating mock Google User.");
      const mockUser = {
        uid: "mock-google-user-123",
        displayName: "Google Tester",
        email: "tester@google.com",
        photoURL: ""
      };
      setAuthUser(mockUser);
      setFormData(prev => ({ ...prev, fullName: mockUser.displayName }));
      setStep("onboarding");
      setLoading(false);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      setAuthUser(user);
      setFormData(prev => ({ ...prev, fullName: user.displayName || "" }));
      setStep("onboarding");
    } catch (err: any) {
      console.error("[ShieldAI] Google Auth Error:", err);
      setError(err.message || "Failed to log in with Google. Try Demo Mode.");
    } finally {
      setLoading(false);
    }
  };

  const selectDemoPersona = (persona: "student" | "professional" | "entrepreneur") => {
    onLoadDemoData(persona);
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => {
      const exists = prev.goals.includes(goal);
      if (exists) {
        return { ...prev, goals: prev.goals.filter(g => g !== goal) };
      } else {
        return { ...prev, goals: [...prev.goals, goal] };
      }
    });
  };

  const handleNextStep = () => {
    if (activeSubStep === 1 && !formData.fullName.trim()) {
      setError("Please provide your name.");
      return;
    }
    setError(null);
    if (activeSubStep < 4) {
      setActiveSubStep(prev => prev + 1);
    } else {
      // Submit Onboarding
      handleSubmitOnboarding();
    }
  };

  const handlePrevStep = () => {
    setError(null);
    if (activeSubStep > 1) {
      setActiveSubStep(prev => prev - 1);
    }
  };

  const handleSubmitOnboarding = () => {
    const profile: UserProfile = {
      userId: authUser?.uid || "mock-user",
      streak: 1,
      lastActiveDate: new Date().toISOString().split("T")[0],
      focusMinutesTotal: 0,
      unlockedInsights: [],
      unlockedMilestones: [],
      onboardingComplete: true,
      onboarding: formData
    };
    onAuthSuccess(authUser, profile, false);
  };

  return (
    <div className="min-h-screen bg-[#000] text-slate-100 flex items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#FF5C00]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#FF7A00]/5 blur-[120px] pointer-events-none" />

      {step === "login" ? (
        <div id="login-container" className="w-full max-w-md bg-[#0A0A0A] border border-[#111] rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 bg-[#FF5C00]/10 border border-[#FF5C00]/20 rounded-xl mb-2 animate-pulse">
              <ShieldAlert className="h-8 w-8 text-[#FF5C00]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight font-serif italic text-white">
              Shield<span className="text-[#FF5C00] font-sans not-italic">AI</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
              Welcome to your Cognitive Defense Hub. Log in or select Judge Trial Mode to review.
            </p>
          </div>

          {error && (
            <div className="bg-red-950/20 border border-red-500/20 rounded p-3 text-center">
              <p className="text-xs text-red-400 font-mono font-bold uppercase">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-[#FF5C00] hover:bg-[#ff7526] text-black py-3 rounded-xl font-bold transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(255,92,0,0.4)] cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              {loading ? "Initializing Connection..." : "Secure Login with Google"}
            </button>

            <div className="relative py-3 flex items-center">
              <div className="flex-grow border-t border-[#111]" />
              <span className="flex-shrink mx-4 text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider">
                Or Explore via Judge Trial Persona
              </span>
              <div className="flex-grow border-t border-[#111]" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => selectDemoPersona("student")}
                className="bg-[#111] hover:bg-[#151515] border border-[#222] hover:border-[#FF5C00]/40 rounded-xl p-3.5 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div>
                  <span className="text-[9px] font-mono text-[#FF5C00] font-bold uppercase tracking-wider block">Demo Persona 01</span>
                  <h3 className="text-xs font-bold text-slate-200 mt-0.5 group-hover:text-white transition-colors">Alex (CS Student)</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Stressed by deadlines, codes late, gets overwhelmed.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-[#FF5C00] transition-colors" />
              </button>

              <button
                onClick={() => selectDemoPersona("professional")}
                className="bg-[#111] hover:bg-[#151515] border border-[#222] hover:border-[#FF5C00]/40 rounded-xl p-3.5 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div>
                  <span className="text-[9px] font-mono text-[#FF5C00] font-bold uppercase tracking-wider block">Demo Persona 02</span>
                  <h3 className="text-xs font-bold text-slate-200 mt-0.5 group-hover:text-white transition-colors">Sarah (UX Architect)</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Wants morning peak flow, structured tasks, burnout protection.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-[#FF5C00] transition-colors" />
              </button>

              <button
                onClick={() => selectDemoPersona("entrepreneur")}
                className="bg-[#111] hover:bg-[#151515] border border-[#222] hover:border-[#FF5C00]/40 rounded-xl p-3.5 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div>
                  <span className="text-[9px] font-mono text-[#FF5C00] font-bold uppercase tracking-wider block">Demo Persona 03</span>
                  <h3 className="text-xs font-bold text-slate-200 mt-0.5 group-hover:text-white transition-colors">Marcus (SaaS Founder)</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Intense 12-hour sprints, needs cognitive check-ins, prioritization.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-[#FF5C00] transition-colors" />
              </button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-slate-500 font-mono">
              SECURE DEPLOYMENT PROTOCOL v2.1.0 // NO KEYS VISIBLE
            </p>
          </div>
        </div>
      ) : (
        <div id="onboarding-container" className="w-full max-w-lg bg-[#0A0A0A] border border-[#111] rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-10 space-y-6">
          <div className="flex items-center justify-between border-b border-[#111] pb-4">
            <div>
              <span className="text-[9px] font-mono text-[#FF5C00] font-bold uppercase tracking-widest">
                Cognitive Personalization Profile
              </span>
              <h1 className="text-lg font-bold text-slate-200 font-serif italic mt-0.5">
                Onboarding Protocol (Step {activeSubStep}/4)
              </h1>
            </div>
            <span className="text-xs font-mono text-[#FF5C00] font-bold">
              {activeSubStep * 25}%
            </span>
          </div>

          {error && (
            <div className="bg-red-950/20 border border-red-500/20 rounded p-3 text-center">
              <p className="text-xs text-red-400 font-mono font-bold uppercase">{error}</p>
            </div>
          )}

          {activeSubStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-400 font-mono uppercase">User Persona Basics</h3>
                <p className="text-[11px] text-slate-400">Let ShieldAI understand who you are so it can calibrate recommendations.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1.5">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Nishanth"
                      className="w-full bg-[#111] border border-[#222] focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded-lg p-3 text-xs text-white outline-none transition-all pl-10"
                    />
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1.5">Primary Occupation / Discipline</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      placeholder="e.g. Software Engineer, Design Architect, Founder"
                      className="w-full bg-[#111] border border-[#222] focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded-lg p-3 text-xs text-white outline-none transition-all pl-10"
                    />
                    <Briefcase className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1.5">Current Timezone</label>
                  <input
                    type="text"
                    disabled
                    value={formData.timezone}
                    className="w-full bg-[#111]/40 border border-[#111] rounded-lg p-3 text-xs text-slate-500 outline-none select-none font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSubStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-400 font-mono uppercase">Daily Performance Windows</h3>
                <p className="text-[11px] text-slate-400">Specify your normal working schedules and peak energetic alignment.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1.5">Typical Work Starts</label>
                    <div className="relative">
                      <input
                        type="time"
                        value={formData.workingHoursStart}
                        onChange={(e) => setFormData({ ...formData, workingHoursStart: e.target.value })}
                        className="w-full bg-[#111] border border-[#222] focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded-lg p-3 text-xs text-white outline-none transition-all pl-10 font-mono"
                      />
                      <Clock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1.5">Typical Work Ends</label>
                    <div className="relative">
                      <input
                        type="time"
                        value={formData.workingHoursEnd}
                        onChange={(e) => setFormData({ ...formData, workingHoursEnd: e.target.value })}
                        className="w-full bg-[#111] border border-[#222] focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded-lg p-3 text-xs text-white outline-none transition-all pl-10 font-mono"
                      />
                      <Clock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-2">Preferred Cognitive Flow Window</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: "morning", label: "Morning (6AM - 12PM)", icon: Sun },
                      { id: "afternoon", label: "Afternoon (12PM - 6PM)", icon: Sun },
                      { id: "evening", label: "Evening (6PM - 12AM)", icon: Moon },
                      { id: "night", label: "Night Runner (12AM - 6AM)", icon: Moon }
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setFormData({ ...formData, focusWindow: item.id as any })}
                          className={`p-3.5 rounded-xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                            formData.focusWindow === item.id
                              ? "bg-[#FF5C00]/10 border-[#FF5C00] text-[#FF5C00]"
                              : "bg-[#111] border-[#222] text-slate-400 hover:border-[#333]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-xs font-bold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-400 font-mono uppercase">Sleep & Cognitive Resiliency</h3>
                <p className="text-[11px] text-slate-400">Sleep cycles calibrate burnout forecasting. Emergency contacts secure focus shields.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1.5">Target Bedtime</label>
                    <div className="relative">
                      <input
                        type="time"
                        value={formData.sleepBedtime}
                        onChange={(e) => setFormData({ ...formData, sleepBedtime: e.target.value })}
                        className="w-full bg-[#111] border border-[#222] focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded-lg p-3 text-xs text-white outline-none transition-all pl-10 font-mono"
                      />
                      <Moon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-1.5">Target Wake Time</label>
                    <div className="relative">
                      <input
                        type="time"
                        value={formData.sleepWakeTime}
                        onChange={(e) => setFormData({ ...formData, sleepWakeTime: e.target.value })}
                        className="w-full bg-[#111] border border-[#222] focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded-lg p-3 text-xs text-white outline-none transition-all pl-10 font-mono"
                      />
                      <Sun className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#111] pt-4 space-y-3">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                    Optional: Emergency Pacing Rescue Setup
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-mono uppercase text-slate-500 block mb-1">Contact Name</label>
                      <input
                        type="text"
                        value={formData.emergencyContactName || ""}
                        onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                        placeholder="e.g. Partner, Co-Founder"
                        className="w-full bg-[#111] border border-[#222] focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded-lg p-2.5 text-xs text-white outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono uppercase text-slate-500 block mb-1">Emergency Phone Number</label>
                      <input
                        type="tel"
                        value={formData.emergencyContactPhone || ""}
                        onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                        placeholder="e.g. +1 (555) 123-4567"
                        className="w-full bg-[#111] border border-[#222] focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00] rounded-lg p-2.5 text-xs text-white outline-none transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-xs font-black text-slate-400 font-mono uppercase">Goals & Interactive Shields</h3>
                <p className="text-[11px] text-slate-400">Configure notifications and check goals to build your daily defense dashboard.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-500 font-bold block mb-2">My Top Focus Objectives</label>
                  <div className="space-y-2">
                    {[
                      { id: "procrastination", title: "Defeat Attention Drift & Procrastination", desc: "Forced breathing pacing and proactive system nudges." },
                      { id: "burnout", title: "Protect Energy & Prevent Burnout", desc: "Rest alignment alerts based on hourly biometric estimations." },
                      { id: "deep-work", title: "Build Elite Deep Work Routines", desc: "Long sprint intervals optimized for target peak windows." },
                      { id: "deadline-shield", title: "Never Breach Mission Deadlines", desc: "Predictive urgency scaling curves and task decomposition." }
                    ].map((goal) => {
                      const selected = formData.goals.includes(goal.id);
                      return (
                        <button
                          key={goal.id}
                          onClick={() => handleGoalToggle(goal.id)}
                          className={`w-full text-left p-3 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                            selected
                              ? "bg-[#FF5C00]/10 border-[#FF5C00] text-[#FF5C00]"
                              : "bg-[#111] border-[#222] text-slate-400 hover:border-[#333]"
                          }`}
                        >
                          <div className={`mt-0.5 h-4.5 w-4.5 border flex items-center justify-center transition-colors ${
                            selected ? "bg-[#FF5C00] border-[#FF5C00] text-black" : "border-[#333]"
                          }`}>
                            {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                          </div>
                          <div>
                            <h4 className={`text-xs font-bold ${selected ? "text-slate-100" : "text-slate-300"}`}>{goal.title}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{goal.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-[#111] pt-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Proactive Auditory & Alert Notifications</h4>
                    <p className="text-[10px] text-slate-500 leading-tight">Sound alerts during focus transitions and countdown end.</p>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, notificationsEnabled: !formData.notificationsEnabled })}
                    className={`px-3.5 py-1.5 rounded font-mono text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      formData.notificationsEnabled
                        ? "bg-[#FF5C00]/20 border border-[#FF5C00] text-[#FF5C00]"
                        : "bg-[#111] border border-[#222] text-slate-500"
                    }`}
                  >
                    {formData.notificationsEnabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Wizard Actions */}
          <div className="flex items-center justify-between border-t border-[#111] pt-4">
            <button
              onClick={handlePrevStep}
              disabled={activeSubStep === 1}
              className={`flex items-center gap-1 text-xs font-mono uppercase font-bold tracking-wider py-2 px-3 rounded-lg transition-all ${
                activeSubStep === 1
                  ? "opacity-30 cursor-not-allowed text-slate-600"
                  : "hover:bg-[#111] text-slate-400 cursor-pointer"
              }`}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <button
              onClick={handleNextStep}
              className="bg-[#FF5C00] hover:bg-[#ff7526] text-black px-6 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 hover:shadow-[0_0_12px_rgba(255,92,0,0.3)] cursor-pointer"
            >
              {activeSubStep === 4 ? "Complete Verification" : "Next Phase"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
