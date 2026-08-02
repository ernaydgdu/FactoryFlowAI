import type { MaterialRequirementPlan } from '../types'
import type { PurchaseRequisition } from '../types/workflows'

export function generatePurchaseRequisitions(
  mrp: MaterialRequirementPlan,
): PurchaseRequisition[] {
  return mrp.lines.map((line, i) => ({
    id: `pr-${mrp.orderId}-${i}`,
    prNo: `SAT-${mrp.orderNo.replace('SIP', 'SAT')}-${String(i + 1).padStart(2, '0')}`,
    orderId: mrp.orderId,
    orderNo: mrp.orderNo,
    mrpLineId: line.id,
    materialCode: line.code,
    materialName: line.materialName,
    category: line.category,
    quantity: line.netRequired,
    unit: line.unit,
    requiredDate: new Date(Date.now() + line.leadTimeDays * 86400000)
      .toISOString()
      .slice(0, 10),
    suggestedSupplier: line.supplier,
    status: 'Açık' as const,
    createdAt: mrp.generatedAt,
  }))
}
