import { BRAIN_FINAL_DECISION_OWNER } from '../constants'
import type {
  BrainAnalysisResult,
  BrainContext,
  BrainInsight,
  DecisionFrame,
  DecisionOption,
} from '../types'
import type { DecisionLayerContract } from '../contracts'

let frameCounter = 0

export const decisionLayer: DecisionLayerContract = {
  buildFrames(context: BrainContext, analysis: BrainAnalysisResult): DecisionFrame[] {
    const focusArea = context.scope.focusArea ?? 'GENERAL'
    const frames: DecisionFrame[] = []

    const terminInsights = analysis.insights.filter((i) => i.code.includes('TERMIN'))
    if (terminInsights.length > 0) {
      frames.push(buildTerminDecisionFrame(analysis, terminInsights, focusArea))
    }

    const capacityInsights = analysis.insights.filter((i) => i.code.includes('CAPACITY'))
    if (capacityInsights.length > 0) {
      frames.push(buildCapacityDecisionFrame(analysis, capacityInsights, focusArea))
    }

    const stockInsights = analysis.insights.filter((i) => i.code.includes('STOCK'))
    if (stockInsights.length > 0) {
      frames.push(buildStockDecisionFrame(analysis, stockInsights, focusArea))
    }

    if (frames.length === 0 && analysis.insights.length > 0) {
      frames.push(buildGenericDecisionFrame(analysis, focusArea))
    }

    return frames
  },
}

function buildTerminDecisionFrame(
  analysis: BrainAnalysisResult,
  insights: BrainInsight[],
  focusArea: DecisionFrame['focusArea'],
): DecisionFrame {
  frameCounter += 1
  const orderNo = insights[0]?.relatedEntityNo ?? '—'

  const options: DecisionOption[] = [
    {
      id: 'opt-expedite',
      label: 'Üretim önceliğini yükselt',
      description: `${orderNo} siparişini kritik hat önceliğine al`,
      impactSummary: 'Diğer siparişlerde termin kayması riski',
      riskLevel: 'MEDIUM',
      requiresApproval: true,
      estimatedDelayDays: -3,
    },
    {
      id: 'opt-partial',
      label: 'Kısmi sevkiyat planla',
      description: 'Tamamlanan miktarı EXF öncesi sevk et',
      impactSummary: 'Müşteri onayı gerekebilir',
      riskLevel: 'LOW',
      requiresApproval: true,
    },
    {
      id: 'opt-renegotiate',
      label: 'EXF müzakere et',
      description: 'Müşteri ile yeni termin görüşmesi başlat',
      impactSummary: 'Müşteri ilişkisi etkisi',
      riskLevel: 'HIGH',
      requiresApproval: true,
      estimatedDelayDays: 7,
    },
  ]

  return {
    id: `frame-${frameCounter}`,
    question: `${orderNo} termin riski için hangi aksiyon alınmalı?`,
    context: insights.map((i) => i.description).join('; '),
    focusArea: focusArea === 'GENERAL' ? 'TERMIN' : focusArea,
    options,
    constraints: [
      'Stock Ledger üzerinde otomatik işlem yapılmaz',
      'Planning Engine otomatik yeniden planlama tetiklenmez',
      'Son karar kullanıcıya aittir',
    ],
    dataSources: ['PLANNING_ENGINE', 'WORKFLOW', 'TIMELINE'],
    analysisId: analysis.analysisId,
    generatedAt: new Date().toISOString(),
    finalDecisionOwner: BRAIN_FINAL_DECISION_OWNER,
  }
}

function buildCapacityDecisionFrame(
  analysis: BrainAnalysisResult,
  insights: BrainInsight[],
  focusArea: DecisionFrame['focusArea'],
): DecisionFrame {
  frameCounter += 1
  return {
    id: `frame-${frameCounter}`,
    question: 'Kapasite darboğazı için atölye yeniden tahsisi gerekli mi?',
    context: insights.map((i) => i.description).join('; '),
    focusArea: focusArea === 'GENERAL' ? 'CAPACITY' : focusArea,
    options: [
      {
        id: 'opt-shift-workshop',
        label: 'Fason atölye değiştir',
        description: 'Yükü alternatif atölyeye kaydır',
        impactSummary: 'Maliyet ve termin etkisi',
        riskLevel: 'MEDIUM',
        requiresApproval: true,
      },
      {
        id: 'opt-overtime',
        label: 'Mesai / ek vardiya',
        description: 'Mevcut hat kapasitesini artır',
        impactSummary: 'Maliyet artışı',
        riskLevel: 'LOW',
        requiresApproval: true,
        estimatedCostImpact: 15000,
      },
    ],
    constraints: ['Business Rule Engine otomatik çalıştırılmaz'],
    dataSources: ['KPI_ENGINE', 'PLANNING_ENGINE', 'MASTER_DATA'],
    analysisId: analysis.analysisId,
    generatedAt: new Date().toISOString(),
    finalDecisionOwner: BRAIN_FINAL_DECISION_OWNER,
  }
}

function buildStockDecisionFrame(
  analysis: BrainAnalysisResult,
  insights: BrainInsight[],
  focusArea: DecisionFrame['focusArea'],
): DecisionFrame {
  frameCounter += 1
  return {
    id: `frame-${frameCounter}`,
    question: 'Kritik stok için satın alma önceliği nasıl belirlenmeli?',
    context: insights.map((i) => i.description).join('; '),
    focusArea: focusArea === 'GENERAL' ? 'STOCK' : focusArea,
    options: [
      {
        id: 'opt-emergency-po',
        label: 'Acil PO oluştur',
        description: 'Kritik kalemler için hızlandırılmış satın alma',
        impactSummary: 'Maliyet premium riski',
        riskLevel: 'MEDIUM',
        requiresApproval: true,
      },
      {
        id: 'opt-substitute',
        label: 'Alternatif malzeme değerlendir',
        description: 'Eşdeğer stok kartı ile MRP revizyonu',
        impactSummary: 'BOM/onay süreci gerekebilir',
        riskLevel: 'LOW',
        requiresApproval: true,
      },
    ],
    constraints: ['Stok manuel değiştirilmez — Stock Ledger kuralı geçerli'],
    dataSources: ['STOCK_LEDGER', 'WORKFLOW', 'BUSINESS_RULE_ENGINE'],
    analysisId: analysis.analysisId,
    generatedAt: new Date().toISOString(),
    finalDecisionOwner: BRAIN_FINAL_DECISION_OWNER,
  }
}

function buildGenericDecisionFrame(
  analysis: BrainAnalysisResult,
  focusArea: DecisionFrame['focusArea'],
): DecisionFrame {
  frameCounter += 1
  return {
    id: `frame-${frameCounter}`,
    question: 'Tespit edilen bulgular için aksiyon planı oluşturulsun mu?',
    context: analysis.insights.map((i) => i.title).join('; '),
    focusArea,
    options: [
      {
        id: 'opt-review',
        label: 'Detaylı inceleme başlat',
        description: 'İlgili ekip ile operasyonel toplantı planla',
        impactSummary: 'Zaman maliyeti',
        riskLevel: 'LOW',
        requiresApproval: false,
      },
    ],
    constraints: ['Kepler Brain otomatik aksiyon almaz'],
    dataSources: analysis.insights.flatMap((i) => i.evidenceSources),
    analysisId: analysis.analysisId,
    generatedAt: new Date().toISOString(),
    finalDecisionOwner: BRAIN_FINAL_DECISION_OWNER,
  }
}
