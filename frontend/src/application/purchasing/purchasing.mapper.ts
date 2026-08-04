import { queryAllGoodsReceipts } from '@/domain/purchasing/goods-receipt-query.service'
import { queryAllPurchaseOrders, queryPurchaseOrderById, queryPurchaseOrderVersion } from '@/domain/purchasing/purchase-order-query.service'
import { queryAllPurchaseRequests } from '@/domain/purchasing/purchase-request-query.service'
import { queryAllRfqs, queryQuotationsByRfqId } from '@/domain/purchasing/rfq-query.service'

import type {
  PurchaseOrderDetailDto,
  PurchaseOrderListItemDto,
  PurchaseRequestListItemDto,
  PurchasingKpisDto,
  QuotationCompareDto,
  RfqListItemDto,
} from './purchasing.dto'
import {
  purchaseOrderLifecycleBadge,
  purchaseRequestStatusBadge,
  quotationStatusBadge,
  rfqStatusBadge,
} from './purchasing.dto'

export function mapPurchaseRequestList(): PurchaseRequestListItemDto[] {
  return queryAllPurchaseRequests()
    .sort((a, b) => b.prNo.localeCompare(a.prNo))
    .map((pr) => ({
      id: pr.id,
      prNo: pr.prNo,
      sourceOrderNo: pr.sourceOrderNo,
      materialCode: pr.materialCode,
      materialName: pr.materialName,
      category: pr.category,
      quantity: pr.quantity,
      unit: pr.unit,
      requiredDate: pr.requiredDate,
      suggestedSupplier: pr.suggestedSupplier,
      status: purchaseRequestStatusBadge(pr.status),
    }))
}

export function mapPurchaseOrderList(): PurchaseOrderListItemDto[] {
  const now = new Date()
  return queryAllPurchaseOrders()
    .sort((a, b) => b.poNo.localeCompare(a.poNo))
    .map((po) => {
      const isLate = new Date(po.termin) < now && (po.status === 'Open' || po.status === 'Partially Received')
      const status = isLate
        ? { label: 'Gecikmiş', tone: 'danger' as const }
        : purchaseOrderLifecycleBadge(po.status)
      return {
        id: po.id,
        poNo: po.poNo,
        sourceOrderNo: po.sourceOrderNo,
        supplier: po.supplier,
        supplierCode: po.supplierCode,
        termin: po.termin,
        deliveryWarehouse: po.deliveryWarehouse,
        totalAmount: po.totalAmount,
        currency: po.currency,
        status,
        lifecycleStatus: po.status,
        revisionNo: po.currentRevision.revisionNo,
        version: queryPurchaseOrderVersion(po.id),
      }
    })
}

export function mapPurchaseOrderDetail(id: string): PurchaseOrderDetailDto | null {
  const po = queryPurchaseOrderById(id)
  if (!po) return null
  const listItem = mapPurchaseOrderList().find((p) => p.id === id)
  if (!listItem) return null
  return {
    ...listItem,
    lines: po.lines,
    revisionHistory: po.revisionHistory.map((r) => ({
      revisionNo: r.revisionNo,
      status: r.status,
      changedAt: r.changedAt,
      changeNote: r.changeNote,
    })),
    purchaseRequestId: po.purchaseRequestId,
    rfqId: po.rfqId,
    quotationId: po.quotationId,
  }
}

export function mapRfqList(): RfqListItemDto[] {
  return queryAllRfqs()
    .sort((a, b) => b.rfqNo.localeCompare(a.rfqNo))
    .map((rfq) => ({
      id: rfq.id,
      rfqNo: rfq.rfqNo,
      purchaseRequestCount: rfq.purchaseRequestIds.length,
      supplierCount: rfq.supplierCodes.length,
      dueDate: rfq.dueDate,
      status: rfqStatusBadge(rfq.status),
    }))
}

export function mapQuotationCompare(rfqId: string): QuotationCompareDto | null {
  const rfq = queryAllRfqs().find((r) => r.id === rfqId)
  if (!rfq) return null
  const quotations = queryQuotationsByRfqId(rfqId).map((q) => ({
    id: q.id,
    quotationNo: q.quotationNo,
    supplierCode: q.supplierCode,
    supplierName: q.supplierName,
    totalAmount: q.totalAmount,
    currency: q.currency,
    status: quotationStatusBadge(q.status),
    lines: q.lines.map((l) => ({
      materialCode: l.materialCode,
      unitPrice: l.unitPrice,
      leadTimeDays: l.leadTimeDays,
    })),
  }))
  return { rfqId, rfqNo: rfq.rfqNo, purchaseRequestIds: rfq.purchaseRequestIds, quotations }
}

export function mapPurchasingKpis(): PurchasingKpisDto {
  const prs = queryAllPurchaseRequests()
  const pos = queryAllPurchaseOrders()
  const now = new Date()
  return {
    totalPr: prs.length,
    openPr: prs.filter((p) => p.status === 'Submitted' || p.status === 'RFQ Issued').length,
    totalPo: pos.length,
    openPo: pos.filter((p) => ['Open', 'Partially Received', 'Approved'].includes(p.status)).length,
    delayedPo: pos.filter(
      (p) => new Date(p.termin) < now && (p.status === 'Open' || p.status === 'Partially Received'),
    ).length,
    totalRfq: queryAllRfqs().length,
    goodsReceiptCount: queryAllGoodsReceipts().length,
  }
}

export function mapPurchasingDashboard() {
  return {
    kpis: mapPurchasingKpis(),
    purchaseRequests: mapPurchaseRequestList(),
    purchaseOrders: mapPurchaseOrderList(),
    rfqs: mapRfqList(),
  }
}
