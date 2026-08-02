import { Link } from 'react-router-dom'

import { DataTable, ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { OrderProgressBar } from '@/modules/orders/components/OrderProgressBar'
import {
  useProductionOrderLifecycleDashboard,
  useProductionOrderLifecycleList,
} from '@/application/production-order-lifecycle/use-production-order-lifecycle'
import { useDataList } from '@/hooks/use-data-list'

export function ProductionOrderLifecycleListPage() {
  const { data: dashboard } = useProductionOrderLifecycleDashboard()
  const { data: orders = [], isLoading } = useProductionOrderLifecycleList()
  const list = useDataList({
    data: orders,
    searchFields: [
      (o) => o.productionOrderNo,
      (o) => o.salesOrderNo,
      (o) => o.productCode,
      (o) => o.customer,
      (o) => o.workshop,
    ],
    initialSort: { key: 'productionOrderNo', direction: 'desc' },
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Üretim Emirleri"
      description="Tam lifecycle — snapshot, BR geçişleri, günlük üretim"
      kpis={dashboard?.kpis ?? []}
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <ErpToolbar
            searchPlaceholder="UE, sipariş, ürün ara..."
            searchValue={list.search}
            onSearchChange={list.setSearch}
          />
          <Button size="sm" asChild>
            <Link to="/production-order-lifecycle/create">Siparişten Oluştur</Link>
          </Button>
        </div>
      }
      pagination={{
        page: list.page,
        totalPages: list.totalPages,
        pageSize: list.pageSize,
        totalCount: list.totalCount,
        onPageChange: list.setPage,
        onPageSizeChange: list.setPageSize,
      }}
    >
      <div className="overflow-x-auto p-4 pt-6">
        <DataTable
          rowKey={(o) => o.id}
          data={list.paginated}
          columns={[
            {
              key: 'ue',
              header: 'UE No',
              render: (o) => (
                <Link
                  to={`/production-order-lifecycle/orders/${o.productionOrderNo}`}
                  className="font-medium text-primary hover:underline"
                >
                  {o.productionOrderNo}
                </Link>
              ),
            },
            { key: 'so', header: 'Sipariş', render: (o) => o.salesOrderNo },
            { key: 'product', header: 'Ürün', render: (o) => o.productCode },
            { key: 'customer', header: 'Müşteri', render: (o) => o.customer },
            { key: 'buyer', header: 'Buyer', render: (o) => o.buyer },
            { key: 'workshop', header: 'Atölye', render: (o) => o.workshop },
            { key: 'line', header: 'Hat', render: (o) => o.lineCode },
            { key: 'plan', header: 'Plan', render: (o) => o.plannedQty.toLocaleString('tr-TR') },
            { key: 'prod', header: 'Üretilen', render: (o) => o.producedQty.toLocaleString('tr-TR') },
            { key: 'rem', header: 'Kalan', render: (o) => o.remainingQty.toLocaleString('tr-TR') },
            { key: 'priority', header: 'Öncelik', render: (o) => o.priority },
            { key: 'revision', header: 'Rev', render: (o) => o.revision },
            { key: 'progress', header: 'İlerleme', render: (o) => <OrderProgressBar value={o.progress} /> },
            { key: 'status', header: 'Durum', render: (o) => <StatusBadge label={o.status.label} tone={o.status.tone} /> },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}
