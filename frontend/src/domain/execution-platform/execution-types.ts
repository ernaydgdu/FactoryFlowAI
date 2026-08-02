/**
 * Execution Platform — Domain types (10-year durable model)
 * Yeni engine değil; textile shop floor entity tanımları.
 */
import type { QualityModule } from '../types/workflows'

export const EXECUTION_SCHEMA_VERSION = 1 as const
export const BUNDLE_BARCODE_FORMAT_VERSION = 'KPL-BUNDLE-V1' as const

/** Progressive Bundle System — endüstri standart component kodları */
export type BundleComponentCode =
  | 'GARMENT'
  | 'FRT'
  | 'BK'
  | 'SLV'
  | 'SLV-L'
  | 'SLV-R'
  | 'CLR'
  | 'PKT'
  | 'CUFF'
  | 'YKE'

export const BUNDLE_COMPONENT_LABELS: Record<BundleComponentCode, string> = {
  GARMENT: 'Tam Parça',
  FRT: 'Ön',
  BK: 'Arka',
  SLV: 'Kol',
  'SLV-L': 'Sol Kol',
  'SLV-R': 'Sağ Kol',
  CLR: 'Yaka',
  PKT: 'Cep',
  CUFF: 'Manşet',
  YKE: 'Yoke',
}

export type BundleStatus =
  | 'Created'
  | 'Labeled'
  | 'Issued'
  | 'InTransit'
  | 'AtOperation'
  | 'OnHold'
  | 'Completed'
  | 'Scrapped'
  | 'Cancelled'
  | 'Lost'
  | 'Damaged'

export type OperationExecutionStatus =
  | 'Pending'
  | 'Ready'
  | 'Waiting'
  | 'InProgress'
  | 'Paused'
  | 'Completed'
  | 'Blocked'

export type ExecutionContextStatus = 'NotStarted' | 'Active' | 'Paused' | 'Completed'

export type WipState = 'Queued' | 'InProcess' | 'WaitingQC' | 'Blocked' | 'Completed'

export type WipTransferType = 'Forward' | 'Rework' | 'Scrap'

export type QualityGateType = QualityModule

/** Kalite kapısı disposition — shop floor gerçek sonuçları */
export type QualityGateDisposition =
  | 'Pending'
  | 'Pass'
  | 'PassWithCondition'
  | 'Hold'
  | 'Rework'
  | 'Reject'
  | 'Scrap'
  | 'SecondQuality'

/** @deprecated QualityGateDisposition kullanın — geriye dönük uyumluluk */
export type QualityGateResult = QualityGateDisposition | 'Fail' | 'Waived'

export type ExecutionTimelineEventType =
  | 'ExecutionInitialized'
  | 'OperationStarted'
  | 'OperationPaused'
  | 'OperationResumed'
  | 'OperationCompleted'
  | 'OperationBlocked'
  | 'BundleCreated'
  | 'BundleLabeled'
  | 'BundleIssued'
  | 'BundleMoved'
  | 'BundleOnHold'
  | 'BundleCompleted'
  | 'BundleSplit'
  | 'BundleMerged'
  | 'BundleCancelled'
  | 'BundleLost'
  | 'BundleDamaged'
  | 'BundleScrapped'
  | 'WipTransferred'
  | 'DailyEntryPosted'
  | 'QualityGateEvaluated'
  | 'QualityPassed'
  | 'QualityRejected'
  | 'QualityReworked'
  | 'ReworkStarted'
  | 'ReworkCompleted'
  | 'MachineStopped'
  | 'MachineStarted'
  | 'ShiftStarted'
  | 'ShiftEnded'
  | 'SplitExecuted'
  | 'SplitChildActivated'

/** Canonical event catalog — timeline yalnızca bu tipler üzerinden beslenir */
export const EXECUTION_EVENT_CATALOG: readonly ExecutionTimelineEventType[] = [
  'ExecutionInitialized',
  'OperationStarted',
  'OperationPaused',
  'OperationResumed',
  'OperationCompleted',
  'OperationBlocked',
  'BundleCreated',
  'BundleLabeled',
  'BundleIssued',
  'BundleMoved',
  'BundleOnHold',
  'BundleCompleted',
  'BundleSplit',
  'BundleMerged',
  'BundleCancelled',
  'BundleLost',
  'BundleDamaged',
  'BundleScrapped',
  'WipTransferred',
  'DailyEntryPosted',
  'QualityGateEvaluated',
  'QualityPassed',
  'QualityRejected',
  'QualityReworked',
  'ReworkStarted',
  'ReworkCompleted',
  'MachineStopped',
  'MachineStarted',
  'ShiftStarted',
  'ShiftEnded',
  'SplitExecuted',
  'SplitChildActivated',
] as const

export type OperationWorkSessionStatus =
  | 'Scheduled'
  | 'InProgress'
  | 'Paused'
  | 'Completed'
  | 'Cancelled'

/** Canonical textile execution route — master operation codes */
export const TEXTILE_EXECUTION_ROUTE: readonly {
  operationCode: string
  sequence: number
  gateAfter: QualityGateType | null
}[] = [
  { operationCode: 'CUT', sequence: 10, gateAfter: null },
  { operationCode: 'PATTERN', sequence: 15, gateAfter: null },
  { operationCode: 'NUMBER', sequence: 18, gateAfter: null },
  { operationCode: 'SEW', sequence: 20, gateAfter: null },
  { operationCode: 'OVERLOCK', sequence: 25, gateAfter: null },
  { operationCode: 'HEM', sequence: 28, gateAfter: 'Inline' },
  { operationCode: 'WASH', sequence: 30, gateAfter: 'Midline' },
  { operationCode: 'IRON', sequence: 40, gateAfter: null },
  { operationCode: 'QC', sequence: 55, gateAfter: 'Final' },
  { operationCode: 'PACK', sequence: 50, gateAfter: null },
] as const

export type ExecutionContext = {
  id: string
  schemaVersion: typeof EXECUTION_SCHEMA_VERSION
  productionOrderNo: string
  parentProductionOrderNo: string | null
  salesOrderId: string
  salesOrderNo: string
  productCode: string
  workshopCode: string
  lineId: string | null
  status: ExecutionContextStatus
  routeVersion: number
  splitIndex: number | null
  splitOfTotal: number | null
  plannedQty: number
  bundleCount: number
  initializedAt: string
  completedAt: string | null
  metadata: Record<string, string | number | boolean>
}

export type OperationExecution = {
  id: string
  executionContextId: string
  productionOrderNo: string
  operationCode: string
  operationName: string
  department: string
  sequence: number
  status: OperationExecutionStatus
  workshopCode: string
  lineId: string | null
  plannedQty: number
  completedQty: number
  wasteQty: number
  reworkQty: number
  secondQualityQty: number
  waitingQty: number
  requiredGate: QualityGateType | null
  gatePassed: boolean
  standardMinutes: number
  actualMinutes: number
  startedAt: string | null
  completedAt: string | null
  pausedAt: string | null
  pauseReasonCode: string | null
}

export type BundleBarcodePayload = {
  formatVersion: typeof BUNDLE_BARCODE_FORMAT_VERSION
  style: string
  lot: string
  color: string
  size: string
  bundleSequence: number
  component: BundleComponentCode
  pieceCount: number
  productionOrderNo: string
  assemblyGroupId: string
}

export type Bundle = {
  id: string
  bundleNo: string
  barcode: string
  productionOrderNo: string
  executionContextId: string
  salesOrderId: string
  salesOrderNo: string
  productCode: string
  colorCode: string
  colorName: string
  sizeCode: string
  componentCode: BundleComponentCode
  pieceCount: number
  assemblyGroupId: string
  cuttingBatchRef: string | null
  fabricLotRef: string | null
  status: BundleStatus
  currentOperationCode: string | null
  currentWorkshopCode: string | null
  currentLineId: string | null
  createdAt: string
  labeledAt: string | null
  issuedAt: string | null
  completedAt: string | null
  metadata: Record<string, string | number | boolean>
}

export type BundleTicket = {
  id: string
  bundleId: string
  ticketVersion: number
  barcode: string
  formatVersion: typeof BUNDLE_BARCODE_FORMAT_VERSION
  payload: BundleBarcodePayload
  printedAt: string | null
  printedBy: string | null
  voided: boolean
}

export type WipPosition = {
  id: string
  executionContextId: string
  productionOrderNo: string
  operationCode: string
  bundleId: string | null
  workshopCode: string
  lineId: string | null
  machineId: string | null
  operatorId: string | null
  shiftCode: string | null
  quantity: number
  state: WipState
  startedAt: string | null
  waitingSince: string | null
  lastTransferId: string | null
  waitingReasonCode: string | null
  currentLocationCode: string | null
  currentQueuePosition: number | null
  estimatedReleaseTime: string | null
  updatedAt: string
}

export type OperationWorkSession = {
  id: string
  executionContextId: string
  productionOrderNo: string
  operationCode: string
  lineId: string
  workshopCode: string
  machineId: string
  operatorId: string
  shiftCode: string
  bundleIds: string[]
  startedAt: string
  endedAt: string | null
  status: OperationWorkSessionStatus
  plannedQty: number
  completedQty: number
  reworkQty: number
  rejectQty: number
  downtimeMinutes: number
}

export type WipTransfer = {
  id: string
  executionContextId: string
  productionOrderNo: string
  bundleId: string
  fromOperationCode: string
  toOperationCode: string
  quantity: number
  transferType: WipTransferType
  transferredAt: string
  transferredBy: string
  reasonCode: string | null
}

export type OperationDailyEntry = {
  id: string
  executionContextId: string
  productionOrderNo: string
  operationCode: string
  lineId: string
  operatorId: string
  machineId: string
  shiftCode: string
  bundleId: string | null
  entryDate: string
  planned: number
  produced: number
  reject: number
  rework: number
  secondQuality: number
  fire: number
  downtimeMinutes: number
  reasonCode: string | null
  posted: boolean
  recordedBy: string
  recordedAt: string
}

export type QualityGateEvaluation = {
  id: string
  executionContextId: string
  productionOrderNo: string
  operationCode: string
  gateType: QualityGateType
  bundleId: string | null
  disposition: QualityGateDisposition
  /** @deprecated disposition kullanın */
  result?: QualityGateResult
  inspectionId: string | null
  inspectionNo: string | null
  rejectQty: number
  reworkQty: number
  scrapQty: number
  secondQualityQty: number
  evaluatedAt: string
  evaluatedBy: string
  notes: string | null
}

export type SplitExecutionRecord = {
  id: string
  parentProductionOrderNo: string
  parentExecutionContextId: string
  childProductionOrderNo: string
  childExecutionContextId: string
  splitIndex: number
  splitOfTotal: number
  workshopCode: string
  plannedQty: number
  br11Applied: boolean
  createdAt: string
  createdBy: string
}

export type ExecutionTimelineEvent = {
  id: string
  executionContextId: string
  productionOrderNo: string
  eventType: ExecutionTimelineEventType
  title: string
  description: string
  occurredAt: string
  actor: string
  operationCode?: string
  bundleId?: string
  metadata?: Record<string, unknown>
}

export type ProductionCalendarSlot = {
  id: string
  productionOrderNo: string
  lineId: string
  lineCode: string
  operationCode: string
  slotDate: string
  hourStart: number
  hourEnd: number
  plannedQty: number
  actualQty: number
  status: 'Planned' | 'InProgress' | 'Completed' | 'Delayed'
}

/** Fire / duruş / red neden kodları — master data'ya taşınabilir */
export const EXECUTION_REASON_CODES = {
  FIRE: ['FABRIC-DEFECT', 'CUT-ERROR', 'NEEDLE-BREAK', 'OPERATOR-ERROR', 'MACHINE-FAULT'],
  PAUSE: ['MATERIAL-WAIT', 'MACHINE-BREAKDOWN', 'OPERATOR-ABSENT', 'QUALITY-HOLD', 'PLANNED-MAINTENANCE'],
  REJECT: ['STITCH-DEFECT', 'MEASUREMENT', 'COLOR-SHADE', 'STAIN', 'CONSTRUCTION'],
} as const

export type ShiftCode = 'SHIFT-1' | 'SHIFT-2' | 'SHIFT-3'

export const DEFAULT_BUNDLE_SIZE = 20

/** Execution Platform rolleri — authentication yok, yalnızca domain policy */
export type ExecutionRole =
  | 'Operator'
  | 'LineSupervisor'
  | 'Quality'
  | 'Cutting'
  | 'Planning'
  | 'Warehouse'
  | 'FactoryManager'
  | 'CEO'

export type ExecutionPermissionAction =
  | 'Create'
  | 'Update'
  | 'Approve'
  | 'Reject'
  | 'Split'
  | 'Cancel'
  | 'Close'

export type ExecutionResourceType =
  | 'Bundle'
  | 'Operation'
  | 'WorkSession'
  | 'QualityGate'
  | 'WipTransfer'
  | 'DailyEntry'
  | 'Split'
  | 'ExecutionContext'

/** Disposition → BR etkisi tanımı */
export type QualityDispositionBusinessRuleEffect = {
  disposition: QualityGateDisposition
  allowsDownstream: boolean
  triggersBR13: boolean
  blocksOperation: boolean
  bundleAction: 'None' | 'Hold' | 'ReworkRoute' | 'Scrap' | 'SecondQualityWarehouse' | 'Release'
  stockImpact: 'None' | 'ScrapLedger' | 'ReworkLedger' | 'SecondQualityLedger'
}

export const QUALITY_DISPOSITION_BR_EFFECTS: readonly QualityDispositionBusinessRuleEffect[] = [
  { disposition: 'Pending', allowsDownstream: false, triggersBR13: false, blocksOperation: true, bundleAction: 'Hold', stockImpact: 'None' },
  { disposition: 'Pass', allowsDownstream: true, triggersBR13: false, blocksOperation: false, bundleAction: 'Release', stockImpact: 'None' },
  { disposition: 'PassWithCondition', allowsDownstream: true, triggersBR13: false, blocksOperation: false, bundleAction: 'Release', stockImpact: 'None' },
  { disposition: 'Hold', allowsDownstream: false, triggersBR13: false, blocksOperation: true, bundleAction: 'Hold', stockImpact: 'None' },
  { disposition: 'Rework', allowsDownstream: false, triggersBR13: true, blocksOperation: true, bundleAction: 'ReworkRoute', stockImpact: 'ReworkLedger' },
  { disposition: 'Reject', allowsDownstream: false, triggersBR13: false, blocksOperation: true, bundleAction: 'Hold', stockImpact: 'None' },
  { disposition: 'Scrap', allowsDownstream: false, triggersBR13: false, blocksOperation: true, bundleAction: 'Scrap', stockImpact: 'ScrapLedger' },
  { disposition: 'SecondQuality', allowsDownstream: true, triggersBR13: false, blocksOperation: false, bundleAction: 'SecondQualityWarehouse', stockImpact: 'SecondQualityLedger' },
] as const

export function normalizeQualityDisposition(raw: QualityGateResult): QualityGateDisposition {
  if (raw === 'Fail') return 'Reject'
  if (raw === 'Waived') return 'PassWithCondition'
  return raw
}

export function getQualityDispositionEffect(
  disposition: QualityGateDisposition,
): QualityDispositionBusinessRuleEffect {
  return (
    QUALITY_DISPOSITION_BR_EFFECTS.find((e) => e.disposition === disposition) ??
    QUALITY_DISPOSITION_BR_EFFECTS[0]
  )
}
