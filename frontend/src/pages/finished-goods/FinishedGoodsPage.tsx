import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader, StatusBadge } from '@/components/erp'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  fetchFinishedGoods,
  type ApiFinishedGoodsLine,
  type FinishedGoodsStatus,
} from '@/infrastructure/api/stock-api.repository'

const STATUS_LABEL: Record<FinishedGoodsStatus, string> = {
  TAMAMEN_SEVK_EDILDI: 'Tamamen Sevk Edildi',
  KISMI_SEVK_EDILDI: 'Kısmi Sevk Edildi',
  SEVKIYAT_BEKLIYOR: 'Sevkiyat Bekliyor',
}

const STATUS_TONE: Record<FinishedGoodsStatus, 'success' | 'warning' | 'muted'> = {
  TAMAMEN_SEVK_EDILDI: 'success',
  KISMI_SEVK_EDILDI: 'warning',
  SEVKIYAT_BEKLIYOR: 'muted',
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function sortLines(lines: ApiFinishedGoodsLine[]): ApiFinishedGoodsLine[] {
  return [...lines].sort((a, b) => {
    const aWaiting = a.status === 'SEVKIYAT_BEKLIYOR'
    const bWaiting = b.status === 'SEVKIYAT_BEKLIYOR'
    // Sevkiyat bekleyen kayıtlar EXF tarihine göre (en yakın önce) en üstte —
    // aciliyeti öne çıkarmak için diğer durumların önüne alınır.
    if (aWaiting && bWaiting) {
      const aTime = a.shipmentDate ? new Date(a.shipmentDate).getTime() : Infinity
      const bTime = b.shipmentDate ? new Date(b.shipmentDate).getTime() : Infinity
      return aTime - bTime
    }
    if (aWaiting) return -1
    if (bWaiting) return 1
    return 0
  })
}

export function FinishedGoodsPage() {
  const finishedGoodsQuery = useQuery({
    queryKey: applicationQueryKeys.stockRecord.finishedGoods(),
    queryFn: () => fetchFinishedGoods(),
  })

  const summary = finishedGoodsQuery.data
  const lines = sortLines(summary?.lines ?? [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mamul Envanteri"
        description="Ürün Deposu'ndaki paketlenmiş mamul stoğu ve sevkiyat durumu."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam Paketlenen</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {(summary?.totalPackaged ?? 0).toLocaleString('tr-TR')}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam Sevk Edilen</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {(summary?.totalShipped ?? 0).toLocaleString('tr-TR')}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sevkiyat Bekleyen</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {(summary?.totalPending ?? 0).toLocaleString('tr-TR')}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">Sipariş No</th>
                  <th className="px-3 py-2">Müşteri</th>
                  <th className="px-3 py-2">Ürün</th>
                  <th className="px-3 py-2">Paketlenen</th>
                  <th className="px-3 py-2">Sevk Edilen</th>
                  <th className="px-3 py-2">Bekleyen</th>
                  <th className="px-3 py-2">Durum</th>
                  <th className="px-3 py-2">EXF Tarihi</th>
                </tr>
              </thead>
              <tbody>
                {finishedGoodsQuery.isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : lines.length > 0 ? (
                  lines.map((line) => (
                    <tr key={line.lotId} className="border-b border-border/60">
                      <td className="px-3 py-2 font-medium">
                        {line.orderId != null ? (
                          <Link to={`/orders/${line.orderId}`} className="text-primary hover:underline">
                            {line.orderNo ?? `#${line.orderId}`}
                          </Link>
                        ) : (
                          (line.orderNo ?? '—')
                        )}
                      </td>
                      <td className="px-3 py-2">{line.buyerName ?? '—'}</td>
                      <td className="px-3 py-2">{line.productName ?? '—'}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {line.packagedQty.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {line.shippedQty.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {line.remainingQty.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge
                          label={STATUS_LABEL[line.status]}
                          tone={STATUS_TONE[line.status]}
                        />
                      </td>
                      <td className="px-3 py-2">{formatDate(line.shipmentDate)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                      Henüz mamul girişi yapılmadı.
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
