#!/usr/bin/env node
/**
 * Phase 6 Module 2 — Commercial & Export Documents validation.
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

console.log('=== Phase 6 Module 2 — Commercial & Export Documents Validation ===\n')

const files = [
  'src/domain/commercial-documents/commercial-documents.types.ts',
  'src/domain/commercial-documents/commercial-documents-crud.service.ts',
  'src/domain/commercial-documents/commercial-documents-query.service.ts',
  'src/domain/ports/persistence/aggregates/export-document-set.repository.ts',
  'src/infrastructure/persistence/in-memory/aggregates/export-document-set.in-memory.repository.ts',
  'src/application/commercial-documents/commercial-documents.dto.ts',
  'src/application/commercial-documents/commercial-documents-command.mapper.ts',
  'src/application/commercial-documents/commercial-documents.application-service.ts',
  'src/application/commercial-documents/commercial-documents-permission.guard.ts',
  'src/application/commercial-documents/use-commercial-documents.ts',
  'src/modules/commercial-documents/layout/CommercialDocumentsLayout.tsx',
  'src/modules/commercial-documents/pages/CommercialDocumentsPages.tsx',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const crud = read('src/domain/commercial-documents/commercial-documents-crud.service.ts')
const cmd = read('src/application/commercial-documents/commercial-documents-command.mapper.ts')
const guard = read('src/application/commercial-documents/commercial-documents-permission.guard.ts')
const uow = read('src/domain/ports/persistence/unit-of-work.port.ts')
const ui = read('src/modules/commercial-documents/pages/CommercialDocumentsPages.tsx')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const pkg = read('package.json')
const keys = read('src/application/core/query-keys.ts')
const startup = read('scripts/startup-audit.mjs')
const twin = read('src/domain/brain/twin/engines/factory-graph-engine.ts')
const query = read('src/domain/commercial-documents/commercial-documents-query.service.ts')

check(uow.includes('exportDocumentSets'), 'UoW: exportDocumentSets port')
check(crud.includes('persistCreateExportDocumentSet'), 'Domain: create')
check(crud.includes('persistTransitionDocumentSet'), 'Domain: lifecycle')
check(crud.includes('SHIPMENT_APPROVED_STATUSES'), 'Rule: Approved Shipment')
check(crud.includes('QTY_MATCH_PL') || crud.includes('totalQty !== pl.totals.totalQty'), 'Rule: qty vs PL')
check(crud.includes('WEIGHT_RECONCILE_SHIPMENT') || crud.includes('reconcile'), 'Rule: weight/CBM')
check(crud.includes('persistReviseDocumentSet'), 'Domain: revision history')
check(crud.includes('Issued'), 'Domain: issue')
check(crud.includes('logAudit'), 'Domain: audit')
check(crud.includes('scheduleSalesOrderChange'), 'Domain: outbox')
check(crud.includes('idempotencyKey'), 'Domain: idempotency')
check(guard.includes('shipping.write'), 'IAM: write assert')
check(cmd.includes('runCommercialDocumentsWriteCommand'), 'App: write guard')
check(query.includes('queryCommercialDocumentsBrainReadModel'), 'AI: brain read model')
check(query.includes('queryAiDocumentValidation'), 'AI: validation surface')
check(twin.includes('EXPORT_DOCUMENT_SET'), 'Twin: EXPORT_DOCUMENT_SET nodes')
check(keys.includes('commercialDocuments'), 'Query keys')
check(ui.includes('CommercialInvoiceListPage'), 'UI: invoice list')
check(ui.includes('ExportDocumentSetDetailPage'), 'UI: export detail')
check(ui.includes('Approval Timeline'), 'UI: approval timeline')
check(ui.includes('Revision History'), 'UI: revision history')
check(ui.includes('CommercialDocumentsIssueWizardPage'), 'UI: issue wizard')
check(ui.includes('useAuth'), 'UI: IAM actor')
check(router.includes('commercial-documents'), 'Router: module')
check(router.includes('sets/:documentSetId'), 'Router: detail param')
check(nav.includes('Commercial Invoices'), 'Nav: invoices')
check(startup.includes("':documentSetId'"), 'Startup: documentSetId mapped')
check(pkg.includes('validate:commercial-documents'), 'Build: validate in pipeline')
check(
  !exists('src/domain/ports/persistence/aggregates/commercial-invoice.repository.ts'),
  'No duplicate CommercialInvoice persistence port (nested in ExportDocumentSet)',
)

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
