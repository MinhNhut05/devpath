# DevPath - Project Overview

> **Version:** 2.0.0
> **Last Updated:** 2026-02-15
> **Domain:** devpathos.tech

---

## Vision

DevPath la he thong hoc tap ca nhan hoa (personalized learning platform) danh cho nguoi hoc IT tai Viet Nam. He thong ket hop AI-assisted analysis voi rule-based validation de giup nguoi hoc xac dinh diem bat dau, lo trinh hoc tap, va muc do san sang tien len.

---

## Target Users

- Sinh vien, cong dong IT moi bat dau
- Nguoi Viet muon hoc Frontend, Backend, hoac Fullstack
- Beginners khong co background HOAC nguoi da co kien thuc mot phan
- Du kien 50-200 users ban dau

---

## MVP Scope

### Fully Implemented (MVP)
- Frontend ReactJS Learning Path (~70 bai)
- Backend NodeJS Learning Path (~70 bai)
- Fullstack (React + NodeJS) Combined Path (~70 bai)
- Authentication: OTP Email + Google OAuth + GitHub OAuth
- AI Chatbot: Context-aware, goi API tu manager.devteamos.me
- Quiz System: Trac nghiem + Tu luan (AI cham) + Code challenge
- Payment: MoMo + VNPay (Free / Pro / Ultra tiers)
- Admin Panel: CRUD content
- i18n: Tieng Viet truoc, tieng Anh sau
- Dark mode + Mobile-first responsive

### Visible but Not Implemented
- Python/AI paths (Coming Soon)

---

## Key Decisions Summary

| Area | Decision |
|------|----------|
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS + Shadcn/ui |
| **Design System** | UI UX Pro Max Skill (AI-generated) |
| **Backend** | NestJS + Prisma ORM + PostgreSQL 16 + Redis 7 |
| **AI Provider** | Anthropic-compatible API via manager.devteamos.me |
| **Auth** | OTP (Mailgun) + Google OAuth + GitHub OAuth + JWT |
| **Database** | Self-host PostgreSQL on DigitalOcean VPS |
| **Payment** | MoMo + VNPay, monthly subscription |
| **Tiers** | Free (low models) / Pro (high models, limited) / Ultra (high models, relaxed) |
| **Deploy** | Docker on DigitalOcean VPS |
| **Domain** | devpathos.tech (FE) + api.devpathos.tech (BE) |
| **DNS/Proxy** | Cloudflare + Nginx Proxy Manager |
| **Content** | AI generate + manual review, ~200+ bai |
| **Dark mode** | Yes, from day 1 |
| **Responsive** | Mobile-first |
| **i18n** | Vietnamese first, English later |

---

## Documentation Index

| File | Description |
|------|-------------|
| [01-tech-stack.md](./01-tech-stack.md) | Tech stack & versions |
| [02-infrastructure.md](./02-infrastructure.md) | VPS, Docker, domain, DNS, deploy |
| [03-authentication.md](./03-authentication.md) | OTP, OAuth, JWT, security |
| [04-database.md](./04-database.md) | Prisma schema, ERD |
| [05-api-design.md](./05-api-design.md) | API endpoints, response format |
| [06-ai-integration.md](./06-ai-integration.md) | AI chatbot, context injection, tiers |
| [07-payment.md](./07-payment.md) | Payment integration, subscription tiers |
| [08-frontend.md](./08-frontend.md) | React, Shadcn/ui, Tailwind, UX |
| [09-content.md](./09-content.md) | Learning paths, lessons, quiz types |
| [10-deployment.md](./10-deployment.md) | CI/CD, Docker production, monitoring |
| [11-security.md](./11-security.md) | Security checklist & measures |

---

## Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (Vite + NestJS + Prisma)
- [ ] Database schema & migrations
- [ ] Authentication (OTP + OAuth + JWT)
- [ ] Basic UI components (Shadcn/ui + Tailwind)
- [ ] Protected routes

### Phase 2: Core Features (Week 3-4)
- [ ] Onboarding flow
- [ ] Learning path display
- [ ] Lesson display with AI chat
- [ ] Quiz system (single choice + essay + code)
- [ ] Progress tracking

### Phase 3: AI & Payment (Week 5-6)
- [ ] AI chatbot integration
- [ ] Context injection
- [ ] Payment integration (MoMo + VNPay)
- [ ] Tier management (Free/Pro/Ultra)

### Phase 4: Admin & Content (Week 7-8)
- [ ] Admin panel (CRUD paths/tracks/lessons/quizzes)
- [ ] AI bulk content generation tool
- [ ] Content review & publishing

### Phase 5: Polish (Week 9)
- [ ] Dark mode
- [ ] i18n (Vietnamese)
- [ ] Error handling & loading states
- [ ] Mobile responsive refinement
- [ ] Activity graph

### Phase 6: Deployment (Week 10)
- [ ] DigitalOcean VPS setup
- [ ] Docker production compose
- [ ] Cloudflare DNS + Nginx Proxy Manager
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Monitoring (Sentry/Datadog)
