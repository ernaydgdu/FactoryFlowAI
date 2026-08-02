import type { DomainEventType, TimelineEntry, TimelineEventType } from '../types'
import {
  DEFAULT_TENANT_ID,
  requireUnitOfWork,
} from '../../ports/persistence/persistence-registry'
import type { PersistedOrderTimelineEntry } from '../../ports/persistence/persistence-aggregates'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '../../ports/persistence/persistence.types'

const EVENT_TITLES: Record<TimelineEventType, string> = {
  OrderOpened: 'Sipariş Açıldı',
  BomCreated: 'BOM Oluştu',
  MrpGenerated: 'MRP Oluştu',
  PurchaseCreated: 'Satın Alma Oluştu',
  StockReceived: 'Depoya Giriş',
  ProductionStarted: 'Üretim Başladı',
  QualityChecked: 'Kalite Kontrol',
  PackagingDone: 'Paketleme Tamamlandı',
  ShipmentCompleted: 'Sevkiyat Tamamlandı',
  CommentAdded: 'Yorum Eklendi',
  StatusChanged: 'Durum Değişti',
  ApprovalCompleted: 'Onay Tamamlandı',
  ProductionSplit: 'Üretim Emri Bölündü',
}

const DOMAIN_TO_TIMELINE: Partial<Record<DomainEventType, TimelineEventType>> = {
  OrderCreated: 'OrderOpened',
  BomApproved: 'BomCreated',
  PurchaseCreated: 'PurchaseCreated',
  StockReceived: 'StockReceived',
  ProductionStarted: 'ProductionStarted',
  ProductionFinished: 'ProductionStarted',
  ShipmentCompleted: 'ShipmentCompleted',
  ApprovalCompleted: 'ApprovalCompleted',
  CommentAdded: 'CommentAdded',
}

function timelineRepo() {
  return requireUnitOfWork().orderTimeline
}

function timelineStreamKey(orderId: string) {
  return { streamType: 'order_timeline', streamId: orderId }
}

function stripTimelineMeta(row: PersistedOrderTimelineEntry): TimelineEntry {
  const { tenantId: _t, streamType: _st, streamId: _si, sequence: _s, ...rest } = row
  return rest
}

export type AddTimelineEntryInput = {
  orderId: string
  orderNo: string
  eventType: TimelineEventType
  description: string
  actor: string
  metadata?: Record<string, unknown>
}

export function addTimelineEntry(input: AddTimelineEntryInput): TimelineEntry {
  const entry: TimelineEntry = {
    id: timelineRepo().nextTimelineId(),
    orderId: input.orderId,
    orderNo: input.orderNo,
    eventType: input.eventType,
    title: EVENT_TITLES[input.eventType],
    description: input.description,
    occurredAt: new Date().toISOString(),
    actor: input.actor,
    metadata: input.metadata,
  }
  const persisted: PersistedOrderTimelineEntry = {
    ...entry,
    tenantId: DEFAULT_TENANT_ID,
    streamType: 'order_timeline',
    streamId: input.orderId,
    sequence: 0,
  }
  timelineRepo().append(DEFAULT_TENANT_ID, timelineStreamKey(input.orderId), [persisted])
  return entry
}

export function buildTimelineFromDomainEvent(
  orderId: string,
  orderNo: string,
  eventType: DomainEventType,
  description: string,
  actor: string,
  metadata?: Record<string, unknown>,
): TimelineEntry | null {
  const timelineType = DOMAIN_TO_TIMELINE[eventType]
  if (!timelineType) return null
  return addTimelineEntry({
    orderId,
    orderNo,
    eventType: timelineType,
    description,
    actor,
    metadata,
  })
}

export function getOrderTimeline(orderId: string): TimelineEntry[] {
  const page = timelineRepo().cursorByOrderId(DEFAULT_TENANT_ID, orderId, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.map(stripTimelineMeta).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
}

export function getOrderTimelineDesc(orderId: string): TimelineEntry[] {
  return getOrderTimeline(orderId).reverse()
}

export function seedTimeline(entries: TimelineEntry[]): void {
  timelineRepo().seedFromLegacyEntries(entries)
}

export function getAllTimelineEntries(): TimelineEntry[] {
  const page = timelineRepo().cursor(DEFAULT_TENANT_ID, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  return page.items.map(stripTimelineMeta)
}

export function generateStandardOrderTimeline(
  orderId: string,
  orderNo: string,
  actor: string,
  stages: Partial<Record<TimelineEventType, string>>,
): TimelineEntry[] {
  const sequence: TimelineEventType[] = [
    'OrderOpened',
    'BomCreated',
    'MrpGenerated',
    'PurchaseCreated',
    'StockReceived',
    'ProductionStarted',
    'QualityChecked',
    'PackagingDone',
    'ShipmentCompleted',
  ]

  const entries: TimelineEntry[] = []
  let offset = 0
  for (const eventType of sequence) {
    if (stages[eventType] === undefined && eventType !== 'OrderOpened') continue
    offset += 1
    const date = new Date('2026-02-18')
    date.setDate(date.getDate() + offset * 2)
    entries.push({
      id: timelineRepo().nextTimelineId(),
      orderId,
      orderNo,
      eventType,
      title: EVENT_TITLES[eventType],
      description: stages[eventType] ?? EVENT_TITLES[eventType],
      occurredAt: date.toISOString(),
      actor,
    })
  }
  for (const entry of entries) {
    const persisted: PersistedOrderTimelineEntry = {
      ...entry,
      tenantId: DEFAULT_TENANT_ID,
      streamType: 'order_timeline',
      streamId: orderId,
      sequence: 0,
    }
    timelineRepo().append(DEFAULT_TENANT_ID, timelineStreamKey(orderId), [persisted])
  }
  return entries
}
