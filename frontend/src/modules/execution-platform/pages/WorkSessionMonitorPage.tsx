import { StatusBadge } from '@/components/erp'
import { useWorkSessionView } from '@/application/execution-platform'

import { ExecutionPageFrame } from '../components/ExecutionPageFrame'
import { PageLoading, RequireProductionOrder } from '../components/RequireProductionOrder'

export function WorkSessionMonitorPage() {
  return (
    <RequireProductionOrder>
      {(po) => <WorkSessionContent po={po} />}
    </RequireProductionOrder>
  )
}

function WorkSessionContent({ po }: { po: string }) {
  const { data, isLoading } = useWorkSessionView(po)

  if (isLoading || !data) return <PageLoading />

  return (
    <ExecutionPageFrame
      title="Work Session Monitor"
      purpose="Üretim müdürü — aktif operatör, makine, vardiya, canlı üretim"
      kpis={[
        { label: 'Aktif Session', value: String(data.activeSessions.length), hint: po },
        { label: 'Toplam Session', value: String(data.sessions.length), hint: '' },
        { label: 'InProgress', value: String(data.statusSummary.InProgress ?? 0), hint: '' },
      ]}
      criticalKpiIndexes={[0]}
    >
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Operasyon</th>
              <th className="px-3 py-2">Hat</th>
              <th className="px-3 py-2">Operatör</th>
              <th className="px-3 py-2">Makine</th>
              <th className="px-3 py-2">Vardiya</th>
              <th className="px-3 py-2">Üretim</th>
              <th className="px-3 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {data.sessions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  Aktif work session yok — Operasyon Board&apos;dan başlatın.
                </td>
              </tr>
            ) : (
              data.sessions.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono">{s.operationCode}</td>
                  <td className="px-3 py-2">{s.lineId}</td>
                  <td className="px-3 py-2">{s.operatorId}</td>
                  <td className="px-3 py-2">{s.machineId}</td>
                  <td className="px-3 py-2">{s.shiftCode}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {s.completedQty}/{s.plannedQty}
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge label={s.status.label} tone={s.status.label === 'Devam' ? 'success' : 'default'} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </ExecutionPageFrame>
  )
}
