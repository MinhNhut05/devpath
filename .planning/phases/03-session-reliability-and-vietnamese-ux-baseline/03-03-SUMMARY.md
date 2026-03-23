---
phase: 03-session-reliability-and-vietnamese-ux-baseline
plan: 03
subsystem: ui
tags: [react-query, react, typescript, vietnamese-ux, dashboard, lesson, quiz]
requires:
  - phase: 03-01
    provides: session-reliability baseline, Vietnamese string cleanup foundation
  - phase: 03-02
    provides: auth bootstrap restore and centralized query key groundwork
provides:
  - React Query hooks for dashboard, learning paths, enrollment, lesson, outline, and quiz flows
  - Skeleton-based loading states for dashboard, explore, lesson, quiz, and lesson sidebar
  - Centralized Vietnamese copy usage across critical learning flows
affects: [phase-03-ui, session-reliability, learning-flow, onboarding-followups]
tech-stack:
  added: []
  patterns: [React Query server-state hooks, mutation-driven invalidation, skeleton loading, centralized vi.ts strings]
key-files:
  created:
    - frontend/src/hooks/useDashboard.ts
    - frontend/src/hooks/useLearningPaths.ts
    - frontend/src/hooks/useEnroll.ts
    - frontend/src/hooks/useLesson.ts
    - frontend/src/hooks/useLessonComplete.ts
    - frontend/src/hooks/useLessonOutline.ts
    - frontend/src/hooks/useQuiz.ts
    - frontend/src/hooks/useQuizSubmit.ts
  modified:
    - frontend/src/pages/Dashboard.tsx
    - frontend/src/pages/Explore.tsx
    - frontend/src/pages/Lesson.tsx
    - frontend/src/pages/Quiz.tsx
    - frontend/src/components/LessonSidebar.tsx
    - frontend/src/strings/vi.ts
key-decisions:
  - "Use React Query hooks as the single source of truth for server data while keeping form and toggle state local to the UI."
  - "Await enrollment invalidation before dashboard navigation so newly enrolled paths appear without manual refresh."
  - "Keep existing dashboard mock XP, leaderboard, activity, and badge sections unchanged because the backend endpoints are still absent and this plan only migrates data fetching patterns."
patterns-established:
  - "Critical screens should move API reads into dedicated hooks under frontend/src/hooks and consume them through centralized query keys."
  - "Mutations should invalidate dashboard and progress-related query groups instead of patching page-local state."
requirements-completed: [STAB-04]
duration: 15 min
completed: 2026-03-23
---

# Phase 03 Plan 03: React Query Migration for Critical Flows Summary

**React Query-backed dashboard, explore, lesson, quiz, and sidebar flows with shared invalidation rules, skeleton loading, and centralized Vietnamese UI copy**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-23T11:04:43Z
- **Completed:** 2026-03-23T11:19:48Z
- **Tasks:** 7
- **Files modified:** 14

## Accomplishments
- Added reusable React Query hooks for dashboard overview, learning paths, enrollment, lesson loading, lesson completion, lesson outline, quiz loading, and quiz submission.
- Replaced page-level fetch effects on Dashboard, Explore, Lesson, Quiz, and LessonSidebar with query and mutation hooks plus skeleton loading states.
- Centralized critical Vietnamese copy in `vi.ts` and aligned error, empty, and retry flows with shared UI feedback components.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create React Query hooks for dashboard and learning paths** - `7013580` (feat)
2. **Task 2: Create React Query hooks for enrollment, lesson, completion, outline, quiz** - `e038f8c` (feat)
3. **Task 3: Migrate Dashboard.tsx to React Query + Vietnamese strings** - `6cc51c5` (feat)
4. **Task 4: Migrate Explore.tsx to React Query + Vietnamese strings + skeleton loading** - `90fcdd3` (feat)
5. **Task 5: Migrate Lesson.tsx to React Query + Vietnamese strings + skeleton loading** - `acfa1e6` (feat)
6. **Task 6: Migrate Quiz.tsx to React Query + Vietnamese strings + skeleton loading** - `6f8cad1` (feat)
7. **Task 7: Migrate LessonSidebar.tsx to React Query + Vietnamese strings + skeleton loading** - `0de1182` (feat)

## Files Created/Modified
- `frontend/src/hooks/useDashboard.ts` - Query hook and shared `DashboardData` types for dashboard overview.
- `frontend/src/hooks/useLearningPaths.ts` - Query hook for learning path catalog loading.
- `frontend/src/hooks/useEnroll.ts` - Enrollment mutation with dashboard, learning-path, and progress invalidation.
- `frontend/src/hooks/useLesson.ts` - Lesson query hook with non-blocking lesson start side effect.
- `frontend/src/hooks/useLessonComplete.ts` - Lesson completion mutation with targeted invalidation.
- `frontend/src/hooks/useLessonOutline.ts` - Lesson outline query hook for sidebar track navigation.
- `frontend/src/hooks/useQuiz.ts` - Quiz loading hook for lesson quiz route.
- `frontend/src/hooks/useQuizSubmit.ts` - Quiz submission mutation returning graded results.
- `frontend/src/pages/Dashboard.tsx` - Removed local fetch state, used `useDashboard`, `PageError`, and `PageEmpty`.
- `frontend/src/pages/Explore.tsx` - Replaced local fetch and enroll logic with shared hooks and skeleton cards.
- `frontend/src/pages/Lesson.tsx` - Moved lesson and completion flows to hooks and added skeleton shell.
- `frontend/src/pages/Quiz.tsx` - Moved quiz loading/submission to hooks and converted spinner to skeleton UI.
- `frontend/src/components/LessonSidebar.tsx` - Loaded outline with React Query while keeping track toggle state local.
- `frontend/src/strings/vi.ts` - Added missing dashboard activity and badge copy needed after migration.

## Decisions Made
- Use hook-level exported interfaces so pages consume one server-data contract instead of duplicating local interfaces.
- Keep answers and open track state local because they are short-lived interaction state, not shared server state.
- Treat first-load failures as page-level retryable errors, while mutation failures stay toast-driven or inline based on the screen pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Waited for enrollment invalidation before dashboard navigation**
- **Found during:** Task 4 (Migrate Explore.tsx to React Query + Vietnamese strings + skeleton loading)
- **Issue:** Navigating immediately after enroll could land on Dashboard before invalidated queries refreshed, leaving the newly enrolled path missing until a later refetch.
- **Fix:** Updated `useEnroll` to `await Promise.all(...)` across dashboard, learning-path, and progress invalidations so the page-level `onSuccess` navigation happens after cache refresh is scheduled.
- **Files modified:** `frontend/src/hooks/useEnroll.ts`
- **Verification:** Code path now waits on invalidation promises before Explore triggers `navigate('/dashboard')`.
- **Committed in:** `90fcdd3` (part of Task 4 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** The auto-fix tightened correctness for the new React Query enrollment flow without expanding scope.

## Issues Encountered
- `pnpm --dir /home/minhnhut_dev/projects/path-learn/frontend exec tsc --noEmit` still fails because unrelated files already contain unused `vi` imports outside this plan scope.
- Those out-of-scope files were logged in `/home/minhnhut_dev/projects/path-learn/.planning/phases/03-session-reliability-and-vietnamese-ux-baseline/deferred-items.md` instead of being changed during this plan.
- The first `gsd-tools commit` metadata attempt staged deletions for tracked planning files instead of the updated working-tree copies. This was corrected with a follow-up docs commit after verifying the files still existed on disk.

## Known Stubs
- `frontend/src/pages/Dashboard.tsx:21-78` - `mockUser`, `mockLeaderboard`, `mockActivity`, and `mockBadges` remain intentionally wired because the plan explicitly required keeping existing mock sections unchanged while migrating the surrounding fetch flow to React Query.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Critical learning flows now share consistent server-state patterns, which makes later personalization or reliability work easier to extend.
- Full frontend type-check remains blocked by unrelated pre-existing unused imports listed in the deferred items file.

## Self-Check: PASSED
- Verified summary file exists at `/home/minhnhut_dev/projects/path-learn/.planning/phases/03-session-reliability-and-vietnamese-ux-baseline/03-03-SUMMARY.md`
- Verified representative created hook files exist at `/home/minhnhut_dev/projects/path-learn/frontend/src/hooks/useDashboard.ts` and `/home/minhnhut_dev/projects/path-learn/frontend/src/hooks/useQuizSubmit.ts`
- Verified all task commit hashes exist in git history: `7013580`, `e038f8c`, `6cc51c5`, `90fcdd3`, `acfa1e6`, `6f8cad1`, `0de1182`

---
*Phase: 03-session-reliability-and-vietnamese-ux-baseline*
*Completed: 2026-03-23*
