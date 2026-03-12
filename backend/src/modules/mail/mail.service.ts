// mail.service.ts - Email sending service
//
// Service nay chi lam 1 viec: gui email.
// Hien tai chi co sendOtpEmail(), sau nay se them:
//   - sendWelcomeEmail()
//   - sendPasswordResetEmail()
//
// Tai sao tach thanh service rieng thay vi gui truc tiep trong AuthService?
// → Single Responsibility: AuthService lo logic auth, MailService lo gui email
// → De test: mock MailService khi test AuthService (khong gui email that)
// → De thay doi: doi tu Mailhog sang Resend chi can sua MailModule config

import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  /**
   * Gui OTP code qua email
   *
   * @param email - Dia chi email nguoi nhan
   * @param otpCode - Ma OTP 6 chu so (plaintext, chua hash)
   */
  async sendOtpEmail(email: string, otpCode: string): Promise<void> {
    await this.mailerService.sendMail({
      to: email,
      subject: 'DevPath - Your login code',
      // text: fallback cho email client khong ho tro HTML
      text: `Your login code is: ${otpCode}\n\nThis code expires in 2 minutes.\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
          <h2>DevPath Login</h2>
          <p>Your login code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px;
                      padding: 16px; background: #f3f4f6; border-radius: 8px;
                      text-align: center;">
            ${otpCode}
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This code expires in 2 minutes.<br/>
            If you did not request this, please ignore this email.
          </p>
        </div>
      `,
    });

    this.logger.log(`OTP email sent to ${email}`);
  }
}
