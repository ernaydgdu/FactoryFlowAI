/** Application Layer — UI-facing DTO primitives */

export type KpiDto = {
  label: string
  value: string
  hint: string
}

export type StatusTone = 'success' | 'warning' | 'danger' | 'default' | 'muted'

export type StatusBadgeDto = {
  label: string
  tone: StatusTone
}

export type RelationItemDto = {
  id: string
  type: string
  label: string
  kind: string
}

export type DocumentItemDto = {
  id: string
  kind: string
  fileName: string
  uploadedBy: string
  uploadedAt: string
}

export type TimelineItemDto = {
  id: string
  occurredAt: string
  actor: string
  action: string
  reason?: string
}
