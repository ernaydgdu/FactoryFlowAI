/**
 * Packing List CRUD — transactional writes via IPackingListRepository.
 * Shipment binding reuses persistShipment (no duplicate write path).
 */
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import { persistShipment } from '@/domain/inventory/stock-ledger-crud.service'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedPackingList } from '@/domain/ports/persistence/persistence-aggregates'
import type { IPackingListRepository } from '@/domain/ports/persistence/aggregates/packing-list.repository'
import { scheduleSalesOrderChange } from '@/domain/platform/services/outbox-scheduler'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import { queryProductionOrderByNo } from '@/domain/production-order/production-order-query.service'
import { querySalesOrderById } from '@/domain/sales-order/sales-order-query.service'
import { queryStockMovementsByType } from '@/domain/inventory/stock-ledger-query.service'

import type {
  AddPackageInput,
  AutoGenerateFromFgInput,
  BindShipmentInput,
  CreatePackingListInput,
  PackageDimensionsCm,
  PackageEntity,
  PackageLine,
  PackingList,
  PackingListTotals,
} from './packaging.types'

export class PackagingDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PackagingDomainError'
  }
}

function repo(): IPackingListRepository {
  return requireUnitOfWork().packingLists
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function emptyTotals(): PackingListTotals {
  return {
    packageCount: 0,
    cartonCount: 0,
    palletCount: 0,
    totalQty: 0,
    netWeightKg: 0,
    grossWeightKg: 0,
    volumeCbm: 0,
  }
}

export function calculateVolumeCbm(dimensions: PackageDimensionsCm): number {
  const cbm =
    (dimensions.lengthCm / 100) * (dimensions.widthCm / 100) * (dimensions.heightCm / 100)
  return Math.round(cbm * 10000) / 10000
}

export function calculateGrossWeight(netWeightKg: number, tareWeightKg: number): number {
  return Math.round((netWeightKg + tareWeightKg) * 1000) / 1000
}

/** SSCC-18 preparation — GS1 AI (00) digital string (extension digit + company + serial + check). */
export function prepareSscc(serial: number, companyPrefix = '0860123456'): string {
  const ext = '0'
  const body = `${ext}${companyPrefix}${String(serial).padStart(6, '0')}`.slice(0, 17)
  let sum = 0
  for (let i = 0; i < body.length; i++) {
    const n = Number(body[body.length - 1 - i])
    sum += i % 2 === 0 ? n * 3 : n
  }
  const check = (10 - (sum % 10)) % 10
  return `${body}${check}`
}

export function encodePackageBarcode(kind: 'Carton' | 'Pallet', packageNo: string, sscc: string): string {
  return kind === 'Pallet' ? `KPL-PAL-V1|${packageNo}|${sscc}` : `KPL-CTN-V1|${packageNo}|${sscc}`
}

function recomputeTotals(packages: PackageEntity[]): PackingListTotals {
  return {
    packageCount: packages.length,
    cartonCount: packages.filter((p) => p.kind === 'Carton').length,
    palletCount: packages.filter((p) => p.kind === 'Pallet').length,
    totalQty: packages.reduce((s, p) => s + p.lines.reduce((a, l) => a + l.quantity, 0), 0),
    netWeightKg: Math.round(packages.reduce((s, p) => s + p.netWeightKg, 0) * 1000) / 1000,
    grossWeightKg: Math.round(packages.reduce((s, p) => s + p.grossWeightKg, 0) * 1000) / 1000,
    volumeCbm: Math.round(packages.reduce((s, p) => s + p.volumeCbm, 0) * 10000) / 10000,
  }
}

export function validatePackingListAgainstOrder(list: PackingList): string[] {
  const errors: string[] = []
  const order = querySalesOrderById(list.salesOrderId)
  if (!order) {
    errors.push(`Sales order bulunamadı: ${list.salesOrderId}`)
    return errors
  }
  const packed: Record<string, Record<string, number>> = {}
  for (const pkg of list.packages) {
    for (const line of pkg.lines) {
      if (line.quantity <= 0) errors.push(`${pkg.packageNo}: miktar > 0 olmalı`)
      packed[line.color] ??= {}
      packed[line.color]![line.size] = (packed[line.color]![line.size] ?? 0) + line.quantity
    }
    if (pkg.netWeightKg < 0 || pkg.tareWeightKg < 0) {
      errors.push(`${pkg.packageNo}: ağırlık negatif olamaz`)
    }
    if (pkg.volumeCbm < 0) errors.push(`${pkg.packageNo}: hacim negatif olamaz`)
  }
  for (const [color, sizes] of Object.entries(packed)) {
    for (const [size, qty] of Object.entries(sizes)) {
      const ordered = order.matrix[color]?.[size] ?? 0
      if (qty > ordered) {
        errors.push(`${color}/${size}: paketlenmiş ${qty} > sipariş ${ordered}`)
      }
    }
  }
  return errors
}

function nextPlNo(): string {
  const page = repo().cursor(DEFAULT_TENANT_ID, {}, { limit: 5000 })
  let max = 0
  for (const row of page.items) {
    const m = row.packingListNo.match(/PL-2026-(\d+)/)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return `PL-2026-${String(max + 1).padStart(4, '0')}`
}

function nextSsccSerial(): number {
  const page = repo().cursor(DEFAULT_TENANT_ID, {}, { limit: 5000 })
  let count = 0
  for (const row of page.items) count += row.packages.length
  return count + 1
}

function toDomain(row: PersistedPackingList): PackingList {
  const {
    tenantId: _t,
    version: _v,
    schemaVersion: _s,
    deletedAt: _d,
    ...rest
  } = row
  return rest
}

function persist(
  list: PackingList,
  actorUserId: string,
  changeType: string,
  expectedVersion?: number,
): PackingList {
  const now = new Date().toISOString()
  const persisted: PersistedPackingList = {
    ...list,
    updatedAt: now,
    tenantId: DEFAULT_TENANT_ID,
    version: expectedVersion ?? 1,
    schemaVersion: 1,
    deletedAt: null,
  }
  const order = querySalesOrderById(list.salesOrderId)
  const saved = repo().save(DEFAULT_TENANT_ID, persisted, {
    expectedVersion: expectedVersion != null ? expectedVersion : undefined,
  })
  logAudit(
    'PackingList',
    saved.id,
    changeType === 'CreatePackingList' ? 'CREATE' : 'UPDATE',
    { ...auditContext(actorUserId), description: `${saved.packingListNo} — ${changeType}` },
    null,
    {
      packingListNo: saved.packingListNo,
      status: saved.status,
      packageCount: saved.totals.packageCount,
      totalQty: saved.totals.totalQty,
    },
  )
  appendEnterpriseTimelineEntry({
    id: `tl-pl-${saved.id}-${Date.now()}`,
    entityType: 'SALES_ORDER',
    entityId: saved.salesOrderId,
    entityCode: saved.salesOrderNo,
    occurredAt: now,
    actor: actorUserId,
    action: changeType,
    reason: `${saved.packingListNo} · ${saved.status}`,
  })
  scheduleSalesOrderChange({
    salesOrderId: saved.salesOrderId,
    orderNo: saved.salesOrderNo,
    status: saved.status,
    productCardId: order?.productCardId ?? 'n/a',
    changeType,
    occurredAt: now,
    actorUserId,
  })
  return toDomain(saved)
}

function requireList(id: string): PersistedPackingList {
  const row = repo().findById(DEFAULT_TENANT_ID, id)
  if (!row) throw new PackagingDomainError(`Packing list bulunamadı: ${id}`)
  return row
}

export function persistCreatePackingList(
  input: CreatePackingListInput,
  actorUserId: string,
): PackingList {
  if (!input.idempotencyKey?.trim()) throw new PackagingDomainError('idempotencyKey zorunlu.')
  const existing = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (existing) return toDomain(existing)

  const order = querySalesOrderById(input.salesOrderId)
  if (!order) throw new PackagingDomainError(`Sales order bulunamadı: ${input.salesOrderId}`)

  if (input.productionOrderNo) {
    const po = queryProductionOrderByNo(input.productionOrderNo)
    if (!po) throw new PackagingDomainError(`UE bulunamadı: ${input.productionOrderNo}`)
  }

  const now = new Date().toISOString()
  const list: PackingList = {
    id: `pl-${input.idempotencyKey}`,
    packingListNo: nextPlNo(),
    salesOrderId: order.id,
    salesOrderNo: order.orderNo,
    productionOrderNo: input.productionOrderNo ?? null,
    warehouseCode: input.warehouseCode ?? null,
    status: 'Draft',
    packages: [],
    totals: emptyTotals(),
    shipmentReferenceNo: null,
    shipmentMovementId: null,
    validationErrors: [],
    idempotencyKey: input.idempotencyKey,
    createdAt: now,
    createdBy: actorUserId,
    updatedAt: now,
  }
  return persist(list, actorUserId, 'CreatePackingList')
}

function buildPackage(
  input: {
    kind: PackageEntity['kind']
    lines: PackageLine[]
    netWeightKg: number
    tareWeightKg: number
    dimensions: PackageDimensionsCm
    seq: number
  },
): PackageEntity {
  const sscc = prepareSscc(input.seq)
  const packageNo = `${input.kind === 'Pallet' ? 'PAL' : 'CTN'}-${String(input.seq).padStart(5, '0')}`
  const grossWeightKg = calculateGrossWeight(input.netWeightKg, input.tareWeightKg)
  const volumeCbm = calculateVolumeCbm(input.dimensions)
  return {
    id: `pkg-${sscc}`,
    packageNo,
    kind: input.kind,
    sscc,
    barcode: encodePackageBarcode(input.kind, packageNo, sscc),
    lines: input.lines,
    netWeightKg: input.netWeightKg,
    tareWeightKg: input.tareWeightKg,
    grossWeightKg,
    dimensions: input.dimensions,
    volumeCbm,
    status: 'Closed',
    createdAt: new Date().toISOString(),
  }
}

const DEFAULT_DIM: PackageDimensionsCm = { lengthCm: 60, widthCm: 40, heightCm: 40 }

export function persistAddPackage(input: AddPackageInput, actorUserId: string): PackingList {
  if (!input.idempotencyKey?.trim()) throw new PackagingDomainError('idempotencyKey zorunlu.')
  const row = requireList(input.packingListId)
  if (row.status === 'Shipped' || row.status === 'Cancelled') {
    throw new PackagingDomainError(`Paket eklenemez — durum: ${row.status}`)
  }
  const dup = row.packages.find((p) => p.id === `pkg-idem-${input.idempotencyKey}`)
  if (dup) return toDomain(row)

  if (!input.lines.length || input.lines.every((l) => l.quantity <= 0)) {
    throw new PackagingDomainError('Paket satırı gerekli.')
  }

  const seq = nextSsccSerial()
  const dimensions = { ...DEFAULT_DIM, ...input.dimensions }
  const tare = input.tareWeightKg ?? (input.kind === 'Pallet' ? 15 : 0.8)
  const pkg = buildPackage({
    kind: input.kind,
    lines: input.lines.map((l, i) => ({
      id: `pln-${i}`,
      color: l.color,
      size: l.size,
      quantity: l.quantity,
      stockCardId: l.stockCardId,
    })),
    netWeightKg: input.netWeightKg,
    tareWeightKg: tare,
    dimensions,
    seq,
  })
  pkg.id = `pkg-idem-${input.idempotencyKey}`

  const packages = [...row.packages, pkg]
  const draft: PackingList = {
    ...toDomain(row),
    packages,
    totals: recomputeTotals(packages),
    validationErrors: [],
    status: row.status === 'Confirmed' ? 'Draft' : row.status,
  }
  draft.validationErrors = validatePackingListAgainstOrder(draft)
  return persist(draft, actorUserId, 'AddPackage', row.version)
}

export function persistValidatePackingList(packingListId: string, actorUserId: string): PackingList {
  const row = requireList(packingListId)
  const list = toDomain(row)
  const errors = validatePackingListAgainstOrder(list)
  const next: PackingList = {
    ...list,
    validationErrors: errors,
    status: errors.length === 0 ? 'Validated' : 'Draft',
  }
  return persist(next, actorUserId, 'ValidatePackingList', row.version)
}

export function persistConfirmPackingList(packingListId: string, actorUserId: string): PackingList {
  const row = requireList(packingListId)
  const list = toDomain(row)
  const errors = validatePackingListAgainstOrder(list)
  if (errors.length > 0) {
    throw new PackagingDomainError(`Onay engellendi: ${errors[0]}`)
  }
  if (list.packages.length === 0) throw new PackagingDomainError('En az bir paket gerekli.')
  return persist(
    { ...list, validationErrors: [], status: 'Confirmed' },
    actorUserId,
    'ConfirmPackingList',
    row.version,
  )
}

/** Auto-generate cartons from FG / SO matrix (unitsPerCarton). */
export function persistAutoGenerateFromFinishedGoods(
  input: AutoGenerateFromFgInput,
  actorUserId: string,
): PackingList {
  if (!input.idempotencyKey?.trim()) throw new PackagingDomainError('idempotencyKey zorunlu.')
  const existing = repo().findByIdempotencyKey(DEFAULT_TENANT_ID, input.idempotencyKey)
  if (existing) return toDomain(existing)

  const order = querySalesOrderById(input.salesOrderId)
  if (!order) throw new PackagingDomainError(`Sales order bulunamadı: ${input.salesOrderId}`)
  const po = queryProductionOrderByNo(input.productionOrderNo)
  if (!po) throw new PackagingDomainError(`UE bulunamadı: ${input.productionOrderNo}`)
  if (input.unitsPerCarton <= 0) throw new PackagingDomainError('unitsPerCarton > 0 olmalı.')

  const fgMoves = queryStockMovementsByType('PRODUCTION_OUTPUT').filter(
    (m) => m.referenceNo === input.productionOrderNo || m.referenceId === po.id,
  )
  const fgQty = fgMoves.reduce((s, m) => s + m.quantity, 0)
  const orderQty = order.matrixTotals.grandTotal
  const packable = fgQty > 0 ? Math.min(fgQty, orderQty) : orderQty
  if (packable <= 0) throw new PackagingDomainError('Paketlenecek miktar yok.')

  let list = persistCreatePackingList(
    {
      salesOrderId: order.id,
      productionOrderNo: input.productionOrderNo,
      warehouseCode: input.warehouseCode,
      idempotencyKey: `${input.idempotencyKey}-header`,
    },
    actorUserId,
  )

  const flat: { color: string; size: string; quantity: number }[] = []
  for (const [color, sizes] of Object.entries(order.matrix)) {
    for (const [size, qty] of Object.entries(sizes)) {
      if (qty > 0) flat.push({ color, size, quantity: qty })
    }
  }

  let remainingBudget = packable
  let cartonIdx = 0
  for (const cell of flat) {
    let left = cell.quantity
    while (left > 0 && remainingBudget > 0) {
      const take = Math.min(left, input.unitsPerCarton, remainingBudget)
      cartonIdx += 1
      list = persistAddPackage(
        {
          packingListId: list.id,
          kind: 'Carton',
          lines: [{ color: cell.color, size: cell.size, quantity: take }],
          netWeightKg: Math.round(take * input.netWeightPerUnitKg * 1000) / 1000,
          tareWeightKg: input.tareWeightKg,
          dimensions: input.dimensions,
          idempotencyKey: `${input.idempotencyKey}-ctn-${cartonIdx}`,
        },
        actorUserId,
      )
      left -= take
      remainingBudget -= take
    }
  }

  // Stamp master idempotency on final aggregate via re-save key lookup helper
  const row = requireList(list.id)
  const stamped: PackingList = { ...toDomain(row), idempotencyKey: input.idempotencyKey }
  return persist(stamped, actorUserId, 'AutoGenerateFromFg', row.version)
}

/** Bind confirmed PL to shipment — posts SHIPMENT ledger movement (existing path). */
export function persistBindShipment(input: BindShipmentInput, actorUserId: string): PackingList {
  const row = requireList(input.packingListId)
  const list = toDomain(row)
  if (list.status !== 'Confirmed' && list.status !== 'Validated') {
    throw new PackagingDomainError('Sevkiyat bağlama için Validated/Confirmed gerekli.')
  }
  if (list.shipmentReferenceNo) {
    return list // idempotent
  }
  const ref = input.idempotencyKey
  const stockCardId = input.stockCardId ?? `fg-${list.productionOrderNo ?? list.salesOrderNo}`
  const result = persistShipment(
    {
      stockCardId,
      warehouseCode: input.warehouseCode,
      quantity: list.totals.totalQty,
      referenceId: list.id,
      referenceNo: ref,
      reason: `Packing list shipment — ${list.packingListNo}`,
    },
    actorUserId,
  )
  const next: PackingList = {
    ...list,
    status: 'Shipped',
    warehouseCode: input.warehouseCode,
    shipmentReferenceNo: ref,
    shipmentMovementId: result.movement.id,
    packages: list.packages.map((p) => ({ ...p, status: 'Shipped' as const })),
  }
  return persist(next, actorUserId, 'BindShipment', row.version)
}
