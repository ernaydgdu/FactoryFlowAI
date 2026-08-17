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
  currentHour: number;
  workdayStartHour: number;
  workdayEndHour: number;
  expectedProgressByNow: number;
  onPace: boolean;
  paceMessage: string | null;
};

// Mesai saatleri varsayımı — gerçek fabrika vardiya takvimi bağlanana
// kadar sabit tutulur.
const WORKDAY_START_HOUR = 8;
const WORKDAY_END_HOUR = 18;
const WORKDAY_TOTAL_HOURS = WORKDAY_END_HOUR - WORKDAY_START_HOUR;

// Şu ana kadar üretilmiş olması beklenen miktarı, mesai içindeki geçen
// süre oranına göre hesaplar (mesai öncesi 0, mesai sonrası tam kapasite).
function computeExpectedProgress(capacity: number, now: Date): number {
  const elapsedHours =
    now.getHours() + now.getMinutes() / 60 - WORKDAY_START_HOUR;

  if (elapsedHours <= 0) return 0;
  if (elapsedHours >= WORKDAY_TOTAL_HOURS) return capacity;

  return Math.round((elapsedHours / WORKDAY_TOTAL_HOURS) * capacity);
}

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
