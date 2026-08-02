import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  DataTable,
  ErpModuleShell,
  ErpToolbar,
  StatusBadge,
} from '@/components/erp'
import { Button } from '@/components/ui/button'
import {
  useAccessoryCardKpis,
  useAccessoryCardList,
  useAccessoryStock,
} from '@/application/accessory-card/use-accessory-card'
import { useDataList } from '@/hooks/use-data-list'

export function AccessoryCardsPage() {
  const [category, setCategory] = useState('all')
  const { data: accessoryCards = [], isLoading } = useAccessoryCardList()
  const { data: kpisData } = useAccessoryCardKpis()

  const categories = useMemo(
    () => [...new Set(accessoryCards.map((c) => c.category))],
    [accessoryCards],
  )

  const list = useDataList({
    data: accessoryCards,
    searchFields: [(r) => r.code, (r) => r.name, (r) => r.category, (r) => r.supplier],
    filterFn: category === 'all' ? undefined : (r) => r.category === category,
    initialSort: { key: 'code', direction: 'asc' },
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Aksesuar Kartları"
      description="Kategoriye göre dinamik alanlar — fermuar, düğme, iplik, etiket tanımları."
      kpis={kpisData?.items ?? []}
      toolbar={
        <ErpToolbar
          searchPlaceholder="Kod, ad, kategori ara..."
          searchValue={list.search}
          onSearchChange={list.setSearch}
          filters={[
            {
              id: 'cat',
              label: 'Kategori',
              value: category,
              onChange: (v) => { setCategory(v); list.setPage(1) },
              options: [
                { label: 'Tümü', value: 'all' },
                ...categories.map((c) => ({ label: c, value: c })),
              ],
            },
          ]}
          actions={<Button size="sm"><Plus className="size-4" /> Yeni Aksesuar</Button>}
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
            { key: 'code', header: 'Kod', render: (r) => <span className="font-medium">{r.code}</span> },
            { key: 'name', header: 'Ad', render: (r) => r.name },
            {
              key: 'category',
              header: 'Kategori',
              render: (r) => <StatusBadge label={r.category} tone="default" />,
            },
            { key: 'unit', header: 'Birim', render: (r) => r.unit },
            { key: 'supplier', header: 'Tedarikçi', render: (r) => r.supplier },
            { key: 'leadTime', header: 'Lead Time', render: (r) => `${r.leadTimeDays} gün` },
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

export function AccessoryStockPage() {
  const { data: accessoryStock = [], isLoading } = useAccessoryStock()
  const list = useDataList({
    data: accessoryStock,
    searchFields: [(r) => r.code, (r) => r.name, (r) => r.category],
    initialSort: { key: 'code', direction: 'asc' },
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Aksesuar Stok"
      description="Aksesuar stok durumu."
      kpis={[]}
      toolbar={<ErpToolbar searchPlaceholder="Kod, ad ara..." searchValue={list.search} onSearchChange={list.setSearch} />}
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
            { key: 'name', header: 'Ad', render: (r) => r.name },
            { key: 'category', header: 'Kategori', render: (r) => r.category },
            { key: 'qty', header: 'Miktar', render: (r) => `${r.availableQty.toLocaleString('tr-TR')} ${r.unit}` },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}
