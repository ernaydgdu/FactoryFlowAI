import { runBrainAnalysis, runBrainRecommendation } from '../services/brain-kernel'
import { trackAllGoals } from '../engines/goal-engine'
import { getAllBrainPlugins } from '../plugins/plugin-registry'
import { BRAIN_PERSONAS } from '../engines/persona-registry'

export function runBrainChapter2Demo() {
  const analysis = runBrainAnalysis({
    userId: 'user-planner-001',
    sessionId: 'brain-ch2-demo',
    focusArea: 'TERMIN',
    orderId: '1',
  })

  const recommendations = runBrainRecommendation({
    userId: 'user-ceo-001',
    sessionId: 'brain-ch2-rec',
    focusArea: 'GENERAL',
  })

  const output = analysis.analysis?.reasoningOutput
  const kpi = analysis.knowledge?.fragments.find((f) => f.sourceId === 'KPI_ENGINE')
  const snapshot = kpi?.payload.snapshot as { wasteRate?: number; terminRiskCount?: number; capacityUtilization?: number } | undefined

  const goals = snapshot
    ? trackAllGoals('company-kepler-001', {
        wasteRate: snapshot.wasteRate ?? 4.2,
        terminRiskCount: snapshot.terminRiskCount ?? 5,
        capacityUtilization: snapshot.capacityUtilization ?? 87,
      })
    : []

  return {
    brainVersion: output?.version.brainVersion,
    algorithmVersion: output?.version.algorithmVersion.label,
    persona: output?.version.personaId,
    graphNodes: output?.graph.nodes.length,
    graphEdges: output?.graph.edges.length,
    factCount: output?.facts.length,
    alternativeCount: output?.reasoningTree.alternatives.length,
    confidenceScore: output?.reasoningTree.confidence.score,
    explanation: output?.reasoningTree.explanation.formula,
    brainHealth: output?.health.healthScore,
    incomplete: output?.reasoningTree.incomplete?.completed === false,
    recommendationCount: recommendations.recommendations?.length ?? 0,
    personaCount: BRAIN_PERSONAS.length,
    pluginCount: getAllBrainPlugins().length,
    goalTracking: goals.map((g) => ({ metric: g.goalId, onTrack: g.onTrack, deviation: g.deviation })),
  }
}

export const BRAIN_CHAPTER2_DEMO = (() => {
  let cached: ReturnType<typeof runBrainChapter2Demo> | null = null
  return (): ReturnType<typeof runBrainChapter2Demo> => {
    if (!cached) cached = runBrainChapter2Demo()
    return cached
  }
})()
