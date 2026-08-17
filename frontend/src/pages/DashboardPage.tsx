import { useMutation, useQuery } from '@tanstack/react-query'
import { Package, Scissors, Shirt, Sparkles, Truck } from 'lucide-react'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { AiAdvisorChat } from '@/components/dashboard/AiAdvisorChat'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  activeOrders,
  criticalStockItems,
  dailyProductionKpis,
  deadlineRiskOrders,
  productionLines,
  quickActions,
} from '@/config/dashboard'
import {
  fetchAiAdvice,
  fetchDashboard,
  fetchDashboardAlerts,
  fetchQualitySummary,
  fetchSupplierPerformance,
  type DashboardAlertSeverity,
  type SupplierPerformance,
} from '@/infrastructure/api/dashboard-api.repository'
import { getQualityRateTone, QUALITY_RATE_TONE_CLASS } from '@/lib/quality-rate'
import { getReliabilityTone } from '@/lib/reliability-rate'
import { cn } from '@/lib/utils'

const ALERT_SEVERITY_STYLE: Record<DashboardAlertSeverity, string> = {
  HIGH: 'border-destructive/30 bg-destructive/5 text-destructive',
  MEDIUM: 'border-amber-500/30 bg-amber-500/5 text-amber-700',
  LOW: 'border-blue-500/30 bg-blue-500/5 text-blue-700',
}

export function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: applicationQueryKeys.dashboardSummary.summary(),
    queryFn: fetchDashboard,
  })

  const alertsQuery = useQuery({
    queryKey: applicationQueryKeys.dashboardSummary.alerts(),
    queryFn: fetchDashboardAlerts,
  })

  const aiAdviceMutation = useMutation({ mutationFn: fetchAiAdvice })

  const qualitySummaryQuery = useQuery({
    queryKey: applicationQueryKeys.dashboardSummary.qualitySummary(),
    queryFn: fetchQualitySummary,
  })

  const supplierPerformanceQuery = useQuery({
    queryKey: applicationQueryKeys.dashboardSummary.supplierPerformance(),
    queryFn: fetchSupplierPerformance,
  })

  // Tek seferlik siparişler yanıltıcı olmasın diye en az 2 sipariş verilmiş tedarikçiler arasından bakılır.
  const riskySupplier = (supplierPerformanceQuery.data ?? [])
    .filter((supplier) => supplier.totalOrders >= 2)
    .reduce<SupplierPerformance | null>(
      (worst, supplier) =>
        !worst || supplier.reliabilityScore < worst.reliabilityScore ? supplier : worst,
      null,
    )

  const stats = dashboardQuery.data
  const dashboardStats = stats
    ? [
        { label: 'Toplam Sipariş', value: String(stats.totalOrders), hint: 'Aktif portföy' },
        {
          label: 'Termin Riski',
          value: String(stats.terminRiskOrders),
          hint: "Malzeme EXF'den geç geliyor",
        },
        {
          label: 'Bugünkü Üretim',
          value: stats.totalProduction.toLocaleString('tr-TR'),
          hint: 'Tüm aşamalar toplamı',
        },
        {
          label: 'Bugün Kesilen',
          value: stats.cuttingToday.toLocaleString('tr-TR'),
          hint: 'Kesim aşaması',
        },
        {
          label: 'Bugün Dikilen',
          value: stats.sewingToday.toLocaleString('tr-TR'),
          hint: 'Dikim aşaması',
        },
      ]
    : []

  const todayActual = dailyProductionKpis[4]?.actual ?? 0
  const todayPlanned = dailyProductionKpis[4]?.planned ?? 1
  const todayRate = Math.round((todayActual / todayPlanned) * 100)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Tekstil Üretim Kontrol Paneli
        </h2>
        <p className="text-sm text-muted-foreground">
          Sipariş, üretim, stok ve termin riski — günlük operasyon özeti.
        </p>
      </div>

      {dashboardQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Kontrol paneli verileri yüklenemedi.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {dashboardQuery.isLoading ? (
          <p className="text-sm text-muted-foreground sm:col-span-2 xl:col-span-5">
            Yükleniyor...
          </p>
        ) : (
          dashboardStats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-2xl font-bold tabular-nums xl:text-3xl">
                  {stat.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{stat.hint}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Akıllı Uyarılar</CardTitle>
            <CardDescription>Kural tabanlı termin ve üretim uyarıları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {alertsQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            ) : alertsQuery.isError ? (
              <p className="text-sm text-destructive">Uyarılar yüklenemedi.</p>
            ) : alertsQuery.data && alertsQuery.data.length > 0 ? (
              alertsQuery.data.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'rounded-lg border px-4 py-3 text-sm font-medium',
                    ALERT_SEVERITY_STYLE[alert.severity],
                  )}
                >
                  {alert.message}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Şu anda aktif uyarı yok.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AI Danışman</CardTitle>
            <CardDescription>Yapay zeka destekli üretim önerileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              size="sm"
              onClick={() => aiAdviceMutation.mutate()}
              disabled={aiAdviceMutation.isPending}
            >
              <Sparkles className="size-4" />
              {aiAdviceMutation.isPending ? 'Analiz ediliyor...' : 'AI Danışman'}
            </Button>

            {aiAdviceMutation.isError ? (
              <p className="text-sm text-destructive">
                {aiAdviceMutation.error instanceof Error
                  ? aiAdviceMutation.error.message
                  : 'Öneri alınamadı.'}
              </p>
            ) : null}

            {aiAdviceMutation.data ? (
              <div className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm">
                {aiAdviceMutation.data.advice}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kalite Özeti</CardTitle>
            <CardDescription>Genel 2. kalite ve fire oranı</CardDescription>
          </CardHeader>
          <CardContent>
            {qualitySummaryQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            ) : qualitySummaryQuery.isError ? (
              <p className="text-sm text-destructive">Kalite özeti yüklenemedi.</p>
            ) : qualitySummaryQuery.data ? (
              <div className="space-y-2">
                <div
                  className={cn(
                    'rounded-lg border px-3 py-2',
                    QUALITY_RATE_TONE_CLASS[
                      getQualityRateTone(qualitySummaryQuery.data.secondQualityRate)
                    ],
                  )}
                >
                  <p className="text-xs opacity-80">2. Kalite Oranı</p>
                  <p className="text-lg font-bold tabular-nums">
                    %{qualitySummaryQuery.data.secondQualityRate.toFixed(1)}
                  </p>
                </div>
                <div
                  className={cn(
                    'rounded-lg border px-3 py-2',
                    QUALITY_RATE_TONE_CLASS[
                      getQualityRateTone(qualitySummaryQuery.data.rejectionRate)
                    ],
                  )}
                >
                  <p className="text-xs opacity-80">Fire Oranı</p>
                  <p className="text-lg font-bold tabular-nums">
                    %{qualitySummaryQuery.data.rejectionRate.toFixed(1)}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">En Riskli Tedarikçi</CardTitle>
            <CardDescription>En düşük güvenilirlik skoru (en az 2 sipariş)</CardDescription>
          </CardHeader>
          <CardContent>
            {supplierPerformanceQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            ) : supplierPerformanceQuery.isError ? (
              <p className="text-sm text-destructive">Tedarikçi verisi yüklenemedi.</p>
            ) : riskySupplier ? (
              <div
                className={cn(
                  'rounded-lg border px-3 py-2',
                  QUALITY_RATE_TONE_CLASS[getReliabilityTone(riskySupplier.reliabilityScore)],
                )}
              >
                <p className="text-sm font-semibold">{riskySupplier.supplierName}</p>
                <p className="text-lg font-bold tabular-nums">
                  %{riskySupplier.reliabilityScore.toFixed(1)}
                </p>
                <p className="text-xs opacity-80">
                  {riskySupplier.totalOrders} sipariş · {riskySupplier.lateCount} geç
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Yeterli veri yok (en az 2 sipariş gerekli).
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <AiAdvisorChat />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Günlük Üretim KPI</CardTitle>
            <CardDescription>
              Son 7 gün planlanan vs gerçekleşen adet — bugün %{todayRate}{' '}
              tamamlandı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-3">
              {dailyProductionKpis.map((point) => {
                const maxValue = Math.max(
                  ...dailyProductionKpis.map((item) => item.planned),
                  1,
                )
                const plannedHeight = (point.planned / maxValue) * 100
                const actualHeight = (point.actual / maxValue) * 100

                return (
                  <div
                    key={point.day}
                    className="flex flex-1 flex-col items-center gap-2"
                  >
                    <div className="flex h-36 w-full items-end justify-center gap-1">
                      <div
                        className="w-3 rounded-t-sm bg-primary/20"
                        style={{ height: `${plannedHeight}%` }}
                        title={`Plan: ${point.planned.toLocaleString('tr-TR')}`}
                      />
                      <div
                        className="w-3 rounded-t-sm bg-primary"
                        style={{ height: `${actualHeight}%` }}
                        title={`Gerçek: ${point.actual.toLocaleString('tr-TR')}`}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {point.day}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-primary/20" />
                Planlanan
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-primary" />
                Gerçekleşen
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Termin Riski</CardTitle>
            <CardDescription>EXF yaklaşan siparişler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {deadlineRiskOrders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {order.orderNo}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.customer} · {order.style}
                    </p>
                  </div>
                  <RiskBadge level={order.riskLevel} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{order.blocker}</span>
                  <span className="font-medium text-destructive">
                    {order.daysLeft} gün
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Siparişler</CardTitle>
            <CardDescription>Aktif sipariş portföyü</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Sipariş No</th>
                  <th className="pb-3 pr-4 font-medium">Müşteri</th>
                  <th className="pb-3 pr-4 font-medium">Model</th>
                  <th className="pb-3 pr-4 font-medium">Adet</th>
                  <th className="pb-3 pr-4 font-medium">EXF</th>
                  <th className="pb-3 pr-4 font-medium">Aşama</th>
                  <th className="pb-3 font-medium">İlerleme</th>
                </tr>
              </thead>
              <tbody>
                {activeOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border/60">
                    <td className="py-3 pr-4 font-medium">{order.orderNo}</td>
                    <td className="py-3 pr-4">{order.customer}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {order.style}
                    </td>
                    <td className="py-3 pr-4 tabular-nums">
                      {order.quantity.toLocaleString('tr-TR')}
                    </td>
                    <td className="py-3 pr-4">{order.exfDate}</td>
                    <td className="py-3 pr-4">
                      <StageBadge stage={order.status} />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${order.progress}%` }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          %{order.progress}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kritik Stok</CardTitle>
            <CardDescription>Minimum seviye altı malzemeler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalStockItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-border bg-background p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.materialCode} · {item.supplier}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                    Kritik
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <span className="text-muted-foreground">
                    Stok:{' '}
                    <strong className="text-foreground">
                      {item.onHand.toLocaleString('tr-TR')} {item.unit}
                    </strong>
                  </span>
                  <span className="text-right text-muted-foreground">
                    Min: {item.minLevel.toLocaleString('tr-TR')} {item.unit}
                  </span>
                  <span className="col-span-2 text-muted-foreground">
                    ETA: {item.eta}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Üretim Hatları</CardTitle>
            <CardDescription>Fabrika bazlı anlık hat performansı</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {productionLines.map((line) => (
              <div
                key={line.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{line.name}</p>
                    <LineStatusBadge status={line.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">{line.factory}</p>
                  {line.orderNo !== '—' ? (
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {line.orderNo} · {line.style}
                    </p>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center sm:gap-6">
                  <Metric label="Hedef" value={line.target.toLocaleString('tr-TR')} />
                  <Metric
                    label="Üretilen"
                    value={line.produced.toLocaleString('tr-TR')}
                  />
                  <Metric
                    label="Verim"
                    value={line.efficiency > 0 ? `%${line.efficiency}` : '—'}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
            <CardDescription>Planlayıcı kısayolları</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((action) => (
              <button
                key={action}
                type="button"
                className="flex w-full items-center rounded-md border border-border bg-background px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent"
              >
                {action}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  )
}

function RiskBadge({ level }: { level: 'Yüksek' | 'Orta' | 'Düşük' }) {
  const styles = {
    Yüksek: 'bg-destructive/10 text-destructive',
    Orta: 'bg-amber-500/10 text-amber-700',
    Düşük: 'bg-emerald-500/10 text-emerald-700',
  }

  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
        styles[level],
      )}
    >
      {level}
    </span>
  )
}

function StageBadge({
  stage,
}: {
  stage: 'Planlama' | 'Kesim' | 'Dikim' | 'Yıkama' | 'Sevkiyat'
}) {
  const icons = {
    Planlama: Package,
    Kesim: Scissors,
    Dikim: Shirt,
    Yıkama: Shirt,
    Sevkiyat: Truck,
  }

  const Icon = icons[stage]

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      <Icon className="size-3" />
      {stage}
    </span>
  )
}

function LineStatusBadge({
  status,
}: {
  status: 'Aktif' | 'Bakım' | 'Boş'
}) {
  const styles = {
    Aktif: 'bg-emerald-500/10 text-emerald-700',
    Bakım: 'bg-amber-500/10 text-amber-700',
    Boş: 'bg-muted text-muted-foreground',
  }

  return (
    <span
      className={cn(
        'rounded-full px-2 py-0.5 text-xs font-medium',
        styles[status],
      )}
    >
      {status}
    </span>
  )
}

