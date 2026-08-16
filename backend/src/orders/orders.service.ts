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
import type {
  CreateMaterialDto,
  CreateOrderDto,
  CreateProductionEntryDto,
  CreateQualityEntryDto,
  UpdateMaterialStatusDto,
} from './dto/order.dto';

export type OrderAiSuggestion = {
  productType: string | null;
  estimatedNeed: number | null;
  warning: string | null;
  ok: boolean;
};

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async getOrders(tenantId?: string) {
    const orders = await this.prisma.order.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { materials: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => {
      const suggestion = this.computeAiSuggestion(order);
      return {
        ...order,
        productType: suggestion.productType,
        materialWarning: suggestion.warning !== null,
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

  private async findOrderOrThrow(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı');
    }
    return order;
  }

  async getOrderById(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { materials: true },
    });
    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı');
    }
    return order;
  }

  async getAiSuggestion(orderId: number): Promise<OrderAiSuggestion> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { materials: true },
    });
    if (!order) {
      throw new NotFoundException('Sipariş bulunamadı');
    }

    return this.computeAiSuggestion(order);
  }

  private computeAiSuggestion(order: {
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

  async getMaterials(orderId: number) {
    await this.findOrderOrThrow(orderId);
    return this.prisma.material.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMaterial(orderId: number, data: CreateMaterialDto) {
    await this.findOrderOrThrow(orderId);

    return this.prisma.material.create({
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
  }

  async updateMaterialStatus(
    orderId: number,
    materialId: number,
    data: UpdateMaterialStatusDto,
  ) {
    const material = await this.prisma.material.findFirst({
      where: { id: materialId, orderId },
    });
    if (!material) {
      throw new NotFoundException('Malzeme bulunamadı');
    }

    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status;
    if (data.arrivedQuantity !== undefined)
      updateData.arrivedQuantity = data.arrivedQuantity;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return this.prisma.material.update({
      where: { id: materialId },
      data: updateData,
    });
  }

  async getProductionEntries(orderId: number) {
    await this.findOrderOrThrow(orderId);
    return this.prisma.productionEntry.findMany({
      where: { orderId },
      orderBy: { date: 'asc' },
    });
  }

  async addProductionEntry(orderId: number, data: CreateProductionEntryDto) {
    await this.findOrderOrThrow(orderId);

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

  async getQualityEntries(orderId: number) {
    await this.findOrderOrThrow(orderId);
    return this.prisma.qualityEntry.findMany({
      where: { orderId },
      orderBy: { date: 'asc' },
    });
  }

  async addQualityEntry(orderId: number, data: CreateQualityEntryDto) {
    await this.findOrderOrThrow(orderId);

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
}
