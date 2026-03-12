# STRUCTURE - Codebase File Tree

> Current file structure with status markers.
> Legend: [x] = done, [ ] = pending, [~] = in progress, [-] = not needed yet

---

## Root

```
path-learn/
├── .context/              # [x] Project context (AI-friendly)
├── .claude/               # [x] Claude Code config + skills
├── .agents/               # [x] Agent skills (source, symlinked to .claude/)
├── backend/               # [~] NestJS backend
├── frontend/              # [ ] React frontend (not started)
├── docs/                  # [x] Postman collection
├── docker-compose.yml     # [x] Dev services
├── docker-compose.prod.yml # [x] Production services
├── pnpm-workspace.yaml    # [x] Monorepo config
├── .env.example           # [x] Environment template
├── CLAUDE.md              # [x] AI agent instructions
├── README.md              # [x] Project readme
└── TRACKPAD.md            # [x] Learning journal
```

## Backend

```
backend/
├── prisma/
│   ├── schema.prisma      # [x] Database schema (source of truth)
│   └── migrations/        # [~] Migration files
├── src/
│   ├── main.ts            # [x] App bootstrap
│   ├── app.module.ts      # [x] Root module
│   └── modules/
│       ├── auth/          # [~] In progress (branch 01)
│       ├── users/         # [ ] Pending
│       ├── onboarding/    # [ ] Pending (branch 02)
│       ├── learning-paths/# [ ] Pending (branch 03)
│       ├── lessons/       # [ ] Pending
│       ├── quizzes/       # [ ] Pending (branch 04)
│       ├── progress/      # [ ] Pending (branch 05)
│       ├── ai/            # [ ] Pending (branch 06)
│       ├── payment/       # [ ] Pending (branch 07)
│       └── admin/         # [ ] Pending (branch 08)
├── package.json           # [x]
└── tsconfig.json          # [x]
```

## Frontend (planned)

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/            # [ ] Shadcn/ui components
│   │   ├── layout/        # [ ] Header, Sidebar, Footer
│   │   ├── auth/          # [ ] OTPInput, SocialLogin
│   │   ├── learning/      # [ ] LessonCard, ProgressBar
│   │   └── chat/          # [ ] ChatWindow
│   ├── pages/             # [ ] Route pages
│   ├── hooks/             # [ ] Custom hooks
│   ├── stores/            # [ ] Zustand stores
│   ├── services/          # [ ] API services
│   ├── lib/               # [ ] Utils
│   └── types/             # [ ] TypeScript types
└── package.json           # [ ]
```
