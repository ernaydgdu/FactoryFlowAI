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

export type FinishedGoodsStatus =
  'SEVKIYAT_BEKLIYOR' | 'KISMI_SEVK_EDILDI' | 'TAMAMEN_SEVK_EDILDI';

export type FinishedGoodsLine = {
  lotId: number;
  orderId: number | null;
  orderNo: string | null;
  buyerName: string | null;
  productName: string | null;
  totalQuantity: number | null;
  shipmentDate: Date | null;
  packagedQty: number;
  remainingQty: number;
  shippedQty: number;
  status: FinishedGoodsStatus;
};

export type FinishedGoodsSummary = {
  totalPackaged: number;
  totalShipped: number;
  totalPending: number;
  lines: FinishedGoodsLine[];
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

  async getFinishedGoods(): Promise<FinishedGoodsSummary> {
    const lots = await this.prisma.stockLot.findMany({
      where: { warehouse: { type: 'URUN' } },
      include: { order: true },
      orderBy: { receivedDate: 'desc' },
    });

    const lines = lots.map((lot) => {
      const shippedQty = lot.receivedQty - lot.remainingQty;
      const status: FinishedGoodsStatus =
        lot.remainingQty === 0
          ? 'TAMAMEN_SEVK_EDILDI'
          : lot.remainingQty === lot.receivedQty
            ? 'SEVKIYAT_BEKLIYOR'
            : 'KISMI_SEVK_EDILDI';

      return {
        lotId: lot.id,
        orderId: lot.orderId,
        orderNo: lot.order?.orderNo ?? null,
        buyerName: lot.order?.buyerName ?? null,
        productName: lot.order?.productName ?? null,
        totalQuantity: lot.order?.totalQuantity ?? null,
        shipmentDate: lot.order?.shipmentDate ?? null,
        packagedQty: lot.receivedQty,
        remainingQty: lot.remainingQty,
        shippedQty,
        status,
      };
    });

    const totalPackaged = lines.reduce((sum, l) => sum + l.packagedQty, 0);
    const totalShipped = lines.reduce((sum, l) => sum + l.shippedQty, 0);
    const totalPending = lines.reduce((sum, l) => sum + l.remainingQty, 0);

    return { totalPackaged, totalShipped, totalPending, lines };
  }

  async getWarehouses() {
    const warehouses = await this.prisma.warehouse.findMany({
      orderBy: { name: 'asc' },
      include: { stockLots: true },
    });

    return warehouses.map(({ stockLots, ...warehouse }) => {
      const totalValueByCurrency = new Map<string, number>();
      for (const lot of stockLots) {
        if (lot.unitPrice == null) continue;
        const value = lot.unitPrice * lot.remainingQty;
        totalValueByCurrency.set(
          lot.currency,
          (totalValueByCurrency.get(lot.currency) ?? 0) + value,
        );
      }

      return {
        ...warehouse,
        lotCount: stockLots.length,
        totalValueByCurrency: Object.fromEntries(totalValueByCurrency),
      };
    });
  }

  async createLot(data: CreateStockLotDto, performedBy?: string) {
    if (data.receivedQty <= 0) {
      throw new BadRequestException('Gelen miktar sıfırdan büyük olmalı.');
    }

    return this.prisma.$transaction(async (tx) => {
      const lot = await tx.stockLot.create({
        data: {
          code: data.code?.trim() || undefined,
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
          performedBy,
        },
      });

      return lot;
    });
  }

  async consumeLot(
    lotId: number,
    data: ConsumeStockLotDto,
    performedBy?: string,
  ) {
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
          performedBy,
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

  async exportLotsCsv(warehouseId?: number): Promise<string> {
    const lots = await this.prisma.stockLot.findMany({
      where: warehouseId ? { warehouseId } : undefined,
      include: { warehouse: true },
      orderBy: { receivedDate: 'asc' },
    });

    const header = [
      'Depo Kodu',
      'Depo Adı',
      'Malzeme Kodu',
      'Malzeme Adı',
      'Tip',
      'Tedarikçi',
      'Lot No',
      'Gelen Miktar',
      'Kalan Miktar',
      'Birim Fiyat',
      'Para Birimi',
      'Geliş Tarihi',
    ];

    const rows = lots.map((lot) => [
      lot.warehouse?.code ?? '',
      lot.warehouse?.name ?? '',
      lot.code ?? '',
      lot.materialName,
      lot.materialType,
      lot.supplierName,
      lot.lotNo ?? '',
      String(lot.receivedQty),
      String(lot.remainingQty),
      lot.unitPrice != null ? String(lot.unitPrice) : '',
      lot.currency,
      lot.receivedDate.toISOString().slice(0, 10),
    ]);

    const escapeCsvField = (field: string): string => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const lines = [header, ...rows].map((row) =>
      row.map(escapeCsvField).join(','),
    );

    // UTF-8 BOM — Excel'in Türkçe karakterleri (ş, ğ, ı vb.) doğru göstermesi için gerekli.
    return '\uFEFF' + lines.join('\r\n');
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
