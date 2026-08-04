#!/usr/bin/env node
/**
 * Phase 5 Module 3 — Barcode & Mobile validation.
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
const labels = read('src/domain/barcode-mobile/label.service.ts')
const scan = read('src/domain/barcode-mobile/scan.service.ts')
const scanner = read('src/domain/barcode-mobile/scanner-abstraction.ts')
const offline = read('src/domain/barcode-mobile/offline-queue.service.ts')
const cmd = read('src/application/barcode-mobile/barcode-mobile-command.mapper.ts')
const ui = read('src/modules/barcode-mobile/pages/BarcodeMobilePages.tsx')
const router = read('src/app/router.tsx')
const nav = read('src/config/navigation.ts')
const pkg = read('package.json')
const keys = read('src/application/core/query-keys.ts')
const indexHtml = read('index.html')
const manifest = read('public/manifest.webmanifest')

check(codec.includes('encodeOperationBarcode'), 'Codec: Operation barcode')
check(codec.includes('encodeMaterialBarcode'), 'Codec: Material barcode')
check(codec.includes('encodeFinishedGoodsBarcode'), 'Codec: FG barcode')
check(codec.includes('encodePalletBarcode'), 'Codec: Pallet barcode')
check(codec.includes('encodeGs1128Skeleton'), 'Codec: GS1-128 skeleton')
check(codec.includes('encodeQrPayload'), 'Codec: QR payload')
check(codec.includes('parseBundleBarcode'), 'Codec: reuses bundle parse')
check(labels.includes('buildBundleLabel'), 'Label: Bundle')
check(labels.includes('buildPalletLabel'), 'Label: Pallet')
check(scan.includes('executeScanOperation'), 'Domain: Operation Scan')
check(scan.includes('executeScanBundle'), 'Domain: Bundle Scan')
check(scan.includes('executeScanMaterial'), 'Domain: Material Scan')
check(scan.includes('executeScanFinishedGoods'), 'Domain: Finished Goods Scan')
check(scan.includes('executeScanProduction'), 'Domain: Production Scan')
check(scan.includes('lookupBundleByScan'), 'Domain: uses existing bundle lookup')
check(scanner.includes('createManualTextScanner'), 'Scanner: manual abstraction')
check(scanner.includes('createStubCameraScanner'), 'Scanner: camera stub')
check(offline.includes('enqueueOfflineScan'), 'Offline: enqueue')
check(offline.includes('flushOfflineQueue'), 'Offline: flush skeleton')
check(cmd.includes('export function executeScanOperation'), 'App: executeScanOperation')
check(cmd.includes('export function executeScanBundle'), 'App: executeScanBundle')
check(cmd.includes('export function executeScanMaterial'), 'App: executeScanMaterial')
check(cmd.includes('export function executeScanFinishedGoods'), 'App: executeScanFinishedGoods')
check(keys.includes('barcodeMobile:'), 'Query keys: barcodeMobile')
check(ui.includes('export function BarcodeDashboardPage'), 'UI: Barcode Dashboard')
check(ui.includes('export function MobileOperatorPage'), 'UI: Mobile Operator')
check(ui.includes('export function ScannerScreenPage'), 'UI: Scanner Screen')
check(ui.includes('export function BundleScanPage'), 'UI: Bundle Scan')
check(ui.includes('export function MaterialScanPage'), 'UI: Material Scan')
check(ui.includes('export function FinishedGoodsScanPage'), 'UI: Finished Goods Scan')
check(ui.includes('export function QualityScanPage'), 'UI: Quality Scan')
check(ui.includes('export function WarehouseScanPage'), 'UI: Warehouse Scan')
check(router.includes('/barcode-mobile'), 'Router: barcode-mobile routes')
check(nav.includes('Barcode & Mobile'), 'Navigation: Barcode & Mobile menu')
check(manifest.includes('"name"'), 'PWA: manifest present')
check(indexHtml.includes('manifest.webmanifest'), 'PWA: index links manifest')
check(
  !exists('src/domain/ports/persistence/aggregates/barcode.repository.ts') &&
    !exists('src/domain/ports/persistence/aggregates/offline-scan.repository.ts'),
  'Architecture Freeze: no new aggregate port',
)
check(pkg.includes('validate:barcode-mobile'), 'Build: validate:barcode-mobile in pipeline')

console.log(`\n=== Result: ${pass} passed, ${fail} failed ===`)
process.exit(fail > 0 ? 1 : 0)
