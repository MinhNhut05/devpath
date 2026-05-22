# DevPath

AI-assisted personalized learning platform for Vietnamese IT learners.

DevPath helps learners identify what to study next, follow a personalized roadmap, and get AI tutoring while tracking progress across the full learning flow.

## Highlights

- Skill-baseline onboarding and personalized learning-path recommendations
- AI-generated lessons and quizzes with structured output validation
- Progress tracking, protected routes, and dashboard workflows
- pnpm monorepo with frontend and backend apps
- Docker-based development and deployment

## Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS, Zustand, React Query
- Backend: NestJS, TypeScript, Prisma ORM
- Database: PostgreSQL 16, Redis 7
- AI: Anthropic-compatible API via `manager.devteamos.me`
- Infrastructure: Docker, Vercel, VPS with Nginx

## Local development

```bash
git clone https://github.com/MinhNhut05/devpath.git
cd devpath
pnpm install
docker compose up -d
pnpm dev
```

Frontend runs on `:5173`, backend API on `:3001`.

## License

MIT — see [LICENSE](./LICENSE).
