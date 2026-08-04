/**
 * Shop Floor Execution (MES) — domain tipleri.
 * Work Session / Operation Execution / Bundle / WIP tipleri mevcut
 * execution-platform domain'inde yaşar; burada yalnızca MES'e özgü
 * deklarasyon, tamamlama onayı ve makine/işçilik read-model tipleri var.
 */

export type ProductionDeclarationInput = {
  productionOrderNo: string
  operationCode: string
  lineId: string
  operatorId: string
  machineId: string
  shiftCode: string
  entryDate: string
  planned: number
  produced: number
  reject: number
  rework: number
  secondQuality: number
  fire: number
  downtimeMinutes: number
  reasonCode?: string | null
}

export type ProductionDeclarationResult = {
  productionOrderNo: string
  operationEntryId: string
  /** UE toplam üretilen (deklarasyon sonrası) */
  producedQtyTotal: number
  remainingQty: number
}

export type CompletionConfirmationResult = {
  productionOrderNo: string
  status: string
  producedQty: number
  finishedGoodsMovementNo: string | null
  finishedGoodsWarehouseCode: string | null
}

export type MachineRuntimeStatus = 'Running' | 'Paused' | 'Idle'

export type MachineStatusView = {
  machineId: string
  machineName: string
  machineType: string
  lineCode: string
  status: MachineRuntimeStatus
  activeProductionOrderNo: string | null
  activeOperationCode: string | null
  activeOperatorId: string | null
  completedQtyToday: number
  downtimeMinutes: number
}

export type LaborTrackingView = {
  operatorId: string
  operatorName: string
  department: string
  status: MachineRuntimeStatus
  activeProductionOrderNo: string | null
  activeOperationCode: string | null
  activeMachineId: string | null
  sessionCount: number
  totalCompletedQty: number
  totalReworkQty: number
  totalRejectQty: number
  totalDowntimeMinutes: number
}
