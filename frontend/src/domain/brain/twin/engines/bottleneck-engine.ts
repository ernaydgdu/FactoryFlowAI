/**
 * Bottleneck Engine — darboğaz tespiti.
 */
import { workshopRepository } from '../../../master-data'
import { OPERATIONAL_DASHBOARD } from '../../../data/workflows'
import type { FactoryGraph, Bottleneck } from '../types'

let bottleneckCounter = 0

export function detectBottlenecks(factoryGraph: FactoryGraph): Bottleneck[] {
  const bottlenecks: Bottleneck[] = []

  for (const w of workshopRepository.getActive()) {
    const utilization = w.monthlyCapacity > 0 ? (w.currentLoad / w.monthlyCapacity) * 100 : 0
    if (utilization > 85) {
      bottleneckCounter += 1
      bottlenecks.push({
        id: `bn-${bottleneckCounter}`,
        category: 'LINE_CAPACITY',
        severity: utilization > 95 ? 'CRITICAL' : 'HIGH',
        title: `Hat kapasitesi — ${w.name}`,
        description: `Atölye doluluk %${Math.round(utilization)}`,
        affectedNodeIds: factoryGraph.nodes.filter((n) => n.entityId === w.id).map((n) => n.id),
        affectedOrderIds: factoryGraph.nodes.filter((n) => n.type === 'ORDER').map((n) => n.entityId),
        estimatedDelayDays: utilization > 95 ? 5 : 2,
        sourceId: 'KPI_ENGINE',
      })
    }
  }

  for (const fabric of OPERATIONAL_DASHBOARD.criticalFabrics) {
    bottleneckCounter += 1
    bottlenecks.push({
      id: `bn-${bottleneckCounter}`,
      category: 'FABRIC_DELAY',
      severity: fabric.daysLeft <= 3 ? 'CRITICAL' : 'HIGH',
      title: `Kumaş gecikmesi — ${fabric.code}`,
      description: `${fabric.name}: ${fabric.daysLeft} gün kaldı`,
      affectedNodeIds: factoryGraph.nodes.filter((n) => n.type === 'MATERIAL').map((n) => n.id),
      affectedOrderIds: [],
      estimatedDelayDays: Math.max(0, 7 - fabric.daysLeft),
      sourceId: 'WORKFLOW',
    })
  }

  for (const risk of OPERATIONAL_DASHBOARD.terminRisk.filter((r) => r.blocker.includes('Kalite'))) {
    bottleneckCounter += 1
    bottlenecks.push({
      id: `bn-${bottleneckCounter}`,
      category: 'QUALITY_HOLD',
      severity: 'HIGH',
      title: `Kalite bekleme — ${risk.orderNo}`,
      description: risk.blocker,
      affectedNodeIds: factoryGraph.nodes.filter((n) => n.type === 'QUALITY_INSPECTION').map((n) => n.id),
      affectedOrderIds: [risk.orderNo],
      estimatedDelayDays: Math.max(0, 7 - risk.daysLeft),
      sourceId: 'TIMELINE',
    })
  }

  if (OPERATIONAL_DASHBOARD.delayedPurchases.length > 0) {
    bottleneckCounter += 1
    bottlenecks.push({
      id: `bn-${bottleneckCounter}`,
      category: 'ACCESSORY_DELAY',
      severity: 'MEDIUM',
      title: 'Satın alma gecikmesi',
      description: `${OPERATIONAL_DASHBOARD.delayedPurchases.length} PO termin aşımında`,
      affectedNodeIds: factoryGraph.nodes.filter((n) => n.type === 'PURCHASE_ORDER').map((n) => n.id),
      affectedOrderIds: [],
      estimatedDelayDays: OPERATIONAL_DASHBOARD.delayedPurchases[0]?.daysLate ?? 3,
      sourceId: 'WORKFLOW',
    })
  }

  const machineCount = factoryGraph.nodes.filter((n) => n.type === 'MACHINE').length
  const lineCount = factoryGraph.nodes.filter((n) => n.type === 'PRODUCTION_LINE').length
  if (lineCount > 0 && machineCount / lineCount < 2) {
    bottleneckCounter += 1
    bottlenecks.push({
      id: `bn-${bottleneckCounter}`,
      category: 'MACHINE_FAILURE',
      severity: 'MEDIUM',
      title: 'Makine yedek kapasitesi düşük',
      description: 'Hat başına makine sayısı yetersiz — arıza riski',
      affectedNodeIds: factoryGraph.nodes.filter((n) => n.type === 'MACHINE').map((n) => n.id),
      affectedOrderIds: [],
      estimatedDelayDays: 1,
      sourceId: 'MASTER_DATA',
    })
  }

  return bottlenecks.sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
}

function severityRank(s: Bottleneck['severity']): number {
  return { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[s]
}

export function getPrimaryBottleneck(bottlenecks: Bottleneck[]): Bottleneck | undefined {
  return bottlenecks[0]
}
