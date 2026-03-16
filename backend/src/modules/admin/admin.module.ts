import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/index.js';
import { AdminUsersController } from './admin-users.controller.js';
import { AdminUsersService } from './admin-users.service.js';
import { AdminAnalyticsController } from './admin-analytics.controller.js';
import { AdminAnalyticsService } from './admin-analytics.service.js';
import { AdminLearningPathsController } from './admin-learning-paths.controller.js';
import { AdminLearningPathsService } from './admin-learning-paths.service.js';
import { AdminTracksController } from './admin-tracks.controller.js';
import { AdminTracksService } from './admin-tracks.service.js';
import { AdminLessonsController } from './admin-lessons.controller.js';
import { AdminLessonsService } from './admin-lessons.service.js';
import { AdminQuizzesController } from './admin-quizzes.controller.js';
import { AdminQuizzesService } from './admin-quizzes.service.js';
import { AdminContentController } from './admin-content.controller.js';
import { AdminContentService } from './admin-content.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminUsersController,
    AdminAnalyticsController,
    AdminLearningPathsController,
    AdminTracksController,
    AdminLessonsController,
    AdminQuizzesController,
    AdminContentController,
  ],
  providers: [
    AdminUsersService,
    AdminAnalyticsService,
    AdminLearningPathsService,
    AdminTracksService,
    AdminLessonsService,
    AdminQuizzesService,
    AdminContentService,
  ],
})
export class AdminModule {}
