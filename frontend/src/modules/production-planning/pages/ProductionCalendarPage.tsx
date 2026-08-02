import { DataTable, ErpModuleShell } from '@/components/erp'
import { useProductionCalendar } from '@/application/production-planning/use-production-planning'

export function ProductionCalendarPage() {
  const { data = [], isLoading } = useProductionCalendar()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell title="Üretim Takvimi" description="5 günlük kesim, dikim ve sevkiyat planı" kpis={[]}>
      <div className="p-4">
        <DataTable
          rowKey={(r) => r.date}
          data={data}
          columns={[
            { key: 'date', header: 'Tarih', render: (r) => r.date },
            { key: 'cut', header: 'Kesim Emri', render: (r) => String(r.cutting) },
            { key: 'sew', header: 'Dikim Hattı', render: (r) => String(r.sewing) },
            { key: 'ship', header: 'Sevkiyat', render: (r) => String(r.shipping) },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}
