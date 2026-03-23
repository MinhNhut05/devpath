# Project Research Summary

**Project:** DevPath Learning v1.1 — Post-MVP Stabilization & Personalization
**Domain:** AI-assisted personalized learning platform for Vietnamese IT learners
**Researched:** 2026-03-23
**Confidence:** HIGH (stack + architecture + pitfalls), MEDIUM (feature prioritization details driven partly by product-pattern inference)

## Executive Summary

DevPath v1.1 is not a rewrite milestone. It is a post-MVP product-hardening release for an existing React SPA + NestJS monolith that already covers auth, onboarding, learning paths, lessons, quizzes, progress, AI chat, payments, and admin. The research is consistent across all four documents: experts would keep the current stack, stabilize the session and payment foundations first, then layer personalization through a backend-owned learner profile, backend-driven onboarding rounds, and a soft “main path” guidance model rather than hard-gating content.

The recommended approach is to treat personalization as a data-model and state-consistency problem before treating it as an AI problem. Specifically: stabilize auth refresh; introduce a canonical learner profile aggregate; expand onboarding into resumable backend-driven rounds; separate `mainPath` guidance state from enrollment/access state; then add event-driven notifications and a points ledger for leaderboard features. AI should remain advisory and explainable, not the source of truth for learner state. Frontend changes should stay thin and server-backed, with Vietnamese UX cleanup and critical Frontend-path content coverage handled as release-quality work throughout the milestone.

The main risks are architectural drift and false trust signals. If session refresh remains unstable, every new protected flow will look broken. If onboarding, dashboard, AI chat, and path recommendations each infer the learner differently, personalization will contradict itself. If payment success is trusted from return URLs instead of verified backend records, real-money state will become unreliable. The mitigation is clear: keep backend APIs as the source of truth, use transactions plus post-commit event publication, make notifications/leaderboard projections idempotent, and only expose personalization when the recommended main path is backed by usable content.

## Key Findings

### Recommended Stack

DevPath should continue with the current production stack: NestJS 11 + Prisma 7 + PostgreSQL 16 + Redis 7 on the backend, and React 18 + Vite 6 + TypeScript + Tailwind CSS on the frontend. The research strongly recommends staying inside the existing monolith and extending it with new modules for learner profile, personalization, notifications, leaderboard, and app-internal events rather than introducing microservices, GraphQL, WebSockets, or a frontend framework rewrite.

**Core technologies:**
- **NestJS 11.x:** Backend application framework — preserves module boundaries and supports adding learner-profile, notifications, leaderboard, and payment-hardening services without a rewrite.
- **Prisma 7.x + PostgreSQL 16.x:** Primary persistence layer — ideal for adding milestone-scoped tables such as learner profile, onboarding rounds, notifications, points ledger, and payment idempotency markers.
- **Redis 7.x:** Cache/rate-limiting backbone — already fits auth and protected API stability needs; no reason to replace it for v1.1.
- **React 18 + Vite 6 + TypeScript 5.7:** Existing SPA foundation — supports incremental UX changes without disrupting the deployed architecture.
- **axios + zustand:** Current transport/session setup — keep them, but harden refresh retry behavior and keep zustand limited to auth/session state.
- **Tailwind CSS 3.x:** Existing UI system — sufficient for Vietnamese UX cleanup, dashboard prioritization, leaderboard summary, and notification surfaces.
- **AI gateway via backend only:** AI remains a backend-managed integration — suitable for explainable main-path suggestions and bounded profile-aware chat.
- **MoMo / VNPay backend-owned integrations:** Payment flow should stay server-side with verified callback/webhook activation and status polling.

**Critical version / dependency notes:**
- No framework rewrites are recommended for v1.1.
- The only likely new dependency is `@nestjs/event-emitter` (plus `eventemitter2`) for app-internal domain events.
- Tailwind 4, microservices, GraphQL, Socket.io, and external brokers are explicitly out of scope for this milestone.

### Expected Features

The feature research is clear that v1.1 must feel stable and credibly personalized, not merely “more feature rich.” The milestone’s table stakes are the reliability and guidance features users already assume should work in a personalized learning platform. Differentiation comes from explainable, soft guidance and Vietnamese-first polish, not from over-automated AI behavior or social/gamification sprawl.

**Must have (table stakes):**
- **Auth/session stability across critical flows** — all other protected features depend on this.
- **Vietnamese UX cleanup on critical screens** — trust drops immediately if core flows feel linguistically broken.
- **Adaptive 5-round onboarding with persistence/resume** — personalization input must be saved and progressive, not a reset-prone survey.
- **Canonical learner profile + personalized recommendations** — one backend-owned learner model must drive recommendations consistently.
- **AI-suggested main path with soft next-step guidance** — users need a recommended journey without losing off-path access.
- **Main-path-aligned progress and continue-learning cues** — dashboard guidance must match actual state.
- **Backend-minimum leaderboard (points + rank)** — a tightly scoped gamification loop is enough for v1.1.
- **In-app notifications for key learning/payment events** — useful event-driven alerts, not a messaging platform.
- **Secure real payment upgrade flow with auto-activation** — backend verification is required for trust.
- **Critical Frontend-path content gap fill** — recommendations must not route users into thin content.

**Should have (competitive):**
- **Hybrid adaptive onboarding over 5 rounds** — better than a static setup form, safer than fully autonomous AI onboarding.
- **Explainable AI-suggested main path** — recommendation plus rationale builds trust.
- **Soft guidance model** — preserves learner agency while reducing decision fatigue.
- **Profile-aware AI chat** — makes AI feel connected to user goals without overpromising.
- **Event-relevant notifications** — high-signal reminders tied to real learning state.
- **Vietnamese-first polish in recommendation/payment/error states** — strong local-language UX is a real differentiator here.

**Defer (v2+):**
- **Friends/team/social leaderboard** — too much social-graph and moderation scope.
- **Email/SMS/push notification expansion** — prove in-app usefulness first.
- **Fully dynamic AI curriculum re-planning** — too unstable and hard to debug for v1.1.
- **Broad content expansion across all tracks** — this milestone only needs to close critical main-path content gaps.
- **Hard-gated learning paths** — conflicts with the chosen soft-guidance product direction.

### Architecture Approach

The architecture research recommends a milestone-scoped evolution of the current monolith. Keep frontend pages thin, keep backend APIs authoritative, and add a small set of new backend boundaries: `learner-profile`, `personalization`, `notifications`, `leaderboard`, and `events`. The most important architectural moves are: (1) create a canonical learner profile aggregate, (2) separate `mainPath` guidance from enrollment/access state, and (3) use transaction-first writes plus post-commit event publication so notifications and leaderboard remain projections rather than source-of-truth business logic.

**Major components:**
1. **Learner Profile service/module** — owns the canonical learner aggregate derived from onboarding answers, progress, quiz behavior, and bounded AI context.
2. **Personalization / Main Path policy service** — produces explainable path suggestions, stores soft-guidance state, and keeps recommendation logic out of learning-path enrollment.
3. **Expanded Onboarding module** — drives round progression, resume state, and path-confirmation entrypoints from the backend.
4. **Notifications module** — projects high-signal domain events into in-app notification rows with read/unread state and dedupe rules.
5. **Leaderboard module** — consumes point-worthy events into an idempotent ledger and rank projection.
6. **Payment activation service under subscriptions** — makes callback/webhook activation idempotent and backend-authoritative.
7. **Frontend app shell/pages** — consume canonical backend state for onboarding, dashboard, payment result, notifications, and leaderboard summary.

### Critical Pitfalls

The pitfalls research is unusually actionable and aligns tightly with the architecture/build-order recommendations. These are the failure modes most likely to derail the milestone if sequencing is wrong.

1. **Auth refresh storms and session split-brain** — prevent with single-flight refresh logic, replay queuing, and explicit `refreshing` vs `authenticated` UI states.
2. **Adaptive onboarding becoming a long survey with no resume state** — prevent with backend-driven rounds, per-round persistence/versioning, and showing value early.
3. **Scattered learner profile state across modules** — prevent with a backend-owned canonical profile aggregate and one recompute boundary.
4. **Confusing main path, recommendation, and enrollment state** — prevent by separating guidance state from access state and requiring explicit confirm/switch behavior.
5. **Notifications becoming spam instead of help** — prevent by projecting only a narrow, event-driven notification set with dedupe and suppression rules.
6. **Duplicate points / duplicate notifications from retries** — prevent with stable idempotency keys, immutable ledger rows, and deduped consumers.
7. **Trusting payment return URLs or non-terminal states as upgrade proof** — prevent by activating only from verified backend records and making `PaymentResult` poll backend order status.

## Implications for Roadmap

Based on the combined research, DevPath v1.1 should be planned as a dependency-first roadmap. Do not group work by “screen”; group it by state authority. The milestone should progress from transport reliability, to canonical learner state, to guided personalization, then to event-driven engagement, and finally to payment hardening and release polish.

### Phase 1: Session Reliability and UX Baseline
**Rationale:** Every milestone feature is protected or session-aware. If auth refresh is unstable, onboarding persistence, notifications, payment results, and dashboard guidance will all appear broken.
**Delivers:** Single-flight refresh logic, protected-route bootstrap cleanup, stale auth-state fixes, core Vietnamese copy cleanup on auth/onboarding/dashboard/payment surfaces, and a reliable app-shell session state model.
**Addresses:** Auth/session stabilization, Vietnamese UX cleanup.
**Avoids:** Auth refresh storms, session split-brain, page-level hacks that mask transport bugs.

### Phase 2: Canonical Learner Profile Foundation
**Rationale:** Personalization should not start in the UI or in AI prompts. It needs one backend-owned learner profile before adaptive onboarding or recommendation logic expands.
**Delivers:** Learner profile table/service, normalized profile fields plus JSON snapshot, recompute pipeline from onboarding/progress/quiz data, profile summary read API.
**Uses:** Existing NestJS monolith, Prisma/PostgreSQL, current onboarding/progress/AI data sources.
**Implements:** Canonical learner profile pattern.
**Avoids:** Profile split-brain across onboarding, dashboard, explore, and AI chat.

### Phase 3: Adaptive Onboarding and Resume Flow
**Rationale:** Once canonical profile storage exists, onboarding can become backend-driven instead of a fragile frontend wizard.
**Delivers:** 5-round bounded onboarding, per-round persistence/versioning, resume support, backend-driven round policy, early recommendation checkpoint, Vietnamese-first explanatory copy.
**Addresses:** Adaptive onboarding with saved context, initial personalization input pipeline.
**Avoids:** Long-survey onboarding, repeated questions after refresh, frontend condition-tree drift.

### Phase 4: Main Path Personalization and Content Credibility
**Rationale:** Recommendation should become visible only when guidance semantics are explicit and the primary Frontend journey is actually usable. This is where product clarity matters most.
**Delivers:** AI-suggested main path with explanation, explicit confirm/switch behavior, dashboard main-path CTA, explore separation between main and secondary paths, progress alignment, critical Frontend content gap fill for the recommended path.
**Addresses:** Main-path designation, personalized recommendations, main-path-aligned progress, profile-aware AI chat inputs, critical content gap fill.
**Uses:** Learner profile aggregate, personalization service, learning-path catalog, existing AI gateway.
**Implements:** Soft main-path policy.
**Avoids:** Hard-locking, silent path switching, contradictory next-step guidance, recommendations into weak content.

### Phase 5: Domain Events and Notification Skeleton
**Rationale:** Notifications should be projections of meaningful state changes, not UI side effects. Build the event backbone before adding more engagement features.
**Delivers:** App-internal event contracts/publisher, post-commit event emission from onboarding/progress/subscriptions, notification table/API, unread count, narrow event set (`path.confirmed`, `lesson.completed`, `quiz.passed`, `subscription.activated`, `subscription.expiring`).
**Addresses:** In-app learning notifications.
**Uses:** NestJS monolith, likely `@nestjs/event-emitter`, Prisma notification persistence.
**Implements:** Transaction + post-commit event pattern.
**Avoids:** Notification spam, duplicated notifications, controllers creating ad hoc messages.

### Phase 6: Leaderboard Basics with Anti-Gaming Rules
**Rationale:** Leaderboard depends on clean event inputs and idempotent scoring. Build it only after the event model is trustworthy.
**Delivers:** Points ledger, rank projection, summary API/UI, transparent scoring rules, caps/dedupe for repeatable low-value actions.
**Addresses:** Backend-minimum leaderboard (points + rank).
**Uses:** Event consumers, ledger/projection tables, dashboard summary UI.
**Implements:** Projection architecture instead of inline score mutation.
**Avoids:** Duplicate points, rank volatility, rewarding grinding instead of learning.

### Phase 7: Payment Hardening and Release Validation
**Rationale:** Real-money correctness must ship before wider release, but should leverage the notification/event backbone and stable session model already in place.
**Delivers:** Backend-owned payment config hardening, idempotent webhook/callback activation, payment status query endpoint, `PaymentResult` polling/pending states, activation notifications, reconciliation/admin visibility, final Vietnamese UX consistency pass and end-to-end release checks.
**Addresses:** Secure real payment upgrade flow with auto-activation.
**Uses:** Existing subscriptions module, Prisma transactions, payment logs, notification events.
**Implements:** Verified backend activation flow.
**Avoids:** False payment success, duplicate activation, frontend trust of URL params, trust loss in paid conversion.

### Phase Ordering Rationale

- **Reliability before personalization:** auth/session stability is a hard prerequisite for every protected flow.
- **Canonical state before adaptive UX:** learner profile must exist before onboarding rounds and recommendations can be trustworthy.
- **Guidance before engagement projections:** main-path semantics should be stable before notifications and leaderboard consume milestone events.
- **Events before gamification:** leaderboard and notifications both depend on clean post-commit event contracts and idempotency.
- **Payment hardening after core event plumbing:** verified activation benefits from the same transaction and event discipline used elsewhere.
- **Vietnamese UX and content quality are release criteria, not a final optional polish task:** they should be checked within every phase, with a final consistency pass before rollout.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4: Main Path Personalization and Content Credibility** — needs targeted validation on recommendation policy, confidence thresholds, and exactly which Frontend content gaps block safe recommendation rollout.
- **Phase 6: Leaderboard Basics with Anti-Gaming Rules** — needs explicit scoring policy review so points reflect learning outcomes rather than repeatable easy actions.
- **Phase 7: Payment Hardening and Release Validation** — needs provider-specific callback/idempotency verification and reconciliation flow review before release.

Phases with standard patterns (skip research-phase):
- **Phase 1: Session Reliability and UX Baseline** — established auth transport and protected-route hardening patterns.
- **Phase 2: Canonical Learner Profile Foundation** — straightforward monolith + Prisma aggregate pattern with clear architectural guidance.
- **Phase 3: Adaptive Onboarding and Resume Flow** — well-bounded once backend owns rounds and persistence.
- **Phase 5: Domain Events and Notification Skeleton** — standard in-process event projection pattern for a monolith.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on the actual MVP codebase and installed dependencies already in production use. |
| Features | MEDIUM | Feature direction is coherent and strongly aligned with product goals, but parts of prioritization/differentiation are informed by adjacent learning-product patterns rather than hard external validation. |
| Architecture | HIGH | The recommended architecture is tightly grounded in the current monolith, existing modules, and well-understood transaction/projection patterns. |
| Pitfalls | HIGH | Pitfalls are concrete, phase-mapped, and reinforced by both the architecture and official guidance around transactions, idempotency, and backend authority. |

**Overall confidence:** HIGH

### Gaps to Address

- **Recommendation policy specifics:** define how AI suggestion, fallback rules, and manual user choice interact so main-path switching is predictable.
- **Frontend content readiness for the recommended path:** identify the minimum content checklist required before surfacing a Frontend main-path recommendation broadly.
- **Leaderboard scoring rules:** document exactly which events earn points, caps for retries/repeats, and what should remain score-neutral.
- **Payment-provider edge cases:** validate MoMo/VNPay retry semantics, non-terminal statuses, and reconciliation/admin workflows against the current implementation.
- **Notification relevance thresholds:** confirm which event types are truly high-signal enough for v1.1 instead of assuming all milestone events deserve notifications.
- **Vietnamese UX terminology baseline:** establish a shared terminology/copy review standard so wording does not regress screen by screen.

## Sources

### Primary (HIGH confidence)
- `/home/minhnhut_dev/projects/path-learn/.planning/research/STACK.md` — verified current stack, versions, and v1.1-compatible additions.
- `/home/minhnhut_dev/projects/path-learn/.planning/research/FEATURES.md` — milestone feature landscape, dependencies, anti-features, and prioritization.
- `/home/minhnhut_dev/projects/path-learn/.planning/research/ARCHITECTURE.md` — monolith evolution strategy, build order, component boundaries, and data model adjustments.
- `/home/minhnhut_dev/projects/path-learn/.planning/research/PITFALLS.md` — phase-mapped failure modes, idempotency guidance, and release validation checklist.
- `/home/minhnhut_dev/projects/path-learn/.planning/PROJECT.md` — milestone scope and constraints referenced by all research files.
- NestJS docs (https://docs.nestjs.com) — modules, scheduling, and event-driven application patterns.
- Prisma docs (https://www.prisma.io/docs/orm) — transactions, JSON fields, and schema evolution patterns.
- React Router docs (https://reactrouter.com) and Vite docs (https://vite.dev) — SPA routing and frontend stack compatibility.

### Secondary (MEDIUM confidence)
- Adjacent learning-product patterns cited in feature research (Duolingo, Khan Academy, Coursera, Canvas, Codecademy) — useful for framing user expectations and milestone trade-offs, but not direct implementation requirements.
- Payment/notification idempotency references cited in pitfalls research — reinforce best practices for retries, dedupe, and backend authority.

### Tertiary (LOW confidence)
- None material beyond the adjacent-pattern framing already called out as medium confidence.

---
*Research completed: 2026-03-23*
*Ready for roadmap: yes*
