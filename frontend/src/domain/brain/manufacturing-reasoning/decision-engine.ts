/**
 * Decision Engine — walks knowledge decision trees and ranks candidate actions.
 * Deterministic scoring. No LLM. No ERP mutation.
 */
import {
  queryConceptNeighbors,
  queryDecisions,
  type DecisionDefinition,
} from '@/domain/brain/manufacturing-knowledge'
import { queryLatestMrpRun } from '@/domain/mrp/mrp-query.service'
import { buildProductionPlanningBrainSnapshot } from '@/domain/production-planning/production-planning-query'
import { queryAllQuotations } from '@/domain/purchasing/rfq-query.service'

import type { BrainFact, DecisionCandidate, DecisionResult, FactContext } from './types'

function walkPath(def: DecisionDefinition, outcomes: Record<string, string>): DecisionResult['path'] {
  return def.steps
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map((s) => ({
      stepId: s.id,
      action: s.action,
      outcome: outcomes[s.id] ?? s.outcomeHint,
    }))
}

function rankLowStock(ctx: FactContext, facts: BrainFact[]): DecisionResult {
  const def = queryDecisions().find((d) => d.code === 'LOW_STOCK')!
  const mrp = queryLatestMrpRun()
  const quotes = queryAllQuotations().filter((q) => q.status === 'Pending' || q.status === 'Selected')
  const groups = mrp?.currentSnapshot.purchaseProposalGroups ?? []

  const openPoCount = Number(ctx.openPurchaseOrderCount) || 0
  const lowStock = Boolean(ctx.hasLowStock)
  const outcomes: Record<string, string> = {
    ds1: openPoCount > 0 ? `${openPoCount} open PO(s) cover part of need` : 'No open PO coverage',
    ds2:
      Number(ctx.lowStockLines) > 0
        ? `${String(ctx.lowStockLines)} line(s) below safety / net shortage`
        : 'Safety stock OK',
    ds3: lowStock ? 'Purchase suggestion warranted' : 'No purchase suggestion',
  }

  const candidates: DecisionCandidate[] = []

  for (const g of groups.slice(0, 8)) {
    candidates.push({
      id: `cand-supplier-group-${g.supplier}`,
      action: `Source via ${g.supplier}`,
      score: Math.max(10, 100 - g.lineCount * 2),
      rationale: `MRP proposal group · ${g.lineCount} lines · qty ${g.totalQuantity} · earliest ${g.earliestRequiredDate}`,
      evidence: [`supplier=${g.supplier}`, `totalQuantity=${g.totalQuantity}`],
      risk: g.lineCount > 5 ? 'Large multi-line buy — split risk' : 'Standard replenishment',
      affectedModules: ['purchasing', 'mrp', 'inventory'],
    })
  }

  for (const q of quotes.slice(0, 8)) {
    const lead =
      q.lines.length === 0 ? 14 : q.lines.reduce((s, l) => s + l.leadTimeDays, 0) / q.lines.length
    const priceScore = q.totalAmount > 0 ? Math.max(5, 90 - Math.log10(q.totalAmount + 1) * 8) : 40
    const leadScore = Math.max(5, 80 - lead * 2)
    candidates.push({
      id: `cand-quote-${q.id}`,
      action: `Select quotation ${q.quotationNo} (${q.supplierName})`,
      score: Math.round((priceScore + leadScore) / 2),
      rationale: `Quoted total ${q.totalAmount} ${q.currency} · avg lead ${lead.toFixed(1)}d`,
      evidence: [
        `supplier=${q.supplierCode}`,
        `totalAmount=${q.totalAmount}`,
        `avgLeadTimeDays=${lead}`,
      ],
      risk: lead > 21 ? 'Long lead time may miss EXF' : 'Lead time acceptable',
      affectedModules: ['purchasing', 'mrp'],
    })
  }

  if (candidates.length === 0 && lowStock) {
    candidates.push({
      id: 'cand-raise-pr',
      action: 'Raise purchase request from MRP net need',
      score: 55,
      rationale: 'No supplier proposals/quotations ranked — suggest PR from net shortage.',
      evidence: [`netShortage=${String(ctx.netShortage)}`, `openPO=${String(ctx.openPO)}`],
      risk: 'Supplier not yet selected',
      affectedModules: ['purchasing', 'mrp'],
    })
  }

  if (!lowStock) {
    candidates.push({
      id: 'cand-no-buy',
      action: 'No purchase action',
      score: 95,
      rationale: 'Stock / open supply covers demand.',
      evidence: facts
        .filter((f) => f.sourceModule === 'mrp')
        .slice(0, 3)
        .map((f) => f.label),
      risk: 'None',
      affectedModules: ['inventory', 'mrp'],
    })
  }

  candidates.sort((a, b) => b.score - a.score)
  return {
    decisionId: def.id,
    decisionCode: def.code,
    trigger: def.trigger,
    name: def.name,
    path: walkPath(def, outcomes),
    candidates,
    best: candidates[0] ?? null,
    relatedConcepts: def.relatedConcepts,
  }
}

function rankLateOrder(ctx: FactContext): DecisionResult {
  const def = queryDecisions().find((d) => d.code === 'LATE_ORDER')!
  const planning = buildProductionPlanningBrainSnapshot()
  const workshops = [...planning.workshops].sort((a, b) => a.utilizationPercent - b.utilizationPercent)
  const freest = workshops[0]
  const busiest = workshops[workshops.length - 1]
  const late = Boolean(ctx.hasLateOrder) || planning.terminRiskCount > 0

  const outcomes: Record<string, string> = {
    dl1: freest
      ? `Freest WC ${freest.name} util ${freest.utilizationPercent}% free ${freest.freeCapacity}`
      : 'No workshop capacity data',
    dl2: Number(ctx.maxUtilization) >= 90 ? 'Overtime likely required' : 'Overtime optional',
    dl3: freest && busiest && freest.code !== busiest.code
      ? `Alternate WC candidate ${freest.name}`
      : 'No alternate WC differentiation',
    dl4: late ? 'Partial shipment may protect OTIF' : 'Full shipment still viable',
  }

  const candidates: DecisionCandidate[] = []
  if (late) {
    candidates.push({
      id: 'cand-ot',
      action: 'Suggest overtime',
      score: Number(ctx.maxUtilization) >= 85 ? 80 : 50,
      rationale: 'Extend calendar capacity on overloaded work centers.',
      evidence: [`maxUtilization=${String(ctx.maxUtilization)}`, `terminRiskCount=${planning.terminRiskCount}`],
      risk: 'Labor cost / fatigue',
      affectedModules: ['production-planning', 'shop-floor'],
    })
    if (freest && freest.freeCapacity > 0) {
      candidates.push({
        id: 'cand-alt-wc',
        action: `Suggest alternate work center ${freest.name}`,
        score: 75 + Math.min(20, freest.freeCapacity / 10),
        rationale: 'Rebalance load to freest workshop.',
        evidence: [
          `workshop=${freest.code}`,
          `freeCapacity=${freest.freeCapacity}`,
          `utilization=${freest.utilizationPercent}`,
        ],
        risk: 'Setup / skill transfer',
        affectedModules: ['production-planning', 'production-order'],
      })
    }
    candidates.push({
      id: 'cand-partial-ship',
      action: 'Suggest partial shipment',
      score: 60,
      rationale: 'Ship available finished goods to protect OTIF.',
      evidence: [`shipmentCount=${String(ctx.shipmentCount ?? 0)}`, `lateOrderCount=${String(ctx.lateOrderCount)}`],
      risk: 'Customer split-shipment acceptance',
      affectedModules: ['shipment', 'packaging', 'sales-order'],
    })
  } else {
    candidates.push({
      id: 'cand-on-track',
      action: 'Maintain current schedule',
      score: 90,
      rationale: 'No late-order / termin-risk signal.',
      evidence: [`terminRiskCount=${planning.terminRiskCount}`],
      risk: 'None',
      affectedModules: ['production-planning', 'sales-order'],
    })
  }

  candidates.sort((a, b) => b.score - a.score)
  return {
    decisionId: def.id,
    decisionCode: def.code,
    trigger: def.trigger,
    name: def.name,
    path: walkPath(def, outcomes),
    candidates,
    best: candidates[0] ?? null,
    relatedConcepts: def.relatedConcepts,
  }
}

export function runDecisionEngine(ctx: FactContext, facts: BrainFact[]): DecisionResult[] {
  const results: DecisionResult[] = []
  if (queryDecisions().some((d) => d.code === 'LOW_STOCK')) {
    results.push(rankLowStock(ctx, facts))
  }
  if (queryDecisions().some((d) => d.code === 'LATE_ORDER')) {
    results.push(rankLateOrder(ctx))
  }

  // Enrich path with graph neighbors for traceability
  for (const d of results) {
    for (const step of d.path) {
      const conceptId = queryDecisions()
        .find((x) => x.id === d.decisionId)
        ?.steps.find((s) => s.id === step.stepId)?.conceptId
      if (!conceptId) continue
      const n = queryConceptNeighbors(conceptId)
      if (n.outbound[0]) {
        step.outcome = `${step.outcome} · graph→ ${n.outbound[0].node.label}`
      }
    }
  }

  return results
}
