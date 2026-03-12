// src/modules/auth/index.ts
// Barrel export - import gọn từ một chỗ:
//   import { AuthModule, AuthService } from './modules/auth/index.js';
// thay vì phải import từng file riêng lẻ

export { AuthModule } from './auth.module.js';
export { AuthService } from './auth.service.js';
export { AuthController } from './auth.controller.js';
export type { TokenUser, TokenPair, OtpVerifyResult, OAuthProfile } from './auth.service.js';
export { JwtAuthGuard, RolesGuard } from './guards/index.js';
export { Roles, ROLES_KEY } from './decorators/index.js';
