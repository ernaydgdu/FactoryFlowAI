/**
 * Alternative Engine — her analizde en az 3 alternatif + trade-off.
 */
import { MIN_ALTERNATIVES_PER_ANALYSIS } from '../constants'
import type { BrainFocusArea } from '../types'
import type {
  BrainAlternative,
  ImpactAssessment,
  TradeOffAnalysis,
} from '../types/knowledge-reasoning'

let altCounter = 0

export function generateAlternatives(
  focusArea: BrainFocusArea,
  contextLabel: string,
  confidenceBase: number,
): BrainAlternative[] {
  const templates = ALTERNATIVE_TEMPLATES[focusArea] ?? ALTERNATIVE_TEMPLATES.GENERAL
  const selected = templates.slice(0, Math.max(MIN_ALTERNATIVES_PER_ANALYSIS, templates.length))

  return selected.map((template, index) => {
    altCounter += 1
    const id = `alt-${altCounter}`
    const confidenceScore = Math.max(
      20,
      Math.min(95, confidenceBase - index * 8 + (template.confidenceBoost ?? 0)),
    )

    const tradeOff: TradeOffAnalysis = {
      alternativeId: id,
      advantages: template.advantages,
      disadvantages: template.disadvantages,
      risks: template.risks,
      expectedOutcome: template.expectedOutcome,
      impacts: template.impacts,
    }

    return {
      id,
      rank: index + 1,
      title: template.title.replace('{context}', contextLabel),
      description: template.description,
      advantages: template.advantages,
      disadvantages: template.disadvantages,
      risks: template.risks,
      expectedOutcome: template.expectedOutcome,
      impacts: template.impacts,
      confidenceScore,
      tradeOff,
    }
  })
}

type AlternativeTemplate = {
  title: string
  description: string
  advantages: string[]
  disadvantages: string[]
  risks: string[]
  expectedOutcome: string
  impacts: ImpactAssessment[]
  confidenceBoost?: number
}

const IMPACT = {
  costUp: { dimension: 'COST' as const, direction: 'NEGATIVE' as const, magnitude: 'HIGH' as const, description: 'Maliyet artar' },
  costDown: { dimension: 'COST' as const, direction: 'POSITIVE' as const, magnitude: 'MEDIUM' as const, description: 'Maliyet düşer' },
  terminSave: { dimension: 'TERMIN' as const, direction: 'POSITIVE' as const, magnitude: 'HIGH' as const, description: 'Termin kurtulur' },
  terminNeutral: { dimension: 'TERMIN' as const, direction: 'NEUTRAL' as const, magnitude: 'LOW' as const, description: 'Termin korunur' },
  qualityRisk: { dimension: 'QUALITY' as const, direction: 'NEGATIVE' as const, magnitude: 'MEDIUM' as const, description: 'Kalite riski artabilir' },
  capacityRelief: { dimension: 'CAPACITY' as const, direction: 'POSITIVE' as const, magnitude: 'MEDIUM' as const, description: 'Kapasite rahatlar' },
  riskHigh: { dimension: 'RISK' as const, direction: 'NEGATIVE' as const, magnitude: 'HIGH' as const, description: 'Operasyonel risk artar' },
  logisticsCost: { dimension: 'COST' as const, direction: 'NEGATIVE' as const, magnitude: 'MEDIUM' as const, description: 'Lojistik maliyeti artar' },
}

const TERMIN_ALTERNATIVES: AlternativeTemplate[] = [
  {
    title: 'Alternatif 1 — Ek vardiya',
    description: '{context} için mesai/ek vardiya ile üretim hızlandırma',
    advantages: ['Termin kurtulur', 'Mevcut hat kullanılır', 'Kalite süreci değişmez'],
    disadvantages: ['Maliyet artar', 'Personel yorgunluğu'],
    risks: ['Mesai maliyeti bütçeyi aşabilir'],
    expectedOutcome: 'EXF tarihine yetişme olasılığı yükselir',
    impacts: [IMPACT.terminSave, IMPACT.costUp, IMPACT.capacityRelief],
    confidenceBoost: 5,
  },
  {
    title: 'Alternatif 2 — Fason Atölye B',
    description: '{context} yükünü alternatif atölyeye kaydırma',
    advantages: ['Termin kurtulur', 'Kapasite dengelenir'],
    disadvantages: ['Yeni atölye adaptasyonu', 'Lojistik transfer maliyeti'],
    risks: ['Kalite riski artabilir', 'İlk parti onay gecikmesi'],
    expectedOutcome: 'Alternatif hat ile termin korunur',
    impacts: [IMPACT.terminSave, IMPACT.qualityRisk, IMPACT.costUp],
  },
  {
    title: 'Alternatif 3 — Kısmi sevkiyat',
    description: '{context} tamamlanan miktarın EXF öncesi sevk edilmesi',
    advantages: ['Termin korunur', 'Müşteri kısmi teslimat alır'],
    disadvantages: ['Lojistik maliyeti artar', 'İki sevkiyat operasyonu'],
    risks: ['Müşteri kısmi sevkiyat onayı gerekebilir'],
    expectedOutcome: 'EXF taahhüdü kısmen karşılanır',
    impacts: [IMPACT.terminNeutral, IMPACT.logisticsCost, IMPACT.riskHigh],
  },
]

const ALTERNATIVE_TEMPLATES: Record<BrainFocusArea, AlternativeTemplate[]> = {
  TERMIN: TERMIN_ALTERNATIVES,
  ORDER_RISK: TERMIN_ALTERNATIVES,
  CAPACITY: [
    {
      title: 'Alternatif 1 — Hat yeniden tahsisi',
      description: '{context} için kapasite optimizasyonu',
      advantages: ['Doluluk dengelenir'],
      disadvantages: ['Diğer siparişler etkilenebilir'],
      risks: ['Termin kayması riski'],
      expectedOutcome: 'Kapasite kullanımı optimize edilir',
      impacts: [IMPACT.capacityRelief, IMPACT.riskHigh],
    },
    ...TERMIN_ALTERNATIVES.slice(1),
  ],
  STOCK: [
    {
      title: 'Alternatif 1 — Acil PO',
      description: '{context} kritik stok için hızlandırılmış satın alma',
      advantages: ['Stok riski azalır'],
      disadvantages: ['Premium fiyat'],
      risks: ['Tedarikçi kapasitesi'],
      expectedOutcome: 'Stok seviyesi normale döner',
      impacts: [IMPACT.costUp, { dimension: 'RISK', direction: 'POSITIVE', magnitude: 'HIGH', description: 'Stok riski azalır' }],
    },
    {
      title: 'Alternatif 2 — Alternatif malzeme',
      description: '{context} eşdeğer stok kartı değerlendirmesi',
      advantages: ['Hızlı tedarik'],
      disadvantages: ['BOM revizyonu gerekebilir'],
      risks: ['Kalite/onay gecikmesi'],
      expectedOutcome: 'Üretim devam edebilir',
      impacts: [IMPACT.qualityRisk, IMPACT.terminSave],
    },
    {
      title: 'Alternatif 3 — Üretim miktarı düşürme',
      description: '{context} mevcut stokla kısmi üretim',
      advantages: ['Termin korunabilir'],
      disadvantages: ['Sipariş tamamlanamaz'],
      risks: ['Müşteri memnuniyeti'],
      expectedOutcome: 'Kısmi teslimat',
      impacts: [IMPACT.terminNeutral, IMPACT.riskHigh],
    },
  ],
  PURCHASING: TERMIN_ALTERNATIVES,
  PRODUCTION: TERMIN_ALTERNATIVES,
  QUALITY: TERMIN_ALTERNATIVES,
  SHIPMENT: TERMIN_ALTERNATIVES,
  GENERAL: TERMIN_ALTERNATIVES,
}

export function assertMinimumAlternatives(alternatives: BrainAlternative[]): void {
  if (alternatives.length < MIN_ALTERNATIVES_PER_ANALYSIS) {
    throw new Error(
      `ALTERNATIVE_ENGINE: En az ${MIN_ALTERNATIVES_PER_ANALYSIS} alternatif gerekli, ${alternatives.length} üretildi`,
    )
  }
}
