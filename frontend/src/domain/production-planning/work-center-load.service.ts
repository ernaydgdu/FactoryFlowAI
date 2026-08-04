/**
 * Work Center Load — hat / atölye bazında zaman fazlı yük görünümü.
 * Scheduling engine çıktısını iş merkezi perspektifine toplar; yeni bir
 * persistence portu kullanmaz (P17 master-data + türetilmiş çizelge).
 */
import { productionLineRepository, workshopRepository } from '@/domain/master-data'

import type { ScheduleResult, WorkCenterLoadBucket } from './planning.types'

export type LineLoadSummary = {
  lineCode: string
  lineName: string
  workshopCode: string
  workshopName: string
  capacityPerDay: number
  horizonCapacity: number
  totalLoad: number
  utilizationPercent: number
  overloadedDays: number
  activeOrderNos: string[]
  buckets: WorkCenterLoadBucket[]
}

export function buildWorkCenterLoad(schedule: ScheduleResult): LineLoadSummary[] {
  const workingDayCount = schedule.days.filter((d) => d.isWorkingDay).length
  const byLine = new Map<string, WorkCenterLoadBucket[]>()
  for (const bucket of schedule.buckets) {
    const list = byLine.get(bucket.lineCode) ?? []
    list.push(bucket)
    byLine.set(bucket.lineCode, list)
  }

  const workshopsById = new Map(workshopRepository.getAll().map((w) => [w.id, w]))

  const summaries: LineLoadSummary[] = []
  for (const line of productionLineRepository.getActive()) {
    const buckets = byLine.get(line.code) ?? []
    const capacityPerDay = line.capacityPerDay > 0 ? line.capacityPerDay : 0
    const horizonCapacity = capacityPerDay * workingDayCount
    const totalLoad = Math.round(buckets.reduce((sum, b) => sum + b.loadQty, 0) * 100) / 100
    const workshop = workshopsById.get(line.workshopId)
    const orderNos = new Set<string>()
    for (const b of buckets) for (const o of b.orders) orderNos.add(o.productionOrderNo)

    summaries.push({
      lineCode: line.code,
      lineName: line.name,
      workshopCode: workshop?.code ?? '—',
      workshopName: workshop?.name ?? '—',
      capacityPerDay,
      horizonCapacity,
      totalLoad,
      utilizationPercent: horizonCapacity > 0 ? Math.round((totalLoad / horizonCapacity) * 100) : 0,
      overloadedDays: buckets.filter((b) => b.overloaded).length,
      activeOrderNos: [...orderNos].sort(),
      buckets: buckets.slice().sort((a, b) => a.date.localeCompare(b.date)),
    })
  }

  // Master-data'da olmayan ama emirlerde geçen hatlar da görünür olsun
  for (const [lineCode, buckets] of byLine) {
    if (summaries.some((s) => s.lineCode === lineCode)) continue
    const totalLoad = Math.round(buckets.reduce((sum, b) => sum + b.loadQty, 0) * 100) / 100
    const capacityPerDay = buckets[0]?.capacityQty ?? 0
    const horizonCapacity = capacityPerDay * workingDayCount
    const orderNos = new Set<string>()
    for (const b of buckets) for (const o of b.orders) orderNos.add(o.productionOrderNo)
    summaries.push({
      lineCode,
      lineName: buckets[0]?.lineName ?? lineCode,
      workshopCode: '—',
      workshopName: '—',
      capacityPerDay,
      horizonCapacity,
      totalLoad,
      utilizationPercent: horizonCapacity > 0 ? Math.round((totalLoad / horizonCapacity) * 100) : 0,
      overloadedDays: buckets.filter((b) => b.overloaded).length,
      activeOrderNos: [...orderNos].sort(),
      buckets: buckets.slice().sort((a, b) => a.date.localeCompare(b.date)),
    })
  }

  return summaries.sort((a, b) => a.lineCode.localeCompare(b.lineCode))
}
