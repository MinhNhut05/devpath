# Tech Stack & Versions

---

## Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI Library |
| Vite | 5.x | Build Tool |
| TypeScript | 5.x | Type Safety |
| Zustand | 4.x | State Management |
| React Query (TanStack) | 5.x | Server State & Caching |
| react-i18next | 14.x | Internationalization (VI/EN) |
| Tailwind CSS | 3.x | Styling |
| Shadcn/ui | latest | Component Library |
| Framer Motion | 11.x | Animations |
| React Router | 6.x | Routing |
| React Hook Form | 7.x | Form Management |
| Zod | 3.x | Schema Validation |
| Monaco Editor | latest | Code challenge editor (TBD) |

### Design System
- **UI UX Pro Max Skill** - AI-powered design intelligence toolkit
- Install: `npm install -g uipro-cli && uipro init --ai claude --persist`
- Output: `design-system/MASTER.md` (color palette, typography, layout patterns)

---

## Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x LTS | Runtime |
| NestJS | 10.x | Framework |
| TypeScript | 5.x | Type Safety |
| Prisma | 5.x | ORM |
| PostgreSQL | 16.x | Database |
| Redis | 7.x | Caching & Rate Limiting |
| Passport | 0.7.x | Authentication |
| JWT | - | Token-based Auth |
| Winston | 3.x | Logging |
| Sentry | - | Error Tracking |
| Mailgun | - | Email OTP delivery |

---

## AI/ML

| Technology | Purpose |
|------------|---------|
| Anthropic-compatible API | LLM Provider via manager.devteamos.me |
| Models (Free) | gemini-2.5-flash, gemini-2.5-flash-thinking |
| Models (Pro) | claude-sonnet-4-5, gemini-3-pro-low, gemini-3-pro-high |
| Models (Ultra) | claude-opus-4-6-thinking + all Pro models |

> **Note:** Khong dung LangChain.js. Goi truc tiep Anthropic-compatible API bang HTTP client hoac Anthropic SDK.

---

## Payment

| Technology | Purpose |
|------------|---------|
| MoMo Payment Gateway | Mobile payment |
| VNPay | Bank transfer + QR code |

---

## Infrastructure

| Component | Service | Purpose |
|-----------|---------|---------|
| Frontend Hosting | Vercel | Static site hosting |
| Backend Hosting | DigitalOcean VPS | API Server ($200 credits, expires Jan 2027) |
| Database | Self-host PostgreSQL on VPS | Primary database |
| Cache | Self-host Redis on VPS | Caching & rate limiting |
| DNS | Cloudflare | DNS + DDoS Protection |
| Reverse Proxy | Nginx Proxy Manager | SSL + proxy (separate VPS) |
| Email | Mailgun | OTP delivery (free 100/day) |
| Monitoring | Datadog Pro | Server monitoring (free 2 years) |
| Error Tracking | Sentry | Application error tracking |
| CI/CD | GitHub Actions | Automated deployment |
| Container | Docker | Containerization (dev + prod) |

---

## Development Tools

| Tool | Purpose |
|------|---------|
| pnpm | Package manager (monorepo workspace) |
| Docker Compose | Local development services |
| ESLint | Code linting |
| Prettier | Code formatting |
| Jest | Unit testing |
| Postman | API testing |
