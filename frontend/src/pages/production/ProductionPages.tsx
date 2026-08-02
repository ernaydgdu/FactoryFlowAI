import { Plus } from 'lucide-react'

import {
  DataTable,
  ErpModuleShell,
  ErpToolbar,
  StatusBadge,
} from '@/components/erp'
import { OrderProgressBar } from '@/modules/orders/components/OrderProgressBar'
import { Button } from '@/components/ui/button'
import {
  useProductionKpis,
  useProductionLines,
  useProductionOperations,
  useProductionOrderList,
} from '@/application/production-order/use-production-order'
import { useDataList } from '@/hooks/use-data-list'

export function ProductionOrdersPage() {
  const { data: productionOrders = [], isLoading } = useProductionOrderList()
  const { data: kpisData } = useProductionKpis()

  const list = useDataList({
    data: productionOrders,
    searchFields: [(r) => r.workOrderNo, (r) => r.orderNo, (r) => r.productCode, (r) => r.workshop],
    initialSort: { key: 'workOrderNo', direction: 'desc' },
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Üretim Emirleri"
      description="Siparişten otomatik oluşan üretim emirleri — BOM rezervasyonu ve ilerleme takibi."
      kpis={kpisData?.items ?? []}
      toolbar={
        <ErpToolbar
          searchPlaceholder="UE no, sipariş, model ara..."
          searchValue={list.search}
          onSearchChange={list.setSearch}
          actions={<Button size="sm"><Plus className="size-4" /> Siparişten UE Oluştur</Button>}
        />
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
          rowKey={(r) => r.id}
          data={list.paginated}
          columns={[
            { key: 'workOrderNo', header: 'UE No', render: (r) => <span className="font-medium">{r.workOrderNo}</span> },
            { key: 'orderNo', header: 'Sipariş', render: (r) => r.orderNo },
            { key: 'style', header: 'Model', render: (r) => r.productCode },
            { key: 'quantity', header: 'Plan', render: (r) => r.plannedQty.toLocaleString('tr-TR') },
            { key: 'produced', header: 'Üretilen', render: (r) => r.producedQty.toLocaleString('tr-TR') },
            { key: 'factory', header: 'Atölye', render: (r) => r.workshop },
            { key: 'progress', header: 'İlerleme', render: (r) => <OrderProgressBar value={r.progress} /> },
            { key: 'status', header: 'Durum', render: (r) => <StatusBadge label={r.status.label} tone={r.status.tone} /> },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function ProductionLinesPage() {
  const { data: productionLines = [], isLoading } = useProductionLines()
  const { data: kpisData } = useProductionKpis()

  const list = useDataList({
    data: productionLines,
    searchFields: [(r) => r.code, (r) => r.name, (r) => r.workshop],
    initialSort: { key: 'code', direction: 'asc' },
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Hat Planlama"
      description="Üretim hatları, kapasite ve verimlilik takibi."
      kpis={kpisData?.items ?? []}
      toolbar={<ErpToolbar searchPlaceholder="Hat kodu, atölye ara..." searchValue={list.search} onSearchChange={list.setSearch} />}
      pagination={{
        page: list.page,
        totalPages: list.totalPages,
        pageSize: list.pageSize,
        totalCount: list.totalCount,
        onPageChange: list.setPage,
        onPageSizeChange: list.setPageSize,
      }}
    >
      <div className="p-4 pt-6">
        <DataTable
          rowKey={(r) => r.id}
          data={list.paginated}
          columns={[
            { key: 'code', header: 'Hat Kodu', render: (r) => r.code },
            { key: 'name', header: 'Hat Adı', render: (r) => r.name },
            { key: 'workshop', header: 'Atölye', render: (r) => r.workshop },
            { key: 'capacity', header: 'Kapasite/Gün', render: (r) => r.capacity.toLocaleString('tr-TR') },
            { key: 'load', header: 'Yük %', render: (r) => `%${r.load}` },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function ProductionOperationsPage() {
  const { data: productionOperations = [], isLoading } = useProductionOperations()
  const { data: kpisData } = useProductionKpis()

  const list = useDataList({
    data: productionOperations,
    searchFields: [(r) => r.code, (r) => r.name, (r) => r.workshop],
    initialSort: { key: 'sequence', direction: 'asc' },
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Operasyon Takibi"
      description="Operasyon bazlı ilerleme ve verimlilik."
      kpis={kpisData?.items ?? []}
      toolbar={<ErpToolbar searchPlaceholder="Operasyon ara..." searchValue={list.search} onSearchChange={list.setSearch} />}
      pagination={{
        page: list.page,
        totalPages: list.totalPages,
        pageSize: list.pageSize,
        totalCount: list.totalCount,
        onPageChange: list.setPage,
        onPageSizeChange: list.setPageSize,
      }}
    >
      <div className="p-4 pt-6">
        <DataTable
          rowKey={(r) => r.id}
          data={list.paginated}
          columns={[
            { key: 'seq', header: '#', render: (r) => r.sequence },
            { key: 'code', header: 'Kod', render: (r) => r.code },
            { key: 'name', header: 'Operasyon', render: (r) => r.name },
            { key: 'workshop', header: 'Atölye', render: (r) => r.workshop },
            { key: 'progress', header: 'İlerleme', render: (r) => <OrderProgressBar value={r.progress} /> },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}
