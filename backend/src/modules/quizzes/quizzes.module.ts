// quizzes.module.ts - Quizzes module registration
//
// Module quản lý quiz system:
//   - Lấy quiz theo lesson slug hoặc quiz ID
//   - Submit quiz answers (SINGLE_CHOICE, MULTIPLE_CHOICE)
//   - Evaluate essay answers (AI grading)
//   - Run code challenges (Judge0 API)
//   - Xem quiz results
//
// imports: [AuthModule] → tất cả routes cần JwtAuthGuard
// PrismaService có sẵn qua @Global() PrismaModule
//
// EssayGraderService + CodeRunnerService: registered sẵn dù chưa implement
// → TypeScript compile pass, Tab 3/4 sẽ implement logic sau

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/index.js';
import { QuizzesService } from './quizzes.service.js';
import { QuizzesController } from './quizzes.controller.js';
import { EssayGraderService, CodeRunnerService } from './grading/index.js';

@Module({
  imports: [
    // AuthModule: cung cấp JwtAuthGuard + JwtStrategy
    // Tất cả quiz routes cần auth (quiz là protected content)
    AuthModule,
  ],
  controllers: [QuizzesController],
  providers: [
    QuizzesService,
    // Grading services — stubs cho Tab 3 (essay) và Tab 4 (code)
    EssayGraderService,
    CodeRunnerService,
  ],
})
export class QuizzesModule {}
