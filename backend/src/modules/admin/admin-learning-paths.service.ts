import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/index.js';
import { AdminListQueryDto } from './dto/index.js';
import { CreateLearningPathDto } from './dto/index.js';
import { UpdateLearningPathDto } from './dto/index.js';

@Injectable()
export class AdminLearningPathsService {
  constructor(private readonly prisma: PrismaService) {}

  async listLearningPaths(query: AdminListQueryDto) {
    const { page = 1, limit = 20, search, includeUnpublished = false } = query;

    const where: Record<string, unknown> = {};

    if (search) {
      where['name'] = { contains: search, mode: 'insensitive' };
    }

    if (!includeUnpublished) {
      where['isPublished'] = true;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.learningPath.findMany({
        where,
        include: {
          _count: {
            select: {
              tracks: true,
              userLearningPaths: true,
            },
          },
        },
        orderBy: { order: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.learningPath.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async createLearningPath(dto: CreateLearningPathDto) {
    const existing = await this.prisma.learningPath.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Slug already exists');
    }

    return this.prisma.learningPath.create({ data: dto });
  }

  async updateLearningPath(id: string, dto: UpdateLearningPathDto) {
    const existing = await this.prisma.learningPath.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Learning path with id "${id}" not found`);
    }

    // Nếu slug thay đổi, check xem slug mới có bị trùng không (exclude current)
    if (dto.slug && dto.slug !== existing.slug) {
      const slugConflict = await this.prisma.learningPath.findUnique({
        where: { slug: dto.slug },
      });

      if (slugConflict) {
        throw new ConflictException('Slug already exists');
      }
    }

    return this.prisma.learningPath.update({
      where: { id },
      data: dto,
    });
  }

  async deleteLearningPath(id: string) {
    const existing = await this.prisma.learningPath.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Learning path with id "${id}" not found`);
    }

    // Không cho xóa nếu có user đang enrolled
    const enrolledCount = await this.prisma.userLearningPath.count({
      where: { learningPathId: id },
    });

    if (enrolledCount > 0) {
      throw new ConflictException(
        `Cannot delete path with enrolled users (${enrolledCount} users enrolled)`,
      );
    }

    // Soft delete: unpublish thay vì xóa hẳn
    return this.prisma.learningPath.update({
      where: { id },
      data: { isPublished: false },
    });
  }
}
