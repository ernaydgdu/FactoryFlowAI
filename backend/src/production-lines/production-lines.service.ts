import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { todayRangeUTC } from '../dashboard/dashboard-shared';
import type { CreateProductionLineDto } from './dto/production-line.dto';

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
    try {
      return await this.prisma.productionLine.create({
        data: {
          name: data.name.trim(),
          capacity: data.capacity ?? 0,
          tenantId,
        },
      });
    } catch {
      throw new ConflictException('Bu hat adı zaten kayıtlı.');
    }
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

      return {
        lineName: line.name,
        capacity: line.capacity,
        todayProduction,
        fillRate,
        activeOrders,
      };
    });
  }
}
