import { SALES_ORDERS } from './orders'
import { lazyObject, lazyValue } from './lazy-cache'
import {
  calculateMaterialRequirement,
  calculateProfitForOrder,
  explainRisk,
  simulateSupplierChange,
} from '../services/planning/ai-layer'
import { demoCapacityAllocation } from '../services/planning/capacity-engine'
import { runPlanningEngine } from '../services/planning-engine'

const REFERENCE = new Date('2026-08-02')

function buildPlanningDemo() {
  const planningEngineOutput = runPlanningEngine(SALES_ORDERS, REFERENCE)
  const demoCapacity7000 = demoCapacityAllocation()
  const demoMrp = calculateMaterialRequirement(SALES_ORDERS)
  const demoRiskExplanation = explainRisk('1')
  const demoSupplierSimulation = simulateSupplierChange('1', -5)
  const demoProfit = calculateProfitForOrder('1')
  const planningDemoSummary = {
    openOrders: planningEngineOutput.consolidatedMrp.openOrderCount,
    purchaseSuggestions: planningEngineOutput.consolidatedMrp.purchaseSuggestions.length,
    highRiskOrders: planningEngineOutput.riskAssessments.filter(
      (r) => r.level === 'Yüksek' || r.level === 'Kritik',
    ).length,
    avgRiskScore: Math.round(
      planningEngineOutput.riskAssessments.reduce((s, r) => s + r.score, 0) /
        planningEngineOutput.riskAssessments.length,
    ),
    capacityDemo7000: demoCapacity7000,
  } as const

  return {
    planningEngineOutput,
    demoCapacity7000,
    demoMrp,
    demoRiskExplanation,
    demoSupplierSimulation,
    demoProfit,
    planningDemoSummary,
  }
}

const getPlanningDemo = lazyValue(buildPlanningDemo)

export const PLANNING_ENGINE_OUTPUT = lazyObject(() => getPlanningDemo().planningEngineOutput)
export const DEMO_CAPACITY_7000 = lazyObject(() => getPlanningDemo().demoCapacity7000)
export const DEMO_MRP = lazyObject(() => getPlanningDemo().demoMrp)
export const DEMO_RISK_EXPLANATION = lazyObject(() => getPlanningDemo().demoRiskExplanation)
export const DEMO_SUPPLIER_SIMULATION = lazyObject(() => getPlanningDemo().demoSupplierSimulation)
export const DEMO_PROFIT = lazyObject(() => getPlanningDemo().demoProfit)
export const PLANNING_DEMO_SUMMARY = lazyObject(() => getPlanningDemo().planningDemoSummary)

export function assertPlanningDemoIntegrity(): boolean {
  const cap = DEMO_CAPACITY_7000
  const totalAllocated = cap.allocations.reduce((s, a) => s + a.quantity, 0)
  return (
    cap.requestedQty === 7000 &&
    cap.fullyAllocated &&
    totalAllocated === 7000 &&
    cap.allocations.some((a) => a.workshopCode === 'FSN-A' && a.quantity === 5000) &&
    PLANNING_ENGINE_OUTPUT.snapshots.length === SALES_ORDERS.length
  )
}
