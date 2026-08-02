/**
 * Confidence Engine — 0-100 güven skoru hesaplama.
 * Kesin konuşmaz; eksik veri durumunda skoru düşürür.
 */
import type { BrainKnowledgeSnapshot } from '../types'
import type {
  ConfidenceBreakdown,
  ConfidenceFactor,
  ConfidenceFactorScore,
  KnowledgeGraph,
} from '../types/knowledge-reasoning'

const FACTOR_WEIGHTS: Record<ConfidenceFactor, number> = {
  DATA_QUALITY: 0.2,
  MISSING_DATA: 0.2,
  RULE_COVERAGE: 0.1,
  HISTORICAL_SIMILARITY: 0.1,
  PLANNING_CONSISTENCY: 0.15,
  BOM_CONSISTENCY: 0.1,
  TIMELINE_CONSISTENCY: 0.15,
}

export function calculateConfidence(
  graph: KnowledgeGraph,
  snapshot: BrainKnowledgeSnapshot,
): ConfidenceBreakdown {
  const missingReasons = graph.missingDataFlags.map((f) => f.message)
  const incomplete = missingReasons.length > 0

  const factors: ConfidenceFactorScore[] = [
    scoreDataQuality(graph),
    scoreMissingData(graph),
    scoreRuleCoverage(snapshot),
    scoreHistoricalSimilarity(snapshot),
    scorePlanningConsistency(snapshot),
    scoreBomConsistency(graph),
    scoreTimelineConsistency(snapshot),
  ]

  const rawScore = factors.reduce((sum, f) => sum + f.contribution, 0)
  const score = Math.max(0, Math.min(100, Math.round(rawScore)))

  return {
    score,
    factors,
    incomplete,
    missingDataReasons: missingReasons,
    calculatedAt: new Date().toISOString(),
  }
}

function scoreDataQuality(graph: KnowledgeGraph): ConfidenceFactorScore {
  const score = Math.round(graph.completenessScore * 100)
  const weight = FACTOR_WEIGHTS.DATA_QUALITY
  return {
    factor: 'DATA_QUALITY',
    weight,
    score,
    contribution: score * weight,
    note: `Graf tamamlanma: %${Math.round(graph.completenessScore * 100)}`,
  }
}

function scoreMissingData(graph: KnowledgeGraph): ConfidenceFactorScore {
  const penalty = graph.missingDataFlags.length * 15
  const score = Math.max(0, 100 - penalty)
  const weight = FACTOR_WEIGHTS.MISSING_DATA
  return {
    factor: 'MISSING_DATA',
    weight,
    score,
    contribution: score * weight,
    note: `${graph.missingDataFlags.length} eksik veri bayrağı`,
  }
}

function scoreRuleCoverage(snapshot: BrainKnowledgeSnapshot): ConfidenceFactorScore {
  const hasRules = snapshot.fragments.some((f) => f.sourceId === 'BUSINESS_RULE_ENGINE')
  const score = hasRules ? 90 : 40
  const weight = FACTOR_WEIGHTS.RULE_COVERAGE
  return {
    factor: 'RULE_COVERAGE',
    weight,
    score,
    contribution: score * weight,
    note: hasRules ? 'İş kuralı kataloğu mevcut' : 'Kural kapsamı sınırlı',
  }
}

function scoreHistoricalSimilarity(snapshot: BrainKnowledgeSnapshot): ConfidenceFactorScore {
  const aiMemory = snapshot.fragments.find((f) => f.sourceId === 'AI_MEMORY')
  const count = (aiMemory?.recordCount ?? 0) as number
  const score = Math.min(100, 50 + count * 2)
  const weight = FACTOR_WEIGHTS.HISTORICAL_SIMILARITY
  return {
    factor: 'HISTORICAL_SIMILARITY',
    weight,
    score,
    contribution: score * weight,
    note: `${count} geçmiş olay kaydı (aynı şirket)`,
  }
}

function scorePlanningConsistency(snapshot: BrainKnowledgeSnapshot): ConfidenceFactorScore {
  const planning = snapshot.fragments.find((f) => f.sourceId === 'PLANNING_ENGINE')
  const score = planning ? 85 : 30
  const weight = FACTOR_WEIGHTS.PLANNING_CONSISTENCY
  return {
    factor: 'PLANNING_CONSISTENCY',
    weight,
    score,
    contribution: score * weight,
    note: planning ? 'Planlama verisi tutarlı' : 'Planlama verisi eksik',
  }
}

function scoreBomConsistency(graph: KnowledgeGraph): ConfidenceFactorScore {
  const bomNode = graph.nodes.find((n) => n.type === 'BOM')
  const score = bomNode?.dataQuality === 'COMPLETE' ? 90 : bomNode?.dataQuality === 'PARTIAL' ? 60 : 25
  const weight = FACTOR_WEIGHTS.BOM_CONSISTENCY
  return {
    factor: 'BOM_CONSISTENCY',
    weight,
    score,
    contribution: score * weight,
    note: bomNode ? `BOM kalitesi: ${bomNode.dataQuality}` : 'BOM bulunamadı',
  }
}

function scoreTimelineConsistency(snapshot: BrainKnowledgeSnapshot): ConfidenceFactorScore {
  const timeline = snapshot.fragments.find((f) => f.sourceId === 'TIMELINE')
  const count = timeline?.recordCount ?? 0
  const score = count > 0 ? Math.min(100, 60 + count * 3) : 35
  const weight = FACTOR_WEIGHTS.TIMELINE_CONSISTENCY
  return {
    factor: 'TIMELINE_CONSISTENCY',
    weight,
    score,
    contribution: score * weight,
    note: `${count} timeline kaydı`,
  }
}
