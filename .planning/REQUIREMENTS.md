# Requirements: DevPath Learning v1.1

**Defined:** 2026-03-22
**Core Value:** Guide each learner to the right next step with a stable, personalized learning experience that matches their goals, current level, and progress.

## v1 Requirements

Requirements for milestone v1.1 — Post-MVP Stabilization & Personalization.

### Stability

- [x] **STAB-01**: User can refresh any protected page with a valid session and stay signed in
- [x] **STAB-02**: User can open the app or return to a protected route without false login redirects while auth state is loading
- [x] **STAB-03**: User sees correct Vietnamese text with proper diacritics and natural wording across all user-facing screens
- [x] **STAB-04**: Existing progress, enrollment, and continue-learning data is consistent and free of stale/contradictory state across dashboard, explore, lesson, and quiz flows (data correctness bugs only — new main-path prioritization behavior is covered by LP-10)

### Onboarding

- [x] **ONB-04**: User can resume an unfinished onboarding flow from the last incomplete round
- [x] **ONB-05**: User can complete onboarding round 1 for basic profile information
- [x] **ONB-06**: User can complete onboarding round 2 for career goals and direction
- [x] **ONB-07**: User can complete onboarding round 3 for current skill assessment
- [ ] **ONB-08**: User can complete onboarding round 4 to confirm or adjust a recommended main path
- [ ] **ONB-09**: User can complete onboarding round 5 to calibrate the profile after early learning progress
- [ ] **ONB-10**: Later onboarding rounds appear after lesson milestones instead of forcing all rounds at first login

### Learner Profile

- [x] **PROF-01**: System stores a canonical learner profile that combines onboarding answers and observed learning signals
- [x] **PROF-02**: System persists onboarding answers per round so they can be reused for later recommendations and profile updates
- [x] **PROF-03**: System recalculates learner profile after relevant lesson milestones to support later onboarding rounds and recommendation updates

### Path Guidance

- [ ] **LP-07**: User can view the top 3 ranked learning path recommendations with a short explanation for each
- [ ] **LP-08**: User has exactly one main learning path at a time while off-path learning remains available as secondary activity
- [ ] **LP-09**: User can switch main path at any time without losing previous learning history
- [ ] **LP-10**: Dashboard and continue-learning UI prioritize the current main path over secondary paths

### AI Chat

- [ ] **AI-08**: AI chat uses learner profile and main-path context to tailor tone and response context

### Leaderboard

- [ ] **LEAD-01**: User earns leaderboard points from lesson completion events (point awards must be idempotent — replayed events must not inflate scores)
- [ ] **LEAD-02**: User can view a global leaderboard showing points and rank

### Notifications

- [ ] **NOTF-01**: User can see in-app notifications in a dashboard notification block
- [ ] **NOTF-02**: System creates notifications for key learning events such as lesson completion, next lesson unlock, and learning milestones (notification creation must be idempotent — one source event produces at most one notification)

### Payment

- [ ] **PAY-08**: User can initiate plan upgrade through a backend-created gateway payment flow
- [ ] **PAY-09**: System activates a paid tier only after verified backend confirmation of gateway payment (activation must be idempotent — duplicate provider callbacks must not double-activate)
- [ ] **PAY-10**: User can view real bank transfer payment information in the upgrade flow, served from backend configuration (never hardcoded in frontend code)
- [ ] **PAY-11**: Bank-transfer upgrades remain pending until manually verified
- [ ] **PAY-12**: Payment result UI reads backend-confirmed order status instead of trusting return URL parameters

### Frontend Content

- [ ] **CONT-01**: User can follow the recommended Frontend main path without hitting critical missing lessons in the primary journey
- [ ] **CONT-02**: Frontend main path includes enough core content for recommendation, continue-learning, and early milestone notifications to make sense

## v2 Requirements

Deferred beyond milestone v1.1.

### Onboarding

- **ONB-11**: System can open additional adaptive onboarding rounds beyond the initial 5 when confidence is still low

### AI Chat

- **AI-09**: AI chat proactively coaches the user with deeper personalized study guidance beyond tone and context adaptation

### Notifications

- **NOTF-03**: User can manage notification preferences and categories
- **NOTF-04**: System can deliver notifications through channels beyond in-app feed

### Leaderboard

- **LEAD-03**: User can view leaderboard slices such as weekly ranking or path-specific ranking

### Payment

- **PAY-13**: Bank-transfer upgrades can be auto-reconciled without manual verification

### Content

- **CONT-03**: Users can access significantly expanded content across Backend, Fullstack, and cross-path topics beyond critical Frontend gaps

## Out of Scope

| Feature | Reason |
|---------|--------|
| Hard-lock all non-main-path content | Conflicts with the chosen soft-guidance product direction |
| Friends/team/social leaderboard | Adds social graph, privacy, and moderation scope beyond v1.1 |
| Email/SMS/push notification rollout | In-app notification usefulness must be proven first |
| Fully autonomous AI curriculum replanning every session | Too unstable and hard to debug for a stability-first milestone |
| Client-side storage of payment recipient config or secrets | Sensitive payment configuration must remain backend-managed |
| Broad content expansion across all tracks | This milestone only fills critical Frontend-path gaps |
| Gamification layers like streak systems, badges, leagues, and seasonal events | Over-expands scope before baseline stability and clarity are fixed |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STAB-01 | Phase 3 | Complete |
| STAB-02 | Phase 3 | Complete |
| STAB-03 | Phase 3 | Complete |
| STAB-04 | Phase 3 | Complete |
| PROF-01 | Phase 4 | Complete |
| PROF-02 | Phase 4 | Complete |
| PROF-03 | Phase 4 | Complete |
| ONB-04 | Phase 5 | Complete |
| ONB-05 | Phase 5 | Complete |
| ONB-06 | Phase 5 | Complete |
| ONB-07 | Phase 5 | Complete |
| ONB-08 | Phase 6 | Pending |
| ONB-09 | Phase 6 | Pending |
| ONB-10 | Phase 6 | Pending |
| LP-07 | Phase 6 | Pending |
| LP-08 | Phase 6 | Pending |
| LP-09 | Phase 6 | Pending |
| LP-10 | Phase 6 | Pending |
| AI-08 | Phase 6 | Pending |
| CONT-01 | Phase 6 | Pending |
| CONT-02 | Phase 6 | Pending |
| NOTF-01 | Phase 7 | Pending |
| NOTF-02 | Phase 7 | Pending |
| LEAD-01 | Phase 8 | Pending |
| LEAD-02 | Phase 8 | Pending |
| PAY-08 | Phase 9 | Pending |
| PAY-09 | Phase 9 | Pending |
| PAY-10 | Phase 9 | Pending |
| PAY-11 | Phase 9 | Pending |
| PAY-12 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0
- Coverage status: 100% mapped

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-23 — added roadmap traceability for Phases 3-9*
