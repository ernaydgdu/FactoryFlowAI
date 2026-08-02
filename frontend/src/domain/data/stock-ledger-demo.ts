import { executeFullProductionScenario } from '../services/business-rule-engine'
import { createEmptyLedger } from '../services/stock-ledger'
import type { StockLedger, StockMovement } from '../types/stock-ledger'

/** BR-01..BR-10 senaryolarının uçtan uca mock çalıştırması */
const scenario = executeFullProductionScenario(createEmptyLedger())

export const DEMO_STOCK_LEDGER: StockLedger = scenario.ledger

export const DEMO_SCENARIO_SUMMARY = scenario.scenarioSummary

export const DEMO_RULE_RESULTS = scenario.results

/** Senaryo doğrulama sabitleri */
export const DEMO_EXPECTED = {
  plannedQty: 1000,
  producedQty: 900,
  wasteQty: 60,
  missingQty: 40,
  consumptionPerUnit: 1.55,
  consumedMeters: 1395,
  transferredMeters: 1550,
  remainingInWorkshop: 155,
  finishedGoodsShipped: 900,
} as const

export function getLedgerMovementsByType(type: StockMovement['type']): StockMovement[] {
  return DEMO_STOCK_LEDGER.movements.filter((m) => m.type === type)
}

export function getDemoWorkshopRemaining(): number {
  const balance = DEMO_STOCK_LEDGER.balances.find(
    (b) => b.stockCardId === 'sc-1' && b.warehouseCode === 'FSN-A',
  )
  return balance?.onHand ?? 0
}

/** Mock veri bütünlük kontrolü — build/runtime doğrulama */
export function assertDemoScenarioIntegrity(): boolean {
  const s = DEMO_SCENARIO_SUMMARY
  return (
    s.consumedMeters === DEMO_EXPECTED.consumedMeters &&
    s.remainingInWorkshop === DEMO_EXPECTED.remainingInWorkshop &&
    s.finishedGoodsQty === 0 &&
    s.totalMovements > 0
  )
}

assertDemoScenarioIntegrity()
