/**
 * Deterministic scenario simulator — applies shocks to planning/reasoning baseline.
 * Pure computation. Never mutates ERP.
 */
import type { ManufacturingPlanningRun, ManufacturingPlan } from '@/domain/brain/manufacturing-planning'
import type { ManufacturingReasoningRun } from '@/domain/brain/manufacturing-reasoning'

import type {
  ScenarioDefinition,
  ScenarioResult,
  ScenarioShock,
  SimulationMetrics,
  TimelinePoint,
} from './types'

type BaselineState = {
  completionDay: number
  utilization: number
  otifScore: number
  wip: number
  queue: number
  inventory: number
  purchasingQty: number
  shipmentDelay: number
  bottleneck: string
  costBase: number
  machineHours: number
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function preferredPlan(planning: ManufacturingPlanningRun): ManufacturingPlan {
  return (
    planning.plans.find((p) => p.variant === planning.preferredVariant) ??
    planning.plans[0]!
  )
}

export function deriveBaseline(
  planning: ManufacturingPlanningRun,
  reasoning: ManufacturingReasoningRun,
): BaselineState {
  const plan = preferredPlan(planning)
  const completionDay = plan.sequencing.reduce(
    (max, s) => Math.max(max, s.plannedStartDayOffset + s.plannedDurationDays),
    0,
  )
  const utilization =
    plan.capacity.length === 0
      ? Number(reasoning.factContext.maxUtilization) || 70
      : plan.capacity.reduce((s, c) => s + c.utilizationAfter, 0) / plan.capacity.length

  const highRisk = plan.deliveryRisks.filter(
    (d) => d.riskLevel === 'HIGH' || d.riskLevel === 'CRITICAL',
  ).length
  const otifScore = clamp(95 - highRisk * 6 - (Number(reasoning.factContext.lateOrderCount) || 0) * 3, 40, 99)

  const wip = plan.sequencing.reduce((s, x) => s + x.remainingQty, 0)
  const queue = Math.round(wip * 0.15)
  const inventory = Number(reasoning.factContext.inventoryAvailable) || plan.materials.reduce((s, m) => s + m.availableQty, 0)
  const purchasingQty = plan.purchasing.reduce((s, p) => s + p.quantity, 0)
  const shipmentDelay =
    plan.shipmentImpact.length === 0
      ? 0
      : plan.shipmentImpact.reduce((s, x) => s + x.delayedDays, 0) / plan.shipmentImpact.length
  const bottleneck = plan.bottlenecks[0]?.label ?? reasoning.constraints.find((c) => c.verdict !== 'PASS')?.title ?? 'None'
  const machineHours = plan.machines.reduce((s, m) => s + m.estimatedHours, 0)
  const costBase = machineHours * 45 + purchasingQty * 2.5 + wip * 0.15

  return {
    completionDay: Math.max(1, completionDay),
    utilization,
    otifScore,
    wip,
    queue,
    inventory,
    purchasingQty,
    shipmentDelay,
    bottleneck,
    costBase,
    machineHours,
  }
}

type ShockEffect = {
  completionDelta: number
  utilizationDelta: number
  otifDelta: number
  wipDelta: number
  queueDelta: number
  inventoryDelta: number
  purchasingDelta: number
  shipmentDelta: number
  costDelta: number
  bottleneckOverride: string | null
  drivers: string[]
}

function applyShock(shock: ScenarioShock, baseline: BaselineState): ShockEffect {
  const empty: ShockEffect = {
    completionDelta: 0,
    utilizationDelta: 0,
    otifDelta: 0,
    wipDelta: 0,
    queueDelta: 0,
    inventoryDelta: 0,
    purchasingDelta: 0,
    shipmentDelta: 0,
    costDelta: 0,
    bottleneckOverride: null,
    drivers: [],
  }

  switch (shock.type) {
    case 'MACHINE_DOWNTIME': {
      const days = shock.magnitude / 8
      return {
        ...empty,
        completionDelta: days,
        utilizationDelta: -Math.min(15, shock.magnitude * 1.2),
        otifDelta: -Math.min(12, days * 3),
        wipDelta: baseline.wip * 0.04 * days,
        queueDelta: baseline.queue * 0.2 * days + shock.magnitude * 5,
        shipmentDelta: days * 0.8,
        costDelta: shock.magnitude * 85 + days * 120,
        bottleneckOverride: `Machine ${shock.target} downtime`,
        drivers: [`${shock.target} down ${shock.magnitude}h → +${round1(days)}d completion`],
      }
    }
    case 'SUPPLIER_DELAY': {
      const d = shock.magnitude
      return {
        ...empty,
        completionDelta: d * 0.9,
        utilizationDelta: -Math.min(10, d * 2),
        otifDelta: -Math.min(18, d * 4),
        wipDelta: -baseline.wip * 0.02 * d,
        queueDelta: baseline.queue * 0.1 * d,
        inventoryDelta: -Math.min(baseline.inventory * 0.08, d * 120),
        purchasingDelta: d * 80,
        shipmentDelta: d,
        costDelta: d * 350 + d * 40,
        bottleneckOverride: `Supplier ${shock.target} delay`,
        drivers: [`Supplier ${shock.target} +${d}d → material gate`],
      }
    }
    case 'ORDER_URGENT': {
      return {
        ...empty,
        completionDelta: -1.5,
        utilizationDelta: 8,
        otifDelta: 4,
        wipDelta: baseline.wip * 0.03,
        queueDelta: baseline.queue * 0.15,
        shipmentDelta: -0.5,
        costDelta: 600,
        bottleneckOverride: null,
        drivers: [`${shock.target} marked urgent → re-sequence priority`],
      }
    }
    case 'OVERTIME_ENABLED': {
      return {
        ...empty,
        completionDelta: -2,
        utilizationDelta: 12,
        otifDelta: 6,
        wipDelta: -baseline.wip * 0.05,
        queueDelta: -baseline.queue * 0.2,
        shipmentDelta: -1,
        costDelta: baseline.machineHours * 18,
        bottleneckOverride: null,
        drivers: ['Overtime enabled → capacity surge, labor cost up'],
      }
    }
    case 'OPERATOR_AVAILABILITY': {
      const delta = shock.magnitude // negative = less available
      return {
        ...empty,
        completionDelta: delta < 0 ? Math.abs(delta) * 10 : -delta * 6,
        utilizationDelta: delta * 40,
        otifDelta: delta * 20,
        wipDelta: delta < 0 ? baseline.wip * Math.abs(delta) * 0.4 : -baseline.wip * delta * 0.2,
        queueDelta: delta < 0 ? baseline.queue * Math.abs(delta) * 0.5 : -baseline.queue * delta * 0.3,
        shipmentDelta: delta < 0 ? Math.abs(delta) * 5 : -delta * 3,
        costDelta: delta < 0 ? Math.abs(delta) * 900 : delta * 400,
        bottleneckOverride: delta < 0 ? `Operator shortage ${shock.target}` : null,
        drivers: [
          `Operator availability ${shock.target} Δ${round2(delta * 100)}%`,
        ],
      }
    }
    case 'CUTTING_YIELD_DROP': {
      const pct = shock.magnitude
      return {
        ...empty,
        completionDelta: pct * 0.4,
        utilizationDelta: pct * 0.8,
        otifDelta: -pct * 1.5,
        wipDelta: baseline.wip * (pct / 100) * 0.5,
        inventoryDelta: -pct * 40,
        purchasingDelta: pct * 55,
        shipmentDelta: pct * 0.35,
        costDelta: pct * 220,
        bottleneckOverride: 'Cutting yield / material waste',
        drivers: [`Cutting yield −${pct}% → more fabric issue & rework`],
      }
    }
    default:
      return empty
  }
}

function mergeEffects(effects: ShockEffect[]): ShockEffect {
  return effects.reduce(
    (acc, e) => ({
      completionDelta: acc.completionDelta + e.completionDelta,
      utilizationDelta: acc.utilizationDelta + e.utilizationDelta,
      otifDelta: acc.otifDelta + e.otifDelta,
      wipDelta: acc.wipDelta + e.wipDelta,
      queueDelta: acc.queueDelta + e.queueDelta,
      inventoryDelta: acc.inventoryDelta + e.inventoryDelta,
      purchasingDelta: acc.purchasingDelta + e.purchasingDelta,
      shipmentDelta: acc.shipmentDelta + e.shipmentDelta,
      costDelta: acc.costDelta + e.costDelta,
      bottleneckOverride: e.bottleneckOverride ?? acc.bottleneckOverride,
      drivers: [...acc.drivers, ...e.drivers],
    }),
    {
      completionDelta: 0,
      utilizationDelta: 0,
      otifDelta: 0,
      wipDelta: 0,
      queueDelta: 0,
      inventoryDelta: 0,
      purchasingDelta: 0,
      shipmentDelta: 0,
      costDelta: 0,
      bottleneckOverride: null,
      drivers: [] as string[],
    },
  )
}

function buildTimeline(baseline: BaselineState, effect: ShockEffect, horizon = 14): TimelinePoint[] {
  const completion = Math.max(1, baseline.completionDay + effect.completionDelta)
  const points: TimelinePoint[] = []
  for (let d = 0; d <= horizon; d += 1) {
    const progress = clamp(d / completion, 0, 1)
    const util = clamp(
      baseline.utilization + effect.utilizationDelta * (1 - progress * 0.3) + Math.sin(d / 2) * 1.5,
      20,
      130,
    )
    const wip = Math.max(
      0,
      baseline.wip * (1 - progress * 0.85) + effect.wipDelta * (1 - progress),
    )
    const queue = Math.max(
      0,
      baseline.queue * (1 - progress * 0.7) + effect.queueDelta * Math.exp(-d / 8),
    )
    const inventory = Math.max(
      0,
      baseline.inventory + effect.inventoryDelta * progress - progress * baseline.purchasingQty * 0.05,
    )
    points.push({
      dayOffset: d,
      label: `D+${d}`,
      wip: Math.round(wip),
      utilization: round1(util),
      completions: Math.round(baseline.wip * progress * 0.7),
      queue: Math.round(queue),
      inventory: Math.round(inventory),
    })
  }
  return points
}

function scoreConfidence(
  definition: ScenarioDefinition,
  reasoning: ManufacturingReasoningRun,
): number {
  let c = 70
  c += Math.min(15, reasoning.facts.length / 20)
  c += reasoning.constraints.filter((x) => x.verdict === 'PASS').length * 2
  c -= definition.shocks.length * 3
  if (definition.slot === 'CURRENT') c += 8
  return clamp(Math.round(c), 35, 95)
}

export function simulateScenario(
  definition: ScenarioDefinition,
  baseline: BaselineState,
  reasoning: ManufacturingReasoningRun,
): ScenarioResult {
  const effect = mergeEffects(definition.shocks.map((s) => applyShock(s, baseline)))
  const completion = Math.max(1, round1(baseline.completionDay + effect.completionDelta))
  const utilization = clamp(round1(baseline.utilization + effect.utilizationDelta), 0, 140)
  const otif = clamp(round1(baseline.otifScore + effect.otifDelta), 0, 100)
  const bottleneckLabel = effect.bottleneckOverride ?? baseline.bottleneck
  const bottleneckMoved = bottleneckLabel !== baseline.bottleneck

  const metrics: SimulationMetrics = {
    otifImpactPct: round1(otif - baseline.otifScore),
    productionCompletionDayOffset: round1(completion - baseline.completionDay),
    resourceUtilizationPct: utilization,
    queueGrowthUnits: Math.round(effect.queueDelta),
    bottleneckLabel,
    bottleneckMoved,
    wipDelta: Math.round(effect.wipDelta),
    inventoryImpactUnits: Math.round(effect.inventoryDelta),
    purchasingImpactQty: round1(effect.purchasingDelta),
    shipmentDelayDays: round1(baseline.shipmentDelay + effect.shipmentDelta),
    costDelta: round2(effect.costDelta),
    confidence: scoreConfidence(definition, reasoning),
  }

  const assumptions = [
    'Preferred planning variant is the simulation baseline',
    'Shocks are independent and linearly combined (deterministic)',
    'No ERP mutation — results are hypothetical recommendations',
    definition.shocks.length === 0
      ? 'Baseline has zero shocks'
      : `${definition.shocks.length} shock(s) applied: ${definition.shocks.map((s) => s.type).join(', ')}`,
  ]

  return {
    slot: definition.slot,
    definition,
    metrics,
    timeline: buildTimeline(baseline, effect),
    assumptions,
    drivers: effect.drivers.length ? effect.drivers : ['No shock drivers — baseline path'],
  }
}
