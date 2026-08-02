import { ErpModuleShell, StatusBadge } from '@/components/erp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProductionPlanningDashboard } from '@/application/production-planning/use-production-planning'
import { OrderProgressBar } from '@/modules/orders/components/OrderProgressBar'

export function ProductionDashboardPage() {
  const { data, isLoading } = useProductionPlanningDashboard()
  if (isLoading || !data) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell title="Üretim Dashboard" description="Günlük üretim, kapasite, verim ve termin riski" kpis={data.kpis}>
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Günlük Üretim</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.dailyProduction.map((d) => (
              <div key={d.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{d.label}</span>
                  <span className="tabular-nums">{d.actual.toLocaleString('tr-TR')} / {d.planned.toLocaleString('tr-TR')}</span>
                </div>
                <OrderProgressBar value={Math.round((d.actual / d.planned) * 100)} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Kapasite Kullanımı</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.capacityByDepartment.map((c) => (
              <div key={c.department}>
                <div className="mb-1 flex justify-between text-sm"><span>{c.department}</span><span>%{c.used}</span></div>
                <OrderProgressBar value={c.used} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Fire Özeti</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-2xl font-semibold">{data.wasteSummary.fire}</p><p className="text-xs text-muted-foreground">Fire</p></div>
            <div><p className="text-2xl font-semibold">{data.wasteSummary.rework}</p><p className="text-xs text-muted-foreground">Rework</p></div>
            <div><p className="text-2xl font-semibold">{data.wasteSummary.secondQuality}</p><p className="text-xs text-muted-foreground">2. Kalite</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Termin Riski</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.delayedOrders.map((d) => (
              <div key={d.orderNo} className="flex items-center justify-between text-sm">
                <span className="font-medium">{d.orderNo}</span>
                <StatusBadge label={d.blocker} tone="danger" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Yoğun Atölyeler</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.busyWorkshops.map((w) => (
              <div key={w.name} className="flex justify-between text-sm"><span>{w.name}</span><span>%{w.load} yük</span></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Boş Kapasite</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.freeCapacityWorkshops.map((w) => (
              <div key={w.name} className="flex justify-between text-sm"><span>{w.name}</span><span>{w.remaining.toLocaleString('tr-TR')} adet</span></div>
            ))}
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}
