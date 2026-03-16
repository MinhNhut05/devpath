# ROADMAP

> Development phases with progress tracking.

---

## Overall Progress

| Phase | Name | Branches | Status | Progress |
|-------|------|----------|--------|----------|
| 1 | Backend Foundation | 01-08 | Nearly Done | 88% (7/8) |
| 2 | Frontend | 09-15 | Partially Done | 40% (09-12 done, 13 partial) |
| 3 | Polish & Deploy | 16-17 | Not Started | 0% |

---

## Phase 1: Backend Foundation (Branches 01-08)

| # | Branch | Scope | Status |
|---|--------|-------|--------|
| 01 | `feat/auth-be` | OTP + OAuth + JWT + Guards | Done ✅ |
| 02 | `feat/onboarding-be` | Onboarding flow + AI recommendation | Done ✅ |
| 03 | `feat/learning-paths-be` | Learning Paths + Tracks + Lessons | Done ✅ |
| 04 | `feat/quiz-be` | Quiz + Essay grading + Code challenge | Done ✅ |
| 05 | `feat/progress-be` | User progress + sessions + activity | Done ✅ |
| 06 | `feat/ai-chat-be` | AI chatbot + context injection + quota | Done ✅ |
| 07 | `feat/payment-be` | MoMo + VNPay + subscription + tiers | Done ✅ |
| 08 | `feat/admin-be` | Admin CRUD + analytics + bulk generate | In Progress 🔧 |

## Phase 2: Frontend (Branches 09-15)

| # | Branch | Scope | Status |
|---|--------|-------|--------|
| 09 | `feat/init-fe` | Vite + React + Tailwind + Shadcn + routing | Done ✅ |
| 10 | `feat/auth-fe` | Login page + auth store + token handling | Done ✅ |
| 11 | `feat/onboarding-fe` | Onboarding UI flow | Done ✅ |
| 12 | `feat/dashboard-fe` | Dashboard + progress + activity graph | Done ✅ |
| 13 | `feat/learning-fe` | Lesson page + AI chat + quiz UI | Partial ⚠️ |
| 14 | `feat/payment-fe` | Plans page + payment flow | Not Started |
| 15 | `feat/admin-fe` | Admin panel UI | Not Started |

## Phase 3: Polish & Deploy (Branches 16-17)

| # | Branch | Scope | Status |
|---|--------|-------|--------|
| 16 | `chore/deploy` | VPS + Docker prod + CI/CD | Not Started |
| 17 | `feat/polish` | Error handling + responsive + i18n | Not Started |

---

## Milestones

| Milestone | Description | Target |
|-----------|-------------|--------|
| M1 | Auth working (OTP + OAuth + JWT) | Phase 1, Branch 01 |
| M2 | Core backend complete (all 8 modules) | Phase 1, Branch 08 |
| M3 | Frontend MVP (login + learning + quiz) | Phase 2, Branch 13 |
| M4 | Payment integrated | Phase 2, Branch 14 |
| M5 | Deployed to production | Phase 3, Branch 16 |
| M6 | Production ready | Phase 3, Branch 17 |

---

## Completed Milestones

- [x] Project planning & documentation (2026-02-15)
- [x] Docker dev environment setup (2026-01-27)
- [x] Custom Claude Skills created (2026-01-28)
- [x] Context restructuring to .context/ (2026-03-02)
- [x] Auth working (OTP + OAuth + JWT) (2026-03-xx)
- [x] Core backend modules 1-7 complete (2026-03-16)
- [x] Frontend MVP (login + onboarding + dashboard + learning pages) (2026-03-16)
