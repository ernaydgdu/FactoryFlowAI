import { useState } from 'react'

import { ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CARTONS } from '@/domain/data/workflows'
import { useDataList } from '@/hooks/use-data-list'

const cartonTone = {
  Açık: 'warning',
  Kapandı: 'default',
  'Sevk Edildi': 'success',
} as const

export function PackagingPage() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const list = useDataList({
    data: CARTONS,
    searchFields: [(c) => c.cartonNo, (c) => c.orderNo],
    initialSort: { key: 'cartonNo', direction: 'asc' },
  })

  const totalQty = CARTONS.reduce((s, c) => s + c.totalQty, 0)

  return (
    <ErpModuleShell
      title="Paketleme — Koli Bazlı"
      description="Her koli içinde hangi renk, beden ve kaç adet olduğu görülebilir."
      kpis={[
        { label: 'Toplam Koli', value: String(CARTONS.length), hint: 'Oluşturuldu' },
        { label: 'Kapandı', value: String(CARTONS.filter((c) => c.status === 'Kapandı').length), hint: 'Sevke hazır' },
        { label: 'Sevk Edildi', value: String(CARTONS.filter((c) => c.status === 'Sevk Edildi').length), hint: 'Yolda' },
        { label: 'Toplam Adet', value: totalQty.toLocaleString('tr-TR'), hint: 'Kolilerde' },
      ]}
      toolbar={
        <ErpToolbar
          searchPlaceholder="Koli no, sipariş ara..."
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
      }}
    >
      <div className="grid gap-3 p-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.paginated.map((carton) => (
          <Card
            key={carton.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => setExpanded(expanded === carton.id ? null : carton.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{carton.cartonNo}</CardTitle>
                <StatusBadge label={carton.status} tone={cartonTone[carton.status]} />
              </div>
              <p className="text-xs text-muted-foreground">{carton.orderNo} · {carton.totalQty} adet · {carton.weight} kg</p>
            </CardHeader>
            {(expanded === carton.id || list.pageSize <= 12) && (
              <CardContent>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-1">Renk</th>
                      <th className="py-1">Beden</th>
                      <th className="py-1 text-right">Adet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carton.lines.map((line, i) => (
                      <tr key={i} className="border-b border-border/40">
                        <td className="py-1">{line.color}</td>
                        <td className="py-1">{line.size}</td>
                        <td className="py-1 text-right tabular-nums">{line.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </ErpModuleShell>
  )
}
