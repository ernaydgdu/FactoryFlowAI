import { useExecutionTimeline } from '@/application/execution-platform'

import { ExecutionPageFrame } from '../components/ExecutionPageFrame'
import { PageLoading, RequireProductionOrder } from '../components/RequireProductionOrder'

export function ExecutionTimelinePage() {
  return (
    <RequireProductionOrder>
      {(po) => <TimelineContent po={po} />}
    </RequireProductionOrder>
  )
}

function TimelineContent({ po }: { po: string }) {
  const { data, isLoading } = useExecutionTimeline(po)

  if (isLoading || !data) return <PageLoading />

  return (
    <ExecutionPageFrame
      title="Execution Timeline"
      purpose="Gerçek zamanlı shop floor event akışı — append-only"
      kpis={[{ label: 'Event', value: String(data.events.length), hint: `${data.eventCatalog.length} tip catalog` }]}
    >
      <div className="max-h-[640px] space-y-1 overflow-y-auto rounded-lg border border-border bg-card p-2">
        {data.events.map((e) => (
          <div
            key={e.id}
            className="flex gap-3 border-b border-border/50 px-2 py-2 text-sm last:border-0"
          >
            <time className="shrink-0 font-mono text-xs text-muted-foreground">
              {new Date(e.occurredAt).toLocaleTimeString('tr-TR')}
            </time>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{e.title}</p>
              <p className="truncate text-xs text-muted-foreground">{e.description}</p>
            </div>
            <span className="shrink-0 font-mono text-xs text-primary">{e.eventType}</span>
          </div>
        ))}
      </div>
    </ExecutionPageFrame>
  )
}
