import { DEFAULT_TENANT_ID } from '@/domain/ports/persistence/persistence-registry'
import { scheduleMasterDataBrainChange } from '@/domain/platform/services/outbox-scheduler'
import type { AuditContext } from '@/domain/platform/services/audit-service'
import type { BaseMasterEntity } from './types'
import { appendMasterDataChangeRecord } from './enterprise/audit-service'
import { invalidateMasterDataRepositoryCache } from './master-data-cache'
import {
  MASTER_DATA_CRUD_REGISTRY,
  type MasterDataCrudEntityKey,
} from './master-data-crud.registry'
import { masterDataLookups } from './master-data-port-access'
import type { IMasterDataLookupRepository } from '@/domain/ports/persistence/lookups/master-data-lookup.repository'

export class MasterDataDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MasterDataDomainError'
  }
}

function configFor(entityKey: MasterDataCrudEntityKey) {
  return MASTER_DATA_CRUD_REGISTRY[entityKey]
}

function lookupRepo(entityKey: MasterDataCrudEntityKey): IMasterDataLookupRepository<BaseMasterEntity> {
  const { lookupKey } = configFor(entityKey)
  return masterDataLookups()[lookupKey] as IMasterDataLookupRepository<BaseMasterEntity>
}

function assertValid(entityKey: MasterDataCrudEntityKey, entity: Partial<BaseMasterEntity>): void {
  const result = configFor(entityKey).validate(entity)
  if (!result.valid) {
    throw new MasterDataDomainError(result.errors.join(', '))
  }
}

function assertCodeUnique(
  repo: IMasterDataLookupRepository<BaseMasterEntity>,
  code: string,
  excludeId?: string,
): void {
  const existing = repo.getByCode(DEFAULT_TENANT_ID, code.trim())
  if (existing && existing.id !== excludeId) {
    throw new MasterDataDomainError(`Kod zaten kullanılıyor: ${code}`)
  }
}

function assertVersion(existing: BaseMasterEntity, expectedVersion: number): void {
  if (existing.version !== expectedVersion) {
    throw new MasterDataDomainError(
      `Versiyon uyuşmazlığı. Beklenen: ${expectedVersion}, mevcut: ${existing.version}`,
    )
  }
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function publishBrainEvent(
  entityKey: MasterDataCrudEntityKey,
  entity: BaseMasterEntity,
  changeType: 'created' | 'updated' | 'activated',
): void {
  const { entityType } = configFor(entityKey)
  scheduleMasterDataBrainChange({
    entityType,
    entityId: entity.id,
    entityCode: entity.code,
    changeType,
    summary: `${configFor(entityKey).label} ${changeType}: ${entity.code}`,
    occurredAt: new Date().toISOString(),
  })
}

export function queryMasterDataList(entityKey: MasterDataCrudEntityKey): BaseMasterEntity[] {
  return lookupRepo(entityKey).getAll(DEFAULT_TENANT_ID)
}

export function queryMasterDataById(
  entityKey: MasterDataCrudEntityKey,
  id: string,
): BaseMasterEntity | null {
  return lookupRepo(entityKey).getById(DEFAULT_TENANT_ID, id) ?? null
}

export function persistCreateMasterDataEntity(
  entityKey: MasterDataCrudEntityKey,
  input: Record<string, unknown>,
  actorUserId: string,
): BaseMasterEntity {
  const config = configFor(entityKey)
  const repo = lookupRepo(entityKey)
  const now = new Date().toISOString()

  const draft = config.create({
    ...input,
    createdBy: actorUserId,
    updatedBy: actorUserId,
    createdAt: now,
    updatedAt: now,
    isActive: true,
    status: 'Active',
    version: 1,
  })

  assertValid(entityKey, draft)
  assertCodeUnique(repo, draft.code)

  const saved = repo.save(DEFAULT_TENANT_ID, draft)
  appendMasterDataChangeRecord(
    config.entityType,
    'CREATE',
    null,
    saved as unknown as Record<string, unknown>,
    auditContext(actorUserId),
  )
  publishBrainEvent(entityKey, saved, 'created')
  invalidateMasterDataRepositoryCache(entityKey)
  return saved
}

export function persistUpdateMasterDataEntity(
  entityKey: MasterDataCrudEntityKey,
  id: string,
  input: Record<string, unknown>,
  expectedVersion: number,
  actorUserId: string,
): BaseMasterEntity {
  const config = configFor(entityKey)
  const repo = lookupRepo(entityKey)
  const existing = repo.getById(DEFAULT_TENANT_ID, id)

  if (!existing) {
    throw new MasterDataDomainError('Kayıt bulunamadı.')
  }

  assertVersion(existing, expectedVersion)

  const merged = {
    ...existing,
    ...input,
    id: existing.id,
    updatedBy: actorUserId,
    updatedAt: new Date().toISOString(),
    version: existing.version + 1,
  } as BaseMasterEntity

  if (typeof input.code === 'string' && input.code !== existing.code) {
    assertCodeUnique(repo, input.code, existing.id)
  }

  assertValid(entityKey, merged)

  const saved = repo.save(DEFAULT_TENANT_ID, merged)
  appendMasterDataChangeRecord(
    config.entityType,
    'UPDATE',
    existing as unknown as Record<string, unknown>,
    saved as unknown as Record<string, unknown>,
    auditContext(actorUserId),
  )
  publishBrainEvent(entityKey, saved, 'updated')
  invalidateMasterDataRepositoryCache(entityKey)
  return saved
}

export function persistDeactivateMasterDataEntity(
  entityKey: MasterDataCrudEntityKey,
  id: string,
  expectedVersion: number,
  actorUserId: string,
): BaseMasterEntity {
  const existing = lookupRepo(entityKey).getById(DEFAULT_TENANT_ID, id)
  if (!existing) {
    throw new MasterDataDomainError('Kayıt bulunamadı.')
  }

  return persistUpdateMasterDataEntity(
    entityKey,
    id,
    { isActive: false, status: 'Inactive' },
    expectedVersion,
    actorUserId,
  )
}

export function persistReactivateMasterDataEntity(
  entityKey: MasterDataCrudEntityKey,
  id: string,
  expectedVersion: number,
  actorUserId: string,
): BaseMasterEntity {
  const existing = lookupRepo(entityKey).getById(DEFAULT_TENANT_ID, id)
  if (!existing) {
    throw new MasterDataDomainError('Kayıt bulunamadı.')
  }

  const reactivated = persistUpdateMasterDataEntity(
    entityKey,
    id,
    { isActive: true, status: 'Active' },
    expectedVersion,
    actorUserId,
  )
  return reactivated
}
