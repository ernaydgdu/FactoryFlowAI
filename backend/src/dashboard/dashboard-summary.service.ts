import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { dateOnlyUTC, todayRangeUTC } from './dashboard-shared';

@Injectable()
export class DashboardSummaryService {
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
          dateOnlyUTC(material.expectedArrival) >
            dateOnlyUTC(order.shipmentDate),
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
