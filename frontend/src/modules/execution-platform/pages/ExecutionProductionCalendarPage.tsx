import { useExecutionCalendar } from '@/application/execution-platform'

import { ExecutionPageFrame } from '../components/ExecutionPageFrame'
import { PageLoading, RequireProductionOrder } from '../components/RequireProductionOrder'

export function ExecutionProductionCalendarPage() {
  return (
    <RequireProductionOrder>
      {(po) => <CalendarContent po={po} />}
    </RequireProductionOrder>
  )
}

function CalendarContent({ po }: { po: string }) {
  const { data, isLoading } = useExecutionCalendar(po)

  if (isLoading || !data) return <PageLoading />

  return (
    <ExecutionPageFrame
      title="Production Calendar"
      purpose="Hat × saat × vardiya plan görünümü"
      kpis={[{ label: 'Slot', value: String(data.slots.length), hint: po }]}
    >
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Hat</th>
              <th className="px-3 py-2">Operasyon</th>
              <th className="px-3 py-2">Tarih</th>
              <th className="px-3 py-2">Saat</th>
              <th className="px-3 py-2">Plan</th>
              <th className="px-3 py-2">Gerçek</th>
              <th className="px-3 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {data.slots.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-3 py-2">{s.lineCode}</td>
                <td className="px-3 py-2 font-mono text-xs">{s.operationCode}</td>
                <td className="px-3 py-2">{s.slotDate}</td>
                <td className="px-3 py-2 tabular-nums">
                  {s.hourStart}:00–{s.hourEnd}:00
                </td>
                <td className="px-3 py-2 tabular-nums">{s.plannedQty}</td>
                <td className="px-3 py-2 tabular-nums">{s.actualQty}</td>
                <td className="px-3 py-2">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ExecutionPageFrame>
  )
}
