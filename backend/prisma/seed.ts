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

    prisma.lesson.upsert({
      where: { slug: 'javascript-scope-closures' },
      update: {},
      create: {
        slug: 'javascript-scope-closures',
        title: 'Scope, Closures & This',
        summary: `
# Scope, Closures & This

Hiểu cách JavaScript quản lý phạm vi biến, closures, và từ khóa \`this\` — nền tảng để hiểu React hooks và ES6 classes.

## Bạn sẽ học được gì?

- Global scope, function scope, và block scope (let/const vs var)
- Lexical scoping và scope chain
- Closures: hàm ghi nhớ biến từ scope bên ngoài
- Ứng dụng closures: data privacy, factory functions, event handlers
- Từ khóa \`this\` trong các ngữ cảnh khác nhau
- Cách \`bind\`, \`call\`, \`apply\` thay đổi \`this\`
- Tại sao arrow functions không có \`this\` riêng

## Tại sao quan trọng?

Closures là cơ chế đằng sau React hooks (useState "nhớ" giá trị qua các lần render). Hiểu \`this\` giúp bạn phân biệt function declaration vs arrow function khi viết event handlers trong React.
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'JavaScript.info - Closure', url: 'https://javascript.info/closure', type: 'documentation' },
          { title: 'MDN - Closures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures', type: 'documentation' },
          { title: 'JavaScript.info - The old var', url: 'https://javascript.info/var', type: 'documentation' },
          { title: 'Fireship - JavaScript this Keyword', url: 'https://www.youtube.com/watch?v=YOlr79NaAtQ', type: 'video' },
        ]),
        estimatedMins: 120,
        isPublished: false,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'javascript-array-methods' },
      update: {},
      create: {
        slug: 'javascript-array-methods',
        title: 'Array Methods & Functional Patterns',
        summary: `
# Array Methods & Functional Patterns

Nắm vững các phương thức array hiện đại — công cụ bạn sẽ dùng hàng ngày khi render danh sách và xử lý dữ liệu trong React.

## Bạn sẽ học được gì?

- \`map()\`: biến đổi từng phần tử (render danh sách trong React)
- \`filter()\`: lọc phần tử theo điều kiện
- \`reduce()\`: gộp mảng thành một giá trị
- \`find()\` và \`findIndex()\`: tìm phần tử đầu tiên khớp
- \`some()\` và \`every()\`: kiểm tra điều kiện trên mảng
- \`sort()\` và \`slice()\` cho immutable data patterns
- Kết hợp chain: \`filter().map()\` và các patterns phổ biến

## Tại sao quan trọng?

Trong React, bạn sẽ viết \`items.map(item => <Card key={item.id} />)\` hàng trăm lần. Nắm vững array methods giúp bạn xử lý dữ liệu từ API, lọc danh sách, và render UI hiệu quả mà không cần vòng for truyền thống.
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'JavaScript.info - Array Methods', url: 'https://javascript.info/array-methods', type: 'documentation' },
          { title: 'MDN - Array.prototype.map()', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map', type: 'documentation' },
          { title: 'Fireship - Array Methods', url: 'https://www.youtube.com/watch?v=rRgD1yVwIvE', type: 'video' },
          { title: 'JavaScript Array Methods Tutorial - freeCodeCamp', url: 'https://www.freecodecamp.org/news/javascript-array-handbook/', type: 'tutorial' },
        ]),
        estimatedMins: 120,
        isPublished: false,
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
  // 4. CREATE LEARNING PATH: FRONTEND DEVELOPER
  // ============================================
  console.log('Creating Frontend Developer learning path...');

  const frontendPath = await prisma.learningPath.upsert({
    where: { slug: 'frontend-reactjs' },
    update: {},
    create: {
      name: 'Frontend Developer',
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

    // JavaScript Core Track (6 lessons)
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-javascript-core', lessonId: lessonMap['javascript-basics'].id } },
      update: { order: 1 },
      create: { trackId: 'track-javascript-core', lessonId: lessonMap['javascript-basics'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-javascript-core', lessonId: lessonMap['javascript-scope-closures'].id } },
      update: { order: 2 },
      create: { trackId: 'track-javascript-core', lessonId: lessonMap['javascript-scope-closures'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-javascript-core', lessonId: lessonMap['es6-features'].id } },
      update: { order: 3 },
      create: { trackId: 'track-javascript-core', lessonId: lessonMap['es6-features'].id, order: 3 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-javascript-core', lessonId: lessonMap['javascript-array-methods'].id } },
      update: { order: 4 },
      create: { trackId: 'track-javascript-core', lessonId: lessonMap['javascript-array-methods'].id, order: 4 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-javascript-core', lessonId: lessonMap['dom-manipulation'].id } },
      update: { order: 5 },
      create: { trackId: 'track-javascript-core', lessonId: lessonMap['dom-manipulation'].id, order: 5 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-javascript-core', lessonId: lessonMap['async-javascript'].id } },
      update: { order: 6 },
      create: { trackId: 'track-javascript-core', lessonId: lessonMap['async-javascript'].id, order: 6 },
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

  // Clean up old JS Core prerequisites that are now replaced by new chain
  await prisma.lessonPrerequisite.deleteMany({
    where: {
      OR: [
        { lessonId: lessonMap['es6-features'].id, prerequisiteId: lessonMap['javascript-basics'].id },
        { lessonId: lessonMap['dom-manipulation'].id, prerequisiteId: lessonMap['es6-features'].id },
      ],
    },
  });

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
    // Scope/Closures requires JS Basics
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['javascript-scope-closures'].id, prerequisiteId: lessonMap['javascript-basics'].id } },
      update: {},
      create: { lessonId: lessonMap['javascript-scope-closures'].id, prerequisiteId: lessonMap['javascript-basics'].id },
    }),
    // ES6 requires Scope/Closures
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['es6-features'].id, prerequisiteId: lessonMap['javascript-scope-closures'].id } },
      update: {},
      create: { lessonId: lessonMap['es6-features'].id, prerequisiteId: lessonMap['javascript-scope-closures'].id },
    }),
    // Array Methods requires ES6
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['javascript-array-methods'].id, prerequisiteId: lessonMap['es6-features'].id } },
      update: {},
      create: { lessonId: lessonMap['javascript-array-methods'].id, prerequisiteId: lessonMap['es6-features'].id },
    }),
    // DOM requires Array Methods
    prisma.lessonPrerequisite.upsert({
      where: { lessonId_prerequisiteId: { lessonId: lessonMap['dom-manipulation'].id, prerequisiteId: lessonMap['javascript-array-methods'].id } },
      update: {},
      create: { lessonId: lessonMap['dom-manipulation'].id, prerequisiteId: lessonMap['javascript-array-methods'].id },
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

  // Add onboarding round 1 data for test user
  await prisma.onboardingRound.upsert({
    where: {
      userId_roundNumber: {
        userId: testUser.id,
        roundNumber: 1,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      roundNumber: 1,
      answers: {
        careerGoal: CareerGoal.FRONTEND,
        priorKnowledge: ['html', 'css'],
        learningBackground: LearningBackground.SELF_TAUGHT,
        hoursPerWeek: 10,
      },
      completedAt: new Date(),
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

  // ── Backend Developer Path ──────────────────────────────────────────────────
  const backendPath = await prisma.learningPath.upsert({
    where: { slug: 'backend-developer' },
    update: {},
    create: {
      name: 'Backend Developer',
      slug: 'backend-developer',
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
  // 11. CREATE AI / DATA SCIENCE (PYTHON) LEARNING PATH
  // ============================================
  console.log('Creating AI / Data Science (Python) learning path...');

  // AI/Python Learning Path
  await prisma.learningPath.upsert({
    where: { slug: 'ai-python' },
    update: {},
    create: {
      name: 'AI / Data Science (Python)',
      slug: 'ai-python',
      description: 'Lộ trình học AI và Data Science với Python. Từ Python cơ bản đến Machine Learning, phù hợp cho người mới bắt đầu.',
      icon: 'brain',
      difficulty: 'beginner',
      estimatedHours: 100,
      isPublished: true,
      order: 4,
    },
  });

  const aiPath = await prisma.learningPath.findUnique({
    where: { slug: 'ai-python' },
  });

  // AI/Python Tracks
  const aiTracks = await Promise.all([
    prisma.track.upsert({
      where: { id: 'track-ai-python-basics' },
      update: {},
      create: {
        id: 'track-ai-python-basics',
        learningPathId: aiPath!.id,
        name: 'Python Basics',
        description: 'Nền tảng lập trình Python cho AI và Data Science',
        order: 1,
        isOptional: false,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-ai-data-science' },
      update: {},
      create: {
        id: 'track-ai-data-science',
        learningPathId: aiPath!.id,
        name: 'Data Science với Python',
        description: 'Xử lý và phân tích dữ liệu với NumPy, Pandas, Matplotlib',
        order: 2,
        isOptional: false,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-ai-ml-basics' },
      update: {},
      create: {
        id: 'track-ai-ml-basics',
        learningPathId: aiPath!.id,
        name: 'Machine Learning Cơ Bản',
        description: 'Nhập môn Machine Learning với scikit-learn',
        order: 3,
        isOptional: false,
      },
    }),
  ]);

  console.log(`✅ Created ${aiTracks.length} tracks for AI/Python path`);

  // AI/Python Lessons
  const aiLessons = await Promise.all([
    prisma.lesson.upsert({
      where: { slug: 'python-introduction' },
      update: {},
      create: {
        slug: 'python-introduction',
        title: 'Python Introduction',
        summary: `
# Python Introduction

Python là ngôn ngữ lập trình phổ biến nhất cho AI và Data Science.

## Bạn sẽ học được gì?

- Cài đặt Python và setup môi trường
- Cú pháp cơ bản: variables, data types
- Control flow: if/else, loops
- Functions và modules
- Virtual environments (venv)

## Tại sao chọn Python?

- Cú pháp đơn giản, dễ đọc
- Ecosystem AI/ML lớn nhất (TensorFlow, PyTorch, scikit-learn)
- Cộng đồng khổng lồ và tài liệu phong phú
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Python Official Tutorial', url: 'https://docs.python.org/3/tutorial/', type: 'documentation' },
          { title: 'Python for Beginners - freeCodeCamp', url: 'https://www.youtube.com/watch?v=rfscVS0vtbw', type: 'video' },
        ]),
        estimatedMins: 60,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'python-data-structures' },
      update: {},
      create: {
        slug: 'python-data-structures',
        title: 'Python Data Structures',
        summary: `
# Python Data Structures

Các cấu trúc dữ liệu quan trọng trong Python.

## Bạn sẽ học được gì?

- Lists, Tuples, Sets
- Dictionaries và cách sử dụng
- List comprehensions
- String manipulation
- File I/O basics

## Tại sao cần nắm vững Data Structures?

- Nền tảng để xử lý dữ liệu trong Data Science
- Hiểu cách lưu trữ và truy xuất dữ liệu hiệu quả
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Python Data Structures - Docs', url: 'https://docs.python.org/3/tutorial/datastructures.html', type: 'documentation' },
          { title: 'Python Data Structures - Real Python', url: 'https://realpython.com/python-data-structures/', type: 'tutorial' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'numpy-pandas-basics' },
      update: {},
      create: {
        slug: 'numpy-pandas-basics',
        title: 'NumPy & Pandas Basics',
        summary: `
# NumPy & Pandas Basics

Hai thư viện quan trọng nhất cho Data Science trong Python.

## NumPy

- Arrays và vectorized operations
- Broadcasting
- Linear algebra basics
- Random number generation

## Pandas

- Series và DataFrame
- Đọc/ghi dữ liệu (CSV, Excel, JSON)
- Data selection, filtering, sorting
- GroupBy và aggregation
- Handling missing data

## Tại sao NumPy + Pandas?

- NumPy: tính toán số học nhanh (underlying cho mọi ML library)
- Pandas: xử lý dữ liệu tabular (giống Excel nhưng mạnh hơn)
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'NumPy Official Tutorial', url: 'https://numpy.org/doc/stable/user/quickstart.html', type: 'documentation' },
          { title: 'Pandas Getting Started', url: 'https://pandas.pydata.org/docs/getting_started/', type: 'documentation' },
          { title: 'NumPy & Pandas - Kaggle', url: 'https://www.kaggle.com/learn/pandas', type: 'course' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'data-visualization-python' },
      update: {},
      create: {
        slug: 'data-visualization-python',
        title: 'Data Visualization với Python',
        summary: `
# Data Visualization với Python

Trực quan hóa dữ liệu để khám phá insights.

## Bạn sẽ học được gì?

- Matplotlib: plots cơ bản (line, bar, scatter, histogram)
- Seaborn: statistical visualization đẹp hơn
- Pandas built-in plotting
- Customizing charts (colors, labels, legends)
- Chọn đúng loại chart cho đúng loại dữ liệu

## Tại sao Data Visualization quan trọng?

- "A picture is worth a thousand words" — nhìn chart hiểu ngay pattern
- EDA (Exploratory Data Analysis) là bước đầu tiên của mọi ML project
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Matplotlib Tutorial', url: 'https://matplotlib.org/stable/tutorials/index.html', type: 'documentation' },
          { title: 'Data Visualization - Kaggle', url: 'https://www.kaggle.com/learn/data-visualization', type: 'course' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'ml-fundamentals-python' },
      update: {},
      create: {
        slug: 'ml-fundamentals-python',
        title: 'Machine Learning Fundamentals',
        summary: `
# Machine Learning Fundamentals

Nhập môn Machine Learning với Python và scikit-learn.

## Bạn sẽ học được gì?

- ML là gì? Supervised vs Unsupervised Learning
- Train/Test split và Cross Validation
- Linear Regression và Logistic Regression
- Decision Trees và Random Forests
- Model evaluation: accuracy, precision, recall, F1
- Overfitting và cách phòng tránh

## Workflow ML cơ bản

1. Thu thập và làm sạch dữ liệu
2. EDA (Exploratory Data Analysis)
3. Feature engineering
4. Chọn model và training
5. Evaluation và tuning
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'scikit-learn Tutorial', url: 'https://scikit-learn.org/stable/tutorial/', type: 'documentation' },
          { title: 'ML Course - Andrew Ng (Coursera)', url: 'https://www.coursera.org/learn/machine-learning', type: 'course' },
          { title: 'Intro to ML - Kaggle', url: 'https://www.kaggle.com/learn/intro-to-machine-learning', type: 'course' },
        ]),
        estimatedMins: 150,
        isPublished: true,
      },
    }),
  ]);

  console.log(`✅ Created ${aiLessons.length} AI/Python lessons`);

  const aiLessonMap = Object.fromEntries(aiLessons.map(l => [l.slug, l]));

  // Link AI/Python lessons to tracks
  await Promise.all([
    // Python Basics Track
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-ai-python-basics', lessonId: aiLessonMap['python-introduction'].id } },
      update: {},
      create: { trackId: 'track-ai-python-basics', lessonId: aiLessonMap['python-introduction'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-ai-python-basics', lessonId: aiLessonMap['python-data-structures'].id } },
      update: {},
      create: { trackId: 'track-ai-python-basics', lessonId: aiLessonMap['python-data-structures'].id, order: 2 },
    }),

    // Data Science Track
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-ai-data-science', lessonId: aiLessonMap['numpy-pandas-basics'].id } },
      update: {},
      create: { trackId: 'track-ai-data-science', lessonId: aiLessonMap['numpy-pandas-basics'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-ai-data-science', lessonId: aiLessonMap['data-visualization-python'].id } },
      update: {},
      create: { trackId: 'track-ai-data-science', lessonId: aiLessonMap['data-visualization-python'].id, order: 2 },
    }),

    // Machine Learning Track
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-ai-ml-basics', lessonId: aiLessonMap['ml-fundamentals-python'].id } },
      update: {},
      create: { trackId: 'track-ai-ml-basics', lessonId: aiLessonMap['ml-fundamentals-python'].id, order: 1 },
    }),
  ]);

  console.log('✅ Linked AI/Python lessons to tracks');

  // ============================================
  // BACKEND PATH — EXTRA TRACKS
  // ============================================
  console.log('Adding extra tracks to Backend path...');

  const backendPathRecord = await prisma.learningPath.findUnique({
    where: { slug: 'backend-developer' },
  });

  if (!backendPathRecord) {
    throw new Error('Learning path backend-developer not found');
  }

  const backendExtraTracks = await Promise.all([
    prisma.track.upsert({
      where: { id: 'track-backend-auth-security' },
      update: {},
      create: {
        id: 'track-backend-auth-security',
        learningPathId: backendPathRecord.id,
        name: 'Authentication & Security',
        description: 'Bảo vệ API với JWT, password hashing, và security best practices.',
        order: 4,
        isOptional: false,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-backend-testing' },
      update: {},
      create: {
        id: 'track-backend-testing',
        learningPathId: backendPathRecord.id,
        name: 'Backend Testing',
        description: 'Unit, integration, và end-to-end testing cho backend services.',
        order: 5,
        isOptional: true,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-backend-advanced' },
      update: {},
      create: {
        id: 'track-backend-advanced',
        learningPathId: backendPathRecord.id,
        name: 'Advanced Backend',
        description: 'Redis cache, queue jobs, và kiến trúc microservices cơ bản.',
        order: 6,
        isOptional: true,
      },
    }),
  ]);

  console.log(`✅ Created ${backendExtraTracks.length} extra Backend tracks`);

  console.log('Adding extra lessons to Backend path...');

  const backendExtraLessons = await Promise.all([
    prisma.lesson.upsert({
      where: { slug: 'jwt-authentication' },
      update: {},
      create: {
        slug: 'jwt-authentication',
        title: 'JWT Authentication',
        summary: `
# JWT Authentication

Xây dựng hệ thống xác thực stateless cho API bằng JSON Web Token (JWT).

## Bạn sẽ học được gì?

- Cấu trúc token: header, payload, signature
- Access token và refresh token hoạt động như thế nào
- Tích hợp JWT strategy và guards trong NestJS
- Quản lý token expiration, rotation và logout flow
- Thiết kế auth middleware rõ ràng cho production API

## Best Practices

- Giữ payload tối giản, không lưu dữ liệu nhạy cảm
- Dùng access token ngắn hạn và refresh token an toàn
- Luôn validate issuer, audience và thời gian hết hạn
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'JWT Introduction', url: 'https://jwt.io/introduction', type: 'documentation' },
          { title: 'NestJS Authentication', url: 'https://docs.nestjs.com/security/authentication', type: 'documentation' },
          { title: 'RFC 7519: JSON Web Token', url: 'https://datatracker.ietf.org/doc/html/rfc7519', type: 'documentation' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'password-security' },
      update: {},
      create: {
        slug: 'password-security',
        title: 'Password Security',
        summary: `
# Password Security

Bảo mật mật khẩu đúng cách để giảm rủi ro lộ tài khoản và credential stuffing.

## Bạn sẽ học được gì?

- Hashing vs encryption và khi nào dùng mỗi loại
- Salt, pepper và cost factor với bcrypt
- Kiểm tra password strength và common password rules
- Reset password flow an toàn với token hết hạn
- Chính sách lockout và rate limit cho login endpoint

## Best Practices

- Không bao giờ lưu plaintext password
- Nâng cost factor định kỳ theo hạ tầng hiện tại
- Dùng generic error message để tránh lộ thông tin
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'OWASP Password Storage Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html', type: 'documentation' },
          { title: 'bcrypt package documentation', url: 'https://www.npmjs.com/package/bcrypt', type: 'documentation' },
          { title: 'NIST Digital Identity Guidelines', url: 'https://pages.nist.gov/800-63-3/', type: 'documentation' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'api-security-best-practices' },
      update: {},
      create: {
        slug: 'api-security-best-practices',
        title: 'API Security Best Practices',
        summary: `
# API Security Best Practices

Tăng mức an toàn cho REST API bằng defense-in-depth thay vì chỉ dựa vào auth.

## Bạn sẽ học được gì?

- OWASP API Security Top 10 và các rủi ro phổ biến
- Input validation, sanitization và output encoding
- Rate limiting, throttling, và abuse prevention
- Security headers, CORS, và HTTPS enforcement
- Audit logging và monitoring cho security events

## Best Practices

- Validate dữ liệu ở cả DTO và business layer
- Ẩn stack trace và thông tin nội bộ trong lỗi trả về
- Theo dõi bất thường bằng alerts và log correlation
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'OWASP API Security Top 10', url: 'https://owasp.org/API-Security/', type: 'documentation' },
          { title: 'MDN HTTP Security', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP', type: 'documentation' },
          { title: 'NestJS Rate Limiting', url: 'https://docs.nestjs.com/security/rate-limiting', type: 'documentation' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'jest-unit-testing' },
      update: {},
      create: {
        slug: 'jest-unit-testing',
        title: 'Jest Unit Testing',
        summary: `
# Jest Unit Testing

Viết unit tests để kiểm tra business logic nhanh, ổn định và dễ maintain.

## Bạn sẽ học được gì?

- Thiết lập Jest cho service/controller trong NestJS
- Mock dependencies bằng jest.fn và spyOn
- Viết test cho happy path và error path
- Assertion patterns cho async methods
- Tổ chức test data theo fixture để tái sử dụng

## Best Practices

- Unit test không nên gọi DB hoặc network thật
- Đặt tên test mô tả rõ input và expected behavior
- Giữ test độc lập để chạy song song an toàn
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Jest Getting Started', url: 'https://jestjs.io/docs/getting-started', type: 'documentation' },
          { title: 'NestJS Unit Testing', url: 'https://docs.nestjs.com/fundamentals/unit-testing', type: 'documentation' },
          { title: 'Jest Mock Functions', url: 'https://jestjs.io/docs/mock-functions', type: 'documentation' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'integration-testing-prisma' },
      update: {},
      create: {
        slug: 'integration-testing-prisma',
        title: 'Integration Testing với Prisma',
        summary: `
# Integration Testing với Prisma

Kiểm thử integration để xác nhận service làm việc đúng với Prisma và database.

## Bạn sẽ học được gì?

- Khác biệt giữa unit test và integration test
- Setup test database và seed dữ liệu test
- Chạy transaction-safe tests với cleanup rõ ràng
- Test repository/service queries qua Prisma Client
- Kiểm tra edge cases với constraint và relation data

## Best Practices

- Tách môi trường test DB riêng với production
- Reset trạng thái dữ liệu sau mỗi test suite
- Tránh mock quá nhiều trong integration tests
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Prisma Integration Testing', url: 'https://www.prisma.io/docs/orm/prisma-client/testing/integration-testing', type: 'documentation' },
          { title: 'Prisma Testing Overview', url: 'https://www.prisma.io/docs/orm/prisma-client/testing', type: 'documentation' },
          { title: 'NestJS Testing Fundamentals', url: 'https://docs.nestjs.com/fundamentals/testing', type: 'documentation' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'api-e2e-testing' },
      update: {},
      create: {
        slug: 'api-e2e-testing',
        title: 'API E2E Testing',
        summary: `
# API E2E Testing

E2E tests đảm bảo toàn bộ request flow hoạt động đúng từ HTTP layer đến database.

## Bạn sẽ học được gì?

- Setup e2e test app cho NestJS với Supertest
- Viết test cho auth flow và protected endpoints
- Kiểm thử validation errors và status codes
- Dùng test fixtures cho dữ liệu đầu vào nhất quán
- Chạy e2e trong CI để chống regression sớm

## Best Practices

- Ưu tiên critical user journeys trước khi mở rộng suite
- Giảm flaky bằng dữ liệu test deterministic
- Tách smoke e2e suite và full regression suite
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'NestJS End-to-End Testing', url: 'https://docs.nestjs.com/fundamentals/testing#end-to-end-testing', type: 'documentation' },
          { title: 'Supertest Repository', url: 'https://github.com/forwardemail/supertest', type: 'documentation' },
          { title: 'Jest Setup and Teardown', url: 'https://jestjs.io/docs/setup-teardown', type: 'documentation' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'caching-redis' },
      update: {},
      create: {
        slug: 'caching-redis',
        title: 'Caching với Redis',
        summary: `
# Caching với Redis

Tăng tốc API response time bằng cache layer, giảm tải database cho truy vấn lặp lại.

## Bạn sẽ học được gì?

- Cache-aside pattern cho endpoint đọc dữ liệu
- TTL, cache invalidation và versioning keys
- Tích hợp Redis với NestJS cache manager
- Theo dõi cache hit rate và latency metrics
- Tránh cache stampede khi traffic tăng đột biến

## Best Practices

- Chỉ cache dữ liệu đọc nhiều, thay đổi ít
- Đặt key naming convention rõ ràng theo domain
- Luôn có fallback khi Redis tạm thời unavailable
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Redis Documentation', url: 'https://redis.io/docs/latest/', type: 'documentation' },
          { title: 'NestJS Caching', url: 'https://docs.nestjs.com/techniques/caching', type: 'documentation' },
          { title: 'Redis University RU101', url: 'https://university.redis.io/courses/ru101/', type: 'course' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'queue-jobs-bullmq' },
      update: {},
      create: {
        slug: 'queue-jobs-bullmq',
        title: 'Queue Jobs với BullMQ',
        summary: `
# Queue Jobs với BullMQ

Xử lý tác vụ nền bất đồng bộ như gửi email, export report, và retry thất bại.

## Bạn sẽ học được gì?

- Khái niệm producer, worker và queue events
- Thiết lập BullMQ với Redis trong Node.js
- Delayed jobs, retries và backoff strategy
- Idempotent job processing để tránh xử lý trùng
- Giám sát queue health và failed jobs

## Best Practices

- Dùng job id để chống duplicate enqueue
- Tách queue theo loại workload để scale linh hoạt
- Ghi log đủ context để debug job failures nhanh
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'BullMQ Documentation', url: 'https://docs.bullmq.io/', type: 'documentation' },
          { title: 'NestJS Queues', url: 'https://docs.nestjs.com/techniques/queues', type: 'documentation' },
          { title: 'BullMQ Patterns', url: 'https://docs.bullmq.io/patterns', type: 'documentation' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'microservices-intro' },
      update: {},
      create: {
        slug: 'microservices-intro',
        title: 'Microservices Introduction',
        summary: `
# Microservices Introduction

Nhập môn kiến trúc microservices và khi nào nên dùng thay vì modular monolith.

## Bạn sẽ học được gì?

- Ưu và nhược điểm của microservices architecture
- Service boundaries và domain decomposition cơ bản
- Giao tiếp sync vs async giữa các services
- Data consistency: saga, outbox và eventual consistency
- Triển khai và observability trong hệ thống phân tán

## Best Practices

- Bắt đầu từ modular monolith trước khi tách service
- Định nghĩa contract rõ ràng giữa các teams/services
- Đầu tư logging, tracing, metrics ngay từ đầu
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'NestJS Microservices Basics', url: 'https://docs.nestjs.com/microservices/basics', type: 'documentation' },
          { title: 'Microservices by Martin Fowler', url: 'https://martinfowler.com/articles/microservices.html', type: 'article' },
          { title: 'Microservices.io Patterns', url: 'https://microservices.io/patterns/index.html', type: 'documentation' },
        ]),
        estimatedMins: 150,
        isPublished: true,
      },
    }),
  ]);

  console.log(`✅ Created ${backendExtraLessons.length} extra Backend lessons`);

  const backendExtraLessonMap = Object.fromEntries(backendExtraLessons.map(l => [l.slug, l]));

  const backendExtraTrackLessons = await Promise.all([
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-backend-auth-security', lessonId: backendExtraLessonMap['jwt-authentication'].id } },
      update: {},
      create: { trackId: 'track-backend-auth-security', lessonId: backendExtraLessonMap['jwt-authentication'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-backend-auth-security', lessonId: backendExtraLessonMap['password-security'].id } },
      update: {},
      create: { trackId: 'track-backend-auth-security', lessonId: backendExtraLessonMap['password-security'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-backend-auth-security', lessonId: backendExtraLessonMap['api-security-best-practices'].id } },
      update: {},
      create: { trackId: 'track-backend-auth-security', lessonId: backendExtraLessonMap['api-security-best-practices'].id, order: 3 },
    }),

    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-backend-testing', lessonId: backendExtraLessonMap['jest-unit-testing'].id } },
      update: {},
      create: { trackId: 'track-backend-testing', lessonId: backendExtraLessonMap['jest-unit-testing'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-backend-testing', lessonId: backendExtraLessonMap['integration-testing-prisma'].id } },
      update: {},
      create: { trackId: 'track-backend-testing', lessonId: backendExtraLessonMap['integration-testing-prisma'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-backend-testing', lessonId: backendExtraLessonMap['api-e2e-testing'].id } },
      update: {},
      create: { trackId: 'track-backend-testing', lessonId: backendExtraLessonMap['api-e2e-testing'].id, order: 3 },
    }),

    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-backend-advanced', lessonId: backendExtraLessonMap['caching-redis'].id } },
      update: {},
      create: { trackId: 'track-backend-advanced', lessonId: backendExtraLessonMap['caching-redis'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-backend-advanced', lessonId: backendExtraLessonMap['queue-jobs-bullmq'].id } },
      update: {},
      create: { trackId: 'track-backend-advanced', lessonId: backendExtraLessonMap['queue-jobs-bullmq'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-backend-advanced', lessonId: backendExtraLessonMap['microservices-intro'].id } },
      update: {},
      create: { trackId: 'track-backend-advanced', lessonId: backendExtraLessonMap['microservices-intro'].id, order: 3 },
    }),
  ]);

  console.log(`✅ Linked ${backendExtraTrackLessons.length} extra Backend lessons to tracks`);

  // ============================================
  // FULLSTACK PATH — EXTRA TRACKS
  // ============================================
  console.log('Adding extra tracks to Fullstack path...');

  const fullstackPathRecord = await prisma.learningPath.findUnique({
    where: { slug: 'fullstack-developer' },
  });

  if (!fullstackPathRecord) {
    throw new Error('Learning path fullstack-developer not found');
  }

  const fullstackExtraTracks = await Promise.all([
    prisma.track.upsert({
      where: { id: 'track-fullstack-devops' },
      update: {},
      create: {
        id: 'track-fullstack-devops',
        learningPathId: fullstackPathRecord.id,
        name: 'DevOps Basics',
        description: 'Docker, CI/CD, và deployment nền tảng cho Fullstack Developer.',
        order: 4,
        isOptional: false,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-fullstack-project-real' },
      update: {},
      create: {
        id: 'track-fullstack-project-real',
        learningPathId: fullstackPathRecord.id,
        name: 'Real-world Project',
        description: 'Quy trình build MVP thực tế từ planning đến production checklist.',
        order: 5,
        isOptional: false,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-fullstack-career' },
      update: {},
      create: {
        id: 'track-fullstack-career',
        learningPathId: fullstackPathRecord.id,
        name: 'Career & Job Hunting',
        description: 'Chuẩn bị hồ sơ, portfolio và kỹ năng phỏng vấn cho vị trí Fullstack.',
        order: 6,
        isOptional: true,
      },
    }),
  ]);

  console.log(`✅ Created ${fullstackExtraTracks.length} extra Fullstack tracks`);

  console.log('Adding extra lessons to Fullstack path...');

  const fullstackExtraLessons = await Promise.all([
    prisma.lesson.upsert({
      where: { slug: 'docker-basics' },
      update: {},
      create: {
        slug: 'docker-basics',
        title: 'Docker Basics',
        summary: `
# Docker Basics

Docker giúp đóng gói ứng dụng theo môi trường nhất quán từ local đến production.

## Bạn sẽ học được gì?

- Docker image, container và registry hoạt động như thế nào
- Viết Dockerfile tối ưu cho Node.js app
- Quản lý multi-service bằng Docker Compose
- Mount volumes, networking và environment variables
- Debug container logs và xử lý lỗi thường gặp

## Best Practices

- Dùng image base nhẹ và rõ version
- Tách build stage và runtime stage để giảm size
- Không hardcode secrets trong Dockerfile hoặc image
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Docker Overview', url: 'https://docs.docker.com/get-started/docker-overview/', type: 'documentation' },
          { title: 'Dockerfile Reference', url: 'https://docs.docker.com/reference/dockerfile/', type: 'documentation' },
          { title: 'Docker Compose Documentation', url: 'https://docs.docker.com/compose/', type: 'documentation' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'ci-cd-github-actions' },
      update: {},
      create: {
        slug: 'ci-cd-github-actions',
        title: 'CI/CD với GitHub Actions',
        summary: `
# CI/CD với GitHub Actions

Tự động hóa build, test, và deploy giúp team release nhanh và ổn định hơn.

## Bạn sẽ học được gì?

- Cấu trúc workflow YAML trong GitHub Actions
- Thiết lập jobs cho lint, test và build
- Dùng secrets an toàn cho môi trường CI/CD
- Tạo deploy pipeline theo branch strategy
- Theo dõi logs, artifacts và debug failed jobs

## Best Practices

- Tách pipeline thành các bước nhỏ dễ debug
- Cache dependencies để giảm thời gian chạy CI
- Chặn merge nếu checks quan trọng chưa pass
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'GitHub Actions Documentation', url: 'https://docs.github.com/actions', type: 'documentation' },
          { title: 'Understanding GitHub Actions', url: 'https://docs.github.com/actions/learn-github-actions/understanding-github-actions', type: 'documentation' },
          { title: 'Building and Testing Node.js', url: 'https://docs.github.com/actions/automating-builds-and-tests/building-and-testing-nodejs', type: 'documentation' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'cloud-deployment-vps' },
      update: {},
      create: {
        slug: 'cloud-deployment-vps',
        title: 'Cloud Deployment trên VPS',
        summary: `
# Cloud Deployment trên VPS

Triển khai ứng dụng Fullstack lên VPS để hiểu rõ hạ tầng và vận hành thực tế.

## Bạn sẽ học được gì?

- Chuẩn bị Linux VPS và cấu hình SSH an toàn
- Setup reverse proxy với Nginx cho web và API
- Deploy app bằng Docker Compose trên server
- Cấu hình HTTPS với Let's Encrypt
- Monitoring cơ bản và backup strategy cho production

## Best Practices

- Tắt root login, dùng key-based authentication
- Luôn có rollback plan trước mỗi lần deploy
- Theo dõi CPU, memory, disk để phát hiện sớm bottleneck
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Nginx Beginner Guide', url: 'https://nginx.org/en/docs/beginners_guide.html', type: 'documentation' },
          { title: "Certbot - Let's Encrypt", url: 'https://certbot.eff.org/', type: 'documentation' },
          { title: 'Docker Production Best Practices', url: 'https://docs.docker.com/build/building/best-practices/', type: 'documentation' },
        ]),
        estimatedMins: 150,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'project-planning-architecture' },
      update: {},
      create: {
        slug: 'project-planning-architecture',
        title: 'Project Planning & Architecture',
        summary: `
# Project Planning & Architecture

Lập kế hoạch và thiết kế kiến trúc trước khi code để giảm rework trong dự án thực tế.

## Bạn sẽ học được gì?

- Xác định scope, user stories và tiêu chí hoàn thành
- Chọn kiến trúc phù hợp: monolith, modular monolith, hay microservices
- Thiết kế API contracts và database schema ban đầu
- Xác định milestone kỹ thuật theo MVP roadmap
- Quản lý technical risks và dependency giữa các modules

## Best Practices

- Viết architecture notes ngắn gọn nhưng rõ quyết định
- Ưu tiên thiết kế theo domain và use-case thật
- Review scope định kỳ để tránh feature creep
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'C4 Model for Architecture', url: 'https://c4model.com/', type: 'documentation' },
          { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', type: 'documentation' },
          { title: 'Martin Fowler - MonolithFirst', url: 'https://martinfowler.com/bliki/MonolithFirst.html', type: 'article' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'mvp-development' },
      update: {},
      create: {
        slug: 'mvp-development',
        title: 'MVP Development',
        summary: `
# MVP Development

Xây MVP theo hướng ship sớm, lấy feedback thật và cải tiến theo dữ liệu người dùng.

## Bạn sẽ học được gì?

- Chia nhỏ features theo giá trị business cốt lõi
- Thiết lập vertical slices cho frontend + backend
- Quản lý backlog theo must-have vs nice-to-have
- Release nhanh với quality gate tối thiểu
- Thu thập feedback để quyết định iteration tiếp theo

## Best Practices

- Giữ kiến trúc đủ tốt, tránh over-engineering giai đoạn đầu
- Đặt metric cụ thể để đo thành công của MVP
- Refactor có kế hoạch sau khi validate product-market fit
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'MVP Definition (Atlassian)', url: 'https://www.atlassian.com/agile/product-management/minimum-viable-product', type: 'article' },
          { title: 'Lean Startup Methodology', url: 'https://theleanstartup.com/principles', type: 'article' },
          { title: 'Shape Up by Basecamp', url: 'https://basecamp.com/shapeup', type: 'documentation' },
        ]),
        estimatedMins: 75,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'production-checklist' },
      update: {},
      create: {
        slug: 'production-checklist',
        title: 'Production Checklist',
        summary: `
# Production Checklist

Trước khi go-live, bạn cần checklist kỹ thuật để đảm bảo hệ thống ổn định và an toàn.

## Bạn sẽ học được gì?

- Checklist cho security, performance và observability
- Chuẩn bị env configs, secret management và backups
- Thiết lập health checks và error tracking
- Kế hoạch rollback và incident response cơ bản
- Kiểm tra khả năng scale và giới hạn hệ thống

## Best Practices

- Dùng checklist chuẩn hóa cho mọi lần release
- Chạy smoke tests sau deploy để xác nhận nhanh
- Ghi lại post-mortem nếu có incident production
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/', type: 'documentation' },
          { title: 'OWASP Deployment Security', url: 'https://cheatsheetseries.owasp.org/', type: 'documentation' },
          { title: '12-Factor App', url: 'https://12factor.net/', type: 'documentation' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'portfolio-building' },
      update: {},
      create: {
        slug: 'portfolio-building',
        title: 'Portfolio Building',
        summary: `
# Portfolio Building

Portfolio tốt giúp bạn chứng minh năng lực thực chiến thay vì chỉ liệt kê công nghệ đã học.

## Bạn sẽ học được gì?

- Chọn 2-3 dự án thể hiện breadth và depth kỹ thuật
- Viết README rõ architecture, features và trade-offs
- Trình bày demo, screenshots và metrics nổi bật
- Kể câu chuyện sản phẩm theo góc nhìn người dùng
- Tối ưu portfolio site cho recruiter scanning nhanh

## Best Practices

- Ưu tiên chất lượng dự án hơn số lượng dự án
- Nêu rõ vai trò cá nhân nếu làm project theo team
- Luôn cập nhật link demo và hướng dẫn chạy local
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'GitHub Docs - About READMEs', url: 'https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes', type: 'documentation' },
          { title: 'freeCodeCamp Developer Portfolio Guide', url: 'https://www.freecodecamp.org/news/how-to-build-a-developer-portfolio-website/', type: 'tutorial' },
          { title: 'The Tech Resume Inside Out', url: 'https://thetechresume.com/', type: 'article' },
        ]),
        estimatedMins: 60,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'technical-interview-prep' },
      update: {},
      create: {
        slug: 'technical-interview-prep',
        title: 'Technical Interview Preparation',
        summary: `
# Technical Interview Preparation

Chuẩn bị phỏng vấn kỹ thuật theo chiến lược để tăng tỷ lệ pass ở vòng coding và system design.

## Bạn sẽ học được gì?

- Ôn cấu trúc data structures và algorithms nền tảng
- Luyện giải bài theo framework phân tích rõ ràng
- Chuẩn bị câu hỏi backend, frontend và fullstack integration
- Trình bày quyết định kỹ thuật trong system design interview
- Cách self-review sau mock interview để cải thiện nhanh

## Best Practices

- Luyện đều đặn theo lịch ngắn nhưng liên tục
- Ưu tiên chất lượng giải thích hơn chỉ có đáp án đúng
- Ghi lại lỗi thường gặp và pattern để tránh lặp lại
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'NeetCode Roadmap', url: 'https://neetcode.io/roadmap', type: 'course' },
          { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', type: 'documentation' },
          { title: 'Cracking the Coding Interview Notes', url: 'https://www.crackingthecodinginterview.com/', type: 'documentation' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'github-profile-optimization' },
      update: {},
      create: {
        slug: 'github-profile-optimization',
        title: 'GitHub Profile Optimization',
        summary: `
# GitHub Profile Optimization

Tối ưu GitHub profile để nhà tuyển dụng nhìn thấy rõ năng lực code, consistency và collaboration.

## Bạn sẽ học được gì?

- Cấu trúc profile README chuyên nghiệp và dễ scan
- Pin repositories theo narrative nghề nghiệp
- Tổ chức commit history và issue/PR activity
- Viết mô tả repo và tags giúp profile nổi bật
- Thiết lập standards cho open-source contribution

## Best Practices

- Giữ profile nhất quán với CV và LinkedIn
- Ưu tiên repos có docs, tests và cấu trúc rõ ràng
- Cập nhật định kỳ khi hoàn thành milestone mới
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'GitHub Profile README Docs', url: 'https://docs.github.com/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme', type: 'documentation' },
          { title: 'GitHub Skills', url: 'https://skills.github.com/', type: 'course' },
          { title: 'How to Build an Awesome GitHub Profile', url: 'https://www.freecodecamp.org/news/how-to-build-an-awesome-github-profile/', type: 'tutorial' },
        ]),
        estimatedMins: 75,
        isPublished: true,
      },
    }),
  ]);

  console.log(`✅ Created ${fullstackExtraLessons.length} extra Fullstack lessons`);

  const fullstackExtraLessonMap = Object.fromEntries(fullstackExtraLessons.map(l => [l.slug, l]));

  const fullstackExtraTrackLessons = await Promise.all([
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-devops', lessonId: fullstackExtraLessonMap['docker-basics'].id } },
      update: {},
      create: { trackId: 'track-fullstack-devops', lessonId: fullstackExtraLessonMap['docker-basics'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-devops', lessonId: fullstackExtraLessonMap['ci-cd-github-actions'].id } },
      update: {},
      create: { trackId: 'track-fullstack-devops', lessonId: fullstackExtraLessonMap['ci-cd-github-actions'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-devops', lessonId: fullstackExtraLessonMap['cloud-deployment-vps'].id } },
      update: {},
      create: { trackId: 'track-fullstack-devops', lessonId: fullstackExtraLessonMap['cloud-deployment-vps'].id, order: 3 },
    }),

    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-project-real', lessonId: fullstackExtraLessonMap['project-planning-architecture'].id } },
      update: {},
      create: { trackId: 'track-fullstack-project-real', lessonId: fullstackExtraLessonMap['project-planning-architecture'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-project-real', lessonId: fullstackExtraLessonMap['mvp-development'].id } },
      update: {},
      create: { trackId: 'track-fullstack-project-real', lessonId: fullstackExtraLessonMap['mvp-development'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-project-real', lessonId: fullstackExtraLessonMap['production-checklist'].id } },
      update: {},
      create: { trackId: 'track-fullstack-project-real', lessonId: fullstackExtraLessonMap['production-checklist'].id, order: 3 },
    }),

    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-career', lessonId: fullstackExtraLessonMap['portfolio-building'].id } },
      update: {},
      create: { trackId: 'track-fullstack-career', lessonId: fullstackExtraLessonMap['portfolio-building'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-career', lessonId: fullstackExtraLessonMap['technical-interview-prep'].id } },
      update: {},
      create: { trackId: 'track-fullstack-career', lessonId: fullstackExtraLessonMap['technical-interview-prep'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-fullstack-career', lessonId: fullstackExtraLessonMap['github-profile-optimization'].id } },
      update: {},
      create: { trackId: 'track-fullstack-career', lessonId: fullstackExtraLessonMap['github-profile-optimization'].id, order: 3 },
    }),
  ]);

  console.log(`✅ Linked ${fullstackExtraTrackLessons.length} extra Fullstack lessons to tracks`);

  // ============================================
  // FRONTEND PATH — EXTRA TRACKS
  // ============================================
  console.log('Adding extra tracks to Frontend path...');

  const frontendPathRecord = await prisma.learningPath.findUnique({
    where: { slug: 'frontend-reactjs' },
  });

  if (!frontendPathRecord) {
    throw new Error('Learning path frontend-reactjs not found');
  }

  const frontendExtraTracks = await Promise.all([
    prisma.track.upsert({
      where: { id: 'track-typescript-react' },
      update: {},
      create: {
        id: 'track-typescript-react',
        learningPathId: frontendPathRecord.id,
        name: 'TypeScript với React',
        description: 'Tăng type safety cho React app với TypeScript.',
        order: 6,
        isOptional: false,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-react-testing' },
      update: {},
      create: {
        id: 'track-react-testing',
        learningPathId: frontendPathRecord.id,
        name: 'Testing React Apps',
        description: 'Viết unit và integration tests cho React components.',
        order: 7,
        isOptional: true,
      },
    }),
    prisma.track.upsert({
      where: { id: 'track-react-performance' },
      update: {},
      create: {
        id: 'track-react-performance',
        learningPathId: frontendPathRecord.id,
        name: 'Performance Optimization',
        description: 'Tối ưu hiệu năng React app: memo, lazy loading, bundle size.',
        order: 8,
        isOptional: true,
      },
    }),
  ]);

  console.log(`✅ Created ${frontendExtraTracks.length} extra Frontend tracks`);

  console.log('Adding extra lessons to Frontend path...');

  const frontendExtraLessons = await Promise.all([
    prisma.lesson.upsert({
      where: { slug: 'typescript-basics' },
      update: {},
      create: {
        slug: 'typescript-basics',
        title: 'TypeScript Basics',
        summary: `
# TypeScript Basics

TypeScript mở rộng JavaScript với static typing để phát hiện lỗi sớm và refactor an toàn hơn.

## Bạn sẽ học được gì?

- Khai báo kiểu dữ liệu cơ bản và type inference
- Union types, literal types và type narrowing
- Interface, type alias và khi nào nên dùng mỗi loại
- Thiết lập tsconfig cho dự án React
- Đọc lỗi compiler để sửa đúng root cause

## Best Practices

- Bật strict mode ngay từ đầu dự án
- Hạn chế any, ưu tiên unknown khi dữ liệu chưa rõ
- Đặt tên type và interface theo domain để dễ maintain
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'TypeScript Handbook - Everyday Types', url: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html', type: 'documentation' },
          { title: 'TypeScript Handbook - Intro', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', type: 'documentation' },
          { title: 'TypeScript Course for Beginners - freeCodeCamp', url: 'https://www.youtube.com/watch?v=30LWjhZzg50', type: 'video' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'typescript-react-components' },
      update: {},
      create: {
        slug: 'typescript-react-components',
        title: 'TypeScript React Components',
        summary: `
# TypeScript với React Components

Áp dụng TypeScript vào React để component có contract rõ ràng và giảm runtime bugs.

## Bạn sẽ học được gì?

- Typing props, children và default values
- Typing events của form, input, click chính xác
- Typing hooks phổ biến như useState, useRef, useReducer
- Generic component để tái sử dụng tốt hơn
- Tổ chức file types cho từng feature module

## Best Practices

- Dùng interface cho props public của component
- Tránh React.FC khi không cần implicit children
- Tách shared types vào file riêng để tránh lặp code
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'React TypeScript Cheatsheets', url: 'https://react-typescript-cheatsheet.netlify.app/', type: 'documentation' },
          { title: 'TypeScript Handbook - JSX', url: 'https://www.typescriptlang.org/docs/handbook/jsx.html', type: 'documentation' },
          { title: 'React Docs - Using TypeScript', url: 'https://react.dev/learn/typescript', type: 'documentation' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'typescript-advanced-patterns' },
      update: {},
      create: {
        slug: 'typescript-advanced-patterns',
        title: 'TypeScript Advanced Patterns',
        summary: `
# TypeScript Advanced Patterns

Nâng cao khả năng modeling dữ liệu và business rules với các pattern type mạnh mẽ.

## Bạn sẽ học được gì?

- Generic constraints và reusable type helpers
- Utility types như Partial, Pick, Omit, Record
- Discriminated unions để quản lý UI state
- Mapped types và conditional types cơ bản
- Exhaustive checking để tránh thiếu case logic

## Best Practices

- Thiết kế types theo domain thay vì theo UI tạm thời
- Ưu tiên composition thay vì tạo type quá phức tạp
- Viết helper types nhỏ, rõ nghĩa và có thể tái sử dụng
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'TypeScript Handbook - Generics', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html', type: 'documentation' },
          { title: 'TypeScript Handbook - Utility Types', url: 'https://www.typescriptlang.org/docs/handbook/utility-types.html', type: 'documentation' },
          { title: 'Total TypeScript Concepts', url: 'https://www.totaltypescript.com/concepts', type: 'tutorial' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'jest-basics' },
      update: {},
      create: {
        slug: 'jest-basics',
        title: 'Jest Basics',
        summary: `
# Jest Basics

Jest là test runner phổ biến cho JavaScript và TypeScript, phù hợp cho unit test và integration test nhỏ.

## Bạn sẽ học được gì?

- Cấu trúc một test case với describe, it, expect
- Matchers quan trọng để assert dữ liệu đúng
- Setup và teardown bằng beforeEach, afterEach
- Mock functions và mock modules hiệu quả
- Chạy watch mode và đọc test report

## Best Practices

- Mỗi test chỉ nên kiểm tra một hành vi chính
- Đặt tên test mô tả rõ ngữ cảnh và kỳ vọng
- Tránh phụ thuộc thứ tự chạy giữa các test cases
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Jest Documentation - Getting Started', url: 'https://jestjs.io/docs/getting-started', type: 'documentation' },
          { title: 'Jest Documentation - Mock Functions', url: 'https://jestjs.io/docs/mock-functions', type: 'documentation' },
          { title: 'Jest Crash Course - Traversy Media', url: 'https://www.youtube.com/watch?v=7r4xVDI2vho', type: 'video' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'react-testing-library' },
      update: {},
      create: {
        slug: 'react-testing-library',
        title: 'React Testing Library',
        summary: `
# React Testing Library

Testing Library giúp test theo góc nhìn người dùng thay vì test implementation details.

## Bạn sẽ học được gì?

- Render component và query theo role, text, label
- Mô phỏng user interaction bằng user-event
- Test async UI với findBy và waitFor
- Kiểm tra loading, error, success states
- Viết test cho form validation và accessibility

## Best Practices

- Ưu tiên query theo getByRole để gần hành vi thực tế
- Không test state nội bộ nếu user không nhìn thấy
- Viết test theo hành vi trước, implementation sau
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'React Testing Library - Intro', url: 'https://testing-library.com/docs/react-testing-library/intro/', type: 'documentation' },
          { title: 'Testing Library - user-event Intro', url: 'https://testing-library.com/docs/user-event/intro/', type: 'documentation' },
          { title: 'Common Mistakes with React Testing Library', url: 'https://kentcdodds.com/blog/common-mistakes-with-react-testing-library', type: 'tutorial' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'e2e-testing-playwright' },
      update: {},
      create: {
        slug: 'e2e-testing-playwright',
        title: 'E2E Testing với Playwright',
        summary: `
# E2E Testing với Playwright

Playwright cho phép test end-to-end luồng người dùng trên trình duyệt thật với độ ổn định cao.

## Bạn sẽ học được gì?

- Cấu hình Playwright và chạy test trên nhiều browsers
- Viết kịch bản login, navigation, form submission
- Sử dụng locators, assertions và auto-waiting
- Quản lý test data và trạng thái môi trường
- Debug test bằng trace viewer, screenshot, video

## Best Practices

- Giữ test độc lập, không chia sẻ state giữa các case
- Ưu tiên stable selectors cho locators
- Chạy smoke suite nhanh trong CI trước full suite
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'Playwright Documentation - Intro', url: 'https://playwright.dev/docs/intro', type: 'documentation' },
          { title: 'Playwright Documentation - Writing Tests', url: 'https://playwright.dev/docs/writing-tests', type: 'documentation' },
          { title: 'Playwright Documentation - Best Practices', url: 'https://playwright.dev/docs/best-practices', type: 'documentation' },
        ]),
        estimatedMins: 150,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'react-memo-usecallback' },
      update: {},
      create: {
        slug: 'react-memo-usecallback',
        title: 'React memo và useCallback',
        summary: `
# React memo, useMemo, useCallback

Tối ưu rendering bằng memoization để giảm re-render không cần thiết trong React app.

## Bạn sẽ học được gì?

- Cách React.memo hoạt động với props comparison
- Khi nào dùng useMemo cho giá trị tính toán nặng
- Khi nào dùng useCallback cho function props
- Dùng React DevTools Profiler để tìm bottlenecks
- Trade-off giữa tối ưu sớm và code complexity

## Best Practices

- Chỉ memoize khi có số liệu performance rõ ràng
- Tránh dependency array sai gây stale values
- Ưu tiên kiến trúc state hợp lý trước micro-optimizations
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'React Docs - memo', url: 'https://react.dev/reference/react/memo', type: 'documentation' },
          { title: 'React Docs - useMemo', url: 'https://react.dev/reference/react/useMemo', type: 'documentation' },
          { title: 'React Docs - useCallback', url: 'https://react.dev/reference/react/useCallback', type: 'documentation' },
        ]),
        estimatedMins: 90,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'code-splitting-lazy' },
      update: {},
      create: {
        slug: 'code-splitting-lazy',
        title: 'Code Splitting và Lazy Loading',
        summary: `
# Code Splitting và Lazy Loading

Giảm bundle size ban đầu bằng cách tách code theo route và tải khi cần.

## Bạn sẽ học được gì?

- Dynamic import và lợi ích của code splitting
- Sử dụng React.lazy kết hợp Suspense
- Tổ chức split points theo route và feature
- Thiết kế loading fallback UX mượt mà
- Đo hiệu quả sau tối ưu bằng Lighthouse

## Best Practices

- Split theo route trước, rồi mới tối ưu sâu theo component
- Đặt fallback rõ ràng để tránh blank screen
- Theo dõi chunk size để tránh tạo quá nhiều requests nhỏ
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'React Docs - lazy', url: 'https://react.dev/reference/react/lazy', type: 'documentation' },
          { title: 'React Docs - Suspense', url: 'https://react.dev/reference/react/Suspense', type: 'documentation' },
          { title: 'React Legacy Docs - Code Splitting', url: 'https://legacy.reactjs.org/docs/code-splitting.html', type: 'documentation' },
        ]),
        estimatedMins: 75,
        isPublished: true,
      },
    }),

    prisma.lesson.upsert({
      where: { slug: 'web-vitals-optimization' },
      update: {},
      create: {
        slug: 'web-vitals-optimization',
        title: 'Web Vitals Optimization',
        summary: `
# Web Vitals Optimization

Tối ưu trải nghiệm thực tế bằng cách theo dõi và cải thiện Core Web Vitals.

## Bạn sẽ học được gì?

- Ý nghĩa các chỉ số LCP, CLS, INP
- Dùng Lighthouse và Performance panel để đo
- Tối ưu ảnh, font và critical rendering path
- Giảm JS blocking bằng caching và code splitting
- Thiết lập theo dõi Web Vitals trong production

## Best Practices

- Đặt performance budget ngay từ đầu sprint
- Ưu tiên sửa vấn đề ảnh hưởng trực tiếp người dùng
- Đo lại sau mỗi thay đổi để xác nhận cải thiện thật
        `.trim(),
        externalLinks: JSON.stringify([
          { title: 'web.dev - Core Web Vitals', url: 'https://web.dev/vitals/', type: 'documentation' },
          { title: 'web.dev - Optimize LCP', url: 'https://web.dev/articles/lcp', type: 'documentation' },
          { title: 'Chrome Docs - Lighthouse Performance', url: 'https://developer.chrome.com/docs/lighthouse/performance/', type: 'documentation' },
        ]),
        estimatedMins: 120,
        isPublished: true,
      },
    }),
  ]);

  console.log(`✅ Created ${frontendExtraLessons.length} extra Frontend lessons`);

  const frontendExtraLessonMap = Object.fromEntries(frontendExtraLessons.map(l => [l.slug, l]));

  const frontendExtraTrackLessons = await Promise.all([
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-typescript-react', lessonId: frontendExtraLessonMap['typescript-basics'].id } },
      update: {},
      create: { trackId: 'track-typescript-react', lessonId: frontendExtraLessonMap['typescript-basics'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-typescript-react', lessonId: frontendExtraLessonMap['typescript-react-components'].id } },
      update: {},
      create: { trackId: 'track-typescript-react', lessonId: frontendExtraLessonMap['typescript-react-components'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-typescript-react', lessonId: frontendExtraLessonMap['typescript-advanced-patterns'].id } },
      update: {},
      create: { trackId: 'track-typescript-react', lessonId: frontendExtraLessonMap['typescript-advanced-patterns'].id, order: 3 },
    }),

    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-react-testing', lessonId: frontendExtraLessonMap['jest-basics'].id } },
      update: {},
      create: { trackId: 'track-react-testing', lessonId: frontendExtraLessonMap['jest-basics'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-react-testing', lessonId: frontendExtraLessonMap['react-testing-library'].id } },
      update: {},
      create: { trackId: 'track-react-testing', lessonId: frontendExtraLessonMap['react-testing-library'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-react-testing', lessonId: frontendExtraLessonMap['e2e-testing-playwright'].id } },
      update: {},
      create: { trackId: 'track-react-testing', lessonId: frontendExtraLessonMap['e2e-testing-playwright'].id, order: 3 },
    }),

    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-react-performance', lessonId: frontendExtraLessonMap['react-memo-usecallback'].id } },
      update: {},
      create: { trackId: 'track-react-performance', lessonId: frontendExtraLessonMap['react-memo-usecallback'].id, order: 1 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-react-performance', lessonId: frontendExtraLessonMap['code-splitting-lazy'].id } },
      update: {},
      create: { trackId: 'track-react-performance', lessonId: frontendExtraLessonMap['code-splitting-lazy'].id, order: 2 },
    }),
    prisma.trackLesson.upsert({
      where: { trackId_lessonId: { trackId: 'track-react-performance', lessonId: frontendExtraLessonMap['web-vitals-optimization'].id } },
      update: {},
      create: { trackId: 'track-react-performance', lessonId: frontendExtraLessonMap['web-vitals-optimization'].id, order: 3 },
    }),
  ]);

  console.log(`✅ Linked ${frontendExtraTrackLessons.length} extra Frontend lessons to tracks`);

  // ============================================
  // DONE
  // ============================================
  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\nCreated:');
  console.log(`  - 2 users (admin + test)`);
  console.log(`  - 4 learning paths (Frontend ReactJS, Backend NodeJS, Fullstack, AI/Python)`);
  console.log(`  - ${frontendTracks.length + frontendExtraTracks.length + backendTracks.length + backendExtraTracks.length + fullstackTracks.length + fullstackExtraTracks.length + aiTracks.length} tracks total`);
  console.log(`  - ${lessons.length + frontendExtraLessons.length + backendLessons.length + backendExtraLessons.length + fullstackExtraLessons.length + aiLessons.length} lessons total`);
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
