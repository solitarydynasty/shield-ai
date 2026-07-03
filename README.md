# ShieldAI

> A Proactive, Cognitive-First Life Operating System powered by Gemini 2.5 and Google Cloud.

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
[![Runtime](https://img.shields.io/badge/Runtime-Node.js%20%7C%20Express-black?style=flat&logo=node.js&logoColor=green)](https://nodejs.org)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind%20CSS-black?style=flat&logo=react)](https://react.dev)
[![Database](https://img.shields.io/badge/Database-Firestore-black?style=flat&logo=firebase&logoColor=ffca28)](https://firebase.google.com)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Gemini%202.5%20Flash-black?style=flat&logo=google-gemini&logoColor=blue)](https://ai.google.dev)

---

## 🚫 The Problem: Traditional Productivity is Broken

Current productivity tools (task managers, calendars, kanban boards) share a fundamental structural flaw: **they are entirely passive.** 

They act as static, demanding buckets of work that wait for you to do the heavy lifting of scheduling, prioritizing, and breaking down projects. This leads directly to:
* **Decision Fatigue**: Burning through mental energy just *organizing* your dashboard rather than executing.
* **Procrastination Loops**: Getting paralyzed by a massive, unstructured list, leading to task avoidance.
* **Overwhelming Burnout**: Planners that treat human beings like robots—ignoring energy levels, sleep quality, and physiological stamina.

---

## 🛡️ The Solution: A Proactive Cognitive Shield

**ShieldAI** is a premium, full-stack **Life Operating System (Life OS)** designed to shift your workflow from exhausting manual planning to streamlined, AI-guided execution. 

Instead of waiting for instructions, ShieldAI acts as a co-pilot that guards your attention, optimizes study tracks, and paces workload according to your reported **Cognitive Energy Levels**. It shields your mind, dynamically schedules your commitments, and ensures you make steady progress without burning out.

---

## 🛠️ How It Works

ShieldAI operates on a continuous, four-step cognitive optimization loop:

```
[1] INPUT GOALS & SYLLABUS  ──>  [2] CHOOSE COGNITIVE ENERGY  ──>  [3] EXECUTE IN IMMERSIVE ROOM  ──>  [4] DYNAMIC REPLANNING
- High-level objectives          - Low, Medium, or High            - Guided Box Breathing         - Failsafe adjustment if 
- Raw syllabus course files      - Stress Radar Sliders            - Interactive AI Companion     - sessions missed or finished early
```

1. **Objective Injection**: Input abstract high-level milestones (e.g., *"S Grade in DBMS"*) or paste your raw course syllabus into the Curriculum Analyzer.
2. **Stamina Calibration**: Declare your current mental energy profile. ShieldAI instantly scales focus durations, capping sprint blocks and forcing breaks if energy levels are low.
3. **Immersive Focus**: Enter the Focus Room. Use the interactive stress slider to communicate attention blocks, and flush out stress hormones using the integrated, animated **Box Breathing Cortisol Pacer**.
4. **Autonomous Realignment**: Did you miss a session? Did you finish early? The underlying engine automatically triggers a schedule recalibration, shifting time-blocks dynamically without breaking downstream deadlines.

---

## ✨ Key Features

* **Today's Command Center**: A master HUD showing a real-time burnout index, pending workloads, custom risk warnings, and your fully consolidated chronological timeline checklist.
* **Goal-Based Architect**: Breaks down high-level project proposals into concrete, difficulty-weighted milestones.
* **Academic Syllabus Parser**: Paste unstructured course files to extract units, critical topics, hours, and custom revision guidelines.
* **Multi-Subject Planner**: Analyzes overlapping exam dates, evaluates your weakest classes, and synthesizes a balanced, non-conflicting study timeline.
* **The Focus Room**: Immersive work screen containing an adjustable Stress Radar, an animated companion avatar, and a **4-second Cortisol Flush Box Breathing Pacer**.
* **Active Copilot**: A context-aware sidekick giving continuous strategic tips, performance history, and instant **Emergency Rescue Actions** when stuck.
* **Diagnostics & Cost Tracker**: Full-stack observability tracking real-time API call performance, approximate Gemini token expenses, cache efficiency, and database operations.

---

## 🖥️ UI Previews & Visual Showcases

### 1. Unified Command Center HUD
An elegant Bento Grid layout organizing pacing profiles, burnout meters, alert logs, and checkable chronological study blocks.
```
┌────────────────────────────────────────────────────────────────────────┐
│                        SHIELDAI COMMAND CENTER                         │
├───────────────────────┬────────────────────────┬───────────────────────┤
│ [⚡] Pacer Shield      │ [🔥] Burnout Risk: 45% │ [⚠️] Alerts            │
│ Energy: Medium        │ Workload: 4.5 Hours    │ - Compressed DBMS     │
│ [Low][Medium][High]   │ Status: Stable Buffer  │ - Forced break active │
├───────────────────────┴────────────────────────┴───────────────────────┤
│ [🧠] AI RECOMMENDATION: "Deep Study Block: Relational Algebra" (94% Conf)│
├────────────────────────────────────────────────────────────────────────┤
│ ■ 09:00 - 10:30 | Deep Session: Relational Algebra       [Study Mode]  │
│ □ 10:30 - 10:45 | Sovereign Pacing: Box Breathing        [Break]       │
│ □ 10:45 - 12:15 | Practical Active Recall Drill           [Study Mode]  │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Immersive Focus & Breathing Room
Minimalist focus interface featuring an animated circular breathing ring synced with an active pacer dashboard.
```
┌────────────────────────────────────────────────────────────────────────┐
│                           LIVE FOCUS SPACE                             │
├───────────────────────────────────────┬────────────────────────────────┤
│         BOX BREATHING PACER           │      COMPANION ASSESSMENT      │
│                (Hold)                 │                                │
│               ○ ○ ● ○                 │  "Your attention pattern shows │
│               [  4s  ]                │  high fatigue. Tap flush now." │
│         (Visual Breathe Wave)         │                                │
├───────────────────────────────────────┴────────────────────────────────┤
│  [ SLIDER: Procrastination / Stress Radar : 60% ] -> AI adjusts pace   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Tech Stack

### Frontend & UI
* **React 18 & Vite (TypeScript)**: Highly responsive client rendering framework.
* **Tailwind CSS**: Modern utility design system configured on a dark palette.
* **Lucide Icons**: High-contrast vectorized glyphs.
* **Recharts**: Performance tracking metrics and history logs.

### Backend & Database
* **Node.js & Express**: API gateway proxy serving client assets and handling core routing.
* **@google/genai**: Official Google Cloud SDK for secure Gemini models integration.
* **esbuild**: Server bundling compiling production builds into a high-efficiency single CJS module.
* **Google Cloud Firestore**: Real-time cloud database persistent synchronization layer.

---

## 🚀 Getting Started (Installation)

### Prerequisites
* [Node.js v18+](https://nodejs.org) installed.
* A [Google AI Studio API Key](https://aistudio.google.com/).
* A [Firebase Console Web App Config](https://console.firebase.google.com/).

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/shieldai.git
   cd shieldai
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up your environment variables**:
   ```bash
   cp .env.example .env
   ```
   Open your newly created `.env` file and insert your respective secret key configurations.

---

## 📋 Running the Project

### Development Server
Starts the Express server backend with live-reloaded Vite middleware:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build compilation
Prepares optimized client bundles and CJS compiled server artifacts inside `/dist`:
```bash
npm run build
```

### Start Production Server
Executes the production bundle cleanly:
```bash
npm run start
```

---

## 📄 Core Project Resources

To explore further technical information and planned expansions, consult our sub-documentation indices:

* 🏗️ **[ARCHITECTURE.md](./ARCHITECTURE.md)**: Explore the detailed system topologies, Firestore collection schema blueprints, security rule specifications, and custom Express middleware designs.
* 🗺️ **[ROADMAP.md](./ROADMAP.md)**: Review our comprehensive roadmap outlines describing Version 2.0 (AI Academic OS) and Version 3.0 (AI Life OS) integration targets.
* 🛡️ **[AGENTS.md](./AGENTS.md)**: Explore the strict design handbooks, code style standards, and developer constraints applied to the workspace.

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🤝 Acknowledgements

* **Google Cloud Platform & AI Studio** for Cloud Run containers and Gemini models.
* **Tailwind & Vite Teams** for providing fast, polished development frameworks.
* **React Community** for modern client states and reactive lifecycles.
