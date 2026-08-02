import { cn } from '@/lib/utils'

import { QUICK_FILTERS } from '../constants'
import type { QuickFilter } from '../types'

type OrderQuickFiltersProps = {
  active: QuickFilter
  onChange: (filter: QuickFilter) => void
  counts: Record<QuickFilter, number>
}

export function OrderQuickFilters({
  active,
  onChange,
  counts,
}: OrderQuickFiltersProps) {
  return (
    <aside className="w-full shrink-0 lg:w-52">
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Hızlı Filtreler
        </h3>
        <nav className="flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-1">
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onChange(filter.id)}
              className={cn(
                'flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors',
                active === filter.id
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-foreground hover:bg-muted/60',
              )}
            >
              <span>{filter.label}</span>
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs tabular-nums',
                  active === filter.id
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {counts[filter.id]}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  )
}
