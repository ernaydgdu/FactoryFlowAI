import { BRAIN_DISCLAIMERS } from '../constants'
import { getCompanyConfiguration } from '../data/brain-config'
import type {
  BrainContext,
  BrainKnowledgeSnapshot,
  SimulationOutcome,
  SimulationParameter,
  SimulationResult,
  SimulationScenario,
} from '../types'
import type { SimulationLayerContract } from '../contracts'

let scenarioCounter = 0

export const simulationLayer: SimulationLayerContract = {
  createScenario(input: Omit<SimulationScenario, 'id' | 'createdAt'>): SimulationScenario {
    scenarioCounter += 1
    return {
      ...input,
      id: `sim-${scenarioCounter}`,
      createdAt: new Date().toISOString(),
    }
  },

  runScenario(
    context: BrainContext,
    scenario: SimulationScenario,
    snapshot: BrainKnowledgeSnapshot,
  ): SimulationResult {
    const config = getCompanyConfiguration(context.companyId)
    const sessionSimCount = 1 // kernel tracks session limits

    if (sessionSimCount > config.maxSimulationsPerSession) {
      throw new Error('BRAIN_SIMULATION_LIMIT: Oturum simülasyon limiti aşıldı')
    }

    const outcomes = projectOutcomes(scenario.parameters, snapshot)
    const risks = deriveSimulationRisks(outcomes)
    const assumptions = buildAssumptions(scenario.parameters)

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      projectedOutcomes: outcomes,
      risks,
      assumptions,
      disclaimer: BRAIN_DISCLAIMERS.SIMULATION_ONLY,
      generatedAt: new Date().toISOString(),
      sideEffects: 'NONE',
    }
  },
}

function projectOutcomes(
  parameters: SimulationParameter[],
  snapshot: BrainKnowledgeSnapshot,
): SimulationOutcome[] {
  const outcomes: SimulationOutcome[] = []
  const planning = snapshot.fragments.find((f) => f.sourceId === 'PLANNING_ENGINE')
  const kpi = snapshot.fragments.find((f) => f.sourceId === 'KPI_ENGINE')

  const baseCapacity =
    (kpi?.payload.snapshot as { capacityUtilization?: number })?.capacityUtilization ?? 80

  for (const param of parameters) {
    if (param.key === 'capacityBoostPercent' && typeof param.simulatedValue === 'number') {
      const boost = param.simulatedValue as number
      const simulatedCapacity = Math.max(0, baseCapacity - boost)
      outcomes.push({
        metric: 'capacityUtilization',
        baseValue: baseCapacity,
        simulatedValue: simulatedCapacity,
        delta: simulatedCapacity - baseCapacity,
        unit: '%',
      })
    }

    if (param.key === 'additionalProductionDays' && typeof param.simulatedValue === 'number') {
      const days = param.simulatedValue as number
      outcomes.push({
        metric: 'estimatedDelayDays',
        baseValue: 0,
        simulatedValue: -days,
        delta: -days,
        unit: 'gün',
      })
    }

    if (param.key === 'emergencyPurchase' && param.simulatedValue === true) {
      outcomes.push({
        metric: 'stockShortageRisk',
        baseValue: 'HIGH',
        simulatedValue: 'LOW',
        delta: 'IMPROVED',
      })
    }
  }

  if (planning?.payload.terminPlans) {
    const plans = planning.payload.terminPlans as Array<{ orderNo: string; riskScore: number }>
    const avgRisk =
      plans.reduce((s, p) => s + p.riskScore, 0) / Math.max(plans.length, 1)
    outcomes.push({
      metric: 'averageTerminRiskScore',
      baseValue: Math.round(avgRisk),
      simulatedValue: Math.max(0, Math.round(avgRisk * 0.85)),
      delta: Math.round(avgRisk * -0.15),
      unit: 'skor',
    })
  }

  return outcomes
}

function deriveSimulationRisks(outcomes: SimulationOutcome[]): string[] {
  const risks: string[] = []
  const capacity = outcomes.find((o) => o.metric === 'capacityUtilization')
  if (capacity && typeof capacity.simulatedValue === 'number' && capacity.simulatedValue < 70) {
    risks.push('Kapasite altında kalma — maliyet artışı riski')
  }
  risks.push('Simülasyon gerçek ERP kayıtlarını değiştirmez')
  risks.push('Onay gerektiren aksiyonlar otomatik tetiklenmez')
  return risks
}

function buildAssumptions(parameters: SimulationParameter[]): string[] {
  return parameters.map(
    (p) => `${p.label}: ${String(p.baseValue)} → ${String(p.simulatedValue)}${p.unit ? ` ${p.unit}` : ''}`,
  )
}

/** Hazır simülasyon şablonları */
export function createTerminMitigationScenario(
  snapshotId: string,
  additionalDays: number,
): SimulationScenario {
  return simulationLayer.createScenario({
    name: 'Termin İyileştirme Senaryosu',
    hypothesis: 'Ek vardiya ile termin riski azaltılabilir mi?',
    focusArea: 'TERMIN',
    baseSnapshotId: snapshotId,
    parameters: [
      {
        key: 'additionalProductionDays',
        label: 'Kazanılacak üretim günü',
        type: 'DAYS',
        baseValue: 0,
        simulatedValue: additionalDays,
        unit: 'gün',
      },
      {
        key: 'capacityBoostPercent',
        label: 'Kapasite artışı',
        type: 'PERCENT',
        baseValue: 0,
        simulatedValue: 10,
        unit: '%',
      },
    ],
  })
}

export function createEmergencyPurchaseScenario(snapshotId: string): SimulationScenario {
  return simulationLayer.createScenario({
    name: 'Acil Satın Alma Senaryosu',
    hypothesis: 'Acil PO ile stok riski giderilebilir mi?',
    focusArea: 'STOCK',
    baseSnapshotId: snapshotId,
    parameters: [
      {
        key: 'emergencyPurchase',
        label: 'Acil satın alma',
        type: 'BOOLEAN',
        baseValue: false,
        simulatedValue: true,
      },
    ],
  })
}
