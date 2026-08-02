import { KpiCards, type KpiItem } from '@/components/erp'

import type { OrderListKpis } from '../types'

type OrderKpiBarProps = {
  kpis: OrderListKpis
}

export function OrderKpiBar({ kpis }: OrderKpiBarProps) {
  const items: KpiItem[] = [
    { label: 'Toplam Sipariş', value: String(kpis.total), hint: 'Aktif portföy' },
    { label: 'Üretimde', value: String(kpis.inProduction), hint: 'Açık emirler' },
    {
      label: 'Termin Riski',
      value: String(kpis.terminRisk),
      hint: '7 gün içinde EXF',
    },
    { label: 'Tamamlanan', value: String(kpis.completed), hint: 'Sevk dahil' },
    { label: 'Bekleyen', value: String(kpis.waiting), hint: 'Planlama aşaması' },
  ]

  return <KpiCards items={items} columns={5} />
}
