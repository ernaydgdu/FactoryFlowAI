import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { DataTable, ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { useProductCardKpis, useProductCardList } from '@/application/product-card/use-product-card'
import { useDataList } from '@/hooks/use-data-list'

export function ProductListPage() {
  const { data: items = [], isLoading } = useProductCardList()
  const { data: kpisData } = useProductCardKpis()

  const list = useDataList({
    data: items,
    searchFields: [
      (p) => p.productCode,
      (p) => p.productName,
      (p) => p.customer,
      (p) => p.brand,
    ],
    initialSort: { key: 'productCode', direction: 'asc' },
  })

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  }

  return (
    <ErpModuleShell
      title="Ürün Kartları"
      description="Kepler ERP referans ekranı — tekstil ürün kartı yönetimi."
      kpis={kpisData?.items ?? []}
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <ErpToolbar
            searchPlaceholder="Ürün kodu, model, müşteri ara..."
            searchValue={list.search}
            onSearchChange={list.setSearch}
          />
          <Button size="sm" asChild>
            <Link to="/products/new"><Plus className="size-4" /> Yeni Ürün Kartı</Link>
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
          rowKey={(p) => p.id}
          data={list.paginated}
          columns={[
            {
              key: 'code',
              header: 'Ürün Kodu',
              render: (p) => (
                <Link to={`/products/${p.id}`} className="font-medium text-primary hover:underline">
                  {p.productCode}
                </Link>
              ),
            },
            { key: 'name', header: 'Ürün Adı', render: (p) => p.productName },
            { key: 'customer', header: 'Müşteri', render: (p) => p.customer },
            { key: 'brand', header: 'Marka', render: (p) => p.brand },
            { key: 'season', header: 'Sezon', render: (p) => p.season },
            { key: 'sizeSet', header: 'Beden Seti', render: (p) => p.sizeSetName },
            { key: 'colors', header: 'Renk', render: (p) => String(p.colorCount) },
            { key: 'bom', header: 'BOM', render: (p) => String(p.bomLineCount) },
            {
              key: 'actions',
              header: '',
              render: (p) =>
                p.editable ? (
                  <Link
                    to={`/products/${p.id}/edit`}
                    className="text-sm text-primary hover:underline"
                  >
                    Düzenle
                  </Link>
                ) : null,
            },
            {
              key: 'status',
              header: 'Durum',
              render: (p) => <StatusBadge label={p.status.label} tone={p.status.tone} />,
            },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}
