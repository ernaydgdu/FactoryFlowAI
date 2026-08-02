import { StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import {
  checkExecutionPermission,
  useCompleteOperation,
  useOperationExecutionView,
  usePauseOperation,
  useResumeOperation,
  useStartOperation,
} from '@/application/execution-platform'

import { ExecutionPageFrame } from '../components/ExecutionPageFrame'
import { PageLoading, RequireProductionOrder } from '../components/RequireProductionOrder'
import { useExecutionWorkspace } from '../context/ExecutionWorkspaceContext'
import { useExecutionFullState } from '../hooks/use-execution-full-state'

export function OperationBoardPage() {
  const { role, actor } = useExecutionWorkspace()

  return (
    <RequireProductionOrder>
      {(po) => <OperationBoardContent po={po} role={role} actor={actor} />}
    </RequireProductionOrder>
  )
}

function OperationBoardContent({
  po,
  role,
  actor,
}: {
  po: string
  role: ReturnType<typeof useExecutionWorkspace>['role']
  actor: string
}) {
  const { data, isLoading } = useOperationExecutionView(po)
  const { data: fullState } = useExecutionFullState(po)
  const start = useStartOperation()
  const pause = usePauseOperation()
  const resume = useResumeOperation()
  const complete = useCompleteOperation()

  if (isLoading || !data) return <PageLoading />

  const canUpdate = checkExecutionPermission(role, 'Update', 'Operation')
  const ctxId = fullState?.context.id ?? ''

  return (
    <ExecutionPageFrame
      title="Operation Board"
      purpose="Hat şefi — operasyon başlat, durdur, devam, tamamla"
      kpis={[
        { label: 'Operasyon', value: String(data.operations.length), hint: po },
        {
          label: 'Paralel Session',
          value: String(data.parallelCapability?.activeSessions ?? 0),
          hint: 'hat/vardiya',
        },
        { label: 'InProgress', value: String(data.statusSummary.InProgress ?? 0), hint: '' },
      ]}
    >
      <div className="space-y-2">
        {data.operations.map((op) => (
          <div
            key={op.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
          >
            <div className="min-w-[200px]">
              <p className="font-medium">
                {op.sequence}. {op.operationName}
                <span className="ml-2 font-mono text-xs text-muted-foreground">{op.operationCode}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {op.completedQty}/{op.plannedQty} adet — {op.department}
              </p>
            </div>
            <StatusBadge label={op.status.label} tone={op.status.label === 'Devam' ? 'success' : 'default'} />
            {canUpdate ? (
              <div className="flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    start.mutate({
                      productionOrderNo: po,
                      operationCode: op.operationCode,
                      actor,
                      role,
                      executionContextId: ctxId,
                      lineId: 'LINE-1',
                      machineId: 'MCH-1',
                      operatorId: 'OP-1',
                      shiftCode: 'SHIFT-1',
                    })
                  }
                >
                  Başlat
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    pause.mutate({
                      productionOrderNo: po,
                      operationCode: op.operationCode,
                      reasonCode: 'MATERIAL-WAIT',
                      actor,
                      role,
                      executionContextId: ctxId,
                    })
                  }
                >
                  Durdur
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    resume.mutate({
                      productionOrderNo: po,
                      operationCode: op.operationCode,
                      actor,
                      role,
                      executionContextId: ctxId,
                    })
                  }
                >
                  Devam
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    complete.mutate({
                      productionOrderNo: po,
                      operationCode: op.operationCode,
                      completedQty: 10,
                      actor,
                      role,
                      executionContextId: ctxId,
                    })
                  }
                >
                  Tamamla
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </ExecutionPageFrame>
  )
}
