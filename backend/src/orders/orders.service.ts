import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculateFabricNeed,
  findProductType,
} from '../knowledge/textile-knowledge';
import {
  computeCompletionForecast,
  type CompletionForecast,
} from './forecast.util';
import type {
  CreateMaterialDto,
  CreateOrderColorSizeDto,
  CreateOrderDto,
  CreateProductionEntryDto,
  CreateQualityEntryDto,
  UpdateApprovalStageDto,
  UpdateMaterialDto,
  UpdateOrderDto,
} from './dto/order.dto';

const APPROVAL_STAGE_ORDER = [
  'PP_NUMUNE',
  'PASTAL_ONAY',
  'SARFIYAT_ONAY',
  'KESIM_ONAY',
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
      include: { materials: true, colorSizes: true, approvalStages: true },
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
          include: { materials: true },
        }),
      'Sipariş bulunamadı',
    );

    return this.computeAiSuggestion(order);
  }

  computeAiSuggestion(order: {
    productName: string;
    totalQuantity: number;
    materials: { materialType: string; orderedQuantity: number }[];
  }): OrderAiSuggestion {
    const match = findProductType(order.productName);
    if (!match) {
      return {
        productType: null,
        estimatedNeed: null,
        warning: null,
        ok: true,
      };
    }

    const estimatedNeed = calculateFabricNeed(
      order.totalQuantity,
      match.rate.avg,
    );

    const fabricMaterials = order.materials.filter(
      (material) =>
        material.materialType.toLocaleLowerCase('tr-TR') === 'kumaş',
    );

    if (fabricMaterials.length === 0) {
      return {
        productType: match.label,
        estimatedNeed,
        warning: `Bu sipariş için henüz kumaş girilmemiş, tahmini ihtiyaç: ${estimatedNeed.toFixed(1)} metre`,
        ok: false,
      };
    }

    const totalOrderedFabric = fabricMaterials.reduce(
      (sum, material) => sum + material.orderedQuantity,
      0,
    );

    if (totalOrderedFabric < estimatedNeed) {
      return {
        productType: match.label,
        estimatedNeed,
        warning: `Girilen kumaş miktarı (${totalOrderedFabric.toFixed(1)} m) tahmini ihtiyacın (${estimatedNeed.toFixed(1)} m) altında, eksik olabilir`,
        ok: false,
      };
    }

    return { productType: match.label, estimatedNeed, warning: null, ok: true };
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
  ) {
    await this.findOrderOrThrow(orderId, tenantId);

    return this.prisma.productionEntry.create({
      data: {
        orderId,
        stage: data.stage.trim(),
        quantity: data.quantity,
        date: data.date ? new Date(data.date) : undefined,
        lineNo: data.lineNo,
        notes: data.notes,
      },
    });
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
      create: { orderId, color, size, quantity: data.quantity },
      update: { quantity: data.quantity },
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
}
