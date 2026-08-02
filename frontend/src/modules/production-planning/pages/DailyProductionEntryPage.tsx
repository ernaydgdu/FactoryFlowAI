import { DataTable, ErpModuleShell, ErpToolbar } from '@/components/erp'
import { useDailyProductionEntry } from '@/application/production-planning/use-production-planning'
import { useDataList } from '@/hooks/use-data-list'

export function DailyProductionEntryPage() {
  const { data = [], isLoading } = useDailyProductionEntry()
  const list = useDataList({
    data,
    searchFields: [(e) => e.orderNo, (e) => e.lineCode, (e) => e.operator],
    initialSort: { key: 'date', direction: 'desc' },
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Günlük Üretim Girişi"
      description="Plan, gerçek, fire, rework, eksik ve ikinci kalite"
      kpis={[
        { label: 'Kayıt', value: String(data.length), hint: 'Bugün' },
        { label: 'Toplam Üretim', value: data.reduce((s, e) => s + e.actualQty, 0).toLocaleString('tr-TR'), hint: 'Adet' },
      ]}
      toolbar={<ErpToolbar searchPlaceholder="Sipariş, hat, operatör ara..." searchValue={list.search} onSearchChange={list.setSearch} />}
      pagination={{ page: list.page, totalPages: list.totalPages, pageSize: list.pageSize, totalCount: list.totalCount, onPageChange: list.setPage, onPageSizeChange: list.setPageSize }}
    >
      <div className="overflow-x-auto p-4 pt-6">
        <DataTable rowKey={(e) => e.id} data={list.paginated} columns={[
          { key: 'date', header: 'Tarih', render: (e) => e.date },
          { key: 'line', header: 'Hat', render: (e) => e.lineCode },
          { key: 'order', header: 'Sipariş', render: (e) => e.orderNo },
          { key: 'op', header: 'Operasyon', render: (e) => e.operation },
          { key: 'plan', header: 'Plan', render: (e) => e.plannedQty },
          { key: 'actual', header: 'Gerçek', render: (e) => e.actualQty },
          { key: 'fire', header: 'Fire', render: (e) => e.fireQty },
          { key: 'rework', header: 'Rework', render: (e) => e.reworkQty },
          { key: 'missing', header: 'Eksik', render: (e) => e.missingQty },
          { key: '2nd', header: '2.Kalite', render: (e) => e.secondQualityQty },
          { key: 'operator', header: 'Operatör', render: (e) => e.operator },
          { key: 'shift', header: 'Vardiya', render: (e) => e.shift },
          { key: 'eff', header: 'Verim', render: (e) => `%${e.efficiency}` },
        ]} />
      </div>
    </ErpModuleShell>
  )
}
