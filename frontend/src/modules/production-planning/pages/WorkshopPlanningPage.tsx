import { DataTable, ErpModuleShell } from '@/components/erp'
import { OrderProgressBar } from '@/modules/orders/components/OrderProgressBar'
import { useWorkshopPlanning } from '@/application/production-planning/use-production-planning'

export function WorkshopPlanningPage() {
  const { data = [], isLoading } = useWorkshopPlanning()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell title="Atölye Planlama" description="Fason atölye kapasite ve sipariş dağılımı" kpis={[
      { label: 'Atölye', value: String(data.length), hint: 'Aktif' },
      { label: 'Toplam Kapasite', value: data.reduce((s, w) => s + w.monthlyCapacity, 0).toLocaleString('tr-TR'), hint: 'Adet/ay' },
    ]}>
      <div className="p-4">
        <DataTable rowKey={(w) => w.code} data={data} columns={[
          { key: 'code', header: 'Kod', render: (w) => w.code },
          { key: 'name', header: 'Atölye', render: (w) => w.name },
          { key: 'loc', header: 'Konum', render: (w) => w.location },
          { key: 'cap', header: 'Kapasite', render: (w) => w.monthlyCapacity.toLocaleString('tr-TR') },
          { key: 'load', header: 'Yük', render: (w) => w.currentLoad.toLocaleString('tr-TR') },
          { key: 'free', header: 'Boş', render: (w) => w.freeCapacity.toLocaleString('tr-TR') },
          { key: 'orders', header: 'UE', render: (w) => String(w.assignedOrders) },
          { key: 'util', header: 'Doluluk', render: (w) => <OrderProgressBar value={w.utilizationPercent} /> },
        ]} />
      </div>
    </ErpModuleShell>
  )
}
