import { aiMemoryCollectionInMemory } from '../in-memory/collections/ai-memory-collection.in-memory.repository'
import { attachmentCollectionInMemory } from '../in-memory/collections/attachment-collection.in-memory.repository'
import { commentCollectionInMemory } from '../in-memory/collections/comment-collection.in-memory.repository'
import { enterpriseTimelineCollectionInMemory } from '../in-memory/collections/enterprise-timeline-collection.in-memory.repository'
import { entityTagCollectionInMemory } from '../in-memory/collections/entity-tag-collection.in-memory.repository'
import { humanFeedbackCollectionInMemory } from '../in-memory/collections/human-feedback-collection.in-memory.repository'
import {
  watcherCollectionInMemory,
  watcherNotificationCollectionInMemory,
} from '../in-memory/collections/watcher-collection.in-memory.repository'
import { masterDataApprovalInMemory } from '../in-memory/aggregates/master-data-approval.in-memory.repository'
import { masterDataLookupRegistryInMemory } from '../in-memory/lookups/master-data-lookup-registry.in-memory'
import { masterDataEnterpriseConfigInMemory } from '../in-memory/lookups/master-data-enterprise-config.in-memory'
import { brainDecisionMemoryInMemory } from '../in-memory/streams/brain-decision-memory.in-memory.stream.repository'
import { masterDataBrainChangeStreamInMemory } from '../in-memory/streams/master-data-brain-change-stream.in-memory.repository'
import { masterDataChangeStreamInMemory } from '../in-memory/streams/master-data-change-stream.in-memory.repository'
import { productionCalendarInMemory } from '../in-memory/read-models/production-calendar.in-memory.read-model'
import { createStoreSnapshot, restoreStoreSnapshot, type StoreSnapshot } from './store-snapshot'
import { inMemoryStoreRegistry } from '../in-memory/in-memory-unit-of-work'

export type PersistenceSnapshot = {
  store: StoreSnapshot
  masterDataLookups: ReturnType<typeof masterDataLookupRegistryInMemory.captureSnapshot>
  masterDataEnterpriseConfig: ReturnType<typeof masterDataEnterpriseConfigInMemory.captureSnapshot>
  masterDataApprovals: ReturnType<typeof masterDataApprovalInMemory.captureSnapshot>
  masterDataChanges: ReturnType<typeof masterDataChangeStreamInMemory.captureSnapshot>
  masterDataBrainChanges: ReturnType<typeof masterDataBrainChangeStreamInMemory.captureSnapshot>
  brainDecisionMemory: ReturnType<typeof brainDecisionMemoryInMemory.captureSnapshot>
  productionCalendar: ReturnType<typeof productionCalendarInMemory.captureSnapshot>
  comments: ReturnType<typeof commentCollectionInMemory.captureSnapshot>
  entityTags: ReturnType<typeof entityTagCollectionInMemory.captureSnapshot>
  attachments: ReturnType<typeof attachmentCollectionInMemory.captureSnapshot>
  watchers: ReturnType<typeof watcherCollectionInMemory.captureSnapshot>
  watcherNotifications: ReturnType<typeof watcherNotificationCollectionInMemory.captureSnapshot>
  aiMemory: ReturnType<typeof aiMemoryCollectionInMemory.captureSnapshot>
  humanFeedback: ReturnType<typeof humanFeedbackCollectionInMemory.captureSnapshot>
  enterpriseTimeline: ReturnType<typeof enterpriseTimelineCollectionInMemory.captureSnapshot>
}

export function createPersistenceSnapshot(): PersistenceSnapshot {
  return {
    store: createStoreSnapshot(inMemoryStoreRegistry),
    masterDataLookups: masterDataLookupRegistryInMemory.captureSnapshot(),
    masterDataEnterpriseConfig: masterDataEnterpriseConfigInMemory.captureSnapshot(),
    masterDataApprovals: masterDataApprovalInMemory.captureSnapshot(),
    masterDataChanges: masterDataChangeStreamInMemory.captureSnapshot(),
    masterDataBrainChanges: masterDataBrainChangeStreamInMemory.captureSnapshot(),
    brainDecisionMemory: brainDecisionMemoryInMemory.captureSnapshot(),
    productionCalendar: productionCalendarInMemory.captureSnapshot(),
    comments: commentCollectionInMemory.captureSnapshot(),
    entityTags: entityTagCollectionInMemory.captureSnapshot(),
    attachments: attachmentCollectionInMemory.captureSnapshot(),
    watchers: watcherCollectionInMemory.captureSnapshot(),
    watcherNotifications: watcherNotificationCollectionInMemory.captureSnapshot(),
    aiMemory: aiMemoryCollectionInMemory.captureSnapshot(),
    humanFeedback: humanFeedbackCollectionInMemory.captureSnapshot(),
    enterpriseTimeline: enterpriseTimelineCollectionInMemory.captureSnapshot(),
  }
}

export function restorePersistenceSnapshot(snapshot: PersistenceSnapshot): void {
  restoreStoreSnapshot(inMemoryStoreRegistry, snapshot.store)
  masterDataLookupRegistryInMemory.restoreSnapshot(snapshot.masterDataLookups)
  masterDataEnterpriseConfigInMemory.restoreSnapshot(snapshot.masterDataEnterpriseConfig)
  masterDataApprovalInMemory.restoreSnapshot(snapshot.masterDataApprovals)
  masterDataChangeStreamInMemory.restoreSnapshot(snapshot.masterDataChanges)
  masterDataBrainChangeStreamInMemory.restoreSnapshot(snapshot.masterDataBrainChanges)
  brainDecisionMemoryInMemory.restoreSnapshot(snapshot.brainDecisionMemory)
  productionCalendarInMemory.restoreSnapshot(snapshot.productionCalendar)
  commentCollectionInMemory.restoreSnapshot(snapshot.comments)
  entityTagCollectionInMemory.restoreSnapshot(snapshot.entityTags)
  attachmentCollectionInMemory.restoreSnapshot(snapshot.attachments)
  watcherCollectionInMemory.restoreSnapshot(snapshot.watchers)
  watcherNotificationCollectionInMemory.restoreSnapshot(snapshot.watcherNotifications)
  aiMemoryCollectionInMemory.restoreSnapshot(snapshot.aiMemory)
  humanFeedbackCollectionInMemory.restoreSnapshot(snapshot.humanFeedback)
  enterpriseTimelineCollectionInMemory.restoreSnapshot(snapshot.enterpriseTimeline)
}
