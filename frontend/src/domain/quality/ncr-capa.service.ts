/**
 * NCR (derived from Reject/Hold/Scrap gate evaluations) + CAPA skeleton
 * (plan-only, no persistence mutation).
 */
import { getAllExecutionContexts } from '@/domain/execution-platform/execution-platform-service'
import { getGateEvaluations } from '@/domain/execution-platform/quality-gate-service'
import { getAllExecutionTimelineEvents } from '@/domain/execution-platform/execution-timeline-service'

import type { CapaPlan, NcrRecord } from './quality.types'

const NCR_DISPOSITIONS = new Set(['Reject', 'Hold', 'Scrap'])

export function listNcrRecords(): NcrRecord[] {
  return getAllExecutionContexts().flatMap((ctx) =>
    getGateEvaluations(ctx.productionOrderNo)
      .filter((e) => NCR_DISPOSITIONS.has(e.disposition))
      .map((e) => {
        const reworkDone = getAllExecutionTimelineEvents().some(
          (ev) =>
            ev.productionOrderNo === e.productionOrderNo &&
            ev.eventType === 'ReworkCompleted' &&
            ev.operationCode === e.operationCode,
        )
        return {
          id: `NCR-${e.id}`,
          productionOrderNo: e.productionOrderNo,
          operationCode: e.operationCode,
          gateType: e.gateType,
          disposition: e.disposition,
          bundleId: e.bundleId,
          evaluationId: e.id,
          openedAt: e.evaluatedAt,
          openedBy: e.evaluatedBy,
          status: reworkDone && e.disposition === 'Rework' ? ('Closed' as const) : ('Open' as const),
          notes: e.notes,
        }
      }),
  )
}

export function getNcrById(ncrId: string): NcrRecord | null {
  return listNcrRecords().find((n) => n.id === ncrId) ?? null
}

/** CAPA iskeleti — yalnızca öneri üretir, persist etmez. */
export function planCapaForNcr(ncrId: string, owner?: string, dueDate?: string): CapaPlan {
  const ncr = listNcrRecords().find((n) => n.id === ncrId)
  const errors: string[] = []
  if (!ncr) errors.push(`NCR bulunamadı: ${ncrId}`)
  if (ncr && ncr.status === 'Closed') errors.push('Kapalı NCR için CAPA açılamaz.')

  const proposedActions = ncr
    ? [
        `Kök neden analizi — ${ncr.disposition} @ ${ncr.operationCode}`,
        `Düzeltici aksiyon (operasyon: ${ncr.operationCode})`,
        `Önleyici kontrol — ${ncr.gateType} gate prosedürü gözden geçir`,
      ]
    : []

  return {
    ncrId,
    proposedActions,
    owner: owner ?? null,
    dueDate: dueDate ?? null,
    valid: errors.length === 0,
    errors,
  }
}
