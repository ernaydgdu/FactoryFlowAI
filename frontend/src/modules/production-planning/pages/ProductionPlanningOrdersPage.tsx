import { DataTable, ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import { OrderProgressBar } from '@/modules/orders/components/OrderProgressBar'
import { useProductionPlanningOrders } from '@/application/production-planning/use-production-planning'
import { useDataList } from '@/hooks/use-data-list'

export function ProductionPlanningOrdersPage() {
  const { data: orders = [], isLoading } = useProductionPlanningOrders()
  const list = useDataList({
    data: orders,
    searchFields: [(o) => o.productionOrderNo, (o) => o.salesOrderNo, (o) => o.productCode, (o) => o.customer],
    initialSort: { key: 'productionOrderNo', direction: 'desc' },
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  const kpis = [
    { label: 'UE', value: String(orders.length), hint: 'Aktif' },
    { label: 'Üretimde', value: String(orders.filter((o) => o.status.label === 'Devam Ediyor').length), hint: '' },
    { label: 'Termin Risk', value: String(orders.filter((o) => o.terminRisk).length), hint: '' },
    { label: 'Ort. İlerleme', value: `%${Math.round(orders.reduce((s, o) => s + o.progress, 0) / Math.max(1, orders.length))}`, hint: '' },
  ]

  return (
    <ErpModuleShell
      title="Üretim Emirleri"
      description="Tam tekstil UE detayı — sipariş, müşteri, atölye, hat, miktarlar"
      kpis={kpis}
      toolbar={<ErpToolbar searchPlaceholder="UE, sipariş, ürün ara..." searchValue={list.search} onSearchChange={list.setSearch} />}
      pagination={{ page: list.page, totalPages: list.totalPages, pageSize: list.pageSize, totalCount: list.totalCount, onPageChange: list.setPage, onPageSizeChange: list.setPageSize }}
    >
      <div className="overflow-x-auto p-4 pt-6">
        <DataTable
          rowKey={(o) => o.id}
          data={list.paginated}
          columns={[
            { key: 'ue', header: 'UE No', render: (o) => <span className="font-medium">{o.productionOrderNo}</span> },
            { key: 'so', header: 'Sipariş', render: (o) => o.salesOrderNo },
            { key: 'product', header: 'Ürün', render: (o) => o.productCode },
            { key: 'customer', header: 'Müşteri', render: (o) => o.customer },
            { key: 'buyer', header: 'Buyer', render: (o) => o.buyer },
            { key: 'workshop', header: 'Atölye', render: (o) => o.workshop },
            { key: 'line', header: 'Hat', render: (o) => o.lineCode },
            { key: 'plan', header: 'Plan', render: (o) => o.plannedQty.toLocaleString('tr-TR') },
            { key: 'prod', header: 'Üretilen', render: (o) => o.producedQty.toLocaleString('tr-TR') },
            { key: 'rem', header: 'Kalan', render: (o) => o.remainingQty.toLocaleString('tr-TR') },
            { key: 'rework', header: 'Rework', render: (o) => o.reworkQty },
            { key: 'reject', header: 'Red', render: (o) => o.rejectQty },
            { key: '2nd', header: '2.Kalite', render: (o) => o.secondQualityQty },
            { key: 'fire', header: 'Fire', render: (o) => o.fireQty },
            { key: 'start', header: 'Başlangıç', render: (o) => o.startDate },
            { key: 'finish', header: 'Bitiş', render: (o) => o.finishDate },
            { key: 'progress', header: 'İlerleme', render: (o) => <OrderProgressBar value={o.progress} /> },
            { key: 'status', header: 'Durum', render: (o) => <StatusBadge label={o.status.label} tone={o.status.tone} /> },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}
