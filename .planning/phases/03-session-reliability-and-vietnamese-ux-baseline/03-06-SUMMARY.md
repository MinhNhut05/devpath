---
phase: 03-session-reliability-and-vietnamese-ux-baseline
plan: 06
subsystem: ui
tags: [react, typescript, vietnamese-ux, vi-strings, dashboard, lesson]
requires:
  - phase: 03-04
    provides: Centralized Vietnamese learner-facing strings and the vi.ts localization pattern
provides:
  - Vietnamese badge names for the dashboard badge strip
  - Vietnamese resource type labels for lesson external links
  - Removal of the last targeted hardcoded English learner-facing labels from Dashboard and Lesson
affects: [phase-03-ui, vietnamese-ux, dashboard-polish, lesson-polish]
tech-stack:
  added: []
  patterns: [centralized vi.ts strings, page literals replaced by localized keys, learner-facing copy deduplication]
key-files:
  created: []
  modified:
    - frontend/src/strings/vi.ts
    - frontend/src/pages/Dashboard.tsx
    - frontend/src/pages/Lesson.tsx
key-decisions:
  - "Extend `frontend/src/strings/vi.ts` first, then point Dashboard and Lesson to those keys instead of keeping page-local literals."
patterns-established:
  - "When a learner-facing Vietnamese label is missing, add it to `vi.ts` before touching page rendering code."
  - "Mock or config-backed UI labels should still read from centralized string keys so future real-data swaps do not reintroduce inline copy."
requirements-completed: [STAB-03]
duration: 6 min
completed: 2026-03-24
---

# Phase 03 Plan 06: Fix Remaining English Labels in Dashboard and Lesson Summary

**Vietnamese badge names and lesson resource type labels now flow from `vi.ts`, removing the remaining targeted English copy from the dashboard and lesson learner surfaces**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-24T01:25:45Z
- **Completed:** 2026-03-24T01:32:14Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added the missing Vietnamese dashboard badge-name keys and lesson resource-type keys to the centralized `vi.ts` string map.
- Replaced hardcoded English badge names in `Dashboard.tsx` with `vi.dashboard.*Name` references.
- Replaced hardcoded English lesson resource labels in `Lesson.tsx` with `vi.lesson.resource*` references while preserving the existing UI styling and behavior.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add badge name and resource type label keys to vi.ts** - `2022459` (feat)
2. **Task 2: Replace English badge names in Dashboard.tsx with vi.ts keys** - `e52f03b` (feat)
3. **Task 3: Replace English resource type labels in Lesson.tsx with vi.ts keys** - `22c040a` (feat)

## Files Created/Modified
- `frontend/src/strings/vi.ts` - Added dashboard badge-name keys and lesson resource-type label keys for centralized Vietnamese copy.
- `frontend/src/pages/Dashboard.tsx` - Swapped the mock badge names from English literals to `vi.dashboard.*Name` keys.
- `frontend/src/pages/Lesson.tsx` - Swapped the external link type labels from English literals to `vi.lesson.resource*` keys.

## Decisions Made
- Keep the localization change minimal and data-safe by extending the existing centralized string table instead of introducing page-local translation helpers.
- Use direct `vi.lesson.resource*` assignments in `linkTypeConfig` because `vi` is a stable module-level constant and does not require getter indirection here.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dashboard and Lesson now follow the same centralized Vietnamese string pattern used by the earlier Phase 03 UI cleanup work.
- Future UI polish on these screens can reuse the new `vi.ts` keys instead of reintroducing inline copy.

## Self-Check: PASSED
- Verified summary file exists at `/home/minhnhut_dev/projects/path-learn/.planning/phases/03-session-reliability-and-vietnamese-ux-baseline/03-06-SUMMARY.md`
- Verified modified files exist at `/home/minhnhut_dev/projects/path-learn/frontend/src/strings/vi.ts`, `/home/minhnhut_dev/projects/path-learn/frontend/src/pages/Dashboard.tsx`, and `/home/minhnhut_dev/projects/path-learn/frontend/src/pages/Lesson.tsx`
- Verified all task commit hashes exist in git history: `2022459`, `e52f03b`, `22c040a`

---
*Phase: 03-session-reliability-and-vietnamese-ux-baseline*
*Completed: 2026-03-24*
