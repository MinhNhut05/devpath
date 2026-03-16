# STATE - Session Memory

> Read at START, update at END of each session. Keep < 100 lines.

---

## Current Focus

- **Phase**: Phase 1 - Foundation (gần xong, còn 08-admin-be)
- **Active Branch**: `feat/admin-be`
- **Last Completed Branch**: `feat/seed-explore-aichat` ✅
- **Phase 1 Progress**: 7/8 done
- **Next Branch**: `feat/admin-be` (đang làm)
- **Last Main Commit**: 548316e Merge branch 'feat/seed-explore-aichat'

## Branch Dispatch

| # | Branch | Status | Notes |
|---|--------|--------|-------|
| 01 | `feat/auth-be` | MERGED ✅ | Merged to main |
| 02 | `feat/onboarding-be` | MERGED ✅ | Merged to main (commit 1fbf2db) |
| 03 | `feat/learning-paths-be` | MERGED ✅ | Merged to main (commit 523a8d5) |
| 04 | `feat/quiz-be` | MERGED ✅ | Merged to main |
| 05 | `feat/progress-be` | MERGED ✅ | Merged to main (commit fb0b4a8) |
| 06 | `feat/ai-chat-be` | MERGED ✅ | 4 endpoints, 36 new tests (172 total) |
| -- | `fix/auth-register-login` | MERGED ✅ | Register/login with password, forgot/reset, email verify, frontend AuthPage |
| -- | `fix/oauth-login-bug` | MERGED ✅ | Google OAuth fixed, GitHub pending |
| -- | `fix/onboarding-dashboard` | MERGED ✅ | Dashboard API + onboarding blank fix |
| 07 | `feat/payment-be` | MERGED ✅ | MoMo + VNPay + subscriptions |
| -- | `feat/seed-explore-aichat` | MERGED ✅ | 4 paths, 23 tracks, 58 lessons, /explore /ai-chat /lesson pages |
| 08 | `feat/admin-be` | IN PROGRESS 🔧 | - |

## Environment

| Service | Port | Status |
|---------|------|--------|
| PostgreSQL | localhost:5434 | Configured |
| Redis | localhost:6380 | Configured |
| Backend | localhost:3002 | Running |
| Frontend | localhost:5174 | Running |

## Blockers / Notes

- **GitHub OAuth**: pending (de-prioritized, fix later)
- **AI service**: fixed stream:false + OpenAI response format

## Last Session

- **Date**: 2026-03-16
- **Did**: Merged feat/seed-explore-aichat (seed 4 paths/23 tracks/58 lessons,
  created /explore /ai-chat /lesson/:slug pages, fixed AI Chat field mismatch +
  AI service streaming bug, added "Khám phá thêm" link to Dashboard)
- **Next**: feat/admin-be — Admin CRUD + Users + Analytics + AI bulk content
