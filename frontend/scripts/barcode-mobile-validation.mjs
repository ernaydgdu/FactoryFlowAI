#!/usr/bin/env node
/**
 * Phase 5 Module 3 — Barcode & Mobile validation (production workflows).
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

console.log('=== Phase 5 Module 3 — Barcode & Mobile Validation ===\n')

const files = [
  'src/domain/barcode-mobile/barcode.types.ts',
  'src/domain/barcode-mobile/barcode-codec.service.ts',
  'src/domain/barcode-mobile/label.service.ts',
  'src/domain/barcode-mobile/scan.service.ts',
  'src/domain/barcode-mobile/scan-workflow.service.ts',
  'src/domain/barcode-mobile/scanner-abstraction.ts',
  'src/domain/barcode-mobile/offline-queue.service.ts',
  'src/application/barcode-mobile/barcode-mobile.dto.ts',
  'src/application/barcode-mobile/barcode-mobile.mapper.ts',
  'src/application/barcode-mobile/barcode-mobile-command.mapper.ts',
  'src/application/barcode-mobile/barcode-mobile.application-service.ts',
  'src/application/barcode-mobile/use-barcode-mobile.ts',
  'src/modules/barcode-mobile/layout/BarcodeMobileLayout.tsx',
  'src/modules/barcode-mobile/pages/BarcodeMobilePages.tsx',
  'public/manifest.webmanifest',
]

for (const f of files) check(exists(f), `File exists: ${f}`)

const codec = read('src/domain/barcode-mobile/barcode-codec.service.ts')
const workflow = read('src/domain/barcode-mobile/scan-workflow.service.ts')
const offline = read('src/domain/barcode-mobile/offline-queue.service.ts')
const scanner = read('src/domain/barcode-mobile/scanner-abstraction.ts')
const cmd = read('src/application/barcode-mobile/barcode-mobile-command.mapper.ts')
const ledger = read('src/domain/inventory/stock-ledger-crud.service.ts')
const gr = read('src/domain/purchasing/goods-receipt-crud.service.ts')
const ui = read('src/modules/barcode-mobile/pages/BarcodeMobilePages.tsx')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const pkg = read('package.json')
const keys = read('src/application/core/query-keys.ts')
const invCmd = read('src/application/inventory/inventory-command.mapper.ts')

check(codec.includes('encodeGs1128Skeleton'), 'Codec: GS1-128')
check(codec.includes('encodeQrPayload'), 'Codec: QR')
check(workflow.includes('executeReceivingScan'), 'Workflow: Receiving')
check(workflow.includes('executeMaterialIssueScan'), 'Workflow: Material issue')
check(workflow.includes('executeProductionScanWorkflow'), 'Workflow: Production')
check(workflow.includes('executeFgReceiptScan'), 'Workflow: FG receipt')
check(workflow.includes('executeShipmentScan'), 'Workflow: Shipment')
check(workflow.includes('persistPostGoodsReceipt'), 'Workflow: uses GR persist')
check(workflow.includes('persistGoodsIssue'), 'Workflow: uses GI persist')
check(workflow.includes('persistProductionDeclaration'), 'Workflow: uses declaration')
check(workflow.includes('persistFinishedGoodsReceipt'), 'Workflow: uses FG persist')
check(workflow.includes('persistShipment'), 'Workflow: uses shipment persist')
check(ledger.includes('export function persistShipment'), 'Ledger: persistShipment')
check(ledger.includes('queryStockMovementByReferenceNo'), 'Ledger: idempotent issue lookup')
check(gr.includes('idempotencyKey'), 'GR: idempotencyKey')
check(invCmd.includes('executeShipment'), 'App inventory: executeShipment')
check(cmd.includes('runCommandInTransaction'), 'App barcode: TX wrapper')
check(cmd.includes('executeReceivingScan'), 'App: executeReceivingScan')
check(cmd.includes('executeMaterialIssueScan'), 'App: executeMaterialIssueScan')
check(cmd.includes('executeProductionScan'), 'App: executeProductionScan')
check(cmd.includes('executeFgReceiptScan'), 'App: executeFgReceiptScan')
check(cmd.includes('executeShipmentScan'), 'App: executeShipmentScan')
check(cmd.includes('executeSyncOfflineQueue'), 'App: sync offline')
check(offline.includes('localStorage'), 'Offline: durable localStorage')
check(offline.includes('syncOfflineQueue'), 'Offline: sync mechanism')
check(scanner.includes('createCameraScanner'), 'Scanner: camera abstraction')
check(scanner.includes('getUserMedia'), 'Scanner: getUserMedia')
check(scanner.includes('BarcodeDetector'), 'Scanner: BarcodeDetector')
check(keys.includes('barcodeMobile:'), 'Query keys')
check(ui.includes('export function ReceivingScanPage'), 'UI: Receiving')
check(ui.includes('export function MaterialIssueScanPage'), 'UI: Material Issue')
check(ui.includes('export function ProductionScanWorkflowPage'), 'UI: Production')
check(ui.includes('export function FgReceiptScanPage'), 'UI: FG Receipt')
check(ui.includes('export function ShipmentScanPage'), 'UI: Shipment')
check(router.includes('receiving'), 'Router: receiving')
check(router.includes('material-issue'), 'Router: material-issue')
check(router.includes('fg-receipt'), 'Router: fg-receipt')
check(router.includes('shipment'), 'Router: shipment')
check(nav.includes('Receiving Scan'), 'Nav: Receiving')
check(
  !exists('src/domain/ports/persistence/aggregates/barcode.repository.ts') &&
    !exists('src/domain/ports/persistence/aggregates/offline-scan.repository.ts'),
  'Architecture Freeze: no new aggregate port',
)
check(pkg.includes('validate:barcode-mobile'), 'Build: validate:barcode-mobile')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
