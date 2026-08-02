import type { KpiDto, StatusBadgeDto, StatusTone, TimelineItemDto } from '../core/types'
import type { ProductionOrderLifecycleStatus, ProductionOrderPriority } from '@/domain/production-order/lifecycle-types'

export type { ProductionOrderLifecycleStatus, ProductionOrderPriority }

export function lifecycleStatusBadge(status: ProductionOrderLifecycleStatus): StatusBadgeDto {
  const map: Record<ProductionOrderLifecycleStatus, { label: string; tone: StatusTone }> = {
    Draft: { label: 'Taslak', tone: 'muted' },
    Planned: { label: 'Planlandı', tone: 'default' },
    Approved: { label: 'Onaylandı', tone: 'default' },
    Released: { label: 'Serbest', tone: 'warning' },
    'In Production': { label: 'Üretimde', tone: 'success' },
    Paused: { label: 'Duraklatıldı', tone: 'warning' },
    Completed: { label: 'Tamamlandı', tone: 'success' },
    Closed: { label: 'Kapatıldı', tone: 'muted' },
    Cancelled: { label: 'İptal', tone: 'danger' },
  }
  return map[status]
}

export type ProductionOrderLifecycleListItemDto = {
  id: string
  productionOrderNo: string
  salesOrderNo: string
  salesOrderId: string
  productCode: string
  productName: string
  customer: string
  buyer: string
  workshop: string
  workshopCode: string
  line: string
  lineCode: string
  plannedQty: number
  producedQty: number
  remainingQty: number
  rejectQty: number
  reworkQty: number
  secondQualityQty: number
  fireQty: number
  startDate: string
  plannedFinish: string
  actualFinish: string
  status: StatusBadgeDto
  lifecycleStatus: ProductionOrderLifecycleStatus
  priority: ProductionOrderPriority
  revision: number
  progress: number
  terminRisk: boolean
  finishedGoodsReady: boolean
}

export type ProductionOrderSnapshotDto = {
  capturedAt: string
  revision: number
  bom: Array<{ code: string; name: string; consumption: number; unit: string }>
  operationRoute: Array<{ sequence: number; code: string; name: string; workshopCode: string }>
  cost: { fabric: number; accessory: number; labor: number; overhead: number; total: number; currency: string }
  planning: {
    terminRiskScore: number
    capacityUtilization: number
    plannedStart: string
    plannedFinish: string
    workshopCode: string
    lineCode: string
  }
}

export type ProductionOrderLifecycleDetailDto = ProductionOrderLifecycleListItemDto & {
  snapshots: ProductionOrderSnapshotDto
  reservationApplied: boolean
  allowedTransitions: ProductionOrderLifecycleStatus[]
  auditTrail: TimelineItemDto[]
}

export type DailyProductionEntryLifecycleDto = {
  id: string
  productionOrderNo: string
  entryDate: string
  planned: number
  produced: number
  reject: number
  rework: number
  secondQuality: number
  fire: number
  recordedBy: string
  recordedAt: string
}

export type ProductionOrderBrainInsightDto = {
  productionOrderNo: string
  whyDelayed: string
  biggestBottleneck: string
  waitingOperation: string
  capacitySufficient: boolean
  terminRisk: boolean
  bestWorkshop: string
}

export type ProductionOrderTwinSimulationDto = {
  productionOrderNo: string
  sideEffects: 'NONE'
  scenarioId: string
  summary: string
  impactScore: number
}

export type CreateProductionOrderInputDto = {
  salesOrderId: string
  priority?: ProductionOrderPriority
  actor?: string
}

export type TransitionProductionOrderInputDto = {
  productionOrderNo: string
  toStatus: ProductionOrderLifecycleStatus
  actor?: string
}

export type AddDailyEntryInputDto = {
  productionOrderNo: string
  entryDate: string
  planned: number
  produced: number
  reject: number
  rework: number
  secondQuality: number
  fire: number
  recordedBy: string
}

export type SalesOrderForPoCreateDto = {
  id: string
  orderNo: string
  customer: string
  productCode: string
  productName: string
  quantity: number
  hasProductionOrder: boolean
}

export type ProductionOrderLifecycleDashboardDto = {
  kpis: KpiDto[]
}

export const LIFECYCLE_STATUS_ACTION_LABELS: Record<ProductionOrderLifecycleStatus, string> = {
  Draft: 'Taslak',
  Planned: 'Planlandı',
  Approved: 'Onaylandı',
  Released: 'Serbest',
  'In Production': 'Üretime Al',
  Paused: 'Duraklat',
  Completed: 'Tamamla',
  Closed: 'Kapat',
  Cancelled: 'İptal',
}
