import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getHealth: jest.fn().mockResolvedValue({ status: 'ok', userCount: 0 }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHealth', () => {
    it('should return health status', async () => {
      const result = await appController.getHealth();
      expect(result).toEqual({ status: 'ok', userCount: 0 });
    });
  });
});
