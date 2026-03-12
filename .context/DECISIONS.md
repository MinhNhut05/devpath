# DECISIONS

> Append-only decision log. Never edit or delete old entries.

---

| Date | Area | Decision | Rationale |
|------|------|----------|-----------|
| 2026-02-15 | Scope | Keep all features, 50-200 users, real product | MVP with full feature set |
| 2026-02-15 | Infrastructure | DigitalOcean VPS + Docker + Cloudflare + Nginx Proxy Manager | Free credits ($200), Singapore region close to VN |
| 2026-02-15 | Auth | OTP (Mailgun) + Google OAuth + GitHub OAuth | Passwordless = better UX, OAuth for convenience |
| 2026-02-15 | Email | Mailgun (free 100/day) | Sufficient for 50-200 users |
| 2026-02-15 | Payment | MoMo + VNPay, monthly subscription | Most popular payment methods in Vietnam |
| 2026-02-15 | Tiers | Free / Pro / Ultra (token-based) | Gradual monetization, AI model access as differentiator |
| 2026-02-15 | UI | Shadcn/ui + Tailwind + UI UX Pro Max Skill | Modern, customizable, AI-assisted design |
| 2026-02-15 | Dark Mode | Yes, from day 1 | Developer audience expects dark mode |
| 2026-02-15 | Responsive | Mobile-first | Students often use phones |
| 2026-02-15 | Quiz | Single choice + Essay (AI graded) + Code challenge | Comprehensive assessment, AI for essay grading |
| 2026-02-15 | Content | AI generate + manual review, Vietnamese first | Faster content creation, target audience is VN |
| 2026-02-15 | Deploy | Docker on DigitalOcean VPS | Free credits, full control |
| 2026-02-15 | Domain | devpathos.tech (FE) + api.devpathos.tech (BE) | Clean separation |
| 2026-02-15 | AI Provider | Anthropic-compatible API via manager.devteamos.me | Already available, no extra cost |
| 2026-02-15 | AI SDK | No LangChain.js, direct Anthropic SDK | Simpler, less abstraction |
| 2026-01-27 | Ports | PostgreSQL=5434, Redis=6380 | Avoid conflict with other local projects |
| 2026-01-28 | Skills | Custom Claude Skills (.agents/skills/) | Automate repetitive tasks, learning-friendly |
| 2026-03-02 | Docs | Restructure context to .context/ folder | Better organization, AI-friendly, traceable requirements |
