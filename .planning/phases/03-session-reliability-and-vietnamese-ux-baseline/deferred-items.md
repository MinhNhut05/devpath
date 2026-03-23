# Deferred Items

## 2026-03-23 — Plan 03-03

### Out-of-scope TypeScript errors from unrelated files
`pnpm --dir /home/minhnhut_dev/projects/path-learn/frontend exec tsc --noEmit` still fails because these existing files import `vi` but do not use it:
- `frontend/src/components/layout/Sidebar.tsx`
- `frontend/src/pages/AiChat.tsx`
- `frontend/src/pages/AuthCallback.tsx`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/Onboarding.tsx`
- `frontend/src/pages/Settings.tsx`

These files are outside Plan 03-03 scope, so they were not modified here.
