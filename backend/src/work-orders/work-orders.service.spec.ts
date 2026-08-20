import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { PrismaService } from '../prisma/prisma.service';

type MockFn = jest.Mock;

type PrismaMock = {
  order: { findFirst: MockFn; findUniqueOrThrow: MockFn };
  workOrder: {
    findFirst: MockFn;
    findMany: MockFn;
    create: MockFn;
    update: MockFn;
    delete: MockFn;
  };
  productionLine: { findUnique: MockFn };
  orderBOMItem: { findMany: MockFn };
  orderColorSize: { findMany: MockFn };
  material: { findMany: MockFn };
  stockMovement: { findMany: MockFn };
  productionEntry: { findMany: MockFn; updateMany: MockFn };
  fasonShipment: { updateMany: MockFn };
  $transaction: MockFn;
};

function createPrismaMock(): PrismaMock {
  return {
    order: { findFirst: jest.fn(), findUniqueOrThrow: jest.fn() },
    workOrder: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    productionLine: { findUnique: jest.fn() },
    orderBOMItem: { findMany: jest.fn() },
    orderColorSize: { findMany: jest.fn() },
    material: { findMany: jest.fn() },
    stockMovement: { findMany: jest.fn() },
    productionEntry: { findMany: jest.fn(), updateMany: jest.fn() },
    fasonShipment: { updateMany: jest.fn() },
    $transaction: jest.fn(),
  };
}

describe('WorkOrdersService', () => {
  let service: WorkOrdersService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkOrdersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<WorkOrdersService>(WorkOrdersService);
  });

  describe('createWorkOrder — otomatik numaralandırma (IE-YYYY-NNN)', () => {
    const year = new Date().getFullYear();
    const prefix = `IE-${year}-`;

    it('hiç iş emri yokken ilk numarayı 001 olarak üretmeli', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 7,
        tenantId: 'kepler-default',
      });
      prisma.workOrder.findMany.mockResolvedValue([]);
      prisma.workOrder.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 1, ...data }),
      );

      const result = await service.createWorkOrder(
        7,
        {
          producerType: 'INTERNAL',
          productionLineId: 1,
          plannedQuantity: 500,
        },
        'kepler-default',
      );

      expect(result.workOrderNo).toBe(`${prefix}001`);
    });

    it('mevcut numaralar arasından en büyüğünün bir fazlasını, sıra/format bozuk olsa bile bulmalı', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 7,
        tenantId: 'kepler-default',
      });
      prisma.workOrder.findMany.mockResolvedValue([
        { workOrderNo: `${prefix}001` },
        { workOrderNo: `${prefix}005` },
        { workOrderNo: `${prefix}003` },
      ]);
      prisma.workOrder.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 4, ...data }),
      );

      const result = await service.createWorkOrder(
        7,
        {
          producerType: 'INTERNAL',
          productionLineId: 1,
          plannedQuantity: 500,
        },
        'kepler-default',
      );

      expect(result.workOrderNo).toBe(`${prefix}006`);
    });

    it('tek haneli mevcut numarayı 3 haneye tamamlayarak (padStart) üretmeli', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 7,
        tenantId: 'kepler-default',
      });
      prisma.workOrder.findMany.mockResolvedValue([
        { workOrderNo: `${prefix}009` },
      ]);
      prisma.workOrder.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 2, ...data }),
      );

      const result = await service.createWorkOrder(
        7,
        {
          producerType: 'INTERNAL',
          productionLineId: 1,
          plannedQuantity: 500,
        },
        'kepler-default',
      );

      expect(result.workOrderNo).toBe(`${prefix}010`);
    });

    it('producerType INTERNAL iken productionLineId verilmezse BadRequestException fırlatmalı', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 7,
        tenantId: 'kepler-default',
      });

      await expect(
        service.createWorkOrder(
          7,
          { producerType: 'INTERNAL', plannedQuantity: 500 },
          'kepler-default',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.workOrder.create).not.toHaveBeenCalled();
    });

    it('producerType FASON iken subcontractorName verilmezse BadRequestException fırlatmalı', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 7,
        tenantId: 'kepler-default',
      });

      await expect(
        service.createWorkOrder(
          7,
          { producerType: 'FASON', plannedQuantity: 500 },
          'kepler-default',
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.workOrder.create).not.toHaveBeenCalled();
    });
  });

  describe('getWorkOrderDetail — planlanan maliyet hesaplamaları', () => {
    it('kumaş (KUMAS) BOM satırı için plannedNeed ve lineCost doğru formülle hesaplanmalı', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({
        id: 1,
        orderId: 7,
        plannedQuantity: 500,
        producerType: 'INTERNAL',
        productionLineId: null,
        subcontractorName: null,
        laborRatePerDay: 1000,
        estimatedDays: 5,
        status: 'TASLAK',
      });
      prisma.order.findUniqueOrThrow.mockResolvedValue({
        id: 7,
        orderNo: '1040',
        buyerName: 'Zara',
        productName: 'T-Shirt',
        shipmentDate: new Date('2026-09-30'),
        createdAt: new Date('2026-08-01'),
      });
      prisma.orderBOMItem.findMany.mockResolvedValue([
        {
          id: 1,
          materialName: 'Ana Kumaş',
          materialType: 'KUMAS',
          unit: 'METRE',
          unitConsumption: 2,
          wastagePercent: 5,
        },
      ]);
      prisma.orderColorSize.findMany.mockResolvedValue([]);
      prisma.material.findMany.mockResolvedValue([
        {
          materialName: 'Ana Kumaş',
          materialType: 'Kumaş',
          supplierName: 'Söktaş',
          unitPrice: 10,
          arrivedQuantity: 0,
        },
      ]);
      prisma.productionEntry.findMany.mockResolvedValue([]);

      const result = await service.getWorkOrderDetail(1);

      // plannedNeed = 500 × 2 × (1 + 5/100) = 1050
      expect(result.bomItems[0].plannedNeed).toBeCloseTo(1050, 5);
      // lineCost = 1050 × 10 (ortalama birim fiyat) = 10500
      expect(result.bomItems[0].lineCost).toBeCloseTo(10500, 5);
      expect(result.bomItems[0].supplierName).toBe('Söktaş');
      expect(result.costs.fabric.planned).toBeCloseTo(10500, 5);
    });

    it('işçilik maliyeti laborRatePerDay × estimatedDays formülüyle hesaplanmalı', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({
        id: 1,
        orderId: 7,
        plannedQuantity: 200,
        producerType: 'FASON',
        productionLineId: null,
        subcontractorName: 'Test Atölye',
        laborRatePerDay: 1500,
        estimatedDays: 10,
        status: 'TASLAK',
      });
      prisma.order.findUniqueOrThrow.mockResolvedValue({
        id: 7,
        orderNo: '1040',
        buyerName: 'Zara',
        productName: 'T-Shirt',
        shipmentDate: new Date('2026-09-30'),
        createdAt: new Date('2026-08-01'),
      });
      prisma.orderBOMItem.findMany.mockResolvedValue([]);
      prisma.orderColorSize.findMany.mockResolvedValue([]);
      prisma.material.findMany.mockResolvedValue([]);
      prisma.productionEntry.findMany.mockResolvedValue([]);

      const result = await service.getWorkOrderDetail(1);

      // plannedLaborCost = 1500 × 10 = 15000
      expect(result.costs.labor.planned).toBe(15000);
      // Bu iş emrine bağlı üretim girişi olmadığı için gerçekleşen işçilik 0 gün × 1500 = 0.
      expect(result.costs.labor.actual).toBe(0);
    });

    it('laborRatePerDay veya estimatedDays girilmemişse plannedLaborCost null olmalı (sınır durumu)', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({
        id: 1,
        orderId: 7,
        plannedQuantity: 200,
        producerType: 'INTERNAL',
        productionLineId: null,
        subcontractorName: null,
        laborRatePerDay: null,
        estimatedDays: null,
        status: 'TASLAK',
      });
      prisma.order.findUniqueOrThrow.mockResolvedValue({
        id: 7,
        orderNo: '1040',
        buyerName: 'Zara',
        productName: 'T-Shirt',
        shipmentDate: new Date('2026-09-30'),
        createdAt: new Date('2026-08-01'),
      });
      prisma.orderBOMItem.findMany.mockResolvedValue([]);
      prisma.orderColorSize.findMany.mockResolvedValue([]);
      prisma.material.findMany.mockResolvedValue([]);
      prisma.productionEntry.findMany.mockResolvedValue([]);

      const result = await service.getWorkOrderDetail(1);

      expect(result.costs.labor.planned).toBeNull();
      expect(result.costs.labor.actual).toBeNull();
    });

    it('BOM satırındaki malzemenin fiyatı girilmemişse unitPrice/lineCost null olmalı, plannedFabricCost hesaplanamamalı', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({
        id: 1,
        orderId: 7,
        plannedQuantity: 500,
        producerType: 'INTERNAL',
        productionLineId: null,
        subcontractorName: null,
        laborRatePerDay: null,
        estimatedDays: null,
        status: 'TASLAK',
      });
      prisma.order.findUniqueOrThrow.mockResolvedValue({
        id: 7,
        orderNo: '1040',
        buyerName: 'Zara',
        productName: 'T-Shirt',
        shipmentDate: new Date('2026-09-30'),
        createdAt: new Date('2026-08-01'),
      });
      prisma.orderBOMItem.findMany.mockResolvedValue([
        {
          id: 1,
          materialName: 'Ana Kumaş',
          materialType: 'KUMAS',
          unit: 'METRE',
          unitConsumption: 2,
          wastagePercent: 0,
        },
      ]);
      prisma.orderColorSize.findMany.mockResolvedValue([]);
      prisma.material.findMany.mockResolvedValue([]); // fiyat girilmemiş
      prisma.productionEntry.findMany.mockResolvedValue([]);

      const result = await service.getWorkOrderDetail(1);

      expect(result.bomItems[0].unitPrice).toBeNull();
      expect(result.bomItems[0].lineCost).toBeNull();
      expect(result.costs.fabric.planned).toBeNull();
    });
  });

  describe('deleteWorkOrder — bağlı kayıtların workOrderId’sini temizleme', () => {
    it('var olmayan iş emri için NotFoundException fırlatmalı', async () => {
      prisma.workOrder.findFirst.mockResolvedValue(null);

      await expect(service.deleteWorkOrder(999)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('silme öncesi ProductionEntry ve FasonShipment kayıtlarındaki workOrderId null’lanmalı, iş emri en son silinmeli', async () => {
      prisma.workOrder.findFirst.mockResolvedValue({ id: 1, orderId: 7 });
      prisma.productionEntry.updateMany.mockResolvedValue({ count: 0 });
      prisma.fasonShipment.updateMany.mockResolvedValue({ count: 0 });
      prisma.workOrder.delete.mockResolvedValue({ id: 1 });
      prisma.$transaction.mockImplementation((ops: Promise<unknown>[]) =>
        Promise.all(ops),
      );

      await service.deleteWorkOrder(1);

      expect(prisma.productionEntry.updateMany).toHaveBeenCalledWith({
        where: { workOrderId: 1 },
        data: { workOrderId: null },
      });
      expect(prisma.fasonShipment.updateMany).toHaveBeenCalledWith({
        where: { workOrderId: 1 },
        data: { workOrderId: null },
      });
      expect(prisma.workOrder.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
