// ai-chat.module.ts - AI Chat module registration
//
// imports: [AuthModule] -> de lay JwtAuthGuard tu AuthModule
// Khong can import AiModule (da @Global) hay PrismaModule (da @Global)
//
// providers: AiChatService + AiContextBuilder
// AiContextBuilder build system prompt tu database context (lesson, progress, quiz)

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/index.js';
import { AiChatController } from './ai-chat.controller.js';
import { AiChatService } from './ai-chat.service.js';
import { AiContextBuilder } from './context/index.js';

@Module({
  imports: [
    // AuthModule: cung cap JwtAuthGuard + JwtStrategy (de verify token)
    AuthModule,
  ],
  controllers: [AiChatController],
  providers: [AiChatService, AiContextBuilder],
})
export class AiChatModule {}
