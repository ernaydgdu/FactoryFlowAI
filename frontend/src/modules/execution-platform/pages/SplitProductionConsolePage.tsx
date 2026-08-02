import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { checkExecutionPermission, useExecuteSplitProduction, useSplitProductionView } from '@/application/execution-platform'

import { ExecutionPageFrame } from '../components/ExecutionPageFrame'
import { PageLoading, RequireProductionOrder } from '../components/RequireProductionOrder'
import { useExecutionWorkspace } from '../context/ExecutionWorkspaceContext'
import { useState } from 'react'

export function SplitProductionConsolePage() {
  const { role, actor } = useExecutionWorkspace()
  return (
    <RequireProductionOrder>
      {(po) => <SplitContent po={po} role={role} actor={actor} />}
    </RequireProductionOrder>
  )
}

function SplitContent({
  po,
  role,
  actor,
}: {
  po: string
  role: ReturnType<typeof useExecutionWorkspace>['role']
  actor: string
}) {
  const { data, isLoading } = useSplitProductionView(po)
  const split = useExecuteSplitProduction()
  const [workshops, setWorkshops] = useState('FSN-A,FSN-B')
  const canSplit = checkExecutionPermission(role, 'Split', 'Split')

  if (isLoading || !data) return <PageLoading />

  return (
    <ExecutionPageFrame
      title="Split Production Console"
      purpose="Planlama — parent/child UE, atölye, BR-11"
      kpis={[
        { label: 'Parent UE', value: po, hint: '' },
        { label: 'Child Split', value: String(data.splits.length), hint: '' },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <p className="mb-2 text-sm font-medium">Split Kayıtları</p>
          {data.splits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz split yok.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.splits.map((s) => (
                <li key={s.id} className="rounded border border-border px-3 py-2">
                  <span className="font-medium">{s.childProductionOrderNo}</span>
                  <span className="ml-2 text-muted-foreground">
                    {s.workshopCode} — {s.plannedQty} adet
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {canSplit ? (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-sm font-medium">Yeni Split</p>
            <Input
              value={workshops}
              onChange={(e) => setWorkshops(e.target.value)}
              placeholder="FSN-A,FSN-B"
            />
            <Button
              onClick={() =>
                split.mutate({
                  parentProductionOrderNo: po,
                  workshopCodes: workshops.split(',').map((w) => w.trim()),
                  actor,
                  role,
                })
              }
            >
              BR-11 Split Uygula
            </Button>
          </div>
        ) : null}
      </div>
    </ExecutionPageFrame>
  )
}
