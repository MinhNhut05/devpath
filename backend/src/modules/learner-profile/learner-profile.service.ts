// learner-profile.service.ts - Canonical learner-profile domain logic
//
// Single source of truth for learner context (D-12, D-17).
// Provides:
//   - getMyProfile(userId): Read canonical profile + completed rounds
//   - createFromRoundOne(userId): Thin helper for Phase 5 profile creation
//   - recalculate(userId, event): Synchronous incremental profile recalculation
//
// Why a separate service instead of putting logic in the controller?
//   - Reusable: other modules (onboarding, lessons, recommendations) can
//     inject LearnerProfileService without duplicating business logic
//   - Testable: service can be unit-tested with mocked Prisma
//   - Single owner: profile rules live in one place (D-12)
//
// PrismaModule is @Global() so PrismaService is injected directly.

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  LearnerLearningPace,
  LearnerSkillLevel,
  ProgressStatus,
} from '@prisma/client';
import type { LearnerProfile } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';

// ── Recalculation event types ────────────────────────────────────────────────
//
// Discriminated union for the three milestone events that trigger profile
// recalculation (D-09). Each variant carries only the IDs needed for its
// incremental update (D-11).

type RecalcEvent =
  | { type: 'LESSON_COMPLETED'; lessonId: string }
  | { type: 'QUIZ_PASSED'; quizId: string; lessonId: string }
  | { type: 'TRACK_COMPLETED'; learningPathId: string };

// ── Filler words for AI topic extraction ─────────────────────────────────────
//
// Generic words to drop when extracting topic tokens from AIInteractionLog
// questionSummary / sessionContext fields. Only deterministic extraction —
// no AI services or sentiment scoring (Phase 4 scope).

const FILLER_WORDS = new Set([
  'help',
  'question',
  'lesson',
  'track',
  'path',
]);

@Injectable()
export class LearnerProfileService {
  private readonly logger = new Logger(LearnerProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── getMyProfile ────────────────────────────────────────────────────────
  //
  // Returns the canonical learner profile for a given user.
  //
  // Shape returned:
  //   { userId, careerGoal, skillLevel, learningPace, strengths,
  //     weaknesses, preferredTopics, lastRecalculatedAt, roundsCompleted }
  //
  // roundsCompleted = array of round numbers with non-null completedAt
  // (derived from OnboardingRound, not stored on the profile itself).
  //
  // Throws NotFoundException if the user has no LearnerProfile row,
  // rather than fabricating default data (per research recommendation).
  async getMyProfile(userId: string) {
    // Two parallel queries: profile + completed onboarding rounds
    const [profile, rounds] = await Promise.all([
      this.prisma.learnerProfile.findUnique({
        where: { userId },
      }),
      this.prisma.onboardingRound.findMany({
        where: { userId },
        orderBy: { roundNumber: 'asc' },
        select: { roundNumber: true, completedAt: true },
      }),
    ]);

    // Pre-onboarding users get an explicit error, not fabricated defaults
    if (!profile) {
      throw new NotFoundException('Learner profile not initialized');
    }

    // Only include rounds that are actually completed
    const roundsCompleted = rounds
      .filter((r) => r.completedAt !== null)
      .map((r) => r.roundNumber);

    return {
      userId: profile.userId,
      careerGoal: profile.careerGoal,
      skillLevel: profile.skillLevel,
      learningPace: profile.learningPace,
      strengths: profile.strengths,
      weaknesses: profile.weaknesses,
      preferredTopics: profile.preferredTopics,
      lastRecalculatedAt: profile.lastRecalculatedAt,
      roundsCompleted,
    };
  }

  // ── createFromRoundOne ──────────────────────────────────────────────────
  //
  // Thin helper for profile creation from round 1 onboarding data.
  // Phase 5 will call this after round 1 submission completes.
  // Exists per D-04 even though it may only be used internally at first.
  //
  // Currently a placeholder — Phase 5 will fill in the creation logic
  // that reads round-1 answers and derives initial profile fields.
  async createFromRoundOne(userId: string) {
    // Phase 5 will implement: read OnboardingRound where roundNumber=1,
    // derive careerGoal/skillLevel/learningPace from answers,
    // then upsert LearnerProfile.
    // For now, this method signature exists so the service contract is stable.
    throw new Error(
      `createFromRoundOne not yet implemented for user ${userId}`,
    );
  }

  // ── recalculate ─────────────────────────────────────────────────────────
  //
  // Synchronous recalculation entrypoint (D-10). Called by LessonsService
  // after lesson completion, quiz pass, or path completion. Incremental:
  // updates only fields relevant to the triggered event (D-11).
  //
  // If no LearnerProfile row exists (pre-onboarding user), returns quietly
  // because D-04 says profile creation belongs to Phase 5's round-1
  // completion call path.

  async recalculate(userId: string, event: RecalcEvent): Promise<void> {
    const profile = await this.prisma.learnerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      this.logger.debug(
        `No learner profile for user ${userId}, skipping recalculation`,
      );
      return;
    }

    switch (event.type) {
      case 'LESSON_COMPLETED':
        await this.handleLessonCompleted(userId, event.lessonId);
        break;
      case 'QUIZ_PASSED':
        await this.handleQuizPassed(userId);
        break;
      case 'TRACK_COMPLETED':
        await this.handleTrackCompleted(userId, event.learningPathId, profile);
        break;
    }
  }

  // ── Private: LESSON_COMPLETED handler ─────────────────────────────────
  //
  // Updates learningPace based on actual lesson time vs estimated time (D-16).
  //   FAST:   timeSpent <= estimatedMins * 60 * 0.8
  //   SLOW:   timeSpent >= estimatedMins * 60 * 1.2
  //   NORMAL: everything in between

  private async handleLessonCompleted(
    userId: string,
    lessonId: string,
  ): Promise<void> {
    const [lesson, progress] = await Promise.all([
      this.prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { estimatedMins: true },
      }),
      this.prisma.userProgress.findUnique({
        where: { userId_lessonId: { userId, lessonId } },
        select: { timeSpentSeconds: true },
      }),
    ]);

    if (!lesson || !progress) return;

    const estimatedSeconds = lesson.estimatedMins * 60;
    let learningPace: LearnerLearningPace;

    if (progress.timeSpentSeconds <= estimatedSeconds * 0.8) {
      learningPace = LearnerLearningPace.FAST;
    } else if (progress.timeSpentSeconds >= estimatedSeconds * 1.2) {
      learningPace = LearnerLearningPace.SLOW;
    } else {
      learningPace = LearnerLearningPace.NORMAL;
    }

    await this.prisma.learnerProfile.update({
      where: { userId },
      data: {
        learningPace,
        lastRecalculatedAt: new Date(),
      },
    });
  }

  // ── Private: QUIZ_PASSED handler ──────────────────────────────────────
  //
  // Updates skillLevel from quiz performance (D-14) and strengths/weaknesses
  // from per-track quiz score averages (D-15).
  //
  // SkillLevel tiers (rule-based, no AI):
  //   ADVANCED:     avgPassedScore >= 90 AND completedLessons >= 10
  //   INTERMEDIATE: avgPassedScore >= 80 AND completedLessons >= 5
  //   BEGINNER:     everything else
  //
  // Strengths/Weaknesses (per track):
  //   Track avg >= 85 → strength
  //   Track avg <  70 → weakness

  private async handleQuizPassed(userId: string): Promise<void> {
    const [passedResults, completedCount] = await Promise.all([
      this.prisma.quizResult.findMany({
        where: { userId, passed: true },
        select: {
          score: true,
          quiz: {
            select: {
              lesson: {
                select: {
                  trackLessons: {
                    select: {
                      track: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.userProgress.count({
        where: { userId, status: ProgressStatus.COMPLETED },
      }),
    ]);

    // ── Calculate average passed quiz score ──────────────────────────────
    const avgScore =
      passedResults.length > 0
        ? passedResults.reduce((sum, r) => sum + r.score, 0) /
          passedResults.length
        : 0;

    // ── Determine skillLevel (D-14) ─────────────────────────────────────
    let skillLevel: LearnerSkillLevel;
    if (avgScore >= 90 && completedCount >= 10) {
      skillLevel = LearnerSkillLevel.ADVANCED;
    } else if (avgScore >= 80 && completedCount >= 5) {
      skillLevel = LearnerSkillLevel.INTERMEDIATE;
    } else {
      skillLevel = LearnerSkillLevel.BEGINNER;
    }

    // ── Group scores by track name for strengths/weaknesses (D-15) ──────
    const trackScores = new Map<string, number[]>();
    for (const result of passedResults) {
      for (const tl of result.quiz.lesson.trackLessons) {
        const name = tl.track.name;
        if (!trackScores.has(name)) trackScores.set(name, []);
        trackScores.get(name)!.push(result.score);
      }
    }

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    for (const [trackName, scores] of trackScores) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg >= 85) strengths.push(trackName);
      else if (avg < 70) weaknesses.push(trackName);
    }

    await this.prisma.learnerProfile.update({
      where: { userId },
      data: {
        skillLevel,
        strengths: [...new Set(strengths)],
        weaknesses: [...new Set(weaknesses)],
        lastRecalculatedAt: new Date(),
      },
    });
  }

  // ── Private: TRACK_COMPLETED handler ──────────────────────────────────
  //
  // Updates preferredTopics from:
  //   1. Track names of the completed learning path
  //   2. AI chat topic signals extracted from recent AIInteractionLog rows (D-13)
  //
  // Merges new topics with existing preferredTopics (additive, unique).
  // Preserves careerGoal — Prisma update only touches specified fields.

  private async handleTrackCompleted(
    userId: string,
    learningPathId: string,
    profile: LearnerProfile,
  ): Promise<void> {
    // ── Load track names from the completed learning path ───────────────
    const tracks = await this.prisma.track.findMany({
      where: { learningPathId },
      select: { name: true },
    });
    const trackTopics = tracks.map((t) => t.name.toLowerCase());

    // ── Query recent aiInteractionLog rows for topic extraction (D-13) ──
    const aiLogs = await this.prisma.aIInteractionLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { questionSummary: true, sessionContext: true },
    });

    // ── Extract topic tokens from AI chat logs ──────────────────────────
    const aiTexts = aiLogs.flatMap((log) => [
      log.questionSummary,
      log.sessionContext,
    ]);
    const aiTopics = this.extractTopicTokens(aiTexts);

    // ── Merge with existing preferredTopics (unique) ────────────────────
    const existingTopics = Array.isArray(profile.preferredTopics)
      ? (profile.preferredTopics as string[])
      : [];

    const mergedTopics = [
      ...new Set([
        ...existingTopics.map((t) => t.toLowerCase()),
        ...trackTopics,
        ...aiTopics,
      ]),
    ];

    await this.prisma.learnerProfile.update({
      where: { userId },
      data: {
        preferredTopics: mergedTopics,
        lastRecalculatedAt: new Date(),
      },
    });
  }

  // ── Private: Extract topic tokens from text ───────────────────────────
  //
  // Deterministic extraction only (no AI services, no sentiment scoring).
  // Strategy: normalize → split on commas/delimiters → trim → filter filler
  // → keep tokens >= 3 chars → deduplicate.

  private extractTopicTokens(texts: string[]): string[] {
    const tokens = new Set<string>();
    for (const text of texts) {
      if (!text) continue;
      const normalized = text.toLowerCase();
      // Split on commas, semicolons, pipes, and newlines
      const parts = normalized.split(/[,;|\n]+/);
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.length >= 3 && !FILLER_WORDS.has(trimmed)) {
          tokens.add(trimmed);
        }
      }
    }
    return [...tokens];
  }
}
