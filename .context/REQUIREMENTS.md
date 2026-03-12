# REQUIREMENTS

> Requirements with unique IDs for traceability. Format: AREA-XX

---

## Authentication (AUTH)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AUTH-01 | Email OTP login (passwordless, 6 digits, 2min expiry) | Must | Pending |
| AUTH-02 | Google OAuth login | Must | Pending |
| AUTH-03 | GitHub OAuth login | Must | Pending |
| AUTH-04 | JWT access token (15min) + refresh token (7 days) | Must | Pending |
| AUTH-05 | Access token in memory, refresh token in HttpOnly cookie | Must | Pending |
| AUTH-06 | Max 5 failed OTP attempts → lock 15 minutes | Must | Pending |
| AUTH-07 | Max 5 OTP requests per email per hour | Must | Pending |
| AUTH-08 | Exponential backoff on brute force | Should | Pending |
| AUTH-09 | Refresh token rotation on each refresh | Should | Pending |
| AUTH-10 | Auto-create user on first OTP verify | Must | Pending |
| AUTH-11 | isNewUser flag → redirect to onboarding | Must | Pending |

## Onboarding (ONB)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| ONB-01 | Questionnaire: career goal, prior knowledge, background, hours/week | Must | Pending |
| ONB-02 | AI recommendation based on answers | Must | Pending |
| ONB-03 | User confirms selected learning path | Must | Pending |

## Learning Paths (LP)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| LP-01 | 3 paths: Frontend ReactJS (~70), Backend NodeJS (~70), Fullstack (~70) | Must | Pending |
| LP-02 | AI/Python path visible as "Coming Soon" | Should | Pending |
| LP-03 | Hierarchical: Path → Track → Lesson | Must | Pending |
| LP-04 | Lesson prerequisite DAG support | Must | Pending |
| LP-05 | User enrollment in learning path | Must | Pending |
| LP-06 | Public path listing (no auth required) | Must | Pending |

## Lessons (LES)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| LES-01 | Lesson content: title, summary, content, external links | Must | Pending |
| LES-02 | Mark lesson as started/completed | Must | Pending |
| LES-03 | Each lesson can have 1 quiz | Must | Pending |
| LES-04 | AI chat per lesson (context-aware) | Must | Pending |

## Quiz (QZ)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| QZ-01 | Single choice questions | Must | Pending |
| QZ-02 | Essay questions (AI graded, 0-100 score + feedback) | Must | Pending |
| QZ-03 | Code challenges (Monaco editor, Judge0 sandbox) | Must | Pending |
| QZ-04 | Pass threshold (default 70%) | Must | Pending |
| QZ-05 | Retry limit (default 3) with cooldown (default 60s) | Must | Pending |
| QZ-06 | Quiz result history per user | Must | Pending |

## Progress (PRG)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PRG-01 | Overall progress tracking | Must | Pending |
| PRG-02 | Path-specific progress | Must | Pending |
| PRG-03 | Activity graph (like GitHub contributions) | Should | Pending |
| PRG-04 | Learning sessions (start/end, duration tracking) | Must | Pending |
| PRG-05 | Time spent per lesson | Must | Pending |

## AI Chatbot (AI)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AI-01 | Context injection: current lesson + completed lessons + quiz scores | Must | Pending |
| AI-02 | Model selection based on user tier | Must | Pending |
| AI-03 | Daily token quota per tier | Must | Pending |
| AI-04 | Chat history | Must | Pending |
| AI-05 | Fallback message when AI unavailable | Must | Pending |
| AI-06 | Only answer questions related to current/previous lessons | Should | Pending |
| AI-07 | Respond in same language as user (VI/EN) | Should | Pending |

## Payment (PAY)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PAY-01 | 3 tiers: Free / Pro / Ultra (monthly subscription) | Must | Pending |
| PAY-02 | MoMo payment integration | Must | Pending |
| PAY-03 | VNPay payment integration | Must | Pending |
| PAY-04 | Webhook verification (HMAC-SHA256 for MoMo, checksum for VNPay) | Must | Pending |
| PAY-05 | Subscription expiry cron job | Must | Pending |
| PAY-06 | Renewal before expiry extends period | Should | Pending |
| PAY-07 | Payment history | Must | Pending |

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
| FE-05 | Dashboard with progress overview | Must | Pending |
| FE-06 | Monaco editor for code challenges | Must | Pending |

## Security (SEC)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| SEC-01 | HTTPS everywhere | Must | Pending |
| SEC-02 | CORS configured (only devpathos.tech + localhost) | Must | Pending |
| SEC-03 | Rate limiting on all endpoints | Must | Pending |
| SEC-04 | Input validation (class-validator backend, Zod frontend) | Must | Pending |
| SEC-05 | Helmet secure headers | Must | Pending |
| SEC-06 | Code challenge sandboxing (Judge0) | Must | Pending |
| SEC-07 | Payment webhook signature verification | Must | Pending |

## Infrastructure (INF)

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| INF-01 | Docker dev environment | Must | Done |
| INF-02 | Docker production compose | Must | Pending |
| INF-03 | CI/CD with GitHub Actions | Must | Pending |
| INF-04 | DigitalOcean VPS deployment | Must | Pending |
| INF-05 | Cloudflare DNS setup | Must | Pending |
| INF-06 | Monitoring (Sentry + Datadog) | Should | Pending |
