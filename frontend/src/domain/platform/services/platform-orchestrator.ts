/**
 * Platform Orchestrator — bağımsız servisleri birbirine bağlayan ince katman.
 * UI bu servisi veya alt servisleri doğrudan çağırır.
 */
import { logApprove, logCreate } from './audit-service'
import { recordFromDomainEvent } from './ai-memory-service'
import { approveStep, submitForApproval } from './approval-service'
import { subscribe, publishEvent, type PublishEventInput } from './event-bus'
import { buildTimelineFromDomainEvent } from './timeline-service'
import { activateRevision, createRevision } from './versioning-service'
import { notifyWatchers } from './watcher-service'
import type { AuditContext } from './audit-service'
import type { DomainEvent } from '../types'

let wired = false

export function wirePlatformServices(): void {
  if (wired) return
  wired = true

  subscribe('*', (event: DomainEvent) => {
    recordFromDomainEvent(event)

    if (event.aggregateType === 'SalesOrder' && event.aggregateNo) {
      buildTimelineFromDomainEvent(
        event.aggregateId,
        event.aggregateNo,
        event.type,
        event.payload.description as string ?? event.type,
        event.causedBy,
        event.payload,
      )

      notifyWatchers(
        'SalesOrder',
        event.aggregateId,
        event.aggregateNo,
        `${event.type}: ${event.payload.description ?? ''}`,
      )
    }
  })
}

export function platformPublish(input: PublishEventInput, audit?: AuditContext): DomainEvent {
  wirePlatformServices()
  const event = publishEvent(input)
  if (audit) {
    logCreate(input.aggregateType, input.aggregateId, audit, {
      eventType: input.type,
      ...input.payload,
    })
  }
  return event
}

export function platformSubmitBomApproval(
  entityId: string,
  entityKey: string,
  submittedBy: string,
  audit: AuditContext,
) {
  wirePlatformServices()
  const workflow = submitForApproval({
    workflowType: 'BOM',
    entityType: 'BOM',
    entityId,
    entityKey,
    submittedBy,
  })
  logCreate('ApprovalWorkflow', workflow.id, audit, { workflowType: 'BOM', entityKey })
  platformPublish({
    type: 'ApprovalSubmitted',
    aggregateType: 'BOM',
    aggregateId: entityId,
    payload: { workflowId: workflow.id, entityKey },
    causedBy: submittedBy,
  })
  return workflow
}

export function platformApproveBomStep(
  workflowId: string,
  actedBy: string,
  audit: AuditContext,
  comment?: string,
) {
  wirePlatformServices()
  const workflow = approveStep(workflowId, actedBy, comment)
  if (!workflow) return null

  logApprove('ApprovalWorkflow', workflowId, audit, { step: workflow.currentStepIndex, status: workflow.status })

  if (workflow.status === 'Approved') {
    platformPublish({
      type: 'BomApproved',
      aggregateType: 'BOM',
      aggregateId: workflow.entityId,
      payload: { entityKey: workflow.entityKey, workflowId },
      causedBy: actedBy,
    })
    platformPublish({
      type: 'ApprovalCompleted',
      aggregateType: 'BOM',
      aggregateId: workflow.entityId,
      payload: { workflowId },
      causedBy: actedBy,
    })
  }
  return workflow
}

export function platformActivateRevision(
  recordId: string,
  approvedBy: string,
  audit: AuditContext,
) {
  wirePlatformServices()
  const record = activateRevision({ recordId, approvedBy })
  if (!record) return null

  logApprove(record.entityType, record.entityKey, audit, {
    revisionNo: record.revision.revisionNo,
    version: record.revision.version,
  })

  platformPublish({
    type: 'RevisionActivated',
    aggregateType: record.entityType,
    aggregateId: record.entityKey,
    payload: {
      revisionNo: record.revision.revisionNo,
      version: record.revision.version,
      recordId: record.id,
    },
    causedBy: approvedBy,
  })
  return record
}

export function platformCreateRevision<T extends Record<string, unknown>>(
  input: Parameters<typeof createRevision<T>>[0],
  audit: AuditContext,
) {
  wirePlatformServices()
  const record = createRevision(input)
  logCreate(input.entityType, input.entityKey, audit, {
    revisionNo: record.revision.revisionNo,
    version: record.revision.version,
    status: record.revision.status,
  })
  return record
}

export { wirePlatformServices as initPlatform }
