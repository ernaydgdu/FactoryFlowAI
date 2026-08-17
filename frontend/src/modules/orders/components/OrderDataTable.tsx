import { useQuery } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react'
import { useMemo, type ReactNode } from 'react'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { useAuth } from '@/application/platform/iam/auth-context'
import { StatusBadge } from '@/components/erp'
import { fetchApprovalStages } from '@/infrastructure/api/orders-api.repository'
import { cn } from '@/lib/utils'

import {
  materialStatusTone,
  productionStatusTone,
  stageStatusTone,
} from '../constants'
import type { UseOrderListReturn } from '../hooks/use-order-list'
import { getUniqueFilterValues } from '../hooks/use-order-list'
import type { ColumnFilterKey, Order, OrderSortKey } from '../types'
import { OrderProgressBar } from './OrderProgressBar'
import { OrderRowActions } from './OrderRowActions'

type OrderDataTableProps = {
  orders: Order[]
  list: UseOrderListReturn
  onDeleteRow: (order: Order) => void
}

type TableColumnDef = {
  id: string
  label: string
  sortKey?: OrderSortKey
  filterKey?: ColumnFilterKey
  sticky?: 'left' | 'right'
  className?: string
  render: (order: Order) => ReactNode
}

export function OrderDataTable({ orders, list, onDeleteRow }: OrderDataTableProps) {
  const {
    sort,
    toggleSort,
    columnFilters,
    setColumnFilter,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    allOrders,
  } = list

  const { user } = useAuth()
  const canDelete = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const filterOptions = useMemo(
    () =>
      Object.fromEntries(
        (
          [
            'customer',
            'brand',
            'season',
            'productionStatus',
            'fabricStatus',
            'accessoryStatus',
            'planner',
          ] as ColumnFilterKey[]
        ).map((key) => [key, getUniqueFilterValues(allOrders, key)]),
      ) as Record<ColumnFilterKey, string[]>,
    [allOrders],
  )

  const columns: TableColumnDef[] = [
    {
      id: 'orderNo',
      label: 'Sipariş No',
      sortKey: 'orderNo',
      render: (o) => <span className="font-medium">{o.orderNo}</span>,
    },
    {
      id: 'risk',
      label: 'Risk',
      render: (o) =>
        o.terminRisk ? (
          <span title="Termin riski — malzeme EXF'den geç geliyor" className="text-base">
            ⚠️
          </span>
        ) : (
          <span title="Termin riski yok" className="text-base text-emerald-600">
            ✓
          </span>
        ),
    },
    {
      id: 'material',
      label: 'Malzeme',
      render: (o) =>
        o.productType === null ? (
          <span
            title="Ürün tipi tanınmıyor, kumaş yeterliliği hesaplanamadı"
            className="text-base text-muted-foreground"
          >
            —
          </span>
        ) : o.materialWarning ? (
          <span title="Kumaş Yetersiz" className="text-base">
            📦⚠️
          </span>
        ) : (
          <span title="Kumaş miktarı yeterli görünüyor" className="text-base grayscale">
            📦
          </span>
        ),
    },
    {
      id: 'customer',
      label: 'Müşteri',
      sortKey: 'customer',
      filterKey: 'customer',
      render: (o) => o.customer,
    },
    {
      id: 'brand',
      label: 'Marka',
      sortKey: 'brand',
      filterKey: 'brand',
      render: (o) => o.brand,
    },
    {
      id: 'model',
      label: 'Model',
      sortKey: 'model',
      className: 'max-w-[160px] truncate',
      render: (o) => (
        <span title={o.model} className="block truncate">
          {o.model}
        </span>
      ),
    },
    {
      id: 'season',
      label: 'Sezon',
      sortKey: 'season',
      filterKey: 'season',
      render: (o) => o.season,
    },
    {
      id: 'color',
      label: 'Renk',
      sortKey: 'color',
      render: (o) => o.color,
    },
    {
      id: 'sizeSet',
      label: 'Beden Seti',
      render: (o) => o.sizeSet,
    },
    {
      id: 'totalQuantity',
      label: 'Toplam Adet',
      sortKey: 'totalQuantity',
      className: 'text-right tabular-nums',
      render: (o) => o.totalQuantity.toLocaleString('tr-TR'),
    },
    {
      id: 'exfDate',
      label: 'Termin (EXF)',
      sortKey: 'exfTimestamp',
      render: (o) => (
        <span className={cn(o.terminRisk && 'font-medium text-amber-700')}>
          {o.exfDate}
        </span>
      ),
    },
    {
      id: 'productionStatus',
      label: 'Üretim Durumu',
      sortKey: 'productionStatus',
      filterKey: 'productionStatus',
      render: (o) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge
            label={o.productionStatus}
            tone={productionStatusTone[o.productionStatus]}
          />
          {o.closedAt ? <StatusBadge label="🔒 Kapalı" tone="muted" /> : null}
        </div>
      ),
    },
    {
      id: 'colorSizeSummary',
      label: 'Renk/Beden',
      render: (o) => <ColorSizeSummaryCell order={o} />,
    },
    {
      id: 'approvalProgress',
      label: 'Onay',
      render: (o) => <ApprovalProgressCell orderId={o.id} />,
    },
    {
      id: 'fabricStatus',
      label: 'Kumaş Durumu',
      filterKey: 'fabricStatus',
      render: (o) => (
        <StatusBadge
          label={o.fabricStatus}
          tone={materialStatusTone[o.fabricStatus]}
        />
      ),
    },
    {
      id: 'accessoryStatus',
      label: 'Aksesuar Durumu',
      filterKey: 'accessoryStatus',
      render: (o) => (
        <StatusBadge
          label={o.accessoryStatus}
          tone={materialStatusTone[o.accessoryStatus]}
        />
      ),
    },
    {
      id: 'cuttingStatus',
      label: 'Kesim',
      render: (o) => (
        <StatusBadge
          label={o.cuttingStatus}
          tone={stageStatusTone[o.cuttingStatus]}
        />
      ),
    },
    {
      id: 'sewingStatus',
      label: 'Dikim',
      render: (o) => (
        <StatusBadge
          label={o.sewingStatus}
          tone={stageStatusTone[o.sewingStatus]}
        />
      ),
    },
    {
      id: 'packingStatus',
      label: 'Paket',
      render: (o) => (
        <StatusBadge
          label={o.packingStatus}
          tone={stageStatusTone[o.packingStatus]}
        />
      ),
    },
    {
      id: 'shippingStatus',
      label: 'Sevkiyat',
      render: (o) => (
        <StatusBadge
          label={o.shippingStatus}
          tone={stageStatusTone[o.shippingStatus]}
        />
      ),
    },
    {
      id: 'progress',
      label: 'İlerleme %',
      sortKey: 'progress',
      className: 'min-w-[120px]',
      render: (o) => <OrderProgressBar value={o.progress} />,
    },
    {
      id: 'planner',
      label: 'Sorumlu Planlamacı',
      sortKey: 'planner',
      filterKey: 'planner',
      render: (o) => o.planner,
    },
  ]

  const visibleIds = orders.map((o) => o.id)
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const someVisibleSelected =
    visibleIds.some((id) => selectedIds.has(id)) && !allVisibleSelected

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-16 text-center text-sm text-muted-foreground">
        Filtrelere uygun sipariş bulunamadı.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1800px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="sticky left-0 z-20 w-10 bg-muted/95 px-3 py-2">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someVisibleSelected
                }}
                onChange={() => toggleSelectAll(visibleIds)}
                className="size-4 rounded border-input accent-primary"
                aria-label="Tümünü seç"
              />
            </th>
            {columns.map((col) => (
              <th
                key={col.id}
                className={cn('px-3 py-2 font-medium whitespace-nowrap', col.className)}
              >
                {col.sortKey ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col.sortKey!)}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    {col.label}
                    <SortIcon
                      column={col.sortKey}
                      sortKey={sort.key}
                      direction={sort.direction}
                    />
                  </button>
                ) : (
                  col.label
                )}
                {col.filterKey ? (
                  <ColumnFilterSelect
                    columnKey={col.filterKey}
                    label={col.label}
                    value={columnFilters[col.filterKey]}
                    options={filterOptions[col.filterKey] ?? []}
                    onChange={setColumnFilter}
                  />
                ) : null}
              </th>
            ))}
            <th className="sticky right-0 z-20 bg-muted/95 px-3 py-2 font-medium whitespace-nowrap">
              İşlemler
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const selected = selectedIds.has(order.id)
            return (
              <tr
                key={order.id}
                className={cn(
                  'border-b border-border/60 transition-colors hover:bg-muted/20',
                  selected && 'bg-primary/5',
                  order.terminRisk && 'border-l-2 border-l-amber-500',
                )}
              >
                <td className="sticky left-0 z-10 bg-card px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleSelect(order.id)}
                    className="size-4 rounded border-input accent-primary"
                    aria-label={`${order.orderNo} seç`}
                  />
                </td>
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn('px-3 py-2.5 whitespace-nowrap', col.className)}
                  >
                    {col.render(order)}
                  </td>
                ))}
                <td className="sticky right-0 z-10 bg-card px-3 py-2.5">
                  <OrderRowActions
                    orderId={order.id}
                    onDelete={() => onDeleteRow(order)}
                    canDelete={canDelete}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ApprovalProgressCell({ orderId }: { orderId: string }) {
  const stagesQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.approvalStages(orderId),
    queryFn: () => fetchApprovalStages(orderId),
    staleTime: 60_000,
  })

  if (stagesQuery.isLoading || !stagesQuery.data) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const total = stagesQuery.data.length
  const approved = stagesQuery.data.filter((s) => s.status === 'APPROVED').length

  const toneClass =
    total > 0 && approved === total
      ? 'text-emerald-700 dark:text-emerald-400'
      : approved === 0
        ? 'text-muted-foreground'
        : 'text-amber-700 dark:text-amber-400'

  return (
    <span className={cn('text-xs font-medium tabular-nums', toneClass)}>
      {approved}/{total}
    </span>
  )
}

function ColorSizeSummaryCell({ order }: { order: Order }) {
  const { colorCount, colorSizeTotal, totalQuantity } = order

  if (colorSizeTotal === 0) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  if (colorSizeTotal === totalQuantity) {
    return (
      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
        ✓ {colorCount} renk
      </span>
    )
  }

  return (
    <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
      {colorCount} renk ({colorSizeTotal.toLocaleString('tr-TR')}/
      {totalQuantity.toLocaleString('tr-TR')})
    </span>
  )
}

function SortIcon({
  column,
  sortKey,
  direction,
}: {
  column: OrderSortKey
  sortKey: OrderSortKey
  direction: 'asc' | 'desc'
}) {
  if (sortKey !== column) {
    return <ArrowUpDown className="size-3.5 opacity-40" />
  }
  return direction === 'asc' ? (
    <ArrowUp className="size-3.5" />
  ) : (
    <ArrowDown className="size-3.5" />
  )
}

function ColumnFilterSelect({
  columnKey,
  label,
  value,
  options,
  onChange,
}: {
  columnKey: ColumnFilterKey
  label: string
  value?: string
  options: string[]
  onChange: (key: ColumnFilterKey, value: string) => void
}) {
  return (
    <div className="relative mt-1">
      <select
        aria-label={`${label} filtresi`}
        value={value ?? 'all'}
        onChange={(e) => onChange(columnKey, e.target.value)}
        className="h-7 w-full appearance-none rounded border border-input bg-background pr-6 pl-2 text-[11px] outline-none focus-visible:border-ring"
      >
        <option value="all">Tümü</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-1.5 size-3 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
