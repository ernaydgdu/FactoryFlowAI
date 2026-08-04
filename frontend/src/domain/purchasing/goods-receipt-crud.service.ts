/**
 * Goods Receipt CRUD — PO → Warehouse → Inventory chain.
 */
import { appendEnterpriseTimelineEntry } from '@/domain/enterprise/enterprise-timeline-service'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import type { PersistedGoodsReceipt } from '@/domain/ports/persistence/persistence-aggregates'
import type { IGoodsReceiptRepository } from '@/domain/ports/persistence/aggregates/goods-receipt.repository'
import { schedulePurchasingChange } from '@/domain/platform/services/outbox-scheduler'
import { logAudit, type AuditContext } from '@/domain/platform/services/audit-service'
import type { GoodsReceipt, GoodsReceiptLine } from '@/domain/purchasing/purchasing.types'

import { applyGoodsReceiptToPurchaseOrder } from './purchase-order-crud.service'
import { queryPurchaseOrderById } from './purchase-order-query.service'
import { queryAllGoodsReceipts } from './goods-receipt-query.service'
import { persistGoodsReceiptToLedger } from '@/domain/inventory/stock-ledger-crud.service'
import { queryStockCardByCode } from '@/domain/stock-card/stock-card-query.service'

export class GoodsReceiptDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GoodsReceiptDomainError'
  }
}

export type CreateGoodsReceiptInput = {
  purchaseOrderId: string
  warehouseCode: string
  lines: { materialCode: string; quantity: number; lot?: string }[]
  /** Stable client key — same key returns existing GR without double-post. */
  idempotencyKey?: string
}

function grRepo(): IGoodsReceiptRepository {
  return requireUnitOfWork().goodsReceipts
}

function auditContext(actorUserId: string): AuditContext {
  return { changedBy: actorUserId, ip: '127.0.0.1', machine: 'web-client' }
}

function nextGrId(): string {
  return String(queryAllGoodsReceipts().reduce((m, g) => Math.max(m, Number.parseInt(g.id, 10) || 0), 0) + 1)
}

function nextGrNo(): string {
  const max = queryAllGoodsReceipts().reduce((m, g) => {
    const match = g.grNo.match(/GR-2026-(\d+)/)
    return Math.max(m, match ? Number.parseInt(match[1], 10) : 0)
  }, 0)
  return `GR-2026-${String(max + 1).padStart(4, '0')}`
}

export function persistPostGoodsReceipt(input: CreateGoodsReceiptInput, actorUserId: string): GoodsReceipt {
  if (input.idempotencyKey) {
    const existingId = `gr-idem-${input.idempotencyKey}`
    const existing = grRepo().findById(DEFAULT_TENANT_ID, existingId)
    if (existing) {
      return {
        id: existing.id,
        grNo: existing.grNo,
        purchaseOrderId: existing.purchaseOrderId,
        poNo: existing.poNo,
        warehouseCode: existing.warehouseCode,
        receivedAt: existing.receivedAt,
        lines: existing.lines,
        status: existing.status,
        createdAt: existing.createdAt,
        createdBy: existing.createdBy,
      }
    }
  }

  const po = queryPurchaseOrderById(input.purchaseOrderId)
  if (!po) throw new GoodsReceiptDomainError('PO bulunamadı.')
  if (po.status === 'Cancelled' || po.status === 'Archived' || po.status === 'Draft') {
    throw new GoodsReceiptDomainError(`${po.poNo} mal kabul için uygun değil.`)
  }

  const now = new Date().toISOString()
  const grLines: GoodsReceiptLine[] = input.lines.map((l, i) => {
    const poLine = po.lines.find((pl) => pl.materialCode === l.materialCode)
    return {
      id: `grl-${i}`,
      materialCode: l.materialCode,
      materialName: poLine?.materialName ?? l.materialCode,
      quantity: l.quantity,
      unit: poLine?.unit ?? 'adet',
      lot: l.lot,
    }
  })

  const gr: GoodsReceipt = {
    id: input.idempotencyKey ? `gr-idem-${input.idempotencyKey}` : nextGrId(),
    grNo: nextGrNo(),
    purchaseOrderId: po.id,
    poNo: po.poNo,
    warehouseCode: input.warehouseCode,
    receivedAt: now.slice(0, 10),
    lines: grLines,
    status: 'Posted',
    createdAt: now,
    createdBy: actorUserId,
  }

  const persisted: PersistedGoodsReceipt = {
    ...gr,
    tenantId: DEFAULT_TENANT_ID,
    version: 1,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }
  grRepo().save(DEFAULT_TENANT_ID, persisted)

  applyGoodsReceiptToPurchaseOrder(
    po.id,
    input.lines.map((l) => ({ materialCode: l.materialCode, quantity: l.quantity })),
    actorUserId,
  )

  persistGoodsReceiptToLedger(
    {
      goodsReceiptId: gr.id,
      grNo: gr.grNo,
      purchaseOrderId: po.id,
      poNo: po.poNo,
      warehouseCode: input.warehouseCode,
      lines: grLines.map((l) => {
        const card = queryStockCardByCode(l.materialCode)
        return {
          stockCardId: card?.id ?? l.materialCode,
          materialCode: l.materialCode,
          quantity: l.quantity,
        }
      }),
    },
    actorUserId,
  )

  logAudit(
    'GoodsReceipt',
    gr.id,
    'CREATE',
    { ...auditContext(actorUserId), description: `Mal kabul: ${gr.grNo}` },
    null,
    { grNo: gr.grNo, poNo: po.poNo },
  )
  appendEnterpriseTimelineEntry({
    id: `tl-gr-${gr.id}-${Date.now()}`,
    entityType: 'PURCHASE_ORDER',
    entityId: po.id,
    entityCode: po.poNo,
    occurredAt: now,
    actor: actorUserId,
    action: 'GOODS_RECEIPT',
    reason: `${gr.grNo} — ${input.warehouseCode}`,
  })
  schedulePurchasingChange({
    entityType: 'GoodsReceipt',
    entityId: gr.id,
    entityNo: gr.grNo,
    status: gr.status,
    changeType: 'PostGoodsReceipt',
    occurredAt: now,
    actorUserId,
  })

  return gr
}
