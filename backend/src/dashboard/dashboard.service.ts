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

function daysBetweenUTC(fromMs: number, toMs: number): number {
  return Math.round((toMs - fromMs) / (24 * 60 * 60 * 1000));
}

export type DashboardAlertType =
  | 'MATERIAL_DELAY'
  | 'MATERIAL_PENDING'
  | 'NO_PRODUCTION';

export type DashboardAlertSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export type DashboardAlert = {
  id: string;
  type: DashboardAlertType;
  severity: DashboardAlertSeverity;
  message: string;
  orderId?: number;
  orderNo?: string;
};

const SEVERITY_RANK: Record<DashboardAlertSeverity, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

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

  async getAlerts(tenantId?: string): Promise<DashboardAlert[]> {
    const orders = await this.prisma.order.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { materials: true },
    });

    const alerts: DashboardAlert[] = [];
    const todayStartMs = dateOnlyUTC(new Date());

    for (const order of orders) {
      const exfMs = dateOnlyUTC(order.shipmentDate);

      for (const material of order.materials) {
        if (material.expectedArrival) {
          const expectedMs = dateOnlyUTC(material.expectedArrival);
          if (expectedMs > exfMs) {
            const daysLate = daysBetweenUTC(exfMs, expectedMs);
            alerts.push({
              id: `delay-${material.id}`,
              type: 'MATERIAL_DELAY',
              severity: 'MEDIUM',
              message: `⚠️ ${order.orderNo} - ${order.buyerName} siparişinin ${material.materialName} malzemesi EXF tarihinden ${daysLate} gün geç geliyor. Tedarikçi: ${material.supplierName}`,
              orderId: order.id,
              orderNo: order.orderNo,
            });
          }
        }

        if (material.status === 'PENDING') {
          const daysUntilExf = daysBetweenUTC(todayStartMs, exfMs);
          if (daysUntilExf < 7) {
            alerts.push({
              id: `pending-${material.id}`,
              type: 'MATERIAL_PENDING',
              severity: 'HIGH',
              message: `🚨 ${order.orderNo} siparişinin ${material.materialName} malzemesi henüz gelmedi, EXF'ye ${daysUntilExf} gün kaldı!`,
              orderId: order.id,
              orderNo: order.orderNo,
            });
          }
        }
      }
    }

    const { start, end } = todayRangeUTC();
    const todayEntriesCount = await this.prisma.productionEntry.count({
      where: {
        date: { gte: start, lt: end },
        ...(tenantId ? { order: { tenantId } } : {}),
      },
    });

    if (todayEntriesCount === 0) {
      alerts.push({
        id: 'no-production-today',
        type: 'NO_PRODUCTION',
        severity: 'LOW',
        message: '📋 Bugün henüz üretim girişi yapılmadı',
      });
    }

    return alerts.sort(
      (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
    );
  }
}
