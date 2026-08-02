import type { BomLine, MaterialRequirementPlan, SalesOrder } from '../types'
import { SALES_ORDERS } from '../data/orders'
import { getProductById } from '../data/products'
import type { PurchaseRequisition } from '../types/workflows'
import type {
  BusinessRuleDefinition,
  BusinessRuleId,
  ProductionEntryInput,
  ProductionEntryResult,
  ProductionReservationInput,
  PurchaseReceiptInput,
  RuleExecutionResult,
  ShipmentInput,
  AccessoryDelayInput,
  QualityReworkInput,
  LeftoverReuseInput,
  SplitProductionInput,
  StockLedger,
  StockMovement,
  TransferInput,
} from '../types/stock-ledger'
import {
  getDefaultWorkshopCode,
  getFabricWarehouseCode,
  getFinishedGoodsWarehouseCode,
} from '../master-data'
import { generateMrp } from './calculations'
import { generatePurchaseRequisitions } from './purchasing-flow'
import {
  createEmptyLedger,
  getBalance,
  recordMovement,
  validateLedgerIntegrity,
} from './stock-ledger'

/** İş kuralı kataloğu — ERP Business Rule Engine tanımları */
export const BUSINESS_RULES: BusinessRuleDefinition[] = [
  {
    id: 'BR-01-ORDER-MRP-PR',
    name: 'Sipariş → MRP → Satın Alma Talebi',
    trigger: 'SALES_ORDER_CREATED',
    actions: [
      'BOM ve sipariş adedinden MRP hesapla',
      'Her MRP satırı için Satın Alma Talebi (PR) oluştur',
    ],
    invariant: 'Stok hareketi oluşmaz — yalnızca planlama kaydı',
  },
  {
    id: 'BR-02-PO-RECEIPT',
    name: 'PO Teslim → Hammadde Deposu Giriş',
    trigger: 'PURCHASE_ORDER_RECEIVED',
    actions: [
      'Stock Ledger RECEIPT hareketi oluştur',
      'Hedef depo onHand artır',
    ],
    invariant: 'Stok yalnızca RECEIPT hareketi ile artar',
  },
  {
    id: 'BR-03-PRODUCTION-RESERVE',
    name: 'Üretim Emri → BOM Rezervasyonu',
    trigger: 'PRODUCTION_ORDER_CREATED',
    actions: [
      'BOM satırları için RESERVATION hareketi oluştur',
      'Kaynak depoda reserved artır, available azalt',
    ],
    invariant: 'Fiziksel stok değişmez — yalnızca bloke edilir',
  },
  {
    id: 'BR-04-WORKSHOP-TRANSFER',
    name: 'Malzeme → Fason Atölye Transferi',
    trigger: 'WAREHOUSE_TRANSFER',
    actions: [
      'Kaynak depodan TRANSFER_OUT',
      'Hedef depoda TRANSFER_IN (eşleştirilmiş hareket)',
      'Rezervasyon varsa RESERVATION_RELEASE + hedef rezervasyon',
    ],
    invariant: 'Toplam sistem stoğu korunur',
  },
  {
    id: 'BR-05-PRODUCTION-ENTRY',
    name: 'Üretim Girişi — Plan / Gerçek / Fire / Eksik',
    trigger: 'PRODUCTION_ENTRY_POSTED',
    actions: [
      'producedQty + wasteQty + missingQty = plannedQty doğrula',
      'Fire için WASTE hareketi oluştur',
      'BR-06 tüketim kuralını tetikle',
    ],
    invariant: 'Üretim metrikleri hareketlerle eşleşmeli',
  },
  {
    id: 'BR-06-MATERIAL-CONSUMPTION',
    name: 'Otomatik Malzeme Tüketimi',
    trigger: 'PRODUCTION_ENTRY_POSTED',
    actions: [
      'consumedQty = producedQty × consumptionPerUnit',
      'Fason depodan CONSUMPTION hareketi',
    ],
    invariant: 'Tüketim yalnızca iyi adet (producedQty) üzerinden hesaplanır',
  },
  {
    id: 'BR-07-WORKSHOP-REMAINING',
    name: 'Fason Depo Kalan Stok',
    trigger: 'AFTER_CONSUMPTION',
    actions: [
      'remaining = transferredQty - consumedQty - wasteQty',
      'Kalan miktar fason depo bakiyesinde görünür',
    ],
    invariant: 'Kalan stok ayrı hareket gerektirmez — bakiye türetilir',
  },
  {
    id: 'BR-08-PRODUCTION-COMPLETE',
    name: 'Üretim Tamamlandı → Mamül Girişi',
    trigger: 'PRODUCTION_ORDER_COMPLETED',
    actions: [
      'Mamül deposuna PRODUCTION_OUTPUT hareketi',
      'Üretim emri durumu Tamamlandı',
    ],
    invariant: 'Mamül stoku yalnızca PRODUCTION_OUTPUT ile artar',
  },
  {
    id: 'BR-09-SHIPMENT',
    name: 'Sevkiyat → Mamül Çıkış',
    trigger: 'SHIPMENT_POSTED',
    actions: [
      'Mamül deposundan SHIPMENT hareketi',
      'Sipariş durumu Sevk Edildi',
    ],
    invariant: 'Sevkiyat yalnızca SHIPMENT hareketi ile stok düşer',
  },
  {
    id: 'BR-10-STOCK-LEDGER',
    name: 'Stock Ledger — Tek Stok Gerçeği',
    trigger: 'ALL_STOCK_CHANGES',
    actions: [
      'Her stok değişikliği StockMovement kaydı oluşturur',
      'Doğrudan bakiye güncellemesi yasak',
      'Ledger bütünlük kontrolü ile doğrulanır',
    ],
    invariant: 'balance = Σ(movements) — hiçbir istisna yok',
  },
  {
    id: 'BR-11-PRODUCTION-SPLIT',
    name: 'Sipariş Bölme → Atölye Bazlı UE + Malzeme Transferi',
    trigger: 'PRODUCTION_ORDER_SPLIT',
    actions: [
      'Child UE başına BOM oranında kumaş rezervasyonu',
      'Her child UE için fason atölye deposuna TRANSFER',
      'Split adetleri parent sipariş adedine eşit olmalı',
    ],
    invariant: 'Σ(split.plannedQty) = parent.orderQty',
  },
  {
    id: 'BR-12-LEFTOVER-REUSE',
    name: 'Fason Kalan Kumaş → Yeniden Kullanım / Havuz İade',
    trigger: 'LEFTOVER_DETECTED',
    actions: [
      'Fason depodan TRANSFER_OUT',
      'Hedef depoda TRANSFER_IN (sipariş veya ana kumaş deposu)',
      'Leftover allocation kaydı oluştur',
    ],
    invariant: 'Transfer miktarı ≤ fason depo onHand',
  },
  {
    id: 'BR-13-QUALITY-REWORK',
    name: 'AQL Fail → Rework Üretim Emri',
    trigger: 'QUALITY_INSPECTION_FAILED',
    actions: [
      'Rework UE oluştur (repairQty adet)',
      'Fason depodan CONSUMPTION (rework kumaş)',
      'PRODUCTION_OUTPUT (rework mamül)',
      'Termin/kapasite etkisi hesapla',
    ],
    invariant: 'repairQty > 0 ve AQL result = Fail',
  },
  {
    id: 'BR-14-ACCESSORY-DELAY',
    name: 'Aksesuar Gecikme → Termin/Risk Yeniden Hesaplama',
    trigger: 'ACCESSORY_DELAY_REPORTED',
    actions: [
      'BOM\'da aksesuar kullanan siparişleri bul',
      'ACCESSORY milestone +delayDays kaydır',
      'Risk skorunu ACCESSORY_DELAY ile güncelle',
    ],
    invariant: 'Stok hareketi oluşmaz — planlama/risk güncellemesi',
  },
]

function ok<T>(
  ruleId: BusinessRuleId,
  ruleName: string,
  ledger: StockLedger,
  movements: StockMovement[],
  payload?: T,
): RuleExecutionResult<T> {
  return { success: true, ruleId, ruleName, movements, ledger, payload }
}

function fail<T>(
  ruleId: BusinessRuleId,
  ruleName: string,
  ledger: StockLedger,
  errors: string[],
): RuleExecutionResult<T> {
  return { success: false, ruleId, ruleName, movements: [], ledger, errors }
}

/** BR-01: Sipariş oluşturuldu → MRP + PR */
export function ruleOrderCreatedMRPAndPR(
  order: Pick<SalesOrder, 'id' | 'orderNo' | 'matrixTotals' | 'productCardId'>,
  bom: BomLine[],
  ledger: StockLedger = createEmptyLedger(),
): RuleExecutionResult<{ mrp: MaterialRequirementPlan; purchaseRequisitions: PurchaseRequisition[] }> {
  const rule = BUSINESS_RULES.find((r) => r.id === 'BR-01-ORDER-MRP-PR')!
  const orderQty = order.matrixTotals.grandTotal

  const mrpRaw = generateMrp(order.id, order.orderNo, orderQty, bom)
  const mrp: MaterialRequirementPlan = {
    orderId: order.id,
    orderNo: order.orderNo,
    orderQty,
    lines: mrpRaw.lines,
    generatedAt: mrpRaw.generatedAt,
  }

  const purchaseRequisitions = generatePurchaseRequisitions(mrp)

  return ok(rule.id, rule.name, ledger, [], { mrp, purchaseRequisitions })
}

/** BR-02: PO teslim → Hammadde deposu girişi */
export function rulePurchaseOrderReceipt(
  input: PurchaseReceiptInput,
  ledger: StockLedger,
): RuleExecutionResult<{ movement: StockMovement }> {
  const rule = BUSINESS_RULES.find((r) => r.id === 'BR-02-PO-RECEIPT')!

  try {
    const movement = recordMovement(ledger, {
      type: 'RECEIPT',
      stockCardId: input.stockCardId,
      warehouseCode: input.warehouseCode,
      quantity: input.quantity,
      referenceType: 'PO',
      referenceId: input.poId,
      referenceNo: input.poNo,
      reason: 'Satın alma siparişi teslim alındı',
      createdBy: input.createdBy,
    })
    return ok(rule.id, rule.name, ledger, [movement], { movement })
  } catch (e) {
    return fail(rule.id, rule.name, ledger, [(e as Error).message])
  }
}

/** BR-03: Üretim emri → BOM rezervasyonu */
export function ruleProductionOrderReservation(
  input: ProductionReservationInput,
  ledger: StockLedger,
): RuleExecutionResult<{ movements: StockMovement[] }> {
  const rule = BUSINESS_RULES.find((r) => r.id === 'BR-03-PRODUCTION-RESERVE')!
  const movements: StockMovement[] = []

  try {
    for (const line of input.lines) {
      const mov = recordMovement(ledger, {
        type: 'RESERVATION',
        stockCardId: line.stockCardId,
        warehouseCode: line.warehouseCode,
        quantity: line.quantity,
        referenceType: 'PRODUCTION',
        referenceId: input.productionOrderId,
        referenceNo: input.productionOrderNo,
        reason: `BOM rezervasyonu — ${input.orderNo}`,
        createdBy: input.createdBy,
      })
      movements.push(mov)
    }
    return ok(rule.id, rule.name, ledger, movements, { movements })
  } catch (e) {
    return fail(rule.id, rule.name, ledger, [(e as Error).message])
  }
}

/** BR-04: Depolar arası transfer (Fason Atölye A) */
export function ruleWorkshopTransfer(
  input: TransferInput,
  ledger: StockLedger,
  releaseReservation = true,
): RuleExecutionResult<{ outMovement: StockMovement; inMovement: StockMovement }> {
  const rule = BUSINESS_RULES.find((r) => r.id === 'BR-04-WORKSHOP-TRANSFER')!
  const movements: StockMovement[] = []

  try {
    if (releaseReservation) {
      const res = recordMovement(ledger, {
        type: 'RESERVATION_RELEASE',
        stockCardId: input.stockCardId,
        warehouseCode: input.fromWarehouseCode,
        quantity: input.quantity,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        referenceNo: input.referenceNo,
        reason: 'Transfer öncesi rezervasyon çözümü',
        createdBy: input.createdBy,
      })
      movements.push(res)
    }

    const outMov = recordMovement(ledger, {
      type: 'TRANSFER_OUT',
      stockCardId: input.stockCardId,
      warehouseCode: input.fromWarehouseCode,
      quantity: input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      referenceNo: input.referenceNo,
      reason: `Transfer çıkış → ${input.toWarehouseCode}`,
      createdBy: input.createdBy,
    })
    movements.push(outMov)

    const inMov = recordMovement(ledger, {
      type: 'TRANSFER_IN',
      stockCardId: input.stockCardId,
      warehouseCode: input.toWarehouseCode,
      quantity: input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      referenceNo: input.referenceNo,
      reason: `Transfer giriş ← ${input.fromWarehouseCode}`,
      createdBy: input.createdBy,
      linkedMovementId: outMov.id,
    })
    movements.push(inMov)

    return ok(rule.id, rule.name, ledger, movements, { outMovement: outMov, inMovement: inMov })
  } catch (e) {
    return fail(rule.id, rule.name, ledger, [(e as Error).message])
  }
}

/** BR-05 + BR-06 + BR-07: Üretim girişi, tüketim ve kalan hesabı */
export function ruleProductionEntry(
  input: ProductionEntryInput,
  ledger: StockLedger,
  transferredQty: number,
  createdBy: string,
): RuleExecutionResult<ProductionEntryResult> {
  const ruleEntry = BUSINESS_RULES.find((r) => r.id === 'BR-05-PRODUCTION-ENTRY')!
  const movements: StockMovement[] = []

  const missingQty = input.plannedQty - input.producedQty - input.wasteQty
  if (missingQty < 0) {
    return fail(ruleEntry.id, ruleEntry.name, ledger, [
      'Plan = Üretilen + Fire + Eksik denklemi sağlanmıyor',
    ])
  }

  const consumedQty =
    Math.round(input.producedQty * input.consumptionPerUnit * 100) / 100

  try {
    const wasteMaterialQty = input.wasteMaterialQty ?? 0
    if (wasteMaterialQty > 0) {
      const wasteMov = recordMovement(ledger, {
        type: 'WASTE',
        stockCardId: input.stockCardId,
        warehouseCode: input.workshopWarehouseCode,
        quantity: wasteMaterialQty,
        referenceType: 'PRODUCTION',
        referenceId: input.productionOrderId,
        referenceNo: input.productionOrderNo,
        reason: `Kumaş fire — ${wasteMaterialQty} ${input.unit}`,
        createdBy,
      })
      movements.push(wasteMov)
    }

    const consumptionMov = recordMovement(ledger, {
      type: 'CONSUMPTION',
      stockCardId: input.stockCardId,
      warehouseCode: input.workshopWarehouseCode,
      quantity: consumedQty,
      referenceType: 'PRODUCTION',
      referenceId: input.productionOrderId,
      referenceNo: input.productionOrderNo,
      reason: `${input.producedQty} adet × ${input.consumptionPerUnit} ${input.unit} tüketim`,
      createdBy,
    })
    movements.push(consumptionMov)

    const workshopBalance = getBalance(
      ledger,
      input.stockCardId,
      input.workshopWarehouseCode,
    )
    const remainingInWorkshop = workshopBalance?.onHand ?? 0

    const expectedRemaining =
      Math.round((transferredQty - consumedQty - wasteMaterialQty) * 100) / 100

    const result: ProductionEntryResult = {
      producedQty: input.producedQty,
      wasteQty: input.wasteQty,
      missingQty,
      consumedQty,
      remainingInWorkshop,
      movements,
    }

    if (Math.abs(remainingInWorkshop - expectedRemaining) > 0.01) {
      return fail(ruleEntry.id, ruleEntry.name, ledger, [
        `Fason kalan uyumsuz: beklenen ${expectedRemaining}, gerçek ${remainingInWorkshop}`,
      ])
    }

    return ok(ruleEntry.id, ruleEntry.name, ledger, movements, result)
  } catch (e) {
    return fail(ruleEntry.id, ruleEntry.name, ledger, [(e as Error).message])
  }
}

/** BR-08: Üretim tamamlandı → Mamül deposu girişi */
export function ruleProductionComplete(
  productionOrderId: string,
  productionOrderNo: string,
  orderNo: string,
  producedQty: number,
  finishedGoodsWarehouseCode: string,
  ledger: StockLedger,
  createdBy: string,
): RuleExecutionResult<{ movement: StockMovement }> {
  const rule = BUSINESS_RULES.find((r) => r.id === 'BR-08-PRODUCTION-COMPLETE')!

  try {
    const movement = recordMovement(ledger, {
      type: 'PRODUCTION_OUTPUT',
      stockCardId: `fg-${orderNo}`,
      warehouseCode: finishedGoodsWarehouseCode,
      quantity: producedQty,
      referenceType: 'PRODUCTION',
      referenceId: productionOrderId,
      referenceNo: productionOrderNo,
      reason: `Üretim tamamlandı — ${producedQty} adet mamül girişi`,
      createdBy,
    })
    return ok(rule.id, rule.name, ledger, [movement], { movement })
  } catch (e) {
    return fail(rule.id, rule.name, ledger, [(e as Error).message])
  }
}

/** BR-09: Sevkiyat → Mamül deposu çıkışı */
export function ruleShipment(
  input: ShipmentInput,
  ledger: StockLedger,
): RuleExecutionResult<{ movement: StockMovement }> {
  const rule = BUSINESS_RULES.find((r) => r.id === 'BR-09-SHIPMENT')!

  try {
    const movement = recordMovement(ledger, {
      type: 'SHIPMENT',
      stockCardId: `fg-${input.orderNo}`,
      warehouseCode: input.warehouseCode,
      quantity: input.quantity,
      referenceType: 'SHIPMENT',
      referenceId: input.shipmentId,
      referenceNo: input.shipmentNo,
      reason: `Sevkiyat — ${input.orderNo}`,
      createdBy: input.createdBy,
    })
    return ok(rule.id, rule.name, ledger, [movement], { movement })
  } catch (e) {
    return fail(rule.id, rule.name, ledger, [(e as Error).message])
  }
}

/** BR-10: Ledger bütünlük doğrulama */
export function ruleValidateStockLedger(
  ledger: StockLedger,
): RuleExecutionResult<{ valid: boolean; errors: string[] }> {
  const rule = BUSINESS_RULES.find((r) => r.id === 'BR-10-STOCK-LEDGER')!
  const { valid, errors } = validateLedgerIntegrity(ledger)
  return {
    success: valid,
    ruleId: rule.id,
    ruleName: rule.name,
    movements: [],
    ledger,
    payload: { valid, errors },
    errors: valid ? undefined : errors,
  }
}

/** BR-11: Sipariş bölme — child UE başına rezervasyon + atölye transferi */
export function ruleProductionOrderSplit(
  input: SplitProductionInput,
  ledger: StockLedger,
): RuleExecutionResult<{ splits: SplitProductionInput['splits']; movements: StockMovement[] }> {
  const rule = BUSINESS_RULES.find((r) => r.id === 'BR-11-PRODUCTION-SPLIT')!
  const movements: StockMovement[] = []

  if (input.splits.length < 2) {
    return fail(rule.id, rule.name, ledger, ['Split en az 2 child UE içermeli'])
  }

  try {
    for (const split of input.splits) {
      const reserveMov = recordMovement(ledger, {
        type: 'RESERVATION',
        stockCardId: input.stockCardId,
        warehouseCode: input.fabricWarehouseCode,
        quantity: split.fabricMeters,
        referenceType: 'PRODUCTION',
        referenceId: split.splitId,
        referenceNo: split.workOrderNo,
        reason: `Split rezervasyon — ${split.workshopCode} (${split.plannedQty} adet)`,
        createdBy: input.createdBy,
      })
      movements.push(reserveMov)

      const releaseMov = recordMovement(ledger, {
        type: 'RESERVATION_RELEASE',
        stockCardId: input.stockCardId,
        warehouseCode: input.fabricWarehouseCode,
        quantity: split.fabricMeters,
        referenceType: 'PRODUCTION',
        referenceId: split.splitId,
        referenceNo: split.workOrderNo,
        reason: 'Split transfer öncesi rezervasyon çözümü',
        createdBy: input.createdBy,
      })
      movements.push(releaseMov)

      const outMov = recordMovement(ledger, {
        type: 'TRANSFER_OUT',
        stockCardId: input.stockCardId,
        warehouseCode: input.fabricWarehouseCode,
        quantity: split.fabricMeters,
        referenceType: 'PRODUCTION',
        referenceId: split.splitId,
        referenceNo: split.workOrderNo,
        reason: `Split transfer → ${split.workshopCode}`,
        createdBy: input.createdBy,
      })
      movements.push(outMov)

      const inMov = recordMovement(ledger, {
        type: 'TRANSFER_IN',
        stockCardId: input.stockCardId,
        warehouseCode: split.workshopCode,
        quantity: split.fabricMeters,
        referenceType: 'PRODUCTION',
        referenceId: split.splitId,
        referenceNo: split.workOrderNo,
        reason: `Split transfer ← ${input.fabricWarehouseCode}`,
        createdBy: input.createdBy,
        linkedMovementId: outMov.id,
      })
      movements.push(inMov)
    }

    return ok(rule.id, rule.name, ledger, movements, { splits: input.splits, movements })
  } catch (e) {
    return fail(rule.id, rule.name, ledger, [(e as Error).message])
  }
}

/** BR-12: Fason kalan kumaş → başka sipariş veya ana depo transferi */
export function ruleLeftoverReuse(
  input: LeftoverReuseInput,
  ledger: StockLedger,
): RuleExecutionResult<{ transferOut: StockMovement; transferIn: StockMovement }> {
  const rule = BUSINESS_RULES.find((r) => r.id === 'BR-12-LEFTOVER-REUSE')!
  const movements: StockMovement[] = []

  const balance = getBalance(ledger, input.stockCardId, input.fromWarehouseCode)
  if (!balance || balance.onHand < input.quantity) {
    return fail(rule.id, rule.name, ledger, [
      `${input.fromWarehouseCode}: yetersiz kalan stok (${balance?.onHand ?? 0} < ${input.quantity})`,
    ])
  }

  try {
    const outMov = recordMovement(ledger, {
      type: 'TRANSFER_OUT',
      stockCardId: input.stockCardId,
      warehouseCode: input.fromWarehouseCode,
      quantity: input.quantity,
      referenceType: 'TRANSFER',
      referenceId: input.targetOrderId,
      referenceNo: input.targetOrderNo,
      reason: `Fason kalan transfer — ${input.sourceOrderNo} → ${input.targetOrderNo}`,
      createdBy: input.createdBy,
    })
    movements.push(outMov)

    const inMov = recordMovement(ledger, {
      type: 'TRANSFER_IN',
      stockCardId: input.stockCardId,
      warehouseCode: input.toWarehouseCode,
      quantity: input.quantity,
      referenceType: 'TRANSFER',
      referenceId: input.targetOrderId,
      referenceNo: input.targetOrderNo,
      reason: `Fason kalan alındı ← ${input.fromWarehouseCode}`,
      createdBy: input.createdBy,
      linkedMovementId: outMov.id,
    })
    movements.push(inMov)

    return ok(rule.id, rule.name, ledger, movements, { transferOut: outMov, transferIn: inMov })
  } catch (e) {
    return fail(rule.id, rule.name, ledger, [(e as Error).message])
  }
}

/** BR-13: AQL Fail → Rework üretim emri + tüketim/çıktı */
export function ruleQualityRework(
  input: QualityReworkInput,
  ledger: StockLedger,
): RuleExecutionResult<{ reworkWorkOrderNo: string; repairQty: number; movements: StockMovement[] }> {
  const rule = BUSINESS_RULES.find((r) => r.id === 'BR-13-QUALITY-REWORK')!
  const movements: StockMovement[] = []

  if (input.repairQty <= 0) {
    return fail(rule.id, rule.name, ledger, ['Rework adedi sıfır olamaz'])
  }

  const consumedQty =
    Math.round(input.repairQty * input.consumptionPerUnit * 100) / 100

  try {
    const consumptionMov = recordMovement(ledger, {
      type: 'CONSUMPTION',
      stockCardId: input.fabricStockCardId,
      warehouseCode: input.workshopWarehouseCode,
      quantity: consumedQty,
      referenceType: 'PRODUCTION',
      referenceId: input.inspectionId,
      referenceNo: input.reworkWorkOrderNo,
      reason: `Rework kumaş tüketimi — ${input.inspectionNo}`,
      createdBy: input.createdBy,
    })
    movements.push(consumptionMov)

    const outputMov = recordMovement(ledger, {
      type: 'PRODUCTION_OUTPUT',
      stockCardId: `fg-${input.orderNo}`,
      warehouseCode: getFinishedGoodsWarehouseCode(),
      quantity: input.repairQty,
      referenceType: 'PRODUCTION',
      referenceId: input.inspectionId,
      referenceNo: input.reworkWorkOrderNo,
      reason: `Rework üretim çıktısı — ${input.repairQty} adet`,
      createdBy: input.createdBy,
    })
    movements.push(outputMov)

    return ok(rule.id, rule.name, ledger, movements, {
      reworkWorkOrderNo: input.reworkWorkOrderNo,
      repairQty: input.repairQty,
      movements,
    })
  } catch (e) {
    return fail(rule.id, rule.name, ledger, [(e as Error).message])
  }
}

/** BR-14: Aksesuar gecikme bildirimi → etkilenen siparişler (planlama kaydı) */
export function ruleAccessoryDelay(
  input: AccessoryDelayInput,
  ledger: StockLedger,
): RuleExecutionResult<{
  stockCardId: string
  delayDays: number
  affectedOrderIds: string[]
  affectedOrderNos: string[]
}> {
  const rule = BUSINESS_RULES.find((r) => r.id === 'BR-14-ACCESSORY-DELAY')!

  const affected = SALES_ORDERS.filter((o) => {
    const product = getProductById(o.productCardId)
    return product?.bom.some((b) => b.stockCardId === input.stockCardId)
  })

  if (affected.length === 0) {
    return fail(rule.id, rule.name, ledger, [
      `${input.stockCardId} kullanan sipariş bulunamadı`,
    ])
  }

  return ok(rule.id, rule.name, ledger, [], {
    stockCardId: input.stockCardId,
    delayDays: input.delayDays,
    affectedOrderIds: affected.map((o) => o.id),
    affectedOrderNos: affected.map((o) => o.orderNo),
  })
}

/** Tüm senaryoları sırayla çalıştıran orchestrator */
export function executeFullProductionScenario(
  ledger: StockLedger = createEmptyLedger(),
): {
  ledger: StockLedger
  results: RuleExecutionResult[]
  scenarioSummary: {
    consumedMeters: number
    remainingInWorkshop: number
    finishedGoodsQty: number
    totalMovements: number
  }
} {
  const results: RuleExecutionResult[] = []
  const STOCK_CARD = 'sc-1'
  const FABRIC_WH = getFabricWarehouseCode()
  const WORKSHOP_WH = getDefaultWorkshopCode()
  const FINISHED_WH = getFinishedGoodsWarehouseCode()
  const CONSUMPTION_PER_UNIT = 1.55
  const CREATED_BY = 'system'

  results.push(
    ruleOrderCreatedMRPAndPR(
      { id: 'ord-demo', orderNo: 'SIP-2026-DEMO', matrixTotals: { byColor: {}, bySize: {}, grandTotal: 1000 }, productCardId: 'pc-1' },
      [{ id: 'bom-1', stockCardId: STOCK_CARD, consumption: CONSUMPTION_PER_UNIT, wastePercent: 5, actualConsumption: 1.6275 }],
    ),
  )

  results.push(
    rulePurchaseOrderReceipt(
      { poId: 'po-demo', poNo: 'PO-2026-DEMO', stockCardId: STOCK_CARD, quantity: 5000, warehouseCode: FABRIC_WH, createdBy: CREATED_BY },
      ledger,
    ),
  )

  const reserveQty = 1550
  results.push(
    ruleProductionOrderReservation(
      {
        productionOrderId: 'prod-demo',
        productionOrderNo: 'UE-2026-DEMO',
        orderId: 'ord-demo',
        orderNo: 'SIP-2026-DEMO',
        lines: [{ stockCardId: STOCK_CARD, quantity: reserveQty, warehouseCode: FABRIC_WH }],
        createdBy: CREATED_BY,
      },
      ledger,
    ),
  )

  results.push(
    ruleWorkshopTransfer(
      {
        transferId: 'trf-demo',
        transferNo: 'TRF-2026-DEMO',
        stockCardId: STOCK_CARD,
        quantity: reserveQty,
        fromWarehouseCode: FABRIC_WH,
        toWarehouseCode: WORKSHOP_WH,
        referenceType: 'TRANSFER',
        referenceId: 'prod-demo',
        referenceNo: 'UE-2026-DEMO',
        createdBy: CREATED_BY,
      },
      ledger,
    ),
  )

  results.push(
    ruleProductionEntry(
      {
        productionOrderId: 'prod-demo',
        productionOrderNo: 'UE-2026-DEMO',
        orderId: 'ord-demo',
        orderNo: 'SIP-2026-DEMO',
        stockCardId: STOCK_CARD,
        plannedQty: 1000,
        producedQty: 900,
        wasteQty: 60,
        consumptionPerUnit: CONSUMPTION_PER_UNIT,
        workshopWarehouseCode: WORKSHOP_WH,
        unit: 'metre',
      },
      ledger,
      reserveQty,
      CREATED_BY,
    ),
  )

  results.push(
    ruleProductionComplete(
      'prod-demo',
      'UE-2026-DEMO',
      'SIP-2026-DEMO',
      900,
      FINISHED_WH,
      ledger,
      CREATED_BY,
    ),
  )

  results.push(
    ruleShipment(
      {
        shipmentId: 'shp-demo',
        shipmentNo: 'SHP-2026-DEMO',
        orderId: 'ord-demo',
        orderNo: 'SIP-2026-DEMO',
        quantity: 900,
        warehouseCode: FINISHED_WH,
        createdBy: CREATED_BY,
      },
      ledger,
    ),
  )

  results.push(ruleValidateStockLedger(ledger))

  const workshopBalance = getBalance(ledger, STOCK_CARD, WORKSHOP_WH)
  const consumedMeters = 900 * CONSUMPTION_PER_UNIT

  return {
    ledger,
    results,
    scenarioSummary: {
      consumedMeters,
      remainingInWorkshop: workshopBalance?.onHand ?? 0,
      finishedGoodsQty: getBalance(ledger, `fg-SIP-2026-DEMO`, FINISHED_WH)?.onHand ?? 0,
      totalMovements: ledger.movements.length,
    },
  }
}
