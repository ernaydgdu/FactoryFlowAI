import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { todayRangeUTC } from '../dashboard/dashboard-shared';
import {
  computeExpectedProgress,
  WORKDAY_START_HOUR,
  WORKDAY_END_HOUR,
} from '../common/line-pace.util';
import type {
  CreateProductionLineDto,
  UpdateProductionLineDto,
} from './dto/production-line.dto';

export type LineStatusOrder = {
  orderNo: string;
  buyerName: string;
  productName: string;
};

export type LineStatus = {
  lineName: string;
  capacity: number;
  todayProduction: number;
  fillRate: number;
  activeOrders: LineStatusOrder[];
  currentHour: number;
  workdayStartHour: number;
  workdayEndHour: number;
  expectedProgressByNow: number;
  onPace: boolean;
  paceMessage: string | null;
};

@Injectable()
export class ProductionLinesService {
  constructor(private prisma: PrismaService) {}

  async getLines(tenantId?: string) {
    return this.prisma.productionLine.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async createLine(data: CreateProductionLineDto, tenantId: string) {
    const name = data.name.trim();
    const lineNumber = name.replace(/\D/g, '') || name;
    const warehouseName = `${name} Hammadde Deposu`;
    const warehouseCode = `LN${lineNumber}-HM`;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const line = await tx.productionLine.create({
          data: {
            name,
            capacity: data.capacity ?? 0,
            tenantId,
          },
        });

        await tx.warehouse.create({
          data: {
            name: warehouseName,
            code: warehouseCode,
            type: 'ATOLYE_HAMMADDE',
            lineId: line.id,
            tenantId,
          },
        });

        return line;
      });
    } catch {
      throw new ConflictException('Bu hat adı zaten kayıtlı.');
    }
  }

  async updateLine(id: number, data: UpdateProductionLineDto) {
    const existing = await this.prisma.productionLine.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Hat bulunamadı');
    }

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.capacity !== undefined) updateData.capacity = data.capacity;

    try {
      return await this.prisma.productionLine.update({
        where: { id },
        data: updateData,
      });
    } catch {
      throw new ConflictException('Bu hat adı zaten kayıtlı.');
    }
  }

  async deleteLine(id: number) {
    const existing = await this.prisma.productionLine.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Hat bulunamadı');
    }

    const entryCount = await this.prisma.productionEntry.count({
      where: { lineNo: existing.name },
    });
    if (entryCount > 0) {
      throw new BadRequestException(
        'Bu hatta üretim geçmişi var, silinemez.',
      );
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { lineId: id, type: 'ATOLYE_HAMMADDE' },
    });

    if (warehouse) {
      const lotCount = await this.prisma.stockLot.count({
        where: { warehouseId: warehouse.id },
      });
      if (lotCount > 0) {
        throw new BadRequestException(
          'Bu hatta stok kaydı var, önce boşaltılmalı.',
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      if (warehouse) {
        await tx.warehouse.delete({ where: { id: warehouse.id } });
      }
      await tx.productionLine.delete({ where: { id } });
    });

    return { success: true };
  }

  async getLineStatus(tenantId?: string): Promise<LineStatus[]> {
    const lines = await this.prisma.productionLine.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: { name: 'asc' },
    });

    const { start, end } = todayRangeUTC();
    const todayEntries = await this.prisma.productionEntry.findMany({
      where: {
        lineNo: { not: null },
        date: { gte: start, lt: end },
        ...(tenantId ? { order: { tenantId } } : {}),
      },
      include: { order: true },
      orderBy: { date: 'desc' },
    });

    const now = new Date();
    const currentHour = now.getHours();

    return lines.map((line) => {
      const entries = todayEntries.filter((entry) => entry.lineNo === line.name);
      const todayProduction = entries.reduce((sum, entry) => sum + entry.quantity, 0);
      const fillRate =
        line.capacity > 0
          ? Math.round((todayProduction / line.capacity) * 1000) / 10
          : 0;

      const seen = new Set<number>();
      const activeOrders: LineStatusOrder[] = [];
      for (const entry of entries) {
        if (seen.has(entry.orderId)) continue;
        seen.add(entry.orderId);
        activeOrders.push({
          orderNo: entry.order.orderNo,
          buyerName: entry.order.buyerName,
          productName: entry.order.productName,
        });
      }

      const expectedProgressByNow = computeExpectedProgress(line.capacity, now);
      const onPace = todayProduction >= expectedProgressByNow;
      const paceMessage = onPace
        ? null
        : `Beklenen ${expectedProgressByNow} adet, gerçekleşen ${todayProduction} adet - ${expectedProgressByNow - todayProduction} adet geride`;

      return {
        lineName: line.name,
        capacity: line.capacity,
        todayProduction,
        fillRate,
        activeOrders,
        currentHour,
        workdayStartHour: WORKDAY_START_HOUR,
        workdayEndHour: WORKDAY_END_HOUR,
        expectedProgressByNow,
        onPace,
        paceMessage,
      };
    });
  }
}
