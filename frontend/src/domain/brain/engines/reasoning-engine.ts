/**
 * Reasoning Engine — LLM değil; Fact + Kural + Alternatif + Trade-Off orchestrator.
 *
 * Reasoning Tree:
 * Question → Facts → Evidence → Reasoning → Alternatives → Trade-Off → Explanation
 */
import { INSIGHT_CODES } from '../constants'
import { assertMinimumAlternatives, generateAlternatives } from './alternative-engine'
import { assessBrainHealth } from './brain-health-engine'
import { calculateConfidence } from './confidence-engine'
import { createVersionedMetadata } from './brain-version'
import { extractFacts, formatIncompleteDueToMissingData, rejectAssumptions } from './fact-engine'
import { buildTerminRiskExplanation, buildGenericExplanation } from './explanation-engine'
import { buildKnowledgeGraph } from './knowledge-engine'
import { resolvePersonaForFocus } from './persona-registry'
import { runEnabledPlugins } from '../plugins/plugin-registry'
import type { BrainContext, BrainInsight, BrainKnowledgeSnapshot } from '../types'
import type {
  BrainReasoningOutput,
  IncompleteAnalysis,
  ReasoningStep,
  ReasoningTree,
} from '../types/knowledge-reasoning'

let reasoningCounter = 0

export function runReasoningEngine(
  context: BrainContext,
  snapshot: BrainKnowledgeSnapshot,
): BrainReasoningOutput {
  reasoningCounter += 1
  const analysisId = `reasoning-${reasoningCounter}`
  const focusArea = context.scope.focusArea ?? 'GENERAL'
  const persona = resolvePersonaForFocus(focusArea)

  const graph = buildKnowledgeGraph(snapshot)
  const rawFacts = extractFacts(snapshot, graph)
  const facts = rejectAssumptions(rawFacts)
  const confidence = calculateConfidence(graph, snapshot)

  if (confidence.incomplete && confidence.score < 40) {
    return buildIncompleteOutput(analysisId, context, snapshot, graph, facts, confidence, persona.id)
  }

  const reasoningSteps = buildReasoningSteps(facts, focusArea)
  const contextLabel = context.scope.orderNo ?? context.scope.orderId ?? 'Portföy'
  const alternatives = generateAlternatives(focusArea, contextLabel, confidence.score)
  assertMinimumAlternatives(alternatives)

  const explanation =
    focusArea === 'TERMIN' || focusArea === 'ORDER_RISK'
      ? buildTerminRiskExplanation(facts, confidence.score)
      : buildGenericExplanation(`${focusArea} Analizi`, facts, confidence.score)

  const evidence = facts.map((f) => ({
    sourceId: f.sourceId,
    reference: f.reference,
    fact: f.statement,
  }))

  const reasoningTree: ReasoningTree = {
    treeId: `rtree-${reasoningCounter}`,
    question: buildQuestion(focusArea, contextLabel),
    focusArea,
    facts,
    evidence,
    reasoningSteps,
    alternatives,
    explanation,
    confidence,
    brainVersion: createVersionedMetadata(persona.id).brainVersion,
    personaId: persona.id,
    generatedAt: new Date().toISOString(),
  }

  runEnabledPlugins({ companyId: context.companyId, graph, facts })

  const health = assessBrainHealth(graph, confidence)
  const version = createVersionedMetadata(persona.id, [])

  return {
    analysisId,
    graph,
    facts,
    reasoningTree,
    health,
    version,
    generatedAt: new Date().toISOString(),
  }
}

export function reasoningOutputToInsights(output: BrainReasoningOutput): BrainInsight[] {
  const insights: BrainInsight[] = []
  const tree = output.reasoningTree

  if (tree.explanation.totalScore >= 50) {
    insights.push({
      id: `ins-${insights.length + 1}`,
      code: INSIGHT_CODES.TERMIN_RISK,
      severity: tree.explanation.totalScore >= 75 ? 'CRITICAL' : 'RISK',
      title: tree.explanation.title,
      description: tree.explanation.formula,
      evidenceSources: tree.facts.map((f) => f.sourceId),
      metrics: { score: tree.explanation.totalScore, confidence: tree.confidence.score },
    })
  }

  for (const flag of output.health.flags.filter((f) => f.severity !== 'INFO')) {
    insights.push({
      id: `ins-${insights.length + 1}`,
      code: flag.code.includes('STOCK') ? INSIGHT_CODES.CRITICAL_STOCK : INSIGHT_CODES.APPROVAL_BLOCKER,
      severity: flag.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
      title: flag.message,
      description: `Brain Health: ${flag.code}`,
      evidenceSources: flag.sourceId ? [flag.sourceId] : ['CONFIGURATION'],
    })
  }

  return insights
}

function buildQuestion(focusArea: BrainContext['scope']['focusArea'], label: string): string {
  switch (focusArea) {
    case 'TERMIN':
    case 'ORDER_RISK':
      return `${label} termin riski için hangi aksiyon alternatifleri değerlendirilmeli?`
    case 'STOCK':
      return `${label} stok riski için ne yapılmalı?`
    case 'CAPACITY':
      return `${label} kapasite darboğazı nasıl giderilmeli?`
    default:
      return `${label} operasyonel durumu için öneri alternatifleri nelerdir?`
  }
}

function buildReasoningSteps(
  facts: ReasoningTree['facts'],
  focusArea: BrainContext['scope']['focusArea'],
): ReasoningStep[] {
  return facts.slice(0, 5).map((fact, i) => ({
    id: `step-${i + 1}`,
    order: i + 1,
    rule: `RULE_${focusArea ?? 'GENERAL'}_${i + 1}`,
    input: fact.reference,
    output: fact.statement,
    sourceIds: [fact.sourceId],
  }))
}

function buildIncompleteOutput(
  analysisId: string,
  context: BrainContext,
  _snapshot: BrainKnowledgeSnapshot,
  graph: ReturnType<typeof buildKnowledgeGraph>,
  facts: ReasoningTree['facts'],
  confidence: ReasoningTree['confidence'],
  personaId: ReasoningTree['personaId'],
): BrainReasoningOutput {
  const incomplete: IncompleteAnalysis = {
    completed: false,
    message: formatIncompleteDueToMissingData(confidence.missingDataReasons),
    reasons: confidence.missingDataReasons,
    missingData: graph.missingDataFlags,
    confidenceScore: confidence.score,
  }

  const reasoningTree: ReasoningTree = {
    treeId: `rtree-incomplete-${reasoningCounter}`,
    question: buildQuestion(context.scope.focusArea ?? 'GENERAL', context.scope.orderNo ?? 'Analiz'),
    focusArea: context.scope.focusArea ?? 'GENERAL',
    facts,
    evidence: [],
    reasoningSteps: [],
    alternatives: [],
    explanation: buildGenericExplanation('Eksik Veri', facts, confidence.score),
    confidence,
    incomplete,
    brainVersion: createVersionedMetadata(personaId).brainVersion,
    personaId,
    generatedAt: new Date().toISOString(),
  }

  return {
    analysisId,
    graph,
    facts,
    reasoningTree,
    health: assessBrainHealth(graph, confidence),
    version: createVersionedMetadata(personaId),
    generatedAt: new Date().toISOString(),
  }
}
