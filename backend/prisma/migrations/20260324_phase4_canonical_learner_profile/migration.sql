-- Phase 4: Canonical Learner Profile Foundation
-- Replace OnboardingData with round-based storage + LearnerProfile projection

-- CreateEnum
CREATE TYPE "LearnerSkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "LearnerLearningPace" AS ENUM ('SLOW', 'NORMAL', 'FAST');

-- CreateTable
CREATE TABLE "onboarding_rounds" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "onboarding_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "onboarding_rounds_user_id_idx" ON "onboarding_rounds"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_rounds_user_id_round_number_key" ON "onboarding_rounds"("user_id", "round_number");

-- CreateTable
CREATE TABLE "learner_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "career_goal" "CareerGoal" NOT NULL,
    "skill_level" "LearnerSkillLevel" NOT NULL,
    "learning_pace" "LearnerLearningPace" NOT NULL,
    "strengths" JSONB NOT NULL DEFAULT '[]',
    "weaknesses" JSONB NOT NULL DEFAULT '[]',
    "preferred_topics" JSONB NOT NULL DEFAULT '[]',
    "last_recalculated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learner_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learner_profiles_user_id_key" ON "learner_profiles"("user_id");

-- CreateIndex
CREATE INDEX "learner_profiles_skill_level_idx" ON "learner_profiles"("skill_level");

-- AddForeignKey
ALTER TABLE "onboarding_rounds" ADD CONSTRAINT "onboarding_rounds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learner_profiles" ADD CONSTRAINT "learner_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- BackfillOnboardingRounds
-- Migrate existing onboarding_data rows into onboarding_rounds as round_number = 1
INSERT INTO "onboarding_rounds" ("id", "user_id", "round_number", "answers", "completed_at", "created_at")
SELECT
    gen_random_uuid()::text,
    "user_id",
    1,
    jsonb_build_object('careerGoal', "career_goal", 'priorKnowledge', "prior_knowledge", 'learningBackground', "learning_background", 'hoursPerWeek', "hours_per_week"),
    "completed_at",
    "completed_at"
FROM "onboarding_data";

-- BackfillLearnerProfiles
-- Derive initial learner_profiles from existing onboarding_data
INSERT INTO "learner_profiles" ("id", "user_id", "career_goal", "skill_level", "learning_pace", "strengths", "weaknesses", "preferred_topics", "last_recalculated_at", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text,
    "user_id",
    "career_goal",
    CASE WHEN jsonb_array_length(prior_knowledge) >= 4 AND hours_per_week >= 10 THEN 'INTERMEDIATE' ELSE 'BEGINNER' END::"LearnerSkillLevel",
    CASE WHEN hours_per_week <= 5 THEN 'SLOW' WHEN hours_per_week >= 15 THEN 'FAST' ELSE 'NORMAL' END::"LearnerLearningPace",
    '[]'::jsonb,
    '[]'::jsonb,
    COALESCE(prior_knowledge, '[]'::jsonb),
    "completed_at",
    "completed_at",
    "completed_at"
FROM "onboarding_data";

-- DropForeignKey
ALTER TABLE "onboarding_data" DROP CONSTRAINT "onboarding_data_user_id_fkey";

-- DropTable
DROP TABLE "onboarding_data";
