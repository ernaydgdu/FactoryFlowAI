import type {
  CapacityAllocation,
  CapacityAllocationLine,
  WorkshopCapacitySnapshot,
  WorkshopDefinition,
} from '../../types/planning'
import { getWorkshopCapacitiesFromMasterData } from '../../master-data'

/**
 * Kapasite Motoru — sipariş adedini atölyelere dağıtır.
 * Atölye A: 5000 | Atölye B: 8000 | Atölye C: 3000
 */
export function allocateCapacity(
  requestedQty: number,
  workshops: WorkshopDefinition[] = getWorkshopCapacitiesFromMasterData(),
  orderId?: string,
  orderNo?: string,
): CapacityAllocation {
  const sorted = [...workshops].sort(
    (a, b) => b.monthlyCapacity - b.currentLoad - (a.monthlyCapacity - a.currentLoad),
  )

  let remaining = requestedQty
  const allocations: CapacityAllocationLine[] = []

  for (const ws of sorted) {
    if (remaining <= 0) break
    const available = Math.max(0, ws.monthlyCapacity - ws.currentLoad)
    const qty = Math.min(remaining, available)
    if (qty > 0) {
      allocations.push({
        workshopCode: ws.code,
        workshopName: ws.name,
        quantity: qty,
      })
      remaining -= qty
    }
  }

  return {
    orderId,
    orderNo,
    requestedQty,
    allocations,
    fullyAllocated: remaining === 0,
    unallocatedQty: remaining,
  }
}

/** Siparişi belirtilen atölyelere eşit dağıt — split production */
export function allocateCapacitySplit(
  requestedQty: number,
  workshopCodes: string[],
  orderId?: string,
  orderNo?: string,
  workshops: WorkshopDefinition[] = getWorkshopCapacitiesFromMasterData(),
): CapacityAllocation {
  const splitCount = workshopCodes.length
  const base = Math.floor(requestedQty / splitCount)
  const remainder = requestedQty % splitCount
  const allocations: CapacityAllocationLine[] = []

  for (let i = 0; i < workshopCodes.length; i++) {
    const ws = workshops.find((w) => w.code === workshopCodes[i])
    if (!ws) continue
    const qty = base + (i < remainder ? 1 : 0)
    allocations.push({
      workshopCode: ws.code,
      workshopName: ws.name,
      quantity: qty,
    })
  }

  const allocated = allocations.reduce((s, a) => s + a.quantity, 0)
  return {
    orderId,
    orderNo,
    requestedQty,
    allocations,
    fullyAllocated: allocated === requestedQty,
    unallocatedQty: requestedQty - allocated,
    isSplit: true,
    splitCount: allocations.length,
  }
}

export function getWorkshopCapacitySnapshots(
  workshops: WorkshopDefinition[] = getWorkshopCapacitiesFromMasterData(),
  pendingAllocations: CapacityAllocation[] = [],
): WorkshopCapacitySnapshot[] {
  const extraLoad = new Map<string, number>()
  for (const alloc of pendingAllocations) {
    for (const line of alloc.allocations) {
      extraLoad.set(line.workshopCode, (extraLoad.get(line.workshopCode) ?? 0) + line.quantity)
    }
  }

  return workshops.map((ws) => {
    const allocated = ws.currentLoad + (extraLoad.get(ws.code) ?? 0)
    const remaining = Math.max(0, ws.monthlyCapacity - allocated)
    return {
      code: ws.code,
      name: ws.name,
      monthlyCapacity: ws.monthlyCapacity,
      allocated,
      remaining,
      utilizationPercent: Math.round((allocated / ws.monthlyCapacity) * 100),
    }
  })
}

export function isCapacityFull(
  snapshots: WorkshopCapacitySnapshot[],
  thresholdPercent = 95,
): boolean {
  return snapshots.some((s) => s.utilizationPercent >= thresholdPercent)
}

/** Örnek: 7000 adet → A:5000 + B:2000 */
export function demoCapacityAllocation(): CapacityAllocation {
  return allocateCapacity(7000, getWorkshopCapacitiesFromMasterData(), 'demo', 'SIP-DEMO-7000')
}
