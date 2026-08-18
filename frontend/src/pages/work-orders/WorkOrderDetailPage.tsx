import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  exportWorkOrderCsv,
  fetchWorkOrderDetail,
  type WorkOrderCostBreakdown,
} from '@/infrastructure/api/orders-api.repository'

const WORK_ORDER_STATUS_LABEL: Record<string, string> = {
  TASLAK: 'Taslak',
  GONDERILDI: 'Gönderildi',
  DEVAM_EDIYOR: 'Devam Ediyor',
  TAMAMLANDI: 'Tamamlandı',
}

const WORK_ORDER_STATUS_TONE: Record<string, 'muted' | 'warning' | 'success'> = {
  TASLAK: 'muted',
  GONDERILDI: 'warning',
  DEVAM_EDIYOR: 'warning',
  TAMAMLANDI: 'success',
}

const BOM_MATERIAL_TYPE_LABEL: Record<string, string> = {
  KUMAS: 'Kumaş',
  AKSESUAR: 'Aksesuar',
}

const BOM_UNIT_LABEL: Record<string, string> = {
  METRE: 'Metre',
  ADET: 'Adet',
  GRAM: 'Gram',
  KG: 'Kg',
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatCurrency(value: number | null): string {
  if (value == null) return '—'
  return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatNumber(value: number | null): string {
  if (value == null) return '—'
  return value.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const workOrderId = id ?? ''
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const detailQuery = useQuery({
    queryKey: applicationQueryKeys.workOrderRecord.detail(workOrderId),
    queryFn: () => fetchWorkOrderDetail(workOrderId),
    enabled: !!workOrderId,
  })

  async function handleExport() {
    setExportError(null)
    setIsExporting(true)
    try {
      const blob = await exportWorkOrderCsv(workOrderId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const workOrderNo = detailQuery.data?.workOrderNo ?? workOrderId
      link.download = `isemri-${workOrderNo}-${todayIso()}.csv`
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

  if (detailQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Yükleniyor...</p>
  }
  if (detailQuery.isError || !detailQuery.data) {
    return <p className="text-sm text-destructive">İş emri yüklenemedi.</p>
  }

  const data = detailQuery.data

  return (
    <div className="space-y-6 print:space-y-4">
      <PageHeader
        title={data.workOrderNo}
        description={`${data.order.orderNo} — ${data.order.buyerName} · ${data.order.productName}`}
        actions={
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" asChild>
              <Link to={`/orders/${data.order.id}`}>
                <ArrowLeft className="size-4" /> Siparişe Dön
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" /> Yazdır
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              <Download className="size-4" /> {isExporting ? 'İndiriliyor...' : 'İndir (CSV)'}
            </Button>
          </div>
        }
      />

      {exportError ? <p className="text-sm text-destructive print:hidden">{exportError}</p> : null}

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Durum</p>
              <div className="mt-1">
                <StatusBadge
                  label={WORK_ORDER_STATUS_LABEL[data.status] ?? data.status}
                  tone={WORK_ORDER_STATUS_TONE[data.status] ?? 'muted'}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Üretici</p>
              <p className="text-sm font-semibold">
                {data.producerType === 'FASON' ? 'Fason Atölye' : 'Kendi Hat'} — {data.producerName}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Planlanan Adet</p>
              <p className="text-sm font-semibold tabular-nums">
                {data.plannedQuantity.toLocaleString('tr-TR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Başlangıç / Hedef Tarih</p>
              <p className="text-sm font-semibold">
                {formatDate(data.startDate)} — {formatDate(data.targetDate)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Sipariş No</p>
              <p className="text-sm font-medium">{data.order.orderNo}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Müşteri / Ürün</p>
              <p className="text-sm font-medium">
                {data.order.buyerName} — {data.order.productName}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">EXF Tarihi</p>
              <p className="text-sm font-medium">{formatDate(data.order.shipmentDate)}</p>
            </div>
          </div>

          {data.notes ? (
            <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
              <span className="font-medium">Notlar: </span>
              {data.notes}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="break-inside-avoid">
        <CardContent className="pt-6">
          <p className="mb-3 text-sm font-semibold">Malzeme Listesi (BOM)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">Malzeme Adı</th>
                  <th className="px-3 py-2">Tip</th>
                  <th className="px-3 py-2 text-right">Birim Tüketim</th>
                  <th className="px-3 py-2">Birim</th>
                  <th className="px-3 py-2 text-right">Fire %</th>
                  <th className="px-3 py-2 text-right">Planlanan İhtiyaç</th>
                  <th className="px-3 py-2 text-right">Birim Fiyat</th>
                  <th className="px-3 py-2 text-right">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {data.bomItems.length > 0 ? (
                  data.bomItems.map((item) => (
                    <tr key={item.id} className="border-b border-border/60">
                      <td className="px-3 py-2">{item.materialName}</td>
                      <td className="px-3 py-2">
                        {BOM_MATERIAL_TYPE_LABEL[item.materialType] ?? item.materialType}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.unitConsumption}</td>
                      <td className="px-3 py-2">{BOM_UNIT_LABEL[item.unit] ?? item.unit}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.wastagePercent}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatNumber(item.plannedNeed)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(item.lineCost)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                      Bu sipariş için BOM (ürün ağacı) girilmemiş.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="break-inside-avoid">
        <CardContent className="pt-6">
          <p className="mb-3 text-sm font-semibold">Renk/Beden Dağılımı</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">Renk</th>
                  <th className="px-3 py-2">Beden</th>
                  <th className="px-3 py-2 text-right">Adet</th>
                  <th className="px-3 py-2 text-right">Koli Başına Adet</th>
                </tr>
              </thead>
              <tbody>
                {data.colorSizes.length > 0 ? (
                  data.colorSizes.map((cs) => (
                    <tr key={cs.id} className="border-b border-border/60">
                      <td className="px-3 py-2">{cs.color}</td>
                      <td className="px-3 py-2">{cs.size}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {cs.quantity.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {cs.unitsPerCarton?.toLocaleString('tr-TR') ?? '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                      Bu sipariş için renk/beden dağılımı girilmemiş.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="break-inside-avoid">
        <CardContent className="pt-6">
          <p className="mb-3 text-sm font-semibold">Maliyet Özeti</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">Kalem</th>
                  <th className="px-3 py-2 text-right">Planlanan</th>
                  <th className="px-3 py-2 text-right">Gerçekleşen</th>
                  <th className="px-3 py-2 text-right">Fark</th>
                  <th className="px-3 py-2 text-right">Fark %</th>
                </tr>
              </thead>
              <tbody>
                <CostRow label="Kumaş" breakdown={data.costs.fabric} />
                <CostRow label="Malzeme" breakdown={data.costs.material} />
                <CostRow label="İşçilik" breakdown={data.costs.labor} />
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{data.materialCostNote}</p>
        </CardContent>
      </Card>
    </div>
  )
}

function CostRow({ label, breakdown }: { label: string; breakdown: WorkOrderCostBreakdown }) {
  const varianceTone =
    breakdown.variance == null
      ? 'text-muted-foreground'
      : breakdown.variance > 0
        ? 'text-destructive'
        : 'text-emerald-700 dark:text-emerald-400'

  return (
    <tr className="border-b border-border/60">
      <td className="px-3 py-2 font-medium">{label}</td>
      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(breakdown.planned)}</td>
      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(breakdown.actual)}</td>
      <td className={cn('px-3 py-2 text-right tabular-nums font-medium', varianceTone)}>
        {formatCurrency(breakdown.variance)}
      </td>
      <td className={cn('px-3 py-2 text-right tabular-nums font-medium', varianceTone)}>
        {breakdown.variancePercent != null ? `${breakdown.variancePercent.toFixed(1)}%` : '—'}
      </td>
    </tr>
  )
}
