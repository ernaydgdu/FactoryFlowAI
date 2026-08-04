/**
 * Sales Order build — Approved Product Card + BOM + MRP orchestration.
 */
import { queryProductCardById } from '@/domain/product-card/product-card-crud.service'
import { toLegacyProductColors } from '@/domain/services/textile/color-management-service'
import { toLegacyBomLines } from '@/domain/services/textile/bom-service'
import {
  calculateConsumptions,
  computeMatrixTotals,
  generateMrp,
} from '@/domain/services/calculations'
import { getDefaultWorkshopCode, getWorkshopByCode } from '@/domain/master-data'
import type {
  ColorSizeMatrix,
  SalesOrder,
  SalesOrderGeneral,
  SalesOrderLifecycleStatus,
  SalesOrderRevision,
} from '@/domain/types'
import { getSizeSetSizes } from '@/domain/data/size-sets'

export class SalesOrderBuildError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SalesOrderBuildError'
  }
}

export type SalesOrderUpsertInput = {
  productCardId: string
  general: Partial<SalesOrderGeneral>
  matrix: ColorSizeMatrix
  unitPrice: number
  lineDeliveryDate?: string
}

function formatExf(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function resolveLifecycleFromProduction(
  productionStatus: SalesOrder['productionStatus'],
  index = 0,
): SalesOrderLifecycleStatus {
  if (productionStatus === 'Sevk Edildi' || productionStatus === 'Tamamlandı') return 'Closed'
  if (productionStatus === 'Üretimde') return 'Active'
  return index % 4 === 0 ? 'Draft' : 'Approved'
}

function buildRevision(
  status: SalesOrderLifecycleStatus,
  actorUserId: string,
  note: string,
  revisionNo = 1,
): SalesOrderRevision {
  return {
    revisionNo,
    status,
    changedAt: new Date().toISOString(),
    changedById: actorUserId,
    changeNote: note,
  }
}

export function assertApprovedProductCard(productCardId: string) {
  const pc = queryProductCardById(productCardId)
  if (!pc) throw new SalesOrderBuildError('Ürün kartı bulunamadı.')
  if (pc.status !== 'Approved') {
    throw new SalesOrderBuildError('Yalnızca onaylı (Approved) ürün kartı seçilebilir.')
  }
  return pc
}

export function buildSalesOrderFromInput(
  id: string,
  orderNo: string,
  input: SalesOrderUpsertInput,
  actorUserId: string,
): SalesOrder {
  const pc = assertApprovedProductCard(input.productCardId)
  const colors = toLegacyProductColors(pc.colorAssignments)
  const sizes = getSizeSetSizes(pc.refs.sizeSetId)
  const matrix = input.matrix
  const matrixTotals = computeMatrixTotals(colors, sizes, matrix)
  if (matrixTotals.grandTotal <= 0) {
    throw new SalesOrderBuildError('Renk x beden matrisinde en az bir adet girilmelidir.')
  }

  const bom = toLegacyBomLines(pc.bom)
  const orderQty = matrixTotals.grandTotal
  const mrpData = generateMrp(id, orderNo, orderQty, bom)
  const defaultWorkshop = getWorkshopByCode(getDefaultWorkshopCode())!
  const exf = input.general.exf ?? input.lineDeliveryDate ?? new Date().toISOString().slice(0, 10)

  const general: SalesOrderGeneral = {
    customer: input.general.customer ?? pc.resolved.customer,
    brand: input.general.brand ?? pc.resolved.brand,
    buyer: input.general.buyer ?? pc.resolved.buyer,
    merchandiser: input.general.merchandiser ?? pc.resolved.merchandiser,
    season: input.general.season ?? pc.resolved.season,
    collection: input.general.collection ?? pc.resolved.collection,
    poNo: input.general.poNo ?? '',
    poDate: input.general.poDate ?? new Date().toISOString().slice(0, 10),
    orderDate: input.general.orderDate ?? new Date().toISOString().slice(0, 10),
    exf,
    deliveryTerm: input.general.deliveryTerm ?? 'FOB',
    paymentTerm: input.general.paymentTerm ?? 'NET 60',
    factory: input.general.factory ?? defaultWorkshop.location,
    currency: input.general.currency ?? 'USD',
    notes: input.general.notes ?? '',
  }

  const revision = buildRevision('Draft', actorUserId, 'Sipariş oluşturuldu')

  return {
    id,
    orderNo,
    general,
    productCardId: pc.id,
    sizeSetId: pc.refs.sizeSetId,
    matrix,
    matrixTotals,
    unitPrice: input.unitPrice,
    lineDeliveryDate: input.lineDeliveryDate ?? exf,
    mrp: {
      orderId: id,
      orderNo,
      orderQty,
      lines: mrpData.lines,
      generatedAt: mrpData.generatedAt,
    },
    production: {
      workOrderNo: `UE-${orderNo.replace('SIP-', '')}`,
      plannedQty: orderQty,
      producedQty: 0,
      wasteQty: 0,
      reworkQty: 0,
      secondQualityQty: 0,
      progress: 0,
      bomReserved: false,
      status: 'Planlandı',
    },
    consumptions: calculateConsumptions(bom, 0, defaultWorkshop.name),
    productionStatus: 'Beklemede',
    fabricStatus: 'Bekliyor',
    accessoryStatus: 'Bekliyor',
    planner: general.merchandiser,
    terminRisk: false,
    exfDate: formatExf(exf),
    progress: 0,
    status: 'Draft',
    currentRevision: revision,
    revisionHistory: [revision],
  }
}

export function enrichSeedOrder(
  order: Omit<SalesOrder, 'status' | 'currentRevision' | 'revisionHistory' | 'unitPrice' | 'lineDeliveryDate'> &
    Partial<Pick<SalesOrder, 'unitPrice'>>,
  index: number,
): SalesOrder {
  const status = resolveLifecycleFromProduction(order.productionStatus, index)
  const revision = buildRevision(status, 'emp-planner-001', 'Seed sipariş')
  return {
    ...order,
    general: {
      ...order.general,
      season: order.general.season ?? 'SS26',
      collection: order.general.collection ?? 'Core',
    },
    unitPrice: order.unitPrice ?? 12.5 + (index % 5),
    lineDeliveryDate: order.general.exf,
    status,
    currentRevision: revision,
    revisionHistory: [revision],
  }
}

export function normalizeSalesOrder(order: SalesOrder): SalesOrder {
  const status = order.status ?? 'Draft'
  const revisionHistory =
    order.revisionHistory?.length > 0
      ? order.revisionHistory
      : [buildRevision(status, 'system', 'Legacy sipariş', order.currentRevision?.revisionNo ?? 1)]
  const currentRevision = order.currentRevision ?? revisionHistory[revisionHistory.length - 1]!
  return {
    ...order,
    status,
    currentRevision,
    revisionHistory,
    unitPrice: order.unitPrice ?? 0,
    general: {
      ...order.general,
      season: order.general.season ?? '',
      collection: order.general.collection ?? '',
    },
  }
}

export function refreshSalesOrderMrp(order: SalesOrder): SalesOrder {
  const pc = queryProductCardById(order.productCardId)
  if (!pc) return order
  const bom = toLegacyBomLines(pc.bom)
  const orderQty = order.matrixTotals.grandTotal
  const mrpData = generateMrp(order.id, order.orderNo, orderQty, bom)
  return {
    ...order,
    mrp: {
      orderId: order.id,
      orderNo: order.orderNo,
      orderQty,
      lines: mrpData.lines,
      generatedAt: mrpData.generatedAt,
    },
  }
}
