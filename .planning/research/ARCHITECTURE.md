# Architecture Research

**Domain:** DevPath v1.1 milestone integration architecture
**Researched:** 2026-03-22
**Confidence:** HIGH

## Standard Architecture

### System Overview

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React + Vite)                            │
├──────────────────────────────────────────────────────────────────────────────┤
│  Onboarding UI   Dashboard/Explore   Lesson/Quiz   Plans/Settings          │
│       │                │                 │              │                    │
│       ├─────────────── HTTP via axios + access token ──────────────────────┤
│       │                │                 │              │                    │
└───────┼────────────────┼─────────────────┼──────────────┼────────────────────┘
        │                │                 │              │
┌───────▼────────────────▼─────────────────▼──────────────▼────────────────────┐
│                         NESTJS APPLICATION MONOLITH                          │
├──────────────────────────────────────────────────────────────────────────────┤
│ Auth Module         Onboarding Module        Learning Paths Module           │
│ Progress Module     AI Module                Subscriptions Module            │
│                                                                              │
│ New/expanded v1.1 integration services inside monolith:                     │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────────┐ │
│  │ Learner Profile    │  │ Path Personalizer  │  │ Domain Event Publisher │ │
│  │ Aggregation        │  │ / Main Path Policy │  │ (app-internal)         │ │
│  └─────────┬──────────┘  └─────────┬──────────┘  └──────────┬─────────────┘ │
│            │                        │                        │               │
│  ┌─────────▼──────────┐  ┌─────────▼──────────┐  ┌──────────▼─────────────┐ │
│  │ Leaderboard        │  │ Notifications      │  │ Payment Activation     │ │
│  │ Projection/Service │  │ Consumer/Service   │  │ + Webhook Handlers     │ │
│  └────────────────────┘  └────────────────────┘  └────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│                         PRISMA + POSTGRESQL                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│ users | onboarding_data | user_learning_paths | user_progress |             │
│ learning_sessions | ai_interaction_logs | subscriptions | payment_logs |    │
│ new learner_profile / onboarding_round / notification / leaderboard tables  │
└──────────────────────────────────────────────────────────────────────────────┘
        │                                  │                                  │
        ▼                                  ▼                                  ▼
  AI gateway                         MoMo / VNPay                       Email / in-app
  (existing)                         webhooks                          delivery later
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Frontend onboarding flow | Render initial onboarding, later rounds, recommendation review, and confirm main path | Existing `frontend/src/pages/Onboarding.tsx` expanded into round-aware fetch/mutate flow |
| Frontend app shell | Surface main-path state, notification badge/list, leaderboard summary, payment status refresh | Existing dashboard/settings/plans pages with thin API orchestration |
| Auth module | Preserve JWT + refresh-cookie session lifecycle so new milestone flows are reliable | Existing `auth` module, stabilized refresh behavior |
| Onboarding module | Own question rounds, answer submission, recommendation trigger, and path confirmation entrypoints | Existing module expanded; do not move this logic into frontend |
| Learner profile service | Build canonical learner profile from onboarding answers + behavior signals + confirmed preferences | New service inside backend monolith, backed by normalized fields + JSON snapshot |
| Path personalizer | Produce AI-suggested main path, store explanation/focus areas, and enforce soft guidance rules | New service called by onboarding/dashboard/AI-chat contexts |
| Learning paths module | Continue owning catalog/path retrieval and user enrollments; expose main-path aware views, not recommendation logic | Existing module modified, boundary preserved |
| Progress module | Emit domain events when sessions end, lessons complete, quizzes pass, or streaks change | Existing module modified to publish events after successful writes |
| Leaderboard service | Convert earned-point events into user score/rank projection | New module/service with write-side idempotency |
| Notifications service | Consume domain events and create in-app notification records | New module/service; delivery stays internal first |
| Subscriptions module | Keep provider-specific payment logic, webhook verification, and subscription activation | Existing module modified; no payment secrets in frontend |
| Payment activation service | Make webhook handling idempotent and emit upgrade notifications/events after activation | New internal service under subscriptions boundary |

## Recommended Project Structure

```text
backend/src/modules/
├── auth/                          # Existing session + refresh flow (stabilize only)
├── onboarding/                    # Existing onboarding API, expanded to multi-round flow
│   ├── dto/
│   ├── recommendation/
│   ├── rounds/                    # New: round selection / progression policy
│   └── onboarding.service.ts
├── learning-paths/                # Existing path catalog + enrollment
├── progress/                      # Existing progress + session tracking, now emits events
├── subscriptions/                 # Existing payment + subscription flow
│   ├── payments/                  # Existing provider clients
│   ├── activation/                # New: idempotent activation + reconciliation
│   └── subscriptions.service.ts
├── learner-profile/               # New: canonical learner profile read/write boundary
├── personalization/               # New: main-path suggestion + contextual AI inputs
├── notifications/                 # New: notification record creation/query
├── leaderboard/                   # New: points ledger + rank projection
└── events/                        # New lightweight app-internal publisher/contracts

frontend/src/
├── pages/Onboarding.tsx           # Modified: rounds, resume state, confirm main path
├── pages/Dashboard.tsx            # Modified: main-path card, notifications, rank summary
├── pages/Explore.tsx              # Modified: secondary paths separated from main path
├── pages/Plans.tsx                # Modified: secure upgrade initiation + pending states
├── pages/PaymentResult.tsx        # Modified: result polling from backend, not URL trust only
├── components/                    # Existing UI components reused
└── services/api.ts                # Modified: more robust refresh + replay behavior
```

### Structure Rationale

- **Keep the monolith:** v1.1 scope is integration-heavy, not scale-heavy. New modules should stay inside the NestJS app and communicate through service calls plus app-internal events.
- **Add `learner-profile/` as a canonical boundary:** onboarding answers, behavioral signals, and personalization outputs should not be scattered across onboarding, AI chat, and dashboard services.
- **Add `events/` but not a separate message broker yet:** backend-minimum leaderboard and notifications can be event-driven inside one process first, with tables as durable state.
- **Keep payment provider clients inside `subscriptions/`:** MoMo/VNPay details are infrastructure concerns, not general business logic.

## Architectural Patterns

### Pattern 1: Canonical Learner Profile

**What:** Maintain one backend-owned learner profile aggregate that combines declared intent and observed behavior.
**When to use:** Adaptive onboarding, AI-suggested main path, personalized AI chat, and recommendation refreshes.
**Trade-offs:** Slightly more schema/workflow upfront, but avoids duplicated profile inference in many modules.

**Recommended shape:**
- Normalized fields for frequently queried values: goal, background, hours/week, main path, profile version, last recalculated at.
- JSON snapshot for flexible derived context: focus areas, confidence score, skipped concepts, recommendation rationale.

**Example:**
```typescript
interface LearnerProfileSnapshot {
  declaredGoal: 'FRONTEND' | 'BACKEND' | 'FULLSTACK' | 'AI_PYTHON';
  onboardingRoundsCompleted: string[];
  observedSignals: {
    lessonsCompleted: number;
    quizStrengths: string[];
    quizWeaknesses: string[];
    aiTopics: string[];
  };
  currentMainPath: {
    learningPathId: string;
    source: 'ai' | 'fallback' | 'manual';
    confirmedAt: string | null;
  } | null;
  recommendationContext: {
    focusAreas: string[];
    confidence: number;
    reason: string;
  };
}
```

### Pattern 2: Soft Main-Path Policy

**What:** One user may explore many paths, but only one path is marked as the guided main journey at a time.
**When to use:** Dashboard prioritization, next-lesson CTA, notification relevance, and recommendation UX.
**Trade-offs:** Requires one extra concept in domain model, but prevents current ambiguity where enrollment and recommendation are the same thing.

**Rule:**
- `main path` is guidance state.
- `enrolled paths` are access state.
- Secondary activity remains allowed and visible, but does not replace main-path UX until user explicitly switches.

**Example:**
```typescript
// Enrollment stays in learning-paths boundary
// Main-path selection lives in learner-profile/personalization boundary
{
  enrollments: ['frontend-developer', 'backend-developer'],
  mainPath: 'frontend-developer',
  secondaryPaths: ['backend-developer']
}
```

### Pattern 3: Transaction + Post-Commit Event Emission

**What:** Perform state-changing writes atomically first, then publish a domain event for leaderboard/notifications.
**When to use:** Lesson completion, quiz pass, path confirmation, subscription activation.
**Trade-offs:** Consumers may lag slightly behind source writes, but source-of-truth consistency stays clean.

**Example:**
```typescript
const result = await prisma.$transaction(async (tx) => {
  const progress = await tx.userProgress.update({ /* ... */ });
  return { userId, lessonId, progressId: progress.id };
});

await domainEvents.publish({
  type: 'lesson.completed',
  userId: result.userId,
  lessonId: result.lessonId,
  occurredAt: new Date().toISOString(),
});
```

## Data Flow

### Request Flow

```text
User action
   ↓
React page/component
   ↓
axios API call with access token
   ↓
NestJS controller
   ↓
Domain service / transaction
   ↓
Prisma write(s)
   ↓
Optional domain event publish
   ↓
Projection services update notifications / leaderboard
   ↓
Frontend re-fetches canonical state
```

### State Management

```text
Zustand
  └── Auth/session only (keep small)

Server-backed UI state
  ├── onboarding round state
  ├── learner profile summary
  ├── main path recommendation/confirmation
  ├── leaderboard summary
  └── notifications list/count

Source of truth = backend APIs, not frontend local derivation
```

### Key Data Flows

1. **Adaptive onboarding rounds**
   - User completes initial round in `Onboarding` page.
   - `OnboardingService` stores round answers and updates learner profile snapshot.
   - Round policy checks whether more questions are needed based on missing confidence, weak signals, or elapsed behavior.
   - Frontend renders next round only when backend says another round is due.
   - Recommendation is generated from learner profile snapshot, not raw page state.

2. **Learner profile persistence**
   - Declared inputs come from onboarding answers.
   - Observed inputs come from `learning_sessions`, `user_progress`, `quiz_results`, and optionally `ai_interaction_logs`.
   - A profile recomputation service updates a canonical profile record/snapshot whenever key milestones happen.
   - AI chat and dashboard read the same canonical profile summary.

3. **AI-suggested main path behavior**
   - Recommendation engine reads learner profile + published paths.
   - It returns `primaryPath`, alternatives, rationale, focus areas, and confidence.
   - User confirmation writes main-path state separately from enrollment.
   - Dashboard, lesson CTA, and explore ordering read `mainPath` first; off-path study still works.

4. **Event-driven notifications**
   - Source modules emit events like `path.confirmed`, `lesson.completed`, `quiz.passed`, `subscription.activated`, `subscription.expiring`.
   - Notifications module stores user-facing notification rows with read/unread state.
   - UI consumes notification list/count via polling or simple re-fetch after actions. Realtime is unnecessary for v1.1.

5. **Leaderboard points/rank**
   - Progress/quiz modules emit point-earning events.
   - Leaderboard module writes an idempotent points ledger, then updates a rank projection table or computes rank from totals.
   - Dashboard reads summary view: total points, current rank, recent delta.
   - Keep scope platform-wide only; no friend/team graph now.

6. **Secure real payment activation**
   - Frontend starts payment via backend `subscriptions/create` only.
   - Backend creates `payment_logs` row before redirect.
   - Provider webhook verifies signature and updates `payment_logs`, `subscriptions`, and `users.tier` atomically.
   - Activation emits `subscription.activated` event, producing notification and UI refresh.
   - `PaymentResult` page should query backend status by `orderId`; never trust query-string `status` alone.

## Milestone-Scoped Integration Changes

### New Components

| New Component | Why It Exists | Boundary |
|---------------|---------------|----------|
| LearnerProfile module/service | Canonical persistence for adaptive onboarding + personalization | Owns profile aggregate; other modules read/write through service |
| Personalization service | Isolates recommendation/main-path policy from onboarding CRUD | Sits beside onboarding and learning-paths, does not replace either |
| Domain events contracts/publisher | Enables event-driven notifications + leaderboard without microservices | Internal app boundary only |
| Notifications module | Stores in-app notifications and unread counts | Consumes events, does not own source business state |
| Leaderboard module | Tracks points and rank projection | Consumes events, does not mutate progress |
| Payment activation/reconciliation service | Makes webhooks idempotent and auditable | Stays inside subscriptions boundary |

### Modified Components

| Existing Component | Required Change | Why |
|--------------------|-----------------|-----|
| `onboarding` module | Add round progression, answer versioning, and confirm-main-path behavior | Current onboarding is one-shot and too shallow for v1.1 |
| `learning-paths` module | Distinguish access/enrollment from main-path guidance | Prevent business logic overlap with personalization |
| `progress` module | Publish completion/activity events after writes | Feeds notifications and leaderboard |
| `ai` module | Accept learner profile context as bounded input | Personalization should inform prompts without making AI the source of truth |
| `subscriptions` module | Add idempotent activation, provider config hardening, result-status query endpoint | Needed for real-money reliability |
| `frontend/src/pages/Onboarding.tsx` | Switch from single submit flow to backend-driven rounds/resume | Avoid client-side orchestration drift |
| `frontend/src/pages/Plans.tsx` and `PaymentResult.tsx` | Use backend-confirmed payment status, pending state, and refresh | Query params are not authoritative |
| `frontend/src/services/api.ts` | Harden refresh retry behavior for protected flows | Stability-first milestone needs fewer auth loops |

## Build Order

Build in this order so dependencies stay clean and each phase unlocks the next.

1. **Stabilize auth/session transport**
   - Fix refresh retry loops and protected-route bootstrapping.
   - Reason: every new capability depends on reliable authenticated API calls.

2. **Introduce canonical learner profile persistence**
   - Add profile aggregate storage and read API.
   - Backfill from existing `onboarding_data`, `user_progress`, `quiz_results`, and `ai_interaction_logs`.
   - Reason: adaptive onboarding and personalization need one source of truth first.

3. **Expand onboarding into backend-driven rounds**
   - Add round definitions, saved progress, and recommendation recalculation triggers.
   - Reason: this creates the input pipeline for personalization.

4. **Add main-path policy and dashboard integration**
   - Separate `mainPath` from enrollments.
   - Update dashboard/explore ordering and confirm/switch behavior.
   - Reason: product guidance must become explicit before event-driven features depend on it.

5. **Add domain events + notifications skeleton**
   - Publish post-commit events from onboarding/progress/subscriptions.
   - Store notification records and unread count.
   - Reason: simple consumer pattern can be reused by both notifications and leaderboard.

6. **Add leaderboard points ledger and rank projection**
   - Award points from lesson/quiz events and expose summary API.
   - Reason: leaderboard depends on clean event emission, not vice versa.

7. **Harden real payment activation flow**
   - Make webhooks idempotent, add payment-status query endpoint, and trigger activation notifications.
   - Reason: real-money correctness should come after app event plumbing exists, but before wider release.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Single NestJS app + PostgreSQL is enough. Use internal events and synchronous consumers where safe. |
| 1k-10k users | Move event consumers to background jobs only if notification/leaderboard fan-out slows request path. Add indexes on event/idempotency and leaderboard totals. |
| 10k+ users | Consider durable queue/outbox for domain events and precomputed rank snapshots. Still no need to split services until one module is operationally dominant. |

### Scaling Priorities

1. **First bottleneck:** payment webhook idempotency and retry handling, because duplicate callbacks break money state faster than traffic volume does.
2. **Second bottleneck:** leaderboard rank computation if done from raw totals on every request. Add projection/snapshot before any service split.

## Anti-Patterns

### Anti-Pattern 1: Letting onboarding own long-term profile state

**What people do:** Store every personalization decision inside `onboarding_data` and keep reusing that table forever.
**Why it's wrong:** `onboarding_data` is initial intake, not a living learner model. Behavioral updates then become awkward or lossy.
**Do this instead:** Keep onboarding answers as source inputs, but build a separate learner-profile aggregate for ongoing personalization.

### Anti-Pattern 2: Treating recommendation as enrollment

**What people do:** Reuse `user_learning_paths` as both recommendation state and main-path state.
**Why it's wrong:** The current model cannot clearly answer “What is the guided path?” versus “What has the user opened before?”
**Do this instead:** Keep enrollment/access in learning-paths; store main-path guidance separately and explicitly.

### Anti-Pattern 3: Writing leaderboard and notification side effects inside progress transactions

**What people do:** One service updates progress, points, rank, and notifications in a big transaction.
**Why it's wrong:** Tight coupling raises failure surface and makes every feature block every other one.
**Do this instead:** Commit source-of-truth write first, then emit an event and project side effects separately.

### Anti-Pattern 4: Trusting payment return URLs as proof of success

**What people do:** Frontend reads `?status=success&tier=PRO` and upgrades UI immediately.
**Why it's wrong:** Return URLs are user-visible and not authoritative; only verified webhooks should activate subscriptions.
**Do this instead:** Frontend shows pending/result state, then asks backend for order status derived from verified records.

### Anti-Pattern 5: Putting provider secrets or recipient configuration in the frontend

**What people do:** Hardcode payment recipient identifiers or signing inputs in React components.
**Why it's wrong:** Secrets/config become exposed and impossible to rotate safely.
**Do this instead:** Keep provider config fully backend-managed via environment/config service; frontend only gets payment URLs and public plan metadata.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| AI gateway | Backend-only service call from `AiService` with bounded learner profile context | AI suggests; backend persists canonical decisions |
| MoMo | Backend creates order and verifies signed webhook | Activation must be idempotent and webhook-driven |
| VNPay | Backend creates payment URL and verifies checksum/hash on callback/IPN | Result page should read backend status, not URL params |
| Email delivery | Optional notifications channel later | v1.1 can ship with in-app notifications first |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Onboarding ↔ Learner Profile | Direct service call + profile recompute | Onboarding supplies declared inputs only |
| Learner Profile ↔ Personalization | Direct service call | Personalization reads canonical profile, not raw scattered tables |
| Personalization ↔ Learning Paths | Read catalog data / write main-path state through explicit API | Do not push recommendation logic into learning-paths service |
| Progress ↔ Events | Post-commit event publish | Keeps progress as source of truth |
| Events ↔ Notifications | Internal event consumer | Notification records are projections |
| Events ↔ Leaderboard | Internal event consumer | Points/rank are projections |
| Subscriptions ↔ Events | Post-activation event publish | Enables notification + UI refresh after verified payment |
| Frontend ↔ Payment result | Poll/query backend order status | Avoid client-trusted payment success |

## Recommended Data Model Adjustments

These are milestone-focused changes, not a schema rewrite.

| Area | Recommendation | Why |
|------|----------------|-----|
| Onboarding persistence | Add per-round records or answer-versioned table rather than overwriting one row | Supports adaptive rounds and resume |
| Learner profile | Add dedicated profile table with normalized fields + JSON snapshot | Gives one canonical read model |
| Main path state | Add explicit main-path reference/version, separate from enrollments | Preserves soft guidance model |
| Notifications | Add notification table with type, payload JSON, readAt | Minimal in-app notification system |
| Leaderboard | Add points ledger and/or totals projection | Enables idempotent scoring and ranking |
| Payments | Add idempotency marker on activation/webhook handling if not already present | Protects against duplicate provider callbacks |

## What Boundaries to Preserve

1. **Auth remains auth.** Do not bury refresh/session fixes inside onboarding or dashboard hacks.
2. **Learning paths remain catalog/enrollment.** Recommendation and main-path policy stay outside this module.
3. **AI remains advisory.** It should not directly mutate business-critical state without backend validation/persistence.
4. **Payments remain backend-owned.** Frontend initiates and displays only; backend verifies and activates.
5. **Notifications and leaderboard remain projections.** They react to source events, not vice versa.

## Sources

### Codebase Sources
- `/home/minhnhut_dev/projects/path-learn/.planning/PROJECT.md`
- `/home/minhnhut_dev/projects/path-learn/backend/prisma/schema.prisma`
- `/home/minhnhut_dev/projects/path-learn/backend/src/modules/onboarding/onboarding.service.ts`
- `/home/minhnhut_dev/projects/path-learn/backend/src/modules/learning-paths/learning-paths.service.ts`
- `/home/minhnhut_dev/projects/path-learn/backend/src/modules/progress/progress.service.ts`
- `/home/minhnhut_dev/projects/path-learn/backend/src/modules/ai/ai.service.ts`
- `/home/minhnhut_dev/projects/path-learn/backend/src/modules/auth/auth.service.ts`
- `/home/minhnhut_dev/projects/path-learn/backend/src/modules/subscriptions/subscriptions.service.ts`
- `/home/minhnhut_dev/projects/path-learn/backend/src/modules/subscriptions/subscriptions.controller.ts`
- `/home/minhnhut_dev/projects/path-learn/backend/src/modules/subscriptions/subscription-expiry.cron.ts`
- `/home/minhnhut_dev/projects/path-learn/backend/src/modules/subscriptions/payments/momo.service.ts`
- `/home/minhnhut_dev/projects/path-learn/backend/src/modules/subscriptions/payments/vnpay.service.ts`
- `/home/minhnhut_dev/projects/path-learn/frontend/src/pages/Onboarding.tsx`
- `/home/minhnhut_dev/projects/path-learn/frontend/src/pages/Plans.tsx`
- `/home/minhnhut_dev/projects/path-learn/frontend/src/pages/PaymentResult.tsx`
- `/home/minhnhut_dev/projects/path-learn/frontend/src/services/api.ts`
- `/home/minhnhut_dev/projects/path-learn/frontend/src/App.tsx`

### Official Documentation
- Prisma transactions: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
- Prisma JSON fields: https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields
- NestJS task scheduling: https://docs.nestjs.com/techniques/task-scheduling

---
*Architecture research for: DevPath v1.1 milestone integration architecture*
*Researched: 2026-03-22*
