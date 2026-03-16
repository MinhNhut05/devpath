// admin-tracks.service.spec.ts
// Tests: createTrack (success, path not found), updateTrack (success, not found), deleteTrack (success, has progress → 409)

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/index.js';
import { AdminTracksService } from './admin-tracks.service.js';

describe('AdminTracksService', () => {
  let service: AdminTracksService;
  let prisma: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      learningPath: { findUnique: jest.fn() },
      track: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      trackLesson: { findMany: jest.fn() },
      userProgress: { count: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminTracksService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AdminTracksService>(AdminTracksService);
    prisma = module.get(PrismaService);
  });

  // ── createTrack ────────────────────────────────────────────────────────

  describe('createTrack()', () => {
    const dto = { learningPathId: 'lp-1', name: 'Basics', order: 1 };

    it('should create track successfully', async () => {
      prisma.learningPath.findUnique.mockResolvedValue({ id: 'lp-1' });
      prisma.track.create.mockResolvedValue({ id: 'track-1', ...dto });

      const result = await service.createTrack(dto);

      expect(result.id).toBe('track-1');
      expect(prisma.track.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should throw NotFoundException when learning path not found', async () => {
      prisma.learningPath.findUnique.mockResolvedValue(null);

      await expect(service.createTrack(dto)).rejects.toThrow(NotFoundException);
      expect(prisma.track.create).not.toHaveBeenCalled();
    });
  });

  // ── updateTrack ────────────────────────────────────────────────────────

  describe('updateTrack()', () => {
    it('should update track successfully', async () => {
      prisma.track.findUnique.mockResolvedValue({ id: 'track-1' });
      prisma.track.update.mockResolvedValue({ id: 'track-1', name: 'Advanced' });

      const result = await service.updateTrack('track-1', { name: 'Advanced' });

      expect(result.name).toBe('Advanced');
    });

    it('should throw NotFoundException when track not found', async () => {
      prisma.track.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTrack('nonexistent', { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── deleteTrack ────────────────────────────────────────────────────────

  describe('deleteTrack()', () => {
    it('should delete track when no user progress exists', async () => {
      prisma.track.findUnique.mockResolvedValue({ id: 'track-1' });
      prisma.trackLesson.findMany.mockResolvedValue([
        { lessonId: 'lesson-1' },
        { lessonId: 'lesson-2' },
      ]);
      prisma.userProgress.count.mockResolvedValue(0);
      prisma.track.delete.mockResolvedValue({ id: 'track-1' });

      const result = await service.deleteTrack('track-1');

      expect(result.id).toBe('track-1');
      expect(prisma.track.delete).toHaveBeenCalledWith({ where: { id: 'track-1' } });
    });

    it('should delete track when it has no lessons', async () => {
      prisma.track.findUnique.mockResolvedValue({ id: 'track-1' });
      prisma.trackLesson.findMany.mockResolvedValue([]); // no lessons
      prisma.track.delete.mockResolvedValue({ id: 'track-1' });

      const result = await service.deleteTrack('track-1');

      expect(result.id).toBe('track-1');
      // userProgress.count should NOT be called when no lessons
      expect(prisma.userProgress.count).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when track not found', async () => {
      prisma.track.findUnique.mockResolvedValue(null);

      await expect(service.deleteTrack('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when track has user progress', async () => {
      prisma.track.findUnique.mockResolvedValue({ id: 'track-1' });
      prisma.trackLesson.findMany.mockResolvedValue([{ lessonId: 'lesson-1' }]);
      prisma.userProgress.count.mockResolvedValue(3);

      await expect(service.deleteTrack('track-1')).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.track.delete).not.toHaveBeenCalled();
    });
  });
});
