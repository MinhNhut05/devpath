// admin-learning-paths.service.spec.ts
// Tests: listLearningPaths (search, pagination), createLearningPath (success, duplicate slug),
// updateLearningPath (success, not found, slug conflict), deleteLearningPath (success, enrolled users → 409)

import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/index.js';
import { AdminLearningPathsService } from './admin-learning-paths.service.js';

describe('AdminLearningPathsService', () => {
  let service: AdminLearningPathsService;
  let prisma: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      learningPath: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userLearningPath: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminLearningPathsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AdminLearningPathsService>(AdminLearningPathsService);
    prisma = module.get(PrismaService);
  });

  // ── listLearningPaths ─────────────────────────────────────────────────

  describe('listLearningPaths()', () => {
    it('should return paginated list with defaults', async () => {
      const mockItems = [
        { id: 'lp-1', name: 'Frontend', slug: 'frontend', _count: { tracks: 3, userLearningPaths: 10 } },
      ];
      prisma.learningPath.findMany.mockResolvedValue(mockItems);
      prisma.learningPath.count.mockResolvedValue(1);

      const result = await service.listLearningPaths({});

      expect(result.items).toEqual(mockItems);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      // Default: only published
      expect(prisma.learningPath.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isPublished: true },
        }),
      );
    });

    it('should filter by search term (case-insensitive)', async () => {
      prisma.learningPath.findMany.mockResolvedValue([]);
      prisma.learningPath.count.mockResolvedValue(0);

      await service.listLearningPaths({ search: 'react' });

      expect(prisma.learningPath.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'react', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should include unpublished when includeUnpublished is true', async () => {
      prisma.learningPath.findMany.mockResolvedValue([]);
      prisma.learningPath.count.mockResolvedValue(0);

      await service.listLearningPaths({ includeUnpublished: true });

      // Should NOT have isPublished filter
      expect(prisma.learningPath.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });

    it('should paginate correctly (page 2, limit 5)', async () => {
      prisma.learningPath.findMany.mockResolvedValue([]);
      prisma.learningPath.count.mockResolvedValue(10);

      const result = await service.listLearningPaths({ page: 2, limit: 5 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(prisma.learningPath.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (2-1) * 5
          take: 5,
        }),
      );
    });
  });

  // ── createLearningPath ────────────────────────────────────────────────

  describe('createLearningPath()', () => {
    const createDto = {
      name: 'Frontend',
      slug: 'frontend',
      description: 'Learn frontend',
      difficulty: 'beginner',
      estimatedHours: 40,
    };

    it('should create learning path successfully', async () => {
      prisma.learningPath.findUnique.mockResolvedValue(null);
      prisma.learningPath.create.mockResolvedValue({ id: 'lp-new', ...createDto });

      const result = await service.createLearningPath(createDto);

      expect(result.id).toBe('lp-new');
      expect(prisma.learningPath.create).toHaveBeenCalledWith({ data: createDto });
    });

    it('should throw ConflictException on duplicate slug', async () => {
      prisma.learningPath.findUnique.mockResolvedValue({ id: 'lp-existing', slug: 'frontend' });

      await expect(service.createLearningPath(createDto)).rejects.toThrow(ConflictException);
      expect(prisma.learningPath.create).not.toHaveBeenCalled();
    });
  });

  // ── updateLearningPath ────────────────────────────────────────────────

  describe('updateLearningPath()', () => {
    it('should update learning path successfully', async () => {
      prisma.learningPath.findUnique.mockResolvedValue({ id: 'lp-1', slug: 'frontend' });
      prisma.learningPath.update.mockResolvedValue({ id: 'lp-1', name: 'Updated' });

      const result = await service.updateLearningPath('lp-1', { name: 'Updated' });

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when path not found', async () => {
      prisma.learningPath.findUnique.mockResolvedValue(null);

      await expect(
        service.updateLearningPath('nonexistent', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when new slug conflicts', async () => {
      // First call: find existing path (it exists)
      // Second call: check slug conflict (another path has this slug)
      prisma.learningPath.findUnique
        .mockResolvedValueOnce({ id: 'lp-1', slug: 'old-slug' })
        .mockResolvedValueOnce({ id: 'lp-2', slug: 'taken-slug' });

      await expect(
        service.updateLearningPath('lp-1', { slug: 'taken-slug' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow update when slug stays the same', async () => {
      prisma.learningPath.findUnique.mockResolvedValue({ id: 'lp-1', slug: 'frontend' });
      prisma.learningPath.update.mockResolvedValue({ id: 'lp-1', slug: 'frontend', name: 'New Name' });

      const result = await service.updateLearningPath('lp-1', {
        slug: 'frontend',
        name: 'New Name',
      });

      // Should NOT call findUnique again for slug check
      expect(prisma.learningPath.findUnique).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('New Name');
    });
  });

  // ── deleteLearningPath ────────────────────────────────────────────────

  describe('deleteLearningPath()', () => {
    it('should soft-delete (unpublish) learning path', async () => {
      prisma.learningPath.findUnique.mockResolvedValue({ id: 'lp-1' });
      prisma.userLearningPath.count.mockResolvedValue(0);
      prisma.learningPath.update.mockResolvedValue({ id: 'lp-1', isPublished: false });

      const result = await service.deleteLearningPath('lp-1');

      expect(result.isPublished).toBe(false);
      expect(prisma.learningPath.update).toHaveBeenCalledWith({
        where: { id: 'lp-1' },
        data: { isPublished: false },
      });
    });

    it('should throw NotFoundException when path not found', async () => {
      prisma.learningPath.findUnique.mockResolvedValue(null);

      await expect(service.deleteLearningPath('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when users are enrolled (409)', async () => {
      prisma.learningPath.findUnique.mockResolvedValue({ id: 'lp-1' });
      prisma.userLearningPath.count.mockResolvedValue(5);

      await expect(service.deleteLearningPath('lp-1')).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.learningPath.update).not.toHaveBeenCalled();
    });
  });
});
