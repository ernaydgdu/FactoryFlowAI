import { Test, TestingModule } from '@nestjs/testing';
import { ChatAssistantService } from './chat-assistant.service';
import { AlertsService } from './alerts.service';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ChatAssistantService — ters kumaş verimi hesaplama (fabricUnitsFromRate)', () => {
  let service: ChatAssistantService;

  beforeEach(async () => {
    // Bu senaryoların hiçbiri veritabanına gitmiyor (sipariş numarası
    // gerektirmeyen serbest metin hesaplamaları), bu yüzden Prisma/Alerts/
    // Analytics sahte (dummy) nesnelerle sağlanabilir.
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatAssistantService,
        { provide: PrismaService, useValue: {} },
        { provide: AlertsService, useValue: {} },
        { provide: AnalyticsService, useValue: {} },
      ],
    }).compile();

    service = module.get<ChatAssistantService>(ChatAssistantService);
  });

  it('orijinal hata örneğini doğru hesaplar: kullanıcının verdiği rakamları görmezden gelip sabit sarfiyat kartına düşmez', async () => {
    const answer = await service.answerQuestion(
      '95645 mt kumaş var sarfiyatta 1,35 mt kaç tane gömlek çıkar',
    );

    expect(answer).toContain('95645 metre kumaş');
    expect(answer).toContain('1.35 m/adet sarfiyat oranında');
    expect(answer).toContain('yaklaşık 70848 adet üretilebilir');
    expect(answer).toContain('kalan: 0.2 metre');
    // Sabit bilgi kütüphanesi kartına ("Gömlek için standart sarfiyat 1.5
    // m/adet kullanılır") DÜŞMEDİĞİni doğrular — orijinal bug tam olarak buydu.
    expect(answer).not.toContain('sabit 1.5 m/adet kullanılır');
  });

  it('farklı sayılar ve açık ürün adıyla (tişört) da doğru hesaplar', async () => {
    const answer = await service.answerQuestion(
      '5000 metre kumaştan 1.2 m/adet sarfiyatla kaç adet tişört çıkar?',
    );

    // 5000 / 1.2 = 4166.67 -> floor 4166, kalan = 5000 - 4166*1.2 = 0.8
    expect(answer).toContain('5000 metre kumaş');
    expect(answer).toContain('1.2 m/adet sarfiyat oranında');
    expect(answer).toContain('yaklaşık 4166 adet üretilebilir');
    expect(answer).toContain('kalan: 0.8 metre');
  });

  it('"dikilir" fiiliyle sorulan farklı bir ürün (pantolon) örneğini de doğru hesaplar', async () => {
    const answer = await service.answerQuestion(
      '1000 metre kumaşla 2 m/adet sarfiyatla kaç pantolon dikilir',
    );

    // 1000 / 2 = 500 tam, kalan 0
    expect(answer).toContain('1000 metre kumaş');
    expect(answer).toContain('2 m/adet sarfiyat oranında');
    expect(answer).toContain('yaklaşık 500 adet üretilebilir');
    expect(answer).toContain('kalan: 0.0 metre');
  });

  it('REGRESYON: sayı içermeyen genel "gömlek nedir" sorusu hesaplamaya değil genel bilgi kartına gider', async () => {
    const answer = await service.answerQuestion('gömlek nedir');

    expect(answer.startsWith('📚')).toBe(true);
    expect(answer).not.toContain('üretilebilir');
    expect(answer).not.toContain('kalan:');
  });

  it('REGRESYON: sayı içermeyen "kaç gömlek çıkar?" sorusu da hesaplamaya düşmez (gate: en az 2 sayı şart)', async () => {
    const answer = await service.answerQuestion('kaç gömlek çıkar?');

    expect(answer).not.toContain('üretilebilir');
    expect(answer).not.toContain('kalan:');
  });

  it('REGRESYON: "gömlek için sarfiyat oranı ne kadar?" hâlâ sabit sarfiyat kartını döndürür', async () => {
    const answer = await service.answerQuestion(
      'gömlek için sarfiyat oranı ne kadar?',
    );

    expect(answer).toBe(
      'Gömlek için standart sarfiyat sabit 1.5 m/adet kullanılır.',
    );
  });

  it('REGRESYON: mevcut top/pastal hesaplama intent\'i yeni intent tarafından ele geçirilmiyor', async () => {
    const answer = await service.answerQuestion(
      '35 metre topdan 5.1 metre pastal ile kaç pastal çıkar?',
    );

    expect(answer).toContain('6 adet pastal çıkar');
    expect(answer).not.toContain('üretilebilir');
  });
});
