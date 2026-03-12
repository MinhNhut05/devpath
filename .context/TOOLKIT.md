# TOOLKIT

> Tất cả agents, skills, commands, hooks đã cài đặt cho DevPath project.
> Dùng file này để tra cứu nhanh khi cần.

---

## Quick Reference — Dùng gì khi nào?

| Tình huống | Dùng | Loại |
|-----------|------|------|
| Code feature mới | `/feature-development` hoặc `/implement` | Command |
| Review code | `@devpath-reviewer` hoặc `/full-review` | Agent / Command |
| Viết unit tests | `@devpath-tester` hoặc `/test-generate` | Agent / Command |
| Debug lỗi | `/smart-debug` hoặc `/error-analysis` | Command |
| Debug test failures | `@debugger` | Agent |
| Refactor code | `/refactor-clean` | Command |
| TDD workflow | `/tdd-cycle` (red→green→refactor) | Command |
| Làm song song (team) | `/team-feature` hoặc `/team-spawn` | Command |
| Lưu context cuối session | `/context-save` | Command |
| Khôi phục context đầu session | `/context-restore` | Command |
| Check architecture | `@devpath-arch-checker` | Agent |
| Update docs (HANDOFF, PROGRESS) | `@devpath-doc-writer` | Agent |
| Database/Prisma design | `@database-architect` | Agent |
| Security audit | `@security-auditor` | Agent |
| Analyze tech debt | `/tech-debt` | Command |
| Trước khi merge branch | `@devpath-reviewer` → `@devpath-arch-checker` → `/full-review` | Workflow |
| Payment integration (MoMo/VNPay) | `@payment-integration` | Agent |

---

## Cách dùng từng loại

### Agents — Gọi bằng `@agent-name`

Agents là AI specialists. Gọi bằng cú pháp `@tên-agent` + mô tả task.

```
@devpath-reviewer Review auth.service.ts
@devpath-tester Viết tests cho auth.controller.ts
@database-architect Review Prisma schema cho User model
```

### Commands — Gọi bằng `/command-name`

Commands là slash commands. Gọi bằng `/tên` + arguments (nếu có).

```
/full-review
/test-generate backend/src/modules/auth/auth.service.ts
/tdd-cycle
/smart-debug "Cannot find module '@prisma/client'"
/team-feature "Implement Google OAuth + GitHub OAuth song song"
```

### Skills — Knowledge tự động

Skills là knowledge packs — Claude tự động dùng khi cần. Bạn không cần gọi trực tiếp, chúng bổ sung context cho agents và commands.

### Hooks — Chạy tự động

Hooks chạy tự động ở background, bạn không cần gọi.

---

## Inventory đầy đủ

### Custom Agents (DevPath-specific)

> Đặt trong `.claude/agents/`, customize riêng cho DevPath project.

| Agent | Model | Mô tả |
|-------|-------|-------|
| `devpath-reviewer` | opus | Review NestJS patterns, security, Prisma usage |
| `devpath-tester` | sonnet | Viết unit tests cho NestJS services/controllers |
| `devpath-doc-writer` | haiku | Update HANDOFF, PROGRESS, CODEBASE_MAP |
| `devpath-arch-checker` | opus | Verify imports, architecture, anti-hallucination |

### Hooks (auto-configured)

> Đặt trong `.claude/settings.json` (project-level). Chạy tự động.

| Event | Type | Mô tả |
|-------|------|-------|
| PreToolUse (Write/Edit) | agent | Check imports tồn tại trước khi viết code |
| PostToolUse (Write/Edit) | command | Auto-run `tsc --noEmit` sau khi edit |
| Stop | prompt | Nhắc update PROGRESS, VERIFICATION, HANDOFF |
| SubagentStop | prompt | Verify sub-agent output quality |

---

### Plugin 1: `comprehensive-review`

> Review code toàn diện — quality, security, architecture.

| Loại | Tên | Model | Mô tả |
|------|-----|-------|-------|
| Agent | `architect-review` | opus | Review architecture patterns, scalability, DDD |
| Agent | `code-reviewer` | opus | AI-powered code analysis, security, performance |
| Agent | `security-auditor` | opus | DevSecOps, OWASP, compliance (GDPR/SOC2) |
| Command | `/full-review` | — | Review toàn bộ codebase |
| Command | `/pr-enhance` | — | Nâng cấp PR description + review |

### Plugin 2: `javascript-typescript`

> JS/TS chuyên sâu — advanced types, async patterns, Node.js.

| Loại | Tên | Model | Mô tả |
|------|-----|-------|-------|
| Agent | `javascript-pro` | inherit | ES6+, async patterns, Node.js APIs |
| Agent | `typescript-pro` | opus | Advanced types, generics, strict type safety |
| Skill | `javascript-testing-patterns` | — | JS testing patterns |
| Skill | `modern-javascript-patterns` | — | Modern JS patterns (ES2024+) |
| Skill | `nodejs-backend-patterns` | — | Node.js backend patterns |
| Skill | `typescript-advanced-types` | — | TS advanced type tricks |
| Command | `/typescript-scaffold` | — | Scaffold TypeScript project |

### Plugin 3: `backend-development`

> Backend architecture — API design, microservices, TDD.

| Loại | Tên | Model | Mô tả |
|------|-----|-------|-------|
| Agent | `backend-architect` | inherit | Scalable API, microservices, distributed systems |
| Agent | `event-sourcing-architect` | inherit | Event sourcing, CQRS patterns |
| Agent | `graphql-architect` | opus | GraphQL federation, caching, real-time |
| Agent | `performance-engineer` | sonnet | Profile + optimize performance |
| Agent | `security-auditor` | sonnet | OWASP Top 10, auth flaws review |
| Agent | `tdd-orchestrator` | opus | TDD red-green-refactor orchestration |
| Agent | `temporal-python-pro` | inherit | Temporal workflow (Python) |
| Agent | `test-automator` | sonnet | Unit, integration, E2E test creation |
| Skill | `api-design-principles` | — | API design best practices |
| Skill | `architecture-patterns` | — | Architecture patterns |
| Skill | `cqrs-implementation` | — | CQRS pattern implementation |
| Skill | `event-store-design` | — | Event store design |
| Skill | `microservices-patterns` | — | Microservices patterns |
| Skill | `projection-patterns` | — | Projection patterns |
| Skill | `saga-orchestration` | — | Saga orchestration pattern |
| Skill | `temporal-python-testing` | — | Temporal testing |
| Skill | `workflow-orchestration-patterns` | — | Workflow patterns |
| Command | `/feature-development` | — | Scaffold full feature (controller + service + DTOs + tests) |

### Plugin 4: `conductor`

> Task orchestration — quản lý tracks, implement tasks.

| Loại | Tên | Model | Mô tả |
|------|-----|-------|-------|
| Agent | `conductor-validator` | opus | Validate project artifacts |
| Skill | `context-driven-development` | — | Context-driven development |
| Skill | `track-management` | — | Track management |
| Skill | `workflow-patterns` | — | Workflow patterns |
| Command | `/implement` | — | Implement specific task |
| Command | `/manage` | — | Manage project tracks |
| Command | `/new-track` | — | Tạo track mới |
| Command | `/revert` | — | Revert changes safely |
| Command | `/setup` | — | Setup conductor cho project |
| Command | `/status` | — | View project status |

### Plugin 5: `debugging-toolkit`

> Debug errors + optimize DX.

| Loại | Tên | Model | Mô tả |
|------|-----|-------|-------|
| Agent | `debugger` | sonnet | Debug errors, test failures, unexpected behavior |
| Agent | `dx-optimizer` | sonnet | Improve tooling, setup, workflows |
| Command | `/smart-debug` | — | Smart debugging workflow |

### Plugin 6: `git-pr-workflows`

> Git workflow + PR management.

| Loại | Tên | Model | Mô tả |
|------|-----|-------|-------|
| Agent | `code-reviewer` | opus | PR code review chuyên sâu |
| Command | `/git-workflow` | — | Git workflow guide |
| Command | `/onboard` | — | Onboard new contributor vào project |
| Command | `/pr-enhance` | — | Enhance PR description + review |

### Plugin 7: `agent-teams`

> Multi-agent parallel work — team lead, implementers, reviewers.

| Loại | Tên | Model | Mô tả |
|------|-----|-------|-------|
| Agent | `team-lead` | opus | Decompose tasks, manage team, file ownership |
| Agent | `team-implementer` | opus | Build features song song, strict file boundaries |
| Agent | `team-reviewer` | opus | Multi-dimension review (security, perf, arch, testing) |
| Agent | `team-debugger` | opus | Hypothesis-driven debugging song song |
| Skill | `multi-reviewer-patterns` | — | Multi-reviewer strategies |
| Skill | `parallel-debugging` | — | Parallel debugging patterns |
| Skill | `parallel-feature-development` | — | Parallel feature dev |
| Skill | `task-coordination-strategies` | — | Task coordination |
| Skill | `team-communication-protocols` | — | Team communication |
| Skill | `team-composition-patterns` | — | Team composition |
| Command | `/team-spawn` | — | Tạo team mới |
| Command | `/team-feature` | — | Implement feature bằng team (song song) |
| Command | `/team-review` | — | Review code bằng team (multi-dimension) |
| Command | `/team-debug` | — | Debug bằng team (nhiều hypothesis) |
| Command | `/team-delegate` | — | Delegate task cho teammate cụ thể |
| Command | `/team-status` | — | Xem trạng thái team hiện tại |
| Command | `/team-shutdown` | — | Shutdown team khi xong |

### Plugin 8: `unit-testing`

> Unit test generation + debug test failures.

| Loại | Tên | Model | Mô tả |
|------|-----|-------|-------|
| Agent | `test-automator` | sonnet | AI-powered test automation, self-healing tests |
| Agent | `debugger` | sonnet | Debug test failures |
| Command | `/test-generate` | — | Generate tests cho file/module cụ thể |

### Plugin 9: `code-refactoring`

> Refactor + modernize + tech debt.

| Loại | Tên | Model | Mô tả |
|------|-----|-------|-------|
| Agent | `code-reviewer` | opus | Review trước khi refactor |
| Agent | `legacy-modernizer` | sonnet | Modernize legacy code, migrate frameworks |
| Command | `/context-restore` | — | Restore context sau refactor |
| Command | `/refactor-clean` | — | Refactor + cleanup code |
| Command | `/tech-debt` | — | Analyze technical debt |

### Plugin 10: `tdd-workflows`

> Test-Driven Development — red→green→refactor cycle.

| Loại | Tên | Model | Mô tả |
|------|-----|-------|-------|
| Agent | `code-reviewer` | opus | Review code trong TDD cycle |
| Agent | `tdd-orchestrator` | opus | Orchestrate full TDD workflow |
| Command | `/tdd-cycle` | — | Full TDD cycle (red→green→refactor) |
| Command | `/tdd-red` | — | Step 1: Viết failing test trước |
| Command | `/tdd-green` | — | Step 2: Viết minimum code để pass |
| Command | `/tdd-refactor` | — | Step 3: Refactor giữ tests pass |

### Plugin 11: `context-management`

> Lưu/khôi phục context giữa các sessions.

| Loại | Tên | Model | Mô tả |
|------|-----|-------|-------|
| Agent | `context-manager` | inherit | Dynamic context management, knowledge graphs |
| Command | `/context-save` | — | Lưu context hiện tại vào file |
| Command | `/context-restore` | — | Khôi phục context từ file đã lưu |

### Plugin 12: `error-debugging`

> Error analysis + trace + multi-agent review.

| Loại | Tên | Model | Mô tả |
|------|-----|-------|-------|
| Agent | `debugger` | sonnet | Debug specialist |
| Agent | `error-detective` | sonnet | Search logs, correlate errors, find root cause |
| Command | `/error-analysis` | — | Analyze error root cause chuyên sâu |
| Command | `/error-trace` | — | Trace error chain across systems |
| Command | `/multi-agent-review` | — | Review lỗi bằng nhiều agents cùng lúc |

### Plugin 13: `database-design`

> Database architecture + SQL optimization.

| Loại | Tên | Model | Mô tả |
|------|-----|-------|-------|
| Agent | `database-architect` | opus | Schema design, technology selection, migration |
| Agent | `sql-pro` | inherit | SQL optimization, OLTP/OLAP, query tuning |
| Skill | `postgresql` | — | PostgreSQL-specific patterns |

### Plugin 14: `payment-processing`

> Payment gateway integration + PCI compliance.

| Loại | Tên | Model | Mô tả |
|------|-----|-------|-------|
| Agent | `payment-integration` | sonnet | Stripe, PayPal, checkout, subscriptions, webhooks |
| Skill | `billing-automation` | — | Billing automation patterns |
| Skill | `paypal-integration` | — | PayPal integration guide |
| Skill | `pci-compliance` | — | PCI compliance requirements |
| Skill | `stripe-integration` | — | Stripe integration guide |

---

## Tổng số

| Loại | Từ plugins | Custom (DevPath) | Tổng |
|------|-----------|-----------------|------|
| Agents | 30 | 4 | **34** |
| Skills | 21 | 0 | **21** |
| Commands | 26 | 0 | **26** |
| Hooks | 0 | 4 | **4** |
| **Tổng cộng** | | | **85** |

## Model tiers

| Model | Khi nào dùng | Cost |
|-------|-------------|------|
| `opus` | Critical tasks: review, architecture, team lead | Cao nhất |
| `sonnet` | Standard tasks: testing, debugging, security | Trung bình |
| `inherit` | Dùng model của session hiện tại | Tùy session |
| `haiku` | Fast tasks: update docs, simple checks | Thấp nhất |

---

## Hướng dẫn sử dụng Step-by-Step

### Tổng quan: Bạn đã có gì?

| Thứ | Đã cài | Mục đích |
|-----|--------|----------|
| 14 plugins | wshobson/agents | Agents + skills chuyên biệt (review, test, debug, ...) |
| 4 custom agents | `.claude/agents/` | devpath-reviewer, devpath-tester, devpath-doc-writer, devpath-arch-checker |
| 4 hooks | `.claude/settings.json` | Auto check imports, type check, nhắc docs, verify sub-agent |
| Skills | from plugins | `/full-review`, `/test-generate`, `/smart-debug`, ... (tùy plugin) |
| Agent Teams | env var enabled | Chạy nhiều agents song song |

---

### Bước 1: Mở Claude Code CLI

Mở terminal, vào project, chạy `claude`:

```bash
cd /home/minhnhut_dev/projects/path-learn
git checkout feat/auth-be   # hoặc branch bạn cần làm
claude
```

Claude Code tự động đọc `CLAUDE.md` khi khởi động — file này chứa context reference, agent rules, anti-hallucination rules.

**Việc đầu tiên trong mỗi session** — nhờ Claude đọc context cho branch hiện tại:

```
Đọc .context/STATE.md, .context/branches/01-feat-auth-be/CONTEXT.md,
.context/branches/01-feat-auth-be/TODO.md
```

Điều này giúp Claude biết:
- Project đang ở phase nào (STATE.md)
- Branch này cần làm gì, scope gì (CONTEXT.md)
- Checklist cụ thể (TODO.md)

---

### Bước 2: Code từng task theo TODO.md

Giả sử TODO.md có checklist:
```
- [ ] Setup auth module (controller + service + module)
- [ ] Implement OTP send endpoint
- [ ] Implement OTP verify endpoint
- [ ] Implement Google OAuth
- [ ] Implement JWT strategy
- [ ] Implement Guards
```

Bảo Claude làm **từng task một**:

```
Bắt đầu task đầu tiên: Setup auth module.
Tạo auth.module.ts, auth.controller.ts, auth.service.ts
```

Hooks tự động chạy khi Claude code:
1. **PreToolUse hook** — khi Claude viết/edit file, agent hook tự check imports có hợp lệ không
2. **PostToolUse hook** — sau khi edit, `tsc --noEmit` tự chạy check TypeScript errors
3. Bạn không cần làm gì — hooks chạy tự động ở background

---

### Bước 3: Dùng Custom Sub-Agents

Sau khi code xong 1 feature, gọi sub-agents để review/test/check.

#### 3a. Review code — `@devpath-reviewer`

```
@devpath-reviewer Review auth service và controller vừa tạo
```

Agent sẽ:
- Đọc code vừa viết
- Check NestJS patterns (controller chỉ xử lý HTTP, service chứa logic)
- Check security (validation, guards)
- Check Prisma usage
- Trả về report với severity levels (CRITICAL > HIGH > MEDIUM > LOW)

#### 3b. Viết tests — `@devpath-tester`

```
@devpath-tester Viết unit tests cho auth.service.ts
```

Agent sẽ:
- Đọc source file trước
- Tạo `auth.service.spec.ts` với mock Prisma
- Cover happy path + error cases
- Follow AAA pattern (Arrange → Act → Assert)

#### 3c. Check architecture — `@devpath-arch-checker`

```
@devpath-arch-checker Verify auth module architecture
```

Agent sẽ:
- Check tất cả imports có tồn tại không
- Check Prisma models có đúng schema không
- Check module structure đúng NestJS pattern
- Check không có circular dependencies
- Trả về bảng PASS/FAIL

#### 3d. Update docs — `@devpath-doc-writer`

```
@devpath-doc-writer Update PROGRESS.md và CODEBASE_MAP.md
```

Agent sẽ auto update tracking files, bạn không cần tự viết.

---

### Bước 4: Dùng Plugin Commands

Các plugins cung cấp slash commands. Hay dùng nhất:

```
/full-review                    ← comprehensive-review plugin, review toàn diện
/test-generate auth.service.ts  ← unit-testing plugin, viết tests
/smart-debug "error message"    ← debugging-toolkit plugin, debug lỗi
/refactor-clean                 ← code-refactoring plugin, refactor code
/tdd-cycle                      ← tdd-workflows plugin, full TDD cycle
/context-save                   ← context-management plugin, lưu context
/context-restore                ← context-management plugin, khôi phục context
```

**Khác biệt `@devpath-reviewer` vs `/full-review`:**
- `@devpath-reviewer` — custom agent, biết DevPath context (Prisma, NestJS patterns riêng). Dùng cho **review hàng ngày**.
- `/full-review` — plugin generic, review rất chi tiết nhưng không biết project-specific patterns. Dùng **trước khi merge**.

---

### Bước 5: Dùng Agent Teams (cho task lớn)

Agent Teams = nhiều agents làm song song. Dùng khi task lớn có thể chia nhỏ.

**Ví dụ:** Implement Google OAuth + GitHub OAuth cùng lúc:

```
Tạo agent team để implement song song:
- Teammate 1: Implement Google OAuth (google.strategy.ts)
- Teammate 2: Implement GitHub OAuth (github.strategy.ts)
- Teammate 3: Viết tests cho cả hai
```

Hoặc dùng command:

```
/team-feature "Implement Google OAuth + GitHub OAuth"
/team-review   ← review bằng team multi-dimension
/team-debug    ← debug bằng nhiều hypothesis song song
/team-status   ← xem trạng thái team
/team-shutdown ← shutdown team khi xong
```

**Khi nào dùng Agent Teams:**
- Task lớn chia nhỏ được, files independent
- Muốn làm song song tiết kiệm thời gian

**Khi nào KHÔNG dùng:**
- Task nhỏ (1-2 files) — overhead không đáng
- Files có dependency lẫn nhau — sẽ conflict

---

### Bước 6: Kết thúc session

**Stop hook tự nhắc** bạn khi dừng:
1. Update PROGRESS.md
2. Check VERIFICATION.md
3. Fill HANDOFF.md (nếu branch xong)
4. Check off TODO.md

Hoặc nhờ agent làm:

```
@devpath-doc-writer Update PROGRESS.md với những gì đã làm hôm nay,
và check off TODO.md items đã xong
```

---

### Workflow tổng hợp cho 1 session

```
1. Mở CLI:      claude
2. Load context: "Đọc STATE.md + CONTEXT.md + TODO.md cho branch hiện tại"
3. Code:         Làm từng task trong TODO.md
                 ↳ Hooks tự chạy: check imports (PreToolUse) + type check (PostToolUse)
4. Review:       @devpath-reviewer Review code vừa viết
5. Test:         @devpath-tester Viết tests
6. Arch check:   @devpath-arch-checker Verify architecture
7. Kết thúc:     @devpath-doc-writer Update PROGRESS + CODEBASE_MAP
                 ↳ Stop hook tự nhắc update docs
```
