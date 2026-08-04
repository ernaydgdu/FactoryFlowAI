/**
 * Completion Confirmation — üretim tamamlama onayı.
 *
 * UE'yi In Production → Completed durumuna geçirir (BR-08 doğrulaması,
 * finishedGoodsReady bayrağı mevcut lifecycle servisinde) ve üretilen
 * miktarı KALICI stok defterine PRODUCTION_OUTPUT hareketi olarak Mamül
 * deposuna işler (Phase 4 M1 persistFinishedGoodsReceipt ile).
 */
import { listFinishedGoodsWarehouses } from '@/domain/inventory/warehouse-management.service'
import { persistFinishedGoodsReceipt } from '@/domain/inventory/stock-ledger-crud.service'
import { transitionProductionOrderStatus } from '@/domain/production-order/lifecycle-service'
import { queryProductionOrderByNo } from '@/domain/production-order/production-order-query.service'

import { ShopFloorDomainError } from './production-declaration.service'
import type { CompletionConfirmationResult } from './shop-floor.types'

export function confirmProductionCompletion(
  productionOrderNo: string,
  actor: string,
): CompletionConfirmationResult {
  const record = queryProductionOrderByNo(productionOrderNo)
  if (!record) throw new ShopFloorDomainError(`Üretim emri bulunamadı: ${productionOrderNo}`)
  if (record.status !== 'In Production') {
    throw new ShopFloorDomainError(
      `Tamamlama onayı yalnızca In Production durumunda verilebilir (mevcut: ${record.status}).`,
    )
  }
  if (record.producedQty <= 0) {
    throw new ShopFloorDomainError('Üretilen miktar 0 — tamamlama onayı için önce deklarasyon gerekli.')
  }

  // BR-08 + finishedGoodsReady mevcut lifecycle geçişinde uygulanır
  const updated = transitionProductionOrderStatus(productionOrderNo, 'Completed', actor)

  // Mamül girişini kalıcı stok defterine işle (Mamül deposu, PRODUCTION_OUTPUT)
  const fgWarehouse = listFinishedGoodsWarehouses()[0]?.code ?? null
  let movementNo: string | null = null
  if (fgWarehouse) {
    const receipt = persistFinishedGoodsReceipt(
      {
        productionOrderId: updated.id,
        productionOrderNo: updated.productionOrderNo,
        warehouseCode: fgWarehouse,
        quantity: updated.producedQty,
        reason: `Tamamlama onayı — ${updated.productionOrderNo}`,
      },
      actor,
    )
    movementNo = receipt.movement.movementNo
  }

  return {
    productionOrderNo: updated.productionOrderNo,
    status: updated.status,
    producedQty: updated.producedQty,
    finishedGoodsMovementNo: movementNo,
    finishedGoodsWarehouseCode: fgWarehouse,
  }
}
