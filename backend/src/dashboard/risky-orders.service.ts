import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { computeCompletionForecast } from '../orders/forecast.util';
import { dateOnlyUTC, daysBetweenUTC } from './dashboard-shared';

export type RiskyOrder = {
  orderId: number;
  orderNo: string;
  buyerName: string;
  productName: string;
  riskScore: number;
  risks: string[];
};

const APPROVAL_STALLED_DAYS = 3;
const FIRE_RATE_THRESHOLD = 5;

@Injectable()
export class RiskyOrdersService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {}

  async getRiskyOrders(tenantId?: string): Promise<RiskyOrder[]> {
    const orders = await this.prisma.order.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: {
        materials: true,
        qualityEntries: true,
        approvalStages: true,
        productionEntries: true,
      },
    });

    const todayMs = dateOnlyUTC(new Date());
    const results: RiskyOrder[] = [];

    for (const order of orders) {
      const risks: string[] = [];
      const exfMs = dateOnlyUTC(order.shipmentDate);

      // Termin riski — malzeme EXF'den geç geliyor
      const terminRisk = order.materials.some(
        (material) =>
          material.expectedArrival &&
          dateOnlyUTC(material.expectedArrival) > exfMs,
      );
      if (terminRisk) risks.push('Termin riski');

      // Malzeme yetersizliği — girilen kumaş tahmini ihtiyacın altında
      const suggestion = this.ordersService.computeAiSuggestion(order);
      if (suggestion.warning) risks.push('Kumaş yetersiz');

      // Fire oranı yüksek
      const totalChecked = order.qualityEntries.reduce(
        (sum, entry) => sum + entry.checkedQty,
        0,
      );
      if (totalChecked > 0) {
        const totalRejected = order.qualityEntries.reduce(
          (sum, entry) => sum + entry.rejected,
          0,
        );
        const rejectionRate = (totalRejected / totalChecked) * 100;
        if (rejectionRate > FIRE_RATE_THRESHOLD) {
          risks.push('Fire oranı yüksek');
        }
      }

      // Onay süreci tıkalı — bir aşama 3+ gündür beklemede
      const approvalStalled = order.approvalStages.some(
        (stage) =>
          stage.status === 'PENDING' &&
          daysBetweenUTC(dateOnlyUTC(stage.createdAt), todayMs) >
            APPROVAL_STALLED_DAYS,
      );
      if (approvalStalled) risks.push('Onay süreci tıkalı');

      // Tamamlanma tahmini EXF'den geç
      const forecast = computeCompletionForecast(
        order.productionEntries,
        order.totalQuantity,
        order.shipmentDate,
      );
      if (forecast.hasEnoughData && forecast.willMeetDeadline === false) {
        risks.push('Tamamlanma tahmini gecikmeli');
      }

      if (risks.length > 0) {
        results.push({
          orderId: order.id,
          orderNo: order.orderNo,
          buyerName: order.buyerName,
          productName: order.productName,
          riskScore: risks.length,
          risks,
        });
      }
    }

    return results.sort((a, b) => b.riskScore - a.riskScore);
  }
}
