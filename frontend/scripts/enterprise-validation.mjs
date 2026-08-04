#!/usr/bin/env node
/**
 * Phase 8 — Enterprise Hardening & AI Foundation validation.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

let pass = 0
let fail = 0

function check(ok, label) {
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${label}`)
  if (ok) pass += 1
  else fail += 1
}

function read(rel) {
  return readFileSync(path.join(ROOT, rel), 'utf8')
}

function exists(rel) {
  return existsSync(path.join(ROOT, rel))
}

console.log('=== Phase 8 — Enterprise Hardening Validation ===\n')

const files = [
  'src/infrastructure/persistence/bootstrap-diagnostics.ts',
  'src/infrastructure/persistence/postgresql/postgres-cutover-readiness.ts',
  'src/application/core/command-permission.ts',
  'src/domain/brain/enterprise-ai-foundation.ts',
  'src/domain/enterprise-hardening/enterprise-hardening-query.service.ts',
  'src/application/enterprise-hardening/enterprise-hardening.application-service.ts',
  'src/application/enterprise-hardening/use-enterprise-hardening.ts',
  'src/modules/enterprise-hardening/layout/EnterpriseHardeningLayout.tsx',
  'src/modules/enterprise-hardening/pages/EnterpriseHardeningPages.tsx',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const bootstrap = read('src/infrastructure/persistence/bootstrap.ts')
const providers = read('src/app/providers.tsx')
const diagnostics = read('src/infrastructure/persistence/bootstrap-diagnostics.ts')
const cutover = read('src/infrastructure/persistence/postgresql/postgres-cutover-readiness.ts')
const cmdPerm = read('src/application/core/command-permission.ts')
const pcGuard = read('src/application/product-card/product-card-permission.guard.ts')
const poGuard = read('src/application/production-order-lifecycle/production-order-permission.guard.ts')
const ai = read('src/domain/brain/enterprise-ai-foundation.ts')
const query = read('src/domain/enterprise-hardening/enterprise-hardening-query.service.ts')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const iam = read('src/domain/platform/iam/permission-policy.ts')
const keys = read('src/application/core/query-keys.ts')
const pkg = read('package.json')
const report = exists('../docs/architecture/ENTERPRISE-HARDENING-REPORT.md')
  ? read('../docs/architecture/ENTERPRISE-HARDENING-REPORT.md')
  : ''

check(diagnostics.includes('runIsolatedBootstrapPhase'), 'Bootstrap: isolated phase helper')
check(bootstrap.includes('ensurePersistenceBootstrappedSafe'), 'Bootstrap: safe entrypoint')
check(bootstrap.includes('runIsolatedBootstrapPhase'), 'Bootstrap: phase isolation used')
check(providers.includes('ensurePersistenceBootstrappedSafe'), 'Providers: safe bootstrap')
check(providers.includes('BootstrapStatusScreen'), 'Providers: no white-screen status UI')
check(!providers.includes('return null'), 'Providers: does not return null while loading')

check(cutover.includes('getPostgresCutoverReport'), 'Postgres: cutover readiness report')
check(cutover.includes('cutoverBlocked'), 'Postgres: cutoverBlocked guard')
check(cutover.includes("status: 'stub'") || cutover.includes("'stub'"), 'Postgres: stub inventory')

check(cmdPerm.includes('assertCommandPermission'), 'Permissions: assertCommandPermission')
check(cmdPerm.includes('runPermittedWriteCommand'), 'Permissions: runPermittedWriteCommand')
check(pcGuard.includes('products.write'), 'Permissions: product-card write guard')
check(poGuard.includes('production.write'), 'Permissions: production-order write guard')

const finHook = read('src/application/finance-integration/use-finance-integration.ts')
const costHook = read('src/application/cost-closing/use-cost-closing.ts')
const styleHook = read('src/application/style-closing/use-style-closing.ts')
check(
  !finHook.includes('invalidateQueries({ queryKey: applicationQueryKeys.financeIntegration.all })') &&
    finHook.includes('applicationQueryKeys.financeIntegration'),
  'Perf: finance invalidations narrowed',
)
check(
  !costHook.includes('invalidateQueries({ queryKey: applicationQueryKeys.costClosing.all })'),
  'Perf: cost-closing invalidations narrowed',
)
check(
  !styleHook.includes('invalidateQueries({ queryKey: applicationQueryKeys.styleClosing.all })'),
  'Perf: style-closing invalidations narrowed',
)

check(ai.includes('queryEnterpriseAiFoundation'), 'AI: foundation query')
check(ai.includes('llmEnabled: false'), 'AI: LLM disabled')
check(ai.includes('domainEventCatalog'), 'AI: domain event catalog')
check(ai.includes('recommendations'), 'AI: recommendation surfaces')
check(ai.includes('predictions'), 'AI: prediction surfaces')
check(ai.includes('sideEffects: \'NONE\'') || ai.includes("sideEffects: 'NONE'"), 'AI: sideEffects NONE')

check(query.includes('queryEnterpriseHealth'), 'Obs: health query')
check(query.includes('queryBootstrapDiagnosticsDashboard'), 'Obs: bootstrap diagnostics')
check(query.includes('queryPerformanceDashboard'), 'Obs: performance dashboard')
check(query.includes('queryAuditDashboard'), 'Obs: audit dashboard')
check(query.includes('queryReliabilityAudit'), 'Obs: reliability audit')

check(router.includes('/enterprise'), 'Router: /enterprise')
check(router.includes('EnterpriseHealthPage'), 'Router: health page')
check(router.includes('EnterpriseBootstrapPage'), 'Router: bootstrap page')
check(router.includes('EnterprisePerformancePage'), 'Router: performance page')
check(router.includes('EnterpriseAuditPage'), 'Router: audit page')
check(router.includes('EnterpriseAiFoundationPage'), 'Router: AI foundation page')
check(nav.includes('/enterprise/health'), 'Nav: enterprise health')
check(iam.includes("prefix: '/enterprise'"), 'IAM: /enterprise route permission')
check(keys.includes('enterpriseHardening'), 'Query keys: enterpriseHardening')
check(pkg.includes('validate:enterprise'), 'package.json: validate:enterprise')
check(pkg.includes('validate:enterprise') && pkg.includes('"build"'), 'package.json: build pipeline includes enterprise')
check(
  pkg.includes('validate:enterprise') &&
    /validate:enterprise/.test(pkg.match(/"build":\s*"([^"]+)"/)?.[1] ?? ''),
  'Build script runs validate:enterprise',
)

check(report.includes('Architecture Decision Records'), 'Docs: ADRs section')
check(report.includes('Technical Debt Review'), 'Docs: Technical Debt Review')
check(report.includes('Performance Review'), 'Docs: Performance Review')
check(report.includes('Security Review'), 'Docs: Security Review')
check(report.includes('Reliability Review'), 'Docs: Reliability Review')
check(report.includes('AI Readiness Review'), 'Docs: AI Readiness Review')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
