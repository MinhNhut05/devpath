# TRACKPAD - DevPath Learning Journal

> Session-based learning journal. Structured info moved to `.context/` folder.
>
> - Decisions → `.context/DECISIONS.md`
> - Resources & domains → `.context/PROJECT.md`
> - Roadmap & phases → `.context/ROADMAP.md`
> - Lessons learned → `.context/research/PITFALLS.md`

---

## Sessions

### 2026-03-02
**Context Restructuring**

- Restructured all project context into `.context/` folder
- Created 20+ files: STATE, PROJECT, REQUIREMENTS, ARCHITECTURE, COMMANDS, WORKFLOW, ROADMAP, DECISIONS, LEARNING, ONBOARDING
- Moved `context/` → `.context/specs/`, `branches/` → `.context/branches/`
- Added new folders: research/, codebase/, todos/, debug/
- Rewrote CLAUDE.md from ~178 lines → ~65 lines
- Created branch `_TEMPLATE/` with CONTEXT.md, TODO.md, PROGRESS.md

**Learned**: AI-friendly project context structure with unique requirement IDs for traceability.

---

### 2026-02-15
**Planning & Refactor Docs**

- Discussed & decided full project scope (7 areas: scope, infra, auth, payment, frontend, content, AI)
- Split CONTEXT.md into `context/` folder with 12 topic files
- Updated CLAUDE.md to reference context/ files

**Learned**: Breaking large specs into topic files makes it easier for AI agents to find relevant info.

---

### 2026-01-28
**Claude Skills & Custom Skills**

- Learned Claude Skills format (SKILL.md with YAML frontmatter)
- Created 8 custom skills: nest-module, nest-review, nest-test, prisma-model, react-component, commit, debug, explain
- Symlink strategy: `.agents/skills/` (source) → `.claude/skills/` (symlink)

**Learned**: Skills = Markdown instructions for AI. `disable-model-invocation: true` = manual-only. Shared across Claude CLI and AMP CLI via symlink.

---

### 2026-01-27
**Project Setup + Docker**

- Learned monorepo structure (pnpm workspace), Prisma schema (15+ models), Docker setup
- Created `.env` from `.env.example`
- Changed ports: PostgreSQL 5432→5434, Redis 6379→6380 (avoid conflicts)
- Docker tested: postgres and redis healthy

**Learned**: Always check for port conflicts with other local projects.

---

### 2026-01-26
**Domain Claims**

- Claimed devpathos.tech (free 1 year, .TECH Domains)
- Claimed Microsoft Azure for Students $100 credits

---

### 2026-01-25
**GitHub Student Pack**

- Registered GitHub Student Developer Pack
- Claimed: DigitalOcean $200, Datadog Pro, devteamos.me domain, PositiveSSL certificate

**Learned**: Need .edu email + valid student ID. Pre-auth ~$5 for DigitalOcean (refunded 3-7 days).
