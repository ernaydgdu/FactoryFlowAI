import { DataTable, ErpModuleShell } from '@/components/erp'
import { OrderProgressBar } from '@/modules/orders/components/OrderProgressBar'
import { useLinePlanning } from '@/application/production-planning/use-production-planning'

export function LinePlanningPage() {
  const { data = [], isLoading } = useLinePlanning()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell title="Hat Planlama" description="Üretim hattı kapasite, verim ve aktif siparişler" kpis={[
      { label: 'Hat', value: String(data.length), hint: 'Aktif' },
      { label: 'Ort. Verim', value: `%${Math.round(data.reduce((s, l) => s + l.efficiency, 0) / Math.max(1, data.length))}`, hint: '' },
    ]}>
      <div className="p-4">
        <DataTable rowKey={(l) => l.id} data={data} columns={[
          { key: 'code', header: 'Hat', render: (l) => l.code },
          { key: 'name', header: 'Ad', render: (l) => l.name },
          { key: 'ws', header: 'Atölye', render: (l) => l.workshop },
          { key: 'cap', header: 'Günlük Kap.', render: (l) => l.capacityPerDay },
          { key: 'load', header: 'Yük', render: (l) => <OrderProgressBar value={l.loadPercent} /> },
          { key: 'eff', header: 'Verim', render: (l) => `%${l.efficiency}` },
          { key: 'orders', header: 'Aktif Sipariş', render: (l) => l.activeOrders.join(', ') || '—' },
        ]} />
      </div>
    </ErpModuleShell>
  )
}
