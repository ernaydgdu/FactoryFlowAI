/**
 * Split / Merge — iskelet (Phase 4 Module 3).
 * Yalnızca plan önerisi üretir ve doğrular; persistence mutasyonu YAPMAZ.
 * Gerçek split/merge yürütmesi (yeni UE aggregate'leri, miktar aktarımı,
 * rezervasyon bölüşümü) ileriki fazda uygulanacaktır.
 */
import type { ProductionOrderLifecycleRecord } from './lifecycle-types'
import { queryProductionOrderByNo } from './production-order-query.service'

export type SplitPlanLine = {
  proposedNo: string
  quantity: number
}

export type SplitPlan = {
  productionOrderNo: string
  splittableQty: number
  lines: SplitPlanLine[]
  valid: boolean
  errors: string[]
}

export type MergePlan = {
  orderNos: string[]
  productCode: string | null
  lineCode: string | null
  totalQty: number
  proposedNo: string | null
  valid: boolean
  errors: string[]
}

const SPLITTABLE_STATUSES: ProductionOrderLifecycleRecord['status'][] = [
  'Draft',
  'Planned',
  'Approved',
  'Released',
]

const MERGEABLE_STATUSES: ProductionOrderLifecycleRecord['status'][] = ['Draft', 'Planned', 'Approved']

export function planSplitProductionOrder(productionOrderNo: string, quantities: number[]): SplitPlan {
  const errors: string[] = []
  const record = queryProductionOrderByNo(productionOrderNo)

  if (!record) {
    return { productionOrderNo, splittableQty: 0, lines: [], valid: false, errors: ['Üretim emri bulunamadı.'] }
  }

  const splittableQty = Math.max(0, record.plannedQty - record.producedQty)

  if (!SPLITTABLE_STATUSES.includes(record.status)) {
    errors.push(`${record.status} durumundaki emir bölünemez (izinli: ${SPLITTABLE_STATUSES.join(', ')}).`)
  }
  if (quantities.length < 2) {
    errors.push('Split için en az 2 parça miktarı gerekli.')
  }
  if (quantities.some((q) => !Number.isFinite(q) || q <= 0)) {
    errors.push('Tüm parça miktarları sıfırdan büyük olmalı.')
  }
  const total = quantities.reduce((s, q) => s + q, 0)
  if (total !== splittableQty) {
    errors.push(`Parça toplamı (${total}) bölünebilir miktara (${splittableQty}) eşit olmalı.`)
  }

  return {
    productionOrderNo,
    splittableQty,
    lines: quantities.map((quantity, i) => ({
      proposedNo: `${productionOrderNo}-S${i + 1}`,
      quantity,
    })),
    valid: errors.length === 0,
    errors,
  }
}

export function planMergeProductionOrders(orderNos: string[]): MergePlan {
  const errors: string[] = []
  const unique = [...new Set(orderNos)]

  if (unique.length < 2) {
    return {
      orderNos: unique,
      productCode: null,
      lineCode: null,
      totalQty: 0,
      proposedNo: null,
      valid: false,
      errors: ['Merge için en az 2 farklı üretim emri gerekli.'],
    }
  }

  const records: ProductionOrderLifecycleRecord[] = []
  for (const no of unique) {
    const record = queryProductionOrderByNo(no)
    if (!record) errors.push(`Üretim emri bulunamadı: ${no}`)
    else records.push(record)
  }

  const productCodes = new Set(records.map((r) => r.productCode))
  const lineCodes = new Set(records.map((r) => r.productionLineCode))
  if (productCodes.size > 1) errors.push('Merge yalnızca aynı ürün için yapılabilir.')
  if (lineCodes.size > 1) errors.push('Merge yalnızca aynı üretim hattı için yapılabilir.')
  for (const r of records) {
    if (!MERGEABLE_STATUSES.includes(r.status)) {
      errors.push(`${r.productionOrderNo} (${r.status}) merge edilemez (izinli: ${MERGEABLE_STATUSES.join(', ')}).`)
    }
  }

  const totalQty = records.reduce((s, r) => s + Math.max(0, r.plannedQty - r.producedQty), 0)

  return {
    orderNos: unique,
    productCode: productCodes.size === 1 ? [...productCodes][0] : null,
    lineCode: lineCodes.size === 1 ? [...lineCodes][0] : null,
    totalQty,
    proposedNo: records.length > 0 ? `${records[0].productionOrderNo}-M` : null,
    valid: errors.length === 0,
    errors,
  }
}
