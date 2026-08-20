import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeCartonBreakdown } from '../common/carton.util';
import { isFabricMaterialType } from '../common/material-type.util';
import type {
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
} from '../orders/dto/work-order.dto';

type CostBreakdown = {
  planned: number | null;
  actual: number | null;
  variance: number | null;
  variancePercent: number | null;
};

function buildCostBreakdown(
  planned: number | null,
  actual: number | null,
): CostBreakdown {
  const variance = planned != null && actual != null ? actual - planned : null;
  const variancePercent =
    variance != null && planned != null && planned !== 0
      ? (variance / planned) * 100
      : null;
  return { planned, actual, variance, variancePercent };
}

@Injectable()
export class WorkOrdersService {
  constructor(private prisma: PrismaService) {}

  private async findOrThrow<T>(
    finder: () => Promise<T | null>,
    notFoundMessage: string,
  ): Promise<T> {
    const result = await finder();
    if (!result) {
      throw new NotFoundException(notFoundMessage);
    }
    return result;
  }

  private findOrderOrThrow(orderId: number, tenantId?: string) {
    return this.findOrThrow(
      () =>
        this.prisma.order.findFirst({
          where: { id: orderId, ...(tenantId ? { tenantId } : {}) },
        }),
      'Sipariş bulunamadı',
    );
  }

  private findWorkOrderOrThrow(id: number, tenantId?: string) {
    return this.findOrThrow(
      () =>
        this.prisma.workOrder.findFirst({
          where: { id, ...(tenantId ? { tenantId } : {}) },
        }),
      'İş emri bulunamadı',
    );
  }

  private async generateWorkOrderNo(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `IE-${year}-`;

    const existing = await this.prisma.workOrder.findMany({
      where: { tenantId, workOrderNo: { startsWith: prefix } },
      select: { workOrderNo: true },
    });

    let maxSeq = 0;
    for (const w of existing) {
      const suffix = w.workOrderNo.slice(prefix.length);
      const num = parseInt(suffix, 10);
      if (!Number.isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }

    const next = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}${next}`;
  }

  private async withProducerName<
    T extends {
      producerType: string;
      productionLineId: number | null;
      subcontractorName: string | null;
    },
  >(workOrder: T): Promise<T & { producerName: string }> {
    if (workOrder.producerType === 'FASON') {
      return {
        ...workOrder,
        producerName: workOrder.subcontractorName ?? 'Bilinmiyor',
      };
    }
    const line = workOrder.productionLineId
      ? await this.prisma.productionLine.findUnique({
          where: { id: workOrder.productionLineId },
        })
      : null;
    return { ...workOrder, producerName: line?.name ?? 'Bilinmiyor' };
  }

  async getWorkOrders(orderId: number, tenantId?: string) {
    await this.findOrderOrThrow(orderId, tenantId);
    const workOrders = await this.prisma.workOrder.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(workOrders.map((wo) => this.withProducerName(wo)));
  }

  async createWorkOrder(
    orderId: number,
    data: CreateWorkOrderDto,
    tenantId: string,
    createdBy?: string,
  ) {
    const order = await this.findOrderOrThrow(orderId, tenantId);

    if (data.producerType === 'INTERNAL' && !data.productionLineId) {
      throw new BadRequestException(
        'Kendi hat seçildiğinde üretim hattı belirtilmelidir.',
      );
    }
    if (data.producerType === 'FASON' && !data.subcontractorName?.trim()) {
      throw new BadRequestException(
        'Fason atölye seçildiğinde atölye adı belirtilmelidir.',
      );
    }

    const workOrderNo = await this.generateWorkOrderNo(order.tenantId);

    const workOrder = await this.prisma.workOrder.create({
      data: {
        orderId,
        workOrderNo,
        producerType: data.producerType,
        productionLineId:
          data.producerType === 'INTERNAL' ? data.productionLineId : null,
        subcontractorName:
          data.producerType === 'FASON' ? data.subcontractorName?.trim() : null,
        plannedQuantity: data.plannedQuantity,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
        laborRatePerDay: data.laborRatePerDay,
        estimatedDays: data.estimatedDays,
        notes: data.notes,
        createdBy,
        tenantId: order.tenantId,
      },
    });

    return this.withProducerName(workOrder);
  }

  async updateWorkOrder(
    id: number,
    data: UpdateWorkOrderDto,
    tenantId?: string,
  ) {
    const existing = await this.findWorkOrderOrThrow(id, tenantId);

    const updateData: Record<string, unknown> = {};
    if (data.producerType !== undefined)
      updateData.producerType = data.producerType;
    if (data.productionLineId !== undefined)
      updateData.productionLineId = data.productionLineId;
    if (data.subcontractorName !== undefined)
      updateData.subcontractorName = data.subcontractorName.trim();
    if (data.plannedQuantity !== undefined)
      updateData.plannedQuantity = data.plannedQuantity;
    if (data.startDate !== undefined)
      updateData.startDate = new Date(data.startDate);
    if (data.targetDate !== undefined)
      updateData.targetDate = new Date(data.targetDate);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.laborRatePerDay !== undefined)
      updateData.laborRatePerDay = data.laborRatePerDay;
    if (data.estimatedDays !== undefined)
      updateData.estimatedDays = data.estimatedDays;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const newProducerType = data.producerType ?? existing.producerType;
    if (
      newProducerType === 'INTERNAL' &&
      updateData.productionLineId === undefined &&
      existing.productionLineId == null
    ) {
      throw new BadRequestException(
        'Kendi hat seçildiğinde üretim hattı belirtilmelidir.',
      );
    }

    const workOrder = await this.prisma.workOrder.update({
      where: { id },
      data: updateData,
    });

    return this.withProducerName(workOrder);
  }

  async deleteWorkOrder(id: number, tenantId?: string) {
    await this.findWorkOrderOrThrow(id, tenantId);

    await this.prisma.$transaction([
      this.prisma.productionEntry.updateMany({
        where: { workOrderId: id },
        data: { workOrderId: null },
      }),
      this.prisma.fasonShipment.updateMany({
        where: { workOrderId: id },
        data: { workOrderId: null },
      }),
      this.prisma.workOrder.delete({ where: { id } }),
    ]);

    return { success: true };
  }

  // Bir malzeme adının siparişteki Material kayıtlarına göre ortalama birim
  // fiyatını döner (fiyatı girilmemiş kayıtlar hesaba katılmaz).
  private buildAvgPriceMap(
    materials: { materialName: string; unitPrice: number | null }[],
  ): Map<string, number> {
    const sums = new Map<string, { total: number; count: number }>();
    for (const m of materials) {
      if (m.unitPrice == null) continue;
      const key = m.materialName.trim().toLocaleLowerCase('tr-TR');
      const entry = sums.get(key) ?? { total: 0, count: 0 };
      entry.total += m.unitPrice;
      entry.count += 1;
      sums.set(key, entry);
    }
    const result = new Map<string, number>();
    for (const [key, { total, count }] of sums) {
      result.set(key, total / count);
    }
    return result;
  }

  // Bir malzeme adının siparişteki Material kayıtlarından eşleşen ilk
  // tedarikçi adını döner (eşleşme yoksa null).
  private buildSupplierMap(
    materials: { materialName: string; supplierName: string }[],
  ): Map<string, string> {
    const result = new Map<string, string>();
    for (const m of materials) {
      const key = m.materialName.trim().toLocaleLowerCase('tr-TR');
      if (!result.has(key)) {
        result.set(key, m.supplierName);
      }
    }
    return result;
  }

  async getWorkOrderDetail(id: number, tenantId?: string) {
    const workOrder = await this.findOrThrow(
      () =>
        this.prisma.workOrder.findFirst({
          where: { id, ...(tenantId ? { tenantId } : {}) },
        }),
      'İş emri bulunamadı',
    );

    const [order, bomItems, colorSizes, materials, productionLine] =
      await Promise.all([
        this.prisma.order.findUniqueOrThrow({
          where: { id: workOrder.orderId },
        }),
        this.prisma.orderBOMItem.findMany({
          where: { orderId: workOrder.orderId },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.orderColorSize.findMany({
          where: { orderId: workOrder.orderId },
          orderBy: [{ color: 'asc' }, { size: 'asc' }],
        }),
        this.prisma.material.findMany({
          where: { orderId: workOrder.orderId },
        }),
        workOrder.productionLineId
          ? this.prisma.productionLine.findUnique({
              where: { id: workOrder.productionLineId },
            })
          : null,
      ]);

    const priceByName = this.buildAvgPriceMap(materials);
    const supplierByName = this.buildSupplierMap(materials);

    const bomLines = bomItems.map((item) => {
      const plannedNeed =
        workOrder.plannedQuantity *
        item.unitConsumption *
        (1 + item.wastagePercent / 100);
      const key = item.materialName.trim().toLocaleLowerCase('tr-TR');
      const unitPrice = priceByName.get(key) ?? null;
      const lineCost = unitPrice != null ? plannedNeed * unitPrice : null;
      const supplierName = supplierByName.get(key) ?? null;
      return {
        id: item.id,
        materialName: item.materialName,
        materialType: item.materialType,
        unit: item.unit,
        unitConsumption: item.unitConsumption,
        wastagePercent: item.wastagePercent,
        plannedNeed,
        unitPrice,
        lineCost,
        supplierName,
      };
    });

    const fabricLines = bomLines.filter((l) =>
      isFabricMaterialType(l.materialType),
    );
    const accessoryLines = bomLines.filter(
      (l) => !isFabricMaterialType(l.materialType),
    );

    const plannedFabricCost = fabricLines.some((l) => l.lineCost != null)
      ? fabricLines.reduce((sum, l) => sum + (l.lineCost ?? 0), 0)
      : null;
    const plannedMaterialCost = accessoryLines.some((l) => l.lineCost != null)
      ? accessoryLines.reduce((sum, l) => sum + (l.lineCost ?? 0), 0)
      : null;
    const plannedLaborCost =
      workOrder.laborRatePerDay != null && workOrder.estimatedDays != null
        ? workOrder.laborRatePerDay * workOrder.estimatedDays
        : null;

    // Gerçekleşen kumaş tüketimi: bu hat + bu siparişe ait, kesim aşamasında
    // otomatik tetiklenen StockMovement kayıtlarından okunur (bkz.
    // consumeFabricFromWarehouse'daki reason formatı). Doğrudan workOrderId
    // ile ilişkilendirilmediği için hat adı + sipariş no üzerinden eşleştirilir.
    let actualFabricQty = 0;
    if (productionLine) {
      const reasonPrefix = `Otomatik kumaş tüketimi - Kesim - Sipariş #${workOrder.orderId} - Hat: ${productionLine.name}`;
      const movements = await this.prisma.stockMovement.findMany({
        where: {
          orderId: workOrder.orderId,
          type: 'CIKIS',
          reason: { equals: reasonPrefix },
        },
      });
      actualFabricQty = movements.reduce((sum, m) => sum + m.quantity, 0);
    }

    const avgFabricPrice = (() => {
      const fabricMaterials = materials.filter((m) =>
        isFabricMaterialType(m.materialType),
      );
      const priced = fabricMaterials.filter((m) => m.unitPrice != null);
      if (priced.length === 0) return null;
      return (
        priced.reduce((sum, m) => sum + (m.unitPrice ?? 0), 0) / priced.length
      );
    })();

    const actualFabricCost =
      avgFabricPrice != null ? actualFabricQty * avgFabricPrice : null;

    // Gerçekleşen malzeme (aksesuar) maliyeti iş emri bazında ayrıştırılamadığı
    // için sipariş genelinde hesaplanır (bkz. dönen `materialCostNote`).
    const actualMaterialCost = materials
      .filter((m) => !isFabricMaterialType(m.materialType))
      .reduce((sum, m) => sum + m.arrivedQuantity * (m.unitPrice ?? 0), 0);

    const productionEntries = await this.prisma.productionEntry.findMany({
      where: { workOrderId: id },
    });
    const distinctDates = new Set(
      productionEntries.map((e) => e.date.toISOString().slice(0, 10)),
    );
    const actualLaborCost =
      workOrder.laborRatePerDay != null
        ? distinctDates.size * workOrder.laborRatePerDay
        : null;

    const producerName =
      workOrder.producerType === 'FASON'
        ? (workOrder.subcontractorName ?? 'Bilinmiyor')
        : (productionLine?.name ?? 'Bilinmiyor');

    const cartonBreakdown = colorSizes.map((cs) => computeCartonBreakdown(cs));
    const cartonGrandTotal = cartonBreakdown.reduce(
      (acc, cs) => ({
        totalQty: acc.totalQty + cs.totalQty,
        fullCartons: acc.fullCartons + (cs.fullCartons ?? 0),
        lottedQty: acc.lottedQty + (cs.lottedQty ?? 0),
        looseQty: acc.looseQty + cs.looseQty,
        totalCartons: acc.totalCartons + (cs.totalCartons ?? 0),
      }),
      {
        totalQty: 0,
        fullCartons: 0,
        lottedQty: 0,
        looseQty: 0,
        totalCartons: 0,
      },
    );

    return {
      ...workOrder,
      producerName,
      order: {
        id: order.id,
        orderNo: order.orderNo,
        buyerName: order.buyerName,
        productName: order.productName,
        shipmentDate: order.shipmentDate,
        createdAt: order.createdAt,
      },
      bomItems: bomLines,
      colorSizes,
      packingList: {
        colorSizes: cartonBreakdown,
        grandTotal: cartonGrandTotal,
        note: `Not: Bu koli dağılımı siparişin tamamına aittir, bu iş emri planlanan adedi ${workOrder.plannedQuantity}/${order.totalQuantity} oranını temsil eder.`,
      },
      costs: {
        fabric: buildCostBreakdown(plannedFabricCost, actualFabricCost),
        material: buildCostBreakdown(plannedMaterialCost, actualMaterialCost),
        labor: buildCostBreakdown(plannedLaborCost, actualLaborCost),
      },
      materialCostNote:
        'Gerçekleşen malzeme maliyeti iş emri bazında ayrıştırılamadığı için sipariş geneli olarak gösterilmiştir.',
    };
  }

  async exportWorkOrderCsv(
    id: number,
    tenantId?: string,
  ): Promise<{ csv: string; workOrderNo: string }> {
    const data = await this.getWorkOrderDetail(id, tenantId);

    const escapeCsvField = (field: string): string => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    const row = (fields: string[]) => fields.map(escapeCsvField).join(',');
    const fmt = (value: number | null) =>
      value == null ? '—' : value.toFixed(2);

    const lines: string[] = [];
    lines.push(row(['İş Emri No', data.workOrderNo]));
    lines.push(row(['Durum', data.status]));
    lines.push(
      row(['Sipariş No', data.order.orderNo, 'Müşteri', data.order.buyerName]),
    );
    lines.push(row(['Ürün', data.order.productName]));
    lines.push(
      row(['EXF Tarihi', data.order.shipmentDate.toISOString().slice(0, 10)]),
    );
    lines.push(
      row([
        'Üretici',
        data.producerType === 'FASON' ? 'Fason Atölye' : 'Kendi Hat',
        data.producerName,
      ]),
    );
    lines.push(row(['Planlanan Adet', String(data.plannedQuantity)]));
    lines.push(
      row([
        'Başlangıç Tarihi',
        data.startDate ? data.startDate.toISOString().slice(0, 10) : '—',
        'Hedef Tarih',
        data.targetDate ? data.targetDate.toISOString().slice(0, 10) : '—',
      ]),
    );
    lines.push('');

    lines.push(
      row([
        'Malzeme Adı',
        'Tip',
        'Birim Tüketim',
        'Birim',
        'Fire %',
        'Planlanan İhtiyaç',
        'Birim Fiyat',
        'Tutar',
      ]),
    );
    for (const item of data.bomItems) {
      lines.push(
        row([
          item.materialName,
          item.materialType,
          String(item.unitConsumption),
          item.unit,
          String(item.wastagePercent),
          item.plannedNeed.toFixed(2),
          fmt(item.unitPrice),
          fmt(item.lineCost),
        ]),
      );
    }
    lines.push('');

    lines.push(row(['Renk', 'Beden', 'Adet', 'Koli Başına Adet']));
    for (const cs of data.colorSizes) {
      lines.push(
        row([
          cs.color,
          cs.size,
          String(cs.quantity),
          cs.unitsPerCarton != null ? String(cs.unitsPerCarton) : '—',
        ]),
      );
    }
    lines.push('');

    lines.push(
      row([
        'Renk',
        'Beden',
        'Toplam Adet',
        'Koli Başına Adet',
        'Tam Koli',
        'Lotlu Adet',
        'Açık Adet',
        'Toplam Koli',
      ]),
    );
    for (const cs of data.packingList.colorSizes) {
      lines.push(
        row([
          cs.color,
          cs.size,
          String(cs.totalQty),
          cs.unitsPerCarton != null ? String(cs.unitsPerCarton) : '—',
          cs.fullCartons != null ? String(cs.fullCartons) : '—',
          cs.lottedQty != null ? String(cs.lottedQty) : '—',
          String(cs.looseQty),
          cs.totalCartons != null ? String(cs.totalCartons) : '—',
        ]),
      );
    }
    lines.push(
      row([
        'TOPLAM',
        '',
        String(data.packingList.grandTotal.totalQty),
        '',
        String(data.packingList.grandTotal.fullCartons),
        String(data.packingList.grandTotal.lottedQty),
        String(data.packingList.grandTotal.looseQty),
        String(data.packingList.grandTotal.totalCartons),
      ]),
    );
    lines.push(row([data.packingList.note]));
    lines.push('');

    lines.push(
      row(['Maliyet Kalemi', 'Planlanan', 'Gerçekleşen', 'Fark', 'Fark %']),
    );
    const costRow = (label: string, c: (typeof data.costs)['fabric']) =>
      row([
        label,
        fmt(c.planned),
        fmt(c.actual),
        fmt(c.variance),
        c.variancePercent != null ? `${c.variancePercent.toFixed(1)}%` : '—',
      ]);
    lines.push(costRow('Kumaş', data.costs.fabric));
    lines.push(costRow('Malzeme', data.costs.material));
    lines.push(costRow('İşçilik', data.costs.labor));

    return {
      csv: '\uFEFF' + lines.join('\r\n'),
      workOrderNo: data.workOrderNo,
    };
  }
}
