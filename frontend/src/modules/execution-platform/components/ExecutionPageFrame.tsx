import type { ReactNode } from 'react'

import { KpiCards, type KpiItem } from '@/components/erp'
import { cn } from '@/lib/utils'

type ExecutionPageFrameProps = {
  title: string
  purpose: string
  kpis?: KpiItem[]
  criticalKpiIndexes?: number[]
  toolbar?: ReactNode
  children: ReactNode
  className?: string
}

export function ExecutionPageFrame({
  title,
  purpose,
  kpis,
  criticalKpiIndexes = [],
  toolbar,
  children,
  className,
}: ExecutionPageFrameProps) {
  const enrichedKpis = kpis?.map((kpi, i) =>
    criticalKpiIndexes.includes(i) ? { ...kpi, hint: kpi.hint ? `★ ${kpi.hint}` : '★ Kritik' } : kpi,
  )

  return (
    <div className={cn('mx-auto max-w-[1800px] space-y-4', className)}>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{purpose}</p>
        </div>
        {toolbar}
      </header>
      {enrichedKpis && enrichedKpis.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {enrichedKpis.map((kpi, i) => (
            <div
              key={kpi.label}
              className={cn(
                'rounded-lg border border-border bg-card px-4 py-3',
                criticalKpiIndexes.includes(i) && 'border-critical/40 bg-critical/5',
              )}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
              <p
                className={cn(
                  'mt-1 text-2xl font-semibold tabular-nums',
                  criticalKpiIndexes.includes(i) ? 'text-critical' : 'text-foreground',
                )}
              >
                {kpi.value}
              </p>
              {kpi.hint ? <p className="mt-0.5 text-xs text-muted-foreground">{kpi.hint}</p> : null}
            </div>
          ))}
        </div>
      ) : kpis ? <KpiCards items={kpis} columns={4} /> : null}
      {children}
    </div>
  )
}
