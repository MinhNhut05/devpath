# ARCHITECTURE

> System architecture, database schema, and folder structure.

---

## System Overview

```
                        CLOUDFLARE
                   (DNS + DDoS Protection)
                          |
            +-------------+-------------+
            |                           |
            v                           v
    +---------------+         +-------------------+
    |    VERCEL      |         | DigitalOcean VPS  |
    | React Frontend |         |                   |
    | (Static SPA)   |         |  Nginx Proxy Mgr  |
    |                |         |  (separate VPS)    |
    | devpathos.tech |         |        |           |
    +---------------+         |        v           |
                               |  Docker Compose   |
                               |  +-------------+  |
                               |  | NestJS API  |  |
                               |  | PostgreSQL  |  |
                               |  | Redis       |  |
                               |  +-------------+  |
                               |                   |
                               | api.devpathos.tech|
                               +-------------------+
                                        |
                    +-------------------+-------------------+
                    |                   |                   |
                    v                   v                   v
            +-------------+   +-----------------+   +----------+
            |   Mailgun   |   |  AI Provider    |   |  MoMo /  |
            | (Email OTP) |   | manager.        |   |  VNPay   |
            +-------------+   | devteamos.me    |   +----------+
                               +-----------------+
```

## Backend Structure

```
backend/src/
├── main.ts
├── app.module.ts
├── modules/
│   ├── auth/           # OTP + OAuth + JWT + Guards
│   ├── users/          # User management
│   ├── onboarding/     # Initial questionnaire
│   ├── learning-paths/ # Learning path CRUD
│   ├── lessons/        # Lesson management
│   ├── quizzes/        # Quiz system
│   ├── progress/       # User progress tracking
│   ├── ai/             # AI chatbot + context injection
│   ├── admin/          # Admin panel endpoints
│   └── payment/        # MoMo + VNPay subscriptions
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
└── config/
```

### Module Pattern (NestJS)

Each module follows:
```
module-name/
├── module-name.module.ts      # Module definition
├── module-name.controller.ts  # HTTP handlers
├── module-name.service.ts     # Business logic
├── dto/                       # Request/Response DTOs
│   ├── create-*.dto.ts
│   └── update-*.dto.ts
└── entities/                  # (if needed)
```

## Frontend Structure

```
frontend/src/
├── main.tsx
├── App.tsx
├── components/
│   ├── ui/              # Shadcn/ui components
│   ├── layout/          # Header, Sidebar, Footer, DashboardLayout
│   ├── auth/            # OTPInput, SocialLoginButtons, ProtectedRoute
│   ├── learning/        # LessonCard, ProgressBar, QuizQuestion, CodeEditor
│   └── chat/            # ChatWindow, ChatMessage, ChatInput
├── pages/
│   ├── Landing.tsx
│   ├── Auth/Login.tsx
│   ├── Onboarding/      # Questions, Recommendation
│   ├── Dashboard/       # Progress, Settings
│   ├── Learning/        # PathOverview, Lesson, Quiz
│   ├── Subscription/    # Plans, PaymentResult
│   └── Admin/           # Paths, Lessons, Users
├── hooks/               # useAuth, useProgress, useQuiz, useChat
├── stores/              # Zustand: authStore, progressStore, chatStore, themeStore
├── services/            # Axios: authService, learningService, quizService...
├── lib/                 # utils, constants, validations
├── types/               # TypeScript type definitions
└── styles/globals.css
```

## Database Schema (ERD)

```
USER ──┬── OTPCode
       ├── OnboardingData (1:1)
       ├── UserLearningPath ──── LearningPath ──── Track ──── Lesson
       ├── UserProgress ──────────────────────────────────────── Lesson
       ├── QuizResult ─────────── Quiz ──── QuizQuestion ─────── Lesson
       ├── LearningSession ───────────────────────────────────── Lesson
       ├── AIInteractionLog ──────────────────────────────────── Lesson
       ├── Subscription ──── PaymentLog
       └── PaymentLog

LessonPrerequisite (self-referencing Lesson ↔ Lesson)
```

### Key Enums

| Enum | Values |
|------|--------|
| UserRole | USER, ADMIN |
| UserTier | FREE, PRO, ULTRA |
| AuthProvider | EMAIL, GOOGLE, GITHUB |
| ProgressStatus | NOT_STARTED, IN_PROGRESS, COMPLETED |
| QuestionType | SINGLE_CHOICE, MULTIPLE_CHOICE, ESSAY, CODE_CHALLENGE |
| ActivityType | LESSON_VIEW, QUIZ_ATTEMPT, AI_CHAT |
| PaymentProvider | MOMO, VNPAY |
| PaymentStatus | PENDING, COMPLETED, FAILED, REFUNDED |
| CareerGoal | FRONTEND, BACKEND, FULLSTACK, AI_PYTHON |
| LearningBackground | NO_BACKGROUND, SELF_TAUGHT, BOOTCAMP, CS_DEGREE |

> Full Prisma schema: see `backend/prisma/schema.prisma`
> Detailed ERD: see `.context/specs/01-authentication.md` (User model) and `specs/` files

## API Design

- **Base URL**: `http://localhost:3001/api/v1` (dev) | `https://api.devpathos.tech/api/v1` (prod)
- **Auth**: JWT Bearer token in Authorization header
- **Response format**: `{ success, data, error, meta }` (see specs/02-api-design.md)

### Rate Limiting
| Endpoint Group | Limit |
|---------------|-------|
| Auth (OTP) | 5 requests/email/hour |
| General API | 100 requests/minute/IP |
| AI Chat | Based on tier quota |
| Payment webhooks | No limit (signature verified) |

## Key Patterns

### Backend
- **Guards**: JwtAuthGuard, RolesGuard (ADMIN)
- **Validation**: class-validator + class-transformer (DTOs)
- **Error handling**: NestJS exception filters
- **Logging**: Winston (file-based)
- **Caching**: Redis for rate limiting, OTP storage

### Frontend
- **State**: Zustand (client state) + React Query (server state)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS + Shadcn/ui + dark mode
- **Auth flow**: Access token in memory, refresh token in HttpOnly cookie
