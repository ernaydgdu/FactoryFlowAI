import { ErpModuleShell, StatusBadge } from '@/components/erp'
import { useProductionSchedule } from '@/application/production-planning/use-production-planning'

export function ProductionSchedulePage() {
  const { data = [], isLoading } = useProductionSchedule()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  const byOrder = data.reduce<Record<string, typeof data>>((acc, block) => {
    (acc[block.orderNo] ??= []).push(block)
    return acc
  }, {})

  return (
    <ErpModuleShell
      title="Üretim Programı"
      description="Geriye doğru termin planlama — sürükle-bırak için hazır (data-draggable)"
      kpis={[
        { label: 'Blok', value: String(data.length), hint: 'Plan adımı' },
        { label: 'Sipariş', value: String(Object.keys(byOrder).length), hint: 'Aktif' },
      ]}
    >
      <div className="space-y-4 p-4">
        {Object.entries(byOrder).map(([orderNo, blocks]) => (
          <div key={orderNo} className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">{orderNo}</h3>
            <div className="flex flex-wrap gap-2">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  data-draggable={b.draggable}
                  data-order-id={b.orderId}
                  data-stage={b.stage}
                  className="cursor-grab rounded-md border bg-card px-3 py-2 text-sm shadow-sm active:cursor-grabbing"
                  title={`${b.label} — ${b.plannedDate}`}
                >
                  <p className="font-medium">{b.label}</p>
                  <p className="text-xs text-muted-foreground">{b.plannedDate}</p>
                  <StatusBadge label={b.status.label} tone={b.status.tone} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ErpModuleShell>
  )
}
