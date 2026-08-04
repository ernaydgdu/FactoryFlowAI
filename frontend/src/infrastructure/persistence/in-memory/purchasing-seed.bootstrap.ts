/**
 * Purchasing seed — PR → RFQ → Quotation → PO → GR chain from MRP/sales orders.
 */
import { DEFAULT_TENANT_ID } from '@/domain/ports/persistence/persistence-registry'
import { supplierRepository } from '@/domain/master-data'
import { queryAllSalesOrders } from '@/domain/sales-order/sales-order-query.service'
import { queryStockCardById } from '@/domain/stock-card/stock-card-query.service'
import type {
  PersistedGoodsReceipt,
  PersistedPurchaseOrderAggregate,
  PersistedPurchaseRequest,
  PersistedRequestForQuotation,
  PersistedSupplierQuotation,
} from '@/domain/ports/persistence/persistence-aggregates'
import type { PurchaseOrderRevision } from '@/domain/purchasing/purchasing.types'

import { inMemoryStoreRegistry } from './store-registry'

let seeded = false

export function ensurePurchasingSeeded(): void {
  if (seeded || inMemoryStoreRegistry.purchaseRequests.length > 0) {
    seeded = true
    return
  }

  const orders = queryAllSalesOrders()
  const now = new Date().toISOString()
  const prs: PersistedPurchaseRequest[] = []
  const rfqs: PersistedRequestForQuotation[] = []
  const quotations: PersistedSupplierQuotation[] = []
  const pos: PersistedPurchaseOrderAggregate[] = []
  const grs: PersistedGoodsReceipt[] = []

  let prIdx = 0
  let rfqIdx = 0
  let qIdx = 0
  let poIdx = 0
  let grIdx = 0

  for (const order of orders) {
    if (order.status === 'Cancelled' || order.status === 'Archived') continue
    for (const [i, line] of order.mrp.lines.entries()) {
      if (
        line.status !== 'Sipariş Verildi' &&
        line.status !== 'Rezerve' &&
        line.status !== 'Hesaplandı'
      ) {
        continue
      }
      if (i % 3 !== 0) continue
      const card = queryStockCardById(line.stockCardId)
      if (!card) continue
      const qty = Math.round(line.netRequired * 0.6 * 100) / 100
      if (qty <= 0) continue

      prIdx += 1
      const prId = String(prIdx)
      const prNo = `SAT-2026-${String(prIdx).padStart(4, '0')}`
      prs.push({
        id: prId,
        prNo,
        mrpRunId: undefined,
        mrpProposalId: line.id,
        sourceOrderId: order.id,
        sourceOrderNo: order.orderNo,
        stockCardId: line.stockCardId,
        materialCode: line.code,
        materialName: line.materialName,
        category: line.category,
        quantity: qty,
        unit: line.unit,
        requiredDate: order.general.exf,
        suggestedSupplier: line.supplier,
        status: prIdx % 2 === 0 ? 'PO Created' : 'Submitted',
        createdAt: now,
        createdBy: 'seed',
        tenantId: DEFAULT_TENANT_ID,
        version: 1,
        schemaVersion: 1,
        updatedAt: now,
        deletedAt: null,
      })

      if (prIdx % 2 !== 0) continue

      rfqIdx += 1
      const rfqId = String(rfqIdx)
      const rfqNo = `RFQ-2026-${String(rfqIdx).padStart(4, '0')}`
      const supplierCode = supplierRepository.getActive()[0]?.code ?? 'SUP-001'
      rfqs.push({
        id: rfqId,
        rfqNo,
        purchaseRequestIds: [prId],
        supplierCodes: [supplierCode],
        dueDate: order.general.exf,
        status: 'Awarded',
        notes: 'Seed RFQ',
        createdAt: now,
        createdBy: 'seed',
        tenantId: DEFAULT_TENANT_ID,
        version: 1,
        schemaVersion: 1,
        updatedAt: now,
        deletedAt: null,
      })

      qIdx += 1
      const unitPrice = 5 + (qIdx % 3)
      quotations.push({
        id: `q-${rfqId}`,
        quotationNo: `TEK-2026-${String(qIdx).padStart(4, '0')}`,
        rfqId,
        rfqNo,
        supplierCode,
        supplierName: line.supplier,
        quotedDate: now.slice(0, 10),
        currency: 'USD',
        lines: [
          {
            id: `ql-${prId}`,
            materialCode: line.code,
            materialName: line.materialName,
            quantity: qty,
            unit: line.unit,
            unitPrice,
            leadTimeDays: card.leadTimeDays ?? 14,
          },
        ],
        totalAmount: Math.round(qty * unitPrice * 100) / 100,
        status: 'Selected',
        createdAt: now,
        tenantId: DEFAULT_TENANT_ID,
        version: 1,
        schemaVersion: 1,
        updatedAt: now,
        deletedAt: null,
      })

      poIdx += 1
      const poId = String(poIdx)
      const poNo = `PO-2026-${String(poIdx).padStart(4, '0')}`
      const revision: PurchaseOrderRevision = {
        revisionNo: 1,
        status: poIdx % 3 === 0 ? 'Partially Received' : 'Open',
        changedAt: now,
        changedById: 'seed',
        changeNote: 'Seed PO',
      }
      const deliveredQty = poIdx % 3 === 0 ? Math.round(qty * 0.4 * 100) / 100 : 0
      pos.push({
        id: poId,
        poNo,
        purchaseRequestId: prId,
        rfqId,
        quotationId: `q-${rfqId}`,
        sourceOrderId: order.id,
        sourceOrderNo: order.orderNo,
        supplier: line.supplier,
        supplierCode,
        termin: order.general.exf,
        deliveryWarehouse: 'HMD-01',
        currency: order.general.currency,
        lines: [
          {
            id: `pol-${prId}`,
            materialCode: line.code,
            materialName: line.materialName,
            quantity: qty,
            unit: line.unit,
            unitPrice,
            vatRate: 20,
            deliveredQty,
            remainingQty: Math.max(0, qty - deliveredQty),
          },
        ],
        totalAmount: Math.round(qty * unitPrice * 100) / 100,
        status: revision.status,
        currentRevision: revision,
        revisionHistory: [revision],
        approvedBy: 'seed',
        approvedAt: now,
        createdAt: now,
        createdBy: 'seed',
        tenantId: DEFAULT_TENANT_ID,
        version: 1,
        schemaVersion: 1,
        updatedAt: now,
        deletedAt: null,
      })

      if (deliveredQty > 0) {
        grIdx += 1
        grs.push({
          id: String(grIdx),
          grNo: `GR-2026-${String(grIdx).padStart(4, '0')}`,
          purchaseOrderId: poId,
          poNo,
          warehouseCode: 'HMD-01',
          receivedAt: now.slice(0, 10),
          lines: [
            {
              id: 'grl-0',
              materialCode: line.code,
              materialName: line.materialName,
              quantity: deliveredQty,
              unit: line.unit,
            },
          ],
          status: 'Posted',
          createdAt: now,
          createdBy: 'seed',
          tenantId: DEFAULT_TENANT_ID,
          version: 1,
          schemaVersion: 1,
          updatedAt: now,
          deletedAt: null,
        })
      }
    }
  }

  inMemoryStoreRegistry.purchaseRequests = prs
  inMemoryStoreRegistry.rfqs = rfqs
  inMemoryStoreRegistry.supplierQuotations = quotations
  inMemoryStoreRegistry.purchaseOrders = pos
  inMemoryStoreRegistry.goodsReceipts = grs
  seeded = true
}

export function resetPurchasingSeedForTests(): void {
  seeded = false
  inMemoryStoreRegistry.purchaseRequests = []
  inMemoryStoreRegistry.rfqs = []
  inMemoryStoreRegistry.supplierQuotations = []
  inMemoryStoreRegistry.purchaseOrders = []
  inMemoryStoreRegistry.goodsReceipts = []
}

/** @deprecated use ensurePurchasingSeeded */
export const ensurePurchaseOrdersSeeded = ensurePurchasingSeeded
