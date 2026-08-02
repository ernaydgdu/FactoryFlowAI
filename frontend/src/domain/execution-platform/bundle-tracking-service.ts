/**
 * Bundle Tracking Service — PBS bundle lifecycle
 */
import type { CreateBundlesCommandContext } from '../catalog/command-context.types'
import { colorCardRepository } from '../master-data'
import type { Bundle, BundleTicket, BundleComponentCode } from './execution-types'
import { BUNDLE_BARCODE_FORMAT_VERSION, DEFAULT_BUNDLE_SIZE } from './execution-types'
import {
  buildAssemblyGroupId,
  buildBundleBarcodePayload,
  distributePiecesIntoBundles,
  encodeBundleBarcode,
  formatHumanBundleNo,
  parseBundleBarcode,
} from './bundle-model'
import { emitExecutionEvent, getExecutionTimeline } from './execution-timeline-service'
import { appendWipTransfer } from './wip-query-service'
import { logExecutionCreate, logExecutionUpdate } from './execution-audit-service'
import type { WipTransfer } from './execution-types'

import {
  DEFAULT_TENANT_ID,
  requireUnitOfWork,
} from '../ports/persistence/persistence-registry'
import type { PersistedBundle } from '../ports/persistence/persistence-aggregates'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '../ports/persistence/persistence.types'

function bundleRepo() {
  return requireUnitOfWork().bundles
}

function stripBundle(row: PersistedBundle): Bundle {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    updatedAt: _u,
    deletedAt: _d,
    tickets: _tk,
    ...rest
  } = row
  return rest
}

function saveBundle(bundle: Bundle, tickets?: BundleTicket[]): Bundle {
  const existing = bundleRepo().findById(DEFAULT_TENANT_ID, bundle.id)
  const now = new Date().toISOString()
  const persisted: PersistedBundle = {
    ...bundle,
    tenantId: DEFAULT_TENANT_ID,
    version: existing?.version ?? 1,
    schemaVersion: 1,
    createdAt: existing?.createdAt ?? bundle.createdAt,
    updatedAt: now,
    deletedAt: null,
    tickets: tickets ?? existing?.tickets ?? [],
  }
  bundleRepo().save(DEFAULT_TENANT_ID, persisted)
  return bundle
}

function nextBundleId(): string {
  return bundleRepo().nextBundleId()
}

function nextTicketId(): string {
  return bundleRepo().nextTicketId()
}

function nextTransferId(): string {
  return bundleRepo().nextTransferId()
}

function getTicketsForBundle(bundleId: string): BundleTicket[] {
  const row = bundleRepo().findById(DEFAULT_TENANT_ID, bundleId)
  return row?.tickets ?? []
}

function addTicket(ticket: BundleTicket): void {
  const row = bundleRepo().findById(DEFAULT_TENANT_ID, ticket.bundleId)
  if (!row) return
  bundleRepo().save(DEFAULT_TENANT_ID, { ...row, tickets: [...row.tickets, ticket] })
}

function snapshotBundle(bundle: Bundle): Record<string, unknown> {
  return { ...bundle, metadata: { ...bundle.metadata } }
}

export function getBundle(bundleId: string): Bundle | undefined {
  const row = bundleRepo().findById(DEFAULT_TENANT_ID, bundleId)
  return row ? stripBundle(row) : undefined
}

export function getBundleByBarcode(barcode: string): Bundle | undefined {
  const row = bundleRepo().findByBarcode(DEFAULT_TENANT_ID, barcode)
  return row ? stripBundle(row) : undefined
}

export function assertUniqueBarcode(barcode: string, excludeBundleId?: string): void {
  const existing = getBundleByBarcode(barcode)
  if (existing && existing.id !== excludeBundleId) {
    throw new Error(`Duplicate barcode: ${barcode} — mevcut bundle ${existing.bundleNo}`)
  }
}

export function getBundlesForProductionOrder(productionOrderNo: string): Bundle[] {
  const page = bundleRepo().cursorByProductionOrderNo(DEFAULT_TENANT_ID, productionOrderNo, {
    limit: PERSISTENCE_CURSOR_MAX_LIMIT,
  })
  return page.items.map(stripBundle)
}

export function createBundlesFromMatrix(input: {
  executionContextId: string
  productionOrderNo: string
  salesOrderId: string
  salesOrderNo: string
  productCode: string
  workshopCode: string
  componentCode?: BundleComponentCode
  bundleSize?: number
  actor: string
  cuttingBatchRef?: string
  fabricLotRef?: string
  catalogContext: CreateBundlesCommandContext
}): Bundle[] {
  const existing = getBundlesForProductionOrder(input.productionOrderNo)
  if (existing.length > 0) return existing

  const orderMatrix = input.catalogContext.orderMatrix

  const component = input.componentCode ?? 'GARMENT'
  const bundleSize = input.bundleSize ?? DEFAULT_BUNDLE_SIZE
  const bundles: Bundle[] = []
  let globalSeq = 0

  for (const [colorId, sizeMap] of Object.entries(orderMatrix)) {
    const colorCard = colorCardRepository.getById(colorId)
    const colorCode = colorCard?.code ?? colorId
    const colorName = colorCard?.name ?? colorId

    for (const [sizeCode, qty] of Object.entries(sizeMap)) {
      if (qty <= 0) continue
      const pieceGroups = distributePiecesIntoBundles(qty, bundleSize)
      let groupIndex = 0

      for (const pieceCount of pieceGroups) {
        globalSeq += 1
        groupIndex += 1
        const assemblyGroupId = buildAssemblyGroupId(input.productionOrderNo, colorCode, sizeCode, groupIndex)

        const payload = buildBundleBarcodePayload({
          style: input.productCode,
          lot: input.salesOrderNo.replace('SIP-', ''),
          color: colorCode,
          size: sizeCode,
          bundleSequence: globalSeq,
          component,
          pieceCount,
          productionOrderNo: input.productionOrderNo,
          assemblyGroupId,
        })

        const barcode = encodeBundleBarcode(payload)
        assertUniqueBarcode(barcode)
        const bundle: Bundle = {
          id: nextBundleId(),
          bundleNo: formatHumanBundleNo(payload),
          barcode,
          productionOrderNo: input.productionOrderNo,
          executionContextId: input.executionContextId,
          salesOrderId: input.salesOrderId,
          salesOrderNo: input.salesOrderNo,
          productCode: input.productCode,
          colorCode,
          colorName,
          sizeCode,
          componentCode: component,
          pieceCount,
          assemblyGroupId,
          cuttingBatchRef: input.cuttingBatchRef ?? null,
          fabricLotRef: input.fabricLotRef ?? null,
          status: 'Created',
          currentOperationCode: 'NUMBER',
          currentWorkshopCode: input.workshopCode,
          currentLineId: null,
          createdAt: new Date().toISOString(),
          labeledAt: null,
          issuedAt: null,
          completedAt: null,
          metadata: {},
        }
        saveBundle(bundle)
        bundles.push(bundle)

        emitExecutionEvent({
          executionContextId: input.executionContextId,
          productionOrderNo: input.productionOrderNo,
          salesOrderId: input.salesOrderId,
          salesOrderNo: input.salesOrderNo,
          eventType: 'BundleCreated',
          title: `Bundle ${bundle.bundleNo}`,
          description: `${pieceCount} adet — ${colorName} / ${sizeCode}`,
          actor: input.actor,
          bundleId: bundle.id,
          operationCode: 'NUMBER',
        })

        logExecutionCreate('Bundle', bundle.id, {
          actor: input.actor,
          productionOrderNo: input.productionOrderNo,
          executionContextId: input.executionContextId,
          bundleId: bundle.id,
          operationCode: 'NUMBER',
        }, { bundleNo: bundle.bundleNo, barcode: bundle.barcode, pieceCount })
      }
    }
  }

  return bundles
}

export function printBundleTicket(bundleId: string, printedBy: string): BundleTicket {
  const bundle = getBundle(bundleId)
  if (!bundle) throw new Error('Bundle bulunamadı')

  const parsed = parseBundleBarcode(bundle.barcode)
  if (!parsed) throw new Error('Geçersiz bundle barcode')

  const version = getTicketsForBundle(bundleId).filter((t) => !t.voided).length + 1
  const ticket: BundleTicket = {
    id: nextTicketId(),
    bundleId,
    ticketVersion: version,
    barcode: bundle.barcode,
    formatVersion: BUNDLE_BARCODE_FORMAT_VERSION,
    payload: parsed,
    printedAt: new Date().toISOString(),
    printedBy,
    voided: false,
  }
  addTicket(ticket)

  bundle.status = 'Labeled'
  bundle.labeledAt = ticket.printedAt
  saveBundle(bundle)

  emitExecutionEvent({
    executionContextId: bundle.executionContextId,
    productionOrderNo: bundle.productionOrderNo,
    salesOrderId: bundle.salesOrderId,
    salesOrderNo: bundle.salesOrderNo,
    eventType: 'BundleLabeled',
    title: `Etiket basıldı — ${bundle.bundleNo}`,
    description: `Ticket v${version}`,
    actor: printedBy,
    bundleId: bundle.id,
  })

  return ticket
}

export function issueBundleToFloor(bundleId: string, actor: string): Bundle {
  const bundle = getBundle(bundleId)
  if (!bundle) throw new Error('Bundle bulunamadı')
  if (bundle.status !== 'Labeled' && bundle.status !== 'Created') {
    throw new Error('Bundle zaten floor\'da')
  }

  bundle.status = 'Issued'
  bundle.issuedAt = new Date().toISOString()
  bundle.currentOperationCode = 'SEW'
  saveBundle(bundle)

  emitExecutionEvent({
    executionContextId: bundle.executionContextId,
    productionOrderNo: bundle.productionOrderNo,
    salesOrderId: bundle.salesOrderId,
    salesOrderNo: bundle.salesOrderNo,
    eventType: 'BundleIssued',
    title: `Bundle floor'a verildi`,
    description: bundle.bundleNo,
    actor,
    bundleId: bundle.id,
    operationCode: 'SEW',
  })

  return bundle
}

export function moveBundleToOperation(input: {
  bundleId: string
  toOperationCode: string
  workshopCode: string
  lineId?: string | null
  actor: string
}): { bundle: Bundle; transfer: WipTransfer } {
  const bundle = getBundle(input.bundleId)
  if (!bundle) throw new Error('Bundle bulunamadı')

  const fromOp = bundle.currentOperationCode ?? 'NUMBER'
  bundle.status = 'AtOperation'
  bundle.currentOperationCode = input.toOperationCode
  bundle.currentWorkshopCode = input.workshopCode
  bundle.currentLineId = input.lineId ?? null
  saveBundle(bundle)

  const transfer: WipTransfer = {
    id: nextTransferId(),
    executionContextId: bundle.executionContextId,
    productionOrderNo: bundle.productionOrderNo,
    bundleId: bundle.id,
    fromOperationCode: fromOp,
    toOperationCode: input.toOperationCode,
    quantity: bundle.pieceCount,
    transferType: 'Forward',
    transferredAt: new Date().toISOString(),
    transferredBy: input.actor,
    reasonCode: null,
  }
  appendWipTransfer(transfer)

  emitExecutionEvent({
    executionContextId: bundle.executionContextId,
    productionOrderNo: bundle.productionOrderNo,
    salesOrderId: bundle.salesOrderId,
    salesOrderNo: bundle.salesOrderNo,
    eventType: 'BundleMoved',
    title: `Bundle taşındı`,
    description: `${fromOp} → ${input.toOperationCode} — ${bundle.bundleNo}`,
    actor: input.actor,
    bundleId: bundle.id,
    operationCode: input.toOperationCode,
    metadata: {
      bundleSnapshot: snapshotBundle(bundle),
      transferId: transfer.id,
    },
  })

  emitExecutionEvent({
    executionContextId: bundle.executionContextId,
    productionOrderNo: bundle.productionOrderNo,
    salesOrderId: bundle.salesOrderId,
    salesOrderNo: bundle.salesOrderNo,
    eventType: 'WipTransferred',
    title: 'WIP Transfer',
    description: transfer.fromOperationCode + ' → ' + transfer.toOperationCode,
    actor: input.actor,
    bundleId: bundle.id,
    operationCode: input.toOperationCode,
  })

  return { bundle, transfer }
}

export function holdBundle(bundleId: string, reasonCode: string, actor: string): Bundle {
  const bundle = getBundle(bundleId)
  if (!bundle) throw new Error('Bundle bulunamadı')
  bundle.status = 'OnHold'
  bundle.metadata = { ...bundle.metadata, holdReason: reasonCode }
  saveBundle(bundle)

  emitExecutionEvent({
    executionContextId: bundle.executionContextId,
    productionOrderNo: bundle.productionOrderNo,
    salesOrderId: bundle.salesOrderId,
    salesOrderNo: bundle.salesOrderNo,
    eventType: 'BundleOnHold',
    title: 'Bundle hold',
    description: reasonCode,
    actor,
    bundleId: bundle.id,
  })

  return bundle
}

export function completeBundle(bundleId: string, actor: string): Bundle {
  const bundle = getBundle(bundleId)
  if (!bundle) throw new Error('Bundle bulunamadı')
  bundle.status = 'Completed'
  bundle.completedAt = new Date().toISOString()
  bundle.currentOperationCode = 'PACK'
  saveBundle(bundle)

  emitExecutionEvent({
    executionContextId: bundle.executionContextId,
    productionOrderNo: bundle.productionOrderNo,
    salesOrderId: bundle.salesOrderId,
    salesOrderNo: bundle.salesOrderNo,
    eventType: 'BundleCompleted',
    title: 'Bundle tamamlandı',
    description: bundle.bundleNo,
    actor,
    bundleId: bundle.id,
  })

  return bundle
}

export function lookupBundleByScan(barcode: string): Bundle | null {
  const parsed = parseBundleBarcode(barcode)
  if (!parsed) return null
  return getBundleByBarcode(barcode) ?? null
}

export function getBundleTickets(bundleId: string): BundleTicket[] {
  return getTicketsForBundle(bundleId)
}

export function getBundleWaitTimes(productionOrderNo: string): Array<{ bundleId: string; bundleNo: string; operationCode: string; waitMinutes: number }> {
  const now = Date.now()
  return getBundlesForProductionOrder(productionOrderNo)
    .filter((b) => b.status === 'AtOperation' || b.status === 'Issued')
    .map((b) => ({
      bundleId: b.id,
      bundleNo: b.bundleNo,
      operationCode: b.currentOperationCode ?? '—',
      waitMinutes: b.issuedAt ? Math.round((now - new Date(b.issuedAt).getTime()) / 60_000) : 0,
    }))
}

export function cancelBundle(bundleId: string, reasonCode: string, actor: string): Bundle {
  const bundle = getBundle(bundleId)
  if (!bundle) throw new Error('Bundle bulunamadı')
  if (bundle.status === 'Completed' || bundle.status === 'Scrapped') {
    throw new Error('Tamamlanmış/scrap bundle iptal edilemez')
  }
  const old = snapshotBundle(bundle)
  bundle.status = 'Cancelled'
  bundle.metadata = { ...bundle.metadata, cancelReason: reasonCode, cancelledAt: new Date().toISOString() }
  saveBundle(bundle)

  emitExecutionEvent({
    executionContextId: bundle.executionContextId,
    productionOrderNo: bundle.productionOrderNo,
    salesOrderId: bundle.salesOrderId,
    salesOrderNo: bundle.salesOrderNo,
    eventType: 'BundleCancelled',
    title: 'Bundle iptal edildi',
    description: reasonCode,
    actor,
    bundleId: bundle.id,
  })

  logExecutionUpdate('Bundle', bundleId, {
    actor,
    productionOrderNo: bundle.productionOrderNo,
    executionContextId: bundle.executionContextId,
    bundleId,
    operationCode: bundle.currentOperationCode ?? undefined,
    lineId: bundle.currentLineId ?? undefined,
  }, old, snapshotBundle(bundle))

  return bundle
}

export function reworkBundle(input: {
  bundleId: string
  toOperationCode: string
  reasonCode: string
  actor: string
}): { bundle: Bundle; transfer: WipTransfer } {
  const bundle = getBundle(input.bundleId)
  if (!bundle) throw new Error('Bundle bulunamadı')

  const fromOp = bundle.currentOperationCode ?? 'SEW'
  bundle.status = 'AtOperation'
  bundle.currentOperationCode = input.toOperationCode
  bundle.metadata = {
    ...bundle.metadata,
    reworkReason: input.reasonCode,
    reworkFromOperation: fromOp,
    reworkAt: new Date().toISOString(),
  }
  saveBundle(bundle)

  const transfer: WipTransfer = {
    id: nextTransferId(),
    executionContextId: bundle.executionContextId,
    productionOrderNo: bundle.productionOrderNo,
    bundleId: bundle.id,
    fromOperationCode: fromOp,
    toOperationCode: input.toOperationCode,
    quantity: bundle.pieceCount,
    transferType: 'Rework',
    transferredAt: new Date().toISOString(),
    transferredBy: input.actor,
    reasonCode: input.reasonCode,
  }
  appendWipTransfer(transfer)

  emitExecutionEvent({
    executionContextId: bundle.executionContextId,
    productionOrderNo: bundle.productionOrderNo,
    salesOrderId: bundle.salesOrderId,
    salesOrderNo: bundle.salesOrderNo,
    eventType: 'ReworkStarted',
    title: 'Bundle rework başladı',
    description: `${fromOp} → ${input.toOperationCode} — ${input.reasonCode}`,
    actor: input.actor,
    bundleId: bundle.id,
    operationCode: input.toOperationCode,
  })

  emitExecutionEvent({
    executionContextId: bundle.executionContextId,
    productionOrderNo: bundle.productionOrderNo,
    salesOrderId: bundle.salesOrderId,
    salesOrderNo: bundle.salesOrderNo,
    eventType: 'WipTransferred',
    title: 'Rework WIP Transfer',
    description: `${fromOp} → ${input.toOperationCode}`,
    actor: input.actor,
    bundleId: bundle.id,
    operationCode: input.toOperationCode,
  })

  logExecutionUpdate('Bundle', input.bundleId, {
    actor: input.actor,
    productionOrderNo: bundle.productionOrderNo,
    executionContextId: bundle.executionContextId,
    bundleId: input.bundleId,
    operationCode: input.toOperationCode,
  }, { currentOperationCode: fromOp }, { currentOperationCode: input.toOperationCode, rework: true })

  return { bundle, transfer }
}

export function splitBundle(input: {
  bundleId: string
  splits: Array<{ pieceCount: number; componentCode?: BundleComponentCode }>
  actor: string
}): Bundle[] {
  const parent = getBundle(input.bundleId)
  if (!parent) throw new Error('Bundle bulunamadı')
  if (input.splits.reduce((s, sp) => s + sp.pieceCount, 0) !== parent.pieceCount) {
    throw new Error('Split adetleri parent pieceCount ile eşleşmiyor')
  }

  const children: Bundle[] = []
  const parsed = parseBundleBarcode(parent.barcode)
  if (!parsed) throw new Error('Geçersiz parent barcode')

  input.splits.forEach((split, idx) => {
    const payload = buildBundleBarcodePayload({
      ...parsed,
      bundleSequence: parsed.bundleSequence * 100 + idx + 1,
      component: split.componentCode ?? parent.componentCode,
      pieceCount: split.pieceCount,
    })
    const barcode = encodeBundleBarcode(payload)
    assertUniqueBarcode(barcode)

    const child: Bundle = {
      ...parent,
      id: nextBundleId(),
      bundleNo: formatHumanBundleNo(payload),
      barcode,
      pieceCount: split.pieceCount,
      componentCode: split.componentCode ?? parent.componentCode,
      status: parent.status,
      metadata: {
        ...parent.metadata,
        splitFromBundleId: parent.id,
        splitIndex: idx + 1,
        splitOfTotal: input.splits.length,
      },
    }
    saveBundle(child)
    children.push(child)
  })

  parent.status = 'Scrapped'
  parent.metadata = { ...parent.metadata, splitInto: children.map((c) => c.id).join(',') }
  saveBundle(parent)

  emitExecutionEvent({
    executionContextId: parent.executionContextId,
    productionOrderNo: parent.productionOrderNo,
    salesOrderId: parent.salesOrderId,
    salesOrderNo: parent.salesOrderNo,
    eventType: 'BundleSplit',
    title: 'Bundle bölündü',
    description: `${parent.bundleNo} → ${children.length} child`,
    actor: input.actor,
    bundleId: parent.id,
    metadata: { childBundleIds: children.map((c) => c.id) },
  })

  logExecutionUpdate('Bundle', parent.id, {
    actor: input.actor,
    productionOrderNo: parent.productionOrderNo,
    executionContextId: parent.executionContextId,
    bundleId: parent.id,
  }, snapshotBundle(parent), { splitInto: children.map((c) => c.id) })

  return children
}

export function mergeBundles(input: {
  bundleIds: string[]
  actor: string
}): Bundle {
  if (input.bundleIds.length < 2) throw new Error('Merge için en az 2 bundle gerekli')
  const bundles = input.bundleIds.map((id) => {
    const b = getBundle(id)
    if (!b) throw new Error(`Bundle bulunamadı: ${id}`)
    return b
  })

  const first = bundles[0]
  const samePo = bundles.every((b) => b.productionOrderNo === first.productionOrderNo)
  if (!samePo) throw new Error('Farklı UE bundle\'ları birleştirilemez')

  const totalPieces = bundles.reduce((s, b) => s + b.pieceCount, 0)
  const parsed = parseBundleBarcode(first.barcode)
  if (!parsed) throw new Error('Geçersiz barcode')

  const payload = buildBundleBarcodePayload({
    ...parsed,
    bundleSequence: parsed.bundleSequence + 9000,
    pieceCount: totalPieces,
  })
  const barcode = encodeBundleBarcode(payload)
  assertUniqueBarcode(barcode)

  const merged: Bundle = {
    ...first,
    id: nextBundleId(),
    bundleNo: formatHumanBundleNo(payload),
    barcode,
    pieceCount: totalPieces,
    metadata: {
      ...first.metadata,
      mergedFromBundleIds: input.bundleIds.join(','),
      mergedAt: new Date().toISOString(),
    },
  }
  saveBundle(merged)

  for (const b of bundles) {
    b.status = 'Scrapped'
    b.metadata = { ...b.metadata, mergedIntoBundleId: merged.id }
    saveBundle(b)
  }

  emitExecutionEvent({
    executionContextId: merged.executionContextId,
    productionOrderNo: merged.productionOrderNo,
    salesOrderId: merged.salesOrderId,
    salesOrderNo: merged.salesOrderNo,
    eventType: 'BundleMerged',
    title: 'Bundle birleştirildi',
    description: `${input.bundleIds.length} bundle → ${merged.bundleNo}`,
    actor: input.actor,
    bundleId: merged.id,
    metadata: { sourceBundleIds: input.bundleIds },
  })

  logExecutionCreate('Bundle', merged.id, {
    actor: input.actor,
    productionOrderNo: merged.productionOrderNo,
    executionContextId: merged.executionContextId,
    bundleId: merged.id,
  }, { mergedFrom: input.bundleIds, pieceCount: totalPieces })

  return merged
}

export function reportBundleLost(bundleId: string, reasonCode: string, actor: string): Bundle {
  const bundle = getBundle(bundleId)
  if (!bundle) throw new Error('Bundle bulunamadı')
  const old = snapshotBundle(bundle)
  bundle.status = 'Lost'
  bundle.metadata = { ...bundle.metadata, lostReason: reasonCode, lostAt: new Date().toISOString() }
  saveBundle(bundle)

  emitExecutionEvent({
    executionContextId: bundle.executionContextId,
    productionOrderNo: bundle.productionOrderNo,
    salesOrderId: bundle.salesOrderId,
    salesOrderNo: bundle.salesOrderNo,
    eventType: 'BundleLost',
    title: 'Bundle kayıp',
    description: reasonCode,
    actor,
    bundleId: bundle.id,
  })

  logExecutionUpdate('Bundle', bundleId, {
    actor,
    productionOrderNo: bundle.productionOrderNo,
    executionContextId: bundle.executionContextId,
    bundleId,
  }, old, snapshotBundle(bundle))

  return bundle
}

export function reportBundleDamaged(input: {
  bundleId: string
  severity: 'Minor' | 'Major' | 'Total'
  reasonCode: string
  actor: string
}): Bundle {
  const bundle = getBundle(input.bundleId)
  if (!bundle) throw new Error('Bundle bulunamadı')
  const old = snapshotBundle(bundle)

  if (input.severity === 'Total') {
    bundle.status = 'Scrapped'
    emitExecutionEvent({
      executionContextId: bundle.executionContextId,
      productionOrderNo: bundle.productionOrderNo,
      salesOrderId: bundle.salesOrderId,
      salesOrderNo: bundle.salesOrderNo,
      eventType: 'BundleScrapped',
      title: 'Bundle hurda',
      description: input.reasonCode,
      actor: input.actor,
      bundleId: bundle.id,
    })
  } else {
    bundle.status = 'Damaged'
    emitExecutionEvent({
      executionContextId: bundle.executionContextId,
      productionOrderNo: bundle.productionOrderNo,
      salesOrderId: bundle.salesOrderId,
      salesOrderNo: bundle.salesOrderNo,
      eventType: 'BundleDamaged',
      title: `Bundle hasar — ${input.severity}`,
      description: input.reasonCode,
      actor: input.actor,
      bundleId: bundle.id,
    })
  }

  bundle.metadata = {
    ...bundle.metadata,
    damageSeverity: input.severity,
    damageReason: input.reasonCode,
    damagedAt: new Date().toISOString(),
  }
  saveBundle(bundle)

  logExecutionUpdate('Bundle', input.bundleId, {
    actor: input.actor,
    productionOrderNo: bundle.productionOrderNo,
    executionContextId: bundle.executionContextId,
    bundleId: input.bundleId,
  }, old, snapshotBundle(bundle))

  return bundle
}

export function rollbackBundleToEvent(bundleId: string, eventId: string, actor: string): Bundle {
  const bundle = getBundle(bundleId)
  if (!bundle) throw new Error('Bundle bulunamadı')

  const timeline = getExecutionTimeline(bundle.productionOrderNo)
  const targetEvent = timeline.find((e) => e.id === eventId && e.bundleId === bundleId)
  if (!targetEvent) throw new Error('Rollback hedef event bulunamadı')

  const snapshot = targetEvent.metadata?.bundleSnapshot as Partial<Bundle> | undefined
  if (!snapshot) {
    throw new Error('Event metadata.bundleSnapshot yok — rollback yapılamaz')
  }

  const old = snapshotBundle(bundle)
  const restored: Bundle = {
    ...bundle,
    status: (snapshot.status as Bundle['status']) ?? bundle.status,
    currentOperationCode: snapshot.currentOperationCode ?? bundle.currentOperationCode,
    currentWorkshopCode: snapshot.currentWorkshopCode ?? bundle.currentWorkshopCode,
    currentLineId: snapshot.currentLineId ?? bundle.currentLineId,
    metadata: {
      ...bundle.metadata,
      rollbackToEventId: eventId,
      rollbackAt: new Date().toISOString(),
      rollbackBy: actor,
    },
  }
  saveBundle(restored)

  emitExecutionEvent({
    executionContextId: bundle.executionContextId,
    productionOrderNo: bundle.productionOrderNo,
    salesOrderId: bundle.salesOrderId,
    salesOrderNo: bundle.salesOrderNo,
    eventType: 'BundleMoved',
    title: 'Bundle rollback',
    description: `Event ${eventId} durumuna döndürüldü`,
    actor,
    bundleId: bundle.id,
    metadata: { rollbackToEventId: eventId, previousStatus: old.status },
  })

  logExecutionUpdate('Bundle', bundleId, {
    actor,
    productionOrderNo: bundle.productionOrderNo,
    executionContextId: bundle.executionContextId,
    bundleId,
  }, old, snapshotBundle(restored))

  return restored
}
