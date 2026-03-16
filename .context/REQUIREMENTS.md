# REQUIREMENTS

> Requirements with unique IDs for traceability. Format: AREA-XX

---

## Authentication (AUTH)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AUTH-01 | Email OTP login (passwordless, 6 digits, 2min expiry) | Must | Done ✅ |
| AUTH-02 | Google OAuth login | Must | Done ✅ |
| AUTH-03 | GitHub OAuth login | Must | Partial ⚠️ |
| AUTH-04 | JWT access token (15min) + refresh token (7 days) | Must | Done ✅ |
| AUTH-05 | Access token in memory, refresh token in HttpOnly cookie | Must | Done ✅ |
| AUTH-06 | Max 5 failed OTP attempts → lock 15 minutes | Must | Done ✅ |
| AUTH-07 | Max 5 OTP requests per email per hour | Must | Done ✅ |
| AUTH-08 | Exponential backoff on brute force | Should | Done ✅ |
| AUTH-09 | Refresh token rotation on each refresh | Should | Done ✅ |
| AUTH-10 | Auto-create user on first OTP verify | Must | Done ✅ |
| AUTH-11 | isNewUser flag → redirect to onboarding | Must | Done ✅ |

## Onboarding (ONB)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| ONB-01 | Questionnaire: career goal, prior knowledge, background, hours/week | Must | Done ✅ |
| ONB-02 | AI recommendation based on answers | Must | Done ✅ |
| ONB-03 | User confirms selected learning path | Must | Done ✅ |

## Learning Paths (LP)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| LP-01 | 3 paths: Frontend ReactJS (~70), Backend NodeJS (~70), Fullstack (~70) | Must | Done ✅ |
| LP-02 | AI/Python path visible as "Coming Soon" | Should | Done ✅ |
| LP-03 | Hierarchical: Path → Track → Lesson | Must | Done ✅ |
| LP-04 | Lesson prerequisite DAG support | Must | Done ✅ |
| LP-05 | User enrollment in learning path | Must | Done ✅ |
| LP-06 | Public path listing (no auth required) | Must | Done ✅ |

## Lessons (LES)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| LES-01 | Lesson content: title, summary, content, external links | Must | Done ✅ |
| LES-02 | Mark lesson as started/completed | Must | Done ✅ |
| LES-03 | Each lesson can have 1 quiz | Must | Done ✅ |
| LES-04 | AI chat per lesson (context-aware) | Must | Done ✅ |

## Quiz (QZ)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| QZ-01 | Single choice questions | Must | Done ✅ |
| QZ-02 | Essay questions (AI graded, 0-100 score + feedback) | Must | Done ✅ |
| QZ-03 | Code challenges (Monaco editor, Judge0 sandbox) | Must | Done ✅ |
| QZ-04 | Pass threshold (default 70%) | Must | Done ✅ |
| QZ-05 | Retry limit (default 3) with cooldown (default 60s) | Must | Done ✅ |
| QZ-06 | Quiz result history per user | Must | Done ✅ |

## Progress (PRG)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PRG-01 | Overall progress tracking | Must | Done ✅ |
| PRG-02 | Path-specific progress | Must | Done ✅ |
| PRG-03 | Activity graph (like GitHub contributions) | Should | Done ✅ |
| PRG-04 | Learning sessions (start/end, duration tracking) | Must | Done ✅ |
| PRG-05 | Time spent per lesson | Must | Done ✅ |

## AI Chatbot (AI)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AI-01 | Context injection: current lesson + completed lessons + quiz scores | Must | Done ✅ |
| AI-02 | Model selection based on user tier | Must | Done ✅ |
| AI-03 | Daily token quota per tier | Must | Done ✅ |
| AI-04 | Chat history | Must | Done ✅ |
| AI-05 | Fallback message when AI unavailable | Must | Done ✅ |
| AI-06 | Only answer questions related to current/previous lessons | Should | Pending |
| AI-07 | Respond in same language as user (VI/EN) | Should | Pending |

## Payment (PAY)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PAY-01 | 3 tiers: Free / Pro / Ultra (monthly subscription) | Must | Done ✅ |
| PAY-02 | MoMo payment integration | Must | Done ✅ |
| PAY-03 | VNPay payment integration | Must | Done ✅ |
| PAY-04 | Webhook verification (HMAC-SHA256 for MoMo, checksum for VNPay) | Must | Done ✅ |
| PAY-05 | Subscription expiry cron job | Must | Done ✅ |
| PAY-06 | Renewal before expiry extends period | Should | Pending |
| PAY-07 | Payment history | Must | Done ✅ |

## Admin (ADM)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| ADM-01 | CRUD learning paths, tracks, lessons, quizzes | Must | Pending |
| ADM-02 | User management (list all users) | Must | Pending |
| ADM-03 | System analytics | Should | Pending |
| ADM-04 | AI bulk content generation tool | Should | Pending |

## Frontend (FE)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FE-01 | Dark mode from day 1 | Must | Pending |
| FE-02 | Mobile-first responsive | Must | Pending |
| FE-03 | i18n: Vietnamese first, English later | Must | Pending |
| FE-04 | Landing page | Must | Pending |
| FE-05 | Dashboard with progress overview | Must | Done ✅ |
| FE-06 | Monaco editor for code challenges | Must | Pending |

## Security (SEC)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| SEC-01 | HTTPS everywhere | Must | Pending |
| SEC-02 | CORS configured (only devpathos.tech + localhost) | Must | Pending |
| SEC-03 | Rate limiting on all endpoints | Must | Done ✅ |
| SEC-04 | Input validation (class-validator backend, Zod frontend) | Must | Done ✅ |
| SEC-05 | Helmet secure headers | Must | Done ✅ |
| SEC-06 | Code challenge sandboxing (Judge0) | Must | Pending |
| SEC-07 | Payment webhook signature verification | Must | Done ✅ |

## Infrastructure (INF)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| INF-01 | Docker dev environment | Must | Done |
| INF-02 | Docker production compose | Must | Pending |
| INF-03 | CI/CD with GitHub Actions | Must | Pending |
| INF-04 | DigitalOcean VPS deployment | Must | Pending |
| INF-05 | Cloudflare DNS setup | Must | Pending |
| INF-06 | Monitoring (Sentry + Datadog) | Should | Pending |
