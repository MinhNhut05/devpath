// mail.module.ts - Email module configuration
//
// Dung MailerModule.forRootAsync() de doc config tu .env (giong JwtModule.registerAsync)
// Dev: Mailhog (localhost:1025, khong can auth)
// Prod: Resend SMTP hoac bat ky SMTP provider nao
//
// Tai sao dung conditional auth?
// → Mailhog KHONG can username/password (local dev tool)
// → Resend/SendGrid CAN auth
// → Kiem tra MAIL_USER co hay khong de quyet dinh

import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service.js';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST', 'localhost'),
          port: config.get<number>('MAIL_PORT', 1025),
          // Conditional auth: chi them neu MAIL_USER co gia tri
          // Dev (Mailhog): MAIL_USER = '' → khong auth
          // Prod (Resend): MAIL_USER = 'apikey' → co auth
          ...(config.get<string>('MAIL_USER')
            ? {
                auth: {
                  user: config.get<string>('MAIL_USER'),
                  pass: config.get<string>('MAIL_PASS'),
                },
              }
            : {}),
        },
        defaults: {
          from: config.get<string>('EMAIL_FROM', 'noreply@devpathlearn.com'),
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
