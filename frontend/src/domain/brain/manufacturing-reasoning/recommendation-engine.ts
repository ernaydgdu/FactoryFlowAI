/**
 * Recommendation Engine — explains why / risk / confidence / alternative.
 * Never mutates ERP. Industrial reasoning output only.
 */
import type {
  ConstraintCheckResult,
  DecisionResult,
  FormulaRunResult,
  Recommendation,
  RuleEvaluationResult,
  RuleVerdict,
} from './types'

function clampConfidence(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function severityRank(v: RuleVerdict): number {
  return { PASS: 0, WARNING: 1, CRITICAL: 2, BLOCKED: 3 }[v]
}

export function buildRecommendations(input: {
  rules: RuleEvaluationResult[]
  formulae: FormulaRunResult[]
  constraints: ConstraintCheckResult[]
  decisions: DecisionResult[]
}): Recommendation[] {
  const { rules, formulae, constraints, decisions } = input
  const recs: Recommendation[] = []
  let seq = 0

  for (const rule of rules.filter((r) => r.matched && r.verdict !== 'PASS')) {
    seq += 1
    const relatedFormulae = formulae.filter((f) => f.ok).slice(0, 2)
    recs.push({
      id: `rec-rule-${rule.ruleId}-${seq}`,
      title: rule.ruleName,
      reason: rule.message,
      evidence: rule.evidence,
      businessRulesUsed: [rule.ruleCode],
      formulaeUsed: relatedFormulae.map((f) => f.formulaCode),
      confidence: clampConfidence(55 + rule.evidence.length * 8 + (rule.applicable ? 10 : 0)),
      risk: rule.verdict === 'BLOCKED' ? 'Operational block until cleared' : rule.severity,
      alternative:
        rule.verdict === 'BLOCKED'
          ? 'Resolve blocking condition, then re-run reasoning'
          : 'Monitor and re-evaluate on next fact refresh',
      affectedModules: inferModulesFromConcepts(rule.relatedConcepts),
      verdict: rule.verdict,
    })
  }

  for (const c of constraints.filter((x) => x.verdict !== 'PASS')) {
    seq += 1
    recs.push({
      id: `rec-cst-${c.id}-${seq}`,
      title: c.title,
      reason: c.detail,
      evidence: c.evidence,
      businessRulesUsed: c.relatedRuleIds,
      formulaeUsed: c.relatedFormulaIds,
      confidence: clampConfidence(50 + c.evidence.length * 7 + (c.verdict === 'BLOCKED' ? 15 : 0)),
      risk: `${c.domain} constraint ${c.verdict}`,
      alternative: alternateForConstraint(c),
      affectedModules: c.affectedModules,
      verdict: c.verdict,
    })
  }

  for (const d of decisions) {
    if (!d.best) continue
    const triggered =
      d.decisionCode === 'LOW_STOCK'
        ? constraints.some((c) => c.domain === 'Material' && c.verdict !== 'PASS')
        : constraints.some((c) => c.domain === 'Capacity' && c.verdict !== 'PASS') ||
          d.best.id !== 'cand-on-track' && d.best.id !== 'cand-no-buy'

    if (!triggered && (d.best.id === 'cand-on-track' || d.best.id === 'cand-no-buy')) {
      continue
    }

    seq += 1
    const alt = d.candidates.find((c) => c.id !== d.best!.id) ?? null
    const formulaCodes = formulae.filter((f) => f.ok).map((f) => f.formulaCode)
    recs.push({
      id: `rec-dec-${d.decisionCode}-${seq}`,
      title: `${d.name}: ${d.best.action}`,
      reason: d.best.rationale,
      evidence: [
        ...d.best.evidence,
        ...d.path.map((p) => `${p.action} → ${p.outcome}`),
      ],
      businessRulesUsed: rules.filter((r) => r.matched).map((r) => r.ruleCode),
      formulaeUsed: formulaCodes.includes('MRP_NET_REQUIREMENT')
        ? ['MRP_NET_REQUIREMENT', ...formulaCodes.filter((c) => c !== 'MRP_NET_REQUIREMENT').slice(0, 2)]
        : formulaCodes.slice(0, 3),
      confidence: clampConfidence(d.best.score),
      risk: d.best.risk,
      alternative: alt ? `${alt.action} (score ${alt.score})` : null,
      affectedModules: d.best.affectedModules,
      verdict: d.best.score >= 70 ? 'WARNING' : 'CRITICAL',
      decisionCode: d.decisionCode,
    })
  }

  // Deduplicate by title+reason; keep higher severity / confidence
  const byKey = new Map<string, Recommendation>()
  for (const r of recs) {
    const key = `${r.title}|${r.reason}`
    const prev = byKey.get(key)
    if (!prev || severityRank(r.verdict) > severityRank(prev.verdict) || r.confidence > prev.confidence) {
      byKey.set(key, r)
    }
  }

  return [...byKey.values()].sort(
    (a, b) => severityRank(b.verdict) - severityRank(a.verdict) || b.confidence - a.confidence,
  )
}

function alternateForConstraint(c: ConstraintCheckResult): string {
  switch (c.domain) {
    case 'Material':
      return 'Check open PO coverage or raise purchase from MRP suggestions'
    case 'Capacity':
      return 'Overtime, alternate work center, or partial shipment'
    case 'Machine':
      return 'Complete maintenance before releasing new production orders'
    case 'Quality':
      return 'Clear hold / rework before continuing packing/shipment'
    case 'Shipment':
      return 'Hold dispatch until quality gate passes'
    case 'Financial':
      return 'Resolve failed postings / anomaly batches before close'
    default:
      return 'Re-run reasoning after corrective action'
  }
}

function inferModulesFromConcepts(conceptIds: string[]): string[] {
  const map: Record<string, string> = {
    'c-fifo': 'inventory',
    'c-lot': 'inventory',
    'c-warehouse': 'warehouse',
    'c-quality': 'quality',
    'c-aql': 'quality',
    'c-shipment': 'shipment',
    'c-purchasing': 'purchasing',
    'c-mrp': 'mrp',
    'c-work-center': 'production-planning',
    'c-sewing': 'shop-floor',
    'c-cutting': 'production-order',
    'c-finance': 'finance-integration',
    'c-waste': 'cost-closing',
    'c-order': 'sales-order',
  }
  const mods = new Set<string>()
  for (const id of conceptIds) {
    if (map[id]) mods.add(map[id])
  }
  return [...mods]
}
