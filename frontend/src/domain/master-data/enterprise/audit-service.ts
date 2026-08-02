import { getAuditTrail, logCreate, logUpdate, type AuditContext } from '../../platform/services/audit-service'
import type { MasterDataChangeRecord } from './types'
import type { MasterDataEntityType } from '../types'

const changeStore: MasterDataChangeRecord[] = []
let changeCounter = 0

function nextChangeId(): string {
  changeCounter += 1
  return `mdc-${String(changeCounter).padStart(6, '0')}`
}

export function recordMasterDataCreate(
  entityType: MasterDataEntityType,
  entity: Record<string, unknown>,
  context: AuditContext,
): MasterDataChangeRecord {
  const entityId = String(entity.id ?? '')
  const entityCode = String(entity.code ?? '')
  logCreate(`MasterData:${entityType}`, entityId, context, entity)
  const record: MasterDataChangeRecord = {
    id: nextChangeId(),
    entityType,
    entityId,
    entityCode,
    action: 'CREATE',
    oldValue: null,
    newValue: entity,
    version: Number(entity.version ?? 1),
    changedBy: context.changedBy,
    changedAt: new Date().toISOString(),
  }
  changeStore.push(record)
  return record
}

export function recordMasterDataUpdate(
  entityType: MasterDataEntityType,
  entityId: string,
  entityCode: string,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
  context: AuditContext,
): MasterDataChangeRecord {
  logUpdate(`MasterData:${entityType}`, entityId, context, oldValue, newValue)
  const record: MasterDataChangeRecord = {
    id: nextChangeId(),
    entityType,
    entityId,
    entityCode,
    action: 'UPDATE',
    oldValue,
    newValue,
    version: Number(newValue.version ?? 1),
    changedBy: context.changedBy,
    changedAt: new Date().toISOString(),
  }
  changeStore.push(record)
  return record
}

export function getMasterDataChangeHistory(entityType: MasterDataEntityType, entityId: string): MasterDataChangeRecord[] {
  return changeStore.filter((c) => c.entityType === entityType && c.entityId === entityId)
}

export function getMasterDataAuditTrail(entityType: MasterDataEntityType, entityId: string) {
  return getAuditTrail(`MasterData:${entityType}`, entityId)
}

export function countAuditCoverage(): { changes: number; withOldNewValues: number } {
  return {
    changes: changeStore.length,
    withOldNewValues: changeStore.filter((c) => c.oldValue && c.newValue).length,
  }
}

export function seedMasterDataChanges(records: MasterDataChangeRecord[]): void {
  changeStore.length = 0
  changeStore.push(...records)
  changeCounter = records.length
}
