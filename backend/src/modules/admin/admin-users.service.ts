import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/index.js';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto.js';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(query: AdminUsersQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      tier,
      sort = 'createdAt',
      order = 'desc',
    } = query;

    const where: Record<string, unknown> = {};

    if (search) {
      where['OR'] = [
        { email: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where['role'] = role;
    }

    if (tier) {
      where['tier'] = tier;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          tier: true,
          emailVerified: true,
          createdAt: true,
          deletedAt: true,
          _count: {
            select: {
              userLearningPaths: true,
              learningSessions: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}
