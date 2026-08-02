/**
 * Human Feedback Engine — öneri sonuç öğrenme (company-scoped).
 */
import type {
  DecisionOutcome,
  FeedbackRejectReason,
  HumanFeedbackEntry,
} from '../types'

const feedbackStore: HumanFeedbackEntry[] = []
let feedbackCounter = 0

export function recordFeedback(
  entry: Omit<HumanFeedbackEntry, 'id' | 'recordedAt' | 'tenantScoped'>,
): HumanFeedbackEntry {
  feedbackCounter += 1
  const full: HumanFeedbackEntry = {
    ...entry,
    id: `fb-${feedbackCounter}`,
    recordedAt: new Date().toISOString(),
    tenantScoped: true,
  }
  feedbackStore.push(full)
  return full
}

export function getFeedbackHistory(companyId: string, limit = 50): HumanFeedbackEntry[] {
  return feedbackStore
    .filter((f) => f.companyId === companyId)
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    .slice(0, limit)
}

export function getAcceptanceRate(companyId: string): number {
  const entries = feedbackStore.filter((f) => f.companyId === companyId)
  if (entries.length === 0) return 0
  const accepted = entries.filter((f) => f.decision === 'ACCEPTED').length
  return Math.round((accepted / entries.length) * 100)
}

export function getTopRejectReasons(companyId: string): FeedbackRejectReason[] {
  const rejected = feedbackStore.filter(
    (f) => f.companyId === companyId && f.decision === 'REJECTED' && f.rejectReason,
  )
  const counts = new Map<FeedbackRejectReason, number>()
  for (const r of rejected) {
    if (r.rejectReason) counts.set(r.rejectReason, (counts.get(r.rejectReason) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([reason]) => reason)
}

export function updateFeedbackOutcome(
  feedbackId: string,
  outcome: DecisionOutcome,
): void {
  const entry = feedbackStore.find((f) => f.id === feedbackId)
  if (entry) entry.outcome = outcome
}

export function learnFromFeedback(companyId: string): string[] {
  const notes: string[] = []
  const rate = getAcceptanceRate(companyId)
  notes.push(`Öneri kabul oranı: %${rate}`)

  const reasons = getTopRejectReasons(companyId)
  if (reasons.length > 0) {
    notes.push(`En sık red sebebi: ${reasons[0]}`)
  }

  return notes
}
