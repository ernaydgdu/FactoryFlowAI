import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let prisma: { $queryRaw: jest.Mock };

  beforeEach(async () => {
    prisma = { $queryRaw: jest.fn() };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('veritabanı sorgusu başarılıysa status ok ve database connected dönmeli', async () => {
      prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await appController.checkHealth();

      expect(result).toEqual({ status: 'ok', database: 'connected' });
    });

    it('veritabanı sorgusu başarısız olursa ServiceUnavailableException fırlatmalı', async () => {
      prisma.$queryRaw.mockRejectedValue(new Error('bağlantı yok'));

      await expect(appController.checkHealth()).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });
});
