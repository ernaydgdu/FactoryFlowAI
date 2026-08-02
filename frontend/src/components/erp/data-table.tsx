import { memo, useRef, type ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

import { cn } from '@/lib/utils'

export type Column<T> = {
  key: string
  header: string
  className?: string
  render: (row: T) => ReactNode
}

type DataTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  emptyMessage?: string
  virtualScroll?: boolean
  rowHeight?: number
  maxVisibleRows?: number
}

const VIRTUAL_THRESHOLD = 50
const DEFAULT_ROW_HEIGHT = 44
const DEFAULT_MAX_VISIBLE = 15

function DataTableInner<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'Kayıt bulunamadı.',
  virtualScroll,
  rowHeight = DEFAULT_ROW_HEIGHT,
  maxVisibleRows = DEFAULT_MAX_VISIBLE,
}: DataTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const useVirtual = virtualScroll ?? data.length >= VIRTUAL_THRESHOLD

  const virtualizer = useVirtualizer({
    count: useVirtual ? data.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
  })

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  const gridCols = `repeat(${columns.length}, minmax(0, 1fr))`

  if (!useVirtual) {
    return (
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              {columns.map((column) => (
                <th key={column.key} className={cn('px-4 py-3 font-medium', column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={rowKey(row)} className="border-b border-border/60 transition-colors hover:bg-muted/20">
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3 align-middle', column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const virtualRows = virtualizer.getVirtualItems()
  const totalHeight = virtualizer.getTotalSize()
  const viewportHeight = Math.min(maxVisibleRows * rowHeight + rowHeight, totalHeight + rowHeight)

  return (
    <div className="overflow-x-auto rounded-lg border border-border text-sm">
      <div
        className="grid min-w-[720px] border-b border-border bg-muted/40 text-left text-xs text-muted-foreground"
        style={{ gridTemplateColumns: gridCols }}
      >
        {columns.map((column) => (
          <div key={column.key} className={cn('px-4 py-3 font-medium', column.className)}>
            {column.header}
          </div>
        ))}
      </div>
      <div ref={parentRef} className="overflow-y-auto" style={{ maxHeight: viewportHeight }}>
        <div style={{ height: totalHeight, position: 'relative', width: '100%' }}>
          {virtualRows.map((virtualRow) => {
            const row = data[virtualRow.index]
            return (
              <div
                key={rowKey(row)}
                className="absolute left-0 grid w-full border-b border-border/60 transition-colors hover:bg-muted/20"
                style={{
                  height: virtualRow.size,
                  transform: `translateY(${virtualRow.start}px)`,
                  gridTemplateColumns: gridCols,
                }}
              >
                {columns.map((column) => (
                  <div key={column.key} className={cn('flex items-center px-4 py-3', column.className)}>
                    {column.render(row)}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner
