import { DEFAULT_TENANT_ID } from '@/domain/ports/persistence/persistence-registry'
import { masterDataBrainChanges } from '../master-data-port-access'
import { scheduleMasterDataBrainChange } from '../../platform/services/outbox-scheduler'
import type { MasterDataBrainChangeEvent } from './types'

function brainChangesRepo() {
  return masterDataBrainChanges()
}

/** Command path — schedule brain feed update via outbox (TX dışı worker). */
export function publishMasterDataBrainEvent(event: MasterDataBrainChangeEvent): void {
  scheduleMasterDataBrainChange(event)
}

/** Outbox worker only — write to brain change stream. */
export function publishMasterDataBrainEventToStream(event: MasterDataBrainChangeEvent): void {
  brainChangesRepo().publish(DEFAULT_TENANT_ID, event)
}

export function getMasterDataBrainChangeFeed(limit = 50): MasterDataBrainChangeEvent[] {
  return brainChangesRepo().getFeed(DEFAULT_TENANT_ID, limit)
}

export function getMasterDataBrainGraphNodes(): Array<{ id: string; label: string; type: string }> {
  return brainChangesRepo().getFeed(DEFAULT_TENANT_ID, 200).map((e) => ({
    id: `${e.entityType}:${e.entityId}`,
    label: e.entityCode,
    type: e.entityType,
  }))
}

export function seedBrainChangeEvents(events: MasterDataBrainChangeEvent[]): void {
  brainChangesRepo().seedFromLegacy(DEFAULT_TENANT_ID, events)
}

export function countBrainIntegration(): { events: number } {
  return { events: brainChangesRepo().getAll(DEFAULT_TENANT_ID).length }
}
