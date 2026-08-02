import {
  formatCoverageReportMarkdown,
  formatMaturityReportMarkdown,
  generateMasterDataCoverageReport,
  generateMasterDataMaturityReport,
  getMasterDataBrainChangeFeed,
  masterData,
} from '../../master-data'
import type { BrainContext, BrainKnowledgeFragment } from '../types'
import type { BrainKnowledgeSourceAdapter } from '../contracts'

export const masterDataAdapter: BrainKnowledgeSourceAdapter = {
  sourceId: 'MASTER_DATA',
  mode: 'READ_ONLY',

  isAvailable(): boolean {
    return true
  },

  fetch(_context: BrainContext): BrainKnowledgeFragment {
    const coverage = generateMasterDataCoverageReport()
    const maturity = generateMasterDataMaturityReport()
    const brainEvents = getMasterDataBrainChangeFeed(20)
    const customers = masterData.customer.getActive()
    const workshops = masterData.workshop.getActive()
    const warehouses = masterData.warehouse.getActive()
    const productGroups = masterData.productGroup.getActive()
    const fabricTypes = masterData.fabricType.getActive()
    const operations = masterData.operation.getActive()

    const entityKeys = [
      ...coverage.entities.flatMap((e) =>
        masterData[e.repositoryKey as keyof typeof masterData]
          .getActive()
          .slice(0, 2)
          .map((item) => item.id),
      ),
      ...brainEvents.map((ev) => ev.entityId),
    ]

    return {
      sourceId: 'MASTER_DATA',
      fetchedAt: new Date().toISOString(),
      entityKeys,
      summary: `${coverage.totalActive} aktif kayıt — Enterprise readiness ${maturity.enterpriseReadinessPercent}%`,
      recordCount: coverage.totalActive + brainEvents.length,
      payload: {
        coverageSummary: {
          totalEntities: coverage.totalEntities,
          totalActive: coverage.totalActive,
          textileComplete: coverage.textileMasterDataComplete,
        },
        maturity: {
          enterpriseReadinessPercent: maturity.enterpriseReadinessPercent,
          coveragePercent: maturity.coveragePercent,
          hierarchyPercent: maturity.hierarchyPercent,
          dependencyPercent: maturity.dependencyPercent,
        },
        recentChanges: brainEvents,
        customerCount: customers.length,
        productGroupCount: productGroups.length,
        fabricTypeCount: fabricTypes.length,
        operationCount: operations.length,
        workshopCapacities: workshops.map((w) => ({
          code: w.code,
          name: w.name,
          monthlyCapacity: w.monthlyCapacity,
          currentLoad: w.currentLoad,
        })),
        warehouseCount: warehouses.length,
        entityBreakdown: coverage.entities.map((e) => ({
          type: e.entityType,
          label: e.label,
          active: e.active,
          total: e.total,
        })),
        note: 'Master Data SSOT — enterprise Phase 2 snapshot',
      },
    }
  },
}

export function getMasterDataCoverageMarkdown(): string {
  return (
    formatCoverageReportMarkdown(generateMasterDataCoverageReport()) +
    '\n\n' +
    formatMaturityReportMarkdown(generateMasterDataMaturityReport())
  )
}
