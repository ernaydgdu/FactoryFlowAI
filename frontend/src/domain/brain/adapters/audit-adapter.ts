import { getAllAuditLogs, getAuditTrail } from '../../platform/services/audit-service'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const auditAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'AUDIT',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(context: BrainContext): BrainKnowledgeFragment {
    const entityId = context.scope.entityId
    const entityType = context.scope.entityType ?? 'SalesOrder'
    const logs = entityId ? getAuditTrail(entityType, entityId) : getAllAuditLogs()

    return {
      sourceId: 'AUDIT',
      fetchedAt: new Date().toISOString(),
      entityKeys: [...new Set(logs.map((l) => l.entityId))],
      summary: `${logs.length} audit kaydı`,
      recordCount: logs.length,
      payload: {
        recentActions: logs.slice(-20).map((l) => ({
          entityId: l.entityId,
          action: l.action,
          changedBy: l.changedBy,
          changedAt: l.changedAt,
        })),
      },
    }
  },
}
