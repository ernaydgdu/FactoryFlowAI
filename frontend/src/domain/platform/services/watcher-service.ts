import {
  DEFAULT_TENANT_ID,
  watcherNotificationsRepo,
  watchersRepo,
} from '../platform-persistence-access'
import type { Watcher, WatcherNotification } from '../types'

export type WatchEntityInput = {
  entityType: string
  entityId: string
  entityNo: string
  userId: string
  userName: string
}

export function watchEntity(input: WatchEntityInput): Watcher {
  const repo = watchersRepo()
  const existing = repo.find(
    DEFAULT_TENANT_ID,
    (w) =>
      w.entityId === input.entityId &&
      w.entityType === input.entityType &&
      w.userId === input.userId,
  )[0]
  if (existing) return existing

  const counter = repo.nextCounter(DEFAULT_TENANT_ID)
  const watcher: Watcher = {
    id: `wch-${counter}`,
    ...input,
    createdAt: new Date().toISOString(),
  }
  repo.save(DEFAULT_TENANT_ID, watcher)
  return watcher
}

export function unwatchEntity(entityType: string, entityId: string, userId: string): boolean {
  const repo = watchersRepo()
  const match = repo.find(
    DEFAULT_TENANT_ID,
    (w) => w.entityType === entityType && w.entityId === entityId && w.userId === userId,
  )[0]
  if (!match) return false
  return repo.remove(DEFAULT_TENANT_ID, match.id)
}

export function getWatchers(entityType: string, entityId: string): Watcher[] {
  return watchersRepo().findByEntity(DEFAULT_TENANT_ID, entityType, entityId)
}

export function getWatchedEntities(userId: string): Watcher[] {
  return watchersRepo().findByUser(DEFAULT_TENANT_ID, userId)
}

export function notifyWatchers(
  entityType: string,
  entityId: string,
  entityNo: string,
  message: string,
): WatcherNotification[] {
  const watchers = getWatchers(entityType, entityId)
  const notifRepo = watcherNotificationsRepo()
  const notifications: WatcherNotification[] = []

  for (const watcher of watchers) {
    const counter = notifRepo.nextCounter(DEFAULT_TENANT_ID)
    const notification: WatcherNotification = {
      id: `wn-${counter}`,
      watcherId: watcher.id,
      entityType,
      entityId,
      entityNo,
      userId: watcher.userId,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    }
    notifRepo.save(DEFAULT_TENANT_ID, notification)
    notifications.push(notification)
  }
  return notifications
}

export function getUserNotifications(userId: string, unreadOnly = false): WatcherNotification[] {
  return watcherNotificationsRepo().findByUser(DEFAULT_TENANT_ID, userId, unreadOnly)
}

export function markNotificationRead(id: string): void {
  const repo = watcherNotificationsRepo()
  const notification = repo.findById(DEFAULT_TENANT_ID, id)
  if (notification) {
    repo.save(DEFAULT_TENANT_ID, { ...notification, read: true })
  }
}

export function seedWatchers(watchers: Watcher[], notifications: WatcherNotification[]): void {
  const watcherRepo = watchersRepo()
  const notifRepo = watcherNotificationsRepo()
  watcherRepo.seedFromLegacy(DEFAULT_TENANT_ID, watchers)
  notifRepo.seedFromLegacy(DEFAULT_TENANT_ID, notifications)
  watcherRepo.setCounter(DEFAULT_TENANT_ID, watchers.length)
  notifRepo.setCounter(DEFAULT_TENANT_ID, notifications.length)
}

export function getAllWatcherNotifications(): WatcherNotification[] {
  return watcherNotificationsRepo().findAll(DEFAULT_TENANT_ID)
}
