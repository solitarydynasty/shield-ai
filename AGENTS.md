# ShieldAI Project Handbook (AGENTS.md)

Welcome! This document is the comprehensive project handbook, architecture guide, and operational standard for **ShieldAI**—an AI-powered Life Operating System. It is loaded automatically into every AI agent session to preserve the vision, tech stack, and quality standards established for this application.

---

## 1. Project Vision
**ShieldAI** is a premium, AI-powered **Life Operating System** (Life OS), designed to move beyond passive calendars and basic todo lists. It actively shields the user from cognitive overload, procrastination, and burnout through a system of proactive, context-aware, and safety-first cognitive interventions.

### Core Philosophy:
*   **Proactivity over Reactivity:** Instead of waiting for a user to fail or seek help, the system senses potential risk zones (e.g., compressed deadlines, low energy levels, or attention drifts) and intervenes.
*   **Pacing & Energy Preservation:** Integrating human cognitive safety (like Box Breathing) and adaptive task decomposition based on energy states to protect the user's mental batteries.
*   **Intelligent Companion:** A sidekick (the Copilot/Companion Avatar) that serves as an encouraging partner, translating raw schedule metrics into humanized strategic suggestions.

---

## 2. Architecture Overview
ShieldAI is a robust full-stack web application built on a modern containerized infrastructure:

```
┌────────────────────────────────────────────────────────┐
│                        FRONTEND                        │
│             React 18 + Vite (Tailwind CSS)             │
│   (Dashboard, FocusRoom, Copilot, TaskDecomposer)      │
└────────────┬──────────────────────────────▲────────────┘
             │                              │
     Restful JSON API               Firestore Realtime Sync
             │                              │
┌────────────▼──────────────────────────────┴────────────┐
│                        BACKEND                         │
│             Node.js + Express (server.ts)              │
│          Handles Gemini SDK Proxy & Fallbacks          │
└────────────┬───────────────────────────────────────────┘
             │
      @google/genai SDK
             │
┌────────────▼──────────┐
│      Gemini API       │
│  (gemini-2.5-flash)   │
└───────────────────────┘
```

*   **Frontend Technologies:** React 18, Vite, Tailwind CSS, and `lucide-react` for iconography. Styled with an ultra-premium, high-contrast dark visual design ("Cosmic Slate & Amber"). Animations are powered by custom Tailwind transitions and lightweight CSS keys.
*   **Backend Technologies:** Node.js, Express, and `tsx` for execution. Built and bundled via `esbuild` for CJS production compilation (`dist/server.cjs`) to ensure rapid cold-starts.
*   **Firebase Integration:** Real-time data sync with Google Cloud Firestore for persistent storage of Tasks, Calendar Events, User Profiles, and Learning Profiles. Initialized lazily and protected by strict security rules.
*   **AI Integration:** Integrates the modern `@google/genai` TypeScript SDK server-side (using `gemini-2.5-flash`), with client-side parameters such as target deadline, energy levels, and historical habits determining task scheduling and pacer-break duration.
*   **Database Schema (firebase-blueprint.json):**
    *   `/tasks`: Key-value task payloads containing subtasks, risk factors, burnout estimates, cognitive energy levels, and pacing safety recommendations.
    *   `/calendar_events`: Time blocks for chronologically organized execution.
    *   `/user_profiles`: Gamification metrics, active streaks, and current level parameters.
    *   `/learning_profiles`: Historical efficiency speed multipliers across disciplines (e.g., Coding, Design).
*   **Authentication Flow:** Prepared for secure federated sign-in with Firebase Authentication.
*   **API Architecture:** Clean backend endpoints proxy sensitive API keys securely:
    *   `POST /api/ai/decompose`: Decomposes main objectives into adaptive, energy-aligned micro-milestones.

---

## 3. Development Principles
Every addition or modification to the ShieldAI codebase must adhere to the following strict guidelines:
*   **Zero Regression Policy:** Never break existing features. Read-Modify-Write is mandatory: always call `view_file` on files to understand current implementations before modifying.
*   **Iterative Progression:** Improve before replacing. Refactor surgically, targeting precise line blocks without throwing away functioning state managers or UI structures.
*   **Modular Architecture:** Avoid single-file monolithic layouts. Separate reusable layout components (`src/components/`) and centralize global type interfaces (`src/types.ts`).
*   **Production-Grade Excellence:** Avoid mock console logs, placeholder features, or "AI slop" indicators (like mock container ports, raw network state indicators in margins, or unrequested telemetry dashboards). Keep layout borders clean, crisp, and high-fidelity.

---

## 4. UI/UX Standards
ShieldAI is modeled to evoke a highly polished, distraction-free environment:
*   **Design Language:** Implements a dark visual theme utilizing true blacks (`#000000`), deep charcoal grays (`#0A0A0A`, `#111111`), with a high-contrast energetic amber (`#FF5C00`, `#FF7A00`) accent color scheme.
*   **Layout & Responsive Hierarchy:** Desktop-first precision with mobile-first fluidity. High density on wide screens using bento-grid layouts; single-column stacked structures for mobile screens. Touch targets must be at least 44px on mobile devices.
*   **Typography:** Primary font is **Inter** for standard interface items. Display headings use **Space Grotesk** or high-contrast display weights. Technical meta-information and statistics utilize **JetBrains Mono** or standard monospaced families.
*   **Accessibility (a11y):** Maintain strong contrast ratios between slate/amber foreground text against dark charcoal panels. Focus outlines must be clear.
*   **Micro-Animations:** Use subtle transition durations (`transition-all duration-300`, `hover:scale-[1.01]`, active scaling click effects) to make buttons feel alive.

---

## 5. AI Design Principles
The artificial intelligence layer of ShieldAI operates under a strict behavioral framework:
*   **Contextual Adaptive Pacing:** The AI doesn't just calculate timeline estimates; it modifies estimates dynamically according to the user's reported **Cognitive Energy Level** (Charged, Balanced, or Depleted).
    *   *Low Energy State:* AI decomposes tasks into smaller, less intimidating micro-steps (15-20 min max) and automatically injects pacing breaks.
    *   *High Energy State:* AI designs aggressive, focused sprint structures to capitalize on peak flows.
*   **Exploratory Transparency:** Recommendations must be justified with clean human phrasing (e.g., "Pacing Shield Active: Micro-breaks are forced after every 15-minute focus interval...").
*   **No Public Credentials:** The frontend never connects directly to Gemini. All AI tasks run via secure server-side proxy routes, preventing Gemini API key exposure in client-side headers.
*   **Prompt Efficiency:** Keep system prompts highly specific, requesting strict structured JSON outputs to avoid trailing token wastes and schema parse failures.

---

## 6. Security Standards
We enforce strict bank-grade standards to protect user workflow integrity:
*   **Zero Leak Environment:** Never commit secret environment variables directly to code. Declare placeholders inside `.env.example`.
*   **Robust Input Validation:** Validate payloads on backend router paths, rejecting empty or corrupt inputs before hitting database pipelines or AI models.
*   **Enforced Firestore Security Rules:** Maintain active protection inside `firestore.rules`. Prevent general reads and writes by checking document ownership, ensuring only authenticated payloads reach document states.
*   **Prompt Injection Protection:** Enforce parameterized inputs in generative model calls. Wrap user-provided text inputs securely within double quotes inside system instructions to prevent behavioral overrides.
*   **Secure Logging:** Never print raw auth strings, tokens, or personal identifiers in error console outputs. Log errors securely via structured JSON formats.

---

## 7. Performance Standards
Optimized for high performance and low battery drain:
*   **Firestore Operation Budgeting:** Never query collections repeatedly in standard render cycles. Maintain global React states, batch write updates only when necessary, and use single-pass fetches on app boot.
*   **Token Optimization:** Limit maximum tokens for generative responses, and structure outputs to use compact CJS arrays.
*   **Bundle and Runtime Speed:** Avoid heavy heavy-duty graphic imports. Style elements entirely via modern Tailwind CSS utilities to avoid CSS compilation overhead.

---

## 8. Current Implemented Features
*   **Adaptive Task Decomposer:** Translates complex deliverables into customized step-by-step milestones, automatically calculating Burnout Risks and customized Cognitive Pacing Safety Recommendations.
*   **Live Focus Room:** An immersive work interface featuring an adjustable "Stress/Procrastination Radar Slider" and a fully integrated, guided **Box Breathing Cortisol Flush Panel** (featuring 4-second Inhale/Hold/Exhale/Rest cycles with synchronized visual ripple animations).
*   **Active AI Copilot:** A proactive assistant panel providing real-time cognitive tips, and actionable "Emergency Rescue Options" if a user is feeling stuck.
*   **Integrations Hub:** Allows configuring connection hooks to calendars, task pipelines, and learning habits.
*   **AI Companion Avatar:** An interactive, animated avatar reacting visually to the user's stress level and current focus phase.
*   **Performance Dashboard:** A master panel displaying core productivity, active streaks, gamification reward categories, and cognitive state widgets.

---

## 9. Future Roadmap
ShieldAI is designed to expand into the ultimate cognitive shield:
1.  **Multi-User & Group Focus Pools:** Synchronous team sprints with mutual pacing protection blocks.
2.  **Full Auth Onboarding:** Seamless Firebase Auth with Google and Microsoft SSO.
3.  **AI Trust & Transparency Center:** An interactive dashboard illustrating how the model determines burnout risk, and allowing manual weight tweaking.
4.  **Google Calendar & Slack Sync:** Proactively adjusting focus schedules when high-stress meeting blocks are detected in real-time.
5.  **Biometric Integration:** Connect optional smart wearables to feed actual HRV (Heart Rate Variability) and stress markers directly into the Cognitive Energy state engine.

---

## 10. Coding Standards
*   **Clean TypeScript Syntax:** Absolute type declarations, strict avoidance of `any` where possible, and named exports.
*   **Modular Componentization:** Keep sub-components under `src/components/`, extracting local states where appropriate to avoid unnecessary parent re-renders.
*   **State Localization:** Only lift states to `src/App.tsx` when data must be shared globally (e.g., active tasks, synchronization logs, profile data).

---

## 11. Working Rules for Future AI Sessions
*   **Always Review First:** Do not start making code changes until you have read the relevant files completely.
*   **No Unsolicited Rewrites:** Do not rewrite whole modules to add minor features. Target your edits surgically using the precise lines of code.
*   **Explain Architectural Decisions:** When suggesting improvements, briefly explain the trade-offs (e.g., performance impact vs. complexity).
*   **Always Maintain Backward Compatibility:** Keep existing API and state contracts intact when adding features or properties.

---

*This guide serves as our commitment to engineering craft. Maintain these standards, protect the user's focus, and build the future of mindful productivity.*
