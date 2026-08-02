import { useMemo, useState } from 'react'

import { filterBySearch } from '@/lib/filter'

export type SortDirection = 'asc' | 'desc'

type UseDataListOptions<T> = {
  data: T[]
  searchFields: ((row: T) => string)[]
  pageSize?: number
  filterFn?: (row: T) => boolean
  initialSort?: { key: keyof T; direction: SortDirection }
}

export function useDataList<T extends Record<string, unknown>>({
  data,
  searchFields,
  pageSize: initialPageSize = 10,
  filterFn,
  initialSort,
}: UseDataListOptions<T>) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [sortKey, setSortKey] = useState<keyof T | null>(
    initialSort?.key ?? null,
  )
  const [sortDir, setSortDir] = useState<SortDirection>(
    initialSort?.direction ?? 'asc',
  )

  const filtered = useMemo(() => {
    let rows = filterBySearch(data, search, searchFields)
    if (filterFn) rows = rows.filter(filterFn)
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const av = a[sortKey]
        const bv = b[sortKey]
        if (typeof av === 'number' && typeof bv === 'number') return av - bv
        return String(av).localeCompare(String(bv), 'tr')
      })
      if (sortDir === 'desc') rows.reverse()
    }
    return rows
  }, [data, search, searchFields, filterFn, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  function toggleSort(key: keyof T) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function handleSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handlePageSize(size: number) {
    setPageSize(size)
    setPage(1)
  }

  return {
    search,
    setSearch: handleSearch,
    page: safePage,
    setPage,
    pageSize,
    setPageSize: handlePageSize,
    totalPages,
    totalCount: filtered.length,
    paginated,
    filtered,
    sortKey,
    sortDir,
    toggleSort,
  }
}
