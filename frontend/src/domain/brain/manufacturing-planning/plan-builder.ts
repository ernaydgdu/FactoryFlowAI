/**
 * Builds alternative manufacturing plans A / B / C with explanations.
 */
import type { ManufacturingReasoningRun } from '@/domain/brain/manufacturing-reasoning'

import {
  buildBottlenecks,
  buildCriticalPath,
  buildDeliveryRisks,
  buildPurchasingSuggestions,
  buildShipmentImpact,
} from './impact-analysis'
import {
  buildCapacityAllocation,
  buildMachineAllocation,
  buildMaterialAllocation,
  buildOperatorAllocation,
  buildSequencing,
  strategyForVariant,
} from './sequencing-allocation'
import type { ManufacturingPlan, PlanExplanation, PlanVariant } from './types'

const VARIANT_META: Record<
  PlanVariant,
  { name: string; strategyLabel: string }
> = {
  A: { name: 'Plan A — OTIF First', strategyLabel: 'Prioritize termin-risk orders, overtime & partial ship' },
  B: { name: 'Plan B — Efficiency First', strategyLabel: 'Balance utilization, alternate WC, minimize overtime' },
  C: { name: 'Plan C — Material Constrained', strategyLabel: 'Sequence by material readiness; purchase before load' },
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function buildExplanation(
  variant: PlanVariant,
  reasoning: ManufacturingReasoningRun,
  plan: Omit<ManufacturingPlan, 'explanation' | 'confidence'>,
): PlanExplanation {
  const strategy = strategyForVariant(variant)
  const constraintSummaries = reasoning.constraints.map((c) => `${c.domain}:${c.verdict}`)
  const bestDecisions = reasoning.decisions
    .map((d) => (d.best ? `${d.decisionCode}→${d.best.action}` : d.decisionCode))
    .slice(0, 4)

  const assumptions = [
    'ERP facts are current as of reasoning collection timestamp',
    'FIFO enabled unless contradicted by inventory policy facts',
    'Machine maintenance not expired unless fact says otherwise',
    strategy === 'OTIF_FIRST'
      ? 'Customer OTIF outweighs short-term efficiency loss'
      : strategy === 'EFFICIENCY_FIRST'
        ? 'Stable line efficiency outweighs aggressive overtime'
        : 'Material availability gates start dates more than capacity',
  ]

  const kpisImproved =
    strategy === 'OTIF_FIRST'
      ? ['OTIF', 'Lead Time', 'Delivery Risk']
      : strategy === 'EFFICIENCY_FIRST'
        ? ['Efficiency', 'Utilization', 'OEE']
        : ['Waste %', 'Material coverage', 'MRP net need']

  const risks = [
    ...plan.bottlenecks.slice(0, 3).map((b) => `${b.kind}: ${b.label}`),
    ...plan.deliveryRisks
      .filter((d) => d.riskLevel === 'HIGH' || d.riskLevel === 'CRITICAL')
      .slice(0, 3)
      .map((d) => `${d.salesOrderNo} delivery ${d.riskLevel}`),
  ]
  if (risks.length === 0) risks.push('No CRITICAL residual risks in this plan snapshot')

  return {
    why: `${VARIANT_META[variant].name} chosen under strategy "${VARIANT_META[variant].strategyLabel}". Decisions: ${bestDecisions.join('; ') || 'none'}.`,
    assumptions,
    constraintsEvaluated: constraintSummaries,
    kpisImproved,
    risksRemaining: risks,
  }
}

function scoreConfidence(
  variant: PlanVariant,
  reasoning: ManufacturingReasoningRun,
  plan: Omit<ManufacturingPlan, 'explanation' | 'confidence'>,
): number {
  let score = 55
  const passConstraints = reasoning.constraints.filter((c) => c.verdict === 'PASS').length
  score += passConstraints * 4
  score += Math.min(15, plan.sequencing.length)
  score -= plan.bottlenecks.filter((b) => b.severity === 'CRITICAL').length * 8
  score -= plan.deliveryRisks.filter((d) => d.riskLevel === 'CRITICAL').length * 5
  score += Math.min(10, reasoning.recommendations.length)
  if (variant === 'A' && reasoning.factContext.hasLateOrder) score += 5
  if (variant === 'C' && Number(reasoning.factContext.netShortage) > 0) score += 5
  if (variant === 'B' && Number(reasoning.factContext.maxUtilization) < 95) score += 5
  // Prefer plans that align with decision best actions
  if (reasoning.decisions.some((d) => d.best && d.decisionCode === 'LATE_ORDER') && variant === 'A') {
    score += 4
  }
  if (reasoning.decisions.some((d) => d.best && d.decisionCode === 'LOW_STOCK') && variant === 'C') {
    score += 4
  }
  return clamp(score)
}

export function buildPlan(variant: PlanVariant, reasoning: ManufacturingReasoningRun): ManufacturingPlan {
  const strategy = strategyForVariant(variant)
  const sequencing = buildSequencing(variant, reasoning)
  const capacity = buildCapacityAllocation(sequencing)
  const machines = buildMachineAllocation(sequencing)
  const operators = buildOperatorAllocation(sequencing, capacity)
  const materials = buildMaterialAllocation()
  const purchasing = buildPurchasingSuggestions(materials, strategy)
  const shipmentImpact = buildShipmentImpact(sequencing, reasoning)
  const deliveryRisks = buildDeliveryRisks(shipmentImpact, reasoning)
  const criticalPath = buildCriticalPath(sequencing)
  const bottlenecks = buildBottlenecks(reasoning, materials, strategy)

  const partial = {
    variant,
    name: VARIANT_META[variant].name,
    strategy: VARIANT_META[variant].strategyLabel,
    sequencing,
    capacity,
    machines,
    operators,
    materials,
    purchasing,
    shipmentImpact,
    deliveryRisks,
    criticalPath,
    bottlenecks,
  }

  return {
    ...partial,
    confidence: scoreConfidence(variant, reasoning, partial),
    explanation: buildExplanation(variant, reasoning, partial),
  }
}

export function selectPreferredVariant(plans: ManufacturingPlan[]): PlanVariant {
  const sorted = [...plans].sort((a, b) => b.confidence - a.confidence)
  return sorted[0]?.variant ?? 'A'
}
