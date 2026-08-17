import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  computeExpectedProgress,
  isWithinWorkday,
} from '../common/line-pace.util';
import {
  APPROVAL_STAGE_LABEL,
  dateOnlyUTC,
  daysBetweenUTC,
  SEVERITY_RANK,
  todayRangeUTC,
  type DashboardAlert,
} from './dashboard-shared';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  async getAlerts(tenantId?: string): Promise<DashboardAlert[]> {
    const orders = await this.prisma.order.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { materials: true, qualityEntries: true },
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

      if (order.qualityEntries.length > 0) {
        const totalChecked = order.qualityEntries.reduce(
          (sum, entry) => sum + entry.checkedQty,
          0,
        );

        if (totalChecked > 0) {
          const totalRejected = order.qualityEntries.reduce(
            (sum, entry) => sum + entry.rejected,
            0,
          );
          const totalSecondQuality = order.qualityEntries.reduce(
            (sum, entry) => sum + entry.secondQuality,
            0,
          );

          const rejectionRate = (totalRejected / totalChecked) * 100;
          const secondQualityRate = (totalSecondQuality / totalChecked) * 100;

          if (rejectionRate > 5) {
            alerts.push({
              id: `fire-rate-${order.id}`,
              type: 'FIRE_RATE_HIGH',
              severity: 'HIGH',
              message: `🚨 ${order.orderNo} - ${order.buyerName} siparişinde fire oranı %${rejectionRate.toFixed(1)} - kabul edilebilir sınırın (%5) üzerinde!`,
              orderId: order.id,
              orderNo: order.orderNo,
            });
          } else if (secondQualityRate > 5) {
            alerts.push({
              id: `second-quality-${order.id}`,
              type: 'SECOND_QUALITY_HIGH',
              severity: 'MEDIUM',
              message: `⚠️ ${order.orderNo} siparişinde 2. kalite oranı %${secondQualityRate.toFixed(1)} - normalin üzerinde, üretim sürecini kontrol edin`,
              orderId: order.id,
              orderNo: order.orderNo,
            });
          }
        }
      }
    }

    // StockLot modelinde tenantId alanı yok (stok kasıtlı olarak tenant'lar arası paylaşılan
    // bir kaynak) — ama bir sipariş ile ilişkilendirilmiş lotlar (orderId dolu) o siparişin
    // tenant'ına aitmiş gibi davranmalı; aksi halde bir tenant başka bir tenant'ın sipariş
    // bazlı stok uyarısını görebilir. Siparişe bağlı olmayan (orderId=null) lotlar hâlâ
    // tüm tenant'lar arasında paylaşılıyor (bilinen mimari sınırlama).
    const stockLots = await this.prisma.stockLot.findMany({
      where: tenantId
        ? { OR: [{ orderId: null }, { order: { tenantId } }] }
        : undefined,
      include: { warehouse: { include: { line: true } } },
    });

    type StockGroup = {
      materialName: string;
      warehouseType: string | null;
      warehouseName: string | null;
      lineName: string | null;
      totalReceived: number;
      totalRemaining: number;
    };

    // Depo başına ayrı değerlendirme: aynı malzeme farklı depolarda farklı
    // kritiklik durumunda olabilir (örn. genel kumaş deposu dolu ama bir
    // hattın hammadde deposu boş) — bu yüzden warehouseId + materialName
    // birlikte gruplanır. Ürün Deposu (mamul) bu kuralın kapsamı dışında.
    const stockByWarehouseMaterial = new Map<string, StockGroup>();
    for (const lot of stockLots) {
      if (lot.warehouse?.type === 'URUN') continue;

      const key = `${lot.warehouseId ?? 'none'}::${lot.materialName}`;
      const entry = stockByWarehouseMaterial.get(key) ?? {
        materialName: lot.materialName,
        warehouseType: lot.warehouse?.type ?? null,
        warehouseName: lot.warehouse?.name ?? null,
        lineName: lot.warehouse?.line?.name ?? null,
        totalReceived: 0,
        totalRemaining: 0,
      };
      entry.totalReceived += lot.receivedQty;
      entry.totalRemaining += lot.remainingQty;
      stockByWarehouseMaterial.set(key, entry);
    }

    const STOCK_CRITICAL_RATIO = 0.15;
    for (const [key, group] of stockByWarehouseMaterial) {
      if (
        group.totalReceived <= 0 ||
        group.totalRemaining >= group.totalReceived * STOCK_CRITICAL_RATIO
      ) {
        continue;
      }

      if (group.warehouseType === 'ATOLYE_HAMMADDE') {
        const lineLabel = group.lineName ?? group.warehouseName ?? 'Bilinmeyen hat';
        alerts.push({
          id: `stock-critical-${key}`,
          type: 'STOCK_CRITICAL',
          severity: 'HIGH',
          message: `🚨 ${lineLabel} hattındaki ${group.materialName} kritik seviyede - sadece ${group.totalRemaining.toFixed(1)} birim kaldı, üretim durabilir!`,
        });
      } else {
        const warehouseLabel = group.warehouseName ?? 'Depo atanmamış';
        alerts.push({
          id: `stock-critical-${key}`,
          type: 'STOCK_CRITICAL',
          severity: 'MEDIUM',
          message: `⚠️ ${warehouseLabel} - ${group.materialName} stoku kritik seviyede - sadece ${group.totalRemaining.toFixed(1)} birim kaldı (başlangıç: ${group.totalReceived.toFixed(1)})`,
        });
      }
    }

    const pendingApprovalStages = await this.prisma.approvalStage.findMany({
      where: {
        status: 'PENDING',
        ...(tenantId ? { order: { tenantId } } : {}),
      },
      include: { order: true },
    });

    const APPROVAL_STALLED_DAYS = 3;
    for (const stage of pendingApprovalStages) {
      const daysPending = daysBetweenUTC(
        dateOnlyUTC(stage.createdAt),
        todayStartMs,
      );
      if (daysPending > APPROVAL_STALLED_DAYS) {
        alerts.push({
          id: `approval-stalled-${stage.id}`,
          type: 'APPROVAL_STALLED',
          severity: 'MEDIUM',
          message: `⚠️ ${stage.order.orderNo} - ${stage.order.buyerName} siparişinde ${APPROVAL_STAGE_LABEL[stage.stageType] ?? stage.stageType} onayı ${daysPending} gündür bekliyor - süreç tıkanmış olabilir`,
          orderId: stage.order.id,
          orderNo: stage.order.orderNo,
        });
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

    const now = new Date();
    if (isWithinWorkday(now)) {
      const lines = await this.prisma.productionLine.findMany({
        where: tenantId ? { tenantId } : undefined,
      });

      if (lines.length > 0) {
        const todayLineEntries = await this.prisma.productionEntry.findMany({
          where: {
            lineNo: { not: null },
            date: { gte: start, lt: end },
            ...(tenantId ? { order: { tenantId } } : {}),
          },
        });

        for (const line of lines) {
          const entries = todayLineEntries.filter(
            (entry) => entry.lineNo === line.name,
          );
          if (entries.length === 0) continue; // boşta hat - atla

          const todayProduction = entries.reduce(
            (sum, entry) => sum + entry.quantity,
            0,
          );
          const expectedProgressByNow = computeExpectedProgress(
            line.capacity,
            now,
          );
          const onPace = todayProduction >= expectedProgressByNow;

          if (!onPace) {
            alerts.push({
              id: `line-behind-pace-${line.id}`,
              type: 'LINE_BEHIND_PACE',
              severity: 'MEDIUM',
              message: `⚠️ ${line.name} hattı bugünkü hedefin gerisinde - beklenen ${expectedProgressByNow} adet, gerçekleşen ${todayProduction} adet`,
            });
          }
        }
      }
    }

    return alerts.sort(
      (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
    );
  }
}
