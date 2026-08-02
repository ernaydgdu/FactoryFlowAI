import { SALES_ORDERS } from './orders'
import {
  calculateMaterialRequirement,
  calculateProfitForOrder,
  explainRisk,
  simulateSupplierChange,
} from '../services/planning/ai-layer'
import { demoCapacityAllocation } from '../services/planning/capacity-engine'
import { runPlanningEngine } from '../services/planning-engine'

const REFERENCE = new Date('2026-08-02')

/** Planning Engine mock çalıştırması */
export const PLANNING_ENGINE_OUTPUT = runPlanningEngine(SALES_ORDERS, REFERENCE)

export const DEMO_CAPACITY_7000 = demoCapacityAllocation()

export const DEMO_MRP = calculateMaterialRequirement(SALES_ORDERS)

export const DEMO_RISK_EXPLANATION = explainRisk('1')

export const DEMO_SUPPLIER_SIMULATION = simulateSupplierChange('1', -5)

export const DEMO_PROFIT = calculateProfitForOrder('1')

export const PLANNING_DEMO_SUMMARY = {
  openOrders: PLANNING_ENGINE_OUTPUT.consolidatedMrp.openOrderCount,
  purchaseSuggestions: PLANNING_ENGINE_OUTPUT.consolidatedMrp.purchaseSuggestions.length,
  highRiskOrders: PLANNING_ENGINE_OUTPUT.riskAssessments.filter(
    (r) => r.level === 'Yüksek' || r.level === 'Kritik',
  ).length,
  avgRiskScore: Math.round(
    PLANNING_ENGINE_OUTPUT.riskAssessments.reduce((s, r) => s + r.score, 0) /
      PLANNING_ENGINE_OUTPUT.riskAssessments.length,
  ),
  capacityDemo7000: DEMO_CAPACITY_7000,
} as const

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

assertPlanningDemoIntegrity()
