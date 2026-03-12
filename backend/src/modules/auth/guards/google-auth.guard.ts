// google-auth.guard.ts - Guard kích hoạt Google OAuth flow
//
// Khi gắn @UseGuards(GoogleAuthGuard):
//   - Route đầu tiên (GET /auth/google): redirect tới Google consent screen
//   - Route callback (GET /auth/google/callback): xử lý response từ Google
//
// Tại sao tách guard riêng thay vì dùng AuthGuard('google') trực tiếp?
// → Consistency: pattern giống JwtAuthGuard
// → Có thể extend thêm logic sau (ví dụ: custom error handling)

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
