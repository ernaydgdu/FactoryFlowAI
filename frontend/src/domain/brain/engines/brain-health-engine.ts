/**
 * Brain Health Engine — analiz kalitesi ve veri bütünlüğü izleme.
 */
import type { ConfidenceBreakdown, KnowledgeGraph } from '../types/knowledge-reasoning'
import type { BrainHealthFlag, BrainHealthFlagCode, BrainHealthReport } from '../types/knowledge-reasoning'

export function assessBrainHealth(
  graph: KnowledgeGraph,
  confidence: ConfidenceBreakdown,
): BrainHealthReport {
  const flags: BrainHealthFlag[] = []

  for (const missing of graph.missingDataFlags) {
    const knownCodes: BrainHealthFlagCode[] = [
      'MISSING_BOM', 'MISSING_MRP', 'MISSING_PURCHASE', 'MISSING_EXF',
      'MISSING_QUALITY', 'MISSING_TIMELINE', 'MISSING_APPROVAL',
    ]
    const code = knownCodes.includes(missing.code as BrainHealthFlagCode)
      ? (missing.code as BrainHealthFlagCode)
      : 'LOW_DATA_QUALITY'
    flags.push({
      code,
      severity: missing.code.includes('BOM') || missing.code.includes('PURCHASE') || missing.code.includes('EXF') ? 'CRITICAL' : 'WARNING',
      message: missing.message,
      sourceId: missing.sourceId,
    })
  }

  if (graph.completenessScore < 0.7) {
    flags.push({
      code: 'LOW_DATA_QUALITY',
      severity: 'WARNING',
      message: `Veri kalitesi düşük (%${Math.round(graph.completenessScore * 100)})`,
    })
  }

  if (confidence.score < 50) {
    flags.push({
      code: 'LOW_ANALYSIS_CONFIDENCE',
      severity: 'CRITICAL',
      message: `Analiz güveni düşük (${confidence.score}/100)`,
    })
  }

  if (graph.nodes.length === 0) {
    flags.push({
      code: 'INCOMPLETE_GRAPH',
      severity: 'CRITICAL',
      message: 'Knowledge Graph oluşturulamadı',
    })
  }

  const dataQualityScore = Math.round(graph.completenessScore * 100)
  const analysisConfidenceScore = confidence.score
  const penalty = flags.filter((f) => f.severity === 'CRITICAL').length * 15
  const healthScore = Math.max(0, Math.round((dataQualityScore + analysisConfidenceScore) / 2 - penalty))

  return {
    healthScore,
    dataQualityScore,
    analysisConfidenceScore,
    flags,
    generatedAt: new Date().toISOString(),
  }
}
