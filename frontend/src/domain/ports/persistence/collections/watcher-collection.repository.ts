import type { Watcher, WatcherNotification } from '@/domain/platform/types'
import type { ICollectionRepository } from './collection-repository.base'

export interface IWatcherCollectionRepository extends ICollectionRepository<Watcher> {
  findByEntity(tenantId: string, entityType: string, entityId: string): Watcher[]
  findByUser(tenantId: string, userId: string): Watcher[]
}

export interface IWatcherNotificationCollectionRepository extends ICollectionRepository<WatcherNotification> {
  findByUser(tenantId: string, userId: string, unreadOnly?: boolean): WatcherNotification[]
}
