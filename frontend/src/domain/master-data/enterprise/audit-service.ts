import { DEFAULT_TENANT_ID } from '@/domain/ports/persistence/persistence-registry'
import { runDomainCommandInTransaction } from '@/domain/ports/persistence/command-transaction.port'
import { getAuditTrail, logCreate, logUpdate, type AuditContext } from '../../platform/services/audit-service'
import { masterDataChanges } from '../master-data-port-access'
import type { MasterDataChangeRecord } from './types'
import type { MasterDataEntityType } from '../types'

function changesRepo() {
  return masterDataChanges()
}

export function recordMasterDataCreate(
  entityType: MasterDataEntityType,
  entity: Record<string, unknown>,
  context: AuditContext,
): MasterDataChangeRecord {
  return runDomainCommandInTransaction(() =>
    recordMasterDataCreateInternal(entityType, entity, context),
  )
}

function recordMasterDataCreateInternal(
  entityType: MasterDataEntityType,
  entity: Record<string, unknown>,
  context: AuditContext,
): MasterDataChangeRecord {
  const entityId = String(entity.id ?? '')
  const entityCode = String(entity.code ?? '')
  logCreate(`MasterData:${entityType}`, entityId, context, entity)
  const record: MasterDataChangeRecord = {
    id: changesRepo().nextChangeId(DEFAULT_TENANT_ID),
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
  changesRepo().append(DEFAULT_TENANT_ID, record)
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
  return runDomainCommandInTransaction(() =>
    recordMasterDataUpdateInternal(entityType, entityId, entityCode, oldValue, newValue, context),
  )
}

function recordMasterDataUpdateInternal(
  entityType: MasterDataEntityType,
  entityId: string,
  entityCode: string,
  oldValue: Record<string, unknown>,
  newValue: Record<string, unknown>,
  context: AuditContext,
): MasterDataChangeRecord {
  logUpdate(`MasterData:${entityType}`, entityId, context, oldValue, newValue)
  const record: MasterDataChangeRecord = {
    id: changesRepo().nextChangeId(DEFAULT_TENANT_ID),
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
  changesRepo().append(DEFAULT_TENANT_ID, record)
  return record
}

export function getMasterDataChangeHistory(entityType: MasterDataEntityType, entityId: string): MasterDataChangeRecord[] {
  return changesRepo().findByEntity(DEFAULT_TENANT_ID, entityType, entityId)
}

export function getMasterDataAuditTrail(entityType: MasterDataEntityType, entityId: string) {
  return getAuditTrail(`MasterData:${entityType}`, entityId)
}

export function countAuditCoverage(): { changes: number; withOldNewValues: number } {
  const all = changesRepo().findAll(DEFAULT_TENANT_ID)
  return {
    changes: all.length,
    withOldNewValues: all.filter((c) => c.oldValue && c.newValue).length,
  }
}

export function seedMasterDataChanges(records: MasterDataChangeRecord[]): void {
  changesRepo().seedFromLegacy(DEFAULT_TENANT_ID, records)
}
