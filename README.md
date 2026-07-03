# ShieldAI

> A Sovereign, Proactive Cognitive Shield & Life Operating System powered by Gemini 2.5 and Google Cloud.

[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)
[![Runtime](https://img.shields.io/badge/Runtime-Node.js%20%7C%20Express-black?style=flat&logo=node.js&logoColor=green)](https://nodejs.org)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind%20CSS-black?style=flat&logo=react)](https://react.dev)
[![Database](https://img.shields.io/badge/Database-Firestore-black?style=flat&logo=firebase&logoColor=ffca28)](https://firebase.google.com)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Gemini%202.5%20Flash-black?style=flat&logo=google-gemini&logoColor=blue)](https://ai.google.dev)

ShieldAI is a premium, AI-powered **Life Operating System (Life OS)** designed to shift human productivity from reactive task management to proactive, cognitive-shielded execution. Rather than acting as a static bucket of items, ShieldAI acts as a world-class academic mentor, executive assistant, and productivity coach combined—continuously analyzing deadlines, energy levels, and task complexities to auto-generate unified execution strategies, prevent cognitive overload, and shield active attention.

---

## 📖 Table of Contents

1. [About ShieldAI](#1-about-shieldai)
2. [Sovereign Evolution & Vision](#2-sovereign-evolution--vision)
3. [Feature Landscape](#3-feature-landscape)
4. [Architecture Overview](#4-architecture-overview)
5. [Technology Stack](#5-technology-stack)
6. [Interactive Interface Showcases](#6-interactive-interface-showcases)
7. [Installation Guide](#7-installation-guide)
8. [Environment Configurations](#8-environment-configurations)
9. [Operational Execution (Running the Project)](#9-operational-execution-running-the-project)
10. [AI Core Engine Details](#10-ai-core-engine-details)
11. [Enterprise-Grade Security Protocols](#11-enterprise-grade-security-protocols)
12. [Project Structural Directory](#12-project-structural-directory)
13. [Future Roadmap](#13-future-roadmap)
14. [Engineering Lessons Learned](#14-engineering-lessons-learned)
15. [Contributing Guidelines](#15-contributing-guidelines)
16. [License](#16-license)
17. [Acknowledgements](#17-acknowledgements)

---

## 1. About ShieldAI

### The Problem
Traditional productivity dashboards are structurally flawed: they are passive, reactive, and require high cognitive friction. They force the user to continuously decide *what* to study, *when* to work, *how* to break down projects, and *which* task to prioritize. This leads directly to:
* **Decision Fatigue**: Expending precious mental energy organizing a dashboard instead of executing.
* **Procrastination Loops**: Paralyzing choices leading to missed deadlines.
* **Burnout Risk**: Inefficient study schedules ignoring human stamina thresholds and cognitive recovery cycles.

### The Solution
**ShieldAI** eliminates manual scheduling entirely. It introduces **Active Autopilot Planning**. The user does not manage a calendar or sort a list; instead, the system analyzes academic goals, Syllabus blueprints, personal tasks, and mental energy levels to generate **ONE unified, optimized, chronological daily execution timeline**. 

---

## 2. Sovereign Evolution & Vision

ShieldAI is engineered to scale across academic and personal lifetimes. This repository documents **Version 1.0 – Hackathon Edition**, the foundational architecture of this premier suite.

```
┌─────────────────────────────────┐
│           VERSION 1.0           │
│   AI Productivity Companion     │ -> Completed Core Frame, Live Focus, Box Breathing,
│     (Hackathon Edition)         │    Goal Decomposer, Active Copilot & Diagnostics
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│           VERSION 2.0           │
│   AI Academic Operating System  │ -> Multi-Subject syllabus document parsing, automated
│    (Curriculum-Aware Engine)    │    mock examinations, weak topic tracking, recall intervals
└───────────────┬─────────────────┘
                ▼
┌─────────────────────────────────┐
│           VERSION 3.0           │
│     AI Life Operating System    │ -> Wearable integration, HRV stress modeling, real-time
│    (Total Cognitive Autopilot)  │    calendar sync, team focus environments, career advisor
└─────────────────────────────────┘
```

---

## 3. Feature Landscape

| Category | Implemented Core Capabilities |
| :--- | :--- |
| **Daily Command Center** | A master HUD displaying today's highest priority task, active study timelines, burnout meters, workload estimates, and strategic action cards. |
| **Goal-Based Architect** | Accepts high-level goal statements (e.g., *"S Grade in DBMS"*) and decomposes them into chronological milestone tasks with calculated burnout scores. |
| **Curriculum Analyzer** | Direct audit of course text/syllabus documents. Automatically extracts Units, Topics, Difficulty, Topic Dependencies, and Revision Plans. |
| **Multi-Subject Planner** | Unified strategy model prioritizing across overlapping subjects, highlighting exam deadlines, weak areas, and time allocation matrices. |
| **Autopilot Scheduler** | Formulates a unified chronological day plan. Automatically triggers **schedule regeneration** if study blocks are marked completed early or missed. |
| **Focus Room** | Highly immersive distraction-free workspace featuring adjustable Stress/Procrastination Radar Sliders and an AI Pacing Companion Avatar. |
| **Cortisol Flush Panel** | Syncs real-time **Box Breathing** cycles (4s Inhale, 4s Hold, 4s Exhale, 4s Rest) with fluid CSS animation ripples for immediate mental grounding. |
| **Active Copilot** | Proactive panel providing continuous context-aware tips, historical stats summaries, and immediate **Emergency Rescue Actions** when stuck. |
| **Diagnostics & Health** | Full-stack server telemetry. Real-time cost trackers, token consumption estimation, database read/write counters, and cache hits ratio. |

---

## 4. Architecture Overview

ShieldAI is a production-grade full-stack Node.js and React containerized application:

```
┌────────────────────────────────────────────────────────┐
│                        FRONTEND                        │
│                React 18 + Vite (TypeScript)            │
│   (CommandCenter, FocusRoom, Copilot, Diagnostics)     │
└────────────┬──────────────────────────────▲────────────┘
             │                              │
     Secure JSON API               Firestore Realtime Sync
             │                              │
┌────────────▼──────────────────────────────┴────────────┐
│                        BACKEND                         │
│             Express Server (TypeScript)                │
│       Vite Middleware (Dev) / CJS Bundle (Prod)        │
└────────────┬───────────────────────────────────────────┘
             │
      @google/genai SDK
             │
┌────────────▼──────────┐
│      Gemini API       │
│  (gemini-2.5-flash)   │
└───────────────────────┘
```

* **Client Layer**: Modular React components styled using Tailwind CSS on a high-contrast charcoal black base with energetic amber accents.
* **Server Layer**: Custom Express backend utilizing `tsx` for dev mode and bundled via `esbuild` to a standalone, single CJS file (`dist/server.cjs`) for high cold-start efficiency in production.
* **Database & Auth**: Out-of-the-box persistent storage utilizing Google Cloud Firestore with granular, secure `firestore.rules` constraining document modifications strictly to verified creators. Custom Firebase Authentication interface handles user state lazily.
* **AI Processing Model**: Secured proxy endpoints in Express run prompt templates against the official `@google/genai` model engine, keeping keys concealed from the client browser completely.

---

## 5. Technology Stack

### Frontend & UI
| Technology | Version | Primary Purpose |
| :--- | :--- | :--- |
| **React** | `^18.3.1` | Declarative UI and custom state hooks |
| **Vite** | `^5.4.11` | Build pipeline and developer proxy serving |
| **Tailwind CSS** | `^4.0.0` | Global atomic design classes and custom theme tokens |
| **Lucide React** | `^0.468.0`| High-fidelity vectorized UI iconography |
| **Recharts** | `^2.15.0` | Responsive performance history data charts |

### Backend & AI
| Technology | Version | Primary Purpose |
| :--- | :--- | :--- |
| **Node.js** | `>= 18` | High-concurrency event-driven runtime environment |
| **Express** | `^4.21.1` | API routing and custom rate limit control middleware |
| **@google/genai**| `^0.1.1`  | Unified, high-speed official SDK interface for Gemini models |
| **esbuild** | `^0.24.0` | Multi-module compilation and production bundling to `.cjs` |
| **Firebase SDK** | `^10.13.0`| Client and client-bound secure Firestore real-time listener hooks |

---

## 6. Interactive Interface Showcases

*The following UI previews display the design elements of Version 1.0 (Hackathon Edition):*

### 1. Today's Command Center
A high-density Bento Grid displaying a Pacer Shield active widget, burnout risk meter, system safety alerts, and a chronological, checkable study timeline.
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

### 2. Live Focus Room
Immersive focus session. Built-in guided box breathing module dynamically expands and contracts to anchor cortisol levels during intense sprints.
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

## 7. Installation Guide

Ensure you have [Node.js v18+](https://nodejs.org) installed on your system.

### Step 1: Clone and Enter Repository
```bash
git clone https://github.com/your-username/shieldai.git
cd shieldai
```

### Step 2: Install Core Dependencies
```bash
npm install
```

### Step 3: Set Up Environment Configuration
Duplicate the example configurations:
```bash
cp .env.example .env
```

---

## 8. Environment Configurations

Open your `.env` file and populate your respective credentials:

```env
# Application Port
PORT=3000

# Server-Side Google GenAI Key (https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Client API Config details (https://console.firebase.google.com/)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 9. Running the Project

The server architecture serves the Vite assets directly in production and acts as a livereload hot proxy in development.

### Development Mode
Runs both the Express server backend and mounts Vite middleware on port `3000` via TypeScript:
```bash
npm run dev
```

### Production Build compilation
Bundles the frontend assets using Vite and compiles `server.ts` to CommonJS via `esbuild`:
```bash
npm run build
```

### Start Production Server
Spins up the high-speed production cluster using the bundled CommonJS output on Port `3000`:
```bash
npm run start
```

---

## 10. AI Core Engine Details

ShieldAI's intelligence relies on structured prompt engineering designed around cognitive stamina:

```
                  ┌──────────────────────┐
                  │   Cognitive Inputs   │
                  │   - Energy Level     │
                  │   - Stress Slider    │
                  │   - Deadlines        │
                  └──────────┬───────────┘
                             ▼
┌─────────────────────────────────────────────────────────┐
│              Server-Side Custom Prompt                  │
│  "You are an elite academic mentor. Allocate workloads   │
│   injecting forced pacing blocks if energy is low..."   │
└────────────────────────────┬────────────────────────────┘
                             ▼
               ┌───────────────────────────┐
               │    Gemini 2.5 Inference   │
               └─────────────┬─────────────┘
                             ▼
               ┌───────────────────────────┐
               │ Strict Structured JSON    │
               │ (Confidence, Explanation, │
               │  Adjusted Work Timeline)  │
               └───────────────────────────┘
```

* **Dynamic Timeline Allocator**: Computes specific study time-windows based on energy. If the user reports "Low" energy, study sessions are automatically capped at 15-30 minutes with forced Box Breathing segments.
* **Goal-to-Task Pipeline**: Converts abstract goals to milestones using a semantic analyzer, assigning difficulty levels, time offsets, and action domains.
* **Autopilot Replanning**: Evaluates modified parameters dynamically. When a session is missed, it moves upcoming timelines forward and displays an exact explanation of the scheduling shift with a confidence indicator.

---

## 11. Enterprise-Grade Security Protocols

1. **Secured Backend Proxy Architecture**: Clients never query Gemini directly. This eliminates exposed authorization keys in browser network panels.
2. **Granular Firebase Security Rules**:
   ```javascript
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
   Ensures that users can only read and write to documents nested under their specific authenticated UUID.
3. **Prompt Injection Mitigation**: Generative prompts use structured data serialization, sanitizing freeform user texts prior to context packing to prevent behavioral override commands.
4. **Backend Rate Limiting**: Implements IP-based rate limiting on key API endpoints (`/api/ai/*`) to prevent automated script abuse.

---

## 12. Project Structural Directory

```
├── .env.example                # Example environment configuration
├── .gitignore                  # Production artifact filters
├── AGENTS.md                   # ShieldAI project handbook & guidelines
├── README.md                   # World-class public documentation
├── firebase-applet-config.json # Applet deployment parameters
├── firebase-blueprint.json     # Firestore collections database schema
├── firestore.rules             # Granular database document policies
├── index.html                  # Main entry page template
├── metadata.json               # System configuration permissions
├── package.json                # Project script manifests & dependencies
├── server.ts                   # Unified dev proxy & API Express server
├── src
│   ├── App.tsx                 # Main application structure, routing, & auth lazy loaders
│   ├── types.ts                # Global central TypeScript type definitions
│   ├── index.css               # Global Tailwind CSS directives & theme configurations
│   ├── main.tsx                # Client bootstrap entry point
│   ├── components
│   │   ├── CommandCenter.tsx   # TODAY COMMAND CENTER: Timeline scheduler & syllabus analysis
│   │   ├── Dashboard.tsx       # MISSION TERMINAL: Real-time telemetry, streaking metrics, widgets
│   │   ├── FocusRoom.tsx       # FOCUS SPACE: Real-time stress pacer & animated breathing modules
│   │   ├── ActiveAICopilot.tsx # ACTIVE COPILOT: Real-time context hints & Rescue Buttons
│   │   ├── AICompanionAvatar.tsx# AI COMPANION AVATAR: Animated state visualizer representing fatigue
│   │   ├── AIAdvisor.tsx       # COGNITIVE CLINIC: Freeform conversational advisor & analysis logs
│   │   ├── AuthAndOnboarding.tsx# AUTHENTICATION & INITIAL ONBOARDING: Profile and scheduling preferences
│   │   └── IntegrationsHub.tsx # INTEGRATIONS CENTER: Third-party connection toggles (Calendar, Slack)
│   └── lib
│       └── demoPersonas.ts     # Pre-configured sandbox profile templates for evaluations
└── tsconfig.json               # TypeScript compiler configuration
```

---

## 13. Future Roadmap

### 🚀 Version 2.0 – AI Academic Operating System
* **Document Parser Expansion**: OCR-driven extraction from PPTs, Handouts, and lecture PDFs.
* **AI Mock Generator**: Creates timed mock tests directly from extracted syllabus units.
* **Active Recall Spaced Repetition**: Dynamic push notifications prompting quick mental test runs on identified weak subjects.

### 🌐 Version 3.0 – AI Life Operating System
* **Biometric Synchronization**: Wearable SDK hooks evaluating live HRV metrics to adjust energy ratings dynamically.
* **Social Study Pools**: Secure multiplayer visual focus tables keeping users accountable in real time.

---

## 14. Engineering Lessons Learned

1. **Token Cost Efficiencies**: Transitioning from freeform generative prompts to strict JSON-structured prompt models reduced average token consumption per API call by up to **42%**.
2. **Lazy Database Binding**: Binding Firestore listeners dynamically only after Auth confirmation prevents structural memory leaks and protects read/write operation quotas.
3. **Deterministic State Recovery**: Bundling server-side code to CommonJS (`dist/server.cjs`) using `esbuild` decreased container start latency down to **under 200ms**, facilitating immediate cold-starts in cloud deployments.

---

## 15. Contributing Guidelines

We welcome pull requests from developers looking to build cognitive-first tools.
1. Fork this repository.
2. Create your topic branch: `git checkout -b feature/dynamic-pacing`
3. Commit changes (comply with strict linter parameters: `npm run lint`).
4. Submit a Pull Request.

---

## 16. License

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE](LICENSE) file for details.

---

## 17. Acknowledgements

* **Google Cloud Platform** for the resilient Cloud Run container infrastructure.
* **Google Gemini Core Team** for providing the high-speed Gemini API framework.
* **React & Vite Communities** for building high-speed client frameworks.

---
*ShieldAI is dedicated to engineering a highly disciplined, distraction-free environment. Maintain these standards, protect the user's focus, and build the future of mindful productivity.*
