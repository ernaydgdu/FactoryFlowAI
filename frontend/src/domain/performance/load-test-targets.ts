/** Load test hedefleri — Enterprise kapasite planlaması */

export type LoadTestTarget = {
  scenario: string
  recordCount: number
  targetResponseMs: number
  concurrentUsers?: number
}

export const LOAD_TEST_TARGETS: LoadTestTarget[] = [
  { scenario: 'Sales Order List', recordCount: 100_000, targetResponseMs: 2000, concurrentUsers: 500 },
  { scenario: 'Stock Movement Query', recordCount: 1_000_000, targetResponseMs: 2000 },
  { scenario: 'Production Order List', recordCount: 250_000, targetResponseMs: 2000 },
  { scenario: 'BOM Line Expansion', recordCount: 500_000, targetResponseMs: 1000 },
  { scenario: 'Timeline Event Query', recordCount: 1_000_000, targetResponseMs: 3000 },
  { scenario: 'Product Card List', recordCount: 100_000, targetResponseMs: 1000 },
  { scenario: 'Fabric Card List', recordCount: 50_000, targetResponseMs: 1000 },
  { scenario: 'Accessory Card List', recordCount: 50_000, targetResponseMs: 1000 },
  { scenario: 'Multi-Tenant (50 companies)', recordCount: 50, targetResponseMs: 2000, concurrentUsers: 500 },
]

export const PAGE_PERFORMANCE_TARGETS: Record<string, number> = {
  login: 2000,
  dashboard: 3000,
  salesOrderList: 2000,
  productCard: 1000,
  bom: 1000,
  stockCard: 1000,
  productionOrder: 2000,
  mrp: 0,
  brainAnalysis: 0,
  digitalTwin: 0,
}
