import type { ProductionFlowStage, TwinScenarioType } from './types'

export const TWIN_SIDE_EFFECTS = 'NONE' as const

export const TWIN_FINAL_DECISION_OWNER = 'USER' as const

export const BRAIN_TWIN_VERSION = '3.0.0-domain'

export const BRAIN_TWIN_ALGORITHM_VERSION = {
  major: 3,
  minor: 0,
  patch: 0,
  label: '3.0.0-chapter3',
  chapter: 'Digital Factory Twin & Decision Intelligence',
  releasedAt: '2026-08-02T00:00:00Z',
} as const

export const PRODUCTION_FLOW_STAGES: ProductionFlowStage[] = [
  'ORDER_RECEIVED',
  'CUTTING',
  'SEWING',
  'WASHING',
  'QUALITY',
  'PACKING',
  'WAREHOUSE',
  'SHIPMENT',
]

export const FLOW_TRANSITIONS: Array<{ from: ProductionFlowStage; to: ProductionFlowStage; leadDays: number }> = [
  { from: 'ORDER_RECEIVED', to: 'CUTTING', leadDays: 2 },
  { from: 'CUTTING', to: 'SEWING', leadDays: 1 },
  { from: 'SEWING', to: 'WASHING', leadDays: 3 },
  { from: 'WASHING', to: 'QUALITY', leadDays: 1 },
  { from: 'QUALITY', to: 'PACKING', leadDays: 1 },
  { from: 'PACKING', to: 'WAREHOUSE', leadDays: 1 },
  { from: 'WAREHOUSE', to: 'SHIPMENT', leadDays: 2 },
]

export const TWIN_SCENARIO_TEMPLATES: Record<TwinScenarioType, string> = {
  WORKSHOP_CLOSED: 'Atölye kapandı',
  CURRENCY_SPIKE: 'Dolar yükseldi',
  COTTON_PRICE_UP: 'Pamuk arttı',
  BUYER_EXF_CHANGE: 'Buyer EXF değiştirdi',
  NEW_ORDER_ARRIVAL: 'Yeni sipariş geldi',
  MACHINE_BREAKDOWN: 'Makine bozuldu',
  OPERATOR_LEAVE: 'Operatör izin aldı',
  FABRIC_REJECTED: 'Kumaş reddedildi',
  QUALITY_WASTE_SPIKE: 'Kalite fire arttı',
}

export const ORDER_STATUS_TO_FLOW: Record<string, ProductionFlowStage> = {
  Beklemede: 'ORDER_RECEIVED',
  Üretimde: 'SEWING',
  Tamamlandı: 'WAREHOUSE',
  'Sevk Edildi': 'SHIPMENT',
}
