import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CreateMaterialDto,
  CreateOrderDto,
  CreateProductionEntryDto,
  UpdateMaterialStatusDto,
} from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async getOrders(tenantId?: string) {
    return this.prisma.order.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { materials: true },
      orderBy: { createdAt: 'desc' },
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
}
