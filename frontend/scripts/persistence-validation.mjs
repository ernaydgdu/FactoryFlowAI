#!/usr/bin/env node
/**
 * Sprint 6D — Persistence validation orchestrator (static + runtime).
 */
import { execSync } from 'node:child_process'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'src')

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, files)
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) files.push(full)
  }
  return files
}

function read(rel) {
  return readFileSync(path.join(ROOT, rel), 'utf8')
}

console.log('=== Sprint 6D Persistence Validation ===\n')

// --- Static: MD/BOM TX coverage ---
const mdCommands = [
  'submitMasterDataForApproval',
  'approveMasterDataChange',
  'recordMasterDataCreate',
  'recordMasterDataUpdate',
  'setAttributeValue',
]
const platformBom = [
  'platformSubmitBomApproval',
  'platformApproveBomStep',
  'platformActivateRevision',
  'platformCreateRevision',
]

const approvalSrc = read('src/domain/master-data/enterprise/approval-service.ts')
const auditSrc = read('src/domain/master-data/enterprise/audit-service.ts')
const attrSrc = read('src/domain/master-data/enterprise/attribute-service.ts')
const orchestratorSrc = read('src/domain/platform/services/platform-orchestrator.ts')

for (const fn of mdCommands) {
  const wrapped =
    (approvalSrc.includes(fn) && approvalSrc.includes('runDomainCommandInTransaction')) ||
    (auditSrc.includes(fn) && auditSrc.includes('runDomainCommandInTransaction')) ||
    (attrSrc.includes(fn) && attrSrc.includes('runDomainCommandInTransaction'))
  console.log(`[${wrapped ? 'PASS' : 'FAIL'}] MD command TX: ${fn}`)
}

for (const fn of platformBom) {
  const ok = orchestratorSrc.includes(fn) && orchestratorSrc.includes('runDomainCommandInTransaction')
  console.log(`[${ok ? 'PASS' : 'FAIL'}] BOM command TX: ${fn}`)
}

// --- Static: singleton snapshot ---
const snapshotSrc = read('src/infrastructure/persistence/transaction/persistence-snapshot.ts')
const singletons = [
  'masterDataLookups',
  'masterDataApprovals',
  'comments',
  'aiMemory',
  'productionCalendar',
]
for (const key of singletons) {
  const ok = snapshotSrc.includes(`${key}:`) && snapshotSrc.includes(`restorePersistenceSnapshot`)
  console.log(`[${ok ? 'PASS' : 'FAIL'}] Snapshot scope: ${key}`)
}

// --- Static: domain/data command path isolation ---
const domainFiles = walk(path.join(SRC, 'domain'))
const dataImportPattern = /from ['"]\.{1,2}\/data\//
const commandPathAllowlist = new Set([
  path.join(SRC, 'domain/catalog/provisioning-catalog.bridge.ts'),
  path.join(SRC, 'domain/production-order/lifecycle-seed.bootstrap.ts'),
])

const commandPathViolations = []
for (const file of domainFiles) {
  if (!dataImportPattern.test(readFileSync(file, 'utf8'))) continue
  if (commandPathAllowlist.has(file)) continue
  const rel = path.relative(ROOT, file)
  const isQueryOrConfig =
    rel.includes('/brain/') ||
    rel.includes('/localization/') ||
    rel.includes('/validation/') ||
    rel.includes('/services/dashboard') ||
    rel.includes('/services/cost-calculator') ||
    rel.includes('/services/accessory-delay') ||
    rel.includes('/services/leftover-fabric') ||
    rel.includes('/services/business-rule-engine') ||
    rel.includes('/services/stock-ledger') ||
    rel.includes('/services/calculations') ||
    rel.includes('/production-planning/') ||
    rel.includes('lifecycle-brain-query') ||
    rel.includes('execution-platform-service.ts') ||
    rel.includes('quality-gate-service.ts')

  if (!isQueryOrConfig) {
    commandPathViolations.push(rel)
  }
}

console.log(`\n[${commandPathViolations.length === 0 ? 'PASS' : 'WARN'}] domain/data command path violations: ${commandPathViolations.length}`)
for (const v of commandPathViolations.slice(0, 10)) {
  console.log(`  - ${v}`)
}

// --- Runtime ---
console.log('\n--- Runtime validation (tsx) ---')
try {
  execSync('npx --yes tsx --tsconfig tsconfig.app.json scripts/persistence-runtime-validation.mjs', {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  })
} catch {
  process.exit(1)
}

console.log('\nAll persistence validations completed.')
