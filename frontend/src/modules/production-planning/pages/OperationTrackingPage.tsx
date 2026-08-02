import { DataTable, ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import { OrderProgressBar } from '@/modules/orders/components/OrderProgressBar'
import { useProductionOperationTracking } from '@/application/production-planning/use-production-planning'
import { useDataList } from '@/hooks/use-data-list'

export function OperationTrackingPage() {
  const { data = [], isLoading } = useProductionOperationTracking()
  const list = useDataList({
    data,
    searchFields: [(o) => o.orderNo, (o) => o.operationName, (o) => o.workshop],
    initialSort: { key: 'sequence', direction: 'asc' },
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell title="Operasyon Takibi" description="Operasyon bazlı ilerleme, fire ve rework" kpis={[
      { label: 'Operasyon', value: String(data.length), hint: 'Kayıt' },
    ]} toolbar={<ErpToolbar searchPlaceholder="Sipariş, operasyon ara..." searchValue={list.search} onSearchChange={list.setSearch} />} pagination={{ page: list.page, totalPages: list.totalPages, pageSize: list.pageSize, totalCount: list.totalCount, onPageChange: list.setPage, onPageSizeChange: list.setPageSize }}>
      <div className="p-4 pt-6">
        <DataTable rowKey={(o) => o.id} data={list.paginated} columns={[
          { key: 'seq', header: '#', render: (o) => o.sequence },
          { key: 'code', header: 'Kod', render: (o) => o.operationCode },
          { key: 'name', header: 'Operasyon', render: (o) => o.operationName },
          { key: 'order', header: 'Sipariş', render: (o) => o.orderNo },
          { key: 'ws', header: 'Atölye', render: (o) => o.workshop },
          { key: 'line', header: 'Hat', render: (o) => o.lineCode },
          { key: 'plan', header: 'Plan', render: (o) => o.plannedQty },
          { key: 'done', header: 'Tamamlanan', render: (o) => o.completedQty },
          { key: 'waste', header: 'Fire', render: (o) => o.wasteQty },
          { key: 'rework', header: 'Rework', render: (o) => o.reworkQty },
          { key: 'prog', header: 'İlerleme', render: (o) => <OrderProgressBar value={o.progressPercent} /> },
          { key: 'st', header: 'Durum', render: (o) => <StatusBadge label={o.status.label} tone={o.status.tone} /> },
        ]} />
      </div>
    </ErpModuleShell>
  )
}
