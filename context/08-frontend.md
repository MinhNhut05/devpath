# Frontend Architecture

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI Library |
| Vite 5 | Build Tool |
| TypeScript 5 | Type Safety |
| Tailwind CSS 3 | Styling |
| Shadcn/ui | Component Library |
| Zustand 4 | State Management |
| React Query 5 | Server State & Caching |
| React Router 6 | Routing |
| React Hook Form 7 | Form Management |
| Zod 3 | Schema Validation |
| Framer Motion 11 | Animations |
| react-i18next 14 | Internationalization |
| Monaco Editor | Code challenge editor |

---

## Design System

### UI UX Pro Max Skill
- AI-powered design intelligence toolkit
- Install: `npm install -g uipro-cli`
- Init: `uipro init --ai claude --persist`
- Output: `design-system/MASTER.md`
- Provides: color palette, typography, layout patterns, accessibility checklist

### Shadcn/ui
- Component library built on Radix UI + Tailwind CSS
- Copy-paste approach (own the code)
- Fully customizable
- Components: Button, Input, Card, Modal, Dialog, Dropdown, Toast, etc.

### Combination
```
UI UX Pro Max Skill → design system (colors, fonts, layout)
         ↓
Shadcn/ui → actual components using that design system
         ↓
Tailwind CSS → detailed styling, dark mode, responsive
```

---

## Dark Mode

- Enabled from day 1
- Tailwind `dark:` prefix
- Theme toggle in header
- Store preference in localStorage
- Respect system preference by default (`prefers-color-scheme`)

---

## Responsive Strategy

- **Mobile-first** approach
- Tailwind breakpoints: `sm:` (640px), `md:` (768px), `lg:` (1024px), `xl:` (1280px)
- Design for mobile first, then expand for larger screens
- Target: sinh vien thuong dung dien thoai

---

## i18n (Internationalization)

- Library: react-i18next
- Languages: Vietnamese (primary) → English (later)
- Translation files: `public/locales/vi/`, `public/locales/en/`
- Strategy: Viet tieng Viet truoc, dich sang tieng Anh sau
- UI language toggle in settings

---

## Folder Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   └── locales/
│       ├── vi/
│       │   └── translation.json
│       └── en/
│           └── translation.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   │
│   ├── components/
│   │   ├── ui/                    # Shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── auth/
│   │   │   ├── OTPInput.tsx
│   │   │   ├── SocialLoginButtons.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── learning/
│   │   │   ├── LessonCard.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── QuizQuestion.tsx
│   │   │   ├── CodeEditor.tsx      # Monaco editor wrapper
│   │   │   └── ActivityGraph.tsx
│   │   └── chat/
│   │       ├── ChatWindow.tsx
│   │       ├── ChatMessage.tsx
│   │       └── ChatInput.tsx
│   │
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Auth/
│   │   │   └── Login.tsx
│   │   ├── Onboarding/
│   │   │   ├── index.tsx
│   │   │   ├── Questions.tsx
│   │   │   └── Recommendation.tsx
│   │   ├── Dashboard/
│   │   │   ├── index.tsx
│   │   │   ├── Progress.tsx
│   │   │   └── Settings.tsx
│   │   ├── Learning/
│   │   │   ├── PathOverview.tsx
│   │   │   ├── Lesson.tsx
│   │   │   └── Quiz.tsx
│   │   ├── Subscription/
│   │   │   ├── Plans.tsx
│   │   │   └── PaymentResult.tsx
│   │   ├── Admin/
│   │   │   ├── index.tsx
│   │   │   ├── Paths.tsx
│   │   │   ├── Lessons.tsx
│   │   │   └── Users.tsx
│   │   └── NotFound.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProgress.ts
│   │   ├── useQuiz.ts
│   │   ├── useChat.ts
│   │   └── useSubscription.ts
│   │
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── progressStore.ts
│   │   ├── chatStore.ts
│   │   └── themeStore.ts          # Dark mode toggle
│   │
│   ├── services/
│   │   ├── api.ts                 # Axios instance
│   │   ├── authService.ts
│   │   ├── learningService.ts
│   │   ├── quizService.ts
│   │   ├── aiService.ts
│   │   └── paymentService.ts
│   │
│   ├── lib/
│   │   ├── utils.ts               # Shadcn/ui cn() helper
│   │   ├── constants.ts
│   │   └── validations.ts
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── learning.ts
│   │   ├── quiz.ts
│   │   ├── payment.ts
│   │   └── api.ts
│   │
│   └── styles/
│       └── globals.css
│
├── components.json                # Shadcn/ui config
├── design-system/
│   └── MASTER.md                  # UI UX Pro Max Skill output
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## Key Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Marketing page, feature overview |
| Login | `/auth/login` | OTP input + Social login buttons |
| Onboarding | `/onboarding` | 4-step questionnaire + AI recommendation |
| Dashboard | `/dashboard` | Progress overview, activity graph |
| Path Overview | `/paths/:slug` | Learning path detail, track listing |
| Lesson | `/lessons/:slug` | Lesson content + AI chat + quiz |
| Quiz | `/lessons/:slug/quiz` | Quiz interface (multi-type) |
| Plans | `/plans` | Subscription plans & pricing |
| Settings | `/settings` | Profile, language, theme toggle |
| Admin | `/admin/*` | Admin panel (protected) |
