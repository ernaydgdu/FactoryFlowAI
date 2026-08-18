import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../prisma/prisma.service';

type MockFn = jest.Mock;

type PrismaMock = {
  order: { findMany: MockFn };
  stockLot: { findMany: MockFn };
  approvalStage: { findMany: MockFn };
  productionEntry: { count: MockFn; findMany: MockFn };
  productionLine: { findMany: MockFn };
  fasonShipment: { findMany: MockFn };
};

function createPrismaMock(): PrismaMock {
  return {
    order: { findMany: jest.fn() },
    stockLot: { findMany: jest.fn() },
    approvalStage: { findMany: jest.fn() },
    productionEntry: { count: jest.fn(), findMany: jest.fn() },
    productionLine: { findMany: jest.fn() },
    fasonShipment: { findMany: jest.fn() },
  };
}

describe('AlertsService.getAlerts', () => {
  let service: AlertsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-16T12:00:00Z'));

    prisma = createPrismaMock();
    // Varsayılan: stok/onay kuralları ve "bugün üretim yok" kuralı testleri
    // etkilemesin diye nötr değerler; ilgili testler bunları ezer.
    prisma.stockLot.findMany.mockResolvedValue([]);
    prisma.approvalStage.findMany.mockResolvedValue([]);
    prisma.productionEntry.count.mockResolvedValue(1);
    prisma.productionEntry.findMany.mockResolvedValue([]);
    prisma.productionLine.findMany.mockResolvedValue([]);
    prisma.fasonShipment.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('EXF tarihinden geç gelen malzeme için MATERIAL_DELAY uyarısı üretir', async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        id: 7,
        orderNo: '1040',
        buyerName: 'ZARA',
        shipmentDate: new Date('2026-08-10T00:00:00Z'),
        qualityEntries: [],
        materials: [
          {
            id: 4,
            materialName: 'PAMUKLU KUMAŞ',
            supplierName: 'ÖZEGE',
            status: 'ARRIVED',
            expectedArrival: new Date('2026-08-15T00:00:00Z'), // EXF'den 5 gün geç
          },
        ],
      },
    ]);

    const alerts = await service.getAlerts();

    const delayAlert = alerts.find((a) => a.type === 'MATERIAL_DELAY');
    expect(delayAlert).toBeDefined();
    expect(delayAlert?.severity).toBe('MEDIUM');
    expect(delayAlert?.message).toContain('5 gün geç geliyor');
    expect(delayAlert?.message).toContain('PAMUKLU KUMAŞ');
  });

  it("PENDING malzeme + EXF'ye 7 günden az kalmışsa HIGH uyarı üretir", async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        id: 7,
        orderNo: '1040',
        buyerName: 'ZARA',
        shipmentDate: new Date('2026-08-20T00:00:00Z'), // bugünden (16 Ağu) 4 gün sonra
        qualityEntries: [],
        materials: [
          {
            id: 4,
            materialName: 'PAMUKLU KUMAŞ',
            supplierName: 'ÖZEGE',
            status: 'PENDING',
            expectedArrival: null,
          },
        ],
      },
    ]);

    const alerts = await service.getAlerts();

    const pendingAlert = alerts.find((a) => a.type === 'MATERIAL_PENDING');
    expect(pendingAlert).toBeDefined();
    expect(pendingAlert?.severity).toBe('HIGH');
    expect(pendingAlert?.message).toContain('4 gün kaldı');
  });

  it('fire oranı %5 üstündeyse doğru mesaj ve HIGH severity ile FIRE_RATE_HIGH üretir', async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        id: 7,
        orderNo: '1040',
        buyerName: 'ZARA',
        shipmentDate: new Date('2026-09-01T00:00:00Z'),
        materials: [],
        qualityEntries: [{ checkedQty: 100, rejected: 6, secondQuality: 0 }],
      },
    ]);

    const alerts = await service.getAlerts();

    const fireAlert = alerts.find((a) => a.type === 'FIRE_RATE_HIGH');
    expect(fireAlert).toBeDefined();
    expect(fireAlert?.severity).toBe('HIGH');
    expect(fireAlert?.message).toContain('%6.0');
    // Fire oranı kuralı tetiklendiğinde 2. kalite kuralı (else if) tetiklenmemeli.
    expect(
      alerts.find((a) => a.type === 'SECOND_QUALITY_HIGH'),
    ).toBeUndefined();
  });

  it('hiçbir kural tetiklenmezse boş liste döner', async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        id: 7,
        orderNo: '1040',
        buyerName: 'ZARA',
        shipmentDate: new Date('2026-09-01T00:00:00Z'),
        materials: [
          {
            id: 4,
            materialName: 'PAMUKLU KUMAŞ',
            supplierName: 'ÖZEGE',
            status: 'ARRIVED',
            expectedArrival: new Date('2026-08-20T00:00:00Z'), // EXF'den önce
          },
        ],
        qualityEntries: [
          { checkedQty: 100, rejected: 1, secondQuality: 1 }, // %1 / %1, eşik altı
        ],
      },
    ]);
    // Bugün üretim girişi VAR sayılıyor ki NO_PRODUCTION kuralı devreye girmesin.
    prisma.productionEntry.count.mockResolvedValue(5);

    const alerts = await service.getAlerts();

    expect(alerts).toEqual([]);
  });

  it('ATOLYE_HAMMADDE deposunda kritik stok varsa HIGH ve hat adını içeren mesaj üretir', async () => {
    prisma.order.findMany.mockResolvedValue([]);
    prisma.productionEntry.count.mockResolvedValue(1);
    prisma.stockLot.findMany.mockResolvedValue([
      {
        materialName: 'Pamuklu Kumaş',
        receivedQty: 500,
        remainingQty: 50, // %10, kritik eşik (%15) altında
        warehouseId: 4,
        warehouse: {
          id: 4,
          type: 'ATOLYE_HAMMADDE',
          name: 'LINE-1 Hammadde Deposu',
          line: { id: 1, name: 'LINE-1' },
        },
      },
    ]);

    const alerts = await service.getAlerts();

    const criticalAlert = alerts.find((a) => a.type === 'STOCK_CRITICAL');
    expect(criticalAlert).toBeDefined();
    expect(criticalAlert?.severity).toBe('HIGH');
    expect(criticalAlert?.message).toContain('LINE-1 hattındaki');
    expect(criticalAlert?.message).toContain('üretim durabilir');
  });

  it('genel depoda (Kumaş Deposu) kritik stok varsa MEDIUM ve depo adını içeren mesaj üretir', async () => {
    prisma.order.findMany.mockResolvedValue([]);
    prisma.productionEntry.count.mockResolvedValue(1);
    prisma.stockLot.findMany.mockResolvedValue([
      {
        materialName: 'Pamuklu Kumaş',
        receivedQty: 500,
        remainingQty: 50,
        warehouseId: 1,
        warehouse: { id: 1, type: 'KUMAS', name: 'Kumaş Deposu', line: null },
      },
    ]);

    const alerts = await service.getAlerts();

    const criticalAlert = alerts.find((a) => a.type === 'STOCK_CRITICAL');
    expect(criticalAlert).toBeDefined();
    expect(criticalAlert?.severity).toBe('MEDIUM');
    expect(criticalAlert?.message).toContain('Kumaş Deposu');
    expect(criticalAlert?.message).not.toContain('üretim durabilir');
  });

  it('Ürün Deposu (URUN) kritik stok kuralına dahil edilmez', async () => {
    prisma.order.findMany.mockResolvedValue([]);
    prisma.productionEntry.count.mockResolvedValue(1);
    prisma.stockLot.findMany.mockResolvedValue([
      {
        materialName: '1040 - T-Shirt',
        receivedQty: 100,
        remainingQty: 0,
        warehouseId: 3,
        warehouse: { id: 3, type: 'URUN', name: 'Ürün Deposu', line: null },
      },
    ]);

    const alerts = await service.getAlerts();

    expect(alerts.find((a) => a.type === 'STOCK_CRITICAL')).toBeUndefined();
  });

  it('aynı malzeme farklı depolarda ayrı ayrı değerlendirilir', async () => {
    prisma.order.findMany.mockResolvedValue([]);
    prisma.productionEntry.count.mockResolvedValue(1);
    prisma.stockLot.findMany.mockResolvedValue([
      {
        materialName: 'Pamuklu Kumaş',
        receivedQty: 500,
        remainingQty: 400, // %80, kritik değil
        warehouseId: 1,
        warehouse: { id: 1, type: 'KUMAS', name: 'Kumaş Deposu', line: null },
      },
      {
        materialName: 'Pamuklu Kumaş',
        receivedQty: 500,
        remainingQty: 20, // %4, kritik
        warehouseId: 4,
        warehouse: {
          id: 4,
          type: 'ATOLYE_HAMMADDE',
          name: 'LINE-1 Hammadde Deposu',
          line: { id: 1, name: 'LINE-1' },
        },
      },
    ]);

    const alerts = await service.getAlerts();

    const criticalAlerts = alerts.filter((a) => a.type === 'STOCK_CRITICAL');
    expect(criticalAlerts).toHaveLength(1);
    expect(criticalAlerts[0].severity).toBe('HIGH');
    expect(criticalAlerts[0].message).toContain('LINE-1');
  });

  it('severity sıralaması her zaman HIGH → MEDIUM → LOW olmalı', async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        // Bu sipariş önce işlenir ve sadece MEDIUM (MATERIAL_DELAY) üretir.
        id: 1,
        orderNo: 'A-MEDIUM',
        buyerName: 'Müşteri A',
        shipmentDate: new Date('2026-08-10T00:00:00Z'),
        qualityEntries: [],
        materials: [
          {
            id: 1,
            materialName: 'Kumaş A',
            supplierName: 'Tedarikçi A',
            status: 'ARRIVED',
            expectedArrival: new Date('2026-08-15T00:00:00Z'),
          },
        ],
      },
      {
        // Bu sipariş sonra işlenir ve HIGH (MATERIAL_PENDING) üretir — insertion sırası
        // MEDIUM önce, HIGH sonra olduğu için sort'un gerçekten sıraladığını doğrular.
        id: 2,
        orderNo: 'B-HIGH',
        buyerName: 'Müşteri B',
        shipmentDate: new Date('2026-08-20T00:00:00Z'),
        qualityEntries: [],
        materials: [
          {
            id: 2,
            materialName: 'Kumaş B',
            supplierName: 'Tedarikçi B',
            status: 'PENDING',
            expectedArrival: null,
          },
        ],
      },
    ]);
    // Bugün üretim girişi yok → LOW (NO_PRODUCTION) uyarısı da eklenir.
    prisma.productionEntry.count.mockResolvedValue(0);

    const alerts = await service.getAlerts();

    expect(alerts.map((a) => a.severity)).toEqual(['HIGH', 'MEDIUM', 'LOW']);
    expect(alerts[0].type).toBe('MATERIAL_PENDING');
    expect(alerts[1].type).toBe('MATERIAL_DELAY');
    expect(alerts[2].type).toBe('NO_PRODUCTION');
  });
});
