/**
 * Manufacturing Planning Engine — orchestrator.
 * Consumes Knowledge + Reasoning run; emits alternative plans A/B/C.
 * Read-only. sideEffects: NONE. No LLM.
 */
import { runManufacturingReasoning } from '@/domain/brain/manufacturing-reasoning'

import { buildPlan, selectPreferredVariant } from './plan-builder'
import type { ManufacturingPlanningRun, PlanningCoverage, PlanVariant } from './types'
import { MANUFACTURING_PLANNING_SCHEMA_VERSION } from './types'

function buildCoverage(run: Omit<ManufacturingPlanningRun, 'coverage'>): PlanningCoverage {
  const preferred = run.plans.find((p) => p.variant === run.preferredVariant) ?? run.plans[0]
  return {
    schemaVersion: MANUFACTURING_PLANNING_SCHEMA_VERSION,
    llmEnabled: false,
    sideEffects: 'NONE',
    pipeline: ['Knowledge', 'Facts', 'Reasoning', 'Constraints', 'Decisions', 'Planning'],
    implementedLayers: ['Knowledge', 'Reasoning', 'Planning'],
    totals: {
      plans: run.plans.length,
      sequenceSteps: preferred?.sequencing.length ?? 0,
      capacityRows: preferred?.capacity.length ?? 0,
      machineRows: preferred?.machines.length ?? 0,
      operatorRows: preferred?.operators.length ?? 0,
      materialRows: preferred?.materials.length ?? 0,
      purchasingSuggestions: preferred?.purchasing.length ?? 0,
      shipmentImpacts: preferred?.shipmentImpact.length ?? 0,
      deliveryRisks: preferred?.deliveryRisks.length ?? 0,
      criticalPathNodes: preferred?.criticalPath.length ?? 0,
      bottlenecks: preferred?.bottlenecks.length ?? 0,
    },
    preferredVariant: run.preferredVariant,
    consumedFromReasoning: {
      facts: 0,
      constraints: 0,
      decisions: 0,
      recommendations: 0,
    },
  }
}

/** Full planning run — recommend-only, never mutates ERP. */
export function runManufacturingPlanning(): ManufacturingPlanningRun {
  const reasoning = runManufacturingReasoning()
  const variants: PlanVariant[] = ['A', 'B', 'C']
  const plans = variants.map((v) => buildPlan(v, reasoning))
  const preferredVariant = selectPreferredVariant(plans)

  const partial: Omit<ManufacturingPlanningRun, 'coverage'> = {
    schemaVersion: MANUFACTURING_PLANNING_SCHEMA_VERSION,
    ranAt: new Date().toISOString(),
    llmEnabled: false,
    sideEffects: 'NONE',
    preferredVariant,
    plans,
  }

  const coverage = buildCoverage(partial)
  coverage.consumedFromReasoning = {
    facts: reasoning.facts.length,
    constraints: reasoning.constraints.length,
    decisions: reasoning.decisions.length,
    recommendations: reasoning.recommendations.length,
  }

  return { ...partial, coverage }
}

export function queryManufacturingPlanningCoverage(): PlanningCoverage {
  return runManufacturingPlanning().coverage
}

export function queryPlanningPlans() {
  return runManufacturingPlanning().plans
}

export function queryPreferredPlan() {
  const run = runManufacturingPlanning()
  return run.plans.find((p) => p.variant === run.preferredVariant) ?? run.plans[0] ?? null
}
