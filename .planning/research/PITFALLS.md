# Pitfalls Research

**Domain:** DevPath v1.1 post-MVP stabilization, personalization, gamification, and payment hardening
**Researched:** 2026-03-22
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Auth Refresh Storms and Session Split-Brain

**What goes wrong:**
Protected screens randomly bounce users back to login, `401` requests loop forever, or different tabs show different auth state. New onboarding, dashboard, payment-result, and notification flows appear "buggy" even though the real issue is unstable session refresh.

**Why it happens:**
Post-MVP teams often add more protected API calls before stabilizing refresh behavior. Multiple concurrent requests hit an expired access token, each request tries its own refresh, and frontend state starts making assumptions before the backend confirms the session.

**How to avoid:**
- Make auth/session stabilization the first v1.1 phase, before personalization work.
- Use single-flight refresh logic: one refresh request in progress, queued failed requests replay once after success.
- Treat backend session payload as the source of truth on app bootstrap.
- Distinguish clearly between `unauthenticated`, `refreshing`, and `authenticated` UI states.
- Do not hide refresh bugs with page-level hacks inside onboarding, dashboard, or plans pages.

**Warning signs:**
- Bursts of duplicate refresh calls from one browser session.
- `401 -> refresh -> 401 -> logout` patterns in logs.
- Users reporting that page reload "fixes it sometimes."
- Payment result page and onboarding resume page disagreeing about whether the user is logged in.

**Phase to address:**
Phase 1 - Stabilize auth/session transport.

---

### Pitfall 2: Turning Adaptive Onboarding into a Long Survey with No Resume State

**What goes wrong:**
The planned 5-round onboarding becomes a high-friction questionnaire. Users abandon before reaching value, lose progress on refresh, or get asked repeated questions because the system cannot tell what was already answered.

**Why it happens:**
Teams hear "adaptive onboarding" and implement more questions instead of better timing. They also keep onboarding state in frontend memory or overwrite one record instead of versioning rounds and answer history.

**How to avoid:**
- Keep round 1 minimal: enough to recommend an initial direction, not enough to fully model the learner.
- Let the backend decide whether another round is due; do not hardcode all rounds in the frontend.
- Persist each round with versioning, completion status, and resume support.
- Ask later rounds only when confidence is low or behavior signals justify follow-up.
- Every round must have a user-facing reason: why this question matters to the learner.

**Warning signs:**
- High drop-off before first recommended path is shown.
- Users seeing the same questions again after refresh or relogin.
- Frontend logic containing large condition trees for round progression.
- Support feedback like "hỏi nhiều quá" or "không biết còn bao nhiêu bước nữa."

**Phase to address:**
Phase 3 - Expand onboarding into backend-driven rounds.

---

### Pitfall 3: Scattering Learner Profile State Across Onboarding, Progress, AI, and UI

**What goes wrong:**
The onboarding page, dashboard, AI chat, and explore page each infer the learner differently. A user can be "Frontend" in one place, "Fullstack" in another, and receive conflicting recommendations because no canonical learner profile exists.

**Why it happens:**
Post-MVP products often bolt personalization onto existing tables. Teams reuse onboarding answers forever, derive profile state in the frontend, or let each module store its own interpretation of the learner.

**How to avoid:**
- Introduce a backend-owned canonical learner profile aggregate before deeper personalization.
- Store frequently queried fields in normalized columns and flexible reasoning/context in a JSON snapshot.
- Recompute profile from declared inputs plus observed behavior through one service boundary.
- Make AI chat, dashboard, and main-path recommendation read from the same profile summary.
- Track profile version and `lastRecalculatedAt` so stale state is visible.

**Warning signs:**
- Different screens recommend different next steps.
- Developers must join many tables or reproduce custom heuristics to answer "what is this learner's current profile?"
- Bug fixes keep landing in multiple modules for the same personalization issue.
- Manual admin checks reveal stale or contradictory profile data.

**Phase to address:**
Phase 2 - Introduce canonical learner profile persistence.

---

### Pitfall 4: Confusing Main Path, Recommendation, and Enrollment State

**What goes wrong:**
The product either hard-locks learners into one path or becomes so soft that the "main path" means nothing. Users lose confidence because dashboard guidance, path access, and recommendations all point to different concepts.

**Why it happens:**
Teams reuse `user_learning_paths` for everything: access, recommendation, and active guidance. That makes it impossible to answer simple questions like "What is the guided journey right now?" without breaking free exploration.

**How to avoid:**
- Keep `main path` as guidance state and `enrolled paths` as access state.
- Require explicit confirm/switch behavior for the main path.
- Preserve secondary learning access; do not hard-block off-path study.
- Make dashboard CTA, next lesson, and recommendation explanation all read the same main-path state.
- Show users why the suggested main path changed when recalculation happens.

**Warning signs:**
- Users report "I opened one backend lesson and now my whole homepage changed."
- Switching paths accidentally unenrolls prior content.
- Teams debate business rules in UI code because backend state is ambiguous.
- Recommendation recalculation silently overrides a manually chosen path.

**Phase to address:**
Phase 4 - Add main-path policy and dashboard integration.

---

### Pitfall 5: Shipping Notifications as Broadcast Spam Instead of Event-Driven Help

**What goes wrong:**
Notifications quickly become noise: too many low-value alerts, repeated badges, or irrelevant reminders that train users to ignore the entire notification surface.

**Why it happens:**
When adding notifications after MVP, teams focus on "having notifications" rather than designing eligibility, relevance, and frequency. They trigger messages directly from UI actions or broad cron jobs instead of from meaningful domain events.

**How to avoid:**
- Start with a narrow event set: path confirmed, lesson completed, quiz passed, subscription activated, subscription expiring.
- Store notifications as backend projections from domain events, not ad hoc frontend messages.
- Define per-type rules: who gets it, when, dedupe key, and when not to send.
- Prefer high-signal milestone notifications over generic engagement spam.
- Add read/unread and basic suppression rules before adding more notification types.

**Warning signs:**
- Users receive multiple notifications for one action.
- Notification count grows, but open/read behavior stays low.
- Engineers add notification creation code into unrelated controllers.
- Product asks to "just notify everyone" because targeting is unclear.

**Phase to address:**
Phase 5 - Add domain events + notifications skeleton.

---

### Pitfall 6: Non-Idempotent Event Consumers Create Duplicate Points and Duplicate Notifications

**What goes wrong:**
One lesson completion or payment activation creates multiple leaderboard entries and duplicate notifications. Rank looks inflated, users lose trust, and cleanup becomes painful because projections are no longer reliable.

**Why it happens:**
Retries, race conditions, and repeated webhook deliveries are normal in real systems. The mistake is treating downstream consumers as if every event will be delivered exactly once.

**How to avoid:**
- Source writes first, then post-commit event publication.
- Give every point-worthy or notification-worthy event a stable idempotency key.
- Use immutable points ledger rows keyed by source event identity.
- Notification creation should also dedupe by event identity and notification type.
- Keep payment activation idempotent for the same reason; payment events will be retried too.

**Warning signs:**
- Same user gets the same badge/notification twice within seconds.
- Leaderboard totals jump more than the source progress change justifies.
- Reprocessing jobs or webhook retries change totals again.
- Engineers rely on "this endpoint is only called once" as protection.

**Phase to address:**
Phase 5 for event contracts and Phase 6 for leaderboard ledger enforcement.

---

### Pitfall 7: Leaderboard Rules Reward Grinding, Not Learning

**What goes wrong:**
Users learn how to game the points system by repeating easy actions, farming retries, or optimizing for rank rather than real progress. The leaderboard then harms motivation instead of increasing it.

**Why it happens:**
Gamification added after MVP often counts whatever events are easiest to track. Without explicit reward policy, the product accidentally values volume over mastery.

**How to avoid:**
- Award points for meaningful milestones only: lesson completion, quiz pass thresholds, streak quality, or first-time completions.
- Cap or dedupe repeatable low-value actions.
- Keep a transparent scoring policy so users understand rank changes.
- Separate source-of-truth progress from leaderboard projection; if point rules change later, the system stays recoverable.
- Expose enough context in the UI to explain movement, not just raw rank.

**Warning signs:**
- Top-ranked users have suspiciously repetitive activity patterns.
- Rank volatility feels random between refreshes.
- Users ask why redoing an easy quiz changes rank more than completing a harder path milestone.
- Product conversations become about "how to boost engagement numbers" rather than learning outcomes.

**Phase to address:**
Phase 6 - Add leaderboard points ledger and rank projection.

---

### Pitfall 8: Trusting Payment Return URLs or Non-Terminal States as Upgrade Proof

**What goes wrong:**
Users see a successful payment redirect, but their tier is not activated, or worse, the tier activates twice. Real-money state becomes inconsistent between `payment_logs`, `subscriptions`, and what the UI shows.

**Why it happens:**
Teams often build the happy-path demo first: provider redirect returns to frontend, query params say success, UI upgrades immediately. In production, providers retry callbacks, users reopen result pages, and `PENDING` or failed attempts arrive before final success.

**How to avoid:**
- Only verified backend records should activate subscriptions.
- Create `payment_logs` before redirect and update them atomically with subscription activation.
- Treat webhook handling as idempotent using the provider transaction/payment identifier.
- Only finalize the upgrade on provider-confirmed success, not on return URL params.
- `PaymentResult` should query backend order status and show pending/retry states when confirmation has not landed yet.
- Add reconciliation/admin visibility for mismatched payment records.

**Warning signs:**
- Duplicate activation logs for the same order.
- Support reports of "đã thanh toán nhưng chưa lên gói" or "bị trừ tiền 2 lần / lên hạng 2 lần."
- Frontend code deriving subscription state from URL query parameters.
- Payment webhook retries producing different outcomes on each attempt.

**Phase to address:**
Phase 7 - Harden real payment activation flow.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Derive learner profile separately in each module | Fast to ship one screen at a time | Profile drift, contradictory recommendations, repeated bug fixes | Never for v1.1 |
| Keep onboarding progress only in frontend state | Simple implementation | Lost answers on refresh, impossible resume, no audit/versioning | Never for adaptive onboarding |
| Reuse enrollment tables as main-path state | Avoids schema change | Confused business rules, accidental hard-locking or silent path switches | Never |
| Insert leaderboard totals directly instead of an event-linked ledger | Faster first demo | Duplicate points are hard to unwind, rule changes become dangerous | Only for throwaway prototype, not milestone code |
| Trigger notifications directly inside controllers | Feels straightforward | Coupling, duplicate sends, inconsistent targeting rules | Acceptable only for one-off admin alerts, not learner notifications |
| Trust payment return URL as final success | Simplifies frontend | Incorrect money state, support burden, fraud/abuse surface | Never |
| Patch Vietnamese copy ad hoc screen by screen | Quick visible polish | Tone inconsistency, reintroduced wording bugs, weak perceived quality | Acceptable only as emergency hotfix while building a shared copy pass |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Auth refresh flow | Let every failed request trigger its own refresh | Use a single refresh pipeline and replay failed requests once after success |
| Prisma multi-write flows | Perform related writes separately because each query works in isolation | Use transactions for subscription activation, profile recompute checkpoints, and other related state changes |
| Learner profile snapshot | Put every profile field into JSON only | Keep query-heavy fields normalized and store flexible reasoning/context in JSON snapshot |
| Payment providers (MoMo/VNPay-style flow) | Use frontend return URL as proof of payment | Verify callback/webhook data in backend and activate only from authoritative records |
| Notification delivery | Retry send/create without idempotency key | Persist an event-based dedupe key so retries return the same logical result |
| Expiry / reminder jobs | Depend on request-time checks only | Use backend scheduling for expiry/reminder workflows and make jobs safe to rerun |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recomputing learner profile from raw history on every dashboard load | Slow dashboard, expensive joins, inconsistent latency | Recompute on key events and store a canonical profile snapshot | Around a few hundred active learners with non-trivial history |
| Computing full leaderboard rank from raw progress every request | Rank endpoint gets slower as data grows | Maintain points ledger plus projection/summary table | Usually before 10k users if leaderboard is opened often |
| Notification list built from live joins instead of stored projection | Slow notification page, count badge delays | Store notification rows as projections from events | Once notification types grow beyond a few simple cases |
| Refresh retry loops under concurrent requests | API burst, repeated failures, poor UX on route changes | Queue/replay logic and request throttling during refresh | Immediately once protected screens make many requests |
| Running long network work inside DB transaction | Lock contention, slow writes, rollback surprises | Keep transactions short and publish events after commit | Visible as soon as payment or AI calls are mixed into write transactions |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing payment recipient/config details or secrets in frontend code | Secrets leak, config rotation becomes unsafe, payment setup is easier to abuse | Keep provider config in backend environment/config service only; frontend receives public plan metadata and redirect URLs only |
| Upgrading subscription from query params or client-asserted status | Users can tamper with state or trigger inconsistent upgrades | Only backend-verified payment records can activate tiers |
| Missing idempotency in payment activation | Duplicate callbacks create double upgrades or broken billing state | Use provider transaction identifiers plus activation idempotency checks |
| Trusting AI/profile context from client-submitted payloads | Users can spoof profile traits to influence recommendations or chat context | Rebuild personalization context from backend-owned learner profile, not raw client claims |
| Broad notification/leaderboard APIs without user scoping | Users can read other users' notifications, points, or rank details | Scope queries by authenticated user and expose only intended public leaderboard fields |
| Keeping stale refresh cookies/tokens alive after logout or rotation edge cases | Session confusion across tabs/devices and higher account-abuse surface | Implement clear token rotation/logout invalidation rules and test multi-tab behavior |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Ask all onboarding questions before showing value | Learners abandon before seeing a path recommendation | Show a useful first recommendation early, then continue with later rounds only when needed |
| Silent main-path switching | Users feel the app is unpredictable or manipulative | Explain why a path is suggested and require explicit confirm/switch action |
| No payment pending state | Users think payment failed or the app is broken while waiting for backend confirmation | Show `pending`, `confirmed`, and `needs support/retry` states from backend status |
| Notification badge without clear message quality | Badge becomes anxiety/noise rather than useful guidance | Keep notifications few, specific, and tied to meaningful milestones |
| Vietnamese copy inconsistency across screens | Product feels unfinished and less trustworthy even when logic works | Run a milestone-wide copy cleanup with shared terminology, proper diacritics, and consistent CTA wording |
| Showing rank without explaining point movement | Leaderboard feels arbitrary and unfair | Show recent point deltas or reasons for change, not only raw rank |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Auth refresh:** Often missing multi-request dedupe and replay guards — verify one expired token only triggers one refresh attempt.
- [ ] **Adaptive onboarding:** Often missing resume/versioning — verify a user can stop after round 2 and continue later without data loss.
- [ ] **Learner profile:** Often missing canonical recompute path — verify dashboard, explore, and AI chat read the same profile summary.
- [ ] **Main path:** Often missing explicit confirm/switch semantics — verify exploring another path does not silently replace the main path.
- [ ] **Notifications:** Often missing dedupe and suppression rules — verify one source event creates at most one learner-facing notification.
- [ ] **Leaderboard:** Often missing anti-gaming caps — verify repeated easy actions cannot inflate rank unfairly.
- [ ] **Payment upgrade:** Often missing webhook idempotency and status polling — verify the result page stays pending until backend-confirmed success arrives.
- [ ] **Vietnamese UX cleanup:** Often missing a consistency pass — verify critical screens use the same Vietnamese terminology and correct diacritics.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Auth refresh storms | MEDIUM | Disable aggressive request replay, inspect refresh concurrency, fix single-flight logic, and re-test protected flows end-to-end |
| Onboarding without resume/versioning | MEDIUM | Add per-round persistence, migrate partial answers where possible, and let affected users restart from last completed round |
| Profile split-brain | HIGH | Define canonical profile source, backfill from existing tables, invalidate stale derived caches, and remove duplicate profile logic from modules |
| Main-path/enrollment confusion | MEDIUM | Introduce explicit main-path field, migrate current active guidance carefully, and communicate switch behavior in UI |
| Duplicate notifications/points | MEDIUM | Stop consumers, dedupe by source event ID, rebuild notification/ledger projections, and add idempotency constraints before resuming |
| Leaderboard gaming | MEDIUM | Patch scoring rules, recompute totals from immutable ledger if available, and publish a short explanation of rank correction |
| False payment success / duplicate activation | HIGH | Freeze automatic activation temporarily, reconcile provider transactions vs `payment_logs`, repair affected subscriptions manually, and deploy idempotent verification before re-enabling |
| Vietnamese UX inconsistency | LOW | Run a focused copy audit on critical paths and centralize approved wording/labels for follow-up changes |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Auth refresh storms and session split-brain | Phase 1 | Expired-token test with many concurrent protected requests results in one refresh and successful replay |
| Onboarding becomes a long survey with no resume | Phase 3 | User can complete rounds across multiple sessions and still receive coherent next-step logic |
| Learner profile state is scattered | Phase 2 | Dashboard, onboarding, and AI chat return consistent profile summary from one backend source |
| Main path is confused with enrollment | Phase 4 | Exploring a secondary path does not silently change main-path guidance |
| Notifications become spam instead of help | Phase 5 | Each notification type has explicit eligibility, dedupe, and suppression rules verified in tests/review |
| Event consumers duplicate points/notifications | Phase 5 and Phase 6 | Replaying the same source event does not create extra rows or change totals |
| Leaderboard rewards grinding, not learning | Phase 6 | Repeatable low-value actions are capped/deduped and rank movement matches published rules |
| Payment return URL or non-terminal state is trusted | Phase 7 | Payment result page remains pending until backend-verified success; duplicate provider callbacks do not double-activate |
| Vietnamese UX quality treated as cosmetic only | Release hardening within each phase, with final verification before rollout | Critical screens pass copy review for diacritics, terminology, CTA consistency, and payment/auth clarity |

## Sources

### Source of Truth Documents
- `/home/minhnhut_dev/projects/path-learn/.planning/PROJECT.md`
- `/home/minhnhut_dev/projects/path-learn/.planning/research/ARCHITECTURE.md`

### Official Documentation
- Prisma transactions: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
- Prisma JSON fields: https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields
- NestJS task scheduling: https://docs.nestjs.com/techniques/task-scheduling
- OneSignal idempotent notification requests: https://documentation.onesignal.com/reference/idempotent-notification-requests
- Cashfree webhook idempotency guidance: https://www.cashfree.com/docs/payments/online/webhooks/webhook-indempotency

### Confidence Notes
- HIGH confidence for auth/session, learner-profile, main-path, event/idempotency, and payment-state pitfalls because they are directly implied by the milestone architecture and reinforced by official transaction/idempotency guidance.
- MEDIUM confidence for notification relevance and leaderboard motivation pitfalls because they are product-pattern conclusions, but they strongly fit the milestone's narrow scope and common post-MVP failure modes.

---
*Pitfalls research for: DevPath v1.1 post-MVP stabilization, personalization, gamification, and payment hardening*
*Researched: 2026-03-22*
