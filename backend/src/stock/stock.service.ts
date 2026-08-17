import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { ConsumeStockLotDto, CreateStockLotDto } from './dto/stock.dto';

export type FifoSuggestionLine = {
  lotId: number;
  lotNo: string | null;
  supplierName: string;
  receivedDate: Date;
  useQty: number;
  remainingAfter: number;
};

export type FifoSuggestion = {
  materialName: string;
  neededQty: number;
  fulfilled: boolean;
  shortfall: number;
  totalAvailable: number;
  suggestions: FifoSuggestionLine[];
};

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async getLots(materialType?: string, warehouseId?: number) {
    const lots = await this.prisma.stockLot.findMany({
      where: {
        ...(materialType ? { materialType } : {}),
        ...(warehouseId ? { warehouseId } : {}),
      },
      include: { warehouse: true },
      orderBy: { receivedDate: 'asc' },
    });

    // remainingQty > 0 olan lotlar önce gösterilir; Array.sort stabil olduğu
    // için her grup içindeki receivedDate sırası korunur.
    return [...lots]
      .sort((a, b) => {
        const aHasStock = a.remainingQty > 0 ? 0 : 1;
        const bHasStock = b.remainingQty > 0 ? 0 : 1;
        return aHasStock - bHasStock;
      })
      .map(({ warehouse, ...lot }) => ({
        ...lot,
        warehouseName: warehouse?.name ?? null,
      }));
  }

  async getWarehouses() {
    return this.prisma.warehouse.findMany({ orderBy: { name: 'asc' } });
  }

  async createLot(data: CreateStockLotDto) {
    if (data.receivedQty <= 0) {
      throw new BadRequestException('Gelen miktar sıfırdan büyük olmalı.');
    }

    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.stockLot.create({
        data: {
          materialName: data.materialName.trim(),
          materialType: data.materialType.trim(),
          supplierName: data.supplierName.trim(),
          lotNo: data.lotNo?.trim() || undefined,
          receivedQty: data.receivedQty,
          remainingQty: data.receivedQty,
          unitPrice: data.unitPrice,
          currency: data.currency ?? 'USD',
          receivedDate: data.receivedDate
            ? new Date(data.receivedDate)
            : undefined,
          orderId: data.orderId,
          warehouseId: data.warehouseId,
        },
      });

      await tx.stockMovement.create({
        data: {
          stockLotId: lot.id,
          type: 'GIRIS',
          quantity: data.receivedQty,
          reason: 'Stok girişi',
          orderId: data.orderId,
        },
      });

      return lot;
    });
  }

  async consumeLot(lotId: number, data: ConsumeStockLotDto) {
    if (data.quantity <= 0) {
      throw new BadRequestException('Tüketim miktarı sıfırdan büyük olmalı.');
    }

    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.stockLot.findUnique({ where: { id: lotId } });
      if (!lot) {
        throw new NotFoundException('Stok lotu bulunamadı');
      }

      if (data.quantity > lot.remainingQty) {
        throw new BadRequestException(
          `Tüketim miktarı (${data.quantity}) kalan stoktan (${lot.remainingQty}) fazla olamaz.`,
        );
      }

      const updatedLot = await tx.stockLot.update({
        where: { id: lotId },
        data: { remainingQty: lot.remainingQty - data.quantity },
      });

      await tx.stockMovement.create({
        data: {
          stockLotId: lotId,
          type: 'CIKIS',
          quantity: data.quantity,
          reason: data.reason,
          orderId: data.orderId,
        },
      });

      return updatedLot;
    });
  }

  async getMovements(lotId: number) {
    const lot = await this.prisma.stockLot.findUnique({
      where: { id: lotId },
    });
    if (!lot) {
      throw new NotFoundException('Stok lotu bulunamadı');
    }

    return this.prisma.stockMovement.findMany({
      where: { stockLotId: lotId },
      orderBy: { date: 'asc' },
    });
  }

  async getFifoSuggestion(
    materialName: string,
    neededQty: number,
  ): Promise<FifoSuggestion> {
    const lots = await this.prisma.stockLot.findMany({
      where: {
        materialName: { equals: materialName, mode: 'insensitive' },
        remainingQty: { gt: 0 },
      },
      orderBy: { receivedDate: 'asc' },
    });

    const suggestions: FifoSuggestionLine[] = [];
    let remainingNeeded = neededQty;

    for (const lot of lots) {
      if (remainingNeeded <= 0) break;

      const useQty = Math.min(lot.remainingQty, remainingNeeded);
      suggestions.push({
        lotId: lot.id,
        lotNo: lot.lotNo,
        supplierName: lot.supplierName,
        receivedDate: lot.receivedDate,
        useQty,
        remainingAfter: lot.remainingQty - useQty,
      });
      remainingNeeded -= useQty;
    }

    const totalAvailable = lots.reduce((sum, lot) => sum + lot.remainingQty, 0);
    const fulfilled = remainingNeeded <= 0;

    return {
      materialName,
      neededQty,
      fulfilled,
      shortfall: fulfilled ? 0 : remainingNeeded,
      totalAvailable,
      suggestions,
    };
  }
}
