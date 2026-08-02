import { useMemo } from 'react'

import { PageHeader } from '@/components/erp'
import { Card, CardContent } from '@/components/ui/card'

import { OrderDataTable } from '../components/OrderDataTable'
import { OrderKpiBar } from '../components/OrderKpiBar'
import { OrderListToolbar } from '../components/OrderListToolbar'
import { OrderPagination } from '../components/OrderPagination'
import { OrderQuickFilters } from '../components/OrderQuickFilters'
import { computeOrderKpis } from '../hooks/use-order-list'
import { useOrderList } from '../hooks/use-order-list'
import type { QuickFilter } from '../types'
import {
  mockDeleteOrders,
  mockExportExcel,
  mockExportPdf,
} from '../utils/mock-actions'

export function OrderListPage() {
  const list = useOrderList()

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
    } satisfies Record<QuickFilter, number>
  }, [list.allOrders])

  const selectedCount = list.selectedIds.size

  function handleExportExcel() {
    mockExportExcel(selectedCount, list.totalCount)
  }

  function handleExportPdf() {
    mockExportPdf(selectedCount, list.totalCount)
  }

  function handleDeleteSelected() {
    const orderNos = list.allOrders
      .filter((o) => list.selectedIds.has(o.id))
      .map((o) => o.orderNo)
    mockDeleteOrders(orderNos)
    list.clearSelection()
  }

  function handleDeleteRow(order: { orderNo: string }) {
    mockDeleteOrders([order.orderNo])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sipariş Yönetimi"
        description="Profesyonel sipariş portföyü — filtreleme, sıralama, termin takibi ve üretim ilerlemesi."
      />

      <OrderKpiBar kpis={computeOrderKpis(list.allOrders)} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <OrderListToolbar
            search={list.search}
            onSearchChange={list.setSearch}
            selectedCount={selectedCount}
            totalCount={list.totalCount}
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
    </div>
  )
}
