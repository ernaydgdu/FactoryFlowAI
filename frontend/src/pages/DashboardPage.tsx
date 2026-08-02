import { useMemo } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Package,
  Scissors,
  Shirt,
  Truck,
} from 'lucide-react'

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
import { getDashboardStatCards } from '@/domain/services/dashboard-service'
import { OPERATIONAL_DASHBOARD } from '@/domain/data/workflows'
import { cn } from '@/lib/utils'

const ops = OPERATIONAL_DASHBOARD

export function DashboardPage() {
  const dashboardStats = useMemo(() => getDashboardStatCards(), [])
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {dashboardStats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl font-bold tabular-nums xl:text-3xl">
                {stat.value}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendIcon trend={stat.trend} />
                <span>{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <OpsListCard title="Bugün Kesilecek" description="Kesim emri bekleyen siparişler" items={ops.todayCutting.map((i) => ({ primary: i.orderNo, secondary: i.style, value: `${i.qty} adet` }))} />
        <OpsListCard title="Bugün Dikilecek" description="Hat bazlı kalan üretim" items={ops.todaySewing.map((i) => ({ primary: i.orderNo, secondary: i.line, value: `${i.qty} adet` }))} />
        <OpsListCard title="Bugün Sevk Edilecek" description="EXF yaklaşan siparişler" items={ops.todayShipping.map((i) => ({ primary: i.orderNo, secondary: i.customer, value: i.exf }))} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OpsListCard title="Kritik Kumaşlar" description="Termin riski — stok yetersiz" items={ops.criticalFabrics.map((i) => ({ primary: i.code, secondary: i.name, value: `${i.daysLeft} gün` }))} valueClass="text-destructive" />
        <OpsListCard title="Kritik Aksesuarlar" description="Minimum stok altı" items={ops.criticalAccessories.map((i) => ({ primary: i.code, secondary: i.name, value: `${i.qty} ad` }))} valueClass="text-destructive" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <OpsListCard title="Geciken Satın Almalar" description="PO termin aşımı" items={ops.delayedPurchases.map((i) => ({ primary: i.poNo, secondary: i.supplier, value: `${i.daysLate} gün geç` }))} valueClass="text-amber-700" />
        <OpsListCard title="Termin Riski" description="EXF blocker analizi" items={ops.terminRisk.map((i) => ({ primary: i.orderNo, secondary: i.blocker, value: `${i.daysLeft} gün` }))} valueClass="text-destructive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>En Yoğun Hatlar</CardTitle>
            <CardDescription>Yük ve verim</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ops.busyLines.map((line) => (
              <div key={line.line} className="rounded-lg border p-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{line.line}</span>
                  <span className="text-muted-foreground">Verim %{line.efficiency}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary" style={{ width: `${line.load}%` }} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Yük %{line.load}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kapasite Kullanımı</CardTitle>
            <CardDescription>Departman bazlı doluluk</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ops.capacityUsage.map((cap) => (
              <div key={cap.department}>
                <div className="flex justify-between text-sm">
                  <span>{cap.department}</span>
                  <span className="font-medium">%{cap.used}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('h-full rounded-full', cap.used > 90 ? 'bg-destructive' : 'bg-primary')}
                    style={{ width: `${cap.used}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Üretim Takvimi</CardTitle>
            <CardDescription>5 günlük plan özeti</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2">Tarih</th>
                  <th className="pb-2">Kesim</th>
                  <th className="pb-2">Dikim</th>
                  <th className="pb-2">Sevk</th>
                </tr>
              </thead>
              <tbody>
                {ops.productionCalendar.map((day) => (
                  <tr key={day.date} className="border-b border-border/60">
                    <td className="py-2 font-medium">{day.date}</td>
                    <td className="py-2 tabular-nums">{day.cutting}</td>
                    <td className="py-2 tabular-nums">{day.sewing}</td>
                    <td className="py-2 tabular-nums">{day.shipping}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

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

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up') {
    return <ArrowUpRight className="size-3.5 text-emerald-600" />
  }

  if (trend === 'down') {
    return <ArrowDownRight className="size-3.5 text-amber-600" />
  }

  return <Minus className={cn('size-3.5 text-muted-foreground')} />
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

function OpsListCard({
  title,
  description,
  items,
  valueClass,
}: {
  title: string
  description: string
  items: { primary: string; secondary: string; value: string }[]
  valueClass?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.primary} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium">{item.primary}</p>
              <p className="truncate text-xs text-muted-foreground">{item.secondary}</p>
            </div>
            <span className={cn('shrink-0 text-xs font-medium', valueClass)}>{item.value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
