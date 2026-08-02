import { getAllRevisions } from '../../platform/services/versioning-service'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const versioningAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'VERSIONING',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(_context: BrainContext): BrainKnowledgeFragment {
    const revisions = getAllRevisions()
    const active = revisions.filter((r) => r.revision.status === 'Active')

    return {
      sourceId: 'VERSIONING',
      fetchedAt: new Date().toISOString(),
      entityKeys: revisions.map((r) => r.id),
      summary: `${revisions.length} revizyon, ${active.length} aktif`,
      recordCount: revisions.length,
      payload: {
        revisions: revisions.map((r) => ({
          id: r.id,
          entityType: r.entityType,
          entityKey: r.entityKey,
          version: r.revision.version,
          status: r.revision.status,
        })),
      },
    }
  },
}
