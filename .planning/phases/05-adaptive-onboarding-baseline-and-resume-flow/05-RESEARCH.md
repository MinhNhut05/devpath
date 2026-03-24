# Phase 5: Adaptive Onboarding Baseline and Resume Flow - Research

**Researched:** 2026-03-24
**Domain:** Multi-round onboarding, learner-profile initialization, resume flow, and authenticated frontend/backend state orchestration
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

### Round Content Design
- **D-01:** Round 2 covers both career direction and learning style in one round: target role (junior/intern/freelance), work environment (startup/corporate/remote), timeline to reach goal, and preferred learning style (video/text/hands-on).
- **D-02:** Round 3 is a skill self-assessment: user rates 5-6 tech topics on a 1-5 scale with Vietnamese descriptions (1=Moi bat dau, 2=Biet co ban, 3=Tam duoc, 4=Kha tot, 5=Tu tin).
- **D-03:** Round 3 topics are dynamic — selected based on the user's careerGoal from round 1 (e.g., Frontend goal shows HTML/CSS, JavaScript, React; Backend goal shows Node.js, SQL, API design). The topic mapping logic lives in backend constants.
- **D-04:** Each round has 3-5 questions. Answer format is single-choice or multi-choice (consistent with round 1). No free-text fields.
- **D-05:** Round 2 answers stored as Json in OnboardingRound model: `{ targetRole, workEnvironment, timeline, learningStyle }`. Round 3 stored as: `{ skillRatings: { topicSlug: number }[] }`.

### Multi-Round Flow
- **D-06:** Flow is continuous: R1 -> R2 -> R3 without returning to dashboard between rounds. After R3 completion, AI recommendation runs, then user confirms path.
- **D-07:** Rounds are strictly sequential — must complete round N before starting round N+1. Backend enforces this by checking previous round's completedAt.
- **D-08:** AI recommendation runs only after round 3 (all 3 rounds of data available). The existing recommendation endpoint is updated to require round 3 completion.
- **D-09:** LearnerProfile is created after round 1 completion (implement `createFromRoundOne`). Profile is progressively updated after round 2 and round 3 with richer data (e.g., round 2 adds learningPace context, round 3 refines skillLevel and strengths/weaknesses from self-ratings).

### Resume Flow
- **D-10:** Resume detection checks OnboardingRound records with `completedAt` not null. If round 1 done but round 2 missing -> resume from round 2. If rounds 1-2 done but round 3 missing -> resume from round 3.
- **D-11:** When user returns to /onboarding, show a "Welcome back" message with a "Tiep tuc" (Continue) button that takes them directly to the next incomplete round.
- **D-12:** No display of previous round answers on resume. User only sees the new round's questions.
- **D-13:** Progress is shown via a 3-step stepper at the top of the onboarding page, indicating which round the user is currently on.

### Frontend Architecture
- **D-14:** Single page layout at /onboarding — content changes per round, URL stays the same. Stepper component at top shows current round progress.
- **D-15:** Refactor Onboarding.tsx into container + child components: RoundOne, RoundTwo, RoundThree (each renders its own questions), plus shared components Stepper and QuestionCard.
- **D-16:** Round transitions use Framer Motion (already in project dependencies) for slide/fade animations between rounds.
- **D-17:** Fix the confirm gap: after AI recommendation is shown, user clicks "Xac nhan" (Confirm) which calls POST /onboarding/confirm with the recommended learningPathId, creating UserLearningPath enrollment, then navigates to dashboard.

### Claude's Discretion
- Exact question wording for round 2 and round 3 (Vietnamese text in vi.ts)
- Topic-to-careerGoal mapping specifics (which topics show for which goals)
- Stepper component visual design details
- Framer Motion animation parameters (duration, easing)
- Backend endpoint refactoring approach (extend existing vs new endpoints)
- Error handling for edge cases (e.g., user tries to access round 3 before completing round 2)
- How LearnerProfile fields map from round 2/3 answers (exact computation rules)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ONB-04 | User can resume an unfinished onboarding flow from the last incomplete round | Use backend-derived onboarding status from completed `OnboardingRound` rows, not frontend-only auth flags; single `/onboarding` page reads `completedRounds`, `nextRound`, and `canRecommend`. |
| ONB-05 | User can complete onboarding round 1 for basic profile information | Keep round 1 as the baseline write path, then call `LearnerProfileService.createFromRoundOne()` immediately after successful persistence. |
| ONB-06 | User can complete onboarding round 2 for career goals and direction | Add explicit round-2 validation/persistence and backend sequential gating that refuses round 2 unless round 1 is completed. |
| ONB-07 | User can complete onboarding round 3 for current skill assessment | Generate round-3 questions dynamically from `careerGoal`, persist self-ratings, and gate recommendation generation until round 3 is complete. |
</phase_requirements>

## Summary

Phase 5 should be planned as a state-orchestration phase, not just a form-building phase. The existing schema already supports the core storage model: `OnboardingRound` persists `userId + roundNumber + answers + completedAt`, and `LearnerProfileService.createFromRoundOne()` already exists as the explicit seam for initial profile creation. That means the highest-value planning work is around service boundaries, read models, sequential validation, and frontend state flow rather than database redesign.

The current implementation is still fundamentally round-1-only. Backend `OnboardingService.submitAnswers()` hardcodes round 1, `getRecommendation()` only reads round 1, and frontend `Onboarding.tsx` is a single component using raw `useState + useEffect + axios` with no resume model and no real confirm call. Auth redirect logic also still treats onboarding as a binary `isNewUser` condition derived from “completed round 1 exists”, which is insufficient for partial completion across rounds 2-3.

The most reliable plan is to introduce a dedicated onboarding read model for resume/status, keep sequential completion enforcement in the backend service, create/update the canonical learner profile from onboarding milestones, and refactor the frontend into a container plus round components using React Query for server state and a minimal local state surface for in-progress selection UI.

**Primary recommendation:** Use a dedicated backend onboarding status contract plus explicit per-round backend validation, then build a single `/onboarding` container that derives resume/current-round state from the server instead of from `isNewUser` or local component state.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NestJS | `11.0.1` installed (`11.1.17` current registry) | Backend controller/service/DTO orchestration | Already the project standard; DTO validation, guards, and modular services fit sequential onboarding well. |
| Prisma | `7.3.0` installed (`7.5.0` current registry) | Persistence and transactional writes | Existing `OnboardingRound`, `LearnerProfile`, and `UserLearningPath` models already cover this phase without schema churn. |
| class-validator | `0.14.3` installed (`0.15.1` current registry) | Backend request validation | Best fit for strict round-by-round DTO validation and early rejection of invalid payloads. |
| React Router DOM | `7.1.3` installed (`7.13.2` current registry) | Protected routing and redirects | Single-route onboarding plus guarded redirects already match project routing structure. |
| TanStack React Query | `^5` installed (`5.95.2` current registry) | Server-state reads/writes, invalidation, loading/error states | Project state decisions already prefer React Query as the source of truth for critical server data. |
| Framer Motion | `12.38.0` installed (`12.38.0` current registry) | Round transitions and exit/enter animation | Already present; enough for step/round transitions without custom animation code. |
| Zustand | `5.0.3` installed | Auth/bootstrap state only | Keep auth/session in store, but do not expand it into canonical onboarding progress state. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Axios | `1.7.9` installed | API client transport | Keep as the transport layer under React Query hooks/mutations. |
| Vitest + Testing Library | `Vitest 4`, `@testing-library/react 16`, `jsdom 29` | Frontend component and route-state tests | Use for `/onboarding` container, resume banner, and confirm flow tests. |
| Jest + Nest TestingModule | `Jest 30`, `@nestjs/testing 11.0.1` | Backend service/controller tests | Use for round gating, recommendation gating, and profile-creation side effects. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React Query hooks for onboarding reads/writes | Raw `useEffect` + direct `api.get/post` in `Onboarding.tsx` | Faster to start, but duplicates loading/error/cache logic and makes resume invalidation fragile. |
| Server-derived onboarding status | Infer progress from `user.isNewUser` or local storage | Simpler short term, but wrong for partially completed users and refresh/resume scenarios. |
| DTO-specific round endpoints or explicit round validation branches | One loose “submit anything” endpoint | Generic shape is flexible, but harder to validate cleanly with `class-validator` and easier to break sequential guarantees. |
| Framer Motion transitions | Hand-rolled CSS timing/state logic | Custom transitions add UI state complexity with little product value. |

**Installation:**
```bash
# No new dependencies required for this phase.
# Reuse the packages already present in:
# /home/minhnhut_dev/projects/path-learn/backend/package.json
# /home/minhnhut_dev/projects/path-learn/frontend/package.json
```

**Version verification:**
- `@nestjs/common`: project uses `11.0.1`; npm registry current is `11.1.17` (published 2026-03-16).
- `@prisma/client`: project uses `7.3.0`; npm registry current is `7.5.0` (registry modified 2026-03-24; exact `7.3.0` publish date not cleanly extracted from npm output).
- `class-validator`: project uses `0.14.3`; npm registry current is `0.15.1`; `0.14.3` was published 2025-11-24.
- `@tanstack/react-query`: project uses `^5`; npm registry current is `5.95.2` (published 2026-03-23).
- `react-router-dom`: project uses `7.1.3`; npm registry current is `7.13.2` (registry modified 2026-03-24; exact `7.1.3` publish date not cleanly extracted from npm output).
- `framer-motion`: project uses `12.38.0`; npm registry current is also `12.38.0` (registry modified 2026-03-24; exact publish timestamp not cleanly extracted from npm output).

## Architecture Patterns

### Recommended Project Structure
```text
backend/src/modules/onboarding/
├── onboarding.controller.ts          # status, round submit, recommendation, confirm
├── onboarding.service.ts             # sequential gating and orchestration
├── dto/
│   ├── submit-round-one.dto.ts       # explicit round 1 contract
│   ├── submit-round-two.dto.ts       # explicit round 2 contract
│   ├── submit-round-three.dto.ts     # explicit round 3 contract
│   └── confirm-path.dto.ts           # existing confirm contract
├── constants/
│   ├── onboarding-questions.ts       # round 1
│   ├── onboarding-round-two.ts       # round 2 options
│   └── onboarding-round-three.ts     # topic mapping by careerGoal
└── recommendation/                   # prompt builder + parser + fallback

frontend/src/
├── pages/
│   └── Onboarding.tsx                # container only
├── components/onboarding/
│   ├── Stepper.tsx                   # 3-step progress indicator
│   ├── WelcomeBackCard.tsx           # resume CTA
│   ├── QuestionCard.tsx              # shared answer UI
│   ├── RoundOne.tsx                  # round 1 renderer
│   ├── RoundTwo.tsx                  # round 2 renderer
│   ├── RoundThree.tsx                # round 3 renderer
│   └── RecommendationPanel.tsx       # recommendation + confirm state
└── hooks/
    ├── useOnboardingStatus.ts        # query
    ├── useSubmitOnboardingRound.ts   # mutation
    ├── useOnboardingRecommendation.ts# query
    └── useConfirmOnboardingPath.ts   # mutation
```

### Pattern 1: Backend owns the onboarding state machine
**What:** Keep the legal onboarding progression in the backend, with the frontend only rendering what the server says is currently allowed.

**When to use:** Always. This phase includes resume, sequential gating, recommendation gating, and learner-profile side effects. Those rules must not live only in React.

**Example:**
```typescript
// Source: /home/minhnhut_dev/projects/path-learn/backend/src/modules/onboarding/onboarding.service.ts
const existing = await this.prisma.onboardingRound.findUnique({
  where: { userId_roundNumber: { userId, roundNumber: 1 } },
});

if (existing) {
  throw new ConflictException('Onboarding already completed');
}
```

**Planning guidance:** Generalize this pattern for rounds 2 and 3, then add an onboarding-status read model such as:
- `completedRounds: number[]`
- `nextRound: 1 | 2 | 3 | null`
- `resumeAvailable: boolean`
- `canRequestRecommendation: boolean`
- `recommendedLearningPathId?: string`

### Pattern 2: Create the canonical learner profile at round milestones
**What:** Treat onboarding writes and learner-profile projection as one workflow, not two separate features.

**When to use:** Immediately after round completion writes.

**Example:**
```typescript
// Source: /home/minhnhut_dev/projects/path-learn/backend/src/modules/learner-profile/learner-profile.service.ts
async createFromRoundOne(userId: string) {
  throw new Error(
    `createFromRoundOne not yet implemented for user ${userId}`,
  );
}
```

**Planning guidance:**
- Round 1: create/upsert initial `LearnerProfile`.
- Round 2: enrich profile with learning context derived from direction/style answers.
- Round 3: refine `skillLevel`, `strengths`, `weaknesses`, and preferred topics from self-ratings.
- Keep these updates in backend services, not in frontend heuristics.

### Pattern 3: Single `/onboarding` container + child round components
**What:** One route renders different internal states based on backend status and current round.

**When to use:** This is locked by D-14 and D-15.

**Example:**
```tsx
// Source: /home/minhnhut_dev/projects/path-learn/frontend/src/App.tsx
<Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
```

**Planning guidance:**
- `Onboarding.tsx` should stop owning every question/render branch directly.
- Child components render UI only; hooks own server reads/writes.
- Local state should hold current round answers only, not the canonical progress model.

### Pattern 4: React Query for authoritative onboarding server state
**What:** Use `useQuery` for status/recommendation and `useMutation` for round submission/confirm actions.

**When to use:** Any time the state comes from the backend or affects multiple screens after refresh/navigation.

**Example:**
```tsx
// Source: /home/minhnhut_dev/projects/path-learn/frontend/src/test/renderWithProviders.tsx
<QueryClientProvider client={queryClient}>
  <BrowserRouter>{children}</BrowserRouter>
</QueryClientProvider>
```

**Planning guidance:**
- Query keys should be explicit, e.g. `['onboarding', 'status']`, `['onboarding', 'recommendation']`, `['learner-profile', 'me']`.
- After successful round submit, invalidate onboarding status and any dependent recommendation/profile query.
- After successful confirm, invalidate learning-path/dashboard queries before navigation so the dashboard sees the new enrollment immediately.

### Anti-Patterns to Avoid
- **Frontend-only resume logic:** Do not reconstruct resume state from `isNewUser`, local storage, or stale component memory.
- **One giant onboarding component:** Current `Onboarding.tsx` is already too stateful for one round; three rounds plus resume/recommendation will become brittle quickly.
- **Recommendation before round 3:** This is explicitly disallowed by D-08.
- **Duplicating profile-derivation logic in frontend:** Canonical learner-profile rules belong in backend services.
- **Custom animation orchestration:** Use Framer Motion `AnimatePresence` and variant-driven transitions, not hand-built timers.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Resume detection | Client-only heuristics like `isNewUser === false` or localStorage checkpoints | Backend onboarding status derived from `OnboardingRound.completedAt` | Partial completion is server truth; auth bootstrap state is too coarse. |
| Mutation loading/cache handling | Manual `loading/error/retry` flags scattered across components | React Query `useMutation` + query invalidation | Handles retries, dedupe, invalidation, and consistent UX across refresh/navigation. |
| Sequential round validation | Ad-hoc `if` checks only in React | NestJS service + DTO validation + Prisma round lookups | Prevents users from skipping rounds via direct API calls or stale tabs. |
| Path confirmation navigation | Navigate immediately on click without backend write | `POST /onboarding/confirm` then invalidate and navigate | Current confirm gap loses enrollment side effects and risks stale dashboard state. |
| Transition lifecycle | Custom timeout-based enter/exit logic | Framer Motion `AnimatePresence` | Exit/enter transitions are already a solved problem in the stack. |
| Learner profile seed logic | Duplicate mapping rules in multiple services/components | `LearnerProfileService` as the single owner | Profile derivation becomes inconsistent quickly if spread across features. |

**Key insight:** The dangerous complexity in this phase is not the forms themselves; it is the coordination between auth, onboarding progress, learner-profile projection, recommendation gating, and dashboard enrollment. Reuse the stack’s state-management and validation primitives instead of inventing custom flow machinery.

## Common Pitfalls

### Pitfall 1: Treating `isNewUser` as full onboarding state
**What goes wrong:** Users who completed round 1 but not rounds 2-3 can be treated as “not new” and routed away from onboarding incorrectly.

**Why it happens:** Current auth logic only checks whether completed round 1 exists.

**How to avoid:** Keep `isNewUser` only for first-login coarse routing. Add a dedicated onboarding status query for real resume behavior.

**Warning signs:** Users land on `/dashboard` after partial onboarding, or returning users cannot resume round 2/3.

### Pitfall 2: Planning recommendation as a round-1-only feature
**What goes wrong:** Planner keeps the existing recommendation contract, then later has to retrofit round-2/3 data into prompts, fallback logic, and gating.

**Why it happens:** Current code already has a working round-1 recommendation path, so it is tempting to extend it minimally.

**How to avoid:** Plan recommendation updates together with round-3 completion and backend status/read-model work.

**Warning signs:** Recommendation endpoint still only reads `roundNumber: 1`, or round 3 completes without affecting recommendation inputs.

### Pitfall 3: Keeping all onboarding server interactions inside `Onboarding.tsx`
**What goes wrong:** The page becomes a monolith with duplicated loading/error state, hard-to-test side effects, and fragile refresh behavior.

**Why it happens:** The current page already uses direct axios calls and local state for one-round UX.

**How to avoid:** Move reads/writes into hooks and make round components presentational.

**Warning signs:** More than one mutation path in the page component, multiple chained `api.get/post` calls, or duplicated error parsing logic.

### Pitfall 4: Forgetting learner-profile side effects after round 1
**What goes wrong:** Round 1 appears successful, but the canonical learner profile still does not exist, so later features see `Learner profile not initialized`.

**Why it happens:** `createFromRoundOne()` is currently a placeholder and easy to postpone.

**How to avoid:** Treat round-1 completion and profile creation as the same milestone in the plan.

**Warning signs:** `/learner-profile/me` still returns 404 after successful round 1.

### Pitfall 5: Confirm button navigates before mutation success
**What goes wrong:** UI reaches dashboard, but no `UserLearningPath` was created, producing inconsistent explore/dashboard state.

**Why it happens:** Current frontend confirm handler only calls `navigate('/dashboard')`.

**How to avoid:** Confirm must be a mutation with success-based navigation.

**Warning signs:** Dashboard opens with no active path immediately after confirm, or users can “complete onboarding” without actual enrollment.

### Pitfall 6: Overusing imperative navigation for state that should be declarative
**What goes wrong:** Redirects become scattered across effects and callbacks, making route behavior harder to reason about.

**Why it happens:** `useNavigate` is easy to reach for.

**How to avoid:** Keep `Navigate` for render-time redirects and `useNavigate` for true post-mutation or non-direct-interaction flows only, following React Router guidance.

**Warning signs:** Multiple `useEffect` blocks whose only job is redirect coordination based on transient flags.

## Code Examples

Verified patterns from project code and official guidance:

### Compound unique round lookup for sequential gating
```typescript
// Source: /home/minhnhut_dev/projects/path-learn/backend/src/modules/onboarding/onboarding.service.ts
const round = await this.prisma.onboardingRound.findUnique({
  where: { userId_roundNumber: { userId, roundNumber: 1 } },
});

if (!round) {
  throw new NotFoundException('Please complete onboarding first');
}
```

### Auth guard stays declarative for route protection
```tsx
// Source: /home/minhnhut_dev/projects/path-learn/frontend/src/components/ProtectedRoute.tsx
if (!accessToken) {
  return <Navigate to="/login" replace />;
}
```

### Auth bootstrap restores session before routes decide
```tsx
// Source: /home/minhnhut_dev/projects/path-learn/frontend/src/components/auth/AuthBootstrap.tsx
const token = await refreshAccessTokenOnce();
if (token) {
  const meRes = await api.get('/auth/me');
  const user = meRes.data?.data;
  if (user) {
    setAuth(token, user);
  }
}
```

### QueryClient test wrapper for onboarding UI tests
```tsx
// Source: /home/minhnhut_dev/projects/path-learn/frontend/src/test/renderWithProviders.tsx
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}
```

### Recommendation/confirm transition rule
```tsx
// Source: /home/minhnhut_dev/projects/path-learn/frontend/src/pages/Onboarding.tsx
async function handleConfirm() {
  navigate('/dashboard');
}
```

Use this as a negative example in planning: replace it with a real confirm mutation, invalidate dependent queries, then navigate only after success.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-round onboarding treated as one-shot setup | Multi-round resumable onboarding with server-derived next-step status | Locked in Phase 5 context on 2026-03-24 | Planning must include state-machine behavior, not just question rendering. |
| Auth-only `isNewUser` routing | Separate auth bootstrap plus feature-specific onboarding progress state | Phase 3 auth bootstrap + Phase 5 context | Prevents partial-onboarding users from falling through the cracks. |
| Page-local axios orchestration | React Query as source of truth for critical server data | Phase 3 project decision | Onboarding status, recommendation, and confirm flows should move to hooks. |
| Recommendation based on round 1 only | Recommendation gated on completion of all 3 rounds | Locked in D-08 | Prompt builder and fallback logic both need richer inputs. |
| Frontend-only “confirm” navigation | Backend-authoritative enrollment via `POST /onboarding/confirm` | Locked in D-17 | Fixes inconsistent dashboard/enrollment state after onboarding. |

**Deprecated/outdated:**
- **Binary onboarding model (`isNewUser` only):** insufficient for resume flow after round 1.
- **Monolithic `Onboarding.tsx` orchestration:** too brittle for three rounds, resume CTA, animations, and confirm mutation.
- **Round-1-only recommendation inputs:** incompatible with the locked phase boundary.

## Open Questions

1. **What exact onboarding status contract should the frontend consume?**
   - What we know: Resume must derive from completed round rows, and the frontend needs `nextRound` plus a welcome-back state.
   - What's unclear: Exact endpoint shape is discretionary.
   - Recommendation: Plan a dedicated `GET /onboarding/status` response and do not overload `/auth/me` or `learner-profile/me` for this.

2. **Should the API use one generic submit endpoint or explicit per-round endpoints?**
   - What we know: Existing controller has `POST /onboarding/submit`, but phase complexity increases sharply with round-specific validation.
   - What's unclear: Whether the team prefers controller surface minimization or DTO clarity.
   - Recommendation: Use explicit round DTOs and explicit round handling. If keeping one route, still keep service methods and validation branches round-specific.

3. **How should round 2 and round 3 update `LearnerProfile` exactly?**
   - What we know: Round 1 must create the profile; round 2 adds learning context; round 3 refines skill-level/strengths/weaknesses.
   - What's unclear: Exact deterministic mapping rules.
   - Recommendation: Define those mappings in the plan before implementation starts, and keep them deterministic and testable.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Backend: Jest 30 + `@nestjs/testing` 11.0.1; Frontend: Vitest 4 + Testing Library 16 + jsdom 29 |
| Config file | Backend: `/home/minhnhut_dev/projects/path-learn/backend/package.json` (`jest` block); Frontend: `/home/minhnhut_dev/projects/path-learn/frontend/vitest.config.ts` |
| Quick run command | `pnpm --dir /home/minhnhut_dev/projects/path-learn/backend test -- onboarding.service.spec.ts --runInBand && pnpm --dir /home/minhnhut_dev/projects/path-learn/frontend test:run -- src/pages/Onboarding.test.tsx` |
| Full suite command | `pnpm --dir /home/minhnhut_dev/projects/path-learn/backend test && pnpm --dir /home/minhnhut_dev/projects/path-learn/frontend test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ONB-04 | Resume from the last incomplete round using completed round rows | backend service + frontend component/integration | `pnpm --dir /home/minhnhut_dev/projects/path-learn/backend test -- onboarding.service.spec.ts --runInBand && pnpm --dir /home/minhnhut_dev/projects/path-learn/frontend test:run -- src/pages/Onboarding.test.tsx` | Backend spec ✅ / Frontend spec ❌ Wave 0 |
| ONB-05 | Complete round 1 and initialize learner profile | backend service | `pnpm --dir /home/minhnhut_dev/projects/path-learn/backend test -- onboarding.service.spec.ts --runInBand` | ✅ |
| ONB-06 | Complete round 2 only after round 1 | backend service + frontend component | `pnpm --dir /home/minhnhut_dev/projects/path-learn/backend test -- onboarding.service.spec.ts --runInBand && pnpm --dir /home/minhnhut_dev/projects/path-learn/frontend test:run -- src/pages/Onboarding.test.tsx` | Backend spec ✅ / Frontend spec ❌ Wave 0 |
| ONB-07 | Complete round 3, then request recommendation and confirm path | backend service + frontend component/integration | `pnpm --dir /home/minhnhut_dev/projects/path-learn/backend test -- onboarding.service.spec.ts --runInBand && pnpm --dir /home/minhnhut_dev/projects/path-learn/frontend test:run -- src/pages/Onboarding.test.tsx` | Backend spec ✅ / Frontend spec ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --dir /home/minhnhut_dev/projects/path-learn/backend test -- onboarding.service.spec.ts --runInBand` or `pnpm --dir /home/minhnhut_dev/projects/path-learn/frontend test:run -- src/pages/Onboarding.test.tsx`
- **Per wave merge:** `pnpm --dir /home/minhnhut_dev/projects/path-learn/backend test && pnpm --dir /home/minhut_dev/projects/path-learn/frontend test:run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `/home/minhnhut_dev/projects/path-learn/frontend/src/pages/Onboarding.test.tsx` — covers ONB-04, ONB-06, ONB-07 container behavior and confirm flow
- [ ] Expand `/home/minhnhut_dev/projects/path-learn/backend/src/modules/onboarding/onboarding.service.spec.ts` — add round-2/3 gating, status/resume, and profile-creation assertions
- [ ] Add `/home/minhnhut_dev/projects/path-learn/backend/src/modules/onboarding/onboarding.controller.spec.ts` if controller branching grows — covers request/guard/DTO surface
- [ ] Add shared frontend test helpers for mocked onboarding status/recommendation responses if `renderWithProviders` alone becomes noisy

## Sources

### Primary (HIGH confidence)
- `https://reactrouter.com/start/declarative/navigating` - official guidance on `Link`, `NavLink`, `Navigate`, and limited use of `useNavigate`
- `https://tanstack.com/query/latest/docs/framework/react/guides/mutations` - official mutation guidance (`useMutation`, invalidation, direct cache updates, optimistic updates)
- `https://motion.dev/docs/react-animate-presence` - official guidance for exit/enter transitions with `AnimatePresence`
- `https://www.npmjs.com/package/@nestjs/common` - package/version verification for NestJS
- `https://www.npmjs.com/package/@prisma/client` - package/version verification for Prisma
- `https://www.npmjs.com/package/class-validator` - package/version verification for DTO validation library
- `https://www.npmjs.com/package/@tanstack/react-query` - package/version verification for React Query
- `https://www.npmjs.com/package/react-router-dom` - package/version verification for routing library
- `https://www.npmjs.com/package/framer-motion` - package/version verification for animation library

### Secondary (MEDIUM confidence)
- `/home/minhnhut_dev/projects/path-learn/backend/src/modules/onboarding/onboarding.service.ts` - current round-1 submit, recommendation, and confirm behavior
- `/home/minhnhut_dev/projects/path-learn/backend/src/modules/learner-profile/learner-profile.service.ts` - current learner-profile contract and deferred `createFromRoundOne` seam
- `/home/minhnhut_dev/projects/path-learn/frontend/src/pages/Onboarding.tsx` - current single-round page and confirm gap
- `/home/minhnhut_dev/projects/path-learn/frontend/src/components/auth/AuthBootstrap.tsx` - current auth bootstrap contract
- `/home/minhnhut_dev/projects/path-learn/frontend/src/components/ProtectedRoute.tsx` - declarative auth guard pattern
- `/home/minhnhut_dev/projects/path-learn/.planning/phases/05-adaptive-onboarding-baseline-and-resume-flow/05-CONTEXT.md` - locked phase boundary and implementation decisions

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified against the repo’s installed dependencies and npm registry metadata; official docs confirm the recommended usage patterns.
- Architecture: MEDIUM - strongly grounded in current code and phase context, but the exact endpoint surface is still discretionary.
- Pitfalls: MEDIUM - supported by existing code smells and official guidance, but some library-doc details were incomplete and required codebase-based inference.

**Research date:** 2026-03-24
**Valid until:** 2026-04-07