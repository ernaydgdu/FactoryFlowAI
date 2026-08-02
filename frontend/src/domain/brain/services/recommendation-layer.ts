import {
  BRAIN_DISCLAIMERS,
  BRAIN_FINAL_DECISION_OWNER,
  RECOMMENDATION_TYPE_BY_FOCUS,
} from '../constants'
import { getCompanyConfiguration } from '../data/brain-config'
import { calculateInsightConfidence } from './reasoning-layer'
import type {
  BrainAnalysisResult,
  BrainContext,
  BrainEvidence,
  BrainInsight,
  BrainRecommendation,
  BrainRecommendationType,
  DecisionFrame,
} from '../types'
import type { RecommendationLayerContract } from '../contracts'

let recommendationCounter = 0

export const recommendationLayer: RecommendationLayerContract = {
  generate(
    context: BrainContext,
    analysis: BrainAnalysisResult,
    frames: DecisionFrame[],
  ): BrainRecommendation[] {
    const config = getCompanyConfiguration(context.companyId)
    const recommendations: BrainRecommendation[] = []
    const focusArea = context.scope.focusArea ?? 'GENERAL'
    const allowedTypes = RECOMMENDATION_TYPE_BY_FOCUS[focusArea]

    for (const insight of analysis.insights) {
      const type = mapInsightToRecommendationType(insight, allowedTypes)
      if (!type) continue

      recommendationCounter += 1
      const frame = frames.find((f) =>
        f.context.includes(insight.relatedEntityNo ?? '') ||
        f.focusArea === mapInsightToFocus(insight),
      )

      const evidence = buildEvidence(insight, analysis)
      const confidence = calculateInsightConfidence(
        analysis.insights.length,
        insight.evidenceSources.length,
      )

      if (confidence < config.confidenceThreshold) continue

      recommendations.push({
        id: `rec-${recommendationCounter}`,
        type,
        priority: mapSeverityToPriority(insight.severity),
        title: buildRecommendationTitle(type, insight),
        rationale: insight.description,
        evidence,
        suggestedActions: buildSuggestedActions(type, frame),
        confidence,
        disclaimers: [
          BRAIN_DISCLAIMERS.NO_AUTO_DECISION,
          BRAIN_DISCLAIMERS.NO_RULE_OVERRIDE,
        ],
        decisionFrameId: frame?.id,
        relatedOrderId: insight.relatedEntityId,
        relatedOrderNo: insight.relatedEntityNo,
        generatedAt: new Date().toISOString(),
        finalDecisionBy: BRAIN_FINAL_DECISION_OWNER,
      })
    }

    return recommendations.slice(0, config.maxRecommendations)
  },
}

function mapInsightToRecommendationType(
  insight: BrainInsight,
  allowed: BrainRecommendationType[],
): BrainRecommendationType | undefined {
  const mapping: Record<string, BrainRecommendationType> = {
    [insight.code.includes('TERMIN') ? insight.code : '']: 'TERMIN_RISK_MITIGATION',
    INSIGHT_CAPACITY_OVERLOAD: 'CAPACITY_REALLOCATION',
    INSIGHT_CRITICAL_STOCK: 'STOCK_REPLENISHMENT',
    INSIGHT_APPROVAL_BLOCKER: 'APPROVAL_FOLLOWUP',
    INSIGHT_MRP_SHORTAGE: 'PURCHASING_PRIORITY',
    INSIGHT_PRODUCTION_DELAY: 'PRODUCTION_SEQUENCE',
    INSIGHT_KPI_DEGRADATION: 'CAPACITY_REALLOCATION',
  }

  for (const [key, type] of Object.entries(mapping)) {
    if (key && insight.code.includes(key.replace('INSIGHT_', '')) && allowed.includes(type)) {
      return type
    }
  }

  if (insight.code.includes('TERMIN') && allowed.includes('TERMIN_RISK_MITIGATION')) {
    return 'TERMIN_RISK_MITIGATION'
  }
  if (insight.code.includes('STOCK') && allowed.includes('STOCK_REPLENISHMENT')) {
    return 'STOCK_REPLENISHMENT'
  }
  if (insight.code.includes('CAPACITY') && allowed.includes('CAPACITY_REALLOCATION')) {
    return 'CAPACITY_REALLOCATION'
  }

  return allowed[0]
}

function mapInsightToFocus(insight: BrainInsight): DecisionFrame['focusArea'] {
  if (insight.code.includes('TERMIN')) return 'TERMIN'
  if (insight.code.includes('CAPACITY')) return 'CAPACITY'
  if (insight.code.includes('STOCK')) return 'STOCK'
  return 'GENERAL'
}

function mapSeverityToPriority(
  severity: BrainInsight['severity'],
): BrainRecommendation['priority'] {
  switch (severity) {
    case 'CRITICAL':
      return 'CRITICAL'
    case 'RISK':
      return 'HIGH'
    case 'WARNING':
      return 'MEDIUM'
    default:
      return 'LOW'
  }
}

function buildEvidence(insight: BrainInsight, analysis: BrainAnalysisResult): BrainEvidence[] {
  return insight.evidenceSources.map((sourceId) => ({
    sourceId,
    reference: analysis.snapshotId,
    fact: insight.title,
    value: insight.metrics ? Object.values(insight.metrics)[0] : undefined,
  }))
}

function buildRecommendationTitle(
  type: BrainRecommendationType,
  insight: BrainInsight,
): string {
  const prefixes: Record<BrainRecommendationType, string> = {
    TERMIN_RISK_MITIGATION: 'Termin riski azaltma',
    CAPACITY_REALLOCATION: 'Kapasite yeniden tahsis',
    STOCK_REPLENISHMENT: 'Stok ikmali',
    PURCHASING_PRIORITY: 'Satın alma önceliği',
    PRODUCTION_SEQUENCE: 'Üretim sıralaması',
    QUALITY_ESCALATION: 'Kalite eskalasyonu',
    SHIPMENT_RESCHEDULE: 'Sevkiyat yeniden planlama',
    APPROVAL_FOLLOWUP: 'Onay takibi',
  }
  const order = insight.relatedEntityNo ? ` — ${insight.relatedEntityNo}` : ''
  return `${prefixes[type]}${order}`
}

function buildSuggestedActions(
  type: BrainRecommendationType,
  frame?: DecisionFrame,
): string[] {
  const actions: Record<BrainRecommendationType, string[]> = {
    TERMIN_RISK_MITIGATION: [
      'EXF blocker analizini doğrula',
      'Planlama ekibi ile termin senaryosu değerlendir',
      'Müşteri ile iletişim planı oluştur',
    ],
    CAPACITY_REALLOCATION: [
      'Atölye kapasite raporunu incele',
      'Alternatif fason atölye listesini değerlendir',
    ],
    STOCK_REPLENISHMENT: [
      'Kritik stok kalemleri için PR/PO durumunu kontrol et',
      'Tedarikçi ETA bilgisini güncelle',
    ],
    PURCHASING_PRIORITY: [
      'Geciken PO listesini önceliklendir',
      'Satın alma ekibine termin riski bildir',
    ],
    PRODUCTION_SEQUENCE: [
      'Hat bazlı üretim sırasını gözden geçir',
      'Kesim/dikim emirlerini yeniden sırala',
    ],
    QUALITY_ESCALATION: [
      'Kalite kontrol kayıtlarını incele',
      'Numune onay durumunu doğrula',
    ],
    SHIPMENT_RESCHEDULE: [
      'Konteyner planını EXF ile hizala',
      'Forwarder ile slot müsaitliğini kontrol et',
    ],
    APPROVAL_FOLLOWUP: [
      'Bekleyen onay akışlarını sorumluya ilet',
      'BOM/maliyet onayı gecikmesini takip et',
    ],
  }

  const base = actions[type]
  if (frame) {
    return [...base, ...frame.options.map((o) => `Seçenek değerlendir: ${o.label}`)]
  }
  return base
}
