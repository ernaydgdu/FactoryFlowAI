import { OPERATIONAL_DASHBOARD } from '../data/workflows'
import { getDashboardKpis } from '../platform/services/kpi-engine'

export type DashboardStatCard = {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
}

export function getDashboardStatCards(): DashboardStatCard[] {
  const { snapshot } = getDashboardKpis()
  const criticalCount =
    OPERATIONAL_DASHBOARD.criticalFabrics.length +
    OPERATIONAL_DASHBOARD.criticalAccessories.length

  return [
    {
      label: 'Aktif Siparişler',
      value: String(snapshot.activeOrders),
      change: `${snapshot.activeOrders} sipariş üretimde`,
      trend: 'up',
    },
    {
      label: 'Günlük Üretim',
      value: `${snapshot.productionEfficiency}%`,
      change: `Plan vs gerçekleşen verim`,
      trend: snapshot.productionEfficiency >= 85 ? 'up' : 'down',
    },
    {
      label: 'Hat Verimliliği',
      value: `%${snapshot.workshopEfficiency}`,
      change: `Kapasite kullanımı %${snapshot.capacityUtilization}`,
      trend: snapshot.workshopEfficiency >= 80 ? 'up' : 'down',
    },
    {
      label: 'Kritik Stok',
      value: String(criticalCount),
      change: `${OPERATIONAL_DASHBOARD.criticalFabrics.length} kumaş, ${OPERATIONAL_DASHBOARD.criticalAccessories.length} aksesuar`,
      trend: criticalCount > 5 ? 'down' : 'neutral',
    },
    {
      label: 'Termin Riski',
      value: String(snapshot.terminRiskCount),
      change: `Portföyün %${snapshot.terminRiskPercent}'i riskli`,
      trend: snapshot.terminRiskCount > 5 ? 'down' : 'neutral',
    },
  ]
}
