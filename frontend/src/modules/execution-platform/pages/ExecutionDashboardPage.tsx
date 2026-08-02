import { StatusBadge } from '@/components/erp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  useExecutionBrainSummary,
  useExecutionContextList,
  useExecutionDashboard,
  useGlobalWipDensity,
} from '@/application/execution-platform'

import { ExecutionPageFrame } from '../components/ExecutionPageFrame'
import { PageLoading } from '../components/RequireProductionOrder'

export function ExecutionDashboardPage() {
  const { data, isLoading } = useExecutionDashboard()
  const { data: contexts = [] } = useExecutionContextList()
  const { data: globalWip = [] } = useGlobalWipDensity()
  const { data: brainSummary } = useExecutionBrainSummary()

  if (isLoading || !data) return <PageLoading />

  const topWip = globalWip[0]

  return (
    <ExecutionPageFrame
      title="Execution Dashboard"
      purpose="Fabrika müdürü sabah özeti — canlı hat, WIP, kalite, fire"
      kpis={[
        ...data.kpis,
        { label: 'Brain Aktif UE', value: String(brainSummary?.activeExecutions ?? 0), hint: 'READ ONLY' },
      ]}
      criticalKpiIndexes={[2, 3]}
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Aktif Üretim Emirleri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contexts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aktif üretim emri yok.</p>
            ) : (
              contexts.map((c) => (
                <div
                  key={c.productionOrderNo}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">{c.productionOrderNo}</span>
                    <span className="ml-2 text-muted-foreground">{c.productCode}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums text-muted-foreground">{c.bundleCount} bundle</span>
                    <StatusBadge label={c.status.label} tone={c.status.label === 'Aktif' ? 'success' : 'muted'} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-critical/30 bg-critical/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-critical">Brain Uyarıları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              En yoğun operasyon: <strong>{data.topWipOperation}</strong> — {data.topWipQty} adet WIP
            </p>
            {topWip ? (
              <p className="text-muted-foreground">
                Global: {topWip.operationCode} / {topWip.totalQty} adet kuyruk
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hat Durumu (Özet)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Detay için Work Session ve WIP ekranlarına geçin. Dashboard yalnızca özet taşır.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kalite / Fire / Rework</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-2xl font-semibold tabular-nums">—</p>
              <p className="text-xs text-muted-foreground">Kalite Gate</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">—</p>
              <p className="text-xs text-muted-foreground">Fire</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">—</p>
              <p className="text-xs text-muted-foreground">Rework</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ExecutionPageFrame>
  )
}
