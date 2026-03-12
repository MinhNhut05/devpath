# PROJECT - DevPath Learning

> AI-assisted personalized learning path for IT learners in Vietnam.

---

## Vision

DevPath helps Vietnamese IT learners find their personalized learning path using AI to:
- Assess current skills and determine starting point
- Recommend learning paths based on goals and progress
- Track readiness to advance to complex topics
- Provide AI tutoring during learning

## Team

| Info | Detail |
|------|--------|
| Developer | Le Minh Nhut |
| Student ID | 225523 |
| Class | DH22TIN08 |
| Level | Junior developer (learning by building) |

## Target Users

- Vietnamese IT students and beginners
- People learning Frontend, Backend, or Fullstack
- Expected: 50-200 users initially

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI Library |
| Vite | 5.x | Build Tool |
| TypeScript | 5.x | Type Safety |
| Tailwind CSS | 3.x | Styling |
| Shadcn/ui | latest | Component Library (Radix UI based) |
| Zustand | 4.x | State Management |
| React Query | 5.x | Server State & Caching |
| React Router | 6.x | Routing |
| React Hook Form | 7.x | Form Management |
| Zod | 3.x | Schema Validation |
| Framer Motion | 11.x | Animations |
| react-i18next | 14.x | Internationalization (VI/EN) |
| Monaco Editor | latest | Code challenge editor |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x LTS | Runtime |
| NestJS | 10.x | Framework |
| TypeScript | 5.x | Type Safety |
| Prisma | 5.x | ORM |
| PostgreSQL | 16.x | Database |
| Redis | 7.x | Caching & Rate Limiting |
| Passport | 0.7.x | Authentication |
| Winston | 3.x | Logging |
| Mailgun | - | Email OTP delivery |

### AI/ML
| Technology | Purpose |
|------------|---------|
| Anthropic-compatible API | LLM Provider via manager.devteamos.me |
| Models (Free) | gemini-2.5-flash, gemini-2.5-flash-thinking |
| Models (Pro) | claude-sonnet-4-5, gemini-3-pro-low, gemini-3-pro-high |
| Models (Ultra) | claude-opus-4-6-thinking + all Pro models |

> No LangChain.js. Direct API calls using Anthropic SDK or HTTP client.

### Payment
| Provider | Type |
|----------|------|
| MoMo | Mobile payment QR + wallet |
| VNPay | Bank transfer + QR code |

### Infrastructure
| Component | Service | Purpose |
|-----------|---------|---------|
| Frontend Hosting | Vercel | Static site hosting |
| Backend Hosting | DigitalOcean VPS | API Server |
| DNS | Cloudflare | DNS + DDoS Protection |
| Reverse Proxy | Nginx Proxy Manager | SSL + proxy (separate VPS) |
| Email | Mailgun | OTP delivery (free 100/day) |
| Monitoring | Datadog Pro | Server monitoring (free 2 years) |
| Error Tracking | Sentry | Application error tracking |
| CI/CD | GitHub Actions | Automated deployment |
| Container | Docker | Containerization (dev + prod) |

### Dev Tools
| Tool | Purpose |
|------|---------|
| pnpm | Package manager (monorepo workspace) |
| Docker Compose | Local development services |
| ESLint + Prettier | Linting + formatting |
| Jest | Unit testing |
| Postman | API testing |

## Domains & Resources

| Resource | Detail | Expiry | Status |
|----------|--------|--------|--------|
| DigitalOcean | $200 credits | Jan 2027 | Active |
| Microsoft Azure | $100 credits | Apr 2026 | Active |
| Datadog Pro | 10 servers monitoring | Jan 2028 | Active |
| devpathos.tech | Frontend domain | Jan 2027 | Registered |
| devteamos.me | Other projects | Jan 2027 | Registered |
| SSL Certificate | PositiveSSL | Jan 2027 | Not activated |

### Domain Strategy
- **devpathos.tech** - Frontend (main domain)
- **api.devpathos.tech** - Backend API
- **devteamos.me** - Other projects / AI manager

## Design System

- **UI UX Pro Max Skill** - AI-powered design intelligence toolkit
- **Shadcn/ui** - Component library (Radix UI + Tailwind CSS)
- **Dark mode** from day 1 (Tailwind `dark:` prefix)
- **Mobile-first** responsive design
- **i18n**: Vietnamese first, English later (react-i18next)
