/**
 * Scenario Engine — What-If senaryoları. sideEffects = NONE.
 */
import { workshopRepository } from '../../../master-data'
import { TWIN_SCENARIO_TEMPLATES } from '../constants'
import type { FactoryGraph, TwinScenario, TwinScenarioResult, TwinScenarioType } from '../types'

let scenarioCounter = 0

export function createTwinScenario(
  type: TwinScenarioType,
  parameters: Record<string, string | number | boolean> = {},
): TwinScenario {
  scenarioCounter += 1
  return {
    id: `tsc-${scenarioCounter}`,
    type,
    name: TWIN_SCENARIO_TEMPLATES[type],
    hypothesis: `What-If: ${TWIN_SCENARIO_TEMPLATES[type]}`,
    parameters,
    createdAt: new Date().toISOString(),
  }
}

export function runTwinScenario(
  scenario: TwinScenario,
  factoryGraph: FactoryGraph,
): TwinScenarioResult {
  const outcomes: TwinScenarioResult['outcomes'] = []
  const impactedOrderIds = factoryGraph.nodes
    .filter((n) => n.type === 'ORDER')
    .map((n) => n.entityId)
  const risks: string[] = ['Simülasyon gerçek ERP verisini değiştirmez']
  const assumptions: string[] = [`Senaryo: ${scenario.name}`]

  switch (scenario.type) {
    case 'WORKSHOP_CLOSED': {
      const code = String(scenario.parameters.workshopCode ?? 'FSN-A')
      outcomes.push({
        metric: 'capacityLoss',
        baseValue: 100,
        projectedValue: 70,
        delta: -30,
      })
      assumptions.push(`Atölye ${code} kapalı varsayımı`)
      risks.push('Alternatif atölye maliyeti artar')
      break
    }
    case 'MACHINE_BREAKDOWN': {
      outcomes.push({
        metric: 'lineOutput',
        baseValue: 450,
        projectedValue: 200,
        delta: -250,
      })
      assumptions.push('Hat 4 makine arızası')
      break
    }
    case 'FABRIC_REJECTED': {
      outcomes.push({
        metric: 'productionDelayDays',
        baseValue: 0,
        projectedValue: 5,
        delta: 5,
      })
      risks.push('Yeniden tedarik süresi')
      break
    }
    case 'CURRENCY_SPIKE': {
      outcomes.push({
        metric: 'materialCostPercent',
        baseValue: 100,
        projectedValue: 112,
        delta: 12,
      })
      break
    }
    case 'NEW_ORDER_ARRIVAL': {
      const workshops = workshopRepository.getActive()
      const avgUtil =
        workshops.reduce((s, w) => s + w.currentLoad / w.monthlyCapacity, 0) / workshops.length
      outcomes.push({
        metric: 'capacityUtilization',
        baseValue: Math.round(avgUtil * 100),
        projectedValue: Math.min(100, Math.round(avgUtil * 100) + 8),
        delta: 8,
      })
      break
    }
    default:
      outcomes.push({
        metric: 'terminRiskOrders',
        baseValue: 3,
        projectedValue: 5,
        delta: 2,
      })
  }

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    outcomes,
    impactedOrderIds: impactedOrderIds.slice(0, 5),
    risks,
    assumptions,
    disclaimer: 'What-If senaryosu — sideEffects: NONE. Karar kullanıcıya aittir.',
    sideEffects: 'NONE',
    generatedAt: new Date().toISOString(),
  }
}

export const PRESET_SCENARIOS: TwinScenarioType[] = [
  'WORKSHOP_CLOSED',
  'CURRENCY_SPIKE',
  'COTTON_PRICE_UP',
  'BUYER_EXF_CHANGE',
  'NEW_ORDER_ARRIVAL',
  'MACHINE_BREAKDOWN',
  'OPERATOR_LEAVE',
  'FABRIC_REJECTED',
  'QUALITY_WASTE_SPIKE',
]
