# WORKFLOW

> Branch strategy, commit conventions, multi-session workflow, and merge flow.

---

## Branch Strategy

### Naming
- Feature branches: `feat/<feature-name>` (e.g., `feat/auth-be`)
- Chore branches: `chore/<task-name>` (e.g., `chore/deploy`)
- Folders in `.context/branches/` use dash: `01-feat-auth-be`

### Execution Order

Sequential: finish branch N → merge to main → start branch N+1
(Independent branches CAN run in parallel via Agent Teams)

#### Phase 1: Backend Foundation (01-08)
| # | Branch | Scope |
|---|--------|-------|
| 01 | `feat/auth-be` | OTP + OAuth + JWT + Guards |
| 02 | `feat/onboarding-be` | Onboarding flow + AI recommendation |
| 03 | `feat/learning-paths-be` | Learning Paths + Tracks + Lessons |
| 04 | `feat/quiz-be` | Quiz + Essay grading + Code challenge |
| 05 | `feat/progress-be` | User progress + sessions + activity |
| 06 | `feat/ai-chat-be` | AI chatbot + context injection + quota |
| 07 | `feat/payment-be` | MoMo + VNPay + subscription + tiers |
| 08 | `feat/admin-be` | Admin CRUD + analytics + bulk generate |

#### Phase 2: Frontend (09-15)
| # | Branch | Scope |
|---|--------|-------|
| 09 | `feat/init-fe` | Vite + React + Tailwind + Shadcn + routing |
| 10 | `feat/auth-fe` | Login page + auth store + token handling |
| 11 | `feat/onboarding-fe` | Onboarding UI flow |
| 12 | `feat/dashboard-fe` | Dashboard + progress + activity graph |
| 13 | `feat/learning-fe` | Lesson page + AI chat + quiz UI |
| 14 | `feat/payment-fe` | Plans page + payment flow |
| 15 | `feat/admin-fe` | Admin panel UI |

#### Phase 3: Polish & Deploy (16-17)
| # | Branch | Scope |
|---|--------|-------|
| 16 | `chore/deploy` | VPS + Docker prod + CI/CD |
| 17 | `feat/polish` | Error handling + responsive + i18n |

---

## Multi-Session Workflow (Agent Teams)

### Architecture

```
Main Session (You)
│
├── Agent Teams (parallel work)
│   ├── Team Lead ─── decomposes branch tasks
│   ├── Implementer(s) ─── code features in parallel
│   └── Reviewer ─── review code quality
│
├── Custom Sub-Agents (.claude/agents/)
│   ├── devpath-reviewer ─── NestJS + Prisma code review
│   ├── devpath-tester ─── write unit tests
│   ├── devpath-doc-writer ─── update docs + CODEBASE_MAP
│   └── devpath-arch-checker ─── verify architecture + imports
│
├── Hooks (automatic)
│   ├── PreToolUse ─── anti-hallucination check before write
│   ├── PostToolUse ─── TypeScript type check after edit
│   ├── Stop ─── remind to update docs
│   └── SubagentStop ─── verify sub-agent output
│
└── Branch Context (.context/branches/XX-xxx/)
    ├── CONTEXT.md (scope + rules)
    ├── TODO.md (checklist)
    ├── VERIFICATION.md (quality checklist)
    ├── PROGRESS.md (session logs)
    └── HANDOFF.md (result → report back)
```

### How Agent Teams Replace Git Worktree

| Before (Git Worktree) | After (Agent Teams) |
|----------------------|-------------------|
| `worktree-create.sh` → manual terminal tabs | Team Lead auto-decomposes tasks |
| Manual sync between worktrees | Teammates share same codebase |
| `worktree-sync.sh` → copy files back | Real-time file access, no sync needed |
| `worktree-clean.sh` → merge + cleanup | Direct branch merge, no worktree cleanup |
| Multiple Claude CLI sessions | Single session with parallel agents |

### Session Flow

```
Session starts:
  1. Read CLAUDE.md (agent rules + sub-agent reference)
  2. Read .context/STATE.md (current project state)
  3. Read .context/branches/XX/CONTEXT.md (scope)
  4. Read .context/branches/XX/TODO.md (checklist)
  5. Read .context/CODEBASE_MAP.md (anti-hallucination)

Session works:
  6. Implement tasks from TODO.md
  7. Hooks auto-check: imports exist (PreToolUse), types pass (PostToolUse)
  8. Use devpath-tester agent to write tests
  9. Use devpath-reviewer agent for code review
  10. Use devpath-arch-checker to verify architecture

Session finishes:
  11. Run VERIFICATION.md checklist
  12. Use devpath-doc-writer to update HANDOFF + PROGRESS
  13. Set "Ready for Merge: YES" in HANDOFF.md
  14. Stop hook reminds to update docs if missed
```

### Parallel vs Sequential

| Parallel OK | Must be Sequential |
|------------|-------------------|
| Independent features (e.g., payment-be + admin-be) | Features with dependencies (e.g., auth-be BEFORE onboarding-be) |
| Frontend + Backend of different features | Backend BEFORE its frontend counterpart |
| Bug fixes on different modules | Schema changes that affect multiple modules |

### Anti-Hallucination Strategy

1. **CODEBASE_MAP.md** - Auto-generated list of all existing files
2. **PreToolUse hook** - Auto-checks imports exist before writing code
3. **CONTEXT.md rules** - "ONLY import modules that exist in CODEBASE_MAP"
4. **VERIFICATION.md** - Pre-merge checklist includes "all imports exist"
5. **devpath-arch-checker** - Full architecture verification on demand
6. **SubagentStop hook** - Verifies sub-agent output references real files

---

## Branch Context Files

Each branch has a folder in `.context/branches/XX-feat-xxx/`:
- **CONTEXT.md** - Scope, requirements, anti-hallucination rules, dependencies
- **TODO.md** - Checklist of tasks
- **PROGRESS.md** - Session-based progress reports
- **VERIFICATION.md** - Quality checklist (run before done)
- **HANDOFF.md** - Summary for main session (fill when done)

Template: `.context/branches/_TEMPLATE/`

---

## Commit Convention

Current style (mixed conventional + free-form):

```
feat: add OTP verification endpoint
feat(auth): implement Google OAuth callback
chore: update docs, Dockerfiles, and gitignore for monorepo setup
fix: correct Redis connection port
docs: refactor CONTEXT.md into context/ folder
```

## Merge Flow

```
1. Session completes work on feature branch
2. devpath-doc-writer updates HANDOFF.md, sets "Ready for Merge: YES"
3. devpath-arch-checker verifies architecture + imports
4. devpath-reviewer reviews code quality
5. Main session reviews HANDOFF.md
6. git merge feature-branch into main
7. Main session updates STATE.md
8. Ready for next branch
```
