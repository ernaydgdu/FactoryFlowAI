import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StockService } from './stock.service';
import { PrismaService } from '../prisma/prisma.service';

type MockFn = jest.Mock;

type PrismaMock = {
  stockLot: {
    findUnique: MockFn;
    findFirst: MockFn;
    update: MockFn;
    create: MockFn;
  };
  warehouse: { findUnique: MockFn };
  stockMovement: { create: MockFn };
  $transaction: MockFn;
};

function createPrismaMock(): PrismaMock {
  return {
    stockLot: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    warehouse: { findUnique: jest.fn() },
    stockMovement: { create: jest.fn() },
    $transaction: jest.fn(),
  };
}

describe('StockService — transferStock', () => {
  let service: StockService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    // performStockTransfer interaktif (callback) tarzda $transaction bekliyor.
    prisma.$transaction.mockImplementation((cb: (tx: unknown) => unknown) =>
      cb(prisma),
    );
    prisma.stockMovement.create.mockResolvedValue({ id: 1 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [StockService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  it('kaynak lotta yeterli stok yoksa BadRequestException fırlatmalı ve mevcut miktarı mesajda göstermeli', async () => {
    prisma.stockLot.findUnique.mockResolvedValue({
      id: 10,
      remainingQty: 40,
      materialName: 'Ana Kumaş',
      materialType: 'Kumaş',
      supplierName: 'Söktaş',
      unitPrice: 45,
      currency: 'TRY',
      warehouse: { name: 'Kumaş Deposu' },
    });

    let caughtError: unknown;
    try {
      await service.transferStock(
        { fromLotId: 10, toWarehouseId: 5, quantity: 100 },
        'admin@kepler-erp.com',
      );
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(BadRequestException);
    expect((caughtError as BadRequestException).message).toBe(
      'Transfer için yeterli stok yok, mevcut: 40',
    );
    expect(prisma.warehouse.findUnique).not.toHaveBeenCalled();
    expect(prisma.stockLot.update).not.toHaveBeenCalled();
  });

  it('kaynak lot bulunamazsa NotFoundException fırlatmalı', async () => {
    prisma.stockLot.findUnique.mockResolvedValue(null);

    await expect(
      service.transferStock({ fromLotId: 999, toWarehouseId: 5, quantity: 10 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('hedef depoda aynı malzemeden lot yoksa yeni lot oluşturmalı, kaynak lotu düşürmeli', async () => {
    prisma.stockLot.findUnique.mockResolvedValue({
      id: 10,
      remainingQty: 200,
      materialName: 'Ana Kumaş',
      materialType: 'Kumaş',
      supplierName: 'Söktaş',
      unitPrice: 45,
      currency: 'TRY',
      warehouse: { name: 'Kumaş Deposu' },
    });
    prisma.warehouse.findUnique.mockResolvedValue({
      id: 5,
      name: 'LINE-2 Hammadde Deposu',
    });
    prisma.stockLot.update.mockResolvedValue({ id: 10, remainingQty: 100 });
    prisma.stockLot.findFirst.mockResolvedValue(null);
    prisma.stockLot.create.mockResolvedValue({
      id: 20,
      warehouseId: 5,
      materialName: 'Ana Kumaş',
      receivedQty: 100,
      remainingQty: 100,
    });

    const result = await service.transferStock(
      { fromLotId: 10, toWarehouseId: 5, quantity: 100, notes: 'test transfer' },
      'admin@kepler-erp.com',
    );

    expect(prisma.stockLot.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { remainingQty: 100 },
    });
    expect(prisma.stockLot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        materialName: 'Ana Kumaş',
        materialType: 'Kumaş',
        supplierName: 'Söktaş',
        unitPrice: 45,
        currency: 'TRY',
        receivedQty: 100,
        remainingQty: 100,
        warehouseId: 5,
      }),
    });
    expect(prisma.stockMovement.create).toHaveBeenCalledTimes(2);
    expect(result.toLot).toEqual(
      expect.objectContaining({ id: 20, remainingQty: 100 }),
    );
  });

  it('hedef depoda aynı malzemeden lot varsa mevcut lota eklemeli (yeni lot oluşturmamalı)', async () => {
    prisma.stockLot.findUnique.mockResolvedValue({
      id: 10,
      remainingQty: 200,
      materialName: 'Ana Kumaş',
      materialType: 'Kumaş',
      supplierName: 'Söktaş',
      unitPrice: 45,
      currency: 'TRY',
      warehouse: { name: 'Kumaş Deposu' },
    });
    prisma.warehouse.findUnique.mockResolvedValue({
      id: 5,
      name: 'LINE-2 Hammadde Deposu',
    });
    prisma.stockLot.update
      .mockResolvedValueOnce({ id: 10, remainingQty: 150 }) // kaynak lot düşümü
      .mockResolvedValueOnce({ id: 20, receivedQty: 150, remainingQty: 150 }); // hedef lot artışı
    prisma.stockLot.findFirst.mockResolvedValue({
      id: 20,
      warehouseId: 5,
      materialName: 'Ana Kumaş',
      receivedQty: 100,
      remainingQty: 100,
    });

    const result = await service.transferStock({
      fromLotId: 10,
      toWarehouseId: 5,
      quantity: 50,
    });

    expect(prisma.stockLot.create).not.toHaveBeenCalled();
    expect(prisma.stockLot.update).toHaveBeenNthCalledWith(2, {
      where: { id: 20 },
      data: { receivedQty: 150, remainingQty: 150 },
    });
    expect(result.toLot.remainingQty).toBe(150);
  });

  it('hedef depo bulunamazsa NotFoundException fırlatmalı', async () => {
    prisma.stockLot.findUnique.mockResolvedValue({
      id: 10,
      remainingQty: 200,
      materialName: 'Ana Kumaş',
      materialType: 'Kumaş',
      supplierName: 'Söktaş',
      unitPrice: 45,
      currency: 'TRY',
      warehouse: { name: 'Kumaş Deposu' },
    });
    prisma.warehouse.findUnique.mockResolvedValue(null);

    await expect(
      service.transferStock({ fromLotId: 10, toWarehouseId: 999, quantity: 50 }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.stockLot.update).not.toHaveBeenCalled();
  });
});
