import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculateFabricNeed,
  findConsumptionRate,
} from '../knowledge/textile-knowledge';
import type { MaterialModel, OrderModel } from '../../generated/prisma/models';

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

function formatDateTR(d: Date): string {
  return new Date(d).toLocaleDateString('tr-TR');
}

type OrderWithMaterials = OrderModel & { materials: MaterialModel[] };

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

  async getAiAdvice(tenantId?: string): Promise<string> {
    const orders = await this.prisma.order.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { materials: true },
    });

    const alerts = await this.getAlerts(tenantId);

    const { start, end } = todayRangeUTC();
    const todayProductionEntries = await this.prisma.productionEntry.findMany({
      where: {
        date: { gte: start, lt: end },
        ...(tenantId ? { order: { tenantId } } : {}),
      },
    });

    const erpData = {
      orders: orders.map((order) => ({
        orderNo: order.orderNo,
        buyerName: order.buyerName,
        productName: order.productName,
        totalQuantity: order.totalQuantity,
        shipmentDate: order.shipmentDate,
        status: order.status,
        materials: order.materials.map((material) => ({
          materialName: material.materialName,
          materialType: material.materialType,
          supplierName: material.supplierName,
          orderedQuantity: material.orderedQuantity,
          expectedArrival: material.expectedArrival,
          arrivedQuantity: material.arrivedQuantity,
          status: material.status,
        })),
      })),
      alerts: alerts.map((alert) => ({
        severity: alert.severity,
        message: alert.message,
      })),
      todaysProduction: todayProductionEntries.map((entry) => ({
        stage: entry.stage,
        quantity: entry.quantity,
      })),
    };

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        'ANTHROPIC_API_KEY tanımlı değil.',
      );
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system:
        'Sen bir tekstil üretim danışmanısın. Verilen ERP verilerini analiz edip Türkçe olarak kısa ve net öneriler ver.',
      messages: [
        {
          role: 'user',
          content: `Aşağıdaki tekstil üretim ERP verilerini analiz et ve kısa, net öneriler sun:\n\n${JSON.stringify(erpData, null, 2)}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : '';
  }

  async answerQuestion(question: string, tenantId?: string): Promise<string> {
    const q = question.toLocaleLowerCase('tr-TR');
    const order = await this.findOrderFromQuestion(question, tenantId);

    if (q.includes('kumaş') && (q.includes('kaç metre') || q.includes('ne kadar'))) {
      return this.answerFabricQuantity(order);
    }

    if (q.includes('termin') || q.includes('gecikme')) {
      return this.answerTerminStatus(order);
    }

    if (q.includes('durum') || q.includes('ne durumda')) {
      return this.answerProductionStatus(order);
    }

    return 'Bu soruyu şu an anlayamadım. Şunları sorabilirsin: kumaş miktarı, termin durumu, üretim durumu';
  }

  private async findOrderFromQuestion(
    question: string,
    tenantId?: string,
  ): Promise<OrderWithMaterials | null> {
    const numberMatches = question.match(/\d{2,}/g);
    if (!numberMatches) return null;

    for (const num of numberMatches) {
      const order = await this.prisma.order.findFirst({
        where: {
          orderNo: { contains: num },
          ...(tenantId ? { tenantId } : {}),
        },
        include: { materials: true },
      });
      if (order) return order;
    }

    return null;
  }

  private answerFabricQuantity(order: OrderWithMaterials | null): string {
    if (!order) {
      return 'Hangi sipariş için sorduğunuzu anlayamadım. Lütfen sipariş numarasını belirtin (örn: "1040 için kumaş ne kadar gerekir?").';
    }

    const rate = findConsumptionRate(order.productName);
    if (!rate) {
      return `${order.orderNo} siparişindeki "${order.productName}" ürünü için standart sarfiyat oranı bilgi tabanında bulunamadı.`;
    }

    const totalNeed = calculateFabricNeed(order.totalQuantity, rate.avg);

    return `${order.orderNo} siparişi (${order.productName}, ${order.totalQuantity} adet) için tahmini kumaş ihtiyacı ${totalNeed.toFixed(1)} metre. (Sarfiyat oranı: ${rate.min}-${rate.max} m/adet, ortalama ${rate.avg} m/adet + %3 fire dahil.)`;
  }

  private answerTerminStatus(order: OrderWithMaterials | null): string {
    if (!order) {
      return 'Hangi sipariş için sorduğunuzu anlayamadım. Lütfen sipariş numarasını belirtin (örn: "1040 termin durumu nedir?").';
    }

    const exfMs = dateOnlyUTC(order.shipmentDate);
    const delayedMaterials = order.materials.filter(
      (material) =>
        material.expectedArrival &&
        dateOnlyUTC(material.expectedArrival) > exfMs,
    );
    const pendingMaterials = order.materials.filter(
      (material) => material.status === 'PENDING',
    );

    if (delayedMaterials.length === 0 && pendingMaterials.length === 0) {
      return `${order.orderNo} siparişinde termin riski görünmüyor. Tüm malzemeler EXF tarihinden (${formatDateTR(order.shipmentDate)}) önce planlanmış durumda.`;
    }

    const parts: string[] = [];
    for (const material of delayedMaterials) {
      const daysLate = daysBetweenUTC(
        exfMs,
        dateOnlyUTC(material.expectedArrival as Date),
      );
      parts.push(
        `${material.materialName} malzemesi EXF'den ${daysLate} gün geç geliyor (Tedarikçi: ${material.supplierName}).`,
      );
    }
    for (const material of pendingMaterials) {
      const daysUntilExf = daysBetweenUTC(dateOnlyUTC(new Date()), exfMs);
      parts.push(
        `${material.materialName} malzemesi henüz gelmedi, EXF'ye ${daysUntilExf} gün kaldı.`,
      );
    }

    return `${order.orderNo} siparişi (EXF: ${formatDateTR(order.shipmentDate)}) için termin riski var: ${parts.join(' ')}`;
  }

  private async answerProductionStatus(
    order: OrderWithMaterials | null,
  ): Promise<string> {
    if (!order) {
      return 'Hangi sipariş için sorduğunuzu anlayamadım. Lütfen sipariş numarasını belirtin (örn: "1040 ne durumda?").';
    }

    const entries = await this.prisma.productionEntry.findMany({
      where: { orderId: order.id },
    });

    if (entries.length === 0) {
      return `${order.orderNo} siparişi için henüz üretim girişi yapılmamış. Sipariş durumu: ${order.status}.`;
    }

    const totalsByStage = new Map<string, number>();
    for (const entry of entries) {
      totalsByStage.set(
        entry.stage,
        (totalsByStage.get(entry.stage) ?? 0) + entry.quantity,
      );
    }

    const stageSummary = Array.from(totalsByStage.entries())
      .map(([stage, qty]) => `${stage}: ${qty} adet`)
      .join(', ');

    return `${order.orderNo} siparişi (${order.totalQuantity} adet, durum: ${order.status}) üretim özeti — ${stageSummary}.`;
  }
}
