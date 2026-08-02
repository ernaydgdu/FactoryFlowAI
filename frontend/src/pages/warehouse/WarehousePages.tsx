import { Plus } from 'lucide-react'

import {
  DataTable,
  ErpModuleShell,
  ErpToolbar,
  StatusBadge,
} from '@/components/erp'
import { Button } from '@/components/ui/button'
import {
  useWarehouseCount,
  useWarehouseInbound,
  useWarehouseKpis,
  useWarehouseOutbound,
} from '@/application/warehouse/use-warehouse'
import { useDataList } from '@/hooks/use-data-list'

function WarehouseTransactionTable({
  data,
  searchPlaceholder,
}: {
  data: ReturnType<typeof useWarehouseInbound>['data']
  searchPlaceholder: string
}) {
  const list = useDataList({
    data: data ?? [],
    searchFields: [(r) => r.material, (r) => r.warehouse],
    initialSort: { key: 'date', direction: 'desc' },
  })

  return (
    <>
      <ErpToolbar
        searchPlaceholder={searchPlaceholder}
        searchValue={list.search}
        onSearchChange={list.setSearch}
        className="mb-4"
      />
      <DataTable
        rowKey={(r) => r.id}
        data={list.paginated}
        columns={[
          { key: 'date', header: 'Tarih', render: (r) => r.date },
          { key: 'type', header: 'Tip', render: (r) => r.type },
          { key: 'material', header: 'Malzeme', render: (r) => r.material },
          { key: 'qty', header: 'Miktar', render: (r) => `${r.qty.toLocaleString('tr-TR')} ${r.unit}` },
          { key: 'warehouse', header: 'Depo', render: (r) => r.warehouse },
          { key: 'status', header: 'Durum', render: (r) => <StatusBadge label={r.status.label} tone={r.status.tone} /> },
        ]}
      />
    </>
  )
}

export function WarehouseInboundPage() {
  const { data, isLoading } = useWarehouseInbound()
  const { data: kpisData } = useWarehouseKpis()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Mal Giriş"
      description="Tedarikçi mal kabul fişleri."
      kpis={kpisData?.items ?? []}
      headerActions={<Button size="sm"><Plus className="size-4" /> Yeni İşlem</Button>}
    >
      <div className="p-4 pt-6">
        <WarehouseTransactionTable data={data} searchPlaceholder="Malzeme, depo ara..." />
      </div>
    </ErpModuleShell>
  )
}

export function WarehouseOutboundPage() {
  const { data, isLoading } = useWarehouseOutbound()
  const { data: kpisData } = useWarehouseKpis()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell title="Mal Çıkış" description="Depo çıkış hareketleri." kpis={kpisData?.items ?? []}>
      <div className="p-4 pt-6">
        <WarehouseTransactionTable data={data} searchPlaceholder="Malzeme, depo ara..." />
      </div>
    </ErpModuleShell>
  )
}

export function WarehouseCountPage() {
  const { data, isLoading } = useWarehouseCount()
  const { data: kpisData } = useWarehouseKpis()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell title="Stok Sayım" description="Periyodik sayım kayıtları." kpis={kpisData?.items ?? []}>
      <div className="p-4 pt-6">
        <WarehouseTransactionTable data={data} searchPlaceholder="Malzeme, depo ara..." />
      </div>
    </ErpModuleShell>
  )
}
