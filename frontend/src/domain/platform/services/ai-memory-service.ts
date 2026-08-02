import type { AiMemoryEntry, AiTimeline, DomainEvent } from '../types'

const memoryStore: AiMemoryEntry[] = []
let counter = 0

const EVENT_IMPORTANCE: Partial<Record<string, AiMemoryEntry['importance']>> = {
  OrderCreated: 'medium',
  BomApproved: 'high',
  PurchaseCreated: 'medium',
  StockReceived: 'medium',
  ProductionStarted: 'high',
  ProductionFinished: 'high',
  ShipmentCompleted: 'critical',
  ApprovalCompleted: 'high',
  RevisionActivated: 'medium',
}

const EVENT_CATEGORY: Partial<Record<string, AiMemoryEntry['category']>> = {
  OrderCreated: 'order',
  BomApproved: 'order',
  PurchaseCreated: 'purchase',
  StockReceived: 'production',
  ProductionStarted: 'production',
  ProductionFinished: 'production',
  ShipmentCompleted: 'shipment',
  ApprovalCompleted: 'approval',
}

export function recordFromDomainEvent(event: DomainEvent): AiMemoryEntry {
  counter += 1
  const entry: AiMemoryEntry = {
    id: `aim-${counter}`,
    timestamp: event.occurredAt,
    category: EVENT_CATEGORY[event.type] ?? 'order',
    entityType: event.aggregateType,
    entityId: event.aggregateId,
    entityNo: event.aggregateNo ?? event.aggregateId,
    summary: buildSummary(event),
    detail: buildDetail(event),
    eventType: event.type,
    importance: EVENT_IMPORTANCE[event.type] ?? 'low',
    tags: extractTags(event),
  }
  memoryStore.push(entry)
  return entry
}

function buildSummary(event: DomainEvent): string {
  const no = event.aggregateNo ?? event.aggregateId
  switch (event.type) {
    case 'OrderCreated':
      return `Sipariş ${no} oluşturuldu`
    case 'BomApproved':
      return `BOM onaylandı — ${no}`
    case 'PurchaseCreated':
      return `Satın alma kaydı oluşturuldu — ${no}`
    case 'StockReceived':
      return `Stok girişi yapıldı — ${no}`
    case 'ProductionStarted':
      return `Üretim başladı — ${no}`
    case 'ProductionFinished':
      return `Üretim tamamlandı — ${no}`
    case 'ShipmentCompleted':
      return `Sevkiyat tamamlandı — ${no}`
    default:
      return `${event.type} — ${no}`
  }
}

function buildDetail(event: DomainEvent): string {
  const payloadStr = Object.entries(event.payload)
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(', ')
  return `${buildSummary(event)}. Tetikleyen: ${event.causedBy}. ${payloadStr ? `Veri: ${payloadStr}` : ''}`
}

function extractTags(event: DomainEvent): string[] {
  const tags: string[] = [event.type, event.aggregateType]
  if (event.payload.tag) tags.push(String(event.payload.tag))
  if (event.payload.risk) tags.push('risk')
  return tags
}

export function getAiTimeline(entityId: string): AiTimeline {
  const entries = memoryStore
    .filter((e) => e.entityId === entityId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  return {
    entityId,
    entityNo: entries[0]?.entityNo ?? entityId,
    entries,
    generatedAt: new Date().toISOString(),
  }
}

export function getRecentAiMemory(limit = 20): AiMemoryEntry[] {
  return [...memoryStore].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit)
}

export function searchAiMemory(query: string): AiMemoryEntry[] {
  const q = query.toLowerCase()
  return memoryStore.filter(
    (e) =>
      e.summary.toLowerCase().includes(q) ||
      e.detail.toLowerCase().includes(q) ||
      e.entityNo.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q)),
  )
}

export function seedAiMemory(entries: AiMemoryEntry[]): void {
  memoryStore.length = 0
  memoryStore.push(...entries)
  counter = entries.length
}

export function getAllAiMemory(): AiMemoryEntry[] {
  return [...memoryStore]
}

export function formatAiTimelineForPrompt(timeline: AiTimeline): string {
  return timeline.entries
    .map((e) => `[${e.timestamp}] (${e.importance}) ${e.summary}`)
    .join('\n')
}
