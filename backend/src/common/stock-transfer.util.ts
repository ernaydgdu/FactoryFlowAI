import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';

export type StockTransferParams = {
  fromLotId: number;
  toWarehouseId: number;
  quantity: number;
  notes?: string;
  orderId?: number;
  performedBy?: string;
};

// Bir depodaki stok lotundan bir kısmını (veya tamamını) başka bir depoya
// taşır: kaynak lottan düşer, hedef depoda aynı malzeme adına ait bir lot
// varsa ona ekler, yoksa yeni bir lot oluşturur. Her iki tarafta da
// StockMovement kaydı bırakır. Hem manuel transfer endpoint'i hem de
// otomatik kumaş tüketimindeki (kesim aşaması) transfer akışı bu fonksiyonu
// paylaşır.
export async function performStockTransfer(
  tx: Prisma.TransactionClient,
  params: StockTransferParams,
) {
  const { fromLotId, toWarehouseId, quantity, notes, orderId, performedBy } =
    params;

  if (quantity <= 0) {
    throw new BadRequestException('Transfer miktarı sıfırdan büyük olmalı.');
  }

  const fromLot = await tx.stockLot.findUnique({
    where: { id: fromLotId },
    include: { warehouse: true },
  });
  if (!fromLot) {
    throw new NotFoundException('Kaynak stok lotu bulunamadı');
  }
  if (quantity > fromLot.remainingQty) {
    throw new BadRequestException(
      `Transfer için yeterli stok yok, mevcut: ${fromLot.remainingQty}`,
    );
  }

  const toWarehouse = await tx.warehouse.findUnique({
    where: { id: toWarehouseId },
  });
  if (!toWarehouse) {
    throw new NotFoundException('Hedef depo bulunamadı');
  }

  const updatedFromLot = await tx.stockLot.update({
    where: { id: fromLotId },
    data: { remainingQty: fromLot.remainingQty - quantity },
  });

  await tx.stockMovement.create({
    data: {
      stockLotId: fromLotId,
      type: 'CIKIS',
      quantity,
      reason: notes
        ? `Depo transferi - ${toWarehouse.name} (${notes})`
        : `Depo transferi - ${toWarehouse.name}`,
      orderId,
      performedBy,
    },
  });

  const existingToLot = await tx.stockLot.findFirst({
    where: {
      warehouseId: toWarehouseId,
      materialName: { equals: fromLot.materialName, mode: 'insensitive' },
    },
  });

  const toLot = existingToLot
    ? await tx.stockLot.update({
        where: { id: existingToLot.id },
        data: {
          receivedQty: existingToLot.receivedQty + quantity,
          remainingQty: existingToLot.remainingQty + quantity,
        },
      })
    : await tx.stockLot.create({
        data: {
          materialName: fromLot.materialName,
          materialType: fromLot.materialType,
          supplierName: fromLot.supplierName,
          unitPrice: fromLot.unitPrice,
          currency: fromLot.currency,
          receivedQty: quantity,
          remainingQty: quantity,
          receivedDate: new Date(),
          warehouseId: toWarehouseId,
        },
      });

  const fromWarehouseName = fromLot.warehouse?.name ?? 'Depo';
  await tx.stockMovement.create({
    data: {
      stockLotId: toLot.id,
      type: 'GIRIS',
      quantity,
      reason: notes
        ? `Depo transferi - ${fromWarehouseName} (${notes})`
        : `Depo transferi - ${fromWarehouseName}`,
      orderId,
      performedBy,
    },
  });

  return { fromLot: updatedFromLot, toLot };
}
