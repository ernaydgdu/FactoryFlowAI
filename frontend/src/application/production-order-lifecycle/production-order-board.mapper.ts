/**
 * Production Order Board — Status Board, Operation List ve Material
 * Reservation read mapper'ları. Kaynak: kalıcı üretim emri aggregate'i
 * (IProductionOrderRepository) + kalıcı stok defteri (P14/P15).
 */
import type { StatusBadgeDto } from '@/application/core/types'
import { deriveOperationSequence, type OperationStepStatus } from '@/domain/production-order/operation-sequence.service'
import { getMaterialReservationState, type MaterialReservationLineStatus } from '@/domain/production-order/material-reservation.service'
import { queryAllProductionOrders, queryProductionOrderByNo } from '@/domain/production-order/production-order-query.service'
import type { ProductionOrderLifecycleStatus } from '@/domain/production-order/lifecycle-types'
import { planMergeProductionOrders, planSplitProductionOrder } from '@/domain/production-order/split-merge.service'

import type {
  MaterialReservationLineDto,
  MaterialReservationViewDto,
  MergePlanDto,
  OperationListRowDto,
  SplitPlanDto,
  StatusBoardDto,
} from './production-order-board.dto'
import { lifecycleStatusBadge } from './production-order-lifecycle.dto'
import { mapProductionOrderLifecycleList } from './production-order-lifecycle.mapper'

const BOARD_STATUS_ORDER: ProductionOrderLifecycleStatus[] = [
  'Draft',
  'Planned',
  'Approved',
  'Released',
  'In Production',
  'Paused',
  'Completed',
  'Closed',
  'Cancelled',
]

export function mapStatusBoard(): StatusBoardDto {
  const items = mapProductionOrderLifecycleList()
  const columns = BOARD_STATUS_ORDER.map((status) => {
    const columnItems = items.filter((i) => i.lifecycleStatus === status)
    return {
      status,
      badge: lifecycleStatusBadge(status),
      count: columnItems.length,
      totalRemainingQty: columnItems.reduce((s, i) => s + i.remainingQty, 0),
      items: columnItems,
    }
  })

  const active = items.filter((i) => !['Completed', 'Closed', 'Cancelled'].includes(i.lifecycleStatus))
  return {
    kpis: [
      { label: 'Toplam UE', value: String(items.length), hint: 'Yaşam döngüsü' },
      { label: 'Aktif UE', value: String(active.length), hint: 'Kapanmamış' },
      {
        label: 'Üretimde',
        value: String(items.filter((i) => i.lifecycleStatus === 'In Production').length),
        hint: 'In Production',
      },
      {
        label: 'Kalan Adet',
        value: String(active.reduce((s, i) => s + i.remainingQty, 0)),
        hint: 'Aktif emirler',
      },
    ],
    columns,
  }
}

function stepStatusBadge(status: OperationStepStatus): StatusBadgeDto {
  switch (status) {
    case 'Completed':
      return { label: 'Tamamlandı', tone: 'success' }
    case 'InProgress':
      return { label: 'Devam Ediyor', tone: 'warning' }
    default:
      return { label: 'Bekliyor', tone: 'default' }
  }
}

export function mapOperationList(): OperationListRowDto[] {
  return queryAllProductionOrders()
    .filter((r) => r.status !== 'Cancelled')
    .flatMap((record) =>
      deriveOperationSequence(record).map((step) => ({
        id: `${record.productionOrderNo}-${step.sequence}`,
        productionOrderNo: record.productionOrderNo,
        productName: record.productName,
        lifecycleStatus: record.status,
        sequence: step.sequence,
        operationCode: step.code,
        operationName: step.name,
        workshopCode: step.workshopCode,
        stepStatus: stepStatusBadge(step.status),
      })),
    )
}

function reservationLineBadge(status: MaterialReservationLineStatus): StatusBadgeDto {
  switch (status) {
    case 'ALREADY_RESERVED':
      return { label: 'Rezerve', tone: 'success' }
    case 'RESERVED':
      return { label: 'Rezerve Edilebilir', tone: 'warning' }
    case 'SKIPPED_INSUFFICIENT_STOCK':
      return { label: 'Yetersiz Stok', tone: 'danger' }
    default:
      return { label: 'Stok Kartı Yok', tone: 'muted' }
  }
}

export function mapMaterialReservation(productionOrderNo: string): MaterialReservationViewDto | null {
  const record = queryProductionOrderByNo(productionOrderNo)
  if (!record) return null

  const lines: MaterialReservationLineDto[] = getMaterialReservationState(productionOrderNo).map((l) => ({
    stockCardId: l.stockCardId,
    code: l.code,
    name: l.name,
    unit: l.unit,
    warehouseCode: l.warehouseCode ?? '—',
    requiredQty: l.requiredQty,
    reservedQty: l.reservedQty,
    availableQty: l.availableQty,
    status: reservationLineBadge(l.status),
    message: l.message ?? '—',
  }))

  return {
    productionOrderNo,
    reservationApplied: record.reservationApplied,
    lines,
    fullyReserved: lines.length > 0 && lines.every((l) => l.reservedQty >= l.requiredQty),
  }
}

export function mapSplitPlan(productionOrderNo: string, quantities: number[]): SplitPlanDto {
  return planSplitProductionOrder(productionOrderNo, quantities)
}

export function mapMergePlan(orderNos: string[]): MergePlanDto {
  return planMergeProductionOrders(orderNos)
}
