import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader } from '@/components/erp'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { fetchLineStatus, type LineStatus } from '@/infrastructure/api/production-lines-api.repository'
import { cn } from '@/lib/utils'

function fillRateTone(fillRate: number): 'idle' | 'low' | 'good' | 'over' {
  if (fillRate <= 0) return 'idle'
  if (fillRate < 50) return 'low'
  if (fillRate <= 90) return 'good'
  return 'over'
}

const FILL_RATE_BAR_CLASS: Record<'idle' | 'low' | 'good' | 'over', string> = {
  idle: 'bg-muted-foreground/30',
  low: 'bg-destructive',
  good: 'bg-emerald-500',
  over: 'bg-amber-500',
}

const FILL_RATE_TEXT_CLASS: Record<'idle' | 'low' | 'good' | 'over', string> = {
  idle: 'text-muted-foreground',
  low: 'text-destructive',
  good: 'text-emerald-600',
  over: 'text-amber-600',
}

function LineCard({ line }: { line: LineStatus }) {
  const tone = fillRateTone(line.fillRate)
  const idle = line.todayProduction === 0
  const withinWorkday =
    line.currentHour >= line.workdayStartHour && line.currentHour < line.workdayEndHour
  const showPace = withinWorkday && !idle

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{line.lineName}</CardTitle>
          {idle ? (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Boşta
            </span>
          ) : (
            <span className={cn('text-sm font-semibold tabular-nums', FILL_RATE_TEXT_CLASS[tone])}>
              %{line.fillRate.toFixed(1)}
            </span>
          )}
        </div>
        <CardDescription>
          {line.todayProduction.toLocaleString('tr-TR')} / {line.capacity.toLocaleString('tr-TR')} adet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', FILL_RATE_BAR_CLASS[tone])}
            style={{ width: `${Math.min(line.fillRate, 100)}%` }}
          />
        </div>

        {showPace ? (
          line.onPace ? (
            <p className="text-xs font-medium text-emerald-600">✓ Hedefin ilerisinde/hedefte</p>
          ) : (
            <p className="text-xs font-medium text-amber-600">⚠️ {line.paceMessage}</p>
          )
        ) : null}

        {line.activeOrders.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Çalışan Siparişler</p>
            {line.activeOrders.map((order) => (
              <div
                key={order.orderNo}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <p className="font-medium">{order.orderNo}</p>
                <p className="text-xs text-muted-foreground">
                  {order.buyerName} · {order.productName}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Bugün bu hatta üretim girişi yapılmadı.</p>
        )}
      </CardContent>
    </Card>
  )
}

export function LineStatusPage() {
  const lineStatusQuery = useQuery({
    queryKey: applicationQueryKeys.productionLine.status(),
    queryFn: fetchLineStatus,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hat Durumu"
        description="Üretim hatlarının bugünkü doluluk oranı ve aktif siparişleri."
      />

      {lineStatusQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : lineStatusQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Hat durumu yüklenemedi.
        </div>
      ) : lineStatusQuery.data && lineStatusQuery.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lineStatusQuery.data.map((line) => (
            <LineCard key={line.lineName} line={line} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Henüz tanımlı üretim hattı yok.</p>
      )}
    </div>
  )
}
