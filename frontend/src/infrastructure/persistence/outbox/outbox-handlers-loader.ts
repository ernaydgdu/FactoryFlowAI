import type { OutboxHandler, OutboxMessage } from '@/domain/ports/persistence/persistence.types'

type HandlersModule = typeof import('./outbox-handlers')

let handlersModule: HandlersModule | null = null
let loading: Promise<void> | null = null

export function ensureOutboxHandlersLoaded(): Promise<void> {
  if (handlersModule) return Promise.resolve()
  if (!loading) {
    loading = Promise.all([
      import('./outbox-handlers'),
      import('@/domain/master-data/enterprise/brain-change-feed'),
      import('@/domain/execution-platform/execution-platform-service'),
      import('@/domain/platform/services/ai-memory-service'),
      import('@/domain/platform/services/watcher-service'),
    ]).then(([handlers, brainChangeFeed, executionPlatform, aiMemory, watcher]) => {
      handlers.registerOutboxHandlerDeps({
        publishMasterDataBrainEventToStream: brainChangeFeed.publishMasterDataBrainEventToStream,
        rebuildWipIndex: executionPlatform.rebuildWipIndex,
        recordFromDomainEvent: aiMemory.recordFromDomainEvent,
        notifyWatchers: watcher.notifyWatchers,
      })
      handlersModule = handlers
    })
  }
  return loading
}

/** Process outbox messages — handlers load lazily on first batch (post-bootstrap). */
export function dispatchOutboxMessage(message: OutboxMessage): void {
  if (!handlersModule) {
    throw new Error('Outbox handlers not loaded — call ensureOutboxHandlersLoaded() first')
  }
  handlersModule.dispatchOutboxMessage(message)
}

export function getRegisteredOutboxHandlers(): OutboxHandler[] {
  if (!handlersModule) {
    throw new Error('Outbox handlers not loaded — call ensureOutboxHandlersLoaded() first')
  }
  return handlersModule.getRegisteredOutboxHandlers()
}

export function resetOutboxHandlersLoaderForTests(): void {
  handlersModule = null
  loading = null
}
