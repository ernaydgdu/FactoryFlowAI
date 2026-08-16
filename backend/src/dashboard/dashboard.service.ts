import { Injectable, InternalServerErrorException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculateFabricEfficiency,
  calculateFabricNeed,
  calculateTopUsage,
  FABRIC_WIDTH_ADVICE,
  findConsumptionRate,
  findProductType,
  formatConsumptionRate,
  GOOD_EFFICIENCY_THRESHOLD,
  recommendCuttingOrderType,
  recommendWarehouseMethod,
  type TeslimSekli,
} from '../knowledge/textile-knowledge';
import { searchKnowledgeLibrary } from '../knowledge/textile-library';
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

function extractNumbers(text: string): number[] {
  const matches = text.match(/\d+(?:[.,]\d+)?/g);
  if (!matches) return [];
  return matches.map((match) => parseFloat(match.replace(',', '.')));
}

type OrderWithMaterials = OrderModel & { materials: MaterialModel[] };

export type DashboardAlertType =
  | 'MATERIAL_DELAY'
  | 'MATERIAL_PENDING'
  | 'NO_PRODUCTION'
  | 'FIRE_RATE_HIGH'
  | 'SECOND_QUALITY_HIGH'
  | 'STOCK_CRITICAL'
  | 'APPROVAL_STALLED';

const APPROVAL_STAGE_LABEL: Record<string, string> = {
  PP_NUMUNE: 'PP Numune',
  PASTAL_ONAY: 'Pastal Onayı',
  SARFIYAT_ONAY: 'Sarfiyat Onayı',
  KESIM_ONAY: 'Kesim Onayı',
};

const APPROVAL_STAGE_ORDER_LIST = [
  'PP_NUMUNE',
  'PASTAL_ONAY',
  'SARFIYAT_ONAY',
  'KESIM_ONAY',
] as const;

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

export type QualitySummary = {
  totalChecked: number;
  totalFirstQuality: number;
  totalSecondQuality: number;
  totalRejected: number;
  secondQualityRate: number;
  rejectionRate: number;
};

export type SupplierPerformance = {
  supplierName: string;
  totalOrders: number;
  onTimeCount: number;
  lateCount: number;
  pendingCount: number;
  avgDelayDays: number;
  reliabilityScore: number;
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
    });
    const stockByMaterial = new Map<
      string,
      { totalReceived: number; totalRemaining: number }
    >();
    for (const lot of stockLots) {
      const entry = stockByMaterial.get(lot.materialName) ?? {
        totalReceived: 0,
        totalRemaining: 0,
      };
      entry.totalReceived += lot.receivedQty;
      entry.totalRemaining += lot.remainingQty;
      stockByMaterial.set(lot.materialName, entry);
    }

    const STOCK_CRITICAL_RATIO = 0.15;
    for (const [
      materialName,
      { totalReceived, totalRemaining },
    ] of stockByMaterial) {
      if (
        totalReceived > 0 &&
        totalRemaining < totalReceived * STOCK_CRITICAL_RATIO
      ) {
        alerts.push({
          id: `stock-critical-${materialName}`,
          type: 'STOCK_CRITICAL',
          severity: 'HIGH',
          message: `🚨 ${materialName} stoku kritik seviyede - sadece ${totalRemaining.toFixed(1)} birim kaldı (başlangıç: ${totalReceived.toFixed(1)})`,
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

    return alerts.sort(
      (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
    );
  }

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

    if (
      q.includes('neler sorabilirim') ||
      q.includes('ne yapabilirsin') ||
      q.includes('yardım')
    ) {
      return this.answerCapabilities();
    }

    if (
      q.includes('sarfiyat') &&
      (q.includes('ne kadar') || q.includes('kaç'))
    ) {
      return this.answerGenericConsumptionRate(question);
    }

    if (
      q.includes('kumaş') &&
      (q.includes('kaç metre') || q.includes('ne kadar'))
    ) {
      const order = await this.findOrderFromQuestion(question, tenantId);
      return this.answerFabricQuantity(order);
    }

    if (
      (q.includes('birim maliyet') || q.includes('maliyet hesapla')) &&
      /\d{2,}/.test(question)
    ) {
      const order = await this.findOrderFromQuestion(question, tenantId);
      return this.answerUnitCost(order);
    }

    if (
      (q.includes('top') && q.includes('pastal')) ||
      q.includes('kaç pastal')
    ) {
      return this.answerTopUsage(question);
    }

    if (
      q.includes('verimlilik') ||
      q.includes('faydalanma') ||
      q.includes('pastal verimi')
    ) {
      return this.answerFabricEfficiency(question);
    }

    if (q.includes('kesim maliyeti') || q.includes('işçilik maliyeti')) {
      return this.answerCuttingCostHelp();
    }

    if (
      q.includes('depo') &&
      (q.includes('fifo') ||
        q.includes('lifo') ||
        (q.includes('hangi') && q.includes('yöntem')))
    ) {
      return this.answerWarehouseMethod(question);
    }

    if (
      q.includes('kesim emri') &&
      (q.includes('nasıl') || q.includes('kaç beden'))
    ) {
      return this.answerCuttingOrderType(question);
    }

    if (q.includes('güvenilir') || q.includes('performans')) {
      return this.answerSupplierPerformance(question, tenantId);
    }

    if (
      /\d{2,}/.test(question) &&
      (q.includes('onay') || q.includes('aşama'))
    ) {
      const order = await this.findOrderFromQuestion(question, tenantId);
      return this.answerOrderApprovalStatus(order);
    }

    if (
      q.includes('kesime hazır') ||
      (q.includes('onay') && (q.includes('bekliyor') || q.includes('bekleyen')))
    ) {
      return this.answerApprovalOverview(question, tenantId);
    }

    if (q.includes('termin') || q.includes('gecikme')) {
      const order = await this.findOrderFromQuestion(question, tenantId);
      return this.answerTerminStatus(order);
    }

    if (q.includes('durum') || q.includes('ne durumda')) {
      const order = await this.findOrderFromQuestion(question, tenantId);
      return this.answerProductionStatus(order);
    }

    const libraryMatch = searchKnowledgeLibrary(question);
    if (libraryMatch) {
      return `📚 ${libraryMatch.card.baslik}\n\n${libraryMatch.card.icerik}`;
    }

    return 'Bu soruyu şu an anlayamadım. Şunları sorabilirsin: kumaş miktarı, termin durumu, üretim durumu. Tüm yeteneklerimi görmek için "neler sorabilirim?" diye sorabilirsiniz.';
  }

  private answerCapabilities(): string {
    return [
      'Şu konularda yardımcı olabilirim:',
      '• Kumaş ihtiyacı hesaplama — örn: "1040 için kumaş ne kadar gerekir?"',
      '• Tahmini hammadde birim maliyeti — örn: "1040 için birim maliyet hesapla"',
      '• Top/pastal hesaplama — örn: "35 metre topdan 5.1 metre pastal ile kaç pastal çıkar?"',
      '• Kumaş verimliliği / pastal verimi — örn: "12 m² şablon, 1.5 en, 10 boy ile verimlilik nedir?"',
      '• Kesim işçilik maliyeti hesaplama — örn: "kesim maliyeti nasıl hesaplanır?"',
      '• Depo yönetimi (FIFO/LIFO) önerisi — örn: "3 renk 4 beden parçalı teslimat, hangi depo yöntemi?"',
      '• Kesim emri türü önerisi — örn: "2 beden 1 renk için nasıl kesim emri açmalıyım?"',
      '• Tedarikçi güvenilirliği — örn: "ÖZEGE güvenilir mi?"',
      '• Sipariş termin durumu — örn: "1040 termin durumu nedir?"',
      '• Sipariş üretim durumu — örn: "1040 ne durumda?"',
      '• Sipariş onay durumu — örn: "1040 onay durumu" veya "1040 hangi aşamada?"',
      '• Onay bekleyen / kesime hazır siparişler — örn: "hangi siparişler onay bekliyor?" veya "kesime hazır siparişler"',
    ].join('\n');
  }

  private async answerApprovalOverview(
    question: string,
    tenantId?: string,
  ): Promise<string> {
    const q = question.toLocaleLowerCase('tr-TR');
    const orders = await this.prisma.order.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { approvalStages: true },
    });

    if (q.includes('kesime hazır')) {
      const ready = orders.filter((order) =>
        order.approvalStages.some(
          (stage) =>
            stage.stageType === 'KESIM_ONAY' && stage.status === 'APPROVED',
        ),
      );
      if (ready.length === 0) {
        return 'Şu an kesime hazır sipariş yok.';
      }
      return `${ready.length} sipariş kesime hazır: ${ready
        .map((order) => `${order.orderNo} (${order.buyerName})`)
        .join(', ')}`;
    }

    const waiting = orders.filter((order) =>
      order.approvalStages.some((stage) => stage.status === 'PENDING'),
    );
    if (waiting.length === 0) {
      return 'Şu an onay bekleyen sipariş yok.';
    }
    return `${waiting.length} sipariş onay bekliyor: ${waiting
      .map((order) => `${order.orderNo} (${order.buyerName})`)
      .join(', ')}`;
  }

  private async answerOrderApprovalStatus(
    order: OrderWithMaterials | null,
  ): Promise<string> {
    if (!order) {
      return 'Hangi sipariş için sorduğunuzu anlayamadım. Lütfen sipariş numarasını belirtin (örn: "1040 onay durumu").';
    }

    const stages = await this.prisma.approvalStage.findMany({
      where: { orderId: order.id },
    });
    if (stages.length === 0) {
      return `${order.orderNo} siparişi için henüz onay süreci başlatılmamış.`;
    }

    const parts = APPROVAL_STAGE_ORDER_LIST.map((stageType) => {
      const stage = stages.find((s) => s.stageType === stageType);
      const label = APPROVAL_STAGE_LABEL[stageType] ?? stageType;
      if (!stage) return `${label} ⏳ (bekliyor)`;
      if (stage.status === 'APPROVED') return `${label} ✅`;
      if (stage.status === 'REJECTED') return `${label} ❌ (reddedildi)`;
      return `${label} ⏳ (bekliyor)`;
    });

    return `${order.orderNo} siparişi: ${parts.join(', ')}`;
  }

  private answerTopUsage(question: string): string {
    const numbers = extractNumbers(question);
    if (numbers.length < 2) {
      return 'Top uzunluğu ve pastal uzunluğunu birlikte belirtir misiniz? Örn: "35 metre topdan 5.1 metre pastal ile kaç pastal çıkar?"';
    }

    const [topBoyu, pastalBoyu] = numbers;
    const result = calculateTopUsage(topBoyu, pastalBoyu);

    return `${topBoyu}m topdan ${pastalBoyu}m'lik pastal ile ${result.pastalAdedi} adet pastal çıkar (${topBoyu}/${pastalBoyu}=${(topBoyu / pastalBoyu).toFixed(2)}, tam sayıya yuvarlanır — kalan kısım kullanılamaz). ${result.kullanılanKumaş.toFixed(1)}m kumaş kullanılır, ${result.kalanMetre.toFixed(1)}m artar.`;
  }

  private answerFabricEfficiency(question: string): string {
    const numbers = extractNumbers(question);
    if (numbers.length < 3) {
      return 'Verimlilik hesaplamak için toplam şablon alanını (m²), kumaş enini (m) ve kumaş boyunu (m) belirtir misiniz? Örn: "12 m² şablon, 1.5 en, 10 boy ile pastal verimi nedir?"';
    }

    const [sablonAlani, kumasEni, kumasBoyu] = numbers;
    const result = calculateFabricEfficiency(sablonAlani, kumasEni, kumasBoyu);
    const widthTip =
      result.verimlilikYuzdesi < GOOD_EFFICIENCY_THRESHOLD
        ? ` İpucu: ${FABRIC_WIDTH_ADVICE}`
        : '';

    return `Pastal verimi %${result.verimlilikYuzdesi.toFixed(1)} (${sablonAlani}m² şablon / (${kumasEni}m × ${kumasBoyu}m kumaş) × 100). Döküntü oranı %${result.dokuntuYuzdesi.toFixed(1)}. ${result.degerlendirme}${widthTip}`;
  }

  private answerCuttingCostHelp(): string {
    return 'Kesim işçilik maliyetini iki yöntemle hesaplayabilirim: 1) Oran yöntemi — serim, pastal hazırlama, kaba/ince kesim ve masa temizleme sürelerini (dk) ve günlük işçilik ücretini paylaşın; toplamSüre/480 × günlükÜcret ile hesaplanır. 2) Formül yöntemi — masa boyu, birim kumaş gideri, kat/beden sayısı, süre bileşenleri ve ek zaman yüzdesini paylaşın; bu yöntem birim başı maliyeti de verir. Hangi yöntemle devam etmek istersiniz?';
  }

  private answerWarehouseMethod(question: string): string {
    const renkMatch = question.match(/(\d+)\s*renk/i);
    const bedenMatch = question.match(/(\d+)\s*beden/i);
    const parcaliTeslimat = /parçalı|parçali|kısmi|kismi/i.test(question);

    if (!renkMatch || !bedenMatch) {
      return 'Depo yöntemi önerebilmem için renk sayısını ve beden sayısını belirtir misiniz (teslimatın parçalı mı, tam mı olduğunu da ekleyin)? Örn: "3 renk 4 beden, parçalı teslimat, hangi depo yöntemini kullanmalıyım?"';
    }

    const renkSayisi = parseInt(renkMatch[1], 10);
    const bedenSayisi = parseInt(bedenMatch[1], 10);
    const teslimSekli: TeslimSekli = parcaliTeslimat ? 'PARCALI' : 'TAM';

    const recommendation = recommendWarehouseMethod(
      renkSayisi,
      bedenSayisi,
      teslimSekli,
    );

    return `${renkSayisi} renk, ${bedenSayisi} beden, ${teslimSekli === 'PARCALI' ? 'parçalı' : 'tam'} teslimat için önerilen yöntem: ${recommendation.yontem}. ${recommendation.aciklama}`;
  }

  private answerCuttingOrderType(question: string): string {
    const renkMatch = question.match(/(\d+)\s*renk/i);
    const bedenMatch = question.match(/(\d+)\s*beden/i);

    if (!bedenMatch) {
      return 'Kesim emri türünü önerebilmem için beden sayısını (ve varsa renk sayısını) belirtir misiniz? Örn: "2 beden 1 renk için nasıl kesim emri açmalıyım?"';
    }

    const bedenSayisi = parseInt(bedenMatch[1], 10);
    const renkSayisi = renkMatch ? parseInt(renkMatch[1], 10) : 1;

    const recommendation = recommendCuttingOrderType(bedenSayisi, renkSayisi);

    return `${bedenSayisi} beden, ${renkSayisi} renk için önerilen kesim emri türü: ${recommendation.tur}. ${recommendation.aciklama}`;
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

    return `${order.orderNo} siparişi (${order.productName}, ${order.totalQuantity} adet) için tahmini kumaş ihtiyacı ${totalNeed.toFixed(1)} metre. (Sarfiyat oranı: ${formatConsumptionRate(rate)} + %3 fire dahil.)`;
  }

  private answerUnitCost(order: OrderWithMaterials | null): string {
    if (!order) {
      return 'Hangi sipariş için birim maliyet hesaplamak istediğinizi anlayamadım. Lütfen sipariş numarasını belirtin (örn: "1040 için birim maliyet hesapla").';
    }

    const rate = findConsumptionRate(order.productName);
    if (!rate) {
      return `${order.orderNo} siparişindeki "${order.productName}" ürünü için standart sarfiyat oranı bilgi tabanında bulunamadı, maliyet hesaplanamadı.`;
    }

    const fabricMaterials = order.materials.filter(
      (material) =>
        material.materialType.toLocaleLowerCase('tr-TR') === 'kumaş' &&
        material.unitPrice != null,
    );

    if (fabricMaterials.length === 0) {
      return `${order.orderNo} siparişi için kumaş fiyatı girilmemiş, tahmini hammadde maliyeti hesaplanamıyor. (Sarfiyat: ${formatConsumptionRate(rate)})`;
    }

    const avgUnitPrice =
      fabricMaterials.reduce(
        (sum, material) => sum + (material.unitPrice ?? 0),
        0,
      ) / fabricMaterials.length;
    const currency = fabricMaterials[0].currency ?? 'USD';
    const fabricCost = order.totalQuantity * rate.avg * avgUnitPrice;

    return `${order.orderNo} siparişi (${order.productName}, ${order.totalQuantity} adet) için tahmini hammadde (kumaş) maliyeti: ${fabricCost.toFixed(2)} ${currency} (${order.totalQuantity} adet × ${rate.avg.toFixed(2)} m/adet sarfiyat × ${avgUnitPrice.toFixed(2)} ${currency} ortalama kumaş fiyatı). Not: Bu sadece hammadde maliyetidir; işçilik ve genel gider dahil değildir.`;
  }

  private answerGenericConsumptionRate(question: string): string {
    const productType = findProductType(question);
    if (!productType) {
      return 'Hangi ürün tipi için sorduğunuzu belirtir misiniz? (tişört, gömlek, pantolon, ceket, elbise, etek)';
    }

    const { label, rate } = productType;
    return `${label} için standart sarfiyat ${formatConsumptionRate(rate)} kullanılır.`;
  }

  private async answerSupplierPerformance(
    question: string,
    tenantId?: string,
  ): Promise<string> {
    const performance = await this.getSupplierPerformance(tenantId);
    if (performance.length === 0) {
      return 'Henüz değerlendirilecek tedarikçi verisi bulunmuyor.';
    }

    const normalizedQuestion = question.toLocaleLowerCase('tr-TR');
    const match = [...performance]
      .sort((a, b) => b.supplierName.length - a.supplierName.length)
      .find((supplier) =>
        normalizedQuestion.includes(
          supplier.supplierName.toLocaleLowerCase('tr-TR'),
        ),
      );

    if (!match) {
      return 'Hangi tedarikçiyi kastettiğinizi anlayamadım. Tedarikçi adını tam olarak belirtir misiniz? (örn: "ÖZEGE güvenilir mi?")';
    }

    const reliabilityLabel =
      match.reliabilityScore >= 80
        ? 'güvenilir'
        : match.reliabilityScore >= 50
          ? 'orta düzeyde güvenilir'
          : 'düşük güvenilirlikte';

    const lateInfo =
      match.lateCount > 0
        ? ` (ortalama ${match.avgDelayDays.toFixed(1)} gün gecikme)`
        : '';

    return `${match.supplierName} tedarikçisi ${reliabilityLabel} (%${match.reliabilityScore.toFixed(1)} güvenilirlik skoru). Toplam ${match.totalOrders} malzeme siparişinden ${match.onTimeCount} tanesi zamanında geldi, ${match.lateCount} tanesi geç geldi${lateInfo}, ${match.pendingCount} tanesi hâlâ bekliyor.`;
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
