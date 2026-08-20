import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
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
  const [pdfComingSoon, setPdfComingSoon] = useState(false)
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false)
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null)

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

  function handleExportPdf() {
    setPdfComingSoon(true)
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

      {pdfComingSoon && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          PDF dışa aktarma yakında kullanıma sunulacak.
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
    </div>
  )
}
