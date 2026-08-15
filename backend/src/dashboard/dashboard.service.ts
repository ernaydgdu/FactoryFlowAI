import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function dateOnlyUTC(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function todayRangeUTC(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(tenantId?: string) {
    const orders = await this.prisma.order.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { materials: true },
    });

    const totalOrders = orders.length;

    const terminRiskOrders = orders.filter((order) =>
      order.materials.some(
        (material) =>
          material.expectedArrival &&
          dateOnlyUTC(material.expectedArrival) > dateOnlyUTC(order.shipmentDate),
      ),
    ).length;

    const { start, end } = todayRangeUTC();
    const todayEntries = await this.prisma.productionEntry.findMany({
      where: {
        date: { gte: start, lt: end },
        ...(tenantId ? { order: { tenantId } } : {}),
      },
    });

    const totalProduction = todayEntries.reduce(
      (sum, entry) => sum + entry.quantity,
      0,
    );
    const cuttingToday = todayEntries
      .filter((entry) => entry.stage === 'CUTTING')
      .reduce((sum, entry) => sum + entry.quantity, 0);
    const sewingToday = todayEntries
      .filter((entry) => entry.stage === 'SEWING')
      .reduce((sum, entry) => sum + entry.quantity, 0);

    return {
      totalOrders,
      terminRiskOrders,
      totalProduction,
      cuttingToday,
      sewingToday,
    };
  }
}
