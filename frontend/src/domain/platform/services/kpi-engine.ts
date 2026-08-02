import { SALES_ORDERS } from '../../data/orders'
import { STOCK_CARDS } from '../../data/stock-cards'
import { getWorkshopCapacitiesFromMasterData } from '../../master-data'
import type { KpiDetail, KpiSnapshot } from '../types'

const REFERENCE = new Date('2026-08-02')

export function calculateKpiSnapshot(referenceDate: Date = REFERENCE): KpiSnapshot {
  const activeOrders = SALES_ORDERS.filter(
    (o) => o.productionStatus !== 'Sevk Edildi' && o.productionStatus !== 'Tamamlandı',
  )
  const terminRisk = SALES_ORDERS.filter((o) => o.terminRisk)
  const workshops = getWorkshopCapacitiesFromMasterData()

  const totalCapacity = workshops.reduce((s, w) => s + w.monthlyCapacity, 0)
  const totalLoad = workshops.reduce((s, w) => s + w.currentLoad, 0)
  const capacityUtilization =
    totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0

  const totalPlanned = SALES_ORDERS.reduce((s, o) => s + o.production.plannedQty, 0)
  const totalProduced = SALES_ORDERS.reduce((s, o) => s + o.production.producedQty, 0)
  const totalWaste = SALES_ORDERS.reduce((s, o) => s + o.production.wasteQty, 0)

  const productionEfficiency =
    totalPlanned > 0 ? Math.round((totalProduced / totalPlanned) * 100) : 0
  const wasteRate =
    totalProduced > 0 ? Math.round((totalWaste / totalProduced) * 1000) / 10 : 0

  const avgStock = STOCK_CARDS.reduce((s, c) => s + c.availableQty, 0) / Math.max(STOCK_CARDS.length, 1)
  const monthlyConsumption = activeOrders.reduce(
    (s, o) => s + o.matrixTotals.grandTotal * 1.55,
    0,
  )
  const stockTurnoverDays =
    monthlyConsumption > 0 ? Math.round((avgStock / (monthlyConsumption / 30)) * 10) / 10 : 0

  const delayedOrders = terminRisk.length
  const averageDelayDays =
    delayedOrders > 0
      ? Math.round(
          terminRisk.reduce((s, o) => {
            const exf = new Date(o.general.exf)
            return s + Math.max(0, Math.ceil((REFERENCE.getTime() - exf.getTime()) / 86400000))
          }, 0) / delayedOrders,
        )
      : 0

  const workshopEfficiency = Math.round(
    workshops.reduce((s, w) => s + (w.currentLoad / w.monthlyCapacity) * 100, 0) / workshops.length,
  )

  return {
    generatedAt: referenceDate.toISOString(),
    activeOrders: activeOrders.length,
    terminRiskCount: terminRisk.length,
    terminRiskPercent:
      SALES_ORDERS.length > 0
        ? Math.round((terminRisk.length / SALES_ORDERS.length) * 100)
        : 0,
    capacityUtilization,
    workshopEfficiency,
    stockTurnoverDays,
    wasteRate,
    productionEfficiency,
    averageDelayDays,
  }
}

export function getKpiDetails(snapshot: KpiSnapshot): KpiDetail[] {
  return [
    {
      key: 'activeOrders',
      label: 'Aktif Sipariş',
      value: snapshot.activeOrders,
      unit: 'adet',
      trend: 'neutral',
      hint: 'Sevk edilmemiş siparişler',
    },
    {
      key: 'terminRiskCount',
      label: 'Termin Riski',
      value: snapshot.terminRiskCount,
      unit: 'sipariş',
      trend: snapshot.terminRiskCount > 5 ? 'up' : 'down',
      hint: `%${snapshot.terminRiskPercent} portföy riski`,
    },
    {
      key: 'capacityUtilization',
      label: 'Doluluk',
      value: snapshot.capacityUtilization,
      unit: '%',
      trend: snapshot.capacityUtilization > 90 ? 'up' : 'neutral',
      hint: 'Atölye kapasite kullanımı',
    },
    {
      key: 'workshopEfficiency',
      label: 'Atölye Verimi',
      value: snapshot.workshopEfficiency,
      unit: '%',
      trend: snapshot.workshopEfficiency >= 80 ? 'up' : 'down',
      hint: 'Ortalama hat verimi',
    },
    {
      key: 'stockTurnoverDays',
      label: 'Stok Devir Hızı',
      value: snapshot.stockTurnoverDays,
      unit: 'gün',
      trend: snapshot.stockTurnoverDays > 30 ? 'down' : 'up',
      hint: 'Ortalama stok devir süresi',
    },
    {
      key: 'wasteRate',
      label: 'Fire Oranı',
      value: snapshot.wasteRate,
      unit: '%',
      trend: snapshot.wasteRate > 5 ? 'up' : 'down',
      hint: 'Üretim fire oranı',
    },
    {
      key: 'productionEfficiency',
      label: 'Üretim Verimi',
      value: snapshot.productionEfficiency,
      unit: '%',
      trend: snapshot.productionEfficiency >= 85 ? 'up' : 'down',
      hint: 'Plan vs gerçekleşen',
    },
    {
      key: 'averageDelayDays',
      label: 'Ortalama Gecikme',
      value: snapshot.averageDelayDays,
      unit: 'gün',
      trend: snapshot.averageDelayDays > 3 ? 'up' : 'down',
      hint: 'Termin riski siparişlerde',
    },
  ]
}

export function getDashboardKpis(referenceDate?: Date): { snapshot: KpiSnapshot; details: KpiDetail[] } {
  const snapshot = calculateKpiSnapshot(referenceDate)
  return { snapshot, details: getKpiDetails(snapshot) }
}
