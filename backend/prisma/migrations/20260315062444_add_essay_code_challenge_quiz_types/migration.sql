-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QuestionType" ADD VALUE 'ESSAY';
ALTER TYPE "QuestionType" ADD VALUE 'CODE_CHALLENGE';

-- AlterTable
ALTER TABLE "quiz_questions" ADD COLUMN     "code_template" TEXT,
ADD COLUMN     "test_cases" JSONB;

-- RenameIndex
ALTER INDEX "refresh_tokens_token_idx" RENAME TO "refresh_tokens_token_hash_idx";

-- RenameIndex
ALTER INDEX "refresh_tokens_token_key" RENAME TO "refresh_tokens_token_hash_key";
