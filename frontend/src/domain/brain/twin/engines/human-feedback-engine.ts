/**
 * Human Feedback Engine — öneri sonuç öğrenme (company-scoped).
 */
import { DEFAULT_TENANT_ID, humanFeedbackRepo } from '@/domain/platform/platform-persistence-access'

import type {
  DecisionOutcome,
  FeedbackRejectReason,
  HumanFeedbackEntry,
} from '../types'

export function recordFeedback(
  entry: Omit<HumanFeedbackEntry, 'id' | 'recordedAt' | 'tenantScoped'>,
): HumanFeedbackEntry {
  const repo = humanFeedbackRepo()
  const counter = repo.nextCounter(DEFAULT_TENANT_ID)
  const full: HumanFeedbackEntry = {
    ...entry,
    id: `fb-${counter}`,
    recordedAt: new Date().toISOString(),
    tenantScoped: true,
  }
  repo.save(DEFAULT_TENANT_ID, full)
  return full
}

export function getFeedbackHistory(companyId: string, limit = 50): HumanFeedbackEntry[] {
  return humanFeedbackRepo().findByCompany(DEFAULT_TENANT_ID, companyId).slice(0, limit)
}

export function getAcceptanceRate(companyId: string): number {
  const entries = humanFeedbackRepo().findByCompany(DEFAULT_TENANT_ID, companyId)
  if (entries.length === 0) return 0
  const accepted = entries.filter((f) => f.decision === 'ACCEPTED').length
  return Math.round((accepted / entries.length) * 100)
}

export function getTopRejectReasons(companyId: string): FeedbackRejectReason[] {
  const rejected = humanFeedbackRepo().findByCompany(DEFAULT_TENANT_ID, companyId).filter(
    (f) => f.decision === 'REJECTED' && f.rejectReason,
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
  const repo = humanFeedbackRepo()
  const entry = repo.findById(DEFAULT_TENANT_ID, feedbackId)
  if (entry) {
    repo.save(DEFAULT_TENANT_ID, { ...entry, outcome })
  }
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
