import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/index.js';
import { LearningPathsService } from './learning-paths.service.js';

const mockUserId = 'user-uuid-123';
const mockPathSlug = 'frontend-developer';
const mockLearningPathId = 'path-uuid-456';
const mockTrackId = 'track-uuid-789';
const mockLessonId = 'lesson-uuid-101';

const mockLearningPath = {
  id: mockLearningPathId,
  name: 'Frontend Developer',
  slug: mockPathSlug,
  description: 'Learn frontend from zero to hero',
  icon: 'layout',
  difficulty: 'beginner',
  estimatedHours: 120,
  isPublished: true,
  order: 1,
  createdAt: new Date('2026-03-15T10:00:00.000Z'),
  updatedAt: new Date('2026-03-15T10:00:00.000Z'),
};

const mockTrack = {
  id: mockTrackId,
  learningPathId: mockLearningPathId,
  name: 'HTML & CSS Fundamentals',
  description: 'Build strong web foundations',
  order: 1,
  isOptional: false,
  createdAt: new Date('2026-03-15T10:00:00.000Z'),
  updatedAt: new Date('2026-03-15T10:00:00.000Z'),
};

const mockTrackLesson = {
  id: 'track-lesson-uuid-202',
  trackId: mockTrackId,
  lessonId: mockLessonId,
  order: 1,
  createdAt: new Date('2026-03-15T10:00:00.000Z'),
};

const mockUserLearningPath = {
  id: 'user-learning-path-uuid-303',
  userId: mockUserId,
  learningPathId: mockLearningPathId,
  currentLessonId: mockLessonId,
  startedAt: new Date('2026-03-15T10:00:00.000Z'),
  completedAt: null,
  aiRecommendations: null,
};

describe('LearningPathsService', () => {
  let service: LearningPathsService;
  let prisma: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      learningPath: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      track: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      trackLesson: {
        findFirst: jest.fn(),
      },
      userLearningPath: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LearningPathsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<LearningPathsService>(LearningPathsService);
    prisma = module.get(PrismaService);
  });

  describe('listPaths', () => {
    it('should return published learning paths with track count', async () => {
      const mockPaths = [
        {
          ...mockLearningPath,
          _count: { tracks: 3 },
        },
      ];
      prisma.learningPath.findMany.mockResolvedValue(mockPaths);

      const result = await service.listPaths();

      expect(prisma.learningPath.findMany).toHaveBeenCalledWith({
        where: { isPublished: true },
        orderBy: { order: 'asc' },
        include: {
          _count: { select: { tracks: true } },
        },
      });
      expect(result).toEqual(mockPaths);
    });
  });

  describe('getPathBySlug', () => {
    it('should return a published learning path with ordered tracks and lesson count', async () => {
      const mockPathWithTracks = {
        ...mockLearningPath,
        tracks: [
          {
            ...mockTrack,
            _count: { trackLessons: 5 },
          },
        ],
      };
      prisma.learningPath.findFirst.mockResolvedValue(mockPathWithTracks);

      const result = await service.getPathBySlug(mockPathSlug);

      expect(prisma.learningPath.findFirst).toHaveBeenCalledWith({
        where: { slug: mockPathSlug, isPublished: true },
        include: {
          tracks: {
            orderBy: { order: 'asc' },
            include: {
              _count: { select: { trackLessons: true } },
            },
          },
        },
      });
      expect(result).toEqual(mockPathWithTracks);
    });

    it('should throw NotFoundException when the learning path does not exist or is not published', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(null);

      const promise = service.getPathBySlug(mockPathSlug);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('getPathLessons', () => {
    it('should return ordered tracks with ordered lessons for a published learning path', async () => {
      const mockTracksWithLessons = [
        {
          ...mockTrack,
          trackLessons: [
            {
              ...mockTrackLesson,
              lesson: {
                id: mockLessonId,
                title: 'Introduction to HTML',
                slug: 'introduction-to-html',
                summary: 'Learn the structure of a web page',
                estimatedMins: 20,
              },
            },
          ],
        },
      ];
      prisma.learningPath.findFirst.mockResolvedValue({ id: mockLearningPathId });
      prisma.track.findMany.mockResolvedValue(mockTracksWithLessons);

      const result = await service.getPathLessons(mockPathSlug);

      expect(prisma.learningPath.findFirst).toHaveBeenCalledWith({
        where: { slug: mockPathSlug, isPublished: true },
        select: { id: true },
      });
      expect(prisma.track.findMany).toHaveBeenCalledWith({
        where: { learningPathId: mockLearningPathId },
        orderBy: { order: 'asc' },
        include: {
          trackLessons: {
            orderBy: { order: 'asc' },
            include: {
              lesson: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  summary: true,
                  estimatedMins: true,
                },
              },
            },
          },
        },
      });
      expect(result).toEqual(mockTracksWithLessons);
    });

    it('should throw NotFoundException when the learning path is missing', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(null);

      const promise = service.getPathLessons(mockPathSlug);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toMatchObject({ status: 404 });
      expect(prisma.track.findMany).not.toHaveBeenCalled();
    });
  });

  describe('enrollInPath', () => {
    it('should create user learning path with currentLessonId set to the first lesson', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(mockLearningPath);
      prisma.userLearningPath.findUnique.mockResolvedValue(null);
      prisma.track.findFirst.mockResolvedValue(mockTrack);
      prisma.trackLesson.findFirst.mockResolvedValue(mockTrackLesson);
      prisma.userLearningPath.create.mockResolvedValue(mockUserLearningPath);

      const result = await service.enrollInPath(mockUserId, mockPathSlug);

      expect(prisma.learningPath.findFirst).toHaveBeenCalledWith({
        where: { slug: mockPathSlug, isPublished: true },
      });
      expect(prisma.userLearningPath.findUnique).toHaveBeenCalledWith({
        where: {
          userId_learningPathId: {
            userId: mockUserId,
            learningPathId: mockLearningPathId,
          },
        },
      });
      expect(prisma.track.findFirst).toHaveBeenCalledWith({
        where: { learningPathId: mockLearningPathId },
        orderBy: { order: 'asc' },
      });
      expect(prisma.trackLesson.findFirst).toHaveBeenCalledWith({
        where: { trackId: mockTrackId },
        orderBy: { order: 'asc' },
      });
      expect(prisma.userLearningPath.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          learningPathId: mockLearningPathId,
          currentLessonId: mockLessonId,
        },
      });
      expect(result).toEqual(mockUserLearningPath);
    });

    it('should throw NotFoundException when the learning path does not exist or is not published', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(null);

      const promise = service.enrollInPath(mockUserId, mockPathSlug);

      await expect(promise).rejects.toThrow(NotFoundException);
      await expect(promise).rejects.toMatchObject({ status: 404 });
      expect(prisma.userLearningPath.findUnique).not.toHaveBeenCalled();
      expect(prisma.track.findFirst).not.toHaveBeenCalled();
      expect(prisma.userLearningPath.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the user is already enrolled in the learning path', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(mockLearningPath);
      prisma.userLearningPath.findUnique.mockResolvedValue(mockUserLearningPath);

      const promise = service.enrollInPath(mockUserId, mockPathSlug);

      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toMatchObject({ status: 409 });
      expect(prisma.track.findFirst).not.toHaveBeenCalled();
      expect(prisma.trackLesson.findFirst).not.toHaveBeenCalled();
      expect(prisma.userLearningPath.create).not.toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException when the learning path has no tracks', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(mockLearningPath);
      prisma.userLearningPath.findUnique.mockResolvedValue(null);
      prisma.track.findFirst.mockResolvedValue(null);

      const promise = service.enrollInPath(mockUserId, mockPathSlug);

      await expect(promise).rejects.toThrow(UnprocessableEntityException);
      await expect(promise).rejects.toMatchObject({ status: 422 });
      expect(prisma.trackLesson.findFirst).not.toHaveBeenCalled();
      expect(prisma.userLearningPath.create).not.toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException when the first track has no lessons', async () => {
      prisma.learningPath.findFirst.mockResolvedValue(mockLearningPath);
      prisma.userLearningPath.findUnique.mockResolvedValue(null);
      prisma.track.findFirst.mockResolvedValue(mockTrack);
      prisma.trackLesson.findFirst.mockResolvedValue(null);

      const promise = service.enrollInPath(mockUserId, mockPathSlug);

      await expect(promise).rejects.toThrow(UnprocessableEntityException);
      await expect(promise).rejects.toMatchObject({ status: 422 });
      expect(prisma.userLearningPath.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when race condition causes P2002 duplicate key error', async () => {
      // Simulate TOCTOU race condition:
      // 1. findUnique returns null (duplicate check passes)
      // 2. But another request created the record simultaneously
      // 3. Prisma.create throws P2002 unique constraint violation
      prisma.learningPath.findFirst.mockResolvedValue(mockLearningPath);
      prisma.userLearningPath.findUnique.mockResolvedValue(null);
      prisma.track.findFirst.mockResolvedValue(mockTrack);
      prisma.trackLesson.findFirst.mockResolvedValue(mockTrackLesson);

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      prisma.userLearningPath.create.mockRejectedValue(p2002Error);

      const promise = service.enrollInPath(mockUserId, mockPathSlug);

      await expect(promise).rejects.toThrow(ConflictException);
      await expect(promise).rejects.toMatchObject({ status: 409 });
    });
  });
});
