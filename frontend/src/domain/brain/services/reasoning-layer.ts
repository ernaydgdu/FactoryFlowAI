import { reasoningOutputToInsights, runReasoningEngine } from '../engines/reasoning-engine'
import type {
  BrainAnalysisResult,
  BrainContext,
  BrainKnowledgeSnapshot,
} from '../types'
import type { ReasoningLayerContract } from '../contracts'

let analysisCounter = 0

export const reasoningLayer: ReasoningLayerContract = {
  analyze(context: BrainContext, snapshot: BrainKnowledgeSnapshot): BrainAnalysisResult {
    analysisCounter += 1
    const reasoningOutput = runReasoningEngine(context, snapshot)
    const insights = reasoningOutputToInsights(reasoningOutput)

    const reasoningNotes = [
      'Reasoning Engine v2 — deterministik, LLM yok',
      `Persona: ${reasoningOutput.version.personaId}`,
      `Brain Version: ${reasoningOutput.version.brainVersion}`,
      `Knowledge Graph: ${reasoningOutput.graph.nodes.length} node, ${reasoningOutput.graph.edges.length} edge`,
      `Facts: ${reasoningOutput.facts.length}`,
      `Alternatives: ${reasoningOutput.reasoningTree.alternatives.length}`,
      `Confidence: ${reasoningOutput.reasoningTree.confidence.score}/100`,
      `Brain Health: ${reasoningOutput.health.healthScore}/100`,
    ]

    if (reasoningOutput.reasoningTree.incomplete) {
      reasoningNotes.push('Analiz eksik veri nedeniyle sınırlı')
      reasoningNotes.push(reasoningOutput.reasoningTree.incomplete.message)
    }

    return {
      analysisId: reasoningOutput.analysisId,
      context,
      snapshotId: snapshot.snapshotId,
      insights,
      generatedAt: reasoningOutput.generatedAt,
      reasoningNotes,
      reasoningOutput,
    }
  },
}

/** @deprecated Chapter 1 — use reasoning engine confidence instead */
export function calculateInsightConfidence(insightCount: number, sourceCount: number): number {
  let confidence = 0.6
  if (sourceCount >= 3) confidence += 0.15
  if (insightCount > 0) confidence += 0.05
  return Math.min(1, Math.round(confidence * 100) / 100)
}
