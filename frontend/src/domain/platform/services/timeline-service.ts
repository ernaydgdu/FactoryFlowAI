import type { DomainEventType, TimelineEntry, TimelineEventType } from '../types'

const timelineStore: TimelineEntry[] = []
let counter = 0

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

export type AddTimelineEntryInput = {
  orderId: string
  orderNo: string
  eventType: TimelineEventType
  description: string
  actor: string
  metadata?: Record<string, unknown>
}

export function addTimelineEntry(input: AddTimelineEntryInput): TimelineEntry {
  counter += 1
  const entry: TimelineEntry = {
    id: `tl-${counter}`,
    orderId: input.orderId,
    orderNo: input.orderNo,
    eventType: input.eventType,
    title: EVENT_TITLES[input.eventType],
    description: input.description,
    occurredAt: new Date().toISOString(),
    actor: input.actor,
    metadata: input.metadata,
  }
  timelineStore.push(entry)
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
  return timelineStore
    .filter((e) => e.orderId === orderId)
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
}

export function getOrderTimelineDesc(orderId: string): TimelineEntry[] {
  return getOrderTimeline(orderId).reverse()
}

export function seedTimeline(entries: TimelineEntry[]): void {
  timelineStore.length = 0
  timelineStore.push(...entries)
  counter = entries.length
}

export function getAllTimelineEntries(): TimelineEntry[] {
  return [...timelineStore]
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
    counter += 1
    offset += 1
    const date = new Date('2026-02-18')
    date.setDate(date.getDate() + offset * 2)
    entries.push({
      id: `tl-${counter}`,
      orderId,
      orderNo,
      eventType,
      title: EVENT_TITLES[eventType],
      description: stages[eventType] ?? EVENT_TITLES[eventType],
      occurredAt: date.toISOString(),
      actor,
    })
  }
  timelineStore.push(...entries)
  return entries
}
