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
  stockLot: { updateMany: MockFn };
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
    stockLot: { updateMany: jest.fn() },
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
        callOrder(prisma.stockLot.updateMany),
      );
      expect(callOrder(prisma.stockLot.updateMany)).toBeLessThan(
        callOrder(prisma.order.delete),
      );

      // Order en son ve doğru id ile silinmeli.
      expect(prisma.order.delete).toHaveBeenCalledWith({ where: { id: 7 } });
    });
  });
});
