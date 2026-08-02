import type { ColorSizeMatrix, SalesOrder } from '../types'
import {
  currencyRepository,
  employeeRepository,
  getDefaultWorkshopCode,
  getWorkshopByCode,
  incotermRepository,
  paymentTermRepository,
  workshopRepository,
} from '../master-data'
import {
  calculateConsumptions,
  computeMatrixTotals,
  generateMrp,
} from '../services/calculations'
import { applySplitToOrder } from '../services/production-split-service'
import { getSizeSetSizes } from './size-sets'
import { getProductById } from './products'
import { lazyArray } from './lazy-cache'

const REFERENCE = new Date('2026-08-02')

function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

function formatExf(d: Date): string {
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function buildMatrix(
  productId: string,
  sizeSetId: string,
  seed: number,
): ColorSizeMatrix {
  const product = getProductById(productId)
  if (!product) return {}
  const sizes = getSizeSetSizes(sizeSetId)
  const matrix: ColorSizeMatrix = {}
  for (const color of product.colors.filter((c) => c.active)) {
    matrix[color.id] = {}
    for (const size of sizes) {
      matrix[color.id][size] = 80 + ((seed + size.length) % 12) * 35
    }
  }
  return matrix
}

function createOrder(index: number): SalesOrder {
  const id = String(index + 1)
  const productId = String((index % 24) + 1)
  const product = getProductById(productId)!
  const sizeSetId = product.sizeSetId
  const sizes = getSizeSetSizes(sizeSetId)
  const matrix = buildMatrix(productId, sizeSetId, index)
  const matrixTotals = computeMatrixTotals(product.colors, sizes, matrix)
  const orderQty = matrixTotals.grandTotal

  const exfDateObj = addDays(REFERENCE, -10 + (index % 35))
  const daysUntil = Math.ceil(
    (exfDateObj.getTime() - REFERENCE.getTime()) / 86400000,
  )
  const productionStatus = index % 10 < 2 ? 'Beklemede' : index % 10 < 6 ? 'Üretimde' : index % 10 < 8 ? 'Tamamlandı' : 'Sevk Edildi'
  const plannedQty = orderQty
  const producedQty =
    productionStatus === 'Beklemede'
      ? 0
      : productionStatus === 'Sevk Edildi' || productionStatus === 'Tamamlandı'
        ? plannedQty
        : Math.floor(plannedQty * (0.15 + (index % 7) * 0.11))
  const wasteQty = producedQty > 0 ? Math.floor(producedQty * 0.06) : 0

  const mrpData = generateMrp(id, `SIP-2026-${String(100 + index).padStart(4, '0')}`, orderQty, product.bom)

  const defaultWorkshop = getWorkshopByCode(getDefaultWorkshopCode())!
  const incoterm = incotermRepository.getByCode('FOB')!
  const paymentTerm = paymentTermRepository.getByCode('NET60')!
  const currency = currencyRepository.getByCode('USD')!
  const planner = employeeRepository.find((e) => e.role === 'Planlayıcı')[0]!
  const workshopForOrder = pick(workshopRepository.getActive(), index)

  return {
    id,
    orderNo: `SIP-2026-${String(100 + index).padStart(4, '0')}`,
    general: {
      customer: product.customer,
      brand: product.brand,
      buyer: product.buyer,
      merchandiser: product.merchandiser,
      poNo: `PO-${88000 + index}`,
      poDate: '2026-02-15',
      orderDate: '2026-02-18',
      exf: exfDateObj.toISOString().slice(0, 10),
      deliveryTerm: incoterm.name,
      paymentTerm: paymentTerm.name,
      factory: workshopForOrder.location,
      currency: currency.code,
      notes: '',
    },
    productCardId: productId,
    sizeSetId,
    matrix,
    matrixTotals,
    mrp: {
      orderId: id,
      orderNo: `SIP-2026-${String(100 + index).padStart(4, '0')}`,
      orderQty,
      lines: mrpData.lines,
      generatedAt: mrpData.generatedAt,
    },
    production: {
      workOrderNo: `UE-2026-${String(100 + index).padStart(4, '0')}`,
      plannedQty,
      producedQty,
      wasteQty,
      reworkQty: wasteQty > 0 ? Math.floor(wasteQty * 0.3) : 0,
      secondQualityQty: index % 5 === 0 ? Math.floor(wasteQty * 0.2) : 0,
      progress: plannedQty > 0 ? Math.round((producedQty / plannedQty) * 100) : 0,
      bomReserved: productionStatus !== 'Beklemede',
      status:
        productionStatus === 'Beklemede'
          ? 'Planlandı'
          : productionStatus === 'Üretimde'
            ? 'Devam Ediyor'
            : 'Tamamlandı',
    },
    consumptions: calculateConsumptions(
      product.bom,
      producedQty,
      defaultWorkshop.name,
    ),
    productionStatus,
    fabricStatus:
      productionStatus === 'Beklemede'
        ? 'Bekliyor'
        : index % 3 === 0
          ? 'Kısmi'
          : 'Hazır',
    accessoryStatus:
      productionStatus === 'Beklemede' ? 'Bekliyor' : index % 4 === 0 ? 'Kısmi' : 'Hazır',
    planner: planner.name,
    terminRisk:
      productionStatus !== 'Tamamlandı' &&
      productionStatus !== 'Sevk Edildi' &&
      daysUntil <= 7 &&
      daysUntil >= 0,
    exfDate: formatExf(exfDateObj),
    progress: plannedQty > 0 ? Math.round((producedQty / plannedQty) * 100) : 0,
  }
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length]
}

function buildSalesOrders(): SalesOrder[] {
  const orders = Array.from({ length: 45 }, (_, i) => createOrder(i))
  orders[0] = applySplitToOrder(orders[0])
  return orders
}

export const SALES_ORDERS = lazyArray(buildSalesOrders)

export function getSalesOrderById(id: string): SalesOrder | undefined {
  return SALES_ORDERS.find((o) => o.id === id)
}

/** Liste görünümü için hafif map */
export function toListOrder(order: SalesOrder) {
  const product = getProductById(order.productCardId)!
  const p = order.progress
  const ps = order.productionStatus

  function stage(
    threshold: number,
    done: boolean,
  ): 'Tamamlandı' | 'Devam Ediyor' | 'Bekliyor' | '—' {
    if (done) return 'Tamamlandı'
    if (ps === 'Beklemede') return 'Bekliyor'
    if (p >= threshold) return 'Devam Ediyor'
    return 'Bekliyor'
  }

  return {
    id: order.id,
    orderNo: order.orderNo,
    customer: order.general.customer,
    brand: order.general.brand,
    model: product.productName,
    season: product.season,
    color: product.colors[0]?.name ?? '—',
    sizeSet: order.sizeSetId,
    totalQuantity: order.matrixTotals.grandTotal,
    exfDate: order.exfDate,
    exfTimestamp: new Date(order.general.exf).getTime(),
    productionStatus: order.productionStatus,
    fabricStatus: order.fabricStatus,
    accessoryStatus: order.accessoryStatus,
    cuttingStatus: stage(10, p >= 25),
    sewingStatus: stage(30, p >= 55),
    packingStatus: stage(60, p >= 85),
    shippingStatus:
      ps === 'Sevk Edildi'
        ? ('Tamamlandı' as const)
        : p >= 90
          ? ('Devam Ediyor' as const)
          : ('Bekliyor' as const),
    progress: order.progress,
    planner: order.planner,
    terminRisk: order.terminRisk,
  }
}

export const LIST_ORDERS = lazyArray(() => SALES_ORDERS.map(toListOrder))
