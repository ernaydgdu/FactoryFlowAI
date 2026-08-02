import { SALES_ORDERS } from '@/domain/data/orders'

import type { MrpKpisDto, MrpLineItemDto } from './mrp.dto'
import type { StatusBadgeDto } from '../core/types'

function mrpStatus(status: string): StatusBadgeDto {
  if (status === 'Karşılandı') return { label: status, tone: 'success' }
  if (status === 'Rezerve') return { label: status, tone: 'default' }
  if (status === 'Hesaplandı') return { label: status, tone: 'warning' }
  return { label: status, tone: 'muted' }
}

export function mapMrpList(): MrpLineItemDto[] {
  return SALES_ORDERS.flatMap((o) =>
    o.mrp.lines.map((line) => ({
      id: line.id,
      orderId: o.id,
      orderNo: o.orderNo,
      materialName: line.materialName,
      category: line.category,
      orderQty: line.orderQty,
      netRequired: line.netRequired,
      unit: line.unit,
      supplier: line.supplier,
      leadTimeDays: line.leadTimeDays,
      status: mrpStatus(line.status),
    })),
  )
}

export function mapMrpKpis(): MrpKpisDto {
  const lines = mapMrpList()
  return {
    items: [
      { label: 'MRP Satırı', value: String(lines.length), hint: 'Tüm siparişler' },
      { label: 'Bekleyen', value: String(lines.filter((l) => l.status.label === 'Hesaplandı').length), hint: 'Satın alma' },
      { label: 'Rezerve', value: String(lines.filter((l) => l.status.label === 'Rezerve').length), hint: 'Stok ayrılmış' },
      { label: 'Karşılandı', value: String(lines.filter((l) => l.status.label === 'Karşılandı').length), hint: 'Tamam' },
    ],
  }
}
