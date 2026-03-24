---
phase: 04-canonical-learner-profile-foundation
plan: 03
subsystem: api
tags: [nestjs, prisma, learner-profile, recalculation, tdd]

requires:
  - phase: 04-01
    provides: LearnerProfile Prisma model, OnboardingRound migration
  - phase: 04-02
    provides: LearnerProfileService with getMyProfile, createFromRoundOne, module exports
provides:
  - Synchronous recalculate(userId, event) method for 3 milestone event types
  - Lessons module wired to trigger profile recalculation after lesson/quiz/path milestones
  - AI chat topic ingestion into preferredTopics via deterministic extraction
affects: [phase-05-onboarding, phase-06-recommendations]

tech-stack:
  added: []
  patterns:
    - Discriminated union event types for type-safe recalculation dispatch
    - Synchronous post-write recalculation in request path (no queues)
    - advanceToNextLesson returns metadata for downstream side-effects

key-files:
  created: []
  modified:
    - backend/src/modules/learner-profile/learner-profile.service.ts
    - backend/src/modules/learner-profile/learner-profile.service.spec.ts
    - backend/src/modules/lessons/lessons.module.ts
    - backend/src/modules/lessons/lessons.service.ts
    - backend/src/modules/lessons/lessons.service.spec.ts

key-decisions:
  - "Use discriminated union RecalcEvent type for type-safe event dispatch across 3 milestone types"
  - "advanceToNextLesson returns { pathCompleted: boolean } instead of void to avoid re-querying"
  - "AI chat topic extraction uses deterministic split/filter only, no external AI calls"
  - "Profile recalculation runs after transaction resolves to ensure DB consistency"

patterns-established:
  - "Post-write synchronous recalculation: service calls recalculate after milestone writes"
  - "Filler word set for deterministic topic token extraction from AI interaction logs"

requirements-completed: [PROF-03]

duration: 3 min
completed: 2026-03-24
---

# Phase 4 Plan 3: Synchronous Learner-Profile Recalculation Hooks Summary

**Synchronous learner-profile recalculation wired to lesson completion, quiz pass, and path completion milestones with AI chat topic ingestion**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-24T08:19:06Z
- **Completed:** 2026-03-24T08:22:17Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Incremental recalculation service handles LESSON_COMPLETED (learningPace), QUIZ_PASSED (skillLevel/strengths/weaknesses), and TRACK_COMPLETED (preferredTopics + AI chat topics)
- LessonsService wired to trigger synchronous profile recalculation after each milestone event
- AI chat topic signals from AIInteractionLog ingested into preferredTopics via deterministic extraction (D-13)
- 58 tests passing across both spec files covering all event types, thresholds, and edge cases

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement incremental learner-profile recalculation rules** - `42dad5b` (feat)
2. **Task 2: Wire lesson/quiz/path milestones to synchronous recalculation** - `1815630` (feat)

## Files Created/Modified

- `backend/src/modules/learner-profile/learner-profile.service.ts` - Added recalculate() with 3 event handlers + AI topic extraction
- `backend/src/modules/learner-profile/learner-profile.service.spec.ts` - 23 tests covering all recalc event types and edge cases
- `backend/src/modules/lessons/lessons.module.ts` - Added LearnerProfileModule import for cross-module DI
- `backend/src/modules/lessons/lessons.service.ts` - Wired recalculate calls after lesson/quiz/path milestones
- `backend/src/modules/lessons/lessons.service.spec.ts` - 5 tests verifying recalculate wiring for all milestone events

## Decisions Made

- Used discriminated union `RecalcEvent` type for compile-time safety across event handlers
- `advanceToNextLesson` returns `{ pathCompleted: boolean }` metadata instead of void, avoiding the need to re-query after transaction
- AI chat topic extraction is purely deterministic (split on delimiters, filter filler words, min 3 chars) with no external AI calls
- Profile recalculation runs after the Prisma transaction resolves to ensure DB state is consistent before reading

## Deviations from Plan

None - plan executed exactly as written. Task 1 code was already committed from a previous session; Task 2 was uncommitted and committed in this session.

## Issues Encountered

- Pre-existing TypeScript errors in `prisma/seed.ts` and `auth.service.ts` (referencing removed `onboardingData` model) are unrelated to this plan's scope. All plan-scoped tests pass cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 complete: canonical learner profile data model, read API, and recalculation hooks all in place
- Ready for Phase 5 (onboarding round submission) which will call `createFromRoundOne()` to create initial profiles
- Ready for Phase 6 (recommendations) which will consume the canonical profile for personalization

---
*Phase: 04-canonical-learner-profile-foundation*
*Completed: 2026-03-24*
