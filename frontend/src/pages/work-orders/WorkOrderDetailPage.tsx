import { useQuery } from '@tanstack/react-query'
import html2pdf from 'html2pdf.js'
import { ArrowLeft, Download, FileDown, Printer } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  exportWorkOrderCsv,
  fetchWorkOrderDetail,
  type ApiOrderColorSize,
  type WorkOrderCostBreakdown,
} from '@/infrastructure/api/orders-api.repository'

const KNOWN_SIZE_ORDER = [
  'XXS',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '2XL',
  'XXXL',
  '3XL',
  '4XL',
]

function sortSizes(sizes: string[]): string[] {
  const isNumeric = sizes.every((s) => /^\d+$/.test(s.trim()))
  if (isNumeric) {
    return [...sizes].sort((a, b) => Number(a) - Number(b))
  }
  const allKnown = sizes.every((s) => KNOWN_SIZE_ORDER.includes(s.trim().toUpperCase()))
  if (allKnown) {
    return [...sizes].sort(
      (a, b) =>
        KNOWN_SIZE_ORDER.indexOf(a.trim().toUpperCase()) -
        KNOWN_SIZE_ORDER.indexOf(b.trim().toUpperCase()),
    )
  }
  return [...sizes].sort((a, b) => a.localeCompare(b, 'tr-TR'))
}

function buildAssortmentMatrix(colorSizes: ApiOrderColorSize[]) {
  const colors = Array.from(new Set(colorSizes.map((cs) => cs.color)))
  const sizes = sortSizes(Array.from(new Set(colorSizes.map((cs) => cs.size))))
  const qtyMap = new Map<string, number>()
  for (const cs of colorSizes) {
    qtyMap.set(`${cs.color}__${cs.size}`, cs.quantity)
  }
  const cellQty = (color: string, size: string) => qtyMap.get(`${color}__${size}`) ?? 0
  const colorTotal = (color: string) =>
    sizes.reduce((sum, size) => sum + cellQty(color, size), 0)
  const sizeTotal = (size: string) =>
    colors.reduce((sum, color) => sum + cellQty(color, size), 0)
  const grandTotal = colorSizes.reduce((sum, cs) => sum + cs.quantity, 0)

  return { colors, sizes, cellQty, colorTotal, sizeTotal, grandTotal }
}

const WORK_ORDER_STATUS_LABEL: Record<string, string> = {
  TASLAK: 'Taslak',
  GONDERILDI: 'Gönderildi',
  DEVAM_EDIYOR: 'Devam Ediyor',
  TAMAMLANDI: 'Tamamlandı',
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

function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const workOrderId = id ?? ''
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const printContainerRef = useRef<HTMLDivElement>(null)

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

  async function handleDownloadPdf() {
    setPdfError(null)
    if (!printContainerRef.current) return
    setIsGeneratingPdf(true)
    try {
      const workOrderNo = detailQuery.data?.workOrderNo ?? workOrderId
      await html2pdf()
        .from(printContainerRef.current)
        .set({
          filename: `imalat-dosyasi-${workOrderNo}-${todayIso()}.pdf`,
          margin: [10, 10, 10, 10],
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'avoid-all'], avoid: '.break-inside-avoid' },
        })
        .save()
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'PDF oluşturma başarısız.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  if (detailQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Yükleniyor...</p>
  }
  if (detailQuery.isError || !detailQuery.data) {
    return <p className="text-sm text-destructive">İş emri yüklenemedi.</p>
  }

  const data = detailQuery.data
  const assortment = buildAssortmentMatrix(data.colorSizes)

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
            <Button onClick={handleDownloadPdf} disabled={isGeneratingPdf}>
              <FileDown className="size-4" /> {isGeneratingPdf ? 'PDF oluşturuluyor...' : 'İndir (PDF)'}
            </Button>
          </div>
        }
      />

      {exportError ? <p className="text-sm text-destructive print:hidden">{exportError}</p> : null}
      {pdfError ? <p className="text-sm text-destructive print:hidden">{pdfError}</p> : null}

      <div ref={printContainerRef} className="space-y-6 print:space-y-4">
      {/* İmalat Dosyası — matbu belge görünümü */}
      <div className="break-inside-avoid overflow-hidden rounded-lg border-2 border-neutral-800 bg-white text-neutral-900">
        <div className="flex items-center justify-between gap-4 border-b-2 border-neutral-800 px-5 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-neutral-900">İMALAT DOSYASI</h1>
            <p className="text-sm text-neutral-600">{data.workOrderNo}</p>
          </div>
          <div className="flex items-center gap-2">
            <img src="/kepler-mountain-logo.svg" alt="Kepler" className="h-10 w-10" />
            <span className="text-xl font-bold tracking-wide" style={{ color: '#7f1d1d' }}>
              KEPLER
            </span>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr className="border-b border-neutral-300">
              <td className="w-1/6 border-r border-neutral-300 bg-neutral-50 px-4 py-2 font-semibold">
                Sipariş No
              </td>
              <td className="w-1/3 border-r border-neutral-300 px-4 py-2">{data.order.orderNo}</td>
              <td className="w-1/6 border-r border-neutral-300 bg-neutral-50 px-4 py-2 font-semibold">
                Model/Ürün Adı
              </td>
              <td className="px-4 py-2">{data.order.productName}</td>
            </tr>
            <tr className="border-b border-neutral-300">
              <td className="border-r border-neutral-300 bg-neutral-50 px-4 py-2 font-semibold">
                Müşteri
              </td>
              <td className="border-r border-neutral-300 px-4 py-2">{data.order.buyerName}</td>
              <td className="border-r border-neutral-300 bg-neutral-50 px-4 py-2 font-semibold">
                Miktar
              </td>
              <td className="px-4 py-2 tabular-nums">
                {data.plannedQuantity.toLocaleString('tr-TR')}
              </td>
            </tr>
            <tr className="border-b border-neutral-300">
              <td className="border-r border-neutral-300 bg-neutral-50 px-4 py-2 font-semibold">
                Sipariş Tarihi
              </td>
              <td className="border-r border-neutral-300 px-4 py-2">
                {formatDate(data.order.createdAt)}
              </td>
              <td className="border-r border-neutral-300 bg-neutral-50 px-4 py-2 font-semibold">
                Hedef Tarih
              </td>
              <td className="px-4 py-2">{formatDate(data.targetDate)}</td>
            </tr>
            <tr>
              <td className="border-r border-neutral-300 bg-neutral-50 px-4 py-2 font-semibold">
                Üretici
              </td>
              <td className="border-r border-neutral-300 px-4 py-2" colSpan={3}>
                {data.producerType === 'FASON' ? 'Fason Atölye' : 'Kendi Hat'} — {data.producerName}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-3 p-4">
          <div className="rounded border border-amber-400 bg-amber-100 py-2 text-center text-sm font-bold text-neutral-900">
            ÜRETİCİ TİPİ: {data.producerType === 'FASON' ? 'FASON ATÖLYE' : 'KENDİ HAT'}
          </div>
          <div className="rounded border border-amber-400 bg-amber-100 py-2 text-center text-sm font-bold text-neutral-900">
            DURUM: {(WORK_ORDER_STATUS_LABEL[data.status] ?? data.status).toLocaleUpperCase('tr-TR')}
          </div>
        </div>

        {data.notes ? (
          <div className="border-t border-neutral-300 px-4 py-3 text-sm">
            <span className="font-semibold">Notlar: </span>
            {data.notes}
          </div>
        ) : null}
      </div>

      {/* Beden/Renk Asorti Matrisi */}
      <div className="break-inside-avoid overflow-hidden rounded-lg border-2 border-neutral-800 bg-white text-neutral-900">
        <p className="border-b-2 border-neutral-800 px-4 py-2 text-sm font-bold" style={{ color: '#7f1d1d' }}>
          BEDEN/RENK ASORTİ MATRİSİ
        </p>
        <div className="overflow-x-auto">
          {assortment.colors.length > 0 ? (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-left">Renk</th>
                  {assortment.sizes.map((size) => (
                    <th
                      key={size}
                      className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-right"
                    >
                      {size}
                    </th>
                  ))}
                  <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-right">
                    Toplam
                  </th>
                </tr>
              </thead>
              <tbody>
                {assortment.colors.map((color) => (
                  <tr key={color}>
                    <td className="border border-neutral-300 px-3 py-2 font-medium">{color}</td>
                    {assortment.sizes.map((size) => (
                      <td
                        key={size}
                        className="border border-neutral-300 px-3 py-2 text-right tabular-nums"
                      >
                        {assortment.cellQty(color, size).toLocaleString('tr-TR')}
                      </td>
                    ))}
                    <td className="border border-neutral-300 px-3 py-2 text-right font-semibold tabular-nums">
                      {assortment.colorTotal(color).toLocaleString('tr-TR')}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td
                    className="border border-neutral-300 px-3 py-2 font-bold"
                    style={{ color: '#7f1d1d' }}
                  >
                    TOPLAM MİKTAR
                  </td>
                  {assortment.sizes.map((size) => (
                    <td
                      key={size}
                      className="border border-neutral-300 px-3 py-2 text-right font-bold tabular-nums"
                      style={{ color: '#7f1d1d' }}
                    >
                      {assortment.sizeTotal(size).toLocaleString('tr-TR')}
                    </td>
                  ))}
                  <td
                    className="border border-neutral-300 px-3 py-2 text-right font-bold tabular-nums"
                    style={{ color: '#7f1d1d' }}
                  >
                    {assortment.grandTotal.toLocaleString('tr-TR')}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-neutral-500">
              Bu sipariş için renk/beden dağılımı girilmemiş.
            </p>
          )}
        </div>
      </div>

      {/* Detaylı Malzeme Tablosu */}
      <div className="break-inside-avoid overflow-hidden rounded-lg border-2 border-neutral-800 bg-white text-neutral-900">
        <p className="border-b-2 border-neutral-800 px-4 py-2 text-sm font-bold" style={{ color: '#7f1d1d' }}>
          DETAYLI MALZEME TABLOSU
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-left">
                  Bölüm/Malzeme Adı
                </th>
                <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-left">
                  Malzeme Tipi
                </th>
                <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-right">
                  Birim Tüketim
                </th>
                <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-left">
                  Birim
                </th>
                <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-right">
                  Fire Payı %
                </th>
                <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-right">
                  Toplam İhtiyaç
                </th>
                <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-left">
                  Tedarikçi
                </th>
              </tr>
            </thead>
            <tbody>
              {data.bomItems.length > 0 ? (
                data.bomItems.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-neutral-300 px-3 py-2">{item.materialName}</td>
                    <td className="border border-neutral-300 px-3 py-2">
                      {BOM_MATERIAL_TYPE_LABEL[item.materialType] ?? item.materialType}
                    </td>
                    <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                      {item.unitConsumption}
                    </td>
                    <td className="border border-neutral-300 px-3 py-2">
                      {BOM_UNIT_LABEL[item.unit] ?? item.unit}
                    </td>
                    <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                      {item.wastagePercent}
                    </td>
                    <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                      {formatNumber(item.plannedNeed)}
                    </td>
                    <td className="border border-neutral-300 px-3 py-2">
                      {item.supplierName ?? '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="border border-neutral-300 px-3 py-6 text-center text-neutral-500">
                    Bu sipariş için BOM (ürün ağacı) girilmemiş.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Card className="break-inside-avoid">
        <CardContent className="pt-6">
          <p className="mb-3 text-sm font-semibold">Koli Dağılımı</p>
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
                {data.packingList.colorSizes.length > 0 ? (
                  <>
                    {data.packingList.colorSizes.map((cs, i) => (
                      <tr key={`${cs.color}-${cs.size}-${i}`} className="border-b border-border/60">
                        <td className="px-3 py-2">{cs.color}</td>
                        <td className="px-3 py-2">{cs.size}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {cs.totalQty.toLocaleString('tr-TR')}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {cs.unitsPerCarton?.toLocaleString('tr-TR') ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {cs.fullCartons?.toLocaleString('tr-TR') ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {cs.lottedQty?.toLocaleString('tr-TR') ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {cs.looseQty.toLocaleString('tr-TR')}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {cs.totalCartons?.toLocaleString('tr-TR') ?? '—'}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-b border-border/60 font-semibold">
                      <td className="px-3 py-2" colSpan={2}>
                        Genel Toplam
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {data.packingList.grandTotal.totalQty.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2 text-right tabular-nums">
                        {data.packingList.grandTotal.fullCartons.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {data.packingList.grandTotal.lottedQty.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {data.packingList.grandTotal.looseQty.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {data.packingList.grandTotal.totalCartons.toLocaleString('tr-TR')}
                      </td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                      Bu sipariş için renk/beden dağılımı girilmemiş.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {data.packingList.colorSizes.length > 0 ? (
            <p className="mt-3 text-xs text-muted-foreground">{data.packingList.note}</p>
          ) : null}
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

      <p className="text-center text-xs text-neutral-500">
        {formatDateTime(data.createdAt)} · 1 / 1
      </p>
      </div>
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
