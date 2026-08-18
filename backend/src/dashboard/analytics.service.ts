import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  dateOnlyUTC,
  daysBetweenUTC,
  type QualitySummary,
  type SubcontractorPerformance,
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

  async getSubcontractorPerformance(
    tenantId?: string,
  ): Promise<SubcontractorPerformance[]> {
    const shipments = await this.prisma.fasonShipment.findMany({
      where: tenantId ? { tenantId } : undefined,
    });

    const bySubcontractor = new Map<string, typeof shipments>();
    for (const shipment of shipments) {
      const list = bySubcontractor.get(shipment.subcontractorName) ?? [];
      list.push(shipment);
      bySubcontractor.set(shipment.subcontractorName, list);
    }

    const results: SubcontractorPerformance[] = [];

    for (const [subcontractorName, subShipments] of bySubcontractor) {
      const totalShipments = subShipments.length;
      let onTimeCount = 0;
      let lateCount = 0;
      let pendingCount = 0;
      let totalDelayDays = 0;
      let totalFireRate = 0;
      let fireRateSamples = 0;

      for (const shipment of subShipments) {
        if (shipment.receivedDate) {
          if (shipment.expectedReturnDate) {
            const expectedMs = dateOnlyUTC(shipment.expectedReturnDate);
            const receivedMs = dateOnlyUTC(shipment.receivedDate);
            if (receivedMs <= expectedMs) {
              onTimeCount += 1;
            } else {
              lateCount += 1;
              totalDelayDays += daysBetweenUTC(expectedMs, receivedMs);
            }
          } else {
            onTimeCount += 1;
          }

          if (shipment.receivedQuantity != null && shipment.sentQuantity > 0) {
            const fireQuantity = Math.max(
              0,
              shipment.sentQuantity - shipment.receivedQuantity,
            );
            totalFireRate += (fireQuantity / shipment.sentQuantity) * 100;
            fireRateSamples += 1;
          }
        } else {
          pendingCount += 1;
        }
      }

      const avgDelayDays = lateCount > 0 ? totalDelayDays / lateCount : 0;
      const avgFireRate =
        fireRateSamples > 0 ? totalFireRate / fireRateSamples : 0;
      const onTimeRate =
        totalShipments > 0 ? (onTimeCount / totalShipments) * 100 : 0;
      const reliabilityScore = Math.max(
        0,
        Math.min(100, onTimeRate * 0.6 + (100 - avgFireRate) * 0.4),
      );

      results.push({
        subcontractorName,
        totalShipments,
        onTimeCount,
        lateCount,
        pendingCount,
        avgDelayDays,
        avgFireRate,
        reliabilityScore,
      });
    }

    return results.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
  }
}
