# TRACKPAD - DevPath Learning Progress

> File này dùng để tracking tiến độ học tập và phát triển dự án DevPath.

---

## 📅 Timeline

### 2026-01-26
- ✅ Claim domain **devpathos.tech** miễn phí 1 năm (.TECH Domains)
- ✅ Claim **Microsoft Azure for Students** $100 credits (hết hạn: Apr 18, 2026)

### 2026-01-25
- ✅ Đăng ký GitHub Student Developer Pack thành công
- ✅ Claim $200 DigitalOcean credits (hết hạn: Jan 2027)
- ✅ Claim Datadog Pro monitoring (hết hạn: Jan 2028, hoặc khi hết sinh viên)
- ✅ Claim domain **devteamos.me** miễn phí 1 năm (Namecheap)
- ✅ Claim SSL Certificate PositiveSSL 1 năm (Namecheap)

---

## 🎯 Current Phase

**Phase 1: Foundation** (theo CONTEXT.md)

---

## 🛠️ Development Progress

### 2026-01-28
**Session: Học Claude Skills & Tạo Custom Skills**

#### Đã học:
- ✅ **Claude Skills là gì** - Custom slash commands để tự động hóa tasks
- ✅ **Agent Skills format** - Chuẩn mới được Claude, AMP, Gemini CLI support
  - File: `SKILL.md` với YAML frontmatter
  - Location: `.claude/skills/<skill-name>/SKILL.md`
- ✅ **Symlink strategy** - Dùng `.agents/` làm source, symlink đến `.claude/`
- ✅ **Built-in commands** - `/clear`, `/compact`, `/config`, `/model`, etc.
- ✅ **Skill variables** - `$ARGUMENTS` để nhận input từ user

#### Đã làm:
- ✅ Setup folder structure: `.agents/skills/` (source) + `.claude/skills/` (symlink)
- ✅ Tạo 8 custom skills cho dự án:

| Skill | Mô tả | Category |
|-------|-------|----------|
| `/nest-module` | Generate NestJS module đầy đủ | Backend |
| `/nest-review` | Review NestJS code | Backend |
| `/nest-test` | Generate unit tests với Jest | Backend |
| `/prisma-model` | Tạo Prisma model + migration | Backend |
| `/react-component` | Generate React component | Frontend |
| `/commit` | Conventional commit message | Workflow |
| `/debug` | Debug helper - phân tích bug | Workflow |
| `/explain` | Giải thích code/concept | Learning |

- ✅ Tạo `_templates/learning-mode.md` - Shared guidelines cho tất cả skills

#### Cấu trúc files:
```
.agents/
└── skills/
    ├── _templates/learning-mode.md
    ├── commit/SKILL.md
    ├── debug/SKILL.md
    ├── explain/SKILL.md
    ├── nest-module/SKILL.md
    ├── nest-review/SKILL.md
    ├── nest-test/SKILL.md
    ├── prisma-model/SKILL.md
    └── react-component/SKILL.md

.claude/
└── skills → symlink → .agents/skills
```

#### Key takeaways:
- Skills = Markdown files với instructions cho Claude
- `disable-model-invocation: true` = chỉ chạy khi user gọi manual
- Có thể dùng chung skills cho Claude CLI và AMP CLI qua symlink
- Skills nên có Learning Mode section để phù hợp với CLAUDE.md

#### Bước tiếp theo:
- [ ] Test skills trong session mới (gõ `/explain`, `/commit`, etc.)
- [ ] Tạo thêm skill `/pr` cho PR description
- [ ] Bắt đầu code Backend với `/nest-module`

---

### 2026-01-27
**Session: Tìm hiểu Project Setup + Test Docker**

#### Đã học:
- ✅ **Monorepo structure** - pnpm workspace với backend/ và frontend/
- ✅ **Database Schema (Prisma)** - 15+ models, quan hệ giữa các tables
  - Authentication: User, OTPCode, RefreshToken
  - Learning: LearningPath → Track → Lesson (qua TrackLesson junction)
  - Quiz: Quiz, QuizQuestion
  - Progress: UserProgress, QuizResult, LearningSession
  - AI: AIInteractionLog, AIUsageQuota
- ✅ **Docker Setup** - docker-compose.yml với postgres, redis, tools
- ✅ **API Design** - RESTful endpoints, response format chuẩn
- ✅ **Authentication Flow** - OTP + JWT (access token 15min, refresh token 7d)

#### Đã làm:
- ✅ Tạo file `.env` từ `.env.example`
- ✅ Đổi port PostgreSQL: 5432 → 5434 (tránh conflict với project khác)
- ✅ Đổi port Redis: 6379 → 6380 (tránh conflict)
- ✅ Test Docker: postgres và redis đều **healthy**

#### Config hiện tại:
| Service | Port | Status |
|---------|------|--------|
| PostgreSQL | localhost:5434 | ✅ Running |
| Redis | localhost:6380 | ✅ Running |

#### Bước tiếp theo:
- [ ] Khởi tạo Backend (NestJS) - tạo app, cài dependencies
- [ ] Setup Prisma - chạy migrations
- [ ] Tạo Auth module đầu tiên

---

## 📦 Deployment Resources

**Phase 5: Deployment** (để dành sau khi code xong)

### Checklist:
- [x] VPS setup - DigitalOcean account với $200 credits
- [x] Domain - devteamos.me (Namecheap)
- [x] Domain - devpathos.tech (.TECH Domains)
- [x] SSL Certificate - PositiveSSL (chưa activate, để dành khi deploy)
- [x] Monitoring - Datadog Pro 2 năm
- [ ] Tạo Droplet (Ubuntu, Singapore region)
- [ ] Nginx setup (Reverse Proxy)
- [ ] PM2 setup (Process Manager)
- [ ] SSL activation (Let's Encrypt hoặc PositiveSSL)
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Domain DNS configuration

---

## 💡 Lessons Learned

### GitHub Student Developer Pack
- Cần email `.edu` hoặc email trường cấp
- Cần thẻ sinh viên còn hạn (chụp rõ nét)
- Duyệt nhanh nếu đủ giấy tờ

### DigitalOcean
- Cần verify payment method (card/PayPal)
- Pre-authorization ~$5 (sẽ hoàn lại sau 3-7 ngày)
- Credits tự động add sau khi verify thành công
- $200 credits = ~16-33 tháng VPS miễn phí (tùy cấu hình)

### Datadog
- Free up to 2 years for students
- Chỉ dùng cho student projects (không commercial)
- Metrics retention: 15 tháng
- Region: US5 (us5.datadoghq.com)

### Namecheap
- Domain .me miễn phí 1 năm qua GitHub Student Pack
- SSL certificate riêng (cần claim bằng code)
- Có thể để domain đó, sau deploy mới trỏ DNS

### .TECH Domains
- Domain .tech miễn phí 1 năm qua GitHub Student Pack
- Cần tạo account trên get.tech
- Verify GitHub để apply discount $0.00
- Control Panel: controlpanel.tech/customer

### Microsoft Azure
- $100 credits miễn phí cho students
- Thời hạn: 1 năm hoặc cho đến khi hết credits
- Không cần credit card để verify
- 58+ free services (VMs, databases, storage, etc.)
- Portal: portal.azure.com

---

## 📊 Resources

| Resource | Amount/Type | Expiry | Status |
|----------|-------------|--------|--------|
| DigitalOcean Credits | $200 | Jan 2027 | ✅ Active |
| Microsoft Azure | $100 | Apr 2026 | ✅ Active |
| Datadog Pro | Monitoring 10 servers | Jan 2028 | ✅ Active |
| Domain devteamos.me | .me domain | Jan 2027 | ✅ Registered |
| Domain devpathos.tech | .tech domain | Jan 2027 | ✅ Registered |
| SSL Certificate | PositiveSSL | Jan 2027 | 🔲 Not activated |

---

## 🔗 Quick Links

| Service | URL | Account |
|---------|-----|---------|
| DigitalOcean | cloud.digitalocean.com | GitHub connected |
| Microsoft Azure | portal.azure.com | GitHub connected |
| Datadog | us5.datadoghq.com | leminhnhut.9a10.2019@gmail.com |
| Namecheap | namecheap.com | GitHub connected |
| .TECH Domains | controlpanel.tech | minhnhut.dev.vn@gmail.com |
| GitHub Education | education.github.com | MinhNhut05 |

---

## 📝 Notes

### Domains Strategy
- **devteamos.me** - Có thể dùng cho frontend (devteamos.me)
- **devpathos.tech** - Có thể dùng cho API (api.devpathos.tech) hoặc ngược lại
- Cả 2 đều có DNS Management miễn phí

### Tổng giá trị đã claim
| Item | Estimated Value |
|------|-----------------|
| DigitalOcean $200 credits | $200 |
| Microsoft Azure $100 credits | $100 |
| Datadog Pro 2 năm | ~$9,600 |
| Domain .me 1 năm | ~$15 |
| Domain .tech 1 năm | ~$50 |
| SSL Certificate 1 năm | ~$10 |
| **TOTAL** | **~$10,000+** |
