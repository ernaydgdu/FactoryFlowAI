/**
 * Purchase Chain — MRP → PR → PO → Partial Receipt → ... zinciri.
 */
import type { SalesOrder } from '../../types'
import type { PurchaseChainLink, PurchaseChainTrace } from '../../types/textile-erp'
import type { StockLedger } from '../../types/stock-ledger'
import { generatePurchaseRequisitions } from '../purchasing-flow'
import { getBalance } from '../stock-ledger'

export function tracePurchaseChain(
  order: SalesOrder,
  stockCardId: string,
  ledger?: StockLedger,
): PurchaseChainTrace {
  const mrpLine = order.mrp.lines.find((l) => l.stockCardId === stockCardId)
  const links: PurchaseChainLink[] = []
  const now = new Date().toISOString()

  if (mrpLine) {
    links.push({
      stage: 'MRP',
      entityId: mrpLine.id,
      entityNo: order.orderNo,
      quantity: mrpLine.netRequired,
      unit: mrpLine.unit,
      status: mrpLine.status,
      occurredAt: order.mrp.generatedAt,
    })

    const prs = generatePurchaseRequisitions(order.mrp)
    const pr = prs.find((p) => p.mrpLineId === mrpLine.id)
    if (pr) {
      links.push({
        stage: 'PURCHASE_REQUEST',
        entityId: pr.id,
        entityNo: pr.prNo,
        quantity: pr.quantity,
        unit: pr.unit,
        status: pr.status,
        occurredAt: pr.createdAt,
      })
    }
  }

  const orderedQty = mrpLine?.netRequired ?? 0
  let receivedQty = 0
  let reservedQty = 0
  let consumedQty = 0

  if (ledger) {
    const wh = mrpLine?.warehouse ?? ''
    for (const mov of ledger.movements.filter((m) => m.stockCardId === stockCardId)) {
      if (mov.type === 'RECEIPT') {
        receivedQty += mov.quantity
        links.push({
          stage: links.some((l) => l.stage === 'PARTIAL_RECEIPT') ? 'PARTIAL_RECEIPT' : 'WAREHOUSE_RECEIPT',
          entityId: mov.id,
          entityNo: mov.referenceNo,
          quantity: mov.quantity,
          unit: mov.unit,
          status: 'Teslim',
          occurredAt: mov.createdAt,
        })
      }
      if (mov.type === 'RESERVATION') reservedQty += mov.quantity
      if (mov.type === 'CONSUMPTION') consumedQty += mov.quantity
    }
    const balance = getBalance(ledger, stockCardId, wh)
    if (balance && reservedQty > 0) {
      links.push({
        stage: 'RESERVATION',
        entityId: order.id,
        entityNo: order.orderNo,
        quantity: reservedQty,
        unit: mrpLine?.unit ?? '',
        status: 'Rezerve',
        occurredAt: now,
      })
    }
    if (consumedQty > 0) {
      links.push({
        stage: 'CONSUMPTION',
        entityId: order.production.workOrderNo,
        entityNo: order.production.workOrderNo,
        quantity: consumedQty,
        unit: mrpLine?.unit ?? '',
        status: 'Tüketildi',
        occurredAt: now,
      })
    }
  }

  const remainingQty = receivedQty - consumedQty
  if (remainingQty > 0) {
    links.push({
      stage: 'REMAINING_STOCK',
      entityId: order.id,
      entityNo: order.orderNo,
      quantity: remainingQty,
      unit: mrpLine?.unit ?? '',
      status: 'Kalan',
      occurredAt: now,
    })
  }

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    stockCardId,
    links,
    orderedQty,
    receivedQty,
    reservedQty,
    consumedQty,
    remainingQty,
    complete: receivedQty >= orderedQty && consumedQty <= receivedQty,
  }
}

export function traceAllMaterialChains(order: SalesOrder, ledger?: StockLedger): PurchaseChainTrace[] {
  return order.mrp.lines.map((l) => tracePurchaseChain(order, l.stockCardId, ledger))
}
