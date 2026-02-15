# Database Schema

---

## Entity Relationship Diagram

```
+──────────────+       +──────────────────+       +─────────────────+
│    USER      │       │  LEARNING_PATH   │       │     TRACK       │
├──────────────┤       ├──────────────────┤       ├─────────────────┤
│ id (PK)      │       │ id (PK)          │       │ id (PK)         │
│ email        │       │ name             │       │ learning_path_id│
│ role         │       │ slug             │       │ name            │
│ tier         │       │ description      │       │ description     │
│ authProvider │       │ icon             │       │ order           │
│ googleId     │       │ difficulty       │       │ is_optional     │
│ githubId     │       │ estimated_hours  │       └────────┬────────┘
│ created_at   │       │ is_published     │                │
│ updated_at   │       └────────┬─────────┘                │
│ deleted_at   │                │                          │
└──────┬───────┘                │                          │
       │    ┌───────────────────┼──────────────────────────┘
       │    │                   │
       │    │                   v
       │    │         +─────────────────+      +──────────────────────+
       │    │         │     LESSON      │      │ LESSON_PREREQUISITE  │
       │    │         ├─────────────────┤      ├──────────────────────┤
       │    │         │ id (PK)         │◄────►│ lesson_id (FK)       │
       │    │         │ track_id (FK)   │      │ prerequisite_id (FK) │
       │    │         │ title           │      └──────────────────────┘
       │    │         │ slug            │
       │    │         │ summary         │
       │    │         │ content         │
       │    │         │ external_links  │
       │    │         │ track_order     │
       │    │         │ estimated_mins  │
       │    │         └────────┬────────┘
       │    │                  │
       │    │                  v
       │    │         +─────────────────+
       │    │         │      QUIZ       │
       │    │         ├─────────────────┤
       │    │         │ id (PK)         │
       │    │         │ lesson_id (FK)  │
       │    │         │ title           │
       │    │         │ pass_threshold  │
       │    │         │ retry_limit     │
       │    │         │ retry_cooldown  │
       │    │         └────────┬────────┘
       │    │                  │
       │    │                  v
       │    │         +─────────────────+
       │    │         │ QUIZ_QUESTION   │
       │    │         ├─────────────────┤
       │    │         │ id (PK)         │
       │    │         │ quiz_id (FK)    │
       │    │         │ question_text   │
       │    │         │ question_type   │
       │    │         │ options (JSON)  │
       │    │         │ correct_answer  │
       │    │         │ explanation     │
       │    │         │ order           │
       │    │         └─────────────────┘
       │    │
       v    v
+──────────────────────+     +─────────────────────+
│ USER_LEARNING_PATH   │     │    USER_PROGRESS    │
├──────────────────────┤     ├─────────────────────┤
│ id (PK)              │     │ id (PK)             │
│ user_id (FK)         │     │ user_id (FK)        │
│ learning_path_id(FK) │     │ lesson_id (FK)      │
│ started_at           │     │ status              │
│ completed_at         │     │ started_at          │
│ current_lesson_id    │     │ completed_at        │
│ ai_recommendations   │     │ time_spent_seconds  │
└──────────────────────┘     └─────────────────────┘
       │
       v
+──────────────────────+     +─────────────────────+
│    QUIZ_RESULT       │     │  LEARNING_SESSION   │
├──────────────────────┤     ├─────────────────────┤
│ id (PK)              │     │ id (PK)             │
│ user_id (FK)         │     │ user_id (FK)        │
│ quiz_id (FK)         │     │ lesson_id (FK)      │
│ score                │     │ started_at          │
│ passed               │     │ ended_at            │
│ answers (JSON)       │     │ duration_seconds    │
│ attempt_number       │     │ activity_type       │
│ completed_at         │     └─────────────────────┘
└──────────────────────┘
       │
       v
+──────────────────────+     +─────────────────────+
│ AI_INTERACTION_LOG   │     │   ONBOARDING_DATA   │
├──────────────────────┤     ├─────────────────────┤
│ id (PK)              │     │ id (PK)             │
│ user_id (FK)         │     │ user_id (FK)        │
│ session_context      │     │ career_goal         │
│ question_summary     │     │ prior_knowledge     │
│ response_summary     │     │ learning_background │
│ tokens_used          │     │ time_availability   │
│ model_used           │     │ completed_at        │
│ created_at           │     └─────────────────────┘
└──────────────────────┘

+──────────────────────+     +─────────────────────+
│    SUBSCRIPTION      │     │    PAYMENT_LOG      │
├──────────────────────┤     ├─────────────────────┤
│ id (PK)              │     │ id (PK)             │
│ user_id (FK)         │     │ user_id (FK)        │
│ tier (FREE/PRO/ULTRA)│     │ subscription_id(FK) │
│ starts_at            │     │ provider (MOMO/VNPAY│
│ expires_at           │     │ amount              │
│ is_active            │     │ status              │
│ payment_provider     │     │ transaction_id      │
│ created_at           │     │ created_at          │
└──────────────────────┘     └─────────────────────┘
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============== ENUMS ==============

enum UserRole {
  USER
  ADMIN
}

enum UserTier {
  FREE
  PRO
  ULTRA
}

enum AuthProvider {
  EMAIL
  GOOGLE
  GITHUB
}

enum ProgressStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}

enum CareerGoal {
  FRONTEND
  BACKEND
  FULLSTACK
  AI_PYTHON
}

enum LearningBackground {
  NO_BACKGROUND
  SELF_TAUGHT
  BOOTCAMP
  CS_DEGREE
}

enum QuestionType {
  SINGLE_CHOICE
  MULTIPLE_CHOICE
  ESSAY           // Tu luan - AI cham
  CODE_CHALLENGE  // Code challenge - chay code
}

enum ActivityType {
  LESSON_VIEW
  QUIZ_ATTEMPT
  AI_CHAT
}

enum PaymentProvider {
  MOMO
  VNPAY
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

// ============== USER ==============

model User {
  id           String       @id @default(uuid())
  email        String       @unique
  role         UserRole     @default(USER)
  tier         UserTier     @default(FREE)
  authProvider AuthProvider @default(EMAIL) @map("auth_provider")
  googleId     String?      @unique @map("google_id")
  githubId     String?      @unique @map("github_id")
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")
  deletedAt    DateTime?    @map("deleted_at")

  // Relations
  onboardingData    OnboardingData?
  userLearningPaths UserLearningPath[]
  userProgress      UserProgress[]
  quizResults       QuizResult[]
  learningSessions  LearningSession[]
  aiInteractionLogs AIInteractionLog[]
  otpCodes          OTPCode[]
  subscriptions     Subscription[]
  paymentLogs       PaymentLog[]

  @@map("users")
}

model OTPCode {
  id        String   @id @default(uuid())
  userId    String?  @map("user_id")
  email     String
  code      String
  expiresAt DateTime @map("expires_at")
  attempts  Int      @default(0)
  verified  Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  user User? @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([email, code])
  @@map("otp_codes")
}

// ============== ONBOARDING ==============

model OnboardingData {
  id                 String             @id @default(uuid())
  userId             String             @unique @map("user_id")
  careerGoal         CareerGoal         @map("career_goal")
  priorKnowledge     Json               @map("prior_knowledge")
  learningBackground LearningBackground @map("learning_background")
  hoursPerWeek       Int                @map("hours_per_week")
  completedAt        DateTime           @default(now()) @map("completed_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("onboarding_data")
}

// ============== LEARNING PATH ==============

model LearningPath {
  id             String  @id @default(uuid())
  name           String
  slug           String  @unique
  description    String
  icon           String?
  difficulty     String  // beginner, intermediate, advanced
  estimatedHours Int     @map("estimated_hours")
  isPublished    Boolean @default(false) @map("is_published")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  tracks            Track[]
  userLearningPaths UserLearningPath[]

  @@map("learning_paths")
}

model Track {
  id             String  @id @default(uuid())
  learningPathId String  @map("learning_path_id")
  name           String
  description    String?
  order          Int
  isOptional     Boolean @default(false) @map("is_optional")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  learningPath LearningPath @relation(fields: [learningPathId], references: [id], onDelete: Cascade)
  lessons      Lesson[]

  @@map("tracks")
}

model Lesson {
  id            String  @id @default(uuid())
  trackId       String  @map("track_id")
  title         String
  slug          String  @unique
  summary       String  @db.Text
  content       String? @db.Text
  externalLinks Json    @default("[]") @map("external_links")
  trackOrder    Int     @map("track_order")
  estimatedMins Int     @map("estimated_mins")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  track             Track                @relation(fields: [trackId], references: [id], onDelete: Cascade)
  quiz              Quiz?
  userProgress      UserProgress[]
  learningSessions  LearningSession[]
  aiInteractionLogs AIInteractionLog[]
  prerequisites     LessonPrerequisite[] @relation("LessonPrerequisites")
  prerequisiteFor   LessonPrerequisite[] @relation("PrerequisiteFor")
  userLearningPaths UserLearningPath[]   @relation("CurrentLesson")

  @@map("lessons")
}

model LessonPrerequisite {
  lessonId       String @map("lesson_id")
  prerequisiteId String @map("prerequisite_id")

  lesson       Lesson @relation("LessonPrerequisites", fields: [lessonId], references: [id], onDelete: Cascade)
  prerequisite Lesson @relation("PrerequisiteFor", fields: [prerequisiteId], references: [id], onDelete: Cascade)

  @@id([lessonId, prerequisiteId])
  @@map("lesson_prerequisites")
}

// ============== QUIZ ==============

model Quiz {
  id            String @id @default(uuid())
  lessonId      String @unique @map("lesson_id")
  title         String
  passThreshold Int    @default(70) @map("pass_threshold")
  retryLimit    Int    @default(3) @map("retry_limit")
  retryCooldown Int    @default(60) @map("retry_cooldown")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  lesson    Lesson         @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  questions QuizQuestion[]
  results   QuizResult[]

  @@map("quizzes")
}

model QuizQuestion {
  id           String       @id @default(uuid())
  quizId       String       @map("quiz_id")
  questionText String       @map("question_text") @db.Text
  questionType QuestionType @default(SINGLE_CHOICE) @map("question_type")
  options      Json?        // Array of {id, text} - null for ESSAY/CODE
  correctAnswer Json?       @map("correct_answer") // null for ESSAY (AI graded)
  explanation  String?      @db.Text
  codeTemplate String?      @map("code_template") @db.Text // For CODE_CHALLENGE
  testCases    Json?        @map("test_cases") // For CODE_CHALLENGE: [{input, expected}]
  order        Int

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  quiz Quiz @relation(fields: [quizId], references: [id], onDelete: Cascade)

  @@map("quiz_questions")
}

// ============== USER PROGRESS ==============

model UserLearningPath {
  id                String    @id @default(uuid())
  userId            String    @map("user_id")
  learningPathId    String    @map("learning_path_id")
  currentLessonId   String?   @map("current_lesson_id")
  startedAt         DateTime  @default(now()) @map("started_at")
  completedAt       DateTime? @map("completed_at")
  aiRecommendations Json?     @map("ai_recommendations")

  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  learningPath  LearningPath @relation(fields: [learningPathId], references: [id], onDelete: Cascade)
  currentLesson Lesson?      @relation("CurrentLesson", fields: [currentLessonId], references: [id])

  @@unique([userId, learningPathId])
  @@map("user_learning_paths")
}

model UserProgress {
  id               String         @id @default(uuid())
  userId           String         @map("user_id")
  lessonId         String         @map("lesson_id")
  status           ProgressStatus @default(NOT_STARTED)
  startedAt        DateTime?      @map("started_at")
  completedAt      DateTime?      @map("completed_at")
  timeSpentSeconds Int            @default(0) @map("time_spent_seconds")

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@unique([userId, lessonId])
  @@map("user_progress")
}

model QuizResult {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  quizId        String   @map("quiz_id")
  score         Int
  passed        Boolean
  answers       Json
  attemptNumber Int      @map("attempt_number")
  completedAt   DateTime @default(now()) @map("completed_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  quiz Quiz @relation(fields: [quizId], references: [id], onDelete: Cascade)

  @@map("quiz_results")
}

model LearningSession {
  id              String       @id @default(uuid())
  userId          String       @map("user_id")
  lessonId        String?      @map("lesson_id")
  activityType    ActivityType @map("activity_type")
  startedAt       DateTime     @default(now()) @map("started_at")
  endedAt         DateTime?    @map("ended_at")
  durationSeconds Int?         @map("duration_seconds")

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson? @relation(fields: [lessonId], references: [id])

  @@map("learning_sessions")
}

// ============== AI ==============

model AIInteractionLog {
  id              String   @id @default(uuid())
  userId          String   @map("user_id")
  lessonId        String?  @map("lesson_id")
  sessionContext  String   @map("session_context")
  questionSummary String   @map("question_summary") @db.VarChar(500)
  responseSummary String   @map("response_summary") @db.VarChar(500)
  tokensUsed      Int      @map("tokens_used")
  modelUsed       String   @map("model_used")
  createdAt       DateTime @default(now()) @map("created_at")

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  lesson Lesson? @relation(fields: [lessonId], references: [id])

  @@map("ai_interaction_logs")
}

// ============== PAYMENT ==============

model Subscription {
  id              String          @id @default(uuid())
  userId          String          @map("user_id")
  tier            UserTier
  startsAt        DateTime        @map("starts_at")
  expiresAt       DateTime        @map("expires_at")
  isActive        Boolean         @default(true) @map("is_active")
  paymentProvider PaymentProvider @map("payment_provider")
  createdAt       DateTime        @default(now()) @map("created_at")

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  paymentLogs PaymentLog[]

  @@map("subscriptions")
}

model PaymentLog {
  id             String          @id @default(uuid())
  userId         String          @map("user_id")
  subscriptionId String?         @map("subscription_id")
  provider       PaymentProvider
  amount         Int             // VND (don vi dong)
  status         PaymentStatus   @default(PENDING)
  transactionId  String?         @unique @map("transaction_id")
  rawResponse    Json?           @map("raw_response") // Full response from provider
  createdAt      DateTime        @default(now()) @map("created_at")
  updatedAt      DateTime        @updatedAt @map("updated_at")

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscription Subscription? @relation(fields: [subscriptionId], references: [id])

  @@map("payment_logs")
}
```

---

## Key Changes from Original CONTEXT.md

1. **Added to User model:** `tier`, `authProvider`, `googleId`, `githubId` (for OAuth + tiers)
2. **Added QuestionType enums:** `ESSAY`, `CODE_CHALLENGE` (for new quiz types)
3. **Added QuizQuestion fields:** `codeTemplate`, `testCases` (for code challenges)
4. **Added models:** `Subscription`, `PaymentLog` (for payment system)
5. **Added enums:** `UserTier`, `AuthProvider`, `PaymentProvider`, `PaymentStatus`
