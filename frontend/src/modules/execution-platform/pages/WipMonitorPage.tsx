import { StatusBadge } from '@/components/erp'
import { useWipMonitoring } from '@/application/execution-platform'

import { ExecutionPageFrame } from '../components/ExecutionPageFrame'
import { PageLoading, RequireProductionOrder } from '../components/RequireProductionOrder'

export function WipMonitorPage() {
  return (
    <RequireProductionOrder>
      {(po) => <WipContent po={po} />}
    </RequireProductionOrder>
  )
}

function WipContent({ po }: { po: string }) {
  const { data, isLoading } = useWipMonitoring(po)

  if (isLoading || !data) return <PageLoading />

  return (
    <ExecutionPageFrame
      title="WIP Monitor"
      purpose="Üretim müdürü — operasyon kuyruğu, hat yoğunluğu, bekleme"
      kpis={[
        { label: 'Toplam WIP', value: String(data.summary.totalWipQty), hint: po },
        { label: 'Darboğaz', value: data.summary.bottleneckOperationCode ?? '—', hint: '' },
        { label: 'Ort. Bekleme', value: `${data.summary.averageWaitMinutes} dk`, hint: '' },
      ]}
      criticalKpiIndexes={[1]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border">
          <p className="border-b border-border px-3 py-2 text-sm font-medium">Operasyon Yoğunluğu</p>
          <div className="divide-y divide-border">
            {data.summary.byOperation.map((op) => (
              <div key={op.operationCode} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{op.operationName}</span>
                <span className="tabular-nums font-medium">{op.totalQty} adet</span>
              </div>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-2 py-2">Op</th>
                <th className="px-2 py-2">Hat</th>
                <th className="px-2 py-2">Konum</th>
                <th className="px-2 py-2">Adet</th>
                <th className="px-2 py-2">Durum</th>
              </tr>
            </thead>
            <tbody>
              {data.positions.slice(0, 20).map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-2 py-1.5 font-mono text-xs">{p.operationCode}</td>
                  <td className="px-2 py-1.5">{p.lineId ?? '—'}</td>
                  <td className="px-2 py-1.5 text-xs">{p.currentLocationCode ?? '—'}</td>
                  <td className="px-2 py-1.5 tabular-nums">{p.quantity}</td>
                  <td className="px-2 py-1.5">
                    <StatusBadge label={p.state.label} tone="muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ExecutionPageFrame>
  )
}
