// JwtStrategy - Nơi thực sự verify JWT token
//
// Flow chi tiết:
// 1. Guard gọi Strategy
// 2. Strategy dùng config trong constructor để:
//    - Lấy token từ header "Authorization: Bearer eyJhbGci..."
//    - Verify chữ ký token bằng JWT_ACCESS_SECRET
//    - Check token hết hạn chưa (ignoreExpiration: false)
// 3. Nếu token hợp lệ → gọi validate() với payload bên trong token
// 4. validate() trả về object → NestJS gắn vào request.user
//
// Sau này trong controller, bạn truy cập user qua:
//   @Get('me')
//   getMe(@Request() req) {
//     console.log(req.user); // { id: '...', email: '...', role: 'USER' }
//   }

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // ConfigService được inject qua constructor (Dependency Injection)
  // Nó đọc giá trị từ .env file (đã load bởi ConfigModule trong AppModule)
  constructor(private readonly configService: ConfigService) {
    // super() gọi constructor của PassportStrategy(Strategy)
    // Truyền config cho passport-jwt biết cách xử lý token
    super({
      // Lấy token từ đâu? → Từ header "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Token hết hạn có bỏ qua không? → KHÔNG, phải reject
      ignoreExpiration: false,

      // Secret key để verify chữ ký token
      // Phải TRÙNG với key dùng khi tạo token (trong AuthService sau này)
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  // validate() được gọi SAU KHI token đã verify thành công
  // payload = nội dung bên trong token (sub, email, role, type, iat, exp)
  // Return value sẽ được gắn vào request.user
  validate(payload: { sub: string; email: string; role: string }) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
