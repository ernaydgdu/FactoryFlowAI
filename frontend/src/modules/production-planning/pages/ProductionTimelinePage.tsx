import { StatusBadge } from '@/components/erp'
import { ErpModuleShell } from '@/components/erp'
import { useProductionPlanningTimeline } from '@/application/production-planning/use-production-planning'

const FLOW = ['CUTTING', 'SEWING', 'WASHING', 'QUALITY', 'PACKING', 'SHIPPING']

export function ProductionTimelinePage() {
  const { data = [], isLoading } = useProductionPlanningTimeline()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  const byOrder = data.reduce<Record<string, typeof data>>((acc, step) => {
    (acc[step.orderNo] ??= []).push(step)
    return acc
  }, {})

  return (
    <ErpModuleShell title="Üretim Timeline" description="Kesim → Dikim → Yıkama → Kalite → Paket → Sevkiyat" kpis={[
      { label: 'Sipariş', value: String(Object.keys(byOrder).length), hint: 'İzlenen' },
    ]}>
      <div className="space-y-6 p-4">
        {Object.entries(byOrder).map(([orderNo, steps]) => (
          <div key={orderNo} className="rounded-lg border p-4">
            <h3 className="mb-4 font-medium">{orderNo}</h3>
            <div className="flex flex-wrap items-center gap-2">
              {FLOW.map((stage, i) => {
                const step = steps.find((s) => s.stage === stage)
                return (
                  <div key={stage} className="flex items-center gap-2">
                    <div className="rounded-md border px-3 py-2 text-center text-sm min-w-[90px]">
                      <p className="font-medium">{step?.label ?? stage}</p>
                      {step && <StatusBadge label={step.status.label} tone={step.status.tone} />}
                      {step?.plannedDate && <p className="mt-1 text-xs text-muted-foreground">{step.plannedDate}</p>}
                    </div>
                    {i < FLOW.length - 1 && <span className="text-muted-foreground">↓</span>}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </ErpModuleShell>
  )
}
