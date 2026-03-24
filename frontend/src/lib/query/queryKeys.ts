/**
 * Centralized query keys for React Query.
 * Mutations use these keys for targeted invalidation.
 *
 * Convention:
 * - Top-level keys are arrays (used as prefix for invalidateQueries)
 * - Function keys return tuples for specific queries
 */
export const qk = {
  dashboard: ['dashboard', 'overview'] as const,

  learningPaths: ['learning-paths'] as const,
  myEnrollments: ['learning-paths', 'my-enrollments'] as const,

  progressOverview: ['progress', 'overview'] as const,
  pathProgress: (pathId: string) => ['progress', 'path', pathId] as const,

  lesson: (slug: string) => ['lesson', slug] as const,
  lessonOutline: (pathSlug: string) =>
    ['learning-paths', pathSlug, 'lessons'] as const,

  quiz: (lessonSlug: string) => ['lesson', lessonSlug, 'quiz'] as const,
} as const;
