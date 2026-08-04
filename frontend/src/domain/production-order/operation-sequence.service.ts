/**
 * Operation Sequence — UE operasyon rotası read-model'i.
 * Snapshot'taki operationRoute üzerinden ilerleme türetir; adım durumu
 * üretim ilerlemesinden (producedQty / plannedQty) hesaplanır.
 */
import type { ProductionOrderLifecycleRecord } from './lifecycle-types'
import { queryProductionOrderByNo } from './production-order-query.service'

export type OperationStepStatus = 'Completed' | 'InProgress' | 'Pending'

export type OperationSequenceStep = {
  sequence: number
  code: string
  name: string
  workshopCode: string
  status: OperationStepStatus
}

export function deriveOperationSequence(record: ProductionOrderLifecycleRecord): OperationSequenceStep[] {
  const route = record.snapshots.operationRoute
  if (route.length === 0) return []

  const progress = record.plannedQty > 0 ? record.producedQty / record.plannedQty : 0
  const isActive = record.status === 'In Production' || record.status === 'Paused'
  const isDone = record.status === 'Completed' || record.status === 'Closed'
  const completedSteps = isDone ? route.length : Math.floor(progress * route.length)

  return route
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map((op, index) => ({
      sequence: op.sequence,
      code: op.code,
      name: op.name,
      workshopCode: op.workshopCode,
      status:
        index < completedSteps
          ? 'Completed'
          : index === completedSteps && isActive
            ? 'InProgress'
            : 'Pending',
    }))
}

export function getOperationSequence(productionOrderNo: string): OperationSequenceStep[] {
  const record = queryProductionOrderByNo(productionOrderNo)
  if (!record) return []
  return deriveOperationSequence(record)
}

export function validateOperationSequence(steps: { sequence: number }[]): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const sorted = steps.map((s) => s.sequence).sort((a, b) => a - b)
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i] !== i + 1) {
      errors.push(`Operasyon sırası bitişik değil: beklenen ${i + 1}, bulunan ${sorted[i]}.`)
      break
    }
  }
  return { valid: errors.length === 0, errors }
}
