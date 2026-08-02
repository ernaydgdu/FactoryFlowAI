import type { Watcher, WatcherNotification } from '../types'

const watcherStore: Watcher[] = []
const notificationStore: WatcherNotification[] = []
let watcherCounter = 0
let notifCounter = 0

export type WatchEntityInput = {
  entityType: string
  entityId: string
  entityNo: string
  userId: string
  userName: string
}

export function watchEntity(input: WatchEntityInput): Watcher {
  const existing = watcherStore.find(
    (w) =>
      w.entityId === input.entityId &&
      w.entityType === input.entityType &&
      w.userId === input.userId,
  )
  if (existing) return existing

  watcherCounter += 1
  const watcher: Watcher = {
    id: `wch-${watcherCounter}`,
    ...input,
    createdAt: new Date().toISOString(),
  }
  watcherStore.push(watcher)
  return watcher
}

export function unwatchEntity(entityType: string, entityId: string, userId: string): boolean {
  const idx = watcherStore.findIndex(
    (w) => w.entityType === entityType && w.entityId === entityId && w.userId === userId,
  )
  if (idx === -1) return false
  watcherStore.splice(idx, 1)
  return true
}

export function getWatchers(entityType: string, entityId: string): Watcher[] {
  return watcherStore.filter((w) => w.entityType === entityType && w.entityId === entityId)
}

export function getWatchedEntities(userId: string): Watcher[] {
  return watcherStore.filter((w) => w.userId === userId)
}

export function notifyWatchers(
  entityType: string,
  entityId: string,
  entityNo: string,
  message: string,
): WatcherNotification[] {
  const watchers = getWatchers(entityType, entityId)
  const notifications: WatcherNotification[] = []

  for (const watcher of watchers) {
    notifCounter += 1
    const notification: WatcherNotification = {
      id: `wn-${notifCounter}`,
      watcherId: watcher.id,
      entityType,
      entityId,
      entityNo,
      userId: watcher.userId,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    }
    notificationStore.push(notification)
    notifications.push(notification)
  }
  return notifications
}

export function getUserNotifications(userId: string, unreadOnly = false): WatcherNotification[] {
  return notificationStore
    .filter((n) => n.userId === userId && (!unreadOnly || !n.read))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function markNotificationRead(id: string): void {
  const n = notificationStore.find((x) => x.id === id)
  if (n) n.read = true
}

export function seedWatchers(watchers: Watcher[], notifications: WatcherNotification[]): void {
  watcherStore.length = 0
  notificationStore.length = 0
  watcherStore.push(...watchers)
  notificationStore.push(...notifications)
  watcherCounter = watchers.length
  notifCounter = notifications.length
}

export function getAllWatcherNotifications(): WatcherNotification[] {
  return [...notificationStore]
}
