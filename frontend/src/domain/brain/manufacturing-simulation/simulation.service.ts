/**
 * Manufacturing Simulation Engine — orchestrator.
 * Consumes Planning + Reasoning; runs CURRENT / A / B / C scenarios.
 * Read-only. sideEffects: NONE. No LLM.
 */
import { runManufacturingPlanning } from '@/domain/brain/manufacturing-planning'
import { runManufacturingReasoning } from '@/domain/brain/manufacturing-reasoning'

import { SCENARIO_CATALOG } from './scenario-catalog'
import { deriveBaseline, simulateScenario } from './simulator'
import type {
  ManufacturingSimulationRun,
  MetricComparisonRow,
  SimulationCoverage,
} from './types'
import { MANUFACTURING_SIMULATION_SCHEMA_VERSION } from './types'

function buildComparison(
  scenarios: ManufacturingSimulationRun['scenarios'],
): MetricComparisonRow[] {
  const bySlot = Object.fromEntries(scenarios.map((s) => [s.slot, s.metrics])) as Record<
    string,
    (typeof scenarios)[number]['metrics']
  >
  const cur = bySlot.CURRENT
  const a = bySlot.A
  const b = bySlot.B
  const c = bySlot.C
  if (!cur || !a || !b || !c) return []

  return [
    {
      metric: 'OTIF impact',
      current: cur.otifImpactPct,
      a: a.otifImpactPct,
      b: b.otifImpactPct,
      c: c.otifImpactPct,
      unit: 'pp',
    },
    {
      metric: 'Completion day Δ',
      current: cur.productionCompletionDayOffset,
      a: a.productionCompletionDayOffset,
      b: b.productionCompletionDayOffset,
      c: c.productionCompletionDayOffset,
      unit: 'days',
    },
    {
      metric: 'Utilization',
      current: cur.resourceUtilizationPct,
      a: a.resourceUtilizationPct,
      b: b.resourceUtilizationPct,
      c: c.resourceUtilizationPct,
      unit: '%',
    },
    {
      metric: 'Queue growth',
      current: cur.queueGrowthUnits,
      a: a.queueGrowthUnits,
      b: b.queueGrowthUnits,
      c: c.queueGrowthUnits,
      unit: 'units',
    },
    {
      metric: 'WIP Δ',
      current: cur.wipDelta,
      a: a.wipDelta,
      b: b.wipDelta,
      c: c.wipDelta,
      unit: 'units',
    },
    {
      metric: 'Inventory impact',
      current: cur.inventoryImpactUnits,
      a: a.inventoryImpactUnits,
      b: b.inventoryImpactUnits,
      c: c.inventoryImpactUnits,
      unit: 'units',
    },
    {
      metric: 'Purchasing impact',
      current: cur.purchasingImpactQty,
      a: a.purchasingImpactQty,
      b: b.purchasingImpactQty,
      c: c.purchasingImpactQty,
      unit: 'qty',
    },
    {
      metric: 'Shipment delay',
      current: cur.shipmentDelayDays,
      a: a.shipmentDelayDays,
      b: b.shipmentDelayDays,
      c: c.shipmentDelayDays,
      unit: 'days',
    },
    {
      metric: 'Cost Δ',
      current: cur.costDelta,
      a: a.costDelta,
      b: b.costDelta,
      c: c.costDelta,
      unit: 'currency',
    },
    {
      metric: 'Confidence',
      current: cur.confidence,
      a: a.confidence,
      b: b.confidence,
      c: c.confidence,
      unit: '%',
    },
  ]
}

function buildCoverage(
  run: Omit<ManufacturingSimulationRun, 'coverage'>,
  planningPlans: number,
  reasoningConstraints: number,
  reasoningFacts: number,
): SimulationCoverage {
  return {
    schemaVersion: MANUFACTURING_SIMULATION_SCHEMA_VERSION,
    llmEnabled: false,
    sideEffects: 'NONE',
    pipeline: ['Knowledge', 'Facts', 'Reasoning', 'Planning', 'Simulation'],
    implementedLayers: ['Knowledge', 'Reasoning', 'Planning', 'Simulation'],
    totals: {
      scenarios: run.scenarios.length,
      timelinePoints: run.scenarios.reduce((s, x) => s + x.timeline.length, 0),
      comparisonRows: run.comparison.length,
    },
    consumed: {
      planningPlans,
      reasoningConstraints,
      reasoningFacts,
    },
  }
}

/** Full simulation run — hypothetical only, never mutates ERP. */
export function runManufacturingSimulation(): ManufacturingSimulationRun {
  const reasoning = runManufacturingReasoning()
  const planning = runManufacturingPlanning()
  const baseline = deriveBaseline(planning, reasoning)
  const scenarios = SCENARIO_CATALOG.map((def) => simulateScenario(def, baseline, reasoning))
  const comparison = buildComparison(scenarios)

  const partial: Omit<ManufacturingSimulationRun, 'coverage'> = {
    schemaVersion: MANUFACTURING_SIMULATION_SCHEMA_VERSION,
    ranAt: new Date().toISOString(),
    llmEnabled: false,
    sideEffects: 'NONE',
    baselineSlot: 'CURRENT',
    scenarios,
    comparison,
  }

  return {
    ...partial,
    coverage: buildCoverage(
      partial,
      planning.plans.length,
      reasoning.constraints.length,
      reasoning.facts.length,
    ),
  }
}

export function queryManufacturingSimulationCoverage() {
  return runManufacturingSimulation().coverage
}

export function querySimulationScenarios() {
  return runManufacturingSimulation().scenarios
}

export function querySimulationComparison() {
  return runManufacturingSimulation().comparison
}
