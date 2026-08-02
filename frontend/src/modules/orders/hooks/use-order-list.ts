import { useMemo, useState } from 'react'

import { mockOrders } from '../data/mock-orders'
import type {
  ColumnFilterKey,
  ColumnFilters,
  Order,
  OrderListKpis,
  OrderSortKey,
  QuickFilter,
  SortDirection,
} from '../types'
import { filterBySearch } from '@/lib/filter'

const DEFAULT_SORT: { key: OrderSortKey; direction: SortDirection } = {
  key: 'exfTimestamp',
  direction: 'asc',
}

function applyQuickFilter(orders: Order[], filter: QuickFilter): Order[] {
  switch (filter) {
    case 'termin-risk':
      return orders.filter((o) => o.terminRisk)
    case 'in-production':
      return orders.filter((o) => o.productionStatus === 'Üretimde')
    case 'waiting':
      return orders.filter((o) => o.productionStatus === 'Beklemede')
    case 'completed':
      return orders.filter(
        (o) =>
          o.productionStatus === 'Tamamlandı' ||
          o.productionStatus === 'Sevk Edildi',
      )
    default:
      return orders
  }
}

function applyColumnFilters(
  orders: Order[],
  filters: ColumnFilters,
): Order[] {
  return orders.filter((order) =>
    (Object.entries(filters) as [ColumnFilterKey, string][]).every(
      ([key, value]) => !value || value === 'all' || order[key] === value,
    ),
  )
}

function sortOrders(
  orders: Order[],
  key: OrderSortKey,
  direction: SortDirection,
): Order[] {
  const sorted = [...orders].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (typeof av === 'number' && typeof bv === 'number') return av - bv
    return String(av).localeCompare(String(bv), 'tr')
  })
  return direction === 'desc' ? sorted.reverse() : sorted
}

export function computeOrderKpis(orders: Order[]): OrderListKpis {
  return {
    total: orders.length,
    inProduction: orders.filter((o) => o.productionStatus === 'Üretimde').length,
    terminRisk: orders.filter((o) => o.terminRisk).length,
    completed: orders.filter(
      (o) =>
        o.productionStatus === 'Tamamlandı' ||
        o.productionStatus === 'Sevk Edildi',
    ).length,
    waiting: orders.filter((o) => o.productionStatus === 'Beklemede').length,
  }
}

export function getUniqueFilterValues(
  orders: Order[],
  key: ColumnFilterKey,
): string[] {
  return [...new Set(orders.map((o) => o[key]))].sort((a, b) =>
    a.localeCompare(b, 'tr'),
  )
}

export function useOrderList() {
  const [search, setSearch] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all')
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({})
  const [sort, setSort] = useState(DEFAULT_SORT)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const kpis = useMemo(() => computeOrderKpis(mockOrders), [])

  const filtered = useMemo(() => {
    let rows = applyQuickFilter(mockOrders, quickFilter)
    rows = applyColumnFilters(rows, columnFilters)
    rows = filterBySearch(rows, search, [
      (r) => r.orderNo,
      (r) => r.customer,
      (r) => r.brand,
      (r) => r.model,
      (r) => r.season,
      (r) => r.color,
      (r) => r.planner,
      (r) => r.sizeSet,
    ])
    return sortOrders(rows, sort.key, sort.direction)
  }, [search, quickFilter, columnFilters, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  function toggleSort(key: OrderSortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    )
  }

  function setColumnFilter(key: ColumnFilterKey, value: string) {
    setColumnFilters((prev) => {
      const next = { ...prev }
      if (!value || value === 'all') delete next[key]
      else next[key] = value
      return next
    })
    setPage(1)
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll(visibleIds: string[]) {
    setSelectedIds((prev) => {
      const allSelected = visibleIds.every((id) => prev.has(id))
      if (allSelected) {
        const next = new Set(prev)
        visibleIds.forEach((id) => next.delete(id))
        return next
      }
      return new Set([...prev, ...visibleIds])
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function handleQuickFilterChange(filter: QuickFilter) {
    setQuickFilter(filter)
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size)
    setPage(1)
  }

  return {
    search,
    setSearch: handleSearchChange,
    quickFilter,
    setQuickFilter: handleQuickFilterChange,
    columnFilters,
    setColumnFilter,
    sort,
    toggleSort,
    page: safePage,
    setPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalPages,
    totalCount: filtered.length,
    paginated,
    filtered,
    kpis,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    allOrders: mockOrders,
  }
}

export type UseOrderListReturn = ReturnType<typeof useOrderList>
