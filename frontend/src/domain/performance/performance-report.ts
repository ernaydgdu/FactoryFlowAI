/**
 * Performance Constitution Report generator
 */
import { BUSINESS_RULES } from '../services/business-rule-engine'
import { ALL_MASTER_DATA_REPOSITORIES } from '../master-data/repositories'
import { getKnowledgeGraphCacheSize } from './knowledge-graph-cache'
import { LOAD_TEST_TARGETS, PAGE_PERFORMANCE_TARGETS } from './load-test-targets'

export type PerformanceConstitutionReport = {
  generatedAt: string
  applicationStartupMs: number
  memoryConsumptionMb?: number
  renderPerformanceMs: number
  domainExecutionMs: number
  brainExecutionMs: number
  planningExecutionMs: number
  stockLedgerExecutionMs: number
  averageResponseTimeMs: number
  cacheEfficiencyPercent: number
  masterDataEntityCount: number
  businessRuleCount: number
  knowledgeGraphCacheSize: number
  estimatedEnterpriseCapacity: string
  pageTargets: typeof PAGE_PERFORMANCE_TARGETS
  loadTestTargets: typeof LOAD_TEST_TARGETS
  slowestServices: Array<{ name: string; durationMs: number }>
}

export function generatePerformanceConstitutionReport(
  metrics: {
    startupMs?: number
    memoryMb?: number
    domainMs?: number
    brainMs?: number
    planningMs?: number
    ledgerMs?: number
    renderMs?: number
    cacheHitRatio?: number
    slowest?: Array<{ name: string; durationMs: number }>
  } = {},
): PerformanceConstitutionReport {
  let entityCount = 0
  for (const repo of Object.values(ALL_MASTER_DATA_REPOSITORIES)) {
    entityCount += repo.getAll().length
  }

  const domainMs = metrics.domainMs ?? 0
  const brainMs = metrics.brainMs ?? 0
  const planningMs = metrics.planningMs ?? 0
  const ledgerMs = metrics.ledgerMs ?? 0
  const renderMs = metrics.renderMs ?? 0
  const startupMs = metrics.startupMs ?? 0

  const avg =
    [startupMs, domainMs, brainMs, planningMs, ledgerMs, renderMs].filter((v) => v > 0).reduce((a, b) => a + b, 0) /
    Math.max(1, [startupMs, domainMs, brainMs, planningMs, ledgerMs, renderMs].filter((v) => v > 0).length)

  return {
    generatedAt: new Date().toISOString(),
    applicationStartupMs: startupMs,
    memoryConsumptionMb: metrics.memoryMb,
    renderPerformanceMs: renderMs,
    domainExecutionMs: domainMs,
    brainExecutionMs: brainMs,
    planningExecutionMs: planningMs,
    stockLedgerExecutionMs: ledgerMs,
    averageResponseTimeMs: Math.round(avg),
    cacheEfficiencyPercent: metrics.cacheHitRatio ?? 0,
    masterDataEntityCount: entityCount,
    businessRuleCount: BUSINESS_RULES.length,
    knowledgeGraphCacheSize: getKnowledgeGraphCacheSize(),
    estimatedEnterpriseCapacity: '500 concurrent users / 50 tenants (projected with backend + read models)',
    pageTargets: PAGE_PERFORMANCE_TARGETS,
    loadTestTargets: LOAD_TEST_TARGETS,
    slowestServices: metrics.slowest ?? [],
  }
}

export function formatPerformanceReportMarkdown(report: PerformanceConstitutionReport): string {
  return [
    '# Kepler ERP — Performance Constitution Report (Phase 1)',
    '',
    `**Generated:** ${report.generatedAt}`,
    '',
    '## Runtime Metrics',
    '',
    '| Metrik | Değer |',
    '|--------|-------|',
    `| Application Startup | ${report.applicationStartupMs} ms |`,
    `| Memory Consumption | ${report.memoryConsumptionMb ?? 'N/A'} MB |`,
    `| Render Performance | ${report.renderPerformanceMs} ms |`,
    `| Domain Execution | ${report.domainExecutionMs} ms |`,
    `| Brain Execution | ${report.brainExecutionMs} ms (on-demand) |`,
    `| Planning Execution | ${report.planningExecutionMs} ms (background) |`,
    `| Stock Ledger Execution | ${report.stockLedgerExecutionMs} ms |`,
    `| Average Response Time | ${report.averageResponseTimeMs} ms |`,
    `| Cache Efficiency | ${report.cacheEfficiencyPercent}% |`,
    '',
    '## Capacity',
    '',
    `| Metrik | Değer |`,
    `| Master Data Entities | ${report.masterDataEntityCount} |`,
    `| Business Rules | ${report.businessRuleCount} |`,
    `| Knowledge Graph Cache | ${report.knowledgeGraphCacheSize} entries |`,
    `| Estimated Enterprise Capacity | ${report.estimatedEnterpriseCapacity} |`,
    '',
    '## Page Performance Targets',
    '',
    ...Object.entries(report.pageTargets).map(([k, v]) => `- ${k}: ${v > 0 ? `< ${v} ms` : 'Background / Async'}`),
    '',
    '## Load Test Targets',
    '',
    '| Scenario | Records | Target |',
    '|----------|---------|--------|',
    ...report.loadTestTargets.map((t) => `| ${t.scenario} | ${t.recordCount.toLocaleString('en-US')} | ${t.targetResponseMs} ms |`),
  ].join('\n')
}
