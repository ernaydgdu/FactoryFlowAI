/**
 * Production sequencing + capacity / machine / operator / material allocation.
 * Read-only plan construction helpers.
 */
import { queryMachines, queryOperations } from '@/domain/brain/manufacturing-knowledge'
import type { ManufacturingReasoningRun } from '@/domain/brain/manufacturing-reasoning'
import { queryLatestMrpRun } from '@/domain/mrp/mrp-query.service'
import { buildProductionPlanningBrainSnapshot } from '@/domain/production-planning/production-planning-query'
import { queryAllProductionOrders } from '@/domain/production-order/production-order-query.service'

import type {
  CapacityAllocation,
  MachineAllocation,
  MaterialAllocation,
  OperatorAllocation,
  PlanVariant,
  ProductionSequenceStep,
} from './types'

export type PlanStrategyId = 'OTIF_FIRST' | 'EFFICIENCY_FIRST' | 'MATERIAL_CONSTRAINED'

export function strategyForVariant(variant: PlanVariant): PlanStrategyId {
  if (variant === 'A') return 'OTIF_FIRST'
  if (variant === 'B') return 'EFFICIENCY_FIRST'
  return 'MATERIAL_CONSTRAINED'
}

function remainingQty(po: ReturnType<typeof queryAllProductionOrders>[number]): number {
  return Math.max(0, po.plannedQty - po.producedQty)
}

export function buildSequencing(
  variant: PlanVariant,
  reasoning: ManufacturingReasoningRun,
): ProductionSequenceStep[] {
  const strategy = strategyForVariant(variant)
  const planning = buildProductionPlanningBrainSnapshot()
  const pos = queryAllProductionOrders().filter(
    (p) => p.status !== 'Closed' && p.status !== 'Cancelled' && p.status !== 'Completed',
  )
  const lateOrders = new Set(
    reasoning.facts
      .filter((f) => f.sourceModule === 'sales-order' && f.attributes.terminRisk === true)
      .map((f) => String(f.attributes.orderNo ?? f.label)),
  )
  const materialShort = new Set(
    reasoning.facts
      .filter((f) => f.sourceModule === 'mrp' && Number(f.attributes.netShortage) > 0)
      .map((f) => String(f.attributes.materialCode ?? '')),
  )

  type Ranked = {
    po: (typeof pos)[number]
    priority: number
    duration: number
  }

  const ranked: Ranked[] = pos.map((po) => {
    const rem = remainingQty(po)
    const terminScore = po.snapshots.planning.terminRiskScore ?? 0
    const lateBoost = lateOrders.has(po.salesOrderNo) ? 40 : 0
    const util =
      planning.workshops.find((w) => w.code === po.workshopCode)?.utilizationPercent ?? 50
    let priority = 50
    if (strategy === 'OTIF_FIRST') {
      priority = 100 - terminScore + lateBoost + (rem > 0 ? 5 : 0)
    } else if (strategy === 'EFFICIENCY_FIRST') {
      priority = 80 - util * 0.3 + (rem > 0 ? 10 : 0)
    } else {
      // Prefer orders whose workshop is freer and materials less constrained
      const materialPenalty = materialShort.size > 0 ? 15 : 0
      priority = 70 - materialPenalty + (100 - util) * 0.2
    }
    const duration = Math.max(1, Math.ceil(rem / Math.max(50, po.plannedQty / 7 || 50)))
    return { po, priority: Math.round(priority), duration }
  })

  ranked.sort((a, b) => b.priority - a.priority || a.po.productionOrderNo.localeCompare(b.po.productionOrderNo))

  let day = 0
  return ranked.slice(0, 40).map((r, idx) => {
    const step: ProductionSequenceStep = {
      sequence: idx + 1,
      productionOrderNo: r.po.productionOrderNo,
      salesOrderNo: r.po.salesOrderNo,
      productCode: r.po.productCode,
      workshopCode: r.po.workshopCode,
      operationHint: r.po.snapshots.operationRoute[0]?.name ?? 'Sew / Cut',
      plannedStartDayOffset: day,
      plannedDurationDays: r.duration,
      priority: r.priority,
      remainingQty: remainingQty(r.po),
    }
    // OTIF: overlap less; Efficiency: pack tighter; Material: stagger more
    const gap = strategy === 'MATERIAL_CONSTRAINED' ? r.duration : strategy === 'OTIF_FIRST' ? Math.max(1, Math.floor(r.duration * 0.7)) : Math.max(1, Math.floor(r.duration * 0.5))
    day += gap
    return step
  })
}

export function buildCapacityAllocation(sequencing: ProductionSequenceStep[]): CapacityAllocation[] {
  const planning = buildProductionPlanningBrainSnapshot()
  const byWs = new Map<string, { orders: number; qty: number }>()
  for (const s of sequencing) {
    const cur = byWs.get(s.workshopCode) ?? { orders: 0, qty: 0 }
    cur.orders += 1
    cur.qty += s.remainingQty
    byWs.set(s.workshopCode, cur)
  }

  return planning.workshops.map((w) => {
    const alloc = byWs.get(w.code) ?? { orders: 0, qty: 0 }
    const loadBump = Math.min(40, alloc.orders * 5 + Math.floor(alloc.qty / 500))
    return {
      workshopCode: w.code,
      workshopName: w.name,
      allocatedOrders: alloc.orders,
      allocatedQty: alloc.qty,
      utilizationBefore: w.utilizationPercent,
      utilizationAfter: Math.min(130, w.utilizationPercent + loadBump),
      freeCapacityBefore: w.freeCapacity,
    }
  })
}

export function buildMachineAllocation(sequencing: ProductionSequenceStep[]): MachineAllocation[] {
  const machines = queryMachines()
  const ops = queryOperations()
  const out: MachineAllocation[] = []
  for (const step of sequencing.slice(0, 20)) {
    const op = ops[step.sequence % ops.length]!
    const machineId = op.typicalMachines[0]
    const machine = machines.find((m) => m.id === machineId) ?? machines[step.sequence % machines.length]!
    const hours = Math.max(1, Math.round((step.remainingQty / Math.max(1, machine.capacityUnitsPerHour)) * 10) / 10)
    out.push({
      machineCode: machine.code,
      machineName: machine.name,
      operationCode: op.code,
      productionOrderNo: step.productionOrderNo,
      estimatedHours: hours,
    })
  }
  return out
}

export function buildOperatorAllocation(
  sequencing: ProductionSequenceStep[],
  capacity: CapacityAllocation[],
): OperatorAllocation[] {
  return capacity
    .filter((c) => c.allocatedOrders > 0)
    .map((c) => {
      const qty = sequencing
        .filter((s) => s.workshopCode === c.workshopCode)
        .reduce((s, x) => s + x.remainingQty, 0)
      const samMinutes = Math.round(qty * 0.8)
      const estimatedOperators = Math.max(1, Math.ceil(samMinutes / (8 * 60)))
      const shiftHint =
        c.utilizationAfter >= 100 ? 'Overtime / 2nd shift recommended' : 'Standard shift'
      return {
        workshopCode: c.workshopCode,
        estimatedOperators,
        samMinutes,
        shiftHint,
      }
    })
}

export function buildMaterialAllocation(): MaterialAllocation[] {
  const mrp = queryLatestMrpRun()
  const lines = mrp?.currentSnapshot.lines ?? []
  return lines
    .filter((l) => l.netRequirement > 0 || l.netShortage > 0)
    .slice(0, 30)
    .map((l) => ({
      materialCode: l.materialCode,
      materialName: l.materialName,
      requiredQty: l.grossRequirement,
      availableQty: l.availableStock + l.openPurchaseQty + l.openProductionQty,
      shortfall: Math.max(0, l.netShortage),
      unit: l.unit,
      reservedForOrders: l.orderBreakdown.slice(0, 5).map((o) => o.orderNo),
    }))
}
