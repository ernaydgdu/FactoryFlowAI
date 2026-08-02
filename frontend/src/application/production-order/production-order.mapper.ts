import { SALES_ORDERS } from '@/domain/data/orders'
import { getProductById } from '@/domain/data/products'
import { buildProductionTracking } from '@/domain/services/textile/production-tracking-service'
import { operationRepository, productionLineRepository, workshopRepository } from '@/domain/master-data'

import type {
  ProductionKpisDto,
  ProductionLineItemDto,
  ProductionOperationItemDto,
  ProductionOrderListItemDto,
} from './production-order.dto'
import type { StatusBadgeDto } from '../core/types'

function prodStatus(status: string): StatusBadgeDto {
  if (status === 'Tamamlandı') return { label: status, tone: 'success' }
  if (status === 'Devam Ediyor') return { label: status, tone: 'default' }
  return { label: status, tone: 'muted' }
}

export function mapProductionOrderList(): ProductionOrderListItemDto[] {
  return SALES_ORDERS.filter((o) => o.productionStatus !== 'Beklemede').slice(0, 20).map((o) => {
    const product = getProductById(o.productCardId)
    const tracking = buildProductionTracking(o)
    const workshop = workshopRepository.getByCode(tracking.operations[0]?.workshopCode ?? '')
    return {
      id: o.id,
      workOrderNo: o.production.workOrderNo,
      orderNo: o.orderNo,
      productCode: product?.productCode ?? '—',
      plannedQty: o.production.plannedQty,
      producedQty: o.production.producedQty,
      progress: o.production.progress,
      workshop: workshop?.name ?? '—',
      status: prodStatus(o.production.status),
    }
  })
}

export function mapProductionLines(): ProductionLineItemDto[] {
  return productionLineRepository.getActive().map((l) => {
    const ws = workshopRepository.getById(l.workshopId)
    return {
      id: l.id,
      code: l.code,
      name: l.name,
      workshop: ws?.name ?? '—',
      capacity: l.capacityPerDay,
      load: Math.round((ws?.currentLoad ?? 0) / Math.max(1, ws?.monthlyCapacity ?? 1) * 100),
    }
  })
}

export function mapProductionOperations(): ProductionOperationItemDto[] {
  return operationRepository.getActive().slice(0, 10).map((op, i) => {
    const line = productionLineRepository.getActive()[i]
    const ws = line ? workshopRepository.getById(line.workshopId) : undefined
    return {
      id: op.id,
      sequence: op.sequence,
      code: op.code,
      name: op.name,
      workshop: ws?.name ?? '—',
      progress: Math.min(100, 40 + i * 8),
    }
  })
}

export function mapProductionKpis(): ProductionKpisDto {
  const orders = SALES_ORDERS
  const active = orders.filter((o) => o.productionStatus === 'Üretimde').length
  const lines = productionLineRepository.getActive()
  return {
    items: [
      { label: 'Üretim Emri', value: String(orders.filter((o) => o.productionStatus !== 'Beklemede').length), hint: 'Aktif' },
      { label: 'Üretimde', value: String(active), hint: 'Devam eden' },
      { label: 'Hat', value: String(lines.length), hint: 'Aktif hat' },
      { label: 'Ort. İlerleme', value: `%${Math.round(orders.reduce((s, o) => s + o.production.progress, 0) / Math.max(1, orders.length))}`, hint: 'Portföy' },
    ],
  }
}
