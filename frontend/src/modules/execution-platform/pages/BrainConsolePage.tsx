import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useExecutionBrainView } from '@/application/execution-platform'

import { ExecutionPageFrame } from '../components/ExecutionPageFrame'
import { PageLoading, RequireProductionOrder } from '../components/RequireProductionOrder'

export function BrainConsolePage() {
  return (
    <RequireProductionOrder>
      {(po) => <BrainContent po={po} />}
    </RequireProductionOrder>
  )
}

function BrainContent({ po }: { po: string }) {
  const { data, isLoading } = useExecutionBrainView(po)

  if (isLoading || !data) return <PageLoading />

  const insight = data.insight

  return (
    <ExecutionPageFrame
      title="Brain Console"
      purpose="READ ONLY — darboğaz, termin, split önerisi, risk"
      kpis={[
        { label: 'WIP Yoğunluk', value: String(insight?.wipDensity ?? 0), hint: 'adet' },
        { label: 'Verim', value: `%${insight?.operationEfficiency ?? 0}`, hint: '' },
        { label: 'Kalite Yield', value: `%${insight?.qualityYield ?? 0}`, hint: '' },
        { label: 'Tahmini Bitiş', value: insight?.estimatedFinishDate ?? '—', hint: '' },
      ]}
      criticalKpiIndexes={[0, 3]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-critical/40 bg-critical/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-critical">Brain Önerileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{insight?.delayReason ?? 'Analiz bekleniyor'}</p>
            <p className="text-muted-foreground">Darboğaz: {insight?.bottleneckOperationName ?? '—'}</p>
            <p className="text-muted-foreground">Hat önerisi: {insight?.bestLineRecommendation ?? '—'}</p>
            {insight?.splitRecommendation ? (
              <p className="font-medium text-critical">{insight.splitRecommendation}</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bundle Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {data.bundleQueue.map((q) => (
              <div key={q.operationCode} className="flex justify-between">
                <span className="font-mono">{q.operationCode}</span>
                <span>{q.bundleCount} bundle</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">
        Metrikler: {data.availableMetrics.join(', ')} — Brain yalnızca okur, yazmaz.
      </p>
    </ExecutionPageFrame>
  )
}
