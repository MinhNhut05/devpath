# Roadmap: DevPath Learning

**Milestone:** v1.1 Post-MVP Stabilization & Personalization
**Created:** 2026-03-23
**Granularity:** Standard
**v1 Requirements:** 30 total, 100% mapped

## Overview

Phases 1-2 shipped in v1.0 and remain documented in `/home/minhnhut_dev/projects/path-learn/.context/ROADMAP.md`. This roadmap continues at Phase 3 and plans milestone v1.1 around the dependency chain established by the requirements and research: stabilize session/UX first, create canonical learner state, expand adaptive onboarding, surface explainable main-path personalization only when content is credible, then add event-driven notifications, leaderboard projection, and backend-authoritative payment hardening.

## Milestones

- **v1.0 MVP Foundation** - Phases 1-2 - Complete
- **v1.1 Post-MVP Stabilization & Personalization** - Phases 3-9 - Active

## Phases

- [x] **Phase 3: Session Reliability and Vietnamese UX Baseline** - Remove false auth redirects, stale protected-state bugs, and broken Vietnamese copy from critical flows.
- [ ] **Phase 4: Canonical Learner Profile Foundation** - Establish one backend-owned learner profile that later onboarding, recommendations, and AI context can trust.
- [ ] **Phase 5: Adaptive Onboarding Baseline and Resume Flow** - Deliver resumable early onboarding rounds that capture the learner's baseline profile.
- [ ] **Phase 6: Main Path Personalization and Content Credibility** - Turn profile data into explainable path guidance, later onboarding rounds, and a credible Frontend main journey.
- [ ] **Phase 7: Domain Events and Notification Skeleton** - Project key learning events into useful in-app notifications.
- [ ] **Phase 8: Leaderboard Basics and Anti-Gaming** - Award trustworthy points from learning events and show global rank.
- [ ] **Phase 9: Payment Hardening and Release Validation** - Make upgrades backend-authoritative, idempotent, and safe for real-money usage.

## Phase Details

### Phase 3: Session Reliability and Vietnamese UX Baseline
**Goal**: Users can trust protected flows and critical screens in daily use before deeper personalization is introduced.
**Depends on**: Phase 2
**Requirements**: STAB-01, STAB-02, STAB-03, STAB-04
**Success Criteria** (what must be TRUE):
  1. User can refresh any protected page with a valid session and stay signed in.
  2. User can open the app or return to a protected route without false login redirects while auth state is still restoring.
  3. User sees consistent progress, enrollment, and continue-learning state across dashboard, explore, lesson, and quiz flows.
  4. User sees correct Vietnamese text with proper diacritics and natural wording across critical user-facing screens.
**Plans**: 6 plans
Plans:
- [x] 03-01-PLAN.md — stabilize auth bootstrap and protected-route session restore behavior
- [x] 03-02-PLAN.md — align dashboard and explore learner-state refresh behavior
- [x] 03-03-PLAN.md — fix lesson and quiz flow state correctness across protected learning screens
- [x] 03-04-PLAN.md — centralize remaining learner-facing Vietnamese copy in `vi.ts`
- [x] 03-05-PLAN.md — move Explore enrollment status to backend-owned React Query state
- [x] 03-06-PLAN.md — remove the last targeted English labels from Dashboard and Lesson

### Phase 4: Canonical Learner Profile Foundation
**Goal**: Personalization is driven by one reusable learner profile built from onboarding answers and observed learning signals.
**Depends on**: Phase 3
**Requirements**: PROF-01, PROF-02, PROF-03
**Success Criteria** (what must be TRUE):
  1. Information the user provides during onboarding is saved per round and remains available when later recommendations or profile updates need it.
  2. The app reuses one learner profile across personalization features so learner context does not contradict itself between onboarding, recommendations, and AI guidance.
  3. After relevant lesson milestones, the learner profile is recalculated from new learning signals instead of staying frozen at first-login answers.
**Plans**: 3 plans
Plans:
- [x] 04-01-PLAN.md — replace legacy onboarding snapshot storage with round-based schema, migration, and auth-safe refactors
- [x] 04-02-PLAN.md — create the exported learner-profile module and protected `GET /learner-profile/me` API
- [x] 04-03-PLAN.md — wire synchronous learner-profile recalculation into lesson, quiz-pass, and path-completion flows

### Phase 5: Adaptive Onboarding Baseline and Resume Flow
**Goal**: Users can establish a reliable baseline profile through resumable early onboarding rounds.
**Depends on**: Phase 4
**Requirements**: ONB-04, ONB-05, ONB-06, ONB-07
**Success Criteria** (what must be TRUE):
  1. User can complete onboarding round 1 with basic profile information.
  2. User can continue into round 2 and capture career goals and direction without losing earlier answers.
  3. User can complete round 3 for current skill assessment and finish the baseline onboarding segment.
  4. User who leaves onboarding mid-flow returns to the last incomplete round instead of restarting from the beginning.
**Plans**: TBD

### Phase 6: Main Path Personalization and Content Credibility
**Goal**: Users receive explainable main-path guidance that adapts over time and points to credible Frontend content.
**Depends on**: Phase 5
**Requirements**: ONB-08, ONB-09, ONB-10, LP-07, LP-08, LP-09, LP-10, AI-08, CONT-01, CONT-02
**Success Criteria** (what must be TRUE):
  1. User can view the top 3 ranked learning path recommendations with a short explanation for each, then confirm or adjust one as the main path.
  2. User has exactly one main learning path at a time, can switch it without losing learning history, and can still study other paths as secondary activity.
  3. Dashboard and continue-learning surfaces prioritize the current main path, while later onboarding rounds appear after lesson milestones to refine guidance.
  4. AI chat responses reflect the learner's profile and current main path context.
  5. User can follow the recommended Frontend main path without hitting critical missing lessons, and the early milestone guidance still makes sense.
**Plans**: TBD

### Phase 7: Domain Events and Notification Skeleton
**Goal**: Users receive useful in-app notifications generated from real learning events rather than ad hoc UI state.
**Depends on**: Phase 6
**Requirements**: NOTF-01, NOTF-02
**Success Criteria** (what must be TRUE):
  1. User can see in-app notifications in a dashboard notification block.
  2. Lesson completion, next lesson unlocks, and learning milestones create helpful notifications tied to real events.
  3. One source event produces at most one notification, so retries or replays do not create duplicates.
**Plans**: TBD

### Phase 8: Leaderboard Basics and Anti-Gaming
**Goal**: Users can see trustworthy global ranking based on real lesson completion activity.
**Depends on**: Phase 7
**Requirements**: LEAD-01, LEAD-02
**Success Criteria** (what must be TRUE):
  1. User earns leaderboard points when completing a lesson.
  2. Replayed or retried lesson-completion events do not inflate the user's score.
  3. User can view a global leaderboard showing current points and rank.
**Plans**: TBD

### Phase 9: Payment Hardening and Release Validation
**Goal**: Users can upgrade through backend-authoritative payment flows that only activate paid access after verified confirmation.
**Depends on**: Phase 8
**Requirements**: PAY-08, PAY-09, PAY-10, PAY-11, PAY-12
**Success Criteria** (what must be TRUE):
  1. User can initiate an upgrade through a backend-created gateway payment flow or view backend-served real bank transfer payment information in the upgrade flow.
  2. Payment result screens read backend-confirmed order status, including pending bank-transfer states, instead of trusting return URL parameters.
  3. A paid tier activates only after verified backend confirmation, and duplicate provider callbacks do not double-activate access.
  4. Bank-transfer upgrades remain pending until manually verified.
**Plans**: TBD

## Coverage Validation

| Phase | Requirements |
|-------|--------------|
| Phase 3 | STAB-01, STAB-02, STAB-03, STAB-04 |
| Phase 4 | PROF-01, PROF-02, PROF-03 |
| Phase 5 | ONB-04, ONB-05, ONB-06, ONB-07 |
| Phase 6 | ONB-08, ONB-09, ONB-10, LP-07, LP-08, LP-09, LP-10, AI-08, CONT-01, CONT-02 |
| Phase 7 | NOTF-01, NOTF-02 |
| Phase 8 | LEAD-01, LEAD-02 |
| Phase 9 | PAY-08, PAY-09, PAY-10, PAY-11, PAY-12 |

**Coverage:** 30 / 30 v1 requirements mapped
**Orphans:** None
**Duplicates:** None

## Progress

Legacy phases 1-2 shipped in v1.0 and remain tracked in `/home/minhnhut_dev/projects/path-learn/.context/ROADMAP.md`.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 3. Session Reliability and Vietnamese UX Baseline | 6/6 | Complete | 2026-03-24 |
| 4. Canonical Learner Profile Foundation | 3/3 | Complete | 2026-03-24 |
| 5. Adaptive Onboarding Baseline and Resume Flow | 1/6 | In Progress | - |
| 6. Main Path Personalization and Content Credibility | 0/TBD | Not started | - |
| 7. Domain Events and Notification Skeleton | 0/TBD | Not started | - |
| 8. Leaderboard Basics and Anti-Gaming | 0/TBD | Not started | - |
| 9. Payment Hardening and Release Validation | 0/TBD | Not started | - |

---
*Roadmap created: 2026-03-23*
*Milestone coverage: 30 v1 requirements, 100% mapped across Phases 3-9*
