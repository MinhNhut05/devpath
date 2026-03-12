import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service.js';
import { MailerService } from '@nestjs-modules/mailer';

describe('MailService', () => {
  let mailService: MailService;
  let mailerService: { sendMail: jest.Mock };

  beforeEach(async () => {
    mailerService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: mailerService,
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  describe('sendOtpEmail', () => {
    it('should call mailerService.sendMail with correct parameters', async () => {
      await mailService.sendOtpEmail('test@example.com', '123456');

      expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'DevPath - Your login code',
        }),
      );
    });

    it('should include OTP code in email body', async () => {
      await mailService.sendOtpEmail('test@example.com', '654321');

      const callArgs = mailerService.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain('654321');
      expect(callArgs.html).toContain('654321');
    });

    it('should include expiry info in email', async () => {
      await mailService.sendOtpEmail('test@example.com', '123456');

      const callArgs = mailerService.sendMail.mock.calls[0][0];
      expect(callArgs.text).toContain('2 minutes');
    });
  });
});
