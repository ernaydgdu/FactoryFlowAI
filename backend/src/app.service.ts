import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  // Sadece backend sürecinin ayakta olduğunu değil, veritabanına gerçekten
  // bağlanılabildiğini doğrular - Electron'un başlangıç kontrolü bunu
  // kullanıyor, "backend açıldı ama DB'ye ulaşamıyor" durumunu ayırt eder.
  async checkHealth(): Promise<{ status: string; database: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch (err) {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'disconnected',
        message: err instanceof Error ? err.message : 'Bilinmeyen hata',
      });
    }
  }
}
