// admin-lessons.service.spec.ts
// Tests: createLesson (success, slug conflict, track not found),
// updateLesson (success, not found, slug conflict, trackLesson update),
// deleteLesson (success, not found, has progress → 409)

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/index.js';
import { AdminLessonsService } from './admin-lessons.service.js';

describe('AdminLessonsService', () => {
  let service: AdminLessonsService;
  let prisma: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      lesson: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      track: { findUnique: jest.fn() },
      trackLesson: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      userProgress: { count: jest.fn() },
      $transaction: jest.fn((fn: any) => fn(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminLessonsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AdminLessonsService>(AdminLessonsService);
    prisma = module.get(PrismaService);
  });

  // ── createLesson ───────────────────────────────────────────────────────

  describe('createLesson()', () => {
    const dto = {
      title: 'HTML Basics',
      slug: 'html-basics',
      summary: 'Learn HTML',
      estimatedMins: 30,
      trackId: 'track-1',
      order: 1,
    };

    it('should create lesson and trackLesson in transaction', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null); // no slug conflict
      prisma.track.findUnique.mockResolvedValue({ id: 'track-1' });
      prisma.lesson.create.mockResolvedValue({ id: 'lesson-1', ...dto });
      prisma.trackLesson.create.mockResolvedValue({});

      const result = await service.createLesson(dto);

      expect(result.id).toBe('lesson-1');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw ConflictException on duplicate slug', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 'existing', slug: 'html-basics' });

      await expect(service.createLesson(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when track not found', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null); // no slug conflict
      prisma.track.findUnique.mockResolvedValue(null);

      await expect(service.createLesson(dto)).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateLesson ───────────────────────────────────────────────────────

  describe('updateLesson()', () => {
    it('should update lesson fields successfully', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1', slug: 'old-slug' });
      prisma.lesson.update.mockResolvedValue({ id: 'lesson-1', title: 'Updated' });

      const result = await service.updateLesson('lesson-1', { title: 'Updated' });

      expect(result.title).toBe('Updated');
    });

    it('should throw NotFoundException when lesson not found', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(
        service.updateLesson('nonexistent', { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when new slug conflicts', async () => {
      prisma.lesson.findUnique
        .mockResolvedValueOnce({ id: 'lesson-1', slug: 'old-slug' })
        .mockResolvedValueOnce({ id: 'lesson-2', slug: 'taken-slug' });

      await expect(
        service.updateLesson('lesson-1', { slug: 'taken-slug' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should update trackLesson when trackId or order provided', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1', slug: 'test' });
      prisma.lesson.update.mockResolvedValue({ id: 'lesson-1' });
      prisma.trackLesson.findFirst.mockResolvedValue({ id: 'tl-1', lessonId: 'lesson-1' });
      prisma.trackLesson.update.mockResolvedValue({});

      await service.updateLesson('lesson-1', { order: 5 });

      expect(prisma.trackLesson.update).toHaveBeenCalledWith({
        where: { id: 'tl-1' },
        data: { order: 5 },
      });
    });
  });

  // ── deleteLesson ───────────────────────────────────────────────────────

  describe('deleteLesson()', () => {
    it('should soft-delete (unpublish) lesson successfully', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
      prisma.userProgress.count.mockResolvedValue(0);
      prisma.lesson.update.mockResolvedValue({ id: 'lesson-1', isPublished: false });

      const result = await service.deleteLesson('lesson-1');

      expect(result.isPublished).toBe(false);
    });

    it('should throw NotFoundException when lesson not found', async () => {
      prisma.lesson.findUnique.mockResolvedValue(null);

      await expect(service.deleteLesson('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when lesson has user progress', async () => {
      prisma.lesson.findUnique.mockResolvedValue({ id: 'lesson-1' });
      prisma.userProgress.count.mockResolvedValue(10);

      await expect(service.deleteLesson('lesson-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
