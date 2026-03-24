---
phase: 04-canonical-learner-profile-foundation
plan: 01
subsystem: database, api
tags: [prisma, postgresql, nestjs, onboarding, migration, auth]

# Dependency graph
requires:
  - phase: 03-session-reliability-and-vietnamese-ux-baseline
    provides: Stable auth/session flow and onboarding service with OnboardingData model
provides:
  - OnboardingRound Prisma model with round-based answer storage
  - LearnerProfile Prisma model with computed profile fields
  - Migration SQL backfilling OnboardingData into round-1 records and learner profiles
  - Onboarding service using round-1 persistence instead of OnboardingData
  - Auth isNewUser detection using completed round 1 instead of OnboardingData
affects: [04-02, 04-03, 05-adaptive-onboarding, 06-main-path-personalization]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Round-based onboarding storage with compound unique key userId_roundNumber"
    - "Answers stored as JSON with stable question ID keys, not UI labels"
    - "LearnerProfile as single-row computed projection separate from raw answers"
    - "Deterministic SQL backfill with CASE-based skill level and learning pace derivation"

key-files:
  created:
    - "backend/prisma/migrations/20260324_phase4_canonical_learner_profile/migration.sql"
  modified:
    - "backend/prisma/schema.prisma"
    - "backend/src/modules/onboarding/onboarding.service.ts"
    - "backend/src/modules/onboarding/onboarding.service.spec.ts"
    - "backend/src/modules/auth/auth.service.ts"
    - "backend/src/modules/auth/auth.service.spec.ts"

key-decisions:
  - "Store round-1 answers as JSON object with keys matching SubmitOnboardingDto field names (careerGoal, priorKnowledge, learningBackground, hoursPerWeek)"
  - "Derive initial skill_level from prior_knowledge count + hours_per_week; learning_pace from hours_per_week thresholds"
  - "Drop OnboardingData table only after backfill into both onboarding_rounds and learner_profiles"

patterns-established:
  - "Compound unique key for round lookup: prisma.onboardingRound.findUnique({ where: { userId_roundNumber: { userId, roundNumber } } })"
  - "Reconstruct OnboardingDataInput from round answers JSON for existing prompt builder compatibility"
  - "Include onboardingRounds with filtered where clause for auth isNewUser detection"

requirements-completed: [PROF-02]

# Metrics
duration: 12min
completed: 2026-03-24
---

# Plan 04-01: Replace Legacy Onboarding Snapshot with Round-Based Schema

**Round-based OnboardingRound and LearnerProfile Prisma models with deterministic backfill migration, refactored onboarding submission, and auth isNewUser detection**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-24T07:30:00Z
- **Completed:** 2026-03-24T07:42:00Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Replaced OnboardingData model with OnboardingRound (round-based) and LearnerProfile (computed projection) in Prisma schema
- Created migration SQL that backfills existing onboarding_data into round-1 records with derived learner profiles before dropping the legacy table
- Refactored onboarding service to persist round-1 answers as JSON and read them back for recommendations
- Switched auth login isNewUser detection from OnboardingData existence to completed OnboardingRound round 1

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace OnboardingData with round/profile Prisma contracts and migration** - `60078ba` (feat)
2. **Task 2: Refactor onboarding submission and recommendation to round-1 storage** - `e73ebb4` (refactor)
3. **Task 3: Switch auth new-user detection from OnboardingData to completed round 1** - `986fbf5` (refactor)

## Files Created/Modified
- `backend/prisma/schema.prisma` - Added OnboardingRound, LearnerProfile models and enums; removed OnboardingData
- `backend/prisma/migrations/20260324_phase4_canonical_learner_profile/migration.sql` - DDL + backfill + drop migration
- `backend/src/modules/onboarding/onboarding.service.ts` - Round-1 persistence and recommendation reads
- `backend/src/modules/onboarding/onboarding.service.spec.ts` - 13 tests covering round-based onboarding
- `backend/src/modules/auth/auth.service.ts` - isNewUser from onboardingRounds instead of onboardingData
- `backend/src/modules/auth/auth.service.spec.ts` - 36 tests including new round-based isNewUser assertions

## Decisions Made
- Stored round-1 answers using SubmitOnboardingDto field names as JSON keys for consistency with existing validation
- Used `completedAt: { not: null }` filter in auth include to ensure only fully completed rounds count
- Derived initial LearnerProfile skill_level and learning_pace using deterministic CASE expressions matching plan spec

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- OnboardingRound and LearnerProfile schema contracts are ready for Plan 04-02 (learner-profile module and API)
- Auth and onboarding no longer depend on the removed OnboardingData model
- Migration SQL is verified and ready for deployment

---
*Phase: 04-canonical-learner-profile-foundation*
*Completed: 2026-03-24*
