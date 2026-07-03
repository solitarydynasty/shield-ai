# ShieldAI Architecture & Technical Specifications

This document outlines the full-stack architecture, database models, security specifications, and artificial intelligence configurations for **ShieldAI v1.0 – Hackathon Edition**.

---

## 1. System Topology

ShieldAI is engineered as a robust, modern containerized web application. It uses a server-side proxy design to interact with foundational models securely, avoiding key exposure in client-side runtime environments.

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

### Architectural Core Decisions
1. **Client-Side SPA with Server API Proxy**: The frontend is built as a single-page application (SPA) using React 18, Vite, and Tailwind CSS. The backend Express API acts as a secure, fast gateway proxy to the Gemini API, maintaining system secrets securely.
2. **Deterministic State Synchronization**: To protect database reads and writes and maintain data consistency, we implement lazy-initialization on Cloud Firestore listeners. Database hooks only synchronize state when user sessions are verified and active.
3. **CJS Server Bundling**: Production servers compile the TypeScript entrypoint (`server.ts`) to CJS (`dist/server.cjs`) using `esbuild`. This eliminates runtime import lookup penalties and ensures container cold-starts remain under **200ms**.

---

## 2. Database Schema Design (Firestore)

ShieldAI uses Google Cloud Firestore for transactional, low-latency, and persistent storage. The collection blueprint is structured as follows:

```json
{
  "users": {
    "{userId}": {
      "profile": {
        "displayName": "String",
        "email": "String",
        "createdAt": "Timestamp",
        "onboarding": {
          "workingHoursStart": "String (HH:MM)",
          "workingHoursEnd": "String (HH:MM)",
          "sleepBedtime": "String (HH:MM)",
          "sleepWakeTime": "String (HH:MM)",
          "majorSubject": "String"
        },
        "gamification": {
          "level": "Number",
          "experience": "Number",
          "activeStreak": "Number",
          "lastActiveDate": "String (YYYY-MM-DD)"
        }
      },
      "tasks": {
        "{taskId}": {
          "title": "String",
          "deadline": "String (ISO Date)",
          "context": "String",
          "priority": "String ('low' | 'medium' | 'high' | 'critical')",
          "riskLevel": "String ('Low' | 'Medium' | 'High')",
          "riskFactor": "Number (0-100)",
          "completed": "Boolean",
          "createdAt": "String (ISO Date)",
          "burnoutRisk": "Number (0-100)",
          "energyLevel": "String ('low' | 'medium' | 'high')",
          "subtasks": [
            {
              "id": "String",
              "title": "String",
              "description": "String",
              "durationMinutes": "Number",
              "completed": "Boolean",
              "suggestedTime": "String",
              "category": "String"
            }
          ]
        }
      },
      "calendar_events": {
        "{eventId}": {
          "title": "String",
          "startTime": "String (ISO Date)",
          "endTime": "String (ISO Date)",
          "category": "String",
          "completed": "Boolean"
        }
      },
      "learning_profiles": {
        "efficiency": {
          "Coding": "Number (multiplier)",
          "Design": "Number (multiplier)",
          "Research": "Number (multiplier)",
          "Documentation": "Number (multiplier)",
          "Testing": "Number (multiplier)"
        }
      }
    }
  }
}
```

---

## 3. AI Cognitive Engine Implementation

The intelligence pipeline translates variable user inputs into structured, predictable data models using Gemini 2.5 Flash.

### Dynamic Workload Allocator (Pacing Engine)
The model consumes multiple contexts to design the optimal timeline:
1. **Mental Energy Level** (`low` | `medium` | `high`):
   * *Low State*: Injects frequent resting periods. Sprints are capped at 15-20 minutes.
   * *High State*: Outlines long, intense focus sprint intervals (up to 90 minutes).
2. **Stress & Procrastination Slider**: Measured dynamically in the Focus Room, this modifies AI response tone and recommendations in real time.
3. **Overlapping Commitments**: Calculates the proximity of concurrent milestones to highlight compressed deadlines.

### Schema Integrity Enforcement
To prevent JSON parsing failures, all server endpoints require the generative model to output strict schemas.
* **MIME Type Enforcement**: `responseMimeType: "application/json"` is explicitly configured on the SDK generation configuration parameters.
* **Deterministic Fallbacks**: If the API key is not populated, local mock generators intercept requests, preventing server crashes and maintaining full application functional behavior.

---

## 4. Security Controls

ShieldAI is modeled under strict security-by-design standards:

### 1. API Rate Limiting & Safety Guardrails
All critical AI endpoints are protected by memory-bound rate limiters:
* Max of 10 requests per minute per IP address on generative APIs.
* Full-stack validation sanitizes inputs, preventing prompt injections by wrapping user strings in dedicated JSON parameters.

### 2. Firestore Document Rules
To isolate user data, the system implements the following verified security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 3. Server telemetry & Diagnostics
An integrated telemetry sub-module tracks real-time operations:
* Estimated API model token consumption rates.
* Database session read/write counters.
* In-memory cache hit/miss distributions.
