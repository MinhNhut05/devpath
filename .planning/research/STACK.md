# Stack Research

**Domain:** AI-Assisted Personalized Learning Platform (Vietnamese IT Learners)
**Researched:** 2026-03-23
**Confidence:** HIGH (all technologies already in production use in the DevPath MVP)

---

## Current Stack

DevPath is a monorepo with separate backend and frontend applications. The stack below reflects what is **already installed and running** in the MVP codebase.

### Backend (NestJS Monolith)

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| NestJS | 11.x | Backend framework — modules, DI, guards, pipes | Monolith at `backend/src/modules/` |
| TypeScript | 5.7.x | Type safety | Strict mode across backend |
| Prisma | 7.x | ORM + migrations + type-safe queries | Schema at `backend/prisma/schema.prisma`, uses `@prisma/adapter-pg` |
| PostgreSQL | 16.x (Alpine) | Primary database | Dockerized, data persisted via volume |
| Redis | 7.x (Alpine) | Caching + rate limiting | Dockerized, password-protected, appendonly |
| @nestjs/jwt | 11.x | JWT token signing/verification | Access token (15min) + refresh token (7d HttpOnly cookie) |
| Passport | 0.7.x | Auth strategy framework | JWT, Google OAuth, GitHub OAuth strategies |
| @nestjs-modules/mailer | 2.x | Email sending (OTP, notifications) | Uses nodemailer under the hood |
| @nestjs/throttler | 6.x | Rate limiting | Protects auth and AI endpoints |
| @nestjs/schedule | 6.x | Cron jobs | Subscription expiry checks |
| helmet | 8.x | HTTP security headers | Applied globally |
| bcrypt | 6.x | Password hashing | For credential-based auth |
| class-validator + class-transformer | 0.14.x / 0.5.x | DTO validation | Request body/param validation |
| pg | 8.x | PostgreSQL native driver | Used by Prisma adapter |

### Frontend (React SPA)

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| React | 18.x | UI library | SPA architecture, client-side rendering |
| Vite | 6.x | Build tool + dev server | Fast HMR, serves on :5173 |
| TypeScript | 5.7.x | Type safety | Across all frontend code |
| react-router-dom | 7.x | Client-side routing | Protected routes, auth redirects |
| Tailwind CSS | 3.x | Utility-first styling | With @tailwindcss/typography plugin |
| zustand | 5.x | Client state management | Auth/session state |
| axios | 1.x | HTTP client | API calls with interceptor for access token |
| framer-motion | 12.x | Animations | Page transitions, UI motion |
| react-markdown | 10.x | Markdown rendering | Lesson content display |
| remark-gfm + rehype-highlight | latest | Markdown plugins | GFM tables + code syntax highlighting |
| highlight.js | 11.x | Code highlighting | For lesson code blocks |
| lucide-react | latest | Icons | Consistent icon set |
| cmdk | 1.x | Command palette | Quick navigation/search |
| clsx + tailwind-merge | latest | ClassName utilities | Conditional + merge Tailwind classes |

### Infrastructure (Docker Compose)

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| PostgreSQL | postgres:16-alpine | 5432 (host: configurable) | Primary database |
| Redis | redis:7-alpine | 6379 (host: configurable) | Cache + rate limiting |
| Backend | Custom NestJS build | 3001 | API server |
| Frontend | Custom Vite build | 5173 | Dev server |
| pgAdmin | dpage/pgadmin4 | 5050 | DB management UI (tools profile) |
| Redis Commander | rediscommander | 8081 | Redis management UI (tools profile) |
| Mailhog | mailhog/mailhog | 8025 | Email testing (tools profile) |

### AI Integration

| Component | Details |
|-----------|---------|
| Provider | Configurable via `AI_PROVIDER` env var (groq, openai) |
| Gateway | External AI gateway at `manager.devteamos.me` (Anthropic-compatible API) |
| Usage | AI chat for learners, future: AI-suggested main path recommendations |
| Security | Backend-only calls, never expose API keys to frontend |

### Payment Integration

| Provider | Integration Pattern |
|----------|---------------------|
| MoMo | Backend creates order, redirects user, verifies HMAC-SHA256 signed webhook |
| VNPay | Backend creates payment URL, verifies checksum on callback/IPN |
| General | Payment secrets backend-managed only, webhook-driven activation |

---

## Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| pnpm | Package manager | Monorepo workspaces |
| Docker Compose | Local infrastructure | `docker-compose up -d` for all services |
| ESLint + Prettier | Code quality | NestJS default ESLint config |
| Jest | Backend testing | `ts-jest`, spec files alongside source |
| Prisma Studio | Visual DB browser | `pnpm prisma studio` |

---

## v1.1 Milestone — Stack Additions Needed

Based on REQUIREMENTS.md and ARCHITECTURE.md, these are new packages or patterns that may be needed for v1.1 features. **No new framework rewrites** — all additions stay within the existing NestJS + React architecture.

### Backend Additions

| Need | Approach | New Package? |
|------|----------|-------------|
| Learner profile aggregation | New Prisma model + NestJS module | No — uses existing Prisma + NestJS |
| Multi-round onboarding | Expand existing onboarding module with round progression | No |
| Domain events (app-internal) | NestJS EventEmitter2 or custom in-process publisher | Maybe `@nestjs/event-emitter` if not already present |
| Notifications table + API | New Prisma model + NestJS module | No |
| Leaderboard points + rank | New Prisma model + NestJS module | No |
| Payment activation hardening | Idempotency keys + webhook replay protection in subscriptions | No |

### Frontend Additions

| Need | Approach | New Package? |
|------|----------|-------------|
| Notification badge/list UI | React component consuming backend API | No |
| Leaderboard summary UI | React component consuming backend API | No |
| Multi-round onboarding flow | Expand Onboarding.tsx to handle round state from backend | No |
| Main-path dashboard prioritization | Modify Dashboard.tsx ordering and CTA | No |
| Payment result polling | Replace URL-param trust with backend status query | No |

### Potential New Dependencies

| Package | Purpose | When to Add |
|---------|---------|-------------|
| `@nestjs/event-emitter` | In-process event bus for domain events | Phase where notifications/leaderboard are built |
| `eventemitter2` | Underlying event library (peer dep of above) | Same phase |

---

## Alternatives Considered

| Current Choice | Alternative | When to Switch |
|----------------|-------------|----------------|
| NestJS monolith | Microservices | Only if one module becomes operationally dominant at 10k+ users |
| Prisma ORM | Drizzle ORM | If Prisma query performance becomes a bottleneck — unlikely at current scale |
| zustand | React Query (TanStack Query) | If server-state caching/invalidation becomes complex — could add alongside zustand |
| axios | Native fetch | Not worth the migration — axios interceptors handle token refresh well |
| Tailwind CSS 3.x | Tailwind CSS 4.x | Upgrade when v4 ecosystem stabilizes and plugins catch up |
| Redis for rate limiting | In-memory rate limiting | Only for single-instance dev — keep Redis for production |
| Groq as AI provider | Claude / GPT-4o direct | Swap provider config when needed — AI logic is isolated in service layer |

---

## What NOT to Use for v1.1

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Next.js rewrite | DevPath is a React SPA + NestJS API — rewriting to Next.js breaks the established architecture | Keep Vite + NestJS |
| Socket.io / WebSockets | Real-time is unnecessary for v1.1 notifications — polling or refetch is sufficient | Simple polling or re-fetch after mutations |
| External message broker (RabbitMQ, Kafka) | Overkill for app-internal events at current scale | NestJS EventEmitter2 in-process |
| GraphQL | REST API is already built and working — adding GraphQL adds complexity without clear benefit | Keep REST |
| Separate microservices | Every new module (notifications, leaderboard) should stay in the monolith | NestJS modules within one app |
| Client-side payment secret handling | Security risk — payment config must stay backend-managed | Backend environment/config service |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| NestJS 11.x | Node.js 18+ | LTS support |
| Prisma 7.x | PostgreSQL 14-16 | Full compatibility with adapter-pg |
| React 18.x | Vite 6.x | Stable combination |
| react-router-dom 7.x | React 18.x | Works with client-side SPA routing |
| Tailwind CSS 3.x | PostCSS 8.x | Standard setup with autoprefixer |
| zustand 5.x | React 18.x | No peer dependency issues |
| Jest 30.x + ts-jest 29.x | TypeScript 5.7.x | Backend testing stack |

---

## Sources

### Codebase Sources
- `backend/package.json` — actual backend dependencies
- `frontend/package.json` — actual frontend dependencies
- `docker-compose.yml` — infrastructure configuration
- `backend/prisma/schema.prisma` — data model
- `.planning/research/ARCHITECTURE.md` — v1.1 architecture research
- `.planning/PROJECT.md` — milestone scope and constraints

### Official Documentation
- NestJS docs (docs.nestjs.com) — modules, guards, events
- Prisma docs (prisma.io) — PostgreSQL adapter, transactions, JSON fields
- Vite docs (vite.dev) — React plugin, HMR, build
- React Router docs (reactrouter.com) — v7 routing patterns
- Tailwind CSS docs (tailwindcss.com) — v3 utilities and plugins

---
*Stack research for: DevPath Learning v1.1 — Post-MVP Stabilization & Personalization*
*Researched: 2026-03-23 (corrected from stale SOHA content)*
