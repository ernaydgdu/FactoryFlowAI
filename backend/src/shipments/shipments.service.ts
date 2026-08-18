import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeCartonBreakdown, type CartonBreakdown } from '../common/carton.util';
import type { CreateShipmentDto } from './dto/shipment.dto';

export type ShipmentGrandTotal = {
  totalQty: number;
  fullCartons: number;
  lottedQty: number;
  looseQty: number;
  totalCartons: number;
};

function sumGrandTotal(breakdowns: CartonBreakdown[]): ShipmentGrandTotal {
  return breakdowns.reduce(
    (acc, cs) => ({
      totalQty: acc.totalQty + cs.totalQty,
      fullCartons: acc.fullCartons + (cs.fullCartons ?? 0),
      lottedQty: acc.lottedQty + (cs.lottedQty ?? 0),
      looseQty: acc.looseQty + cs.looseQty,
      totalCartons: acc.totalCartons + (cs.totalCartons ?? 0),
    }),
    { totalQty: 0, fullCartons: 0, lottedQty: 0, looseQty: 0, totalCartons: 0 },
  );
}

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}

  private async findOrThrow<T>(fn: () => Promise<T | null>, message: string): Promise<T> {
    const result = await fn();
    if (!result) {
      throw new NotFoundException(message);
    }
    return result;
  }

  private async generateShipmentNo(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SVK-${year}-`;

    const existing = await this.prisma.shipment.findMany({
      where: { tenantId, shipmentNo: { startsWith: prefix } },
      select: { shipmentNo: true },
    });

    let maxSeq = 0;
    for (const s of existing) {
      const suffix = s.shipmentNo.slice(prefix.length);
      const num = parseInt(suffix, 10);
      if (!Number.isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }

    const next = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}${next}`;
  }

  async getShipments(tenantId?: string) {
    const shipments = await this.prisma.shipment.findMany({
      where: tenantId ? { tenantId } : undefined,
      include: { lines: true },
      orderBy: { shipmentDate: 'desc' },
    });

    return shipments.map((shipment) => {
      const breakdowns = shipment.lines.map((line) => computeCartonBreakdown(line));
      const grandTotal = sumGrandTotal(breakdowns);
      const orderCount = new Set(shipment.lines.map((line) => line.orderId)).size;

      return {
        id: shipment.id,
        shipmentNo: shipment.shipmentNo,
        shipmentDate: shipment.shipmentDate,
        notes: shipment.notes,
        orderCount,
        totalQty: grandTotal.totalQty,
        totalCartons: grandTotal.totalCartons,
        createdAt: shipment.createdAt,
      };
    });
  }

  async getShipmentDetail(id: number, tenantId?: string) {
    const shipment = await this.findOrThrow(
      () =>
        this.prisma.shipment.findFirst({
          where: { id, ...(tenantId ? { tenantId } : {}) },
          include: { lines: { include: { order: true }, orderBy: { id: 'asc' } } },
        }),
      'Sevkiyat bulunamadı',
    );

    const lines = shipment.lines.map((line) => {
      const breakdown = computeCartonBreakdown(line);
      return {
        id: line.id,
        orderId: line.orderId,
        orderNo: line.order.orderNo,
        buyerName: line.order.buyerName,
        productName: line.order.productName,
        ...breakdown,
      };
    });

    const grandTotal = sumGrandTotal(lines.map((l) => l));

    return {
      id: shipment.id,
      shipmentNo: shipment.shipmentNo,
      shipmentDate: shipment.shipmentDate,
      notes: shipment.notes,
      createdBy: shipment.createdBy,
      lines,
      grandTotal,
    };
  }

  async createShipment(data: CreateShipmentDto, tenantId: string, createdBy?: string) {
    if (data.lines.length === 0) {
      throw new BadRequestException('En az bir satır eklemelisiniz.');
    }

    const orderIds = Array.from(new Set(data.lines.map((l) => l.orderId)));
    const orders = await this.prisma.order.findMany({
      where: { id: { in: orderIds }, tenantId },
    });
    if (orders.length !== orderIds.length) {
      throw new BadRequestException('Seçilen siparişlerden biri bulunamadı.');
    }

    const shipmentNo = await this.generateShipmentNo(tenantId);

    return this.prisma.shipment.create({
      data: {
        shipmentNo,
        shipmentDate: data.shipmentDate ? new Date(data.shipmentDate) : undefined,
        notes: data.notes,
        createdBy,
        tenantId,
        lines: {
          create: data.lines.map((line) => ({
            orderId: line.orderId,
            color: line.color.trim(),
            size: line.size.trim(),
            quantity: line.quantity,
            unitsPerCarton: line.unitsPerCarton ?? null,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async deleteShipment(id: number, tenantId?: string) {
    await this.findOrThrow(
      () =>
        this.prisma.shipment.findFirst({
          where: { id, ...(tenantId ? { tenantId } : {}) },
        }),
      'Sevkiyat bulunamadı',
    );

    await this.prisma.$transaction([
      this.prisma.shipmentLine.deleteMany({ where: { shipmentId: id } }),
      this.prisma.shipment.delete({ where: { id } }),
    ]);

    return { success: true };
  }

  async exportShipmentCsv(id: number, tenantId?: string): Promise<{ csv: string; shipmentNo: string }> {
    const data = await this.getShipmentDetail(id, tenantId);

    const escapeCsvField = (field: string): string => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    const row = (fields: string[]) => fields.map(escapeCsvField).join(',');
    const fmt = (value: number | null) => (value == null ? '—' : String(value));

    const lines: string[] = [];
    lines.push(row(['Sevkiyat No', 'Sevkiyat Tarihi', 'Notlar']));
    lines.push(
      row([
        data.shipmentNo,
        data.shipmentDate.toISOString().slice(0, 10),
        data.notes ?? '',
      ]),
    );
    lines.push('');
    lines.push(
      row([
        'Sipariş No',
        'Müşteri',
        'Ürün',
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
    for (const line of data.lines) {
      lines.push(
        row([
          line.orderNo,
          line.buyerName,
          line.productName,
          line.color,
          line.size,
          String(line.totalQty),
          fmt(line.unitsPerCarton),
          fmt(line.fullCartons),
          fmt(line.lottedQty),
          String(line.looseQty),
          fmt(line.totalCartons),
        ]),
      );
    }
    lines.push(
      row([
        'GENEL TOPLAM',
        '',
        '',
        '',
        '',
        String(data.grandTotal.totalQty),
        '',
        String(data.grandTotal.fullCartons),
        String(data.grandTotal.lottedQty),
        String(data.grandTotal.looseQty),
        String(data.grandTotal.totalCartons),
      ]),
    );

    // UTF-8 BOM — Excel'in Türkçe karakterleri (ş, ğ, ı vb.) doğru göstermesi için gerekli.
    return { csv: '\uFEFF' + lines.join('\r\n'), shipmentNo: data.shipmentNo };
  }
}
