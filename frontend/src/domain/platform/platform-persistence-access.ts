import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'

export function productionCalendarRepo() {
  return requireUnitOfWork().productionCalendar
}

export function enterpriseTimelineRepo() {
  return requireUnitOfWork().enterpriseTimeline
}

export function commentsRepo() {
  return requireUnitOfWork().comments
}

export function entityTagsRepo() {
  return requireUnitOfWork().entityTags
}

export function attachmentsRepo() {
  return requireUnitOfWork().attachments
}

export function watchersRepo() {
  return requireUnitOfWork().watchers
}

export function watcherNotificationsRepo() {
  return requireUnitOfWork().watcherNotifications
}

export function aiMemoryRepo() {
  return requireUnitOfWork().aiMemory
}

export function humanFeedbackRepo() {
  return requireUnitOfWork().humanFeedback
}

export function brainDecisionMemoryRepo() {
  return requireUnitOfWork().brainDecisionMemory
}

export { DEFAULT_TENANT_ID }
