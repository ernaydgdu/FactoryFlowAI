import type { Watcher, WatcherNotification } from '@/domain/platform/types'
import type {
  IWatcherCollectionRepository,
  IWatcherNotificationCollectionRepository,
} from '@/domain/ports/persistence/collections/watcher-collection.repository'

import { CollectionInMemoryRepository } from './collection.in-memory.repository'

export class WatcherCollectionInMemoryRepository
  extends CollectionInMemoryRepository<Watcher>
  implements IWatcherCollectionRepository
{
  findByEntity(_tenantId: string, entityType: string, entityId: string): Watcher[] {
    return this.find(_tenantId, (w) => w.entityType === entityType && w.entityId === entityId)
  }

  findByUser(_tenantId: string, userId: string): Watcher[] {
    return this.find(_tenantId, (w) => w.userId === userId)
  }
}

export class WatcherNotificationCollectionInMemoryRepository
  extends CollectionInMemoryRepository<WatcherNotification>
  implements IWatcherNotificationCollectionRepository
{
  findByUser(_tenantId: string, userId: string, unreadOnly = false): WatcherNotification[] {
    return this.find(_tenantId, (n) => n.userId === userId && (!unreadOnly || !n.read)).sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt),
    )
  }
}

export const watcherCollectionInMemory = new WatcherCollectionInMemoryRepository()
export const watcherNotificationCollectionInMemory = new WatcherNotificationCollectionInMemoryRepository()
