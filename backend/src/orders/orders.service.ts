import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import { dateOnlyUTC } from '../dashboard/dashboard-shared';
import {
  calculateFabricNeed,
  findProductType,
} from '../knowledge/textile-knowledge';
import { computeCartonBreakdown } from '../common/carton.util';
import {
  computeCompletionForecast,
  type CompletionForecast,
} from './forecast.util';
import type {
  CloseOrderDto,
  CreateFasonShipmentDto,
  CreateMaterialDto,
  CreateOrderBOMItemDto,
  CreateOrderColorSizeDto,
  CreateOrderDto,
  CreateProductionEntryDto,
  CreateQualityEntryDto,
  UpdateApprovalStageDto,
  UpdateFasonShipmentDto,
  UpdateMaterialDto,
  UpdateOrderBOMItemDto,
  UpdateOrderDto,
} from './dto/order.dto';

const ORDER_STATUS_LABEL: Record<string, string> = {
  PLANNING: 'Beklemede',
  IN_PRODUCTION: 'Üretimde',
  COMPLETED: 'Tamamlandı',
  SHIPPED: 'Sevk Edildi',
};

const APPROVAL_STAGE_ORDER = [
  'PP_NUMUNE',
  'PASTAL_ONAY',
  'SARFIYAT_ONAY',
  'KESIM_ONAY',
] as const;

const PRODUCTION_STAGE_KEYS = [
  'CUTTING',
  'SEWING',
  'IRONING',
  'PACKING',
  'SHIPPING',
] as const;

const APPROVAL_STAGE_LABEL: Record<string, string> = {
  PP_NUMUNE: 'PP Numune Onayı',
  PASTAL_ONAY: 'Pastal Onayı',
  SARFIYAT_ONAY: 'Sarfiyat Onayı',
  KESIM_ONAY: 'Kesim Onayı',
};

export type OrderAiSuggestion = {
  productType: string | null;
  estimatedNeed: number | null;
  warning: string | null;
  ok: boolean;
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // Bir kaydı bulan sorguyu (thunk olarak) çalıştırır; sonuç null ise 404 fırlatır.
  // "bul-yoksa-404" kalıbının tek kopyası — her çağıran kendi Prisma sorgusunu
  // (model, where, include) sağlar, bu metod sadece null-kontrolünü merkezileştirir.
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

  async getOrders(tenantId?: string) {
    const orders = await this.prisma.order.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: {
        materials: true,
        colorSizes: true,
        approvalStages: true,
        bomItems: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => {
      const suggestion = this.computeAiSuggestion(order);
      const colorCount = new Set(order.colorSizes.map((cs) => cs.color)).size;
      const colorSizeTotal = order.colorSizes.reduce(
        (sum, cs) => sum + cs.quantity,
        0,
      );
      const cuttingReady = order.approvalStages.some(
        (stage) =>
          stage.stageType === 'KESIM_ONAY' && stage.status === 'APPROVED',
      );
      return {
        ...order,
        productType: suggestion.productType,
        materialWarning: suggestion.warning !== null,
        colorCount,
        colorSizeTotal,
        cuttingReady,
      };
    });
  }

  async exportOrdersCsv(tenantId?: string): Promise<string> {
    const orders = await this.prisma.order.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { materials: true, approvalStages: true },
      orderBy: { createdAt: 'desc' },
    });

    const header = [
      'Sipariş No',
      'Müşteri',
      'Ürün',
      'Toplam Miktar',
      'EXF Tarihi',
      'Durum',
      'Termin Riski',
      'Kesime Hazır mı',
      'Oluşturulma Tarihi',
    ];

    const rows = orders.map((order) => {
      const shipmentMs = dateOnlyUTC(order.shipmentDate);
      const terminRisk = order.materials.some(
        (m) =>
          m.expectedArrival != null &&
          dateOnlyUTC(m.expectedArrival) > shipmentMs,
      );
      const cuttingReady = order.approvalStages.some(
        (stage) =>
          stage.stageType === 'KESIM_ONAY' && stage.status === 'APPROVED',
      );

      return [
        order.orderNo,
        order.buyerName,
        order.productName,
        String(order.totalQuantity),
        order.shipmentDate.toISOString().slice(0, 10),
        ORDER_STATUS_LABEL[order.status] ?? order.status,
        terminRisk ? 'Evet' : 'Hayır',
        cuttingReady ? 'Evet' : 'Hayır',
        order.createdAt.toISOString().slice(0, 10),
      ];
    });

    const escapeCsvField = (field: string): string => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    const lines = [header, ...rows].map((row) =>
      row.map(escapeCsvField).join(','),
    );

    // UTF-8 BOM — Excel'in Türkçe karakterleri (ş, ğ, ı vb.) doğru göstermesi için gerekli.
    return '\uFEFF' + lines.join('\r\n');
  }

  async createOrder(data: CreateOrderDto, tenantId: string) {
    try {
      return await this.prisma.order.create({
        data: {
          orderNo: data.orderNo.trim(),
          buyerName: data.buyerName.trim(),
          productName: data.productName.trim(),
          totalQuantity: data.totalQuantity,
          shipmentDate: new Date(data.shipmentDate),
          status: data.status ?? 'PLANNING',
          tenantId,
        },
      });
    } catch {
      throw new ConflictException('Bu sipariş numarası zaten kayıtlı.');
    }
  }

  async updateOrder(orderId: number, data: UpdateOrderDto, tenantId?: string) {
    await this.findOrderOrThrow(orderId, tenantId);

    const updateData: Record<string, unknown> = {};
    if (data.orderNo !== undefined) updateData.orderNo = data.orderNo.trim();
    if (data.buyerName !== undefined)
      updateData.buyerName = data.buyerName.trim();
    if (data.productName !== undefined)
      updateData.productName = data.productName.trim();
    if (data.totalQuantity !== undefined)
      updateData.totalQuantity = data.totalQuantity;
    if (data.shipmentDate !== undefined)
      updateData.shipmentDate = new Date(data.shipmentDate);
    if (data.status !== undefined) updateData.status = data.status;

    try {
      return await this.prisma.order.update({
        where: { id: orderId },
        data: updateData,
      });
    } catch {
      throw new ConflictException('Bu sipariş numarası zaten kayıtlı.');
    }
  }

  async getOrderById(orderId: number, tenantId?: string) {
    return this.findOrThrow(
      () =>
        this.prisma.order.findFirst({
          where: { id: orderId, ...(tenantId ? { tenantId } : {}) },
          include: { materials: true, colorSizes: true },
        }),
      'Sipariş bulunamadı',
    );
  }

  async deleteOrder(orderId: number, tenantId?: string) {
    await this.findOrderOrThrow(orderId, tenantId);

    await this.prisma.$transaction([
      this.prisma.material.deleteMany({ where: { orderId } }),
      this.prisma.productionEntry.deleteMany({ where: { orderId } }),
      this.prisma.qualityEntry.deleteMany({ where: { orderId } }),
      this.prisma.orderColorSize.deleteMany({ where: { orderId } }),
      this.prisma.approvalStage.deleteMany({ where: { orderId } }),
      this.prisma.stockLot.updateMany({
        where: { orderId },
        data: { orderId: null },
      }),
      this.prisma.order.delete({ where: { id: orderId } }),
    ]);

    return { success: true };
  }

  async getAiSuggestion(
    orderId: number,
    tenantId?: string,
  ): Promise<OrderAiSuggestion> {
    const order = await this.findOrThrow(
      () =>
        this.prisma.order.findFirst({
          where: { id: orderId, ...(tenantId ? { tenantId } : {}) },
          include: { materials: true, bomItems: true },
        }),
      'Sipariş bulunamadı',
    );

    return this.computeAiSuggestion(order);
  }

  computeAiSuggestion(order: {
    productName: string;
    totalQuantity: number;
    materials: { materialType: string; orderedQuantity: number }[];
    bomItems?: {
      materialType: string;
      unitConsumption: number;
      wastagePercent: number;
    }[];
  }): OrderAiSuggestion {
    const fabricBomItems = (order.bomItems ?? []).filter(
      (item) => item.materialType.toLocaleLowerCase('tr-TR') === 'kumas',
    );

    const match = findProductType(order.productName);
    const usingBom = fabricBomItems.length > 0;

    if (!usingBom && !match) {
      return {
        productType: null,
        estimatedNeed: null,
        warning: null,
        ok: true,
      };
    }

    const productType = match?.label ?? null;

    const estimatedNeed = usingBom
      ? fabricBomItems.reduce(
          (sum, item) =>
            sum +
            order.totalQuantity *
              item.unitConsumption *
              (1 + item.wastagePercent / 100),
          0,
        )
      : calculateFabricNeed(order.totalQuantity, match!.rate.avg);

    const bomSuffix = usingBom ? ' (BOM verisine göre)' : '';

    const fabricMaterials = order.materials.filter(
      (material) =>
        material.materialType.toLocaleLowerCase('tr-TR') === 'kumaş',
    );

    if (fabricMaterials.length === 0) {
      return {
        productType,
        estimatedNeed,
        warning: `Bu sipariş için henüz kumaş girilmemiş, tahmini ihtiyaç: ${estimatedNeed.toFixed(1)} metre${bomSuffix}`,
        ok: false,
      };
    }

    const totalOrderedFabric = fabricMaterials.reduce(
      (sum, material) => sum + material.orderedQuantity,
      0,
    );

    if (totalOrderedFabric < estimatedNeed) {
      return {
        productType,
        estimatedNeed,
        warning: `Girilen kumaş miktarı (${totalOrderedFabric.toFixed(1)} m) tahmini ihtiyacın (${estimatedNeed.toFixed(1)} m) altında, eksik olabilir${bomSuffix}`,
        ok: false,
      };
    }

    return { productType, estimatedNeed, warning: null, ok: true };
  }

  async getMaterials(orderId: number, tenantId?: string) {
    await this.findOrderOrThrow(orderId, tenantId);
    const materials = await this.prisma.material.findMany({
      where: { orderId },
      include: { stockLot: true },
      orderBy: { createdAt: 'asc' },
    });

    return materials.map(({ stockLot, ...material }) => ({
      ...material,
      stockLotId: stockLot?.id ?? null,
      hasStockLot: stockLot != null,
    }));
  }

  async addMaterial(
    orderId: number,
    data: CreateMaterialDto,
    tenantId?: string,
  ) {
    await this.findOrderOrThrow(orderId, tenantId);

    const material = await this.prisma.material.create({
      data: {
        orderId,
        materialName: data.materialName.trim(),
        materialType: data.materialType.trim(),
        supplierName: data.supplierName.trim(),
        orderedQuantity: data.orderedQuantity,
        orderedDate: data.orderedDate ? new Date(data.orderedDate) : undefined,
        expectedArrival: data.expectedArrival
          ? new Date(data.expectedArrival)
          : undefined,
        status: data.status ?? 'PENDING',
        fabricWidth: data.fabricWidth,
        fabricWeight: data.fabricWeight,
        unitPrice: data.unitPrice,
        currency: data.currency ?? 'USD',
        notes: data.notes,
      },
    });

    return { ...material, stockLotId: null, hasStockLot: false };
  }

  async updateMaterial(
    orderId: number,
    materialId: number,
    data: UpdateMaterialDto,
    tenantId?: string,
  ) {
    const existingMaterial = await this.findOrThrow(
      () =>
        this.prisma.material.findFirst({
          where: {
            id: materialId,
            orderId,
            ...(tenantId ? { order: { tenantId } } : {}),
          },
          include: { stockLot: true },
        }),
      'Malzeme bulunamadı',
    );

    const updateData: Record<string, unknown> = {};
    if (data.materialName !== undefined)
      updateData.materialName = data.materialName.trim();
    if (data.supplierName !== undefined)
      updateData.supplierName = data.supplierName.trim();
    if (data.orderedQuantity !== undefined)
      updateData.orderedQuantity = data.orderedQuantity;
    if (data.expectedArrival !== undefined)
      updateData.expectedArrival = new Date(data.expectedArrival);
    if (data.fabricWidth !== undefined)
      updateData.fabricWidth = data.fabricWidth;
    if (data.fabricWeight !== undefined)
      updateData.fabricWeight = data.fabricWeight;
    if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.status) updateData.status = data.status;
    if (data.arrivedQuantity !== undefined)
      updateData.arrivedQuantity = data.arrivedQuantity;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const newStatus = data.status ?? existingMaterial.status;
    const newArrivedQuantity =
      data.arrivedQuantity ?? existingMaterial.arrivedQuantity;

    const shouldSyncStockLot =
      (newStatus === 'ARRIVED' || newStatus === 'PARTIAL') &&
      newArrivedQuantity > 0;

    return this.prisma.$transaction(async (tx) => {
      const material = await tx.material.update({
        where: { id: materialId },
        data: updateData,
      });

      let stockLotId = existingMaterial.stockLot?.id ?? null;

      if (shouldSyncStockLot) {
        if (!existingMaterial.stockLot) {
          const createdLot = await tx.stockLot.create({
            data: {
              materialName: material.materialName,
              materialType: material.materialType,
              supplierName: material.supplierName,
              unitPrice: material.unitPrice,
              currency: material.currency ?? 'USD',
              receivedQty: newArrivedQuantity,
              remainingQty: newArrivedQuantity,
              receivedDate: new Date(),
              orderId: material.orderId,
              materialId: material.id,
            },
          });
          stockLotId = createdLot.id;
        } else if (newArrivedQuantity !== existingMaterial.arrivedQuantity) {
          const delta = newArrivedQuantity - existingMaterial.arrivedQuantity;
          const updatedRemaining = Math.max(
            0,
            existingMaterial.stockLot.remainingQty + delta,
          );
          await tx.stockLot.update({
            where: { id: existingMaterial.stockLot.id },
            data: {
              receivedQty: newArrivedQuantity,
              remainingQty: updatedRemaining,
            },
          });
        }
      }

      return { ...material, stockLotId, hasStockLot: stockLotId != null };
    });
  }

  async getMaterialStockAvailability(
    orderId: number,
    materialId: number,
    tenantId?: string,
  ) {
    const material = await this.findOrThrow(
      () =>
        this.prisma.material.findFirst({
          where: {
            id: materialId,
            orderId,
            ...(tenantId ? { order: { tenantId } } : {}),
          },
        }),
      'Malzeme bulunamadı',
    );

    const lots = await this.prisma.stockLot.findMany({
      where: {
        materialName: { equals: material.materialName, mode: 'insensitive' },
        remainingQty: { gt: 0 },
      },
      orderBy: { receivedDate: 'asc' },
    });

    const availableQty = lots.reduce((sum, lot) => sum + lot.remainingQty, 0);

    return {
      availableQty,
      lots: lots.map((lot) => ({
        lotId: lot.id,
        lotNo: lot.lotNo,
        remainingQty: lot.remainingQty,
        receivedDate: lot.receivedDate,
      })),
    };
  }

  async fulfillMaterialFromStock(
    orderId: number,
    materialId: number,
    quantity: number,
    tenantId?: string,
    performedBy?: string,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Miktar sıfırdan büyük olmalı.');
    }

    const material = await this.findOrThrow(
      () =>
        this.prisma.material.findFirst({
          where: {
            id: materialId,
            orderId,
            ...(tenantId ? { order: { tenantId } } : {}),
          },
        }),
      'Malzeme bulunamadı',
    );

    return this.prisma.$transaction(async (tx) => {
      const lots = await tx.stockLot.findMany({
        where: {
          materialName: {
            equals: material.materialName,
            mode: 'insensitive',
          },
          remainingQty: { gt: 0 },
        },
        orderBy: { receivedDate: 'asc' },
      });

      const totalAvailable = lots.reduce(
        (sum, lot) => sum + lot.remainingQty,
        0,
      );
      if (quantity > totalAvailable) {
        throw new BadRequestException(
          `Stokta yeterli miktar yok, mevcut: ${totalAvailable}`,
        );
      }

      let remaining = quantity;
      for (const lot of lots) {
        if (remaining <= 0) break;

        const useQty = Math.min(lot.remainingQty, remaining);
        await tx.stockLot.update({
          where: { id: lot.id },
          data: { remainingQty: lot.remainingQty - useQty },
        });
        await tx.stockMovement.create({
          data: {
            stockLotId: lot.id,
            type: 'CIKIS',
            quantity: useQty,
            reason: `Sipariş #${orderId} malzeme ihtiyacı için stoktan karşılandı`,
            orderId,
            performedBy,
          },
        });
        remaining -= useQty;
      }

      const newArrivedQuantity = material.arrivedQuantity + quantity;
      const newStatus =
        newArrivedQuantity >= material.orderedQuantity ? 'ARRIVED' : 'PARTIAL';

      return tx.material.update({
        where: { id: materialId },
        data: {
          arrivedQuantity: newArrivedQuantity,
          status: newStatus,
        },
      });
    });
  }

  async deleteMaterial(orderId: number, materialId: number, tenantId?: string) {
    await this.findOrThrow(
      () =>
        this.prisma.material.findFirst({
          where: {
            id: materialId,
            orderId,
            ...(tenantId ? { order: { tenantId } } : {}),
          },
        }),
      'Malzeme bulunamadı',
    );
    await this.prisma.material.delete({ where: { id: materialId } });
    return { success: true };
  }

  async getFasonShipments(orderId: number, tenantId?: string) {
    await this.findOrderOrThrow(orderId, tenantId);
    const shipments = await this.prisma.fasonShipment.findMany({
      where: { orderId },
      orderBy: { sentDate: 'desc' },
    });

    return shipments.map((shipment) => this.withFasonFireStats(shipment));
  }

  private withFasonFireStats(shipment: {
    sentQuantity: number;
    receivedQuantity: number | null;
  }) {
    const fireQuantity =
      shipment.receivedQuantity != null
        ? Math.max(0, shipment.sentQuantity - shipment.receivedQuantity)
        : null;
    const fireRate =
      fireQuantity != null && shipment.sentQuantity > 0
        ? (fireQuantity / shipment.sentQuantity) * 100
        : null;

    return { ...shipment, fireQuantity, fireRate };
  }

  async addFasonShipment(
    orderId: number,
    data: CreateFasonShipmentDto,
    tenantId?: string,
  ) {
    const order = await this.findOrderOrThrow(orderId, tenantId);

    const shipment = await this.prisma.fasonShipment.create({
      data: {
        orderId,
        subcontractorName: data.subcontractorName.trim(),
        operationType: data.operationType,
        sentQuantity: data.sentQuantity,
        expectedReturnDate: data.expectedReturnDate
          ? new Date(data.expectedReturnDate)
          : undefined,
        unitCost: data.unitCost,
        currency: data.currency ?? 'TRY',
        notes: data.notes,
        tenantId: order.tenantId,
      },
    });

    return this.withFasonFireStats(shipment);
  }

  async updateFasonShipment(
    orderId: number,
    fasonId: number,
    data: UpdateFasonShipmentDto,
    tenantId?: string,
  ) {
    const existing = await this.findOrThrow(
      () =>
        this.prisma.fasonShipment.findFirst({
          where: {
            id: fasonId,
            orderId,
            ...(tenantId ? { tenantId } : {}),
          },
        }),
      'Fason gönderimi bulunamadı',
    );

    const updateData: Record<string, unknown> = {};
    if (data.subcontractorName !== undefined)
      updateData.subcontractorName = data.subcontractorName.trim();
    if (data.operationType !== undefined)
      updateData.operationType = data.operationType;
    if (data.expectedReturnDate !== undefined)
      updateData.expectedReturnDate = new Date(data.expectedReturnDate);
    if (data.unitCost !== undefined) updateData.unitCost = data.unitCost;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.receivedDate !== undefined)
      updateData.receivedDate = new Date(data.receivedDate);
    if (data.receivedQuantity !== undefined)
      updateData.receivedQuantity = data.receivedQuantity;

    const newReceivedQuantity =
      data.receivedQuantity !== undefined
        ? data.receivedQuantity
        : existing.receivedQuantity;

    if (newReceivedQuantity == null) {
      updateData.status = 'GONDERILDI';
    } else if (newReceivedQuantity < existing.sentQuantity) {
      updateData.status = 'KISMEN_DONDU';
    } else {
      updateData.status = 'TAMAMLANDI';
    }

    const shipment = await this.prisma.fasonShipment.update({
      where: { id: fasonId },
      data: updateData,
    });

    return this.withFasonFireStats(shipment);
  }

  async deleteFasonShipment(
    orderId: number,
    fasonId: number,
    tenantId?: string,
  ) {
    await this.findOrThrow(
      () =>
        this.prisma.fasonShipment.findFirst({
          where: {
            id: fasonId,
            orderId,
            ...(tenantId ? { tenantId } : {}),
          },
        }),
      'Fason gönderimi bulunamadı',
    );
    await this.prisma.fasonShipment.delete({ where: { id: fasonId } });
    return { success: true };
  }

  async getBOMItems(orderId: number, tenantId?: string) {
    const order = await this.findOrderOrThrow(orderId, tenantId);
    const items = await this.prisma.orderBOMItem.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });

    return items.map((item) =>
      this.withBOMTotalNeed(item, order.totalQuantity),
    );
  }

  private withBOMTotalNeed(
    item: { unitConsumption: number; wastagePercent: number },
    orderQuantity: number,
  ) {
    const totalNeed =
      orderQuantity * item.unitConsumption * (1 + item.wastagePercent / 100);
    return { ...item, totalNeed };
  }

  async addBOMItem(
    orderId: number,
    data: CreateOrderBOMItemDto,
    tenantId?: string,
  ) {
    const order = await this.findOrderOrThrow(orderId, tenantId);

    const item = await this.prisma.orderBOMItem.create({
      data: {
        orderId,
        materialName: data.materialName.trim(),
        materialType: data.materialType,
        unitConsumption: data.unitConsumption,
        unit: data.unit,
        wastagePercent: data.wastagePercent ?? 3,
        notes: data.notes,
        tenantId: order.tenantId,
      },
    });

    return this.withBOMTotalNeed(item, order.totalQuantity);
  }

  async updateBOMItem(
    orderId: number,
    itemId: number,
    data: UpdateOrderBOMItemDto,
    tenantId?: string,
  ) {
    const order = await this.findOrderOrThrow(orderId, tenantId);
    await this.findOrThrow(
      () =>
        this.prisma.orderBOMItem.findFirst({
          where: {
            id: itemId,
            orderId,
            ...(tenantId ? { tenantId } : {}),
          },
        }),
      'Ürün ağacı bileşeni bulunamadı',
    );

    const updateData: Record<string, unknown> = {};
    if (data.materialName !== undefined)
      updateData.materialName = data.materialName.trim();
    if (data.materialType !== undefined)
      updateData.materialType = data.materialType;
    if (data.unitConsumption !== undefined)
      updateData.unitConsumption = data.unitConsumption;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.wastagePercent !== undefined)
      updateData.wastagePercent = data.wastagePercent;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const item = await this.prisma.orderBOMItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return this.withBOMTotalNeed(item, order.totalQuantity);
  }

  async deleteBOMItem(orderId: number, itemId: number, tenantId?: string) {
    await this.findOrThrow(
      () =>
        this.prisma.orderBOMItem.findFirst({
          where: {
            id: itemId,
            orderId,
            ...(tenantId ? { tenantId } : {}),
          },
        }),
      'Ürün ağacı bileşeni bulunamadı',
    );
    await this.prisma.orderBOMItem.delete({ where: { id: itemId } });
    return { success: true };
  }

  async getProductionEntries(orderId: number, tenantId?: string) {
    await this.findOrderOrThrow(orderId, tenantId);
    return this.prisma.productionEntry.findMany({
      where: { orderId },
      orderBy: { date: 'asc' },
    });
  }

  async addProductionEntry(
    orderId: number,
    data: CreateProductionEntryDto,
    tenantId?: string,
    performedBy?: string,
  ) {
    const order = await this.findOrThrow(
      () =>
        this.prisma.order.findFirst({
          where: { id: orderId, ...(tenantId ? { tenantId } : {}) },
        }),
      'Sipariş bulunamadı',
    );

    const stage = data.stage.trim();

    return this.prisma.$transaction(async (tx) => {
      let fabricConsumption: {
        consumedQty: number;
        warehouseName: string;
        success: boolean;
      } | null = null;
      let notes = data.notes;

      if (stage === 'CUTTING' && data.lineNo) {
        const match = findProductType(order.productName);
        if (match) {
          const consumedQty = calculateFabricNeed(
            data.quantity,
            match.rate.avg,
          );

          const line = await tx.productionLine.findFirst({
            where: { name: data.lineNo },
          });
          const warehouse = line
            ? await tx.warehouse.findFirst({
                where: { lineId: line.id, type: 'ATOLYE_HAMMADDE' },
              })
            : null;

          if (warehouse) {
            fabricConsumption = await this.consumeFabricFromWarehouse(
              tx,
              orderId,
              data.lineNo,
              warehouse.id,
              warehouse.name,
              consumedQty,
              performedBy,
            );
            if (!fabricConsumption.success) {
              const warning =
                '⚠️ Otomatik kumaş erimesi başarısız - depoda yeterli stok yok';
              notes = notes ? `${notes} ${warning}` : warning;
            }
          }
        }
      }

      let finishedGoodsEntry: {
        addedQty: number;
        warehouseName: string;
      } | null = null;

      if (stage === 'PACKING') {
        const productWarehouse = await tx.warehouse.findFirst({
          where: { type: 'URUN' },
        });

        if (productWarehouse) {
          const existingLot = await tx.stockLot.findFirst({
            where: { orderId, warehouseId: productWarehouse.id },
          });

          let lotId: number;
          if (existingLot) {
            const updatedLot = await tx.stockLot.update({
              where: { id: existingLot.id },
              data: {
                receivedQty: existingLot.receivedQty + data.quantity,
                remainingQty: existingLot.remainingQty + data.quantity,
              },
            });
            lotId = updatedLot.id;
          } else {
            const createdLot = await tx.stockLot.create({
              data: {
                materialName: `${order.orderNo} - ${order.productName}`,
                materialType: 'URUN',
                supplierName: 'Üretim',
                warehouseId: productWarehouse.id,
                orderId,
                receivedQty: data.quantity,
                remainingQty: data.quantity,
                receivedDate: new Date(),
              },
            });
            lotId = createdLot.id;
          }

          await tx.stockMovement.create({
            data: {
              stockLotId: lotId,
              type: 'GIRIS',
              quantity: data.quantity,
              reason: `Paketleme - Sipariş #${orderId}'ten mamul girişi`,
              orderId,
              performedBy,
            },
          });

          finishedGoodsEntry = {
            addedQty: data.quantity,
            warehouseName: productWarehouse.name,
          };
        }
      }

      let shipmentEntry: {
        deductedQty: number;
        warehouseName: string;
        remainingAfterShipment: number;
      } | null = null;

      if (stage === 'SHIPPING') {
        const productWarehouse = await tx.warehouse.findFirst({
          where: { type: 'URUN' },
        });
        const lot = productWarehouse
          ? await tx.stockLot.findFirst({
              where: { orderId, warehouseId: productWarehouse.id },
            })
          : null;

        if (!productWarehouse || !lot) {
          const warning =
            "⚠️ Sevkiyat kaydedildi ama Ürün Deposu'nda bu siparişe ait mamul bulunamadı - önce paketleme girişi yapılmalı";
          notes = notes ? `${notes} ${warning}` : warning;
        } else {
          const deductedQty = Math.min(data.quantity, lot.remainingQty);
          const updatedLot = await tx.stockLot.update({
            where: { id: lot.id },
            data: { remainingQty: lot.remainingQty - deductedQty },
          });

          await tx.stockMovement.create({
            data: {
              stockLotId: lot.id,
              type: 'CIKIS',
              quantity: deductedQty,
              reason: `Sevkiyat - Sipariş #${orderId} müşteriye gönderildi`,
              orderId,
              performedBy,
            },
          });

          if (deductedQty < data.quantity) {
            const warning = `⚠️ Depoda yeterli mamul yoktu, sadece ${deductedQty} adet düşüldü`;
            notes = notes ? `${notes} ${warning}` : warning;
          }

          shipmentEntry = {
            deductedQty,
            warehouseName: productWarehouse.name,
            remainingAfterShipment: updatedLot.remainingQty,
          };
        }
      }

      const entry = await tx.productionEntry.create({
        data: {
          orderId,
          stage,
          quantity: data.quantity,
          date: data.date ? new Date(data.date) : undefined,
          lineNo: data.lineNo,
          notes,
        },
      });

      return { ...entry, fabricConsumption, finishedGoodsEntry, shipmentEntry };
    });
  }

  private async consumeFabricFromWarehouse(
    tx: Prisma.TransactionClient,
    orderId: number,
    lineNo: string,
    warehouseId: number,
    warehouseName: string,
    neededQty: number,
    performedBy?: string,
  ): Promise<{ consumedQty: number; warehouseName: string; success: boolean }> {
    const lots = await tx.stockLot.findMany({
      where: { warehouseId, remainingQty: { gt: 0 } },
      orderBy: { receivedDate: 'asc' },
    });

    const totalAvailable = lots.reduce((sum, lot) => sum + lot.remainingQty, 0);
    if (totalAvailable < neededQty) {
      return { consumedQty: 0, warehouseName, success: false };
    }

    let remaining = neededQty;
    for (const lot of lots) {
      if (remaining <= 0) break;

      const useQty = Math.min(lot.remainingQty, remaining);
      await tx.stockLot.update({
        where: { id: lot.id },
        data: { remainingQty: lot.remainingQty - useQty },
      });
      await tx.stockMovement.create({
        data: {
          stockLotId: lot.id,
          type: 'CIKIS',
          quantity: useQty,
          reason: `Otomatik kumaş tüketimi - Kesim - Sipariş #${orderId} - Hat: ${lineNo}`,
          orderId,
          performedBy,
        },
      });
      remaining -= useQty;
    }

    return { consumedQty: neededQty, warehouseName, success: true };
  }

  async deleteProductionEntry(
    orderId: number,
    entryId: number,
    tenantId?: string,
  ) {
    await this.findOrThrow(
      () =>
        this.prisma.productionEntry.findFirst({
          where: {
            id: entryId,
            orderId,
            ...(tenantId ? { order: { tenantId } } : {}),
          },
        }),
      'Üretim girişi bulunamadı',
    );
    await this.prisma.productionEntry.delete({ where: { id: entryId } });
    return { success: true };
  }

  async getCompletionForecast(
    orderId: number,
    tenantId?: string,
  ): Promise<CompletionForecast> {
    const order = await this.findOrderOrThrow(orderId, tenantId);
    const entries = await this.prisma.productionEntry.findMany({
      where: { orderId },
    });

    return computeCompletionForecast(
      entries,
      order.totalQuantity,
      order.shipmentDate,
    );
  }

  async getQualityEntries(orderId: number, tenantId?: string) {
    await this.findOrderOrThrow(orderId, tenantId);
    return this.prisma.qualityEntry.findMany({
      where: { orderId },
      orderBy: { date: 'asc' },
    });
  }

  async addQualityEntry(
    orderId: number,
    data: CreateQualityEntryDto,
    tenantId?: string,
  ) {
    await this.findOrderOrThrow(orderId, tenantId);

    if (
      data.firstQuality + data.secondQuality + data.rejected !==
      data.checkedQty
    ) {
      throw new BadRequestException(
        '1. kalite + 2. kalite + ret toplamı kontrol edilen adede eşit olmalı.',
      );
    }

    return this.prisma.qualityEntry.create({
      data: {
        orderId,
        checkedQty: data.checkedQty,
        firstQuality: data.firstQuality,
        secondQuality: data.secondQuality,
        rejected: data.rejected,
        defectType: data.defectType,
        date: data.date ? new Date(data.date) : undefined,
        notes: data.notes,
      },
    });
  }

  async deleteQualityEntry(
    orderId: number,
    entryId: number,
    tenantId?: string,
  ) {
    await this.findOrThrow(
      () =>
        this.prisma.qualityEntry.findFirst({
          where: {
            id: entryId,
            orderId,
            ...(tenantId ? { order: { tenantId } } : {}),
          },
        }),
      'Kalite girişi bulunamadı',
    );
    await this.prisma.qualityEntry.delete({ where: { id: entryId } });
    return { success: true };
  }

  async getColorSizes(orderId: number, tenantId?: string) {
    await this.findOrderOrThrow(orderId, tenantId);
    return this.prisma.orderColorSize.findMany({
      where: { orderId },
      orderBy: [{ color: 'asc' }, { size: 'asc' }],
    });
  }

  async upsertColorSize(
    orderId: number,
    data: CreateOrderColorSizeDto,
    tenantId?: string,
  ) {
    await this.findOrderOrThrow(orderId, tenantId);

    const color = data.color.trim();
    const size = data.size.trim();

    return this.prisma.orderColorSize.upsert({
      where: { orderId_color_size: { orderId, color, size } },
      create: {
        orderId,
        color,
        size,
        quantity: data.quantity,
        unitsPerCarton: data.unitsPerCarton,
      },
      update: {
        quantity: data.quantity,
        unitsPerCarton: data.unitsPerCarton,
      },
    });
  }

  async deleteColorSize(
    orderId: number,
    colorSizeId: number,
    tenantId?: string,
  ) {
    await this.findOrThrow(
      () =>
        this.prisma.orderColorSize.findFirst({
          where: {
            id: colorSizeId,
            orderId,
            ...(tenantId ? { order: { tenantId } } : {}),
          },
        }),
      'Renk/beden kaydı bulunamadı',
    );
    await this.prisma.orderColorSize.delete({ where: { id: colorSizeId } });
    return { success: true };
  }

  async getApprovalStages(orderId: number, tenantId?: string) {
    await this.findOrderOrThrow(orderId, tenantId);

    const existing = await this.prisma.approvalStage.findMany({
      where: { orderId },
    });

    if (existing.length === 0) {
      await this.prisma.approvalStage.createMany({
        data: APPROVAL_STAGE_ORDER.map((stageType) => ({
          orderId,
          stageType,
        })),
      });
    }

    const stages = await this.prisma.approvalStage.findMany({
      where: { orderId },
    });

    return stages.sort(
      (a, b) =>
        APPROVAL_STAGE_ORDER.indexOf(
          a.stageType as (typeof APPROVAL_STAGE_ORDER)[number],
        ) -
        APPROVAL_STAGE_ORDER.indexOf(
          b.stageType as (typeof APPROVAL_STAGE_ORDER)[number],
        ),
    );
  }

  async updateApprovalStage(
    orderId: number,
    stageId: number,
    data: UpdateApprovalStageDto,
    tenantId?: string,
  ) {
    const stage = await this.findOrThrow(
      () =>
        this.prisma.approvalStage.findFirst({
          where: {
            id: stageId,
            orderId,
            ...(tenantId ? { order: { tenantId } } : {}),
          },
        }),
      'Onay aşaması bulunamadı',
    );

    if (data.status === 'APPROVED') {
      const stageIndex = APPROVAL_STAGE_ORDER.indexOf(
        stage.stageType as (typeof APPROVAL_STAGE_ORDER)[number],
      );
      if (stageIndex > 0) {
        const previousStageType = APPROVAL_STAGE_ORDER[stageIndex - 1];
        // orderId burada zaten tenant doğrulamasından geçmiş `stage` üzerinden geliyor,
        // aynı siparişin bir önceki aşamasını sorguladığımız için ek tenant filtresi gerekmez.
        const previousStage = await this.prisma.approvalStage.findFirst({
          where: { orderId, stageType: previousStageType },
        });
        if (!previousStage || previousStage.status !== 'APPROVED') {
          throw new BadRequestException(
            `Önce ${APPROVAL_STAGE_LABEL[previousStageType]} onaylanmalı`,
          );
        }
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.status) {
      updateData.status = data.status;
      updateData.approvedAt = data.status === 'APPROVED' ? new Date() : null;
    }
    if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.approvalStage.update({
      where: { id: stageId },
      data: updateData,
    });
  }

  private async buildClosingData(orderId: number, tenantId?: string) {
    const order = await this.findOrThrow(
      () =>
        this.prisma.order.findFirst({
          where: { id: orderId, ...(tenantId ? { tenantId } : {}) },
          include: {
            materials: true,
            colorSizes: true,
            productionEntries: true,
            qualityEntries: true,
          },
        }),
      'Sipariş bulunamadı',
    );

    const approvalStages = await this.prisma.approvalStage.findMany({
      where: { orderId },
    });

    const productWarehouse = await this.prisma.warehouse.findFirst({
      where: { type: 'URUN' },
    });
    const finishedGoodsLot = productWarehouse
      ? await this.prisma.stockLot.findFirst({
          where: { orderId, warehouseId: productWarehouse.id },
        })
      : null;

    const fabricMovements = await this.prisma.stockMovement.findMany({
      where: {
        orderId,
        type: 'CIKIS',
        reason: { contains: 'Otomatik kumaş tüketimi' },
      },
    });

    const productionByStage = PRODUCTION_STAGE_KEYS.reduce(
      (acc, stage) => {
        acc[stage] = order.productionEntries
          .filter((entry) => entry.stage === stage)
          .reduce((sum, entry) => sum + entry.quantity, 0);
        return acc;
      },
      {} as Record<(typeof PRODUCTION_STAGE_KEYS)[number], number>,
    );

    const totalChecked = order.qualityEntries.reduce(
      (sum, q) => sum + q.checkedQty,
      0,
    );
    const firstQuality = order.qualityEntries.reduce(
      (sum, q) => sum + q.firstQuality,
      0,
    );
    const secondQuality = order.qualityEntries.reduce(
      (sum, q) => sum + q.secondQuality,
      0,
    );
    const rejected = order.qualityEntries.reduce(
      (sum, q) => sum + q.rejected,
      0,
    );
    const secondQualityRate =
      totalChecked > 0 ? (secondQuality / totalChecked) * 100 : 0;
    const fireRate = totalChecked > 0 ? (rejected / totalChecked) * 100 : 0;

    const match = findProductType(order.productName);
    const estimatedNeedMeters = match
      ? calculateFabricNeed(order.totalQuantity, match.rate.avg)
      : null;
    const actualConsumedMeters = fabricMovements.reduce(
      (sum, m) => sum + m.quantity,
      0,
    );
    const varianceMeters =
      estimatedNeedMeters != null
        ? actualConsumedMeters - estimatedNeedMeters
        : null;
    const variancePercent =
      varianceMeters != null && estimatedNeedMeters
        ? (varianceMeters / estimatedNeedMeters) * 100
        : null;

    const finishedGoods = {
      packaged: finishedGoodsLot?.receivedQty ?? 0,
      shipped: finishedGoodsLot
        ? finishedGoodsLot.receivedQty - finishedGoodsLot.remainingQty
        : 0,
      remaining: finishedGoodsLot?.remainingQty ?? 0,
    };

    const summary = {
      orderQuantity: order.totalQuantity,
      productionByStage,
      quality: {
        totalChecked,
        firstQuality,
        secondQuality,
        rejected,
        secondQualityRate,
        fireRate,
      },
      fabric: {
        estimatedNeedMeters,
        actualConsumedMeters,
        varianceMeters,
        variancePercent,
      },
      materials: order.materials.map((m) => ({
        materialName: m.materialName,
        orderedQuantity: m.orderedQuantity,
        arrivedQuantity: m.arrivedQuantity,
        unitPrice: m.unitPrice,
        currency: m.currency,
      })),
      finishedGoods,
    };

    const approvalsComplete =
      approvalStages.length === APPROVAL_STAGE_ORDER.length &&
      approvalStages.every((s) => s.status === 'APPROVED');
    const cuttingComplete = productionByStage.CUTTING >= order.totalQuantity;
    const sewingComplete = productionByStage.SEWING >= order.totalQuantity;
    const packingComplete = productionByStage.PACKING >= order.totalQuantity;
    const shipmentComplete =
      finishedGoodsLot != null && finishedGoodsLot.remainingQty === 0;
    const qualityChecked = order.qualityEntries.length > 0;
    const colorSizeTotal = order.colorSizes.reduce(
      (sum, cs) => sum + cs.quantity,
      0,
    );
    const colorSizeMatches =
      order.colorSizes.length === 0 || colorSizeTotal === order.totalQuantity;

    const missingItems: string[] = [];
    if (!approvalsComplete) missingItems.push('Onay süreci tamamlanmadı');
    if (!cuttingComplete)
      missingItems.push(
        `Kesim eksik (${productionByStage.CUTTING}/${order.totalQuantity})`,
      );
    if (!sewingComplete)
      missingItems.push(
        `Dikim eksik (${productionByStage.SEWING}/${order.totalQuantity})`,
      );
    if (!packingComplete)
      missingItems.push(
        `Paketleme eksik (${productionByStage.PACKING}/${order.totalQuantity})`,
      );
    if (!shipmentComplete) missingItems.push('Sevkiyat tamamlanmadı');
    if (!qualityChecked) missingItems.push('Kalite kontrolü yapılmadı');
    if (!colorSizeMatches)
      missingItems.push('Renk/beden dağılımı toplam miktarla eşleşmiyor');

    const readyToClose = missingItems.length === 0;

    const checklist = {
      approvalsComplete,
      cuttingComplete,
      sewingComplete,
      packingComplete,
      shipmentComplete,
      qualityChecked,
      colorSizeMatches,
      readyToClose,
      missingItems,
      alreadyClosed: order.closedAt != null,
      closedAt: order.closedAt,
      closedBy: order.closedBy,
    };

    return { order, checklist, summary };
  }

  async getClosingSummary(orderId: number, tenantId?: string) {
    const { checklist, summary } = await this.buildClosingData(
      orderId,
      tenantId,
    );
    return { checklist, summary };
  }

  async closeOrder(
    orderId: number,
    data: CloseOrderDto,
    userLabel: string,
    tenantId?: string,
  ) {
    const { order, checklist } = await this.buildClosingData(orderId, tenantId);

    if (order.closedAt != null) {
      throw new BadRequestException('Bu sipariş zaten kapalı.');
    }

    if (!checklist.readyToClose && !data.force) {
      throw new BadRequestException(
        `Sipariş kapatılamaz, eksikler: ${checklist.missingItems.join(', ')}`,
      );
    }

    const closedBy =
      !checklist.readyToClose && data.force
        ? `${userLabel} tarafından eksiklerle kapatıldı`
        : userLabel;

    return this.prisma.order.update({
      where: { id: orderId },
      data: { closedAt: new Date(), closedBy },
    });
  }

  async reopenOrder(orderId: number, tenantId?: string) {
    await this.findOrderOrThrow(orderId, tenantId);

    return this.prisma.order.update({
      where: { id: orderId },
      data: { closedAt: null, closedBy: null },
    });
  }

  async getPackingList(orderId: number, tenantId?: string) {
    const order = await this.findOrThrow(
      () =>
        this.prisma.order.findFirst({
          where: { id: orderId, ...(tenantId ? { tenantId } : {}) },
          include: { colorSizes: true },
        }),
      'Sipariş bulunamadı',
    );

    const productWarehouse = await this.prisma.warehouse.findFirst({
      where: { type: 'URUN' },
    });
    const lot = productWarehouse
      ? await this.prisma.stockLot.findFirst({
          where: { orderId, warehouseId: productWarehouse.id },
        })
      : null;

    const colorSizes = order.colorSizes.map((cs) => computeCartonBreakdown(cs));

    const grandTotal = colorSizes.reduce(
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
      order: {
        orderNo: order.orderNo,
        buyerName: order.buyerName,
        productName: order.productName,
        totalQuantity: order.totalQuantity,
        shipmentDate: order.shipmentDate,
      },
      colorSizes,
      grandTotal,
      packingSummary: {
        packaged: lot?.receivedQty ?? 0,
        shipped: lot ? lot.receivedQty - lot.remainingQty : 0,
        remaining: lot?.remainingQty ?? 0,
      },
      reportDate: new Date(),
    };
  }

  async exportPackingListCsv(
    orderId: number,
    tenantId?: string,
  ): Promise<{ csv: string; orderNo: string }> {
    const data = await this.getPackingList(orderId, tenantId);

    const escapeCsvField = (field: string): string => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    const row = (fields: string[]) => fields.map(escapeCsvField).join(',');

    const lines: string[] = [];
    lines.push(
      row([
        'Sipariş No',
        'Müşteri',
        'Ürün',
        'Toplam Miktar',
        'EXF Tarihi',
        'Rapor Tarihi',
      ]),
    );
    lines.push(
      row([
        data.order.orderNo,
        data.order.buyerName,
        data.order.productName,
        String(data.order.totalQuantity),
        data.order.shipmentDate.toISOString().slice(0, 10),
        data.reportDate.toISOString().slice(0, 10),
      ]),
    );
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
    const fmt = (value: number | null) => (value == null ? '—' : String(value));
    if (data.colorSizes.length > 0) {
      for (const cs of data.colorSizes) {
        lines.push(
          row([
            cs.color,
            cs.size,
            String(cs.totalQty),
            fmt(cs.unitsPerCarton),
            fmt(cs.fullCartons),
            fmt(cs.lottedQty),
            String(cs.looseQty),
            fmt(cs.totalCartons),
          ]),
        );
      }
      lines.push(
        row([
          'GENEL TOPLAM',
          '',
          String(data.grandTotal.totalQty),
          '',
          String(data.grandTotal.fullCartons),
          String(data.grandTotal.lottedQty),
          String(data.grandTotal.looseQty),
          String(data.grandTotal.totalCartons),
        ]),
      );
    }
    lines.push('');
    lines.push(row(['Paketlenen', 'Sevk Edilen', 'Kalan']));
    lines.push(
      row([
        String(data.packingSummary.packaged),
        String(data.packingSummary.shipped),
        String(data.packingSummary.remaining),
      ]),
    );

    // UTF-8 BOM — Excel'in Türkçe karakterleri (ş, ğ, ı vb.) doğru göstermesi için gerekli.
    return { csv: '\uFEFF' + lines.join('\r\n'), orderNo: data.order.orderNo };
  }
}
