import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

type MockFn = jest.Mock;

type PrismaMock = {
  order: {
    findFirst: MockFn;
    findMany: MockFn;
    create: MockFn;
    update: MockFn;
    delete: MockFn;
  };
  material: { deleteMany: MockFn };
  productionEntry: { deleteMany: MockFn };
  qualityEntry: { deleteMany: MockFn };
  orderColorSize: { deleteMany: MockFn };
  approvalStage: {
    findFirst: MockFn;
    findMany: MockFn;
    update: MockFn;
    deleteMany: MockFn;
    createMany: MockFn;
  };
  fasonShipment: {
    create: MockFn;
    update: MockFn;
    findFirst: MockFn;
    findMany: MockFn;
    deleteMany: MockFn;
  };
  orderBOMItem: {
    findMany: MockFn;
    count: MockFn;
    deleteMany: MockFn;
  };
  workOrder: { deleteMany: MockFn };
  warehouse: { findFirst: MockFn };
  stockLot: { findFirst: MockFn; updateMany: MockFn };
  stockMovement: { findMany: MockFn };
  $transaction: MockFn;
};

function createPrismaMock(): PrismaMock {
  return {
    order: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    material: { deleteMany: jest.fn() },
    productionEntry: { deleteMany: jest.fn() },
    qualityEntry: { deleteMany: jest.fn() },
    orderColorSize: { deleteMany: jest.fn() },
    approvalStage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    fasonShipment: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    orderBOMItem: {
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
    workOrder: { deleteMany: jest.fn() },
    warehouse: { findFirst: jest.fn() },
    stockLot: { findFirst: jest.fn(), updateMany: jest.fn() },
    stockMovement: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };
}

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('updateApprovalStage — onay sırası kuralı', () => {
    it('sıradaki doğru aşama (önceki APPROVED iken) onaylanınca başarılı olmalı', async () => {
      // PASTAL_ONAY (2. aşama) onaylanmaya çalışılıyor, PP_NUMUNE (1. aşama) zaten APPROVED
      prisma.approvalStage.findFirst
        .mockResolvedValueOnce({
          id: 10,
          orderId: 7,
          stageType: 'PASTAL_ONAY',
          status: 'PENDING',
        })
        .mockResolvedValueOnce({
          id: 9,
          orderId: 7,
          stageType: 'PP_NUMUNE',
          status: 'APPROVED',
        });
      prisma.approvalStage.update.mockResolvedValue({
        id: 10,
        stageType: 'PASTAL_ONAY',
        status: 'APPROVED',
      });

      const result = await service.updateApprovalStage(7, 10, {
        status: 'APPROVED',
        approvedBy: 'Test Kullanıcı',
      });

      expect(result.status).toBe('APPROVED');
      expect(prisma.approvalStage.update).toHaveBeenCalledTimes(1);
    });

    it('önceki aşama APPROVED değilken sonraki aşama onaylanamaz ve doğru hata mesajını verir', async () => {
      // SARFIYAT_ONAY (3. aşama) onaylanmaya çalışılıyor, PASTAL_ONAY (2. aşama) hâlâ PENDING
      prisma.approvalStage.findFirst
        .mockResolvedValueOnce({
          id: 11,
          orderId: 7,
          stageType: 'SARFIYAT_ONAY',
          status: 'PENDING',
        })
        .mockResolvedValueOnce({
          id: 10,
          orderId: 7,
          stageType: 'PASTAL_ONAY',
          status: 'PENDING',
        });

      let caughtError: unknown;
      try {
        await service.updateApprovalStage(7, 11, { status: 'APPROVED' });
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).toBeInstanceOf(BadRequestException);
      expect((caughtError as BadRequestException).message).toBe(
        'Önce Pastal Onayı onaylanmalı',
      );
      expect(prisma.approvalStage.update).not.toHaveBeenCalled();
    });

    it('ilk aşama (PP_NUMUNE) öncesi aşama olmadığı için her zaman onaylanabilmeli', async () => {
      prisma.approvalStage.findFirst.mockResolvedValueOnce({
        id: 9,
        orderId: 7,
        stageType: 'PP_NUMUNE',
        status: 'PENDING',
      });
      prisma.approvalStage.update.mockResolvedValue({
        id: 9,
        stageType: 'PP_NUMUNE',
        status: 'APPROVED',
      });

      const result = await service.updateApprovalStage(7, 9, {
        status: 'APPROVED',
      });

      expect(result.status).toBe('APPROVED');
      // Önceki aşama kontrolü yapılmadığı için ikinci bir findFirst çağrısı olmamalı.
      expect(prisma.approvalStage.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteOrder — silme transaction sırası', () => {
    it('var olmayan sipariş için NotFoundException fırlatmalı', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.deleteOrder(999)).rejects.toThrow(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('Material, ProductionEntry, QualityEntry, OrderColorSize, ApprovalStage önce; Order en son silinmeli', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 7,
        orderNo: '1040',
        tenantId: 'kepler-default',
      });
      prisma.material.deleteMany.mockResolvedValue({ count: 0 });
      prisma.productionEntry.deleteMany.mockResolvedValue({ count: 0 });
      prisma.qualityEntry.deleteMany.mockResolvedValue({ count: 0 });
      prisma.orderColorSize.deleteMany.mockResolvedValue({ count: 0 });
      prisma.approvalStage.deleteMany.mockResolvedValue({ count: 0 });
      prisma.fasonShipment.deleteMany.mockResolvedValue({ count: 0 });
      prisma.orderBOMItem.deleteMany.mockResolvedValue({ count: 0 });
      prisma.workOrder.deleteMany.mockResolvedValue({ count: 0 });
      prisma.stockLot.updateMany.mockResolvedValue({ count: 0 });
      prisma.order.delete.mockResolvedValue({ id: 7 });
      prisma.$transaction.mockImplementation((ops: Promise<unknown>[]) =>
        Promise.all(ops),
      );

      await service.deleteOrder(7);

      const callOrder = (fn: MockFn) => fn.mock.invocationCallOrder[0];

      expect(callOrder(prisma.material.deleteMany)).toBeLessThan(
        callOrder(prisma.productionEntry.deleteMany),
      );
      expect(callOrder(prisma.productionEntry.deleteMany)).toBeLessThan(
        callOrder(prisma.qualityEntry.deleteMany),
      );
      expect(callOrder(prisma.qualityEntry.deleteMany)).toBeLessThan(
        callOrder(prisma.orderColorSize.deleteMany),
      );
      expect(callOrder(prisma.orderColorSize.deleteMany)).toBeLessThan(
        callOrder(prisma.approvalStage.deleteMany),
      );
      expect(callOrder(prisma.approvalStage.deleteMany)).toBeLessThan(
        callOrder(prisma.fasonShipment.deleteMany),
      );
      expect(callOrder(prisma.fasonShipment.deleteMany)).toBeLessThan(
        callOrder(prisma.orderBOMItem.deleteMany),
      );
      expect(callOrder(prisma.orderBOMItem.deleteMany)).toBeLessThan(
        callOrder(prisma.workOrder.deleteMany),
      );
      expect(callOrder(prisma.workOrder.deleteMany)).toBeLessThan(
        callOrder(prisma.stockLot.updateMany),
      );
      expect(callOrder(prisma.stockLot.updateMany)).toBeLessThan(
        callOrder(prisma.order.delete),
      );

      // Order en son ve doğru id ile silinmeli.
      expect(prisma.order.delete).toHaveBeenCalledWith({ where: { id: 7 } });
      // İş Emri kayıtları da cascade'e dahil olmalı (WorkOrder modülü eklendikten sonra).
      expect(prisma.workOrder.deleteMany).toHaveBeenCalledWith({
        where: { orderId: 7 },
      });
    });
  });

  describe('Fason Takip — addFasonShipment / updateFasonShipment', () => {
    it('addFasonShipment yeni bir gönderim oluşturmalı (durum DB varsayılanına bırakılır: GONDERILDI)', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 7,
        orderNo: '1040',
        tenantId: 'kepler-default',
      });
      prisma.fasonShipment.create.mockResolvedValue({
        id: 1,
        orderId: 7,
        subcontractorName: 'Yıldız Konfeksiyon',
        operationType: 'DIKIM',
        sentQuantity: 100,
        receivedQuantity: null,
        status: 'GONDERILDI',
      });

      const result = await service.addFasonShipment(7, {
        subcontractorName: 'Yıldız Konfeksiyon',
        operationType: 'DIKIM',
        sentQuantity: 100,
      });

      expect(prisma.fasonShipment.create).toHaveBeenCalledWith({
        data: {
          orderId: 7,
          subcontractorName: 'Yıldız Konfeksiyon',
          operationType: 'DIKIM',
          sentQuantity: 100,
          expectedReturnDate: undefined,
          unitCost: undefined,
          currency: 'TRY',
          notes: undefined,
          workOrderId: undefined,
          tenantId: 'kepler-default',
        },
      });
      expect(result.fireQuantity).toBeNull();
      expect(result.fireRate).toBeNull();
    });

    it('updateFasonShipment: receivedQuantity < sentQuantity ise status KISMEN_DONDU olmalı, fire doğru hesaplanmalı', async () => {
      prisma.fasonShipment.findFirst.mockResolvedValue({
        id: 1,
        orderId: 7,
        sentQuantity: 100,
        receivedQuantity: null,
        status: 'GONDERILDI',
      });
      prisma.fasonShipment.update.mockResolvedValue({
        id: 1,
        orderId: 7,
        sentQuantity: 100,
        receivedQuantity: 80,
        status: 'KISMEN_DONDU',
      });

      const result = await service.updateFasonShipment(7, 1, {
        receivedDate: '2026-08-20',
        receivedQuantity: 80,
      });

      expect(prisma.fasonShipment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          receivedDate: new Date('2026-08-20'),
          receivedQuantity: 80,
          status: 'KISMEN_DONDU',
        },
      });
      expect(result.fireQuantity).toBe(20);
      expect(result.fireRate).toBe(20);
    });

    it('updateFasonShipment: receivedQuantity >= sentQuantity ise status TAMAMLANDI olmalı, fire sıfır olmalı', async () => {
      prisma.fasonShipment.findFirst.mockResolvedValue({
        id: 1,
        orderId: 7,
        sentQuantity: 100,
        receivedQuantity: null,
        status: 'GONDERILDI',
      });
      prisma.fasonShipment.update.mockResolvedValue({
        id: 1,
        orderId: 7,
        sentQuantity: 100,
        receivedQuantity: 100,
        status: 'TAMAMLANDI',
      });

      const result = await service.updateFasonShipment(7, 1, {
        receivedDate: '2026-08-20',
        receivedQuantity: 100,
      });

      expect(prisma.fasonShipment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          receivedDate: new Date('2026-08-20'),
          receivedQuantity: 100,
          status: 'TAMAMLANDI',
        },
      });
      expect(result.fireQuantity).toBe(0);
      expect(result.fireRate).toBe(0);
    });

    it('updateFasonShipment: receivedQuantity fazla girilse bile fireQuantity negatife düşmemeli (0’da sınırlanır)', async () => {
      // Gönderilenden fazla teslim alınması normalde beklenmez ama savunmacı
      // hesaplama (Math.max(0, ...)) negatif fire göstermemeli.
      prisma.fasonShipment.findFirst.mockResolvedValue({
        id: 1,
        orderId: 7,
        sentQuantity: 100,
        receivedQuantity: null,
        status: 'GONDERILDI',
      });
      prisma.fasonShipment.update.mockResolvedValue({
        id: 1,
        orderId: 7,
        sentQuantity: 100,
        receivedQuantity: 110,
        status: 'TAMAMLANDI',
      });

      const result = await service.updateFasonShipment(7, 1, {
        receivedQuantity: 110,
      });

      expect(result.fireQuantity).toBe(0);
      expect(result.fireRate).toBe(0);
    });

    it('updateFasonShipment: receivedQuantity gönderilmezse status GONDERILDI olarak kalmalı', async () => {
      prisma.fasonShipment.findFirst.mockResolvedValue({
        id: 1,
        orderId: 7,
        sentQuantity: 100,
        receivedQuantity: null,
        status: 'GONDERILDI',
      });
      prisma.fasonShipment.update.mockResolvedValue({
        id: 1,
        orderId: 7,
        sentQuantity: 100,
        receivedQuantity: null,
        status: 'GONDERILDI',
      });

      const result = await service.updateFasonShipment(7, 1, {
        unitCost: 5,
      });

      expect(prisma.fasonShipment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { unitCost: 5, status: 'GONDERILDI' },
      });
      expect(result.fireQuantity).toBeNull();
    });
  });

  describe('BOM — totalNeed hesaplaması ve computeAiSuggestion', () => {
    it('getBOMItems: totalNeed = orderQuantity × unitConsumption × (1 + fire%/100) formülüyle hesaplanmalı', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 7,
        orderNo: '1040',
        totalQuantity: 1000,
      });
      prisma.orderBOMItem.findMany.mockResolvedValue([
        {
          id: 1,
          materialName: 'Ana Kumaş',
          materialType: 'KUMAS',
          unitConsumption: 1.4,
          wastagePercent: 3,
        },
        {
          id: 2,
          materialName: 'Düğme',
          materialType: 'AKSESUAR',
          unitConsumption: 8,
          wastagePercent: 0,
        },
      ]);

      const result = await service.getBOMItems(7);

      // 1000 × 1.4 × 1.03 = 1442
      expect(result[0].totalNeed).toBeCloseTo(1442, 5);
      // 1000 × 8 × 1.00 = 8000 (fire %0)
      expect(result[1].totalNeed).toBeCloseTo(8000, 5);
    });

    it('getBOMItems: fire payı %0 iken totalNeed sadece miktar × sarfiyat olmalı (sınır durumu)', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 7,
        orderNo: '1040',
        totalQuantity: 500,
      });
      prisma.orderBOMItem.findMany.mockResolvedValue([
        {
          id: 1,
          materialName: 'Fermuar',
          materialType: 'AKSESUAR',
          unitConsumption: 1,
          wastagePercent: 0,
        },
      ]);

      const result = await service.getBOMItems(7);

      expect(result[0].totalNeed).toBe(500);
    });

    it('computeAiSuggestion: BOM verisi (kumaş tipinde satır) varsa BOM’a göre hesaplamalı, standart oranı kullanmamalı', () => {
      const order = {
        productName: 'Bilinmeyen Ürün Tipi',
        totalQuantity: 1000,
        materials: [],
        bomItems: [
          {
            materialType: 'KUMAS',
            unitConsumption: 1.4,
            wastagePercent: 3,
          },
        ],
      };

      const result = service.computeAiSuggestion(order);

      // Ürün tipi tanınmasa bile BOM verisi varsa bomSuffix ile birlikte hesaplanmalı.
      expect(result.estimatedNeed).toBeCloseTo(1442, 5);
      expect(result.warning).toContain('BOM verisine göre');
    });

    it('computeAiSuggestion: BOM verisi yoksa (veya kumaş tipi satır içermiyorsa) standart tekstil oranını kullanmalı', () => {
      const order = {
        productName: 'T-Shirt',
        totalQuantity: 1000,
        materials: [],
        bomItems: [],
      };

      const result = service.computeAiSuggestion(order);

      // STANDARD_CONSUMPTION_RATES.TISORT.avg = 1.35, WASTE_RATE_MULTIPLIER = 1.03
      // 1000 × 1.35 × 1.03 = 1390.5
      expect(result.estimatedNeed).toBeCloseTo(1390.5, 5);
      expect(result.warning).not.toContain('BOM verisine göre');
    });

    it('computeAiSuggestion: ne ürün tipi tanınıyor ne BOM verisi varsa uyarı vermeden ok:true dönmeli', () => {
      const order = {
        productName: 'Tamamen Bilinmeyen Ürün',
        totalQuantity: 1000,
        materials: [],
        bomItems: [],
      };

      const result = service.computeAiSuggestion(order);

      expect(result.estimatedNeed).toBeNull();
      expect(result.warning).toBeNull();
      expect(result.ok).toBe(true);
    });
  });

  describe('Dosya Kapama checklist — fasonComplete ve bomDefined', () => {
    // Onay/üretim/kalite/renk-beden kriterlerinin hepsi "tamam" olan bir taban
    // senaryo kurar, böylece testler sadece fason/BOM etkisini izole eder.
    function mockReadyBaseline() {
      prisma.order.findFirst.mockResolvedValue({
        id: 7,
        orderNo: '1040',
        totalQuantity: 100,
        productName: 'Tanınmayan Ürün',
        closedAt: null,
        closedBy: null,
        materials: [],
        colorSizes: [],
        productionEntries: [
          { stage: 'CUTTING', quantity: 100 },
          { stage: 'SEWING', quantity: 100 },
          { stage: 'PACKING', quantity: 100 },
        ],
        qualityEntries: [
          { checkedQty: 100, firstQuality: 95, secondQuality: 3, rejected: 2 },
        ],
      });
      prisma.approvalStage.findMany.mockResolvedValue([
        { stageType: 'PP_NUMUNE', status: 'APPROVED' },
        { stageType: 'PASTAL_ONAY', status: 'APPROVED' },
        { stageType: 'SARFIYAT_ONAY', status: 'APPROVED' },
        { stageType: 'KESIM_ONAY', status: 'APPROVED' },
      ]);
      prisma.warehouse.findFirst.mockResolvedValue({ id: 1, type: 'URUN' });
      prisma.stockLot.findFirst.mockResolvedValue({
        receivedQty: 100,
        remainingQty: 0,
      });
      prisma.stockMovement.findMany.mockResolvedValue([]);
    }

    it('fasonComplete: hiç fason gönderimi yokken true olmalı ve engellememelidir', async () => {
      mockReadyBaseline();
      prisma.fasonShipment.findMany.mockResolvedValue([]);
      prisma.orderBOMItem.count.mockResolvedValue(0);

      const { checklist } = await service.getClosingSummary(7);

      expect(checklist.fasonComplete).toBe(true);
      expect(checklist.readyToClose).toBe(true);
    });

    it('fasonComplete: en az bir gönderim GONDERILDI/KISMEN_DONDU durumundayken false olmalı ve kapatmayı engellemelidir', async () => {
      mockReadyBaseline();
      prisma.fasonShipment.findMany.mockResolvedValue([
        { status: 'GONDERILDI', sentQuantity: 50, receivedQuantity: null },
      ]);
      prisma.orderBOMItem.count.mockResolvedValue(0);

      const { checklist } = await service.getClosingSummary(7);

      expect(checklist.fasonComplete).toBe(false);
      expect(checklist.readyToClose).toBe(false);
      expect(checklist.missingItems).toContain(
        'Fason gönderimi tamamlanmadı (1 gönderim hâlâ atölyede)',
      );
    });

    it('fasonComplete: tüm gönderimler TAMAMLANDI olunca true olmalı', async () => {
      mockReadyBaseline();
      prisma.fasonShipment.findMany.mockResolvedValue([
        { status: 'TAMAMLANDI', sentQuantity: 50, receivedQuantity: 50 },
        { status: 'TAMAMLANDI', sentQuantity: 30, receivedQuantity: 28 },
      ]);
      prisma.orderBOMItem.count.mockResolvedValue(0);

      const { checklist } = await service.getClosingSummary(7);

      expect(checklist.fasonComplete).toBe(true);
      expect(checklist.readyToClose).toBe(true);
      expect(checklist.missingItems.some((m) => m.includes('Fason'))).toBe(
        false,
      );
    });

    it('bomDefined: BOM tanımlanmamışsa false olmalı ve warnings’e düşmeli, ama readyToClose’u etkilememeli', async () => {
      mockReadyBaseline();
      prisma.fasonShipment.findMany.mockResolvedValue([]);
      prisma.orderBOMItem.count.mockResolvedValue(0);

      const { checklist } = await service.getClosingSummary(7);

      expect(checklist.bomDefined).toBe(false);
      expect(checklist.warnings).toContain(
        'Bu sipariş için BOM (Ürün Ağacı) tanımlanmamış',
      );
      expect(checklist.missingItems).not.toContain(
        'Bu sipariş için BOM (Ürün Ağacı) tanımlanmamış',
      );
      expect(checklist.readyToClose).toBe(true);
    });

    it('bomDefined: en az 1 BOM kaydı varsa true olmalı ve warnings boş olmalı', async () => {
      mockReadyBaseline();
      prisma.fasonShipment.findMany.mockResolvedValue([]);
      prisma.orderBOMItem.count.mockResolvedValue(3);

      const { checklist } = await service.getClosingSummary(7);

      expect(checklist.bomDefined).toBe(true);
      expect(checklist.warnings).toEqual([]);
      expect(checklist.readyToClose).toBe(true);
    });
  });
});
