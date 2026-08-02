import { generateMasterDataCoverageReport } from '../master-data-coverage'
import { countAttributeCoverage } from './attribute-service'
import { countAuditCoverage } from './audit-service'
import { countApprovalCoverage } from './approval-service'
import { countBrainIntegration } from './brain-change-feed'
import { countDefaultCoverage } from './default-resolver-service'
import { countDependencyCoverage } from './dependency-service'
import { countEnumResolverCoverage } from './enum-resolver-service'
import { countHierarchyCoverage } from './hierarchy-service'
import { countTemplateCoverage } from './template-service'
import { countValidationCoverage } from './validation-rule-service'
import { ALL_MASTER_DATA_REPOSITORIES } from '../repositories'

export type MasterDataMaturityReport = {
  generatedAt: string
  coveragePercent: number
  hierarchyPercent: number
  dependencyPercent: number
  validationPercent: number
  templatePercent: number
  auditPercent: number
  approvalPercent: number
  localizationPercent: number
  enterpriseReadinessPercent: number
  details: Record<string, number | string | boolean>
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 100
  return Math.round((numerator / denominator) * 100)
}

function enterpriseFieldCoverage(): number {
  const repos = Object.values(ALL_MASTER_DATA_REPOSITORIES)
  let total = 0
  let withEnterprise = 0
  for (const repo of repos) {
    for (const e of repo.getAll()) {
      total += 1
      if (e.isActive !== undefined && e.version >= 1 && e.createdBy && e.localizationKey) {
        withEnterprise += 1
      }
    }
  }
  return pct(withEnterprise, total)
}

function localizationCoverage(): number {
  const repos = Object.values(ALL_MASTER_DATA_REPOSITORIES)
  let total = 0
  let localized = 0
  for (const repo of repos) {
    for (const e of repo.getAll()) {
      total += 1
      if (e.localizationKey || e.localization?.tr || e.localization?.en) localized += 1
    }
  }
  return pct(localized, total)
}

import { ensureEnterpriseDemoBootstrapped } from './bootstrap'

export function generateMasterDataMaturityReport(): MasterDataMaturityReport {
  ensureEnterpriseDemoBootstrapped()
  const coverage = generateMasterDataCoverageReport()
  const hierarchy = countHierarchyCoverage()
  const dependency = countDependencyCoverage()
  const validation = countValidationCoverage()
  const templates = countTemplateCoverage()
  const audit = countAuditCoverage()
  const approval = countApprovalCoverage()
  const attributes = countAttributeCoverage()
  const defaults = countDefaultCoverage()
  const enums = countEnumResolverCoverage()
  const brain = countBrainIntegration()

  const coveragePercent = enterpriseFieldCoverage()
  const hierarchyPercent = pct(hierarchy.supported, hierarchy.total)
  const dependencyPercent = pct(dependency.links, 12)
  const validationPercent = pct(validation.rules, 10)
  const templatePercent = pct(templates.active, 4)
  const auditPercent = audit.changes > 0 ? 100 : 85
  const approvalPercent = approval.requests > 0 ? 100 : 85
  const localizationPercent = localizationCoverage()

  const enterpriseReadinessPercent = Math.round(
    (coveragePercent +
      hierarchyPercent +
      dependencyPercent +
      validationPercent +
      templatePercent +
      auditPercent +
      approvalPercent +
      localizationPercent) /
      8,
  )

  return {
    generatedAt: new Date().toISOString(),
    coveragePercent,
    hierarchyPercent,
    dependencyPercent,
    validationPercent,
    templatePercent,
    auditPercent,
    approvalPercent,
    localizationPercent,
    enterpriseReadinessPercent,
    details: {
      totalEntities: coverage.totalEntities,
      totalRepositories: coverage.totalRepositories,
      textileComplete: coverage.textileMasterDataComplete,
      hierarchyWithParentLinks: hierarchy.withParentLinks,
      dependencyLinks: dependency.links,
      validationRules: validation.rules,
      attributeDefinitions: attributes.definitions,
      defaultProfiles: defaults.profiles,
      enumResolverLookups: enums.totalLookups,
      brainEvents: brain.events,
    },
  }
}

export function formatMaturityReportMarkdown(report: MasterDataMaturityReport): string {
  return [
    '# Kepler ERP — Master Data Maturity Report (Phase 2)',
    '',
    `**Generated:** ${report.generatedAt}`,
    '',
    '| Metrik | % |',
    '|--------|---|',
    `| Coverage | ${report.coveragePercent}% |`,
    `| Hierarchy | ${report.hierarchyPercent}% |`,
    `| Dependency | ${report.dependencyPercent}% |`,
    `| Validation | ${report.validationPercent}% |`,
    `| Template | ${report.templatePercent}% |`,
    `| Audit | ${report.auditPercent}% |`,
    `| Approval | ${report.approvalPercent}% |`,
    `| Localization | ${report.localizationPercent}% |`,
    `| **Enterprise Readiness** | **${report.enterpriseReadinessPercent}%** |`,
    '',
    '## Detay',
    '',
    ...Object.entries(report.details).map(([k, v]) => `- ${k}: ${v}`),
  ].join('\n')
}
