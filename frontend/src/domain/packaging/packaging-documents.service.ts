/**
 * Packing List documents — GS1-128 label + printable PDF payload (no binary PDF lib).
 */
import { encodeGs1128Skeleton, encodeQrPayload } from '@/domain/barcode-mobile/barcode-codec.service'

import { queryPackingListById } from './packing-list-query.service'
import type { PackingListDocument } from './packaging.types'

export type PackageLabelDocument = {
  labelType: 'PACKAGE'
  packageNo: string
  kind: 'Carton' | 'Pallet'
  sscc: string
  barcode: string
  gs1128: string
  packingListNo: string
  salesOrderNo: string
  qty: number
  netWeightKg: number
  grossWeightKg: number
  parentPackageNo: string | null
  containerCode: string | null
  qrPayload: string
}

export function buildPackageGs1128Label(
  packingListId: string,
  packageId: string,
): PackageLabelDocument | null {
  const list = queryPackingListById(packingListId)
  if (!list) return null
  const pkg = list.packages.find((p) => p.id === packageId)
  if (!pkg) return null
  const qty = pkg.lines.reduce((s, l) => s + l.quantity, 0)
  const parent = pkg.parentPackageId
    ? list.packages.find((p) => p.id === pkg.parentPackageId)?.packageNo ?? null
    : null
  const gs1128 = pkg.gs1128 || encodeGs1128Skeleton({ sscc: pkg.sscc, qty })
  return {
    labelType: 'PACKAGE',
    packageNo: pkg.packageNo,
    kind: pkg.kind,
    sscc: pkg.sscc,
    barcode: pkg.barcode,
    gs1128,
    packingListNo: list.packingListNo,
    salesOrderNo: list.salesOrderNo,
    qty,
    netWeightKg: pkg.netWeightKg,
    grossWeightKg: pkg.grossWeightKg,
    parentPackageNo: parent,
    containerCode: pkg.containerCode ?? list.containerCode,
    qrPayload: encodeQrPayload({
      kind: 'PACKAGE',
      packageNo: pkg.packageNo,
      sscc: pkg.sscc,
      packingListNo: list.packingListNo,
    }),
  }
}

/** Deterministic packing list document for print / PDF renderers. */
export function buildPackingListDocument(packingListId: string): PackingListDocument | null {
  const list = queryPackingListById(packingListId)
  if (!list) return null
  const lines: PackingListDocument['lines'] = []
  for (const pkg of list.packages) {
    const parentNo = pkg.parentPackageId
      ? list.packages.find((p) => p.id === pkg.parentPackageId)?.packageNo ?? null
      : null
    for (const line of pkg.lines) {
      lines.push({
        packageNo: pkg.packageNo,
        kind: pkg.kind,
        sscc: pkg.sscc,
        gs1128: pkg.gs1128,
        parentPackageNo: parentNo,
        containerCode: pkg.containerCode ?? list.containerCode,
        color: line.color,
        size: line.size,
        quantity: line.quantity,
        netWeightKg: pkg.netWeightKg,
        grossWeightKg: pkg.grossWeightKg,
        volumeCbm: pkg.volumeCbm,
      })
    }
  }
  return {
    documentType: 'PACKING_LIST',
    packingListNo: list.packingListNo,
    revision: list.revision,
    salesOrderNo: list.salesOrderNo,
    productionOrderNo: list.productionOrderNo,
    warehouseCode: list.warehouseCode,
    containerCode: list.containerCode,
    status: list.status,
    approvalStatus: list.approvalStatus,
    issuedAt: new Date().toISOString(),
    totals: list.totals,
    lines,
  }
}
