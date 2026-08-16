import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  dateOnlyUTC,
  daysBetweenUTC,
  type QualitySummary,
  type SupplierPerformance,
} from './dashboard-shared';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getQualitySummary(tenantId?: string): Promise<QualitySummary> {
    const entries = await this.prisma.qualityEntry.findMany({
      where: tenantId ? { order: { tenantId } } : undefined,
    });

    const totalChecked = entries.reduce(
      (sum, entry) => sum + entry.checkedQty,
      0,
    );
    const totalFirstQuality = entries.reduce(
      (sum, entry) => sum + entry.firstQuality,
      0,
    );
    const totalSecondQuality = entries.reduce(
      (sum, entry) => sum + entry.secondQuality,
      0,
    );
    const totalRejected = entries.reduce(
      (sum, entry) => sum + entry.rejected,
      0,
    );

    const secondQualityRate =
      totalChecked > 0 ? (totalSecondQuality / totalChecked) * 100 : 0;
    const rejectionRate =
      totalChecked > 0 ? (totalRejected / totalChecked) * 100 : 0;

    return {
      totalChecked,
      totalFirstQuality,
      totalSecondQuality,
      totalRejected,
      secondQualityRate,
      rejectionRate,
    };
  }

  async getSupplierPerformance(
    tenantId?: string,
  ): Promise<SupplierPerformance[]> {
    const materials = await this.prisma.material.findMany({
      where: tenantId ? { order: { tenantId } } : undefined,
      include: { order: true },
    });

    const bySupplier = new Map<string, typeof materials>();
    for (const material of materials) {
      const list = bySupplier.get(material.supplierName) ?? [];
      list.push(material);
      bySupplier.set(material.supplierName, list);
    }

    const results: SupplierPerformance[] = [];

    for (const [supplierName, supplierMaterials] of bySupplier) {
      const totalOrders = supplierMaterials.length;
      let onTimeCount = 0;
      let lateCount = 0;
      let pendingCount = 0;
      let totalDelayDays = 0;

      for (const material of supplierMaterials) {
        if (material.status === 'ARRIVED' && material.expectedArrival) {
          const expectedMs = dateOnlyUTC(material.expectedArrival);
          const shipmentMs = dateOnlyUTC(material.order.shipmentDate);

          if (expectedMs <= shipmentMs) {
            onTimeCount += 1;
          } else {
            lateCount += 1;
            totalDelayDays += daysBetweenUTC(shipmentMs, expectedMs);
          }
        } else if (material.status === 'PENDING') {
          pendingCount += 1;
        }
      }

      const avgDelayDays = lateCount > 0 ? totalDelayDays / lateCount : 0;
      const reliabilityScore =
        totalOrders > 0 ? (onTimeCount / totalOrders) * 100 : 0;

      results.push({
        supplierName,
        totalOrders,
        onTimeCount,
        lateCount,
        pendingCount,
        avgDelayDays,
        reliabilityScore,
      });
    }

    return results.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
  }
}
