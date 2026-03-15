// prisma/seed.ts
// DevPath - Database Seed Script
// Run with: npx prisma db seed --config prisma/prisma.config.ts

import 'dotenv/config';
import { PrismaClient, UserRole, CareerGoal, LearningBackground, QuestionType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Prisma 7 requires adapter for database connections
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // 1. CREATE ADMIN USER
  // ============================================
  console.log('Creating admin user...');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@devpathlearn.com' },
    update: {},
    create: {
      email: 'admin@devpathlearn.com',
      role: UserRole.ADMIN,
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email}`);

  // ============================================
  // 2. CREATE TEST USER
  // ============================================
  console.log('Creating test user...');

  const testUser = await prisma.user.upsert({
    where: { email: 'test@devpathlearn.com' },
    update: {},
    create: {
      email: 'test@devpathlearn.com',
      role: UserRole.USER,
    },
  });
  console.log(`✅ Test user created: ${testUser.email}`);

  // ============================================
  // 3. CREATE LESSONS (Reusable across paths)
  // ============================================
  console.log('Creating lessons...');

  const lessons = await Promise.all([
    // Web Fundamentals
    prisma.lesson.upsert({
      where: { slug: 'html-basics' },
      update: {},
      create: {
        slug: 'html-basics',
        title: 'HTML Basics',
        summary: `
# HTML Basics

HTML (HyperText Markup Language) là ngôn ngữ đánh dấu tiêu chuẩn để tạo trang web.

## Bạn sẽ học được gì?

- Cấu trúc cơ bản của một trang HTML
- Các thẻ HTML phổ biến (headings, paragraphs, links, images)
- Semantic HTML và tầm quan trọng của nó
- Tạo forms và tables cơ bản

## Tại sao HTML quan trọng?

HTML là nền tảng của mọi trang web. Dù bạn muốn trở thành Frontend, Backend hay Fullstack Developer, hiểu HTML là bước đầu tiên không thể bỏ qua.
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'MDN - HTML Basics', url: 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/HTML_basics', type: 'documentation' },
          { title: 'W3Schools HTML Tutorial', url: 'https://www.w3schools.com/html/', type: 'tutorial' },
          { title: 'HTML Full Course - freeCodeCamp', url: 'https://www.youtube.com/watch?v=pQN-pnXPaVg', type: 'video' },
        ]),
        estimatedMins: 60,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'css-fundamentals' },
      update: {},
      create: {
        slug: 'css-fundamentals',
        title: 'CSS Fundamentals',
        summary: `
# CSS Fundamentals

CSS (Cascading Style Sheets) là ngôn ngữ dùng để định dạng giao diện trang web.

## Bạn sẽ học được gì?

- Cú pháp CSS: selectors, properties, values
- Box Model: margin, border, padding, content
- Colors, fonts, và text styling
- CSS Specificity và Cascade

## Kết quả đạt được

Sau bài học này, bạn có thể style một trang HTML cơ bản với màu sắc, font chữ, và layout đơn giản.
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'MDN - CSS First Steps', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/First_steps', type: 'documentation' },
          { title: 'CSS Crash Course - Traversy Media', url: 'https://www.youtube.com/watch?v=yfoY53QXEnI', type: 'video' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'css-flexbox-grid' },
      update: {},
      create: {
        slug: 'css-flexbox-grid',
        title: 'CSS Flexbox & Grid',
        summary: `
# CSS Flexbox & Grid

Hai công cụ layout mạnh mẽ nhất trong CSS hiện đại.

## Flexbox

- Flex container và flex items
- Main axis và cross axis
- justify-content, align-items, flex-wrap
- Practical examples: navigation, cards layout

## CSS Grid

- Grid container và grid items
- grid-template-columns, grid-template-rows
- Grid areas và named lines
- Responsive layouts với Grid

## Khi nào dùng Flexbox vs Grid?

- Flexbox: Layout 1 chiều (hàng hoặc cột)
- Grid: Layout 2 chiều (hàng và cột cùng lúc)
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Flexbox Froggy - Game học Flexbox', url: 'https://flexboxfroggy.com/', type: 'interactive' },
          { title: 'Grid Garden - Game học CSS Grid', url: 'https://cssgridgarden.com/', type: 'interactive' },
          { title: 'CSS Flexbox - MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox', type: 'documentation' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'responsive-design' },
      update: {},
      create: {
        slug: 'responsive-design',
        title: 'Responsive Web Design',
        summary: `
# Responsive Web Design

Tạo trang web hoạt động tốt trên mọi kích thước màn hình.

## Bạn sẽ học được gì?

- Media queries và breakpoints
- Mobile-first approach
- Responsive images và typography
- Viewport meta tag
- Common responsive patterns

## Best Practices

- Thiết kế mobile-first
- Sử dụng relative units (%, em, rem)
- Test trên nhiều thiết bị
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'MDN - Responsive Design', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design', type: 'documentation' },
          { title: 'Responsive Web Design - freeCodeCamp', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', type: 'course' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    // JavaScript Core
    prisma.lesson.upsert({
      where: { slug: 'javascript-basics' },
      update: {},
      create: {
        slug: 'javascript-basics',
        title: 'JavaScript Basics',
        summary: `
# JavaScript Basics

JavaScript là ngôn ngữ lập trình của web, cho phép tạo các trang web tương tác.

## Bạn sẽ học được gì?

- Variables: var, let, const
- Data types: string, number, boolean, array, object
- Operators và expressions
- Control flow: if/else, switch, loops
- Functions: declaration, expression, arrow functions

## Tại sao JavaScript quan trọng?

JavaScript là ngôn ngữ duy nhất chạy trực tiếp trên browser. Nó cũng có thể chạy trên server (Node.js), mobile (React Native), và desktop (Electron).
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'JavaScript.info - The Modern JavaScript Tutorial', url: 'https://javascript.info/', type: 'documentation' },
          { title: 'MDN - JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', type: 'documentation' },
          { title: 'JavaScript Full Course - freeCodeCamp', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', type: 'video' },
        ]),
        estimatedMins: 180,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'es6-features' },
      update: {},
      create: {
        slug: 'es6-features',
        title: 'ES6+ Features',
        summary: `
# ES6+ Features

ES6 (ECMAScript 2015) và các phiên bản sau mang đến nhiều tính năng mới giúp code JavaScript ngắn gọn và mạnh mẽ hơn.

## Bạn sẽ học được gì?

- Arrow functions
- Template literals
- Destructuring (arrays & objects)
- Spread và rest operators
- Default parameters
- Enhanced object literals
- Classes
- Modules (import/export)

## Tại sao cần học ES6+?

Hầu hết các framework hiện đại (React, Vue, Angular) đều sử dụng cú pháp ES6+. Đây là kiến thức bắt buộc cho JavaScript developer.
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'ES6 Features Overview', url: 'https://github.com/lukehoban/es6features', type: 'documentation' },
          { title: 'JavaScript.info - Classes', url: 'https://javascript.info/classes', type: 'documentation' },
          { title: 'ES6 Tutorial - Traversy Media', url: 'https://www.youtube.com/watch?v=WZQc7RUAg18', type: 'video' },
        ]),
        estimatedMins: 150,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'dom-manipulation' },
      update: {},
      create: {
        slug: 'dom-manipulation',
        title: 'DOM Manipulation',
        summary: `
# DOM Manipulation

Document Object Model (DOM) cho phép JavaScript tương tác với HTML và CSS của trang web.

## Bạn sẽ học được gì?

- DOM là gì và cách nó hoạt động
- Selecting elements: getElementById, querySelector, querySelectorAll
- Modifying elements: innerHTML, textContent, style, classList
- Creating và removing elements
- Event listeners và event handling
- Event delegation

## Practical Examples

- Toggle dark/light mode
- Form validation
- Dynamic content loading
- Interactive UI components
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'MDN - Introduction to the DOM', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction', type: 'documentation' },
          { title: 'JavaScript DOM Crash Course', url: 'https://www.youtube.com/watch?v=0ik6X4DJKCc', type: 'video' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'async-javascript' },
      update: {},
      create: {
        slug: 'async-javascript',
        title: 'Asynchronous JavaScript',
        summary: `
# Asynchronous JavaScript

Hiểu cách JavaScript xử lý các tác vụ bất đồng bộ như fetching data, timers, và I/O operations.

## Bạn sẽ học được gì?

- Synchronous vs Asynchronous
- Callbacks và callback hell
- Promises: creating, chaining, error handling
- Async/Await syntax
- Fetch API và HTTP requests
- Error handling với try/catch

## Real-world Applications

- Fetching data từ APIs
- File uploads
- WebSockets
- Background tasks
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'JavaScript.info - Promises', url: 'https://javascript.info/promise-basics', type: 'documentation' },
          { title: 'Async JavaScript Crash Course', url: 'https://www.youtube.com/watch?v=PoRJizFvM7s', type: 'video' },
          { title: 'MDN - Using Fetch', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch', type: 'documentation' },
        ]),
        estimatedMins: 150,
        isPublished: true,
      },
    }),

    // React Fundamentals
    prisma.lesson.upsert({
      where: { slug: 'react-introduction' },
      update: {},
      create: {
        slug: 'react-introduction',
        title: 'React Introduction',
        summary: `
# React Introduction

React là thư viện JavaScript phổ biến nhất để xây dựng user interfaces.

## Bạn sẽ học được gì?

- React là gì và tại sao nên dùng React
- Virtual DOM và cách React render hiệu quả
- JSX syntax
- Create React App vs Vite
- Project structure
- React Developer Tools

## Tại sao chọn React?

- Component-based architecture
- Huge ecosystem
- Strong community support
- Được sử dụng bởi Facebook, Netflix, Airbnb, và nhiều công ty lớn
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'React Official Docs', url: 'https://react.dev/', type: 'documentation' },
          { title: 'React Tutorial for Beginners', url: 'https://www.youtube.com/watch?v=SqcY0GlETPk', type: 'video' },
          { title: 'Vite - Getting Started', url: 'https://vitejs.dev/guide/', type: 'documentation' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'components-props' },
      update: {},
      create: {
        slug: 'components-props',
        title: 'Components & Props',
        summary: `
# Components & Props

Components là building blocks của mọi React application.

## Bạn sẽ học được gì?

- Function components vs Class components
- Creating và using components
- Props: passing data to components
- Props destructuring
- Children prop
- Default props
- PropTypes (type checking)

## Best Practices

- One component = one responsibility
- Keep components small and focused
- Use meaningful names
- Props are read-only (immutable)
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'React Docs - Components and Props', url: 'https://react.dev/learn/passing-props-to-a-component', type: 'documentation' },
          { title: 'React Components Crash Course', url: 'https://www.youtube.com/watch?v=Y2hgEGPzTZY', type: 'video' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'state-hooks' },
      update: {},
      create: {
        slug: 'state-hooks',
        title: 'State & Hooks',
        summary: `
# State & Hooks

State cho phép components "nhớ" và react to user interactions.

## Bạn sẽ học được gì?

- useState hook
- State updates và re-rendering
- Updating objects và arrays in state
- useEffect hook
- Dependency array
- Cleanup functions
- Custom hooks

## Common Patterns

- Fetching data với useEffect
- Form handling với useState
- Debouncing và throttling
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'React Docs - State', url: 'https://react.dev/learn/state-a-components-memory', type: 'documentation' },
          { title: 'React Hooks Tutorial', url: 'https://www.youtube.com/watch?v=O6P86uwfdR0', type: 'video' },
          { title: 'useEffect Complete Guide', url: 'https://overreacted.io/a-complete-guide-to-useeffect/', type: 'article' },
        ]),
        estimatedMins: 180,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'react-forms-events' },
      update: {},
      create: {
        slug: 'react-forms-events',
        title: 'Forms & Events',
        summary: `
# Forms & Events in React

Xử lý user input và events trong React applications.

## Bạn sẽ học được gì?

- Event handling in React
- Controlled vs Uncontrolled components
- Form submission
- Input validation
- React Hook Form library
- Zod for schema validation

## Practical Examples

- Login/Register forms
- Search functionality
- Multi-step forms
- File uploads
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'React Docs - Responding to Events', url: 'https://react.dev/learn/responding-to-events', type: 'documentation' },
          { title: 'React Hook Form', url: 'https://react-hook-form.com/', type: 'documentation' },
          { title: 'Zod Documentation', url: 'https://zod.dev/', type: 'documentation' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'react-router' },
      update: {},
      create: {
        slug: 'react-router',
        title: 'React Router',
        summary: `
# React Router

Client-side routing cho React applications.

## Bạn sẽ học được gì?

- Setting up React Router
- Routes và Route components
- Navigation với Link và NavLink
- Route parameters
- Nested routes
- Protected routes
- Programmatic navigation

## Advanced Topics

- Code splitting với lazy loading
- Route-based data loading
- Error boundaries for routes
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'React Router Docs', url: 'https://reactrouter.com/', type: 'documentation' },
          { title: 'React Router Tutorial', url: 'https://www.youtube.com/watch?v=oTIJunBa6MA', type: 'video' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'state-management' },
      update: {},
      create: {
        slug: 'state-management',
        title: 'State Management',
        summary: `
# State Management

Quản lý state phức tạp trong large-scale React applications.

## Bạn sẽ học được gì?

- Context API
- When to use Context vs Props
- Zustand basics
- Creating stores
- Selectors và subscriptions
- Persisting state
- Devtools integration

## Comparing Solutions

- Context API: Simple, built-in
- Zustand: Minimal, flexible
- Redux: Powerful, boilerplate-heavy
- Jotai/Recoil: Atomic state
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'React Docs - Context', url: 'https://react.dev/learn/passing-data-deeply-with-context', type: 'documentation' },
          { title: 'Zustand Documentation', url: 'https://docs.pmnd.rs/zustand/getting-started/introduction', type: 'documentation' },
          { title: 'Zustand Tutorial', url: 'https://www.youtube.com/watch?v=_ngCLZ5Iz-0', type: 'video' },
        ]),
        estimatedMins: 150,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'api-integration' },
      update: {},
      create: {
        slug: 'api-integration',
        title: 'API Integration',
        summary: `
# API Integration with React

Kết nối React frontend với backend APIs.

## Bạn sẽ học được gì?

- Fetch API và Axios
- React Query (TanStack Query)
- Caching và background updates
- Loading và error states
- Optimistic updates
- Infinite scrolling
- Mutations

## Best Practices

- Centralized API configuration
- Error handling strategies
- Request/Response interceptors
- Environment-based URLs
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'TanStack Query Docs', url: 'https://tanstack.com/query/latest', type: 'documentation' },
          { title: 'Axios Documentation', url: 'https://axios-http.com/docs/intro', type: 'documentation' },
          { title: 'React Query Tutorial', url: 'https://www.youtube.com/watch?v=r8Dg0KVnfMA', type: 'video' },
        ]),
        estimatedMins: 150,
        isPublished: true,
      },
    }),

    // Tools
    prisma.lesson.upsert({
      where: { slug: 'git-github' },
      update: {},
      create: {
        slug: 'git-github',
        title: 'Git & GitHub',
        summary: `
# Git & GitHub

Version control là kỹ năng bắt buộc cho mọi developer.

## Bạn sẽ học được gì?

- Git basics: init, add, commit, status
- Branching và merging
- Remote repositories
- GitHub: push, pull, clone
- Pull requests
- Code review process
- Git workflow (GitFlow, trunk-based)

## Essential Commands

\`\`\`bash
git init
git add .
git commit -m "message"
git push origin main
git pull
git branch feature-name
git checkout -b feature-name
git merge feature-name
\`\`\`
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Git Documentation', url: 'https://git-scm.com/doc', type: 'documentation' },
          { title: 'GitHub Guides', url: 'https://guides.github.com/', type: 'documentation' },
          { title: 'Git & GitHub Crash Course', url: 'https://www.youtube.com/watch?v=RGOj5yH7evk', type: 'video' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'build-tools' },
      update: {},
      create: {
        slug: 'build-tools',
        title: 'Build Tools (Vite)',
        summary: `
# Build Tools - Vite

Modern build tools cho faster development experience.

## Bạn sẽ học được gì?

- What are build tools and why we need them
- Vite vs Create React App vs Webpack
- Vite configuration
- Environment variables
- Building for production
- Code splitting
- Asset handling

## Vite Features

- Lightning fast HMR (Hot Module Replacement)
- Native ES modules
- Optimized production builds
- Plugin ecosystem
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Vite Official Docs', url: 'https://vitejs.dev/', type: 'documentation' },
          { title: 'Vite Crash Course', url: 'https://www.youtube.com/watch?v=LQQ3CR2JTX8', type: 'video' },
        ]),
        estimatedMins: 60,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'deployment' },
      update: {},
      create: {
        slug: 'deployment',
        title: 'Deployment',
        summary: `
# Deployment

Deploy React application lên production.

## Bạn sẽ học được gì?

- Build production bundle
- Vercel deployment
- Netlify deployment
- Custom domain setup
- Environment variables in production
- CI/CD basics với GitHub Actions

## Deployment Checklist

- Build optimization
- Environment configuration
- Error tracking (Sentry)
- Analytics setup
- Performance monitoring
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Vercel Documentation', url: 'https://vercel.com/docs', type: 'documentation' },
          { title: 'Netlify Docs', url: 'https://docs.netlify.com/', type: 'documentation' },
          { title: 'Deploy React App - Vercel', url: 'https://www.youtube.com/watch?v=FvsvHzcwOmQ', type: 'video' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),
  ]);

  console.log(`✅ Created ${lessons.length} lessons`);

  // ============================================
  // 4. CREATE LEARNING PATH: FRONTEND REACTJS
  // ============================================
  console.log('Creating Frontend ReactJS learning path...');

  const frontendPath = await prisma.learningPath.upsert({
    where: { slug: 'frontend-reactjs' },
    update: {},
    create: {
      name: 'Frontend ReactJS Developer',
      slug: 'frontend-reactjs',
      description: 'Lộ trình hoàn chỉnh để trở thành Frontend Developer với ReactJS. Từ HTML/CSS cơ bản đến React advanced và deployment.',
      icon: 'react',
      difficulty: 'beginner',
      estimatedHours: 120,
      isPublished: true,
      order: 1,
    },
  });

  // Create Tracks for Frontend Path
  const frontendTracks = await Promise.all([
    prisma.track.upsert({
      where: { id: 'track-web-fundamentals' },
      update: {},
      create: {
        id: 'track-web-fundamentals',
        learningPathId: frontendPath.id,
        name: 'Web Fundamentals',
        description: 'Nền tảng HTML và CSS để xây dựng giao diện web',
        order: 1,
        isOptional: false,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-javascript-core' },
      update: {},
      create: {
        id: 'track-javascript-core',
        learningPathId: frontendPath.id,
        name: 'JavaScript Core',
        description: 'Nắm vững JavaScript từ cơ bản đến nâng cao',
        order: 2,
        isOptional: false,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-react-fundamentals' },
      update: {},
      create: {
        id: 'track-react-fundamentals',
        learningPathId: frontendPath.id,
        name: 'React Fundamentals',
        description: 'Làm quen với React và các concepts cốt lõi',
        order: 3,
        isOptional: false,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-react-advanced' },
      update: {},
      create: {
        id: 'track-react-advanced',
        learningPathId: frontendPath.id,
        name: 'React Advanced',
        description: 'Routing, state management, và API integration',
        order: 4,
        isOptional: false,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-tools-deployment' },
      update: {},
      create: {
        id: 'track-tools-deployment',
        learningPathId: frontendPath.id,
        name: 'Tools & Deployment',
        description: 'Git, build tools, và deployment (có thể bỏ qua nếu đã biết)',
        order: 5,
        isOptional: true,
      },
    }),
  ]);

  console.log(`✅ Created ${frontendTracks.length} tracks for Frontend path`);

  // Link lessons to tracks
  const lessonMap = Object.fromEntries(lessons.map(l => [l.slug, l]));

  await Promise.all([
    // Web Fundamentals Track
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-web-fundamentals', lessonId: lessonMap['html-basics'].id } },
      update: {},
      create: { trackId: 'track-web-fundamentals', lessonId: lessonMap['html-basics'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-web-fundamentals', lessonId: lessonMap['css-fundamentals'].id } },
      update: {},
      create: { trackId: 'track-web-fundamentals', lessonId: lessonMap['css-fundamentals'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-web-fundamentals', lessonId: lessonMap['css-flexbox-grid'].id } },
      update: {},
      create: { trackId: 'track-web-fundamentals', lessonId: lessonMap['css-flexbox-grid'].id, order: 3 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-web-fundamentals', lessonId: lessonMap['responsive-design'].id } },
      update: {},
      create: { trackId: 'track-web-fundamentals', lessonId: lessonMap['responsive-design'].id, order: 4 },
    }),

    // JavaScript Core Track
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-javascript-core', lessonId: lessonMap['javascript-basics'].id } },
      update: {},
      create: { trackId: 'track-javascript-core', lessonId: lessonMap['javascript-basics'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-javascript-core', lessonId: lessonMap['es6-features'].id } },
      update: {},
      create: { trackId: 'track-javascript-core', lessonId: lessonMap['es6-features'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-javascript-core', lessonId: lessonMap['dom-manipulation'].id } },
      update: {},
      create: { trackId: 'track-javascript-core', lessonId: lessonMap['dom-manipulation'].id, order: 3 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-javascript-core', lessonId: lessonMap['async-javascript'].id } },
      update: {},
      create: { trackId: 'track-javascript-core', lessonId: lessonMap['async-javascript'].id, order: 4 },
    }),

    // React Fundamentals Track
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-react-fundamentals', lessonId: lessonMap['react-introduction'].id } },
      update: {},
      create: { trackId: 'track-react-fundamentals', lessonId: lessonMap['react-introduction'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-react-fundamentals', lessonId: lessonMap['components-props'].id } },
      update: {},
      create: { trackId: 'track-react-fundamentals', lessonId: lessonMap['components-props'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-react-fundamentals', lessonId: lessonMap['state-hooks'].id } },
      update: {},
      create: { trackId: 'track-react-fundamentals', lessonId: lessonMap['state-hooks'].id, order: 3 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-react-fundamentals', lessonId: lessonMap['react-forms-events'].id } },
      update: {},
      create: { trackId: 'track-react-fundamentals', lessonId: lessonMap['react-forms-events'].id, order: 4 },
    }),

    // React Advanced Track
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-react-advanced', lessonId: lessonMap['react-router'].id } },
      update: {},
      create: { trackId: 'track-react-advanced', lessonId: lessonMap['react-router'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-react-advanced', lessonId: lessonMap['state-management'].id } },
      update: {},
      create: { trackId: 'track-react-advanced', lessonId: lessonMap['state-management'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-react-advanced', lessonId: lessonMap['api-integration'].id } },
      update: {},
      create: { trackId: 'track-react-advanced', lessonId: lessonMap['api-integration'].id, order: 3 },
    }),

    // Tools & Deployment Track
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-tools-deployment', lessonId: lessonMap['git-github'].id } },
      update: {},
      create: { trackId: 'track-tools-deployment', lessonId: lessonMap['git-github'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-tools-deployment', lessonId: lessonMap['build-tools'].id } },
      update: {},
      create: { trackId: 'track-tools-deployment', lessonId: lessonMap['build-tools'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-tools-deployment', lessonId: lessonMap['deployment'].id } },
      update: {},
      create: { trackId: 'track-tools-deployment', lessonId: lessonMap['deployment'].id, order: 3 },
    }),
  ]);

  console.log('✅ Linked lessons to tracks');

  // ============================================
  // 5. CREATE LESSON PREREQUISITES
  // ============================================
  console.log('Creating lesson prerequisites...');

  await Promise.all([
    // CSS requires HTML
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['css-fundamentals'].id, prerequisiteId: lessonMap['html-basics'].id } },
      update: {},
      create: { lessonId: lessonMap['css-fundamentals'].id, prerequisiteId: lessonMap['html-basics'].id },
    }),
    // Flexbox/Grid requires CSS
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['css-flexbox-grid'].id, prerequisiteId: lessonMap['css-fundamentals'].id } },
      update: {},
      create: { lessonId: lessonMap['css-flexbox-grid'].id, prerequisiteId: lessonMap['css-fundamentals'].id },
    }),
    // Responsive requires Flexbox/Grid
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['responsive-design'].id, prerequisiteId: lessonMap['css-flexbox-grid'].id } },
      update: {},
      create: { lessonId: lessonMap['responsive-design'].id, prerequisiteId: lessonMap['css-flexbox-grid'].id },
    }),
    // ES6 requires JS Basics
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['es6-features'].id, prerequisiteId: lessonMap['javascript-basics'].id } },
      update: {},
      create: { lessonId: lessonMap['es6-features'].id, prerequisiteId: lessonMap['javascript-basics'].id },
    }),
    // DOM requires ES6
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['dom-manipulation'].id, prerequisiteId: lessonMap['es6-features'].id } },
      update: {},
      create: { lessonId: lessonMap['dom-manipulation'].id, prerequisiteId: lessonMap['es6-features'].id },
    }),
    // Async requires DOM
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['async-javascript'].id, prerequisiteId: lessonMap['dom-manipulation'].id } },
      update: {},
      create: { lessonId: lessonMap['async-javascript'].id, prerequisiteId: lessonMap['dom-manipulation'].id },
    }),
    // React Intro requires Async JS
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['react-introduction'].id, prerequisiteId: lessonMap['async-javascript'].id } },
      update: {},
      create: { lessonId: lessonMap['react-introduction'].id, prerequisiteId: lessonMap['async-javascript'].id },
    }),
    // Components requires React Intro
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['components-props'].id, prerequisiteId: lessonMap['react-introduction'].id } },
      update: {},
      create: { lessonId: lessonMap['components-props'].id, prerequisiteId: lessonMap['react-introduction'].id },
    }),
    // State/Hooks requires Components
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['state-hooks'].id, prerequisiteId: lessonMap['components-props'].id } },
      update: {},
      create: { lessonId: lessonMap['state-hooks'].id, prerequisiteId: lessonMap['components-props'].id },
    }),
    // Forms requires State/Hooks
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['react-forms-events'].id, prerequisiteId: lessonMap['state-hooks'].id } },
      update: {},
      create: { lessonId: lessonMap['react-forms-events'].id, prerequisiteId: lessonMap['state-hooks'].id },
    }),
    // Router requires Forms
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['react-router'].id, prerequisiteId: lessonMap['react-forms-events'].id } },
      update: {},
      create: { lessonId: lessonMap['react-router'].id, prerequisiteId: lessonMap['react-forms-events'].id },
    }),
    // State Management requires Router
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['state-management'].id, prerequisiteId: lessonMap['react-router'].id } },
      update: {},
      create: { lessonId: lessonMap['state-management'].id, prerequisiteId: lessonMap['react-router'].id },
    }),
    // API Integration requires State Management
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['api-integration'].id, prerequisiteId: lessonMap['state-management'].id } },
      update: {},
      create: { lessonId: lessonMap['api-integration'].id, prerequisiteId: lessonMap['state-management'].id },
    }),
  ]);

  console.log('✅ Created lesson prerequisites');

  // ============================================
  // 6. CREATE QUIZZES
  // ============================================
  console.log('Creating quizzes...');

  // HTML Basics Quiz
  const htmlQuiz = await prisma.quiz.upsert({
    where: { lessonId: lessonMap['html-basics'].id },
    update: {},
    create: {
      lessonId: lessonMap['html-basics'].id,
      title: 'HTML Basics Quiz',
      description: 'Kiểm tra kiến thức về HTML cơ bản',
      passThreshold: 70,
      retryLimit: 3,
      retryCooldown: 60,
    },
  });

  await Promise.all([
    prisma.quizQuestion.upsert({
      where: { id: 'html-q1' },
      update: {},
      create: {
        id: 'html-q1',
        quizId: htmlQuiz.id,
        questionText: 'HTML là viết tắt của?',
        questionType: QuestionType.SINGLE_CHOICE,
        options: JSON.stringify([
          { id: 'a', text: 'Hyper Text Markup Language' },
          { id: 'b', text: 'High Tech Modern Language' },
          { id: 'c', text: 'Hyper Transfer Markup Language' },
          { id: 'd', text: 'Home Tool Markup Language' },
        ]),
        correctAnswer: JSON.stringify(['a']),
        explanation: 'HTML là viết tắt của Hyper Text Markup Language - ngôn ngữ đánh dấu siêu văn bản.',
        order: 1,
      },
    }),
    prisma.quizQuestion.upsert({
      where: { id: 'html-q2' },
      update: {},
      create: {
        id: 'html-q2',
        quizId: htmlQuiz.id,
        questionText: 'Thẻ nào dùng để tạo heading lớn nhất trong HTML?',
        questionType: QuestionType.SINGLE_CHOICE,
        options: JSON.stringify([
          { id: 'a', text: '<h6>' },
          { id: 'b', text: '<heading>' },
          { id: 'c', text: '<h1>' },
          { id: 'd', text: '<head>' },
        ]),
        correctAnswer: JSON.stringify(['c']),
        explanation: '<h1> là thẻ heading lớn nhất, <h6> là nhỏ nhất. <head> là phần header của document, không phải heading.',
        order: 2,
      },
    }),
    prisma.quizQuestion.upsert({
      where: { id: 'html-q3' },
      update: {},
      create: {
        id: 'html-q3',
        quizId: htmlQuiz.id,
        questionText: 'Thẻ nào dùng để tạo link trong HTML?',
        questionType: QuestionType.SINGLE_CHOICE,
        options: JSON.stringify([
          { id: 'a', text: '<link>' },
          { id: 'b', text: '<a>' },
          { id: 'c', text: '<href>' },
          { id: 'd', text: '<url>' },
        ]),
        correctAnswer: JSON.stringify(['b']),
        explanation: 'Thẻ <a> (anchor) dùng để tạo hyperlink. <link> dùng để link external resources như CSS.',
        order: 3,
      },
    }),
    prisma.quizQuestion.upsert({
      where: { id: 'html-q4' },
      update: {},
      create: {
        id: 'html-q4',
        quizId: htmlQuiz.id,
        questionText: 'Những thẻ nào là semantic HTML? (Chọn nhiều đáp án)',
        questionType: QuestionType.MULTIPLE_CHOICE,
        options: JSON.stringify([
          { id: 'a', text: '<div>' },
          { id: 'b', text: '<header>' },
          { id: 'c', text: '<span>' },
          { id: 'd', text: '<article>' },
          { id: 'e', text: '<nav>' },
        ]),
        correctAnswer: JSON.stringify(['b', 'd', 'e']),
        explanation: '<header>, <article>, <nav> là semantic tags vì chúng mô tả ý nghĩa của content. <div> và <span> là non-semantic.',
        order: 4,
      },
    }),
    prisma.quizQuestion.upsert({
      where: { id: 'html-q5' },
      update: {},
      create: {
        id: 'html-q5',
        quizId: htmlQuiz.id,
        questionText: 'Attribute nào dùng để thêm alternative text cho image?',
        questionType: QuestionType.SINGLE_CHOICE,
        options: JSON.stringify([
          { id: 'a', text: 'title' },
          { id: 'b', text: 'alt' },
          { id: 'c', text: 'src' },
          { id: 'd', text: 'description' },
        ]),
        correctAnswer: JSON.stringify(['b']),
        explanation: 'Attribute "alt" cung cấp text thay thế khi image không load được và giúp accessibility.',
        order: 5,
      },
    }),
  ]);

  // JavaScript Basics Quiz
  const jsQuiz = await prisma.quiz.upsert({
    where: { lessonId: lessonMap['javascript-basics'].id },
    update: {},
    create: {
      lessonId: lessonMap['javascript-basics'].id,
      title: 'JavaScript Basics Quiz',
      description: 'Kiểm tra kiến thức JavaScript cơ bản',
      passThreshold: 70,
      retryLimit: 3,
      retryCooldown: 60,
    },
  });

  await Promise.all([
    prisma.quizQuestion.upsert({
      where: { id: 'js-q1' },
      update: {},
      create: {
        id: 'js-q1',
        quizId: jsQuiz.id,
        questionText: 'Cách nào đúng để khai báo biến trong JavaScript (ES6)?',
        questionType: QuestionType.SINGLE_CHOICE,
        options: JSON.stringify([
          { id: 'a', text: 'variable name = "value"' },
          { id: 'b', text: 'let name = "value"' },
          { id: 'c', text: 'v name = "value"' },
          { id: 'd', text: 'string name = "value"' },
        ]),
        correctAnswer: JSON.stringify(['b']),
        explanation: 'Trong ES6, dùng let hoặc const để khai báo biến. var cũng hoạt động nhưng không khuyến khích.',
        order: 1,
      },
    }),
    prisma.quizQuestion.upsert({
      where: { id: 'js-q2' },
      update: {},
      create: {
        id: 'js-q2',
        quizId: jsQuiz.id,
        questionText: 'Kết quả của: typeof null',
        questionType: QuestionType.SINGLE_CHOICE,
        options: JSON.stringify([
          { id: 'a', text: '"null"' },
          { id: 'b', text: '"undefined"' },
          { id: 'c', text: '"object"' },
          { id: 'd', text: '"number"' },
        ]),
        correctAnswer: JSON.stringify(['c']),
        explanation: 'Đây là bug nổi tiếng của JavaScript. typeof null trả về "object" mặc dù null không phải object.',
        order: 2,
      },
    }),
    prisma.quizQuestion.upsert({
      where: { id: 'js-q3' },
      update: {},
      create: {
        id: 'js-q3',
        quizId: jsQuiz.id,
        questionText: 'Sự khác biệt giữa == và === là gì?',
        questionType: QuestionType.SINGLE_CHOICE,
        options: JSON.stringify([
          { id: 'a', text: 'Không có sự khác biệt' },
          { id: 'b', text: '== so sánh value, === so sánh cả value và type' },
          { id: 'c', text: '=== nhanh hơn ==' },
          { id: 'd', text: '== dùng cho string, === dùng cho number' },
        ]),
        correctAnswer: JSON.stringify(['b']),
        explanation: '== (loose equality) chỉ so sánh giá trị sau khi type coercion. === (strict equality) so sánh cả giá trị và kiểu dữ liệu.',
        order: 3,
      },
    }),
    prisma.quizQuestion.upsert({
      where: { id: 'js-q4' },
      update: {},
      create: {
        id: 'js-q4',
        quizId: jsQuiz.id,
        questionText: 'Kết quả của: [1, 2, 3].push(4) là gì?',
        questionType: QuestionType.SINGLE_CHOICE,
        options: JSON.stringify([
          { id: 'a', text: '[1, 2, 3, 4]' },
          { id: 'b', text: '4' },
          { id: 'c', text: 'undefined' },
          { id: 'd', text: '[4, 1, 2, 3]' },
        ]),
        correctAnswer: JSON.stringify(['b']),
        explanation: 'push() thêm element vào cuối array và trả về LENGTH mới của array (4), không phải array mới.',
        order: 4,
      },
    }),
    prisma.quizQuestion.upsert({
      where: { id: 'js-q5' },
      update: {},
      create: {
        id: 'js-q5',
        quizId: jsQuiz.id,
        questionText: 'Arrow function khác regular function ở điểm nào?',
        questionType: QuestionType.MULTIPLE_CHOICE,
        options: JSON.stringify([
          { id: 'a', text: 'Không có this riêng' },
          { id: 'b', text: 'Không thể dùng làm constructor' },
          { id: 'c', text: 'Không có arguments object' },
          { id: 'd', text: 'Chạy nhanh hơn' },
        ]),
        correctAnswer: JSON.stringify(['a', 'b', 'c']),
        explanation: 'Arrow functions không có this, arguments, và không thể dùng với new. Performance tương đương regular function.',
        order: 5,
      },
    }),
  ]);

  // ES6 Features Quiz
  const es6Quiz = await prisma.quiz.upsert({
    where: { lessonId: lessonMap['es6-features'].id },
    update: {},
    create: {
      lessonId: lessonMap['es6-features'].id,
      title: 'ES6+ Features Quiz',
      description: 'Kiểm tra kiến thức về ES6 và các tính năng JavaScript hiện đại',
      passThreshold: 70,
      retryLimit: 3,
      retryCooldown: 60,
    },
  });

  await Promise.all([
    prisma.quizQuestion.upsert({
      where: { id: 'es6-q1' },
      update: {},
      create: {
        id: 'es6-q1',
        quizId: es6Quiz.id,
        questionText: 'Kết quả của destructuring sau: const {a, b} = {a: 1, b: 2, c: 3}',
        questionType: QuestionType.SINGLE_CHOICE,
        options: JSON.stringify([
          { id: 'a', text: 'a = 1, b = 2' },
          { id: 'b', text: 'a = 1, b = 2, c = 3' },
          { id: 'c', text: 'Error' },
          { id: 'd', text: 'a = undefined, b = undefined' },
        ]),
        correctAnswer: JSON.stringify(['a']),
        explanation: 'Destructuring chỉ extract các properties được khai báo. c không được khai báo nên bị bỏ qua.',
        order: 1,
      },
    }),
    prisma.quizQuestion.upsert({
      where: { id: 'es6-q2' },
      update: {},
      create: {
        id: 'es6-q2',
        quizId: es6Quiz.id,
        questionText: 'Spread operator (...) có thể dùng để làm gì?',
        questionType: QuestionType.MULTIPLE_CHOICE,
        options: JSON.stringify([
          { id: 'a', text: 'Clone array' },
          { id: 'b', text: 'Merge objects' },
          { id: 'c', text: 'Pass array elements as function arguments' },
          { id: 'd', text: 'Tất cả các đáp án trên' },
        ]),
        correctAnswer: JSON.stringify(['a', 'b', 'c']),
        explanation: 'Spread operator có thể dùng cho cả 3 mục đích: [...arr], {...obj}, và fn(...args).',
        order: 2,
      },
    }),
    prisma.quizQuestion.upsert({
      where: { id: 'es6-q3' },
      update: {},
      create: {
        id: 'es6-q3',
        quizId: es6Quiz.id,
        questionText: 'Template literal sử dụng ký tự nào?',
        questionType: QuestionType.SINGLE_CHOICE,
        options: JSON.stringify([
          { id: 'a', text: 'Single quotes (\'\')' },
          { id: 'b', text: 'Double quotes ("")' },
          { id: 'c', text: 'Backticks (``)' },
          { id: 'd', text: 'Parentheses (())' },
        ]),
        correctAnswer: JSON.stringify(['c']),
        explanation: 'Template literals sử dụng backticks (`) và cho phép string interpolation với ${expression}.',
        order: 3,
      },
    }),
    prisma.quizQuestion.upsert({
      where: { id: 'es6-q4' },
      update: {},
      create: {
        id: 'es6-q4',
        quizId: es6Quiz.id,
        questionText: 'Sự khác biệt giữa let và const là gì?',
        questionType: QuestionType.SINGLE_CHOICE,
        options: JSON.stringify([
          { id: 'a', text: 'let có thể reassign, const không thể' },
          { id: 'b', text: 'const nhanh hơn let' },
          { id: 'c', text: 'let dùng cho number, const dùng cho string' },
          { id: 'd', text: 'Không có sự khác biệt' },
        ]),
        correctAnswer: JSON.stringify(['a']),
        explanation: 'const không cho phép reassign giá trị sau khi khai báo. Nhưng với object/array, vẫn có thể modify properties/elements.',
        order: 4,
      },
    }),
    prisma.quizQuestion.upsert({
      where: { id: 'es6-q5' },
      update: {},
      create: {
        id: 'es6-q5',
        quizId: es6Quiz.id,
        questionText: 'Default parameter trong function hoạt động thế nào?',
        questionType: QuestionType.SINGLE_CHOICE,
        options: JSON.stringify([
          { id: 'a', text: 'Chỉ áp dụng khi argument là undefined' },
          { id: 'b', text: 'Áp dụng khi argument là null hoặc undefined' },
          { id: 'c', text: 'Áp dụng khi argument là falsy' },
          { id: 'd', text: 'Luôn override argument được pass' },
        ]),
        correctAnswer: JSON.stringify(['a']),
        explanation: 'Default parameters chỉ áp dụng khi argument là undefined (hoặc không được pass). null vẫn là valid value.',
        order: 5,
      },
    }),
  ]);

  console.log('✅ Created quizzes with questions');

  // ============================================
  // 7. CREATE SAMPLE USER PROGRESS (for test user)
  // ============================================
  console.log('Creating sample user progress...');

  // Enroll test user in frontend path
  await prisma.userLearningPath.upsert({
    where: {
      userId_learningPathId: {
        userId: testUser.id,
        learningPathId: frontendPath.id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      learningPathId: frontendPath.id,
      currentLessonId: lessonMap['css-flexbox-grid'].id,
      aiRecommendations: JSON.stringify({
        suggestedStartPoint: 'html-basics',
        focusAreas: ['CSS Layout', 'JavaScript fundamentals'],
        estimatedCompletionWeeks: 12,
      }),
    },
  });

  // Add some completed lessons
  await Promise.all([
    prisma.userProgress.upsert({
      where: { userId_lessonId: { userId: testUser.id, lessonId: lessonMap['html-basics'].id } },
      update: {},
      create: {
        userId: testUser.id,
        lessonId: lessonMap['html-basics'].id,
        status: 'COMPLETED',
        startedAt: new Date('2025-01-01'),
        completedAt: new Date('2025-01-02'),
        timeSpentSeconds: 3600,
      },
    }),
    prisma.userProgress.upsert({
      where: { userId_lessonId: { userId: testUser.id, lessonId: lessonMap['css-fundamentals'].id } },
      update: {},
      create: {
        userId: testUser.id,
        lessonId: lessonMap['css-fundamentals'].id,
        status: 'COMPLETED',
        startedAt: new Date('2025-01-03'),
        completedAt: new Date('2025-01-05'),
        timeSpentSeconds: 5400,
      },
    }),
    prisma.userProgress.upsert({
      where: { userId_lessonId: { userId: testUser.id, lessonId: lessonMap['css-flexbox-grid'].id } },
      update: {},
      create: {
        userId: testUser.id,
        lessonId: lessonMap['css-flexbox-grid'].id,
        status: 'IN_PROGRESS',
        startedAt: new Date('2025-01-10'),
        timeSpentSeconds: 1800,
      },
    }),
  ]);

  // Add quiz results
  await prisma.quizResult.upsert({
    where: { id: 'test-quiz-result-1' },
    update: {},
    create: {
      id: 'test-quiz-result-1',
      userId: testUser.id,
      quizId: htmlQuiz.id,
      score: 80,
      passed: true,
      answers: JSON.stringify([
        { questionId: 'html-q1', selected: ['a'], correct: true },
        { questionId: 'html-q2', selected: ['c'], correct: true },
        { questionId: 'html-q3', selected: ['b'], correct: true },
        { questionId: 'html-q4', selected: ['b', 'd', 'e'], correct: true },
        { questionId: 'html-q5', selected: ['a'], correct: false },
      ]),
      attemptNumber: 1,
      timeSpentSecs: 300,
    },
  });

  // Add onboarding data for test user
  await prisma.onboardingData.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      careerGoal: CareerGoal.FRONTEND,
      priorKnowledge: JSON.stringify(['html', 'css']),
      learningBackground: LearningBackground.SELF_TAUGHT,
      hoursPerWeek: 10,
    },
  });

  console.log('✅ Created sample user progress');

  // ============================================
  // 8. CREATE SAMPLE LEARNING SESSIONS
  // ============================================
  console.log('Creating sample learning sessions...');

  const now = new Date();
  const sessions = [];

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Random activity for each day (some days have no activity)
    if (Math.random() > 0.3) {
      const duration = Math.floor(Math.random() * 7200) + 1800; // 30 mins to 2.5 hours
      sessions.push({
        userId: testUser.id,
        lessonId: lessons[Math.floor(Math.random() * lessons.length)].id,
        activityType: 'LESSON_VIEW' as const,
        startedAt: date,
        endedAt: new Date(date.getTime() + duration * 1000),
        durationSeconds: duration,
      });
    }
  }

  await prisma.learningSession.createMany({
    data: sessions,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${sessions.length} learning sessions`);

  // ============================================
  // 9. CREATE BACKEND NODEJS LEARNING PATH
  // ============================================
  console.log('Creating Backend NodeJS learning path...');

  // Backend-specific lessons
  const backendLessons = await Promise.all([
    prisma.lesson.upsert({
      where: { slug: 'node-introduction' },
      update: {},
      create: {
        slug: 'node-introduction',
        title: 'Node.js Introduction',
        summary: `
# Node.js Introduction

Node.js cho phép chạy JavaScript bên ngoài browser — trên server.

## Bạn sẽ học được gì?

- Node.js là gì và tại sao nó ra đời
- V8 Engine và Event Loop
- Modules system (CommonJS vs ESM)
- Built-in modules: fs, path, http
- npm và package.json

## Tại sao chọn Node.js?

- Cùng ngôn ngữ JavaScript cho cả frontend và backend
- Non-blocking I/O — xử lý nhiều request cùng lúc
- Ecosystem lớn nhất (npm registry)
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Node.js Official Docs', url: 'https://nodejs.org/en/docs/', type: 'documentation' },
          { title: 'Node.js Crash Course - Traversy Media', url: 'https://www.youtube.com/watch?v=fBNz5xF-Kx4', type: 'video' },
        ]),
        estimatedMins: 60,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'express-basics' },
      update: {},
      create: {
        slug: 'express-basics',
        title: 'Express.js Basics',
        summary: `
# Express.js Basics

Express là framework web phổ biến nhất cho Node.js.

## Bạn sẽ học được gì?

- Setting up Express server
- Routing: GET, POST, PUT, DELETE
- Middleware concept và usage
- Request/Response objects
- Error handling middleware
- Static files serving

## Practical Examples

- REST API cho todo list
- Middleware chain (logging, auth, validation)
- Error handling best practices
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Express.js Docs', url: 'https://expressjs.com/', type: 'documentation' },
          { title: 'Express Crash Course', url: 'https://www.youtube.com/watch?v=SccSCuHhOw0', type: 'video' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'sql-fundamentals' },
      update: {},
      create: {
        slug: 'sql-fundamentals',
        title: 'SQL Fundamentals',
        summary: `
# SQL Fundamentals

SQL (Structured Query Language) là ngôn ngữ tiêu chuẩn để làm việc với relational databases.

## Bạn sẽ học được gì?

- Database concepts: tables, rows, columns
- CRUD operations: SELECT, INSERT, UPDATE, DELETE
- Filtering: WHERE, ORDER BY, LIMIT
- Joins: INNER, LEFT, RIGHT
- Aggregation: COUNT, SUM, AVG, GROUP BY
- Indexes và performance basics

## Tại sao SQL quan trọng?

- Hầu hết applications đều dùng relational database
- SQL knowledge transferable giữa PostgreSQL, MySQL, SQLite
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'PostgreSQL Tutorial', url: 'https://www.postgresqltutorial.com/', type: 'documentation' },
          { title: 'SQL Tutorial - W3Schools', url: 'https://www.w3schools.com/sql/', type: 'tutorial' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'prisma-orm' },
      update: {},
      create: {
        slug: 'prisma-orm',
        title: 'Prisma ORM',
        summary: `
# Prisma ORM

Prisma là modern ORM cho Node.js và TypeScript — type-safe database access.

## Bạn sẽ học được gì?

- Prisma Schema Language (PSL)
- Models, relations, enums
- Prisma Client: CRUD operations
- Migrations: prisma migrate dev
- Seeding data
- Prisma Studio (GUI)

## Tại sao Prisma?

- Auto-generated TypeScript types → compile-time safety
- Intuitive API: prisma.user.findMany()
- Migration system tích hợp
- Hỗ trợ PostgreSQL, MySQL, SQLite, MongoDB
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Prisma Docs', url: 'https://www.prisma.io/docs', type: 'documentation' },
          { title: 'Prisma Crash Course', url: 'https://www.youtube.com/watch?v=RebA5J-rlwg', type: 'video' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'nestjs-introduction' },
      update: {},
      create: {
        slug: 'nestjs-introduction',
        title: 'NestJS Introduction',
        summary: `
# NestJS Introduction

NestJS là framework backend cho Node.js, lấy cảm hứng từ Angular.

## Bạn sẽ học được gì?

- NestJS architecture: Modules, Controllers, Services
- Decorators: @Controller, @Get, @Post, @Injectable
- Request lifecycle
- Pipes và Validation
- Exception filters

## Tại sao NestJS?

- Opinionated structure → dễ maintain large projects
- Built-in TypeScript support
- Dependency Injection (DI) pattern
- Tích hợp sẵn nhiều tools (validation, auth, docs)
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'NestJS Official Docs', url: 'https://docs.nestjs.com/', type: 'documentation' },
          { title: 'NestJS Crash Course', url: 'https://www.youtube.com/watch?v=wqhNoDE6pb4', type: 'video' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'nestjs-modules-di' },
      update: {},
      create: {
        slug: 'nestjs-modules-di',
        title: 'NestJS Modules & Dependency Injection',
        summary: `
# NestJS Modules & Dependency Injection

Hiểu sâu cách NestJS tổ chức code với Modules và Dependency Injection pattern.

## Bạn sẽ học được gì?

- Module system: imports, exports, providers
- @Global() modules
- Dependency Injection (DI) container
- Custom providers: useClass, useValue, useFactory
- Circular dependency resolution
- Dynamic modules

## Design Patterns

- Repository pattern với Prisma
- Service layer pattern
- Guard pattern cho authentication
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'NestJS - Modules', url: 'https://docs.nestjs.com/modules', type: 'documentation' },
          { title: 'NestJS - Custom Providers', url: 'https://docs.nestjs.com/fundamentals/custom-providers', type: 'documentation' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    // Integration lessons (for Fullstack path)
    prisma.lesson.upsert({
      where: { slug: 'rest-api-design' },
      update: {},
      create: {
        slug: 'rest-api-design',
        title: 'REST API Design',
        summary: `
# REST API Design

Thiết kế RESTful APIs chuẩn, dễ sử dụng và maintain.

## Bạn sẽ học được gì?

- REST principles: resources, HTTP methods, status codes
- URL naming conventions
- Request/Response format (JSON)
- Pagination, filtering, sorting
- API versioning
- Error handling standards
- CORS configuration

## Best Practices

- Dùng nouns cho resources: /users, /posts
- HTTP methods đúng ngữ cảnh: GET (read), POST (create), PUT (update), DELETE
- Status codes rõ ràng: 200, 201, 400, 401, 404, 500
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'REST API Best Practices', url: 'https://restfulapi.net/', type: 'documentation' },
          { title: 'RESTful API Design - Microsoft', url: 'https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design', type: 'documentation' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'fullstack-project' },
      update: {},
      create: {
        slug: 'fullstack-project',
        title: 'Fullstack Project',
        summary: `
# Fullstack Project

Xây dựng 1 ứng dụng fullstack hoàn chỉnh từ A đến Z.

## Project: Task Management App

### Frontend (React)
- Components: TaskList, TaskForm, TaskItem
- State management với Zustand
- API integration với React Query
- Routing với React Router

### Backend (NestJS)
- REST API: CRUD tasks
- Authentication với JWT
- Database với Prisma + PostgreSQL
- Validation với class-validator

### DevOps
- Docker setup
- Environment variables
- Deployment lên Vercel + Railway

## Kết quả

Sau project này, bạn có 1 ứng dụng fullstack hoàn chỉnh để bỏ vào portfolio.
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Fullstack Tutorial - The Odin Project', url: 'https://www.theodinproject.com/paths/full-stack-javascript', type: 'course' },
        ]),
        estimatedMins: 180,
        isPublished: true,
      },
    }),
  ]);

  console.log(`✅ Created ${backendLessons.length} backend/fullstack lessons`);

  // Backend lesson map
  const backendLessonMap = Object.fromEntries(backendLessons.map(l => [l.slug, l]));

  // ── Backend NodeJS Path ──────────────────────────────────────────────────
  const backendPath = await prisma.learningPath.upsert({
    where: { slug: 'backend-nodejs' },
    update: {},
    create: {
      name: 'Backend NodeJS Developer',
      slug: 'backend-nodejs',
      description: 'Lộ trình hoàn chỉnh để trở thành Backend Developer với Node.js, Express, và NestJS. Từ cơ bản đến xây dựng APIs production-ready.',
      icon: 'server',
      difficulty: 'beginner',
      estimatedHours: 80,
      isPublished: true,
      order: 2,
    },
  });

  // Tracks for Backend path
  const backendTracks = await Promise.all([
    prisma.track.upsert({
      where: { id: 'track-nodejs-basics' },
      update: {},
      create: {
        id: 'track-nodejs-basics',
        learningPathId: backendPath.id,
        name: 'Node.js Basics',
        description: 'Nền tảng Node.js và Express để xây dựng web server',
        order: 1,
        isOptional: false,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-database-sql' },
      update: {},
      create: {
        id: 'track-database-sql',
        learningPathId: backendPath.id,
        name: 'Database & SQL',
        description: 'Làm việc với PostgreSQL và Prisma ORM',
        order: 2,
        isOptional: false,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-nestjs-framework' },
      update: {},
      create: {
        id: 'track-nestjs-framework',
        learningPathId: backendPath.id,
        name: 'NestJS Framework',
        description: 'Framework backend hiện đại với TypeScript',
        order: 3,
        isOptional: false,
      },
    }),
  ]);

  console.log(`✅ Created ${backendTracks.length} tracks for Backend path`);

  // Link backend lessons to tracks
  await Promise.all([
    // Node.js Basics Track
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-nodejs-basics', lessonId: backendLessonMap['node-introduction'].id } },
      update: {},
      create: { trackId: 'track-nodejs-basics', lessonId: backendLessonMap['node-introduction'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-nodejs-basics', lessonId: backendLessonMap['express-basics'].id } },
      update: {},
      create: { trackId: 'track-nodejs-basics', lessonId: backendLessonMap['express-basics'].id, order: 2 },
    }),

    // Database & SQL Track
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-database-sql', lessonId: backendLessonMap['sql-fundamentals'].id } },
      update: {},
      create: { trackId: 'track-database-sql', lessonId: backendLessonMap['sql-fundamentals'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-database-sql', lessonId: backendLessonMap['prisma-orm'].id } },
      update: {},
      create: { trackId: 'track-database-sql', lessonId: backendLessonMap['prisma-orm'].id, order: 2 },
    }),

    // NestJS Framework Track
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-nestjs-framework', lessonId: backendLessonMap['nestjs-introduction'].id } },
      update: {},
      create: { trackId: 'track-nestjs-framework', lessonId: backendLessonMap['nestjs-introduction'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-nestjs-framework', lessonId: backendLessonMap['nestjs-modules-di'].id } },
      update: {},
      create: { trackId: 'track-nestjs-framework', lessonId: backendLessonMap['nestjs-modules-di'].id, order: 2 },
    }),
  ]);

  console.log('✅ Linked backend lessons to tracks');

  // ── Fullstack Developer Path ─────────────────────────────────────────────
  console.log('Creating Fullstack Developer learning path...');

  const fullstackPath = await prisma.learningPath.upsert({
    where: { slug: 'fullstack-developer' },
    update: {},
    create: {
      name: 'Fullstack Developer',
      slug: 'fullstack-developer',
      description: 'Lộ trình kết hợp Frontend và Backend để trở thành Fullstack Developer. Reuse kiến thức từ cả 2 paths, thêm phần integration.',
      icon: 'layers',
      difficulty: 'intermediate',
      estimatedHours: 150,
      isPublished: true,
      order: 3,
    },
  });

  // Tracks for Fullstack path — reuse lessons from Frontend + Backend
  const fullstackTracks = await Promise.all([
    prisma.track.upsert({
      where: { id: 'track-fullstack-frontend' },
      update: {},
      create: {
        id: 'track-fullstack-frontend',
        learningPathId: fullstackPath.id,
        name: 'Frontend Basics',
        description: 'Nền tảng HTML, CSS, JavaScript cho frontend',
        order: 1,
        isOptional: false,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-fullstack-backend' },
      update: {},
      create: {
        id: 'track-fullstack-backend',
        learningPathId: fullstackPath.id,
        name: 'Backend Basics',
        description: 'Node.js và Express cho backend',
        order: 2,
        isOptional: false,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-fullstack-integration' },
      update: {},
      create: {
        id: 'track-fullstack-integration',
        learningPathId: fullstackPath.id,
        name: 'Integration',
        description: 'Kết nối frontend và backend thành ứng dụng hoàn chỉnh',
        order: 3,
        isOptional: false,
      },
    }),
  ]);

  console.log(`✅ Created ${fullstackTracks.length} tracks for Fullstack path`);

  // Link lessons to Fullstack tracks — reusing existing lessons
  await Promise.all([
    // Frontend Basics Track — reuse from Frontend path
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-frontend', lessonId: lessonMap['html-basics'].id } },
      update: {},
      create: { trackId: 'track-fullstack-frontend', lessonId: lessonMap['html-basics'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-frontend', lessonId: lessonMap['css-fundamentals'].id } },
      update: {},
      create: { trackId: 'track-fullstack-frontend', lessonId: lessonMap['css-fundamentals'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-frontend', lessonId: lessonMap['javascript-basics'].id } },
      update: {},
      create: { trackId: 'track-fullstack-frontend', lessonId: lessonMap['javascript-basics'].id, order: 3 },
    }),

    // Backend Basics Track — reuse from Backend path
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-backend', lessonId: backendLessonMap['node-introduction'].id } },
      update: {},
      create: { trackId: 'track-fullstack-backend', lessonId: backendLessonMap['node-introduction'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-backend', lessonId: backendLessonMap['express-basics'].id } },
      update: {},
      create: { trackId: 'track-fullstack-backend', lessonId: backendLessonMap['express-basics'].id, order: 2 },
    }),

    // Integration Track — new lessons
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-integration', lessonId: backendLessonMap['rest-api-design'].id } },
      update: {},
      create: { trackId: 'track-fullstack-integration', lessonId: backendLessonMap['rest-api-design'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-integration', lessonId: backendLessonMap['fullstack-project'].id } },
      update: {},
      create: { trackId: 'track-fullstack-integration', lessonId: backendLessonMap['fullstack-project'].id, order: 2 },
    }),
  ]);

  console.log('✅ Linked fullstack lessons to tracks');

  // ── Prerequisites for new lessons ────────────────────────────────────────
  console.log('Creating prerequisites for backend/fullstack lessons...');

  await Promise.all([
    // Express requires Node.js
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: backendLessonMap['express-basics'].id, prerequisiteId: backendLessonMap['node-introduction'].id } },
      update: {},
      create: { lessonId: backendLessonMap['express-basics'].id, prerequisiteId: backendLessonMap['node-introduction'].id },
    }),
    // Prisma requires SQL
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: backendLessonMap['prisma-orm'].id, prerequisiteId: backendLessonMap['sql-fundamentals'].id } },
      update: {},
      create: { lessonId: backendLessonMap['prisma-orm'].id, prerequisiteId: backendLessonMap['sql-fundamentals'].id },
    }),
    // NestJS Intro requires Express
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: backendLessonMap['nestjs-introduction'].id, prerequisiteId: backendLessonMap['express-basics'].id } },
      update: {},
      create: { lessonId: backendLessonMap['nestjs-introduction'].id, prerequisiteId: backendLessonMap['express-basics'].id },
    }),
    // NestJS Modules requires NestJS Intro
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: backendLessonMap['nestjs-modules-di'].id, prerequisiteId: backendLessonMap['nestjs-introduction'].id } },
      update: {},
      create: { lessonId: backendLessonMap['nestjs-modules-di'].id, prerequisiteId: backendLessonMap['nestjs-introduction'].id },
    }),
    // Fullstack Project requires REST API Design
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: backendLessonMap['fullstack-project'].id, prerequisiteId: backendLessonMap['rest-api-design'].id } },
      update: {},
      create: { lessonId: backendLessonMap['fullstack-project'].id, prerequisiteId: backendLessonMap['rest-api-design'].id },
    }),
  ]);

  console.log('✅ Created backend/fullstack prerequisites');

  // ============================================
  // DONE
  // ============================================
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\nCreated:');
  console.log(`  - 2 users (admin + test)`);
  console.log(`  - 3 learning paths (Frontend ReactJS, Backend NodeJS, Fullstack)`);
  console.log(`  - ${frontendTracks.length + backendTracks.length + fullstackTracks.length} tracks total`);
  console.log(`  - ${lessons.length + backendLessons.length} lessons total`);
  console.log(`  - 3 quizzes with 15 questions total`);
  console.log(`  - Sample progress data for test user`);
  console.log('\nTest accounts:');
  console.log(`  - Admin: admin@devpathlearn.com`);
  console.log(`  - User:  test@devpathlearn.com`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
