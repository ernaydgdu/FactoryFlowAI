import { SALES_ORDERS } from '../../data/orders'
import { KEPLER_BRAIN_COMPANY_ID } from '../constants'
import {
  createTerminMitigationScenario,
  createEmergencyPurchaseScenario,
} from '../services/simulation-layer'
import { runBrainAnalysis, runBrainRecommendation } from '../services/brain-kernel'

const DEMO_SESSION = 'brain-demo-session-001'
const DEMO_USER_PLANNER = 'user-planner-001'
const DEMO_USER_CEO = 'user-ceo-001'

export function runBrainDemoScenarios() {
  const sampleOrder = SALES_ORDERS.find((o) => o.terminRisk) ?? SALES_ORDERS[0]

  const plannerAnalysis = runBrainAnalysis({
    userId: DEMO_USER_PLANNER,
    companyId: KEPLER_BRAIN_COMPANY_ID,
    sessionId: `${DEMO_SESSION}-planner`,
    orderId: sampleOrder.id,
    focusArea: 'TERMIN',
  })

  const ceoRecommendations = runBrainRecommendation({
    userId: DEMO_USER_CEO,
    companyId: KEPLER_BRAIN_COMPANY_ID,
    sessionId: `${DEMO_SESSION}-ceo`,
    focusArea: 'GENERAL',
  })

  const terminScenario = plannerAnalysis.knowledge
    ? createTerminMitigationScenario(plannerAnalysis.knowledge.snapshotId, 3)
    : null

  const stockScenario = plannerAnalysis.knowledge
    ? createEmergencyPurchaseScenario(plannerAnalysis.knowledge.snapshotId)
    : null

  return {
    plannerAnalysis: {
      insightCount: plannerAnalysis.analysis?.insights.length ?? 0,
      frameCount: plannerAnalysis.decisionFrames?.length ?? 0,
      sourceCount: plannerAnalysis.knowledge?.sourceCount ?? 0,
      securityAllowed: plannerAnalysis.security.allowed,
    },
    ceoRecommendations: {
      recommendationCount: ceoRecommendations.recommendations?.length ?? 0,
      topPriority: ceoRecommendations.recommendations?.[0]?.priority,
      topTitle: ceoRecommendations.recommendations?.[0]?.title,
    },
    scenarios: {
      termin: terminScenario?.name,
      stock: stockScenario?.name,
    },
    disclaimers: [
      'Kepler Brain karar vermez — yalnızca öneri sunar',
      'LLM entegrasyonu henüz yapılmadı',
      'Tüm analizler deterministik kural tabanlıdır',
    ],
  }
}

export const BRAIN_DEMO_OUTPUT = (() => {
  let cached: ReturnType<typeof runBrainDemoScenarios> | null = null
  return (): ReturnType<typeof runBrainDemoScenarios> => {
    if (!cached) cached = runBrainDemoScenarios()
    return cached
  }
})()
