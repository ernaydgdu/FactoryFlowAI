/**
 * Production Planning — yazma yolu (Planning ↔ UE entegrasyonu).
 * Yeni aggregate açmaz: mevcut IProductionOrderRepository üzerindeki
 * üretim emrinin plan alanlarını (plannedStart / plannedFinish / hat)
 * audit + timeline + outbox konvansiyonlarıyla günceller.
 */
import { productionLineRepository, workshopRepository } from '@/domain/master-data'
import { logUpdate, type AuditContext } from '@/domain/platform/services/audit-service'
import { scheduleWatcherNotification } from '@/domain/platform/services/outbox-scheduler'
import { addTimelineEntry } from '@/domain/platform/services/timeline-service'
import { saveLifecycleRecord } from '@/domain/production-order/lifecycle-persistence'
import type { ProductionOrderLifecycleRecord } from '@/domain/production-order/lifecycle-types'
import { queryProductionOrderByNo } from '@/domain/production-order/production-order-query.service'

import type { ReschedulePlanInput } from './planning.types'

export class PlanningDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PlanningDomainError'
  }
}

const LOCKED_STATUSES: ProductionOrderLifecycleRecord['status'][] = ['Completed', 'Closed', 'Cancelled']

function auditContext(actor: string): AuditContext {
  return { changedBy: actor, ip: '127.0.0.1', machine: 'planning-crud-service' }
}

export function persistReschedulePlan(
  input: ReschedulePlanInput,
  actor: string,
): ProductionOrderLifecycleRecord {
  if (!input.plannedStart || !input.plannedFinish) {
    throw new PlanningDomainError('Plan başlangıç ve bitiş tarihleri zorunludur.')
  }
  if (input.plannedStart > input.plannedFinish) {
    throw new PlanningDomainError('Plan başlangıcı bitişten sonra olamaz.')
  }

  const record = queryProductionOrderByNo(input.productionOrderNo)
  if (!record) throw new PlanningDomainError(`Üretim emri bulunamadı: ${input.productionOrderNo}`)
  if (LOCKED_STATUSES.includes(record.status)) {
    throw new PlanningDomainError(`${record.status} durumundaki emir yeniden planlanamaz.`)
  }

  const oldValue = {
    plannedStart: record.snapshots.planning.plannedStart,
    plannedFinish: record.plannedFinish,
    lineCode: record.productionLineCode,
  }

  if (input.lineCode && input.lineCode !== record.productionLineCode) {
    const line = productionLineRepository.getByCode(input.lineCode)
    if (!line) throw new PlanningDomainError(`Hat bulunamadı: ${input.lineCode}`)
    record.productionLineId = line.id
    record.productionLineCode = line.code
    record.productionLineName = line.name
    const workshop = workshopRepository.getAll().find((w) => w.id === line.workshopId)
    if (workshop) {
      record.workshopId = workshop.id
      record.workshopCode = workshop.code
      record.workshopName = workshop.name
    }
    record.snapshots.planning.lineCode = line.code
    if (workshop) record.snapshots.planning.workshopCode = workshop.code
  }

  record.snapshots.planning.plannedStart = input.plannedStart
  record.snapshots.planning.plannedFinish = input.plannedFinish
  record.plannedFinish = input.plannedFinish
  record.updatedAt = new Date().toISOString()

  const newValue = {
    plannedStart: input.plannedStart,
    plannedFinish: input.plannedFinish,
    lineCode: record.productionLineCode,
  }

  logUpdate('ProductionOrder', record.id, auditContext(actor), oldValue, newValue)
  addTimelineEntry({
    orderId: record.salesOrderId,
    orderNo: record.salesOrderNo,
    eventType: 'StatusChanged',
    description: `[${record.productionOrderNo}] Yeniden planlandı: ${input.plannedStart} → ${input.plannedFinish} (${record.productionLineCode})`,
    actor,
    metadata: { productionOrderNo: record.productionOrderNo, plannedStart: input.plannedStart, plannedFinish: input.plannedFinish },
  })
  scheduleWatcherNotification({
    entityType: 'ProductionOrder',
    entityId: record.id,
    entityNo: record.productionOrderNo,
    description: `Plan güncellendi: ${input.plannedStart} → ${input.plannedFinish}`,
    causedBy: actor,
  })
  saveLifecycleRecord(record)
  return record
}
