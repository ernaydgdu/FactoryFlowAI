/**
 * Production Declaration — MES deklarasyon köprüsü.
 *
 * Bugüne kadar iki paralel "günlük giriş" yolu birbirinden kopuktu:
 *   1. Execution Platform `postOperationDailyEntry` → operationDailyEntries
 *      stream'i (UE producedQty'ye DOKUNMAZ)
 *   2. UE lifecycle `addDailyProductionEntry` → producedQty + productionDailyEntries
 *
 * Bu servis operatör deklarasyonunu TEK komutta iki tarafa da işler:
 * operasyon girişi (BR-05 eligibility kontrolleriyle) + UE üretim sayacı.
 * Yeni persistence portu yoktur; mevcut stream/aggregate portları kullanılır.
 */
import { postOperationDailyEntry } from '@/domain/execution-platform/execution-platform-service'
import { addDailyProductionEntry } from '@/domain/production-order/lifecycle-service'
import { queryProductionOrderByNo } from '@/domain/production-order/production-order-query.service'

import type { ProductionDeclarationInput, ProductionDeclarationResult } from './shop-floor.types'

export class ShopFloorDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ShopFloorDomainError'
  }
}

export function persistProductionDeclaration(
  input: ProductionDeclarationInput,
  actor: string,
): ProductionDeclarationResult {
  if (input.produced < 0 || input.reject < 0 || input.rework < 0 || input.fire < 0) {
    throw new ShopFloorDomainError('Deklarasyon miktarları negatif olamaz.')
  }
  if (input.produced + input.reject + input.rework + input.secondQuality + input.fire === 0) {
    throw new ShopFloorDomainError('Deklarasyon için en az bir miktar girilmeli.')
  }

  const record = queryProductionOrderByNo(input.productionOrderNo)
  if (!record) throw new ShopFloorDomainError(`Üretim emri bulunamadı: ${input.productionOrderNo}`)
  if (record.status !== 'In Production' && record.status !== 'Paused') {
    throw new ShopFloorDomainError(
      `Deklarasyon yalnızca In Production / Paused durumunda yapılabilir (mevcut: ${record.status}).`,
    )
  }

  // 1) Execution tarafı — operasyon girişi (BR-05 / route eligibility içeride)
  const entry = postOperationDailyEntry({
    productionOrderNo: input.productionOrderNo,
    operationCode: input.operationCode,
    lineId: input.lineId,
    operatorId: input.operatorId,
    machineId: input.machineId,
    shiftCode: input.shiftCode,
    bundleId: null,
    entryDate: input.entryDate,
    planned: input.planned,
    produced: input.produced,
    reject: input.reject,
    rework: input.rework,
    secondQuality: input.secondQuality,
    fire: input.fire,
    downtimeMinutes: input.downtimeMinutes,
    reasonCode: input.reasonCode ?? null,
    recordedBy: actor,
  })

  // 2) UE tarafı — üretim sayaçları (producedQty + reject/rework/fire)
  addDailyProductionEntry(input.productionOrderNo, {
    entryDate: input.entryDate,
    planned: input.planned,
    produced: input.produced,
    reject: input.reject,
    rework: input.rework,
    secondQuality: input.secondQuality,
    fire: input.fire,
    recordedBy: actor,
  })

  const updated = queryProductionOrderByNo(input.productionOrderNo)
  const producedQtyTotal = updated?.producedQty ?? record.producedQty + input.produced

  return {
    productionOrderNo: input.productionOrderNo,
    operationEntryId: entry.id,
    producedQtyTotal,
    remainingQty: Math.max(0, (updated?.plannedQty ?? record.plannedQty) - producedQtyTotal),
  }
}
