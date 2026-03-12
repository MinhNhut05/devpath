import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { TransformInterceptor, HttpExceptionFilter } from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet: set secure HTTP headers mặc định
  // Giúp giảm risk của XSS, clickjacking, MIME sniffing...
  app.use(helmet());

  // cookie-parser: cho phép đọc req.cookies
  // Bắt buộc cho refresh token (lưu trong HttpOnly cookie)
  app.use(cookieParser());

  // Global Pipes, Interceptors, Filters
  // Thứ tự xử lý: Middleware → Guards → Interceptors → Pipes → Controller → Interceptors → Filters
  //
  // 1. ValidationPipe: Validate input DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 2. TransformInterceptor: Wrap successful responses → { success: true, data, meta }
  app.useGlobalInterceptors(new TransformInterceptor());

  // 3. HttpExceptionFilter: Catch errors → { success: false, error, meta }
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS: Cho phép frontend gọi API từ domain khác
  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  // Set global prefix cho tất cả routes
  // Ví dụ: /users -> /api/v1/users
  app.setGlobalPrefix('api/v1');

  // Sử dụng PORT từ environment hoặc mặc định 3001
  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
