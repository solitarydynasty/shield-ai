# ShieldAI Security Specification (security_spec.md)

This specification outlines the data invariants, threat model vectors (The "Dirty Dozen" Payloads), and verification strategies for securing ShieldAI's user-scoped hierarchical database architecture.

---

## 1. Data Invariants

1.  **Strict Owner Isolation**: No user (authenticated or unauthenticated) can read, create, update, or delete any document within the `/users/{userId}` hierarchy unless their authenticated UID exactly matches `{userId}` (`request.auth.uid == userId`).
2.  **Verified Email Mandate**: Users must have a verified email address (`request.auth.token.email_verified == true`) to commit any write operations to their production profiles, tasks, or calendar events.
3.  **Timestamp Temporal Integrity**: All `createdAt` fields must be bound directly to `request.time` on document creation, and all `updatedAt` fields must be bound to `request.time` on document modification. Client-supplied custom clocks are strictly rejected.
4.  **Immutability Invariants**: Key structural identifiers (e.g. `id`, `userId`, `taskId`, `createdAt`) must remain unchanged after creation.
5.  **Character Formatting Restrictions**: All document path keys and entity identifiers must conform to safe regex bounds to prevent document ID poisoning or script injections.

---

## 2. The "Dirty Dozen" Payloads (Red Team Attack Vectors)

The following malicious JSON payloads are engineered to test our security gates. All of these must return `PERMISSION_DENIED` under production rules.

### Pillar 1: Identity Spoofing & Cross-Tenant Intrusion
1.  **Vector 1: Foreign Task Injection**
    *   *Path*: `/users/victim-user-abc/tasks/malicious-task-1`
    *   *Payload*: `{ "id": "malicious-task-1", "title": "Injected Task", "deadline": "2026-07-10T00:00:00Z", "priority": "high", "riskLevel": "High", "riskFactor": 10, "completed": false, "createdAt": "2026-07-02T22:20:00Z" }`
    *   *Attacker Auth*: `uid: attacker-xyz`
    *   *Reason for Denial*: Path `userId` (`victim-user-abc`) does not match authenticated UID (`attacker-xyz`).

2.  **Vector 2: PII Leak Probe (Blanket Get)**
    *   *Path*: `/users/victim-user-abc/profile/main`
    *   *Operation*: `GET`
    *   *Attacker Auth*: `uid: attacker-xyz`
    *   *Reason for Denial*: Path `userId` does not match auth UID.

### Pillar 2: Privilege Escalation & Unverified Writes
3.  **Vector 3: Self-Assigned Status & Admin Role Modification**
    *   *Path*: `/users/attacker-xyz/profile/main`
    *   *Payload*: `{ "userId": "attacker-xyz", "streak": 9999, "unlockedMilestones": [1, 2, 3], "isAdmin": true }`
    *   *Attacker Auth*: `uid: attacker-xyz, email_verified: false`
    *   *Reason for Denial*: User does not have verified email (`email_verified == true`), and payload introduces invalid/un-allowlisted fields (`isAdmin`).

4.  **Vector 4: Shadow Field Injection ("Ghost Field")**
    *   *Path*: `/users/attacker-xyz/tasks/task-123`
    *   *Payload*: `{ "id": "task-123", "title": "Hackathon Code", "deadline": "2026-07-10T00:00:00Z", "priority": "high", "riskLevel": "High", "riskFactor": 10, "completed": false, "createdAt": "2026-07-02T22:20:00Z", "bypassValidation": true }`
    *   *Reason for Denial*: Payload fails strict key check (extra field `bypassValidation` is not allowed on creation).

### Pillar 3: Schema Violations & Resource Poisoning
5.  **Vector 5: Path Variable ID Poisoning**
    *   *Path*: `/users/attacker-xyz/tasks/INVALID_ID_WITH_SPECIAL_CHARS!@#$`
    *   *Payload*: `{ "id": "INVALID_ID_WITH_SPECIAL_CHARS!@#$", "title": "Malicious ID", "deadline": "2026-07-10T00:00:00Z", "priority": "high", "riskLevel": "High", "riskFactor": 10, "completed": false, "createdAt": "2026-07-02T22:20:00Z" }`
    *   *Reason for Denial*: Document ID fails path regex validations (`^[a-zA-Z0-9_\-]+$`).

6.  **Vector 6: Giant Value Denial-of-Wallet Injection**
    *   *Path*: `/users/attacker-xyz/tasks/task-123`
    *   *Payload*: `{ "id": "task-123", "title": "A".repeat(10000), "deadline": "2026-07-10T00:00:00Z", "priority": "high", "riskLevel": "High", "riskFactor": 10, "completed": false, "createdAt": "2026-07-02T22:20:00Z" }`
    *   *Reason for Denial*: Field size limits violated (title exceeds max character limits).

### Pillar 4: Temporal Integrity Corruption
7.  **Vector 7: Spoofed Creation Clock**
    *   *Path*: `/users/attacker-xyz/tasks/task-123`
    *   *Payload*: `{ "id": "task-123", "title": "Retroactive Hack", "deadline": "2026-07-10T00:00:00Z", "priority": "high", "riskLevel": "High", "riskFactor": 10, "completed": false, "createdAt": "1999-01-01T00:00:00Z" }`
    *   *Reason for Denial*: `createdAt` is not matched exactly to `request.time` (server-side clock).

8.  **Vector 8: Immutable Field Overwrite**
    *   *Path*: `/users/attacker-xyz/tasks/task-123`
    *   *Operation*: `UPDATE`
    *   *Existing*: `{ "id": "task-123", "title": "Real Code", "createdAt": "2026-07-02T22:20:00Z" }`
    *   *Modified Payload*: `{ "id": "task-123", "title": "Real Code", "createdAt": "2026-07-03T11:00:00Z" }` (Modifying createdAt)
    *   *Reason for Denial*: Mutating immutable creation timestamps is forbidden.

### Pillar 5: Logic and State Shortcutting
9.  **Vector 9: Status State Bypass (Subtask Direct Mutation)**
    *   *Path*: `/users/attacker-xyz/tasks/task-123`
    *   *Operation*: `UPDATE` (Attempting to mark all subtasks complete without completing actual focus blocks)
    *   *Attacker Payload*: Altering subtasks directly via invalid state parameters without proper timing.
    *   *Reason for Denial*: The modification fails structured schema checks or key difference white-lists.

10. **Vector 10: Array Size Overflow Attack**
    *   *Path*: `/users/attacker-xyz/tasks/task-123`
    *   *Payload*: Including an array (e.g., `rescueTriggers` or `subtasks`) with 5000 records to exhaust Firestore memory.
    *   *Reason for Denial*: Strict element count array bounds (`subtasks.size() <= 20`).

### Pillar 6: Unauthenticated Scraping & Collection Enumeration
11. **Vector 11: Unauthenticated Read Probe**
    *   *Path*: `/users/attacker-xyz/profile/main`
    *   *Operation*: `GET`
    *   *Auth*: `null`
    *   *Reason for Denial*: request.auth is null.

12. **Vector 12: Wildcard Scraping Attempt**
    *   *Operation*: Querying `/users` collection for all users list.
    *   *Reason for Denial*: Collection list query fails to restrict results based on request.auth.uid, or listing `/users` is completely blocked.

---

## 3. The Test Runner (`firestore.rules.test.ts`)

```typescript
// Draft test representation mapping security rule triggers using the Firebase Emulator
import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "shield-ai-security-test",
    firestore: {
      rules: require("fs").readFileSync("firestore.rules", "utf8")
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

test("Vector 1: Foreign Task Injection should be rejected", async () => {
  const attackerDb = testEnv.authenticatedContext("attacker-xyz").firestore();
  const targetRef = doc(attackerDb, "users/victim-user-abc/tasks/malicious-task-1");
  await expect(setDoc(targetRef, {
    id: "malicious-task-1",
    title: "Injected Task",
    completed: false
  })).rejects.toThrow("PERMISSION_DENIED");
});

test("Vector 11: Unauthenticated Read Probe should be rejected", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  const targetRef = doc(unauthDb, "users/attacker-xyz/profile/main");
  await expect(getDoc(targetRef)).rejects.toThrow("PERMISSION_DENIED");
});
```
