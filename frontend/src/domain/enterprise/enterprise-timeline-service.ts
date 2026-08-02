/**
 * Enterprise lifecycle timeline — kim/ne/ne zaman/neden + BR/approval/brain
 */
import { getOrderTimeline, getAllTimelineEntries } from '../platform/services/timeline-service'
import { getAuditTrail } from '../platform/services/audit-service'
import { BUSINESS_RULES } from '../services/business-rule-engine'
import { DEFAULT_TENANT_ID, enterpriseTimelineRepo } from '../platform/platform-persistence-access'
import type { EnterpriseEntityType, EnterpriseTimelineEntry } from './types'
import { buildEnterpriseRelationGraphForOrder } from './relation-graph-service'

export function getEnterpriseTimeline(
  entityType: EnterpriseEntityType,
  entityId: string,
): EnterpriseTimelineEntry[] {
  const seeded = enterpriseTimelineRepo().findByEntity(DEFAULT_TENANT_ID, entityType, entityId)

  if (entityType === 'SALES_ORDER') {
    const platform = getOrderTimeline(entityId).map((t) => ({
      id: t.id,
      entityType: 'SALES_ORDER' as const,
      entityId,
      entityCode: t.orderNo,
      occurredAt: t.occurredAt,
      actor: t.actor,
      action: t.eventType,
      reason: t.description,
      metadata: t.metadata,
    }))
    return [...seeded, ...platform].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  }

  const audit = getAuditTrail(`MasterData:${entityType}`, entityId).map((a) => ({
    id: a.id,
    entityType,
    entityId,
    entityCode: entityId,
    occurredAt: a.changedAt,
    actor: a.changedBy,
    action: a.action,
    oldValue: a.oldValue ?? undefined,
    newValue: a.newValue ?? undefined,
    reason: a.description,
  }))

  return [...seeded, ...audit].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}

export function appendEnterpriseTimelineEntry(entry: EnterpriseTimelineEntry): void {
  enterpriseTimelineRepo().prepend(DEFAULT_TENANT_ID, entry)
}

export function enrichTimelineWithBusinessRules(orderId: string): EnterpriseTimelineEntry[] {
  const timeline = getEnterpriseTimeline('SALES_ORDER', orderId)
  const enriched: EnterpriseTimelineEntry[] = []

  for (const entry of timeline) {
    enriched.push(entry)
    if (entry.action === 'OrderOpened' || entry.action === 'CREATE') {
      for (const rule of BUSINESS_RULES.slice(0, 3)) {
        enriched.push({
          id: `${entry.id}-${rule.id}`,
          entityType: 'SALES_ORDER',
          entityId: orderId,
          entityCode: entry.entityCode,
          occurredAt: entry.occurredAt,
          actor: 'system',
          action: 'BUSINESS_RULE',
          businessRuleId: rule.id,
          reason: rule.invariant,
        })
      }
    }
  }
  return enriched
}

export function countTimelineCoverage(): { entries: number; withBusinessRule: number; withApproval: number; withBrain: number } {
  const all = [...enterpriseTimelineRepo().findAll(DEFAULT_TENANT_ID), ...getAllTimelineEntries().map((t) => ({
    id: t.id,
    entityType: 'SALES_ORDER' as const,
    entityId: t.orderId,
    entityCode: t.orderNo,
    occurredAt: t.occurredAt,
    actor: t.actor,
    action: t.eventType,
  }))]
  return {
    entries: all.length,
    withBusinessRule: all.filter((e) => 'businessRuleId' in e && e.businessRuleId).length,
    withApproval: all.filter((e) => 'approvalId' in e && e.approvalId).length,
    withBrain: all.filter((e) => 'brainSuggestionId' in e && e.brainSuggestionId).length,
  }
}

export function getOrderLifecycleGraph(orderId: string) {
  return buildEnterpriseRelationGraphForOrder(orderId)
}
