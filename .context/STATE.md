# STATE - Session Memory

> Read at START, update at END of each session. Keep < 100 lines.

---

## Current Focus

- **Phase**: Phase 1 - Foundation
- **Active Branch**: `fix/oauth-login-bug` (from main)
- **Last Completed Branch**: `fix/auth-register-login` ✅
- **Phase 1 Progress**: 6/8 done
- **Next Branch**: `feat/payment-be`
- **Last Main Commit**: Merge branch 'fix/auth-register-login' (b2d9486)

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
| -- | `fix/oauth-login-bug` | IN PROGRESS 🔧 | Google OAuth ✅ fixed, GitHub OAuth 🔴 pending |
| 07 | `feat/payment-be` | NOT STARTED | - |
| 08 | `feat/admin-be` | NOT STARTED | - |
| 09-17 | See ROADMAP.md | NOT STARTED | - |

## Environment

| Service | Port | Status |
|---------|------|--------|
| PostgreSQL | localhost:5434 | Configured |
| Redis | localhost:6380 | Configured |
| Backend | localhost:3002 | Running |
| Frontend | localhost:5174 | Running |

## Blockers / Notes

- **GitHub OAuth**: handleRequest() bị Passport 0.7 gọi 2 lần (giống Google). Cache fix đã apply nhưng có thể GitHub strategy cần debug thêm. Google OAuth đã fix xong.
- **express-session**: Đã thêm vào main.ts cho OAuth state verification
- **AI tests**: ai.service.spec.ts đã sync model names (ag/gemini-3-flash, etc.)

## Last Session

- **Date**: 2026-03-16
- **Did**: fix/oauth-login-bug: Fixed Google OAuth "No user returned" (Passport 0.7 calls handleRequest 2x, cached user from 1st call). Added express-session for OAuth state. Synced AI test model names. Google OAuth ✅ working. GitHub OAuth still pending.
- **Next**: Debug GitHub OAuth, then commit+merge fix/oauth-login-bug. Start `feat/payment-be` or `feat/admin-be`.
