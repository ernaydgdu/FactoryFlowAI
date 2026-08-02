/** Production Order Lifecycle — domain types (yeni modül, mevcut engine'lere dokunmaz) */

export type ProductionOrderLifecycleStatus =
  | 'Draft'
  | 'Planned'
  | 'Approved'
  | 'Released'
  | 'In Production'
  | 'Paused'
  | 'Completed'
  | 'Closed'
  | 'Cancelled'

export type ProductionOrderPriority = 'Low' | 'Normal' | 'High' | 'Critical'

export type ProductionOrderSnapshot = {
  capturedAt: string
  revision: number
  bom: Array<{ stockCardId: string; code: string; name: string; consumption: number; unit: string }>
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

export type DailyProductionEntryRecord = {
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

export type ProductionOrderLifecycleRecord = {
  id: string
  productionOrderNo: string
  salesOrderId: string
  salesOrderNo: string
  productCardId: string
  productCode: string
  productName: string
  customer: string
  buyer: string
  workshopId: string
  workshopCode: string
  workshopName: string
  productionLineId: string
  productionLineCode: string
  productionLineName: string
  plannedQty: number
  producedQty: number
  rejectQty: number
  reworkQty: number
  secondQualityQty: number
  fireQty: number
  startDate: string | null
  plannedFinish: string
  actualFinish: string | null
  status: ProductionOrderLifecycleStatus
  priority: ProductionOrderPriority
  revision: number
  snapshots: ProductionOrderSnapshot
  /** BR-03 rezervasyon tetiklendi mi */
  reservationApplied: boolean
  /** BR-08 mamül çıkışı hazır mı */
  finishedGoodsReady: boolean
  createdAt: string
  updatedAt: string
}

export type LifecycleTransitionRule = {
  from: ProductionOrderLifecycleStatus
  to: ProductionOrderLifecycleStatus
  businessRuleId: string
  label: string
}

export const LIFECYCLE_TRANSITIONS: LifecycleTransitionRule[] = [
  { from: 'Draft', to: 'Planned', businessRuleId: 'BR-10-STOCK-LEDGER', label: 'Planlama doğrulaması' },
  { from: 'Planned', to: 'Approved', businessRuleId: 'BR-01-ORDER-MRP-PR', label: 'MRP / malzeme hazırlığı' },
  { from: 'Approved', to: 'Released', businessRuleId: 'BR-03-PRODUCTION-RESERVE', label: 'BOM rezervasyonu' },
  { from: 'Released', to: 'In Production', businessRuleId: 'BR-05-PRODUCTION-ENTRY', label: 'Üretim başlatma' },
  { from: 'In Production', to: 'Paused', businessRuleId: 'BR-10-STOCK-LEDGER', label: 'Duraklatma kaydı' },
  { from: 'Paused', to: 'In Production', businessRuleId: 'BR-05-PRODUCTION-ENTRY', label: 'Üretime devam' },
  { from: 'In Production', to: 'Completed', businessRuleId: 'BR-08-PRODUCTION-COMPLETE', label: 'Üretim tamamlama' },
  { from: 'Completed', to: 'Closed', businessRuleId: 'BR-09-SHIPMENT', label: 'Emri kapatma' },
  { from: 'Draft', to: 'Cancelled', businessRuleId: 'BR-10-STOCK-LEDGER', label: 'İptal' },
  { from: 'Planned', to: 'Cancelled', businessRuleId: 'BR-10-STOCK-LEDGER', label: 'İptal' },
  { from: 'Approved', to: 'Cancelled', businessRuleId: 'BR-10-STOCK-LEDGER', label: 'İptal' },
  { from: 'Released', to: 'Cancelled', businessRuleId: 'BR-10-STOCK-LEDGER', label: 'İptal' },
  { from: 'In Production', to: 'Cancelled', businessRuleId: 'BR-10-STOCK-LEDGER', label: 'İptal' },
  { from: 'Paused', to: 'Cancelled', businessRuleId: 'BR-10-STOCK-LEDGER', label: 'İptal' },
  { from: 'Planned', to: 'Draft', businessRuleId: 'BR-10-STOCK-LEDGER', label: 'Taslağa geri al' },
  { from: 'Approved', to: 'Planned', businessRuleId: 'BR-10-STOCK-LEDGER', label: 'Planlamaya geri al' },
  { from: 'Released', to: 'Approved', businessRuleId: 'BR-10-STOCK-LEDGER', label: 'Onaya geri al' },
]

export const ALLOWED_NEXT_STATUS: Record<ProductionOrderLifecycleStatus, ProductionOrderLifecycleStatus[]> = {
  Draft: ['Planned', 'Cancelled'],
  Planned: ['Approved', 'Draft', 'Cancelled'],
  Approved: ['Released', 'Planned', 'Cancelled'],
  Released: ['In Production', 'Approved', 'Cancelled'],
  'In Production': ['Paused', 'Completed', 'Cancelled'],
  Paused: ['In Production', 'Cancelled'],
  Completed: ['Closed'],
  Closed: [],
  Cancelled: [],
}
