import { Link } from 'react-router-dom'

import { DataTable, ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import { useMrpKpis, useMrpList } from '@/application/mrp/use-mrp'
import { useSizeSetList } from '@/application/planning/use-planning'
import { useDataList } from '@/hooks/use-data-list'

export function MrpPage() {
  const { data: allLines = [], isLoading } = useMrpList()
  const { data: kpisData } = useMrpKpis()

  const list = useDataList({
    data: allLines,
    searchFields: [
      (l) => l.orderNo,
      (l) => l.materialName,
      (l) => l.category,
      (l) => l.supplier,
    ],
    initialSort: { key: 'orderNo', direction: 'desc' },
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="MRP — Malzeme İhtiyaç Planı"
      description="Sipariş kaydı anında otomatik oluşan malzeme ihtiyaç planları."
      kpis={kpisData?.items ?? []}
      toolbar={
        <ErpToolbar
          searchPlaceholder="Sipariş, malzeme, tedarikçi ara..."
          searchValue={list.search}
          onSearchChange={list.setSearch}
        />
      }
      pagination={{
        page: list.page,
        totalPages: list.totalPages,
        pageSize: list.pageSize,
        totalCount: list.totalCount,
        onPageChange: list.setPage,
        onPageSizeChange: list.setPageSize,
        label: 'MRP satırı',
      }}
    >
      <div className="overflow-x-auto p-4 pt-6">
        <DataTable
          rowKey={(l) => l.id}
          data={list.paginated}
          columns={[
            {
              key: 'order',
              header: 'Sipariş',
              render: (l) => (
                <Link to={`/orders/${l.orderId}`} className="font-medium text-primary hover:underline">
                  {l.orderNo}
                </Link>
              ),
            },
            { key: 'material', header: 'Malzeme', render: (l) => l.materialName },
            { key: 'category', header: 'Kategori', render: (l) => l.category },
            { key: 'qty', header: 'Sipariş Adet', render: (l) => l.orderQty.toLocaleString('tr-TR') },
            {
              key: 'net',
              header: 'Net İhtiyaç',
              render: (l) => (
                <span className="font-medium tabular-nums">
                  {l.netRequired.toLocaleString('tr-TR')} {l.unit}
                </span>
              ),
            },
            { key: 'supplier', header: 'Tedarikçi', render: (l) => l.supplier },
            { key: 'lt', header: 'LT', render: (l) => `${l.leadTimeDays} gün` },
            {
              key: 'status',
              header: 'Durum',
              render: (l) => <StatusBadge label={l.status.label} tone={l.status.tone} />,
            },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function SizeSetsPage() {
  const { data: sizeSets = [], isLoading } = useSizeSetList()
  const list = useDataList({
    data: sizeSets,
    searchFields: [(s) => s.name, (s) => s.productType],
    initialSort: { key: 'name', direction: 'asc' },
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Beden Setleri"
      description="Ürün tipine göre beden set tanımları."
      kpis={[]}
      toolbar={<ErpToolbar searchPlaceholder="Set adı ara..." searchValue={list.search} onSearchChange={list.setSearch} />}
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
          rowKey={(s) => s.id}
          data={list.paginated}
          columns={[
            { key: 'name', header: 'Set Adı', render: (s) => s.name },
            { key: 'type', header: 'Ürün Tipi', render: (s) => s.productType },
            { key: 'sizes', header: 'Bedenler', render: (s) => s.sizes.join(', ') },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}
