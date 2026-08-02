/**
 * Quality Rework Flow — AQL fail → rework UE, termin/kapasite/maliyet etkisi.
 */
import type { ReworkProductionOrder, SalesOrder } from '../types'
import type { QualityInspection } from '../types/workflows'
import type { QualityReworkInput, StockLedger } from '../types/stock-ledger'
import type { CapacityAllocation, TerminPlan } from '../types/planning'
import { QUALITY_INSPECTIONS } from '../data/workflows'
import { getSalesOrderById } from '../data/orders'
import { getProductById } from '../data/products'
import { getDefaultWorkshopCode } from '../master-data'
import { ruleQualityRework, rulePurchaseOrderReceipt } from './business-rule-engine'
import { createEmptyLedger } from './stock-ledger'
import { allocateCapacity } from './planning/capacity-engine'
import { calculateTerminPlan } from './planning/termin-engine'
import { assessOrderRisk } from './planning/risk-engine'
import { getWorkshopCapacitySnapshots } from './planning/capacity-engine'
import { calcActualConsumption } from './calculations'

const REWORK_UNITS_PER_DAY = 200
const REWORK_CM_PER_UNIT = 4.2
const FABRIC_COST_PER_METER = 4.2

export type ReworkImpact = {
  inspection: QualityInspection
  order: SalesOrder
  reworkOrder: ReworkProductionOrder
  originalTermin: TerminPlan
  adjustedTermin: TerminPlan
  originalRiskScore: number
  adjustedRiskScore: number
  reworkCapacity: CapacityAllocation
  costBreakdown: {
    labor: number
    fabric: number
    total: number
  }
}

export function getFailedInspections(): QualityInspection[] {
  return QUALITY_INSPECTIONS.filter((q) => q.aqlResult === 'Fail')
}

export function calculateReworkDays(repairQty: number): number {
  return Math.max(1, Math.ceil(repairQty / REWORK_UNITS_PER_DAY) * 2)
}

export function buildReworkProductionOrder(
  inspection: QualityInspection,
  order: SalesOrder,
): ReworkProductionOrder {
  const reworkDays = calculateReworkDays(inspection.repairQty)
  const fabricLine = order.mrp.lines.find((l) => l.category === 'Kumaş')
  const consumption = fabricLine?.consumptionPerUnit ?? 1.55
  const fabricMeters = inspection.repairQty * consumption
  const laborCost = Math.round(inspection.repairQty * REWORK_CM_PER_UNIT)
  const fabricCost = Math.round(fabricMeters * FABRIC_COST_PER_METER)
  const reworkCost = laborCost + fabricCost

  return {
    id: `rework-${inspection.id}`,
    workOrderNo: `RW-${order.orderNo.replace('SIP-', '')}`,
    parentOrderId: order.id,
    parentOrderNo: order.orderNo,
    sourceInspectionId: inspection.id,
    sourceInspectionNo: inspection.inspectionNo,
    repairQty: inspection.repairQty,
    reworkDays,
    reworkCost,
    capacityImpactUnits: inspection.repairQty,
    terminImpactDays: reworkDays,
    status: 'Planlandı',
  }
}

export function calculateTerminWithRework(order: SalesOrder, reworkDays: number): TerminPlan {
  const base = calculateTerminPlan(order)
  const adjustedMilestones = base.milestones.map((m) => {
    if (m.stage === 'SEWING' || m.stage === 'PACKING' || m.stage === 'EXF') {
      return {
        ...m,
        daysFromToday: m.daysFromToday - reworkDays,
        status:
          m.daysFromToday - reworkDays < 0
            ? ('Late' as const)
            : m.daysFromToday - reworkDays <= 3
              ? ('At Risk' as const)
              : m.status,
      }
    }
    return m
  })

  return {
    ...base,
    milestones: adjustedMilestones,
    totalSlackDays: base.totalSlackDays - reworkDays,
    riskLevel:
      base.totalSlackDays - reworkDays < 0
        ? 'Kritik'
        : base.totalSlackDays - reworkDays <= 3
          ? 'Yüksek'
          : base.riskLevel,
  }
}

export function calculateReworkImpact(inspection: QualityInspection): ReworkImpact | null {
  const order = getSalesOrderById(inspection.orderId)
  if (!order) return null

  const reworkOrder = buildReworkProductionOrder(inspection, order)
  const originalTermin = calculateTerminPlan(order)
  const adjustedTermin = calculateTerminWithRework(order, reworkOrder.reworkDays)
  const snapshots = getWorkshopCapacitySnapshots()
  const originalRisk = assessOrderRisk(order, originalTermin, snapshots)
  const adjustedRisk = assessOrderRisk(order, adjustedTermin, snapshots)
  const reworkCapacity = allocateCapacity(
    inspection.repairQty,
    undefined,
    order.id,
    `${order.orderNo}-RW`,
  )

  const fabricLine = order.mrp.lines.find((l) => l.category === 'Kumaş')
  const consumption = fabricLine?.consumptionPerUnit ?? 1.55
  const fabricMeters = inspection.repairQty * consumption
  const labor = Math.round(inspection.repairQty * REWORK_CM_PER_UNIT)
  const fabric = Math.round(fabricMeters * FABRIC_COST_PER_METER)

  return {
    inspection,
    order,
    reworkOrder,
    originalTermin,
    adjustedTermin,
    originalRiskScore: originalRisk.score,
    adjustedRiskScore: adjustedRisk.score,
    reworkCapacity,
    costBreakdown: { labor, fabric, total: labor + fabric },
  }
}

export function buildQualityReworkInput(
  inspection: QualityInspection,
  order: SalesOrder,
  reworkOrder: ReworkProductionOrder,
  createdBy = 'qc-supervisor',
): QualityReworkInput {
  const product = getProductById(order.productCardId)
  const fabricLine = product?.bom.find((b) => b.stockCardId === 'sc-1') ?? product?.bom[0]
  const consumption = fabricLine
    ? calcActualConsumption(fabricLine.consumption, fabricLine.wastePercent)
    : 1.55

  return {
    inspectionId: inspection.id,
    inspectionNo: inspection.inspectionNo,
    orderId: order.id,
    orderNo: order.orderNo,
    repairQty: inspection.repairQty,
    reworkWorkOrderNo: reworkOrder.workOrderNo,
    workshopWarehouseCode: getDefaultWorkshopCode(),
    fabricStockCardId: fabricLine?.stockCardId ?? 'sc-1',
    consumptionPerUnit: consumption,
    createdBy,
  }
}

export function executeQualityReworkScenario(
  inspection: QualityInspection,
  ledger?: StockLedger,
) {
  const impact = calculateReworkImpact(inspection)
  if (!impact) return { impact: null, result: null }

  const input = buildQualityReworkInput(inspection, impact.order, impact.reworkOrder)
  const workingLedger = ledger ?? createEmptyLedger()
  if (!ledger) {
    const fabricNeeded = input.repairQty * input.consumptionPerUnit
    rulePurchaseOrderReceipt(
      {
        poId: `po-rework-${inspection.id}`,
        poNo: `PO-RW-${inspection.inspectionNo}`,
        stockCardId: input.fabricStockCardId,
        quantity: Math.ceil(fabricNeeded),
        warehouseCode: input.workshopWarehouseCode,
        createdBy: input.createdBy,
      },
      workingLedger,
    )
  }
  const result = ruleQualityRework(input, workingLedger)

  return { impact, result, input }
}

export function getQualityReworkBrainRecommendations(impact: ReworkImpact): string[] {
  return [
    `${impact.inspection.inspectionNo} AQL Fail — ${impact.reworkOrder.repairQty} adet rework`,
    `Termin etkisi: ${impact.reworkOrder.reworkDays} gün ek süre (slack ${impact.originalTermin.totalSlackDays} → ${impact.adjustedTermin.totalSlackDays})`,
    `Maliyet etkisi: $${impact.costBreakdown.total} (işçilik $${impact.costBreakdown.labor} + kumaş $${impact.costBreakdown.fabric})`,
    `Kapasite: ${impact.reworkCapacity.fullyAllocated ? 'Atandı' : 'Kısmi'} — ${impact.reworkOrder.repairQty} adet`,
    impact.adjustedRiskScore > impact.originalRiskScore
      ? `Risk arttı: ${impact.originalRiskScore} → ${impact.adjustedRiskScore}`
      : `Risk skoru: ${impact.adjustedRiskScore}`,
  ]
}
