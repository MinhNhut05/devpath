// ai.module.ts - Global AI module
//
// @Global() -> AiService tu dong available o tat ca modules
// Khong can import AiModule trong tung module con
// Tuong tu PrismaModule va ConfigModule

import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service.js';

@Global()
@Module({
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
