import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader } from '@/components/erp'
import { Card, CardContent } from '@/components/ui/card'
import {
  fetchWarehouses,
  type ApiWarehouse,
} from '@/infrastructure/api/stock-api.repository'

const WAREHOUSE_TYPE_LABEL: Record<string, string> = {
  KUMAS: 'Kumaş',
  AKSESUAR: 'Aksesuar',
  URUN: 'Ürün',
  ATOLYE_HAMMADDE: 'Atölye Hammadde',
}

function formatValue(value: number): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatTotalValue(totalValueByCurrency: Record<string, number>): string {
  const entries = Object.entries(totalValueByCurrency)
  if (entries.length === 0) return '—'
  return entries.map(([currency, value]) => `${formatValue(value)} ${currency}`).join(' + ')
}

export function WarehousesPage() {
  const navigate = useNavigate()

  const warehousesQuery = useQuery({
    queryKey: applicationQueryKeys.stockRecord.warehouses(),
    queryFn: () => fetchWarehouses(),
  })

  const warehouses = warehousesQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Depolar"
        description="Tüm depoların kod, tip, lot sayısı ve stok değeri özeti."
      />

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">Depo Kodu</th>
                  <th className="px-3 py-2">Depo Adı</th>
                  <th className="px-3 py-2">Tip</th>
                  <th className="px-3 py-2">Lot Sayısı</th>
                  <th className="px-3 py-2">Toplam Değer</th>
                </tr>
              </thead>
              <tbody>
                {warehousesQuery.isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : warehouses.length > 0 ? (
                  warehouses.map((wh) => (
                    <WarehouseRow key={wh.id} warehouse={wh} onSelect={navigate} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                      Henüz depo tanımlanmadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function WarehouseRow({
  warehouse,
  onSelect,
}: {
  warehouse: ApiWarehouse
  onSelect: (path: string) => void
}) {
  return (
    <tr
      className="cursor-pointer border-b border-border/60 hover:bg-muted/30"
      onClick={() => onSelect(`/stock?warehouseId=${warehouse.id}`)}
    >
      <td className="px-3 py-2 font-medium tabular-nums">{warehouse.code}</td>
      <td className="px-3 py-2">{warehouse.name}</td>
      <td className="px-3 py-2">{WAREHOUSE_TYPE_LABEL[warehouse.type] ?? warehouse.type}</td>
      <td className="px-3 py-2 tabular-nums">{warehouse.lotCount}</td>
      <td className="px-3 py-2 tabular-nums">{formatTotalValue(warehouse.totalValueByCurrency)}</td>
    </tr>
  )
}
