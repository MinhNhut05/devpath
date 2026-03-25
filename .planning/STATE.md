---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: milestone
status: unknown
stopped_at: Completed 05-03-PLAN.md
last_updated: "2026-03-25T16:19:42.603Z"
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 15
  completed_plans: 13
---

# Project State

## Project Reference

See: `/home/minhnhut_dev/projects/path-learn/.planning/PROJECT.md` (updated 2026-03-22)

**Core value:** Guide each learner to the right next step with a stable, personalized learning experience that matches their goals, current level, and progress.
**Current focus:** Phase 05 — adaptive-onboarding-baseline-and-resume-flow

## Current Position

Phase: 05 (adaptive-onboarding-baseline-and-resume-flow) — EXECUTING
Plan: 5 of 6

## Performance Metrics

**Velocity:**

- Total plans completed: 2
- Average duration: 8.5 min
- Total execution time: 0.28 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| Phase 04 P01 | 12m | 3 tasks | 6 files |
| Phase 04 P02 | 5m | 2 tasks | 7 files |

| Phase 03 P02 | 19m | 6 tasks | 12 files |
| Phase 03 P03 | 15m | 7 tasks | 14 files |
| Phase 03 P04 | 18m | 8 tasks | 9 files |
| Phase 03 P06 | 6 min | 3 tasks | 3 files |
| Phase 03 P05 | 10 min | 5 tasks | 6 files |
| Phase 04 P03 | 3 min | 2 tasks | 5 files |
| Phase 05 P01 | 1345 | 2 tasks | 14 files |
| Phase 05 P02 | 26min | 6 tasks | 16 files |
| Phase 05 P04 | 12min | 1 tasks | 2 files |
| Phase 05 P03 | 13min | 2 tasks | 9 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 3]: Continue numbering from legacy Phases 1-2; milestone v1.1 starts at Phase 3.
- [Phase 3]: Stability and Vietnamese UX cleanup stay ahead of personalization work.
- [Phase 6]: Main-path guidance stays soft; secondary learning remains available.
- [Phase 9]: Payment activation remains backend-authoritative and idempotent.
- [Phase 03]: Keep auth bootstrap state in Zustand so route guards and root routes share one loading contract.
- [Phase 03]: Use per-tab single-flight refresh dedupe without cross-tab coordination for session restore.
- [Phase 03]: Show one Vietnamese expired-session toast then redirect after a short delay instead of immediate navigation.
- [Phase 03]: Use React Query hooks as the single source of truth for critical server data while keeping short-lived UI state local.
- [Phase 03]: Await enrollment invalidation before dashboard navigation so new enrollments appear without manual refresh.
- [Phase 03]: Keep mock dashboard XP, leaderboard, activity, and badge sections unchanged until real backend endpoints exist.
- [Phase 03]: Use frontend/src/strings/vi.ts as the single source of truth for the remaining learner-facing screens instead of leaving copy fragmented across pages.
- [Phase 03]: Treat AppLayout.tsx as a verified layout shell with no user-facing copy and remove it from plan metadata instead of forcing a no-value localization change.
- [Phase 03]: Extend frontend/src/strings/vi.ts first, then point Dashboard and Lesson to those keys instead of keeping page-local literals.
- [Phase 03]: Return enrolled learning path slugs instead of ids so Explore can use its existing slug-based card keys without extra mapping.
- [Phase 03]: Derive Explore enrollment state from a React Query-backed Set and keep it fresh through the existing ['learning-paths'] prefix invalidation path.
- [Phase 04 P01]: Store round-1 answers as JSON with stable question ID keys (careerGoal, priorKnowledge, learningBackground, hoursPerWeek).
- [Phase 04 P01]: Derive initial LearnerProfile skill_level and learning_pace from deterministic CASE expressions in migration SQL.
- [Phase 04 P01]: Auth isNewUser detection now uses onboardingRounds with completed round 1 filter instead of removed OnboardingData.

- [Phase 04 P02]: Return roundsCompleted as array of round numbers with non-null completedAt from OnboardingRound.
- [Phase 04 P02]: Throw NotFoundException for uninitialized profiles instead of fabricating default data.
- [Phase 04 P02]: createFromRoundOne exists as placeholder per D-04; Phase 5 implements.

- [Phase 04 P03]: Recalculate runs after Prisma transaction resolves; advanceToNextLesson returns { pathCompleted } metadata for downstream side-effects.
- [Phase 04 P03]: AI chat topic extraction is deterministic (split/filter/dedupe) with no external AI calls.
- [Phase 05]: Implement Wave 0 primitives locally against existing Tailwind/CSS tokens instead of adding Radix dependencies in plan 05-01.
- [Phase 05]: Bootstrap onboarding from /onboarding/status with fallback to legacy /onboarding/questions so Wave 0 tests work before full backend resume flow ships.
- [Phase 05]: Used OnboardingRound as the single persistence model for all onboarding rounds instead of reviving legacy onboardingData storage.
- [Phase 05]: Created LearnerProfile immediately after round 1 and enriched it after rounds 2 and 3 to keep profile state deterministic and resumable.
- [Phase 05]: Blocked recommendation requests until round 3 exists, then resolved primaryPath slug to learningPathId before returning API data.
- [Phase 05]: Derived onboardingCompleted from completed OnboardingRound count so login and /auth/me share one backend-owned truth.
- [Phase 05]: Kept LoginResult as the single auth response contract and aligned OAuth return types to it instead of introducing a parallel payload shape.
- [Phase 05]: Use user.onboardingCompleted as the single source of truth for post-auth onboarding routing instead of isNewUser.
- [Phase 05]: Keep onboarding API access inside dedicated React Query hooks with stable array query keys and mutation invalidation.

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 6]: Recommendation policy, confidence thresholds, and Frontend content readiness need deeper phase planning.
- [Phase 8]: Leaderboard scoring rules need explicit anti-gaming limits before implementation.
- [Phase 9]: MoMo/VNPay callback and reconciliation edge cases need validation before release.

## Session Continuity

Last session: 2026-03-25T16:19:42.601Z
Stopped at: Completed 05-03-PLAN.md
Resume file: None
