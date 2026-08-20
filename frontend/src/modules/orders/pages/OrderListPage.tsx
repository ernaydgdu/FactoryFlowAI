import { useMutation, useQueryClient } from '@tanstack/react-query'
import html2pdf from 'html2pdf.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader } from '@/components/erp'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { deleteOrder, exportOrdersCsv } from '@/infrastructure/api/orders-api.repository'

import { OrderDataTable } from '../components/OrderDataTable'
import { OrderKpiBar } from '../components/OrderKpiBar'
import { OrderListToolbar } from '../components/OrderListToolbar'
import { OrderPagination } from '../components/OrderPagination'
import { OrderQuickFilters } from '../components/OrderQuickFilters'
import { computeOrderKpis } from '../hooks/use-order-list'
import { useOrderList } from '../hooks/use-order-list'
import type { Order, QuickFilter } from '../types'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatReportDate(): string {
  return new Date().toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function OrderListPage() {
  const list = useOrderList()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const searchFromUrl = searchParams.get('search')
    if (searchFromUrl) {
      list.setSearch(searchFromUrl)
    }
    // Navbar'daki genel arama kutusu /orders?search=... ile yönlendirir - sayfa zaten
    // /orders'taysa React Router bileşeni yeniden mount etmez, bu yüzden searchParams
    // değiştiğinde de senkronize etmemiz gerekir (liste kendi arama kutusu URL'ye yazmaz,
    // bu yüzden döngü oluşmaz).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  const [pendingDelete, setPendingDelete] = useState<Order | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null)
  const printListRef = useRef<HTMLDivElement>(null)

  const deleteMutation = useMutation({
    mutationFn: (order: Order) => deleteOrder(order.id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.orderRecord.list(),
        refetchType: 'all',
      }),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async (orders: Order[]) => {
      for (const order of orders) {
        await deleteOrder(order.id)
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.orderRecord.list(),
        refetchType: 'all',
      }),
  })

  const quickFilterCounts = useMemo(() => {
    const all = list.allOrders
    return {
      all: all.length,
      'termin-risk': all.filter((o) => o.terminRisk).length,
      'in-production': all.filter((o) => o.productionStatus === 'Üretimde').length,
      waiting: all.filter((o) => o.productionStatus === 'Beklemede').length,
      completed: all.filter(
        (o) =>
          o.productionStatus === 'Tamamlandı' ||
          o.productionStatus === 'Sevk Edildi',
      ).length,
      'cutting-ready': all.filter((o) => o.cuttingReady).length,
    } satisfies Record<QuickFilter, number>
  }, [list.allOrders])

  const selectedCount = list.selectedIds.size

  async function handleExportExcel() {
    setExportError(null)
    setIsExporting(true)
    try {
      const blob = await exportOrdersCsv()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `siparis-raporu-${todayIso()}.csv`
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

  async function handleExportPdf() {
    setPdfError(null)
    if (!printListRef.current) return
    setIsExportingPdf(true)
    try {
      await html2pdf()
        .from(printListRef.current)
        .set({
          filename: `siparis-listesi-${todayIso()}.pdf`,
          margin: [10, 10, 10, 10],
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
          pagebreak: { mode: ['css', 'avoid-all'], avoid: '.break-inside-avoid' },
        })
        .save()
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'PDF oluşturma başarısız.')
    } finally {
      setIsExportingPdf(false)
    }
  }

  const selectedOrders = list.allOrders.filter((o) => list.selectedIds.has(o.id))

  function handleDeleteSelected() {
    setBulkDeleteError(null)
    setBulkDeleteConfirmOpen(true)
  }

  async function handleConfirmBulkDelete() {
    setBulkDeleteError(null)
    try {
      await bulkDeleteMutation.mutateAsync(selectedOrders)
      list.clearSelection()
      setBulkDeleteConfirmOpen(false)
    } catch (err) {
      setBulkDeleteError(err instanceof Error ? err.message : 'Siparişler silinemedi.')
    }
  }

  function handleDeleteRow(order: Order) {
    setDeleteError(null)
    setPendingDelete(order)
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    setDeleteError(null)
    try {
      await deleteMutation.mutateAsync(pendingDelete)
      setPendingDelete(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Sipariş silinemedi.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sipariş Yönetimi"
        description="Profesyonel sipariş portföyü — filtreleme, sıralama, termin takibi ve üretim ilerlemesi."
      />

      {list.isError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Siparişler yüklenemedi: {list.error instanceof Error ? list.error.message : 'Bilinmeyen hata'}
        </div>
      )}

      {deleteError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {deleteError}
        </div>
      )}

      {bulkDeleteError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {bulkDeleteError}
        </div>
      )}

      {exportError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {exportError}
        </div>
      )}

      {pdfError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {pdfError}
        </div>
      )}

      <OrderKpiBar kpis={computeOrderKpis(list.allOrders)} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <OrderListToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            selectedCount={selectedCount}
            totalCount={list.totalCount}
            isExporting={isExporting}
            isExportingPdf={isExportingPdf}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            onDeleteSelected={handleDeleteSelected}
          />

          <Card className="overflow-hidden py-0">
            <CardContent className="p-0">
              <OrderDataTable
                orders={list.paginated}
                list={list}
                onDeleteRow={handleDeleteRow}
              />
              <OrderPagination
                page={list.page}
                totalPages={list.totalPages}
                pageSize={list.pageSize}
                totalCount={list.totalCount}
                onPageChange={list.setPage}
                onPageSizeChange={list.setPageSize}
              />
            </CardContent>
          </Card>
        </div>

        <OrderQuickFilters
          active={list.quickFilter}
          onChange={list.setQuickFilter}
          counts={quickFilterCounts}
        />
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Siparişi Sil"
        description={
          pendingDelete
            ? `${pendingDelete.orderNo} numaralı siparişi silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm malzeme, üretim, kalite kayıtları da silinecektir.`
            : ''
        }
        confirmLabel="Sil"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ConfirmDialog
        open={bulkDeleteConfirmOpen}
        title="Siparişleri Sil"
        description={`${selectedOrders.length} siparişi silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm malzeme, üretim, kalite kayıtları da silinecektir.`}
        confirmLabel="Sil"
        destructive
        isConfirming={bulkDeleteMutation.isPending}
        onConfirm={handleConfirmBulkDelete}
        onCancel={() => setBulkDeleteConfirmOpen(false)}
      />

      {/* PDF export için ekran dışına konumlandırılmış, yazdırılabilir liste görünümü */}
      <div className="fixed top-0 left-[-9999px] w-[1100px]">
        <div ref={printListRef} className="bg-white text-neutral-900">
          <div className="flex items-center justify-between gap-4 border-b-2 border-neutral-800 px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold tracking-wide text-neutral-900">
                SİPARİŞ LİSTESİ RAPORU
              </h1>
              <p className="text-sm text-neutral-600">Rapor tarihi: {formatReportDate()}</p>
            </div>
            <div className="flex items-center gap-2">
              <img src="/kepler-mountain-logo.svg" alt="Kepler" className="h-10 w-10" />
              <span className="text-xl font-bold tracking-wide" style={{ color: '#7f1d1d' }}>
                KEPLER
              </span>
            </div>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-left">
                  Sipariş No
                </th>
                <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-left">
                  Müşteri
                </th>
                <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-left">
                  Ürün
                </th>
                <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-right">
                  Miktar
                </th>
                <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-left">
                  EXF
                </th>
                <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-left">
                  Durum
                </th>
                <th className="border border-neutral-300 bg-neutral-50 px-3 py-2 text-left">
                  Risk
                </th>
              </tr>
            </thead>
            <tbody>
              {list.filtered.length > 0 ? (
                list.filtered.map((order) => (
                  <tr key={order.id}>
                    <td className="border border-neutral-300 px-3 py-2">{order.orderNo}</td>
                    <td className="border border-neutral-300 px-3 py-2">{order.customer}</td>
                    <td className="border border-neutral-300 px-3 py-2">{order.model}</td>
                    <td className="border border-neutral-300 px-3 py-2 text-right tabular-nums">
                      {order.totalQuantity.toLocaleString('tr-TR')}
                    </td>
                    <td className="border border-neutral-300 px-3 py-2">{order.exfDate}</td>
                    <td className="border border-neutral-300 px-3 py-2">{order.productionStatus}</td>
                    <td className="border border-neutral-300 px-3 py-2">
                      {order.terminRisk ? 'Riskli' : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="border border-neutral-300 px-3 py-6 text-center text-neutral-500">
                    Gösterilecek sipariş yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <p className="px-6 py-3 text-xs text-neutral-500">
            Toplam {list.filtered.length} sipariş listelendi.
          </p>
        </div>
      </div>
    </div>
  )
}
