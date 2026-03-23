# Feature Research

**Domain:** Personalized web learning platform milestone v1.1 (post-MVP stabilization, adaptive onboarding, soft personalization)
**Researched:** 2026-03-22
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in a post-MVP learning product. Missing these = product feels unreliable, confusing, or unfinished.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Auth/session stability across critical flows | Learners expect login, refresh, protected routes, and progress state to survive normal navigation without random logout or broken redirects | HIGH | Depends on existing JWT + refresh-cookie flow; must stabilize refresh, redirect, and stale client state before deeper personalization |
| Vietnamese UX quality cleanup on core screens | In a Vietnamese-first product, broken diacritics, inconsistent terms, and awkward wording immediately reduce trust | MEDIUM | Apply to onboarding, dashboard, lesson, quiz, plans/payment, notifications, and auth surfaces first |
| Adaptive 5-round onboarding with saved context | Users expect a personalized app to ask goal/level/context, then remember earlier answers instead of restarting from zero | MEDIUM | Keep it bounded and hybrid: first rounds explicit, later rounds adapt from prior answers and in-app behavior |
| Clear main-path designation with next-step guidance | Learning products are expected to show “what should I do next?” instead of leaving users in a flat catalog | MEDIUM | Must stay soft: one main journey, but off-path content remains accessible as secondary exploration |
| Personalized learning-path recommendations | Once onboarding exists, learners expect recommendations to reflect goals, level, and chosen direction | MEDIUM | Use existing path catalog and onboarding profile; recommendation quality matters more than algorithm novelty in this milestone |
| Progress state that aligns with the main path | Users expect dashboard/path screens to reflect their current journey, not just generic progress fragments | MEDIUM | Needs consistent resume/continue CTA, active main path state, and off-path separation |
| Backend-minimum leaderboard (points + rank) | If the app has quizzes/progress/gamification cues, users expect a simple points/rank view to work consistently | MEDIUM | Scope tightly: platform-wide points + rank only; no friends graph, no team leagues, no deep seasons |
| In-app learning notifications | Learners expect visible reminders and important event updates inside the app | MEDIUM | Start with event-driven in-app notifications only: payment result, quiz/progress milestone, onboarding follow-up, and return-to-learn nudges |
| Secure real payment upgrade flow with auto-activation | Paying users expect upgrade confirmation to be trustworthy, immediate, and not require manual support | HIGH | Must move real recipient/config details to secure backend config; verified confirmation should activate plan automatically |
| Critical Frontend-path content gap fill | A guided main path fails if recommended path steps lead to thin or missing core content | MEDIUM | Focus only on gaps blocking the primary Frontend learning journey; do not turn this milestone into broad content expansion |

### Differentiators (Competitive Advantage)

Features that make DevPath feel more helpful than a generic course catalog while staying realistic for a stabilization-first release.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Hybrid adaptive onboarding over 5 rounds | Collects better learner context without forcing a long one-shot setup form | MEDIUM | Stronger than a static questionnaire, safer than fully autonomous AI onboarding |
| AI-suggested main path with explanation | Gives users a tailored starting direction and a reason for the recommendation, increasing trust and clarity | HIGH | Recommendation should be explainable from profile inputs; suggestion should feel assistive, not mandatory |
| Soft guidance model (main path + secondary learning) | Preserves learner agency while still reducing decision fatigue | MEDIUM | Important product choice: guidance without hard locking content outside the main path |
| Profile-aware AI chat | Makes AI chat feel connected to the learner’s goals, level, and selected path instead of generic Q&A | MEDIUM | Use onboarding/main-path profile as context, but keep chat bounded to avoid overpromising coaching accuracy |
| Event-relevant notification feed | Notifications become useful when they reflect real study state instead of acting as generic marketing banners | MEDIUM | Prioritize actionable messages: continue main path, quiz completed, upgrade activated, profile follow-up |
| Vietnamese-first polish across personalized flows | Strong local-language UX quality can differentiate more than adding one more shallow feature | MEDIUM | Especially valuable in onboarding, recommendations, payment trust copy, and empty/error states |

### Anti-Features (Commonly Requested, Often Problematic)

Features that sound attractive but would pull v1.1 away from a stability-first milestone.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Hard-lock all non-main-path content | Feels like “true personalization” and may seem simpler to explain | Conflicts with milestone direction; creates frustration, blocks exploration, and increases risk if recommendations are imperfect | Use a soft main-path model with one recommended journey plus optional secondary learning |
| Fully autonomous AI re-planning every session | Sounds more intelligent and personalized | Unstable behavior destroys trust, makes progress hard to reason about, and is too hard to debug for v1.1 | Use bounded recommendation rules plus AI suggestion/explanation at clear checkpoints |
| Friends/team/social leaderboard | Social competition sounds engaging | Requires social graph, privacy decisions, moderation, and more UI/backend scope than justified here | Ship platform-wide points + rank only |
| Multi-channel notification blast (email/SMS/push) | Stakeholders often equate more channels with better engagement | Adds delivery infra, preference management, opt-out complexity, and spam risk before in-app usefulness is proven | Start with in-app notifications only, then add channels later if engagement data supports it |
| Client-side payment config or exposed recipient details | Seems faster to implement | Security and trust failure; sensitive payment setup must not live in the frontend | Keep real payment configuration in backend/env and expose only safe display data |
| Broad content expansion across all tracks | More content feels like obvious value | Turns a focused stabilization milestone into a large content program and delays fixes to core flows | Fill only critical gaps blocking the main Frontend journey |
| Gamification overload (streaks, badges, leagues, seasonal events) | Looks motivating on paper | Creates many edge cases and shallow engagement without first fixing reliability and clarity | Start with points, rank, and meaningful progress cues |

## Feature Dependencies

```
[Auth/Session Stability]
    └──required by──> [Adaptive Onboarding Persistence]
    └──required by──> [Main Path State]
    └──required by──> [Leaderboard Identity + Rank]
    └──required by──> [Notifications Feed]
    └──required by──> [Secure Upgrade Activation]

[Adaptive 5-Round Onboarding]
    └──produces──> [Learner Profile]
                            └──required by──> [AI-Suggested Main Path]
                            └──required by──> [Personalized Path Recommendations]
                            └──enhances──> [Profile-Aware AI Chat]
                            └──enhances──> [Relevant Notifications]

[AI-Suggested Main Path]
    └──requires──> [Learner Profile]
    └──requires──> [Path/Progress State That Supports One Main Journey]
    └──requires──> [Critical Path Content Exists]

[Critical Frontend Content Gap Fill]
    └──required by──> [Main Path Guidance Credibility]

[Points Event Model]
    └──required by──> [Leaderboard Basics]
    └──enhances──> [Notification Triggers]

[Event-Driven Notification Model]
    └──requires──> [Auth/Session Stability]
    └──requires──> [Trigger Sources: onboarding, progress, payment, leaderboard]

[Secure Payment Backend Config + Confirmation Handling]
    └──required by──> [Real Upgrade Flow]
                            └──enhances──> [Payment Success Notifications]

[Soft Main-Path Guidance] ──conflicts──> [Hard Content Locking]
```

### Dependency Notes

- **Auth/session stability requires first-class attention:** onboarding persistence, notification read state, leaderboard identity, and payment activation all become unreliable if refresh/redirect behavior is still broken.
- **Adaptive onboarding requires profile persistence:** if answers are not saved cleanly across rounds and sessions, the experience feels repetitive rather than adaptive.
- **AI-suggested main path requires critical content coverage:** recommending a path that leads into sparse Frontend content will damage trust faster than having no personalization at all.
- **Main-path guidance requires progress-model alignment:** dashboard, path detail, lesson resume, and quiz completion state must agree on what the learner’s main journey is.
- **Leaderboard basics require a points event model:** points must come from explicit quiz/progress events, not ad hoc UI calculations.
- **Notifications require event triggers and user context:** event-driven notifications are only useful if they can point to a concrete next action or state change.
- **Real upgrade flow requires secure backend confirmation:** client-only success screens are not enough; subscription activation should happen after trusted confirmation.
- **Soft guidance conflicts with hard locking:** these two directions produce different UX expectations, so the milestone should choose one and stay consistent.

## MVP Definition

### Launch With (v1)

Minimum milestone scope needed to make DevPath v1.1 feel stable and credibly personalized.

- [ ] **Auth/session refresh and redirect stabilization** — foundational; broken session behavior undermines every other feature in this milestone
- [ ] **Vietnamese UX cleanup on critical screens** — essential for trust, clarity, and perceived product quality
- [ ] **Bounded adaptive 5-round onboarding** — enough personalization input to drive recommendations without excessive setup friction
- [ ] **AI-suggested main path with soft guidance** — core personalization outcome; one recommended journey, optional off-path learning still available
- [ ] **Main-path-aligned progress and continue-learning cues** — makes the recommendation visible in daily use, not just during onboarding
- [ ] **Personalized learning-path recommendations + basic profile use in AI chat** — ties onboarding data into the broader learning experience
- [ ] **Backend-minimum leaderboard (points + rank)** — smallest shippable gamification loop that matches the existing learning product direction
- [ ] **In-app notifications for key learning/payment events** — useful event feed, not a full messaging platform
- [ ] **Secure real payment upgrade flow with auto-activation on confirmation** — required for production trust and paid conversion
- [ ] **Critical Frontend-path content gap fill** — required so the recommended primary path is actually usable end-to-end

### Add After Validation (v1.x)

Features to add once the stabilized core is working in real usage.

- [ ] **Behavior-informed onboarding follow-ups beyond the initial 5 rounds** — add when initial onboarding data proves insufficient for recommendation quality
- [ ] **Notification preferences and richer categories** — add when baseline in-app notification usefulness is validated
- [ ] **Leaderboard slices or cycles (weekly reset, track filter, cohort filter)** — add when points + rank are actively used and understood
- [ ] **Deeper AI chat personalization** — add when basic profile-aware chat is reliable and clearly valuable

### Future Consideration (v2+)

Features to defer until the stable personalized core is proven.

- [ ] **Friends/team/social leaderboard** — defer because it requires social graph, privacy choices, and moderation overhead
- [ ] **Email/push notification channels** — defer until in-app notification engagement proves which messages deserve external delivery
- [ ] **Dynamic curriculum re-planning by AI** — defer until the product has more stable data, stronger observability, and more complete content coverage
- [ ] **Large-scale content expansion across all tracks** — defer because milestone priority is path credibility, not catalog breadth
- [ ] **Hard-gated learning paths** — defer because current milestone direction explicitly prefers soft guidance over rigid control

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Auth/session stabilization | HIGH | HIGH | P1 |
| Vietnamese UX cleanup | HIGH | MEDIUM | P1 |
| Adaptive 5-round onboarding | HIGH | MEDIUM | P1 |
| AI-suggested main path | HIGH | HIGH | P1 |
| Main-path-aligned progress/continue cues | HIGH | MEDIUM | P1 |
| Personalized recommendations | HIGH | MEDIUM | P1 |
| Basic profile-aware AI chat | MEDIUM | MEDIUM | P1 |
| Leaderboard basics (points + rank) | MEDIUM | MEDIUM | P1 |
| In-app notifications basics | MEDIUM | MEDIUM | P1 |
| Secure real payment upgrade flow | HIGH | HIGH | P1 |
| Critical Frontend content gap fill | HIGH | MEDIUM | P1 |
| Notification preferences | MEDIUM | MEDIUM | P2 |
| Leaderboard filters/resets | MEDIUM | MEDIUM | P2 |
| Extended behavior-driven onboarding | MEDIUM | HIGH | P2 |
| Social leaderboard | LOW | HIGH | P3 |
| Multi-channel notifications | LOW | HIGH | P3 |
| Fully dynamic AI curriculum planning | MEDIUM | HIGH | P3 |
| Broad cross-track content expansion | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for milestone launch
- P2: Should have after the stabilized core proves itself
- P3: Nice to have, future consideration

## Competitor Feature Analysis

This milestone is best compared to adjacent learning-product patterns, not copied feature-for-feature.

| Feature | Adjacent Pattern: Duolingo-style learning apps | Adjacent Pattern: Khan/Coursera/Codecademy-style guided learning | Our Approach |
|---------|-----------------------------------------------|---------------------------------------------------------------|--------------|
| Onboarding | Goal/level capture is used to personalize the early experience | Goal and skill context usually influence recommendations and pacing | 5-round bounded onboarding that remembers answers and adapts gradually |
| Main-path guidance | Clear “do this next” cues reduce decision fatigue | Recommended sequence and progress visibility are common table stakes | One AI-suggested main path with soft guidance, not hard gating |
| Leaderboard | Simple points/rank competition can motivate repeat usage | Often absent or secondary in more curriculum-driven products | Backend-minimum points + rank only; no social graph in v1.1 |
| Notifications | Reminder loops can improve return behavior when tied to learning state | LMS-style event notifications work when they are relevant and controllable | In-app event-driven notifications first; no email/SMS/push expansion yet |
| Personalization | Lightweight personalization works better than opaque automation | Learners trust guidance more when progress and recommendations are understandable | Explainable AI-suggested path + profile-aware chat, kept bounded |
| Payment trust | Upgrade flow must feel immediate and credible after confirmation | Subscription products are expected to activate successfully without manual support | Secure backend-configured real payment flow with verified auto-activation |

## Sources

- `/home/minhnhut_dev/projects/path-learn/.planning/PROJECT.md` — primary milestone scope and constraints source of truth
- Adjacent learning-product patterns from widely adopted products such as Duolingo, Khan Academy, Coursera, Canvas, and Codecademy were used only as general ecosystem framing in this file; current official-doc verification was partial in this session, so those comparisons should be treated as MEDIUM/LOW-confidence framing rather than hard requirements

---
*Feature research for: DevPath v1.1 personalized learning milestone*
*Researched: 2026-03-22*
