import { useMutation, useQuery } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

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
  fetchAiAdvice,
  fetchDashboard,
  fetchDashboardAlerts,
  fetchQualitySummary,
  fetchRiskyOrders,
  fetchSupplierPerformance,
  type DashboardAlertSeverity,
  type SupplierPerformance,
} from '@/infrastructure/api/dashboard-api.repository'
import { fetchLineStatus } from '@/infrastructure/api/production-lines-api.repository'
import { getQualityRateTone, QUALITY_RATE_TONE_CLASS } from '@/lib/quality-rate'
import { getReliabilityTone } from '@/lib/reliability-rate'
import { cn } from '@/lib/utils'

const ALERT_SEVERITY_STYLE: Record<DashboardAlertSeverity, string> = {
  HIGH: 'border-destructive/30 bg-destructive/5 text-destructive',
  MEDIUM: 'border-amber-500/30 bg-amber-500/5 text-amber-700',
  LOW: 'border-blue-500/30 bg-blue-500/5 text-blue-700',
}

export function DashboardPage() {
  const navigate = useNavigate()

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

  const lineStatusQuery = useQuery({
    queryKey: applicationQueryKeys.productionLine.status(),
    queryFn: fetchLineStatus,
  })

  const riskyOrdersQuery = useQuery({
    queryKey: applicationQueryKeys.dashboardSummary.riskyOrders(),
    queryFn: fetchRiskyOrders,
  })

  const lines = lineStatusQuery.data ?? []
  const avgFillRate =
    lines.length > 0
      ? lines.reduce((sum, line) => sum + line.fillRate, 0) / lines.length
      : 0
  const idleLineCount = lines.filter((line) => line.todayProduction === 0).length
  const behindPaceCount = lines.filter(
    (line) =>
      line.todayProduction > 0 &&
      !line.onPace &&
      line.currentHour >= line.workdayStartHour &&
      line.currentHour < line.workdayEndHour,
  ).length

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

  function scrollToRiskyOrders() {
    document
      .getElementById('riskli-siparisler-card')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

      <div className="grid gap-4 lg:grid-cols-6">
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hat Doluluğu</CardTitle>
            <CardDescription>Ortalama doluluk oranı</CardDescription>
          </CardHeader>
          <CardContent>
            {lineStatusQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Yükleniyor...</p>
            ) : lineStatusQuery.isError ? (
              <p className="text-sm text-destructive">Hat verisi yüklenemedi.</p>
            ) : lines.length > 0 ? (
              <div
                className={cn(
                  'rounded-lg border px-3 py-2',
                  avgFillRate <= 0
                    ? 'border-border bg-muted/30 text-muted-foreground'
                    : avgFillRate < 50
                      ? QUALITY_RATE_TONE_CLASS.danger
                      : avgFillRate <= 90
                        ? QUALITY_RATE_TONE_CLASS.success
                        : QUALITY_RATE_TONE_CLASS.warning,
                )}
              >
                <p className="text-lg font-bold tabular-nums">%{avgFillRate.toFixed(1)}</p>
                <p className="text-xs opacity-80">
                  {lines.length} hat · {idleLineCount} boşta
                </p>
                {behindPaceCount > 0 ? (
                  <p className="mt-1 text-xs font-semibold text-amber-600">
                    ⚠️ {behindPaceCount} hat hedefin gerisinde
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Tanımlı hat yok.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card id="riskli-siparisler-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Riskli Siparişler</CardTitle>
          <CardDescription>
            Termin, malzeme, fire, onay ve tamamlanma tahmini risklerinin birleşik görünümü
          </CardDescription>
        </CardHeader>
        <CardContent>
          {riskyOrdersQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor...</p>
          ) : riskyOrdersQuery.isError ? (
            <p className="text-sm text-destructive">Riskli siparişler yüklenemedi.</p>
          ) : riskyOrdersQuery.data && riskyOrdersQuery.data.length > 0 ? (
            <div className="space-y-2">
              {riskyOrdersQuery.data.map((order) => (
                <Link
                  key={order.orderId}
                  to={`/orders/${order.orderId}`}
                  className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3 transition-colors hover:bg-accent sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{order.orderNo}</span>
                      <RiskScoreBadge score={order.riskScore} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.buyerName} · {order.productName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {order.risks.map((risk) => (
                      <span
                        key={risk}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      >
                        {risk}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-emerald-600">
              ✓ Şu an risk taşıyan sipariş yok
            </p>
          )}
        </CardContent>
      </Card>

      <AiAdvisorChat />

      <Card>
        <CardHeader>
          <CardTitle>Hızlı İşlemler</CardTitle>
          <CardDescription>Planlayıcı kısayolları</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={scrollToRiskyOrders}
              className="flex w-full items-center rounded-md border border-border bg-background px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent"
            >
              Termin riski raporu
            </button>
            <button
              type="button"
              onClick={() => navigate('/line-status')}
              className="flex w-full items-center rounded-md border border-border bg-background px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-accent"
            >
              Günlük üretim özeti
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RiskScoreBadge({ score }: { score: number }) {
  const style =
    score >= 3
      ? 'bg-red-900 text-white'
      : score === 2
        ? 'bg-destructive/10 text-destructive'
        : 'bg-amber-500/10 text-amber-700'

  return (
    <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold', style)}>
      {score} risk
    </span>
  )
}

