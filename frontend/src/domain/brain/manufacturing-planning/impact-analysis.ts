/**
 * Purchasing suggestions, shipment impact, delivery risk, critical path, bottlenecks.
 */
import { queryProductionFlows } from '@/domain/brain/manufacturing-knowledge'
import type { ManufacturingReasoningRun } from '@/domain/brain/manufacturing-reasoning'
import { queryLatestMrpRun } from '@/domain/mrp/mrp-query.service'

import type { PlanStrategyId } from './sequencing-allocation'
import type {
  BottleneckAnalysis,
  CriticalPathNode,
  DeliveryRisk,
  MaterialAllocation,
  PlanRiskLevel,
  ProductionSequenceStep,
  PurchasingSuggestion,
  ShipmentImpact,
} from './types'

function riskLevel(score: number): PlanRiskLevel {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH'
  if (score >= 35) return 'MEDIUM'
  return 'LOW'
}

export function buildPurchasingSuggestions(
  materials: MaterialAllocation[],
  strategy: PlanStrategyId,
): PurchasingSuggestion[] {
  const mrp = queryLatestMrpRun()
  const suggestions = mrp?.currentSnapshot.purchaseSuggestions ?? []
  const byCode = new Map(suggestions.map((s) => [s.materialCode, s]))

  return materials
    .filter((m) => m.shortfall > 0)
    .map((m) => {
      const sug = byCode.get(m.materialCode)
      const qty =
        strategy === 'MATERIAL_CONSTRAINED'
          ? m.shortfall * 1.1
          : strategy === 'OTIF_FIRST'
            ? m.shortfall
            : Math.max(m.shortfall * 0.9, m.shortfall)
      return {
        materialCode: m.materialCode,
        materialName: m.materialName,
        quantity: Math.round(qty * 100) / 100,
        unit: m.unit,
        supplierHint: sug?.supplier ?? 'MRP suggested supplier',
        reason:
          strategy === 'MATERIAL_CONSTRAINED'
            ? 'Cover shortfall with buffer before sequencing dependent orders'
            : strategy === 'OTIF_FIRST'
              ? 'Unblock termin-risk orders waiting on material'
              : 'Balanced buy to protect efficiency without overstock',
      }
    })
    .slice(0, 25)
}

export function buildShipmentImpact(
  sequencing: ProductionSequenceStep[],
  reasoning: ManufacturingReasoningRun,
): ShipmentImpact[] {
  const qualityBlocked = reasoning.constraints.some(
    (c) => c.domain === 'Quality' && (c.verdict === 'BLOCKED' || c.verdict === 'CRITICAL'),
  )
  const bySo = new Map<string, ProductionSequenceStep[]>()
  for (const s of sequencing) {
    const list = bySo.get(s.salesOrderNo) ?? []
    list.push(s)
    bySo.set(s.salesOrderNo, list)
  }

  return [...bySo.entries()].slice(0, 25).map(([salesOrderNo, steps]) => {
    const endDay = Math.max(...steps.map((s) => s.plannedStartDayOffset + s.plannedDurationDays))
    const lateFact = reasoning.facts.find(
      (f) =>
        f.sourceModule === 'sales-order' &&
        (f.attributes.orderNo === salesOrderNo || f.label === salesOrderNo) &&
        f.attributes.terminRisk === true,
    )
    const delayedDays = lateFact ? Math.max(0, endDay - 7) : Math.max(0, endDay - 14)
    return {
      salesOrderNo,
      canShipPartial: !qualityBlocked && steps.some((s) => s.remainingQty > 0),
      delayedDays,
      blockedByQuality: qualityBlocked,
      note: qualityBlocked
        ? 'Quality hold blocks full shipment path'
        : delayedDays > 0
          ? `Plan finish offset day ${endDay} implies ${delayedDays}d delivery pressure`
          : 'On-plan shipment window',
    }
  })
}

export function buildDeliveryRisks(
  shipmentImpact: ShipmentImpact[],
  reasoning: ManufacturingReasoningRun,
): DeliveryRisk[] {
  const capacityTight = reasoning.constraints.some(
    (c) => c.domain === 'Capacity' && c.verdict !== 'PASS',
  )
  const materialTight = reasoning.constraints.some(
    (c) => c.domain === 'Material' && c.verdict !== 'PASS',
  )

  return shipmentImpact.map((s) => {
    let score = s.delayedDays * 8
    const drivers: string[] = []
    if (s.blockedByQuality) {
      score += 40
      drivers.push('Quality hold / inspection block')
    }
    if (s.delayedDays > 0) drivers.push(`Schedule delay ${s.delayedDays}d`)
    if (capacityTight) {
      score += 15
      drivers.push('Capacity constraint')
    }
    if (materialTight) {
      score += 15
      drivers.push('Material shortage')
    }
    if (drivers.length === 0) drivers.push('No elevated delivery drivers')
    score = Math.min(100, score)
    return {
      salesOrderNo: s.salesOrderNo,
      riskLevel: riskLevel(score),
      score,
      drivers,
    }
  })
}

export function buildCriticalPath(sequencing: ProductionSequenceStep[]): CriticalPathNode[] {
  const flow = queryProductionFlows().find((f) => f.code === 'ORDER_TO_FINANCE')
  const nodes: CriticalPathNode[] = []

  if (flow) {
    for (const step of flow.steps) {
      const duration =
        step.label === 'Cutting' || step.label === 'Sewing'
          ? 3
          : step.label === 'Purchasing' || step.label === 'MRP'
            ? 2
            : 1
      const prev = flow.steps.find((s) => s.sequence === step.sequence - 1)
      nodes.push({
        id: step.id,
        label: step.label,
        durationDays: duration,
        dependsOn: prev ? [prev.id] : [],
        moduleRef: step.moduleRef ?? 'planning',
      })
    }
  }

  // Append top sequenced POs as execution critical nodes
  for (const s of sequencing.slice(0, 5)) {
    nodes.push({
      id: `po-${s.productionOrderNo}`,
      label: `PO ${s.productionOrderNo}`,
      durationDays: s.plannedDurationDays,
      dependsOn: nodes.length ? [nodes[nodes.length - 1]!.id] : [],
      moduleRef: 'production-order',
    })
  }

  return nodes
}

export function buildBottlenecks(
  reasoning: ManufacturingReasoningRun,
  materials: MaterialAllocation[],
  strategy: PlanStrategyId,
): BottleneckAnalysis[] {
  const out: BottleneckAnalysis[] = []

  for (const c of reasoning.constraints.filter((x) => x.verdict !== 'PASS')) {
    out.push({
      id: `bn-${c.id}`,
      kind: c.domain,
      label: c.title,
      severity: c.verdict === 'BLOCKED' || c.verdict === 'CRITICAL' ? 'CRITICAL' : c.verdict === 'WARNING' ? 'HIGH' : 'MEDIUM',
      evidence: c.evidence,
      reliefActions:
        c.domain === 'Capacity'
          ? strategy === 'OTIF_FIRST'
            ? ['Overtime', 'Partial shipment']
            : ['Alternate work center', 'Re-sequence low priority']
          : c.domain === 'Material'
            ? ['Raise purchase', 'Reallocate available lots']
            : c.domain === 'Quality'
              ? ['Clear holds', 'Rework before pack']
              : ['Review constraint evidence'],
    })
  }

  const shortMaterials = materials.filter((m) => m.shortfall > 0).slice(0, 5)
  for (const m of shortMaterials) {
    if (out.some((b) => b.label.includes(m.materialCode))) continue
    out.push({
      id: `bn-mat-${m.materialCode}`,
      kind: 'Material',
      label: `Short ${m.materialCode}`,
      severity: m.shortfall > m.availableQty ? 'CRITICAL' : 'HIGH',
      evidence: [`shortfall=${m.shortfall}`, `available=${m.availableQty}`],
      reliefActions: ['Purchasing suggestion', 'Delay dependent sequencing'],
    })
  }

  return out.slice(0, 20)
}
