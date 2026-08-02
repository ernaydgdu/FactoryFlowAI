import { Plus } from 'lucide-react'
import { useState } from 'react'

import {
  DataTable,
  ErpModuleShell,
  ErpToolbar,
  StatusBadge,
} from '@/components/erp'
import { Button } from '@/components/ui/button'
import {
  useFabricCardKpis,
  useFabricCardList,
  useFabricMovements,
  useFabricStock,
} from '@/application/fabric-card/use-fabric-card'
import { useDataList } from '@/hooks/use-data-list'

export function FabricCardsPage() {
  const [status, setStatus] = useState('all')
  const { data: fabricCards = [], isLoading } = useFabricCardList()
  const { data: kpisData } = useFabricCardKpis()

  const list = useDataList({
    data: fabricCards,
    searchFields: [(r) => r.code, (r) => r.name, (r) => r.supplier, (r) => r.color],
    filterFn: status === 'all' ? undefined : (r) => r.status.label === status,
    initialSort: { key: 'code', direction: 'asc' },
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Kumaş Kartları"
      description="Kumaş tanımları, kompozisyon, en, gramaj ve tedarikçi bilgileri."
      kpis={kpisData?.items ?? []}
      toolbar={
        <ErpToolbar
          searchPlaceholder="Kod, ad, tedarikçi, renk ara..."
          searchValue={list.search}
          onSearchChange={list.setSearch}
          filters={[
            {
              id: 'st',
              label: 'Durum',
              value: status,
              onChange: (v) => { setStatus(v); list.setPage(1) },
              options: [
                { label: 'Tümü', value: 'all' },
                { label: 'Aktif', value: 'Aktif' },
                { label: 'Pasif', value: 'Pasif' },
              ],
            },
          ]}
          actions={<Button size="sm"><Plus className="size-4" /> Yeni Kumaş Kartı</Button>}
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
      <div className="p-4 pt-6">
        <DataTable
          rowKey={(r) => r.id}
          data={list.paginated}
          columns={[
            { key: 'code', header: 'Kod', render: (r) => <span className="font-medium">{r.code}</span> },
            { key: 'name', header: 'Kumaş Adı', render: (r) => r.name },
            { key: 'composition', header: 'Kompozisyon', render: (r) => r.composition },
            { key: 'width', header: 'En', render: (r) => r.width },
            { key: 'weight', header: 'Gramaj', render: (r) => r.weight },
            { key: 'supplier', header: 'Tedarikçi', render: (r) => r.supplier },
            { key: 'color', header: 'Renk', render: (r) => r.color },
            {
              key: 'status',
              header: 'Durum',
              render: (r) => <StatusBadge label={r.status.label} tone={r.status.tone} />,
            },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function FabricStockPage() {
  const { data: fabricStock = [], isLoading } = useFabricStock()
  const list = useDataList({
    data: fabricStock,
    searchFields: [(r) => r.code, (r) => r.name, (r) => r.lot],
    initialSort: { key: 'code', direction: 'asc' },
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Kumaş Stok"
      description="Lot bazlı kumaş stok durumu."
      kpis={[]}
      toolbar={
        <ErpToolbar searchPlaceholder="Kod, ad, lot ara..." searchValue={list.search} onSearchChange={list.setSearch} />
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
      <div className="p-4 pt-6">
        <DataTable
          rowKey={(r) => r.id}
          data={list.paginated}
          columns={[
            { key: 'code', header: 'Kod', render: (r) => r.code },
            { key: 'name', header: 'Kumaş', render: (r) => r.name },
            { key: 'lot', header: 'Lot', render: (r) => r.lot },
            { key: 'qty', header: 'Miktar', render: (r) => `${r.availableQty.toLocaleString('tr-TR')} ${r.unit}` },
            { key: 'wh', header: 'Depo', render: (r) => r.warehouse },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function FabricMovementsPage() {
  const { data: fabricMovements = [], isLoading } = useFabricMovements()
  const list = useDataList({
    data: fabricMovements,
    searchFields: [(r) => r.material, (r) => r.reference],
    initialSort: { key: 'date', direction: 'desc' },
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Kumaş Hareketleri"
      description="Giriş/çıkış hareketleri."
      kpis={[]}
      toolbar={<ErpToolbar searchPlaceholder="Malzeme, referans ara..." searchValue={list.search} onSearchChange={list.setSearch} />}
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
            { key: 'date', header: 'Tarih', render: (r) => r.date },
            { key: 'type', header: 'Tip', render: (r) => r.type },
            { key: 'material', header: 'Malzeme', render: (r) => r.material },
            { key: 'qty', header: 'Miktar', render: (r) => `${r.qty} ${r.unit}` },
            { key: 'ref', header: 'Referans', render: (r) => r.reference },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}
