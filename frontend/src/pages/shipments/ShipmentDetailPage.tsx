import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download } from 'lucide-react'
import { Fragment, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  exportShipmentCsv,
  fetchShipmentDetail,
  type ApiShipmentLine,
} from '@/infrastructure/api/shipments-api.repository'

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function groupByOrder(lines: ApiShipmentLine[]): Array<{
  orderId: number
  orderNo: string
  buyerName: string
  productName: string
  lines: ApiShipmentLine[]
}> {
  const groups = new Map<number, { orderId: number; orderNo: string; buyerName: string; productName: string; lines: ApiShipmentLine[] }>()
  for (const line of lines) {
    const existing = groups.get(line.orderId)
    if (existing) {
      existing.lines.push(line)
    } else {
      groups.set(line.orderId, {
        orderId: line.orderId,
        orderNo: line.orderNo,
        buyerName: line.buyerName,
        productName: line.productName,
        lines: [line],
      })
    }
  }
  return Array.from(groups.values())
}

export function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const orderId = id ?? ''
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const shipmentQuery = useQuery({
    queryKey: applicationQueryKeys.shipmentRecord.detail(orderId),
    queryFn: () => fetchShipmentDetail(orderId),
    enabled: !!orderId,
  })

  async function handleExport() {
    setExportError(null)
    setIsExporting(true)
    try {
      const blob = await exportShipmentCsv(orderId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const shipmentNo = shipmentQuery.data?.shipmentNo ?? orderId
      link.download = `sevkiyat-${shipmentNo}-${todayIso()}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Dışa aktarma başarısız.')
    } finally {
      setIsExporting(false)
    }
  }

  if (shipmentQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Yükleniyor...</p>
  }
  if (shipmentQuery.isError || !shipmentQuery.data) {
    return <p className="text-sm text-destructive">Sevkiyat yüklenemedi.</p>
  }

  const data = shipmentQuery.data
  const groups = groupByOrder(data.lines)

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.shipmentNo}
        description={`Sevkiyat Tarihi: ${formatDate(data.shipmentDate)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to="/shipments">
                <ArrowLeft className="size-4" /> Geri
              </Link>
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              <Download className="size-4" /> {isExporting ? 'İndiriliyor...' : 'İndir (CSV)'}
            </Button>
          </div>
        }
      />

      {exportError ? <p className="text-sm text-destructive">{exportError}</p> : null}

      {data.notes ? (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
          <span className="font-medium">Notlar: </span>
          {data.notes}
        </div>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">Renk</th>
                  <th className="px-3 py-2">Beden</th>
                  <th className="px-3 py-2 text-right">Toplam Adet</th>
                  <th className="px-3 py-2 text-right">Koli Başına Adet</th>
                  <th className="px-3 py-2 text-right">Tam Koli</th>
                  <th className="px-3 py-2 text-right">Lotlu Adet</th>
                  <th className="px-3 py-2 text-right">Açık Adet</th>
                  <th className="px-3 py-2 text-right">Toplam Koli</th>
                </tr>
              </thead>
              <tbody>
                {groups.length > 0 ? (
                  <>
                    {groups.map((group) => (
                      <Fragment key={group.orderId}>
                        <tr className="border-b border-border/60 bg-muted/30">
                          <td className="px-3 py-2 font-semibold" colSpan={8}>
                            {group.orderNo} — {group.buyerName} · {group.productName}
                          </td>
                        </tr>
                        {group.lines.map((line) => (
                          <tr key={line.id} className="border-b border-border/60">
                            <td className="px-3 py-2">{line.color}</td>
                            <td className="px-3 py-2">{line.size}</td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {line.totalQty.toLocaleString('tr-TR')}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {line.unitsPerCarton?.toLocaleString('tr-TR') ?? '—'}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {line.fullCartons?.toLocaleString('tr-TR') ?? '—'}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {line.lottedQty?.toLocaleString('tr-TR') ?? '—'}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {line.looseQty.toLocaleString('tr-TR')}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {line.totalCartons?.toLocaleString('tr-TR') ?? '—'}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                    <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                      <td className="px-3 py-2" colSpan={2}>
                        GENEL TOPLAM
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {data.grandTotal.totalQty.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">—</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {data.grandTotal.fullCartons.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {data.grandTotal.lottedQty.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {data.grandTotal.looseQty.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {data.grandTotal.totalCartons.toLocaleString('tr-TR')}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                      Bu sevkiyatta satır yok.
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
