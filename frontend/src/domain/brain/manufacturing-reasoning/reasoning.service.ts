/**
 * Manufacturing Reasoning Engine — orchestrates the industrial inference pipeline.
 * Facts → Graph → Rules → Formulae → Constraints → Decisions → Recommendations
 * No LLM. Side effects: NONE. Never mutates ERP.
 */
import {
  evaluateFormula,
  queryConceptNeighbors,
  queryFormulae,
  queryManufacturingKnowledgeGraph,
} from '@/domain/brain/manufacturing-knowledge'
import { queryLatestMrpRun } from '@/domain/mrp/mrp-query.service'

import { evaluateConstraints } from './constraint-engine'
import { runDecisionEngine } from './decision-engine'
import { collectManufacturingFacts, countFactsByModule } from './fact-engine'
import { buildRecommendations } from './recommendation-engine'
import { evaluateBusinessRules } from './rule-engine'
import type {
  FormulaRunResult,
  GraphTraversalHit,
  ManufacturingReasoningRun,
  ReasoningCoverage,
  RuleVerdict,
} from './types'
import { MANUFACTURING_REASONING_SCHEMA_VERSION } from './types'

function runFormulae(context: ReturnType<typeof collectManufacturingFacts>['context']): FormulaRunResult[] {
  const results: FormulaRunResult[] = []
  const mrp = queryLatestMrpRun()
  const lines = mrp?.currentSnapshot.lines ?? []

  const aggregateMrp = evaluateFormula('MRP_NET_REQUIREMENT', {
    gross: Number(context.gross) || 0,
    stock: Number(context.stock) || 0,
    openPO: Number(context.openPO) || 0,
    openProduction: Number(context.openProductionQty) || 0,
  })
  const mrpDef = queryFormulae().find((f) => f.code === 'MRP_NET_REQUIREMENT')
  results.push({
    formulaId: aggregateMrp.formulaId,
    formulaCode: mrpDef?.code ?? 'MRP_NET_REQUIREMENT',
    ok: aggregateMrp.ok,
    value: aggregateMrp.value,
    unit: aggregateMrp.unit,
    input: {
      gross: Number(context.gross) || 0,
      stock: Number(context.stock) || 0,
      openPO: Number(context.openPO) || 0,
      openProduction: Number(context.openProductionQty) || 0,
    },
    explanation: aggregateMrp.explanation,
    subjectId: 'aggregate',
    subjectLabel: 'All MRP lines',
  })

  for (const line of lines.filter((l) => l.netShortage > 0 || l.netRequirement > 0).slice(0, 12)) {
    const r = evaluateFormula('MRP_NET_REQUIREMENT', {
      gross: line.grossRequirement,
      stock: line.availableStock,
      openPO: line.openPurchaseQty,
      openProduction: line.openProductionQty,
    })
    results.push({
      formulaId: r.formulaId,
      formulaCode: 'MRP_NET_REQUIREMENT',
      ok: r.ok,
      value: r.value,
      unit: r.unit,
      input: {
        gross: line.grossRequirement,
        stock: line.availableStock,
        openPO: line.openPurchaseQty,
        openProduction: line.openProductionQty,
      },
      explanation: r.explanation,
      subjectId: line.stockCardId,
      subjectLabel: line.materialName,
    })
  }

  const waste = evaluateFormula('WASTE_PCT', {
    wasteQty: Number(context.wastePct) || 0,
    issuedQty: 1,
  })
  results.push({
    formulaId: waste.formulaId,
    formulaCode: 'WASTE_PCT',
    ok: waste.ok,
    value: waste.value,
    unit: waste.unit,
    input: { wasteQty: Number(context.wastePct) || 0, issuedQty: 1 },
    explanation: waste.explanation,
    subjectId: 'planning-waste',
    subjectLabel: 'Planning waste proxy',
  })

  if (Number(context.rollLength) > 0 && Number(context.markerLength) > 0) {
    const top = evaluateFormula('TOP_END', {
      rollLength: Number(context.rollLength),
      markerLength: Number(context.markerLength),
      layers: 1,
    })
    results.push({
      formulaId: top.formulaId,
      formulaCode: 'TOP_END',
      ok: top.ok,
      value: top.value,
      unit: top.unit,
      input: {
        rollLength: Number(context.rollLength),
        markerLength: Number(context.markerLength),
        layers: 1,
      },
      explanation: top.explanation,
    })
  }

  return results
}

function traverseGraph(): GraphTraversalHit[] {
  const graph = queryManufacturingKnowledgeGraph()
  const roots = graph.rootConceptIds.length ? graph.rootConceptIds : ['c-cotton', 'c-order', 'c-warehouse']
  const hits: GraphTraversalHit[] = []
  for (const root of roots) {
    const n = queryConceptNeighbors(root)
    if (!n.concept) continue
    for (const o of n.outbound) {
      hits.push({
        fromConceptId: n.concept.id,
        fromLabel: n.concept.label,
        relation: o.edge.relation,
        toConceptId: o.node.id,
        toLabel: o.node.label,
      })
    }
  }
  // Material path sample
  const fabric = queryConceptNeighbors('c-cotton')
  if (fabric.concept) {
    for (const o of fabric.outbound) {
      hits.push({
        fromConceptId: fabric.concept.id,
        fromLabel: fabric.concept.label,
        relation: o.edge.relation,
        toConceptId: o.node.id,
        toLabel: o.node.label,
      })
    }
  }
  // Dedupe
  const seen = new Set<string>()
  return hits.filter((h) => {
    const k = `${h.fromConceptId}|${h.relation}|${h.toConceptId}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function buildCoverage(run: Omit<ManufacturingReasoningRun, 'coverage'>): ReasoningCoverage {
  const verdictCounts: Record<RuleVerdict, number> = {
    PASS: 0,
    WARNING: 0,
    CRITICAL: 0,
    BLOCKED: 0,
  }
  for (const r of run.ruleEvaluations) verdictCounts[r.verdict] += 1
  for (const c of run.constraints) verdictCounts[c.verdict] += 1

  return {
    schemaVersion: MANUFACTURING_REASONING_SCHEMA_VERSION,
    llmEnabled: false,
    sideEffects: 'NONE',
    pipeline: [
      'Facts',
      'KnowledgeGraph',
      'BusinessRules',
      'FormulaEngine',
      'ConstraintEngine',
      'DecisionEngine',
      'RecommendationEngine',
    ],
    implementedLayers: ['Knowledge', 'Reasoning'],
    totals: {
      facts: run.facts.length,
      ruleEvaluations: run.ruleEvaluations.length,
      formulaeRun: run.formulae.length,
      constraints: run.constraints.length,
      decisions: run.decisions.length,
      recommendations: run.recommendations.length,
      graphHits: run.graphHits.length,
    },
    verdictCounts,
    sourceModules: countFactsByModule(run.facts),
  }
}

/** Full industrial reasoning run — pure recommendation surface. */
export function runManufacturingReasoning(): ManufacturingReasoningRun {
  const { facts, context } = collectManufacturingFacts()
  const graphHits = traverseGraph()
  const ruleEvaluations = evaluateBusinessRules(context)
  const formulae = runFormulae(context)
  const constraints = evaluateConstraints({ context, rules: ruleEvaluations, formulae })
  const decisions = runDecisionEngine(context, facts)
  const recommendations = buildRecommendations({
    rules: ruleEvaluations,
    formulae,
    constraints,
    decisions,
  })

  const partial: Omit<ManufacturingReasoningRun, 'coverage'> = {
    schemaVersion: MANUFACTURING_REASONING_SCHEMA_VERSION,
    ranAt: new Date().toISOString(),
    llmEnabled: false,
    sideEffects: 'NONE',
    facts,
    factContext: context,
    graphHits,
    ruleEvaluations,
    formulae,
    constraints,
    decisions,
    recommendations,
  }

  return {
    ...partial,
    coverage: buildCoverage(partial),
  }
}

export function queryManufacturingReasoningCoverage(): ReasoningCoverage {
  return runManufacturingReasoning().coverage
}

export function queryReasoningFacts() {
  return collectManufacturingFacts().facts
}

export function queryReasoningRuleEvaluations() {
  return runManufacturingReasoning().ruleEvaluations
}

export function queryReasoningConstraints() {
  return runManufacturingReasoning().constraints
}

export function queryReasoningDecisions() {
  return runManufacturingReasoning().decisions
}

export function queryReasoningRecommendations() {
  return runManufacturingReasoning().recommendations
}
