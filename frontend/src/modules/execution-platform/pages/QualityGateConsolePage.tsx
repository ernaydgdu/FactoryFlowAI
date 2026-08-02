import { StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { checkExecutionPermission, useEvaluateQualityGate, useQualityGateView } from '@/application/execution-platform'

import { ExecutionPageFrame } from '../components/ExecutionPageFrame'
import { PageLoading, RequireProductionOrder } from '../components/RequireProductionOrder'
import { useExecutionFullState } from '../hooks/use-execution-full-state'
import { useExecutionWorkspace } from '../context/ExecutionWorkspaceContext'

export function QualityGateConsolePage() {
  const { role, actor } = useExecutionWorkspace()
  return (
    <RequireProductionOrder>
      {(po) => <QualityContent po={po} role={role} actor={actor} />}
    </RequireProductionOrder>
  )
}

function QualityContent({
  po,
  role,
  actor,
}: {
  po: string
  role: ReturnType<typeof useExecutionWorkspace>['role']
  actor: string
}) {
  const { data: fullState } = useExecutionFullState(po)
  const { data, isLoading } = useQualityGateView(po)
  const evaluate = useEvaluateQualityGate()

  if (isLoading || !data) return <PageLoading />

  const canQuality = checkExecutionPermission(role, 'Create', 'QualityGate')

  return (
    <ExecutionPageFrame
      title="Quality Gate Console"
      purpose="Kalite müdürü — Inline / Midline / Final disposition"
      kpis={[
        { label: 'Değerlendirme', value: String(data.evaluations.length), hint: po },
        { label: 'Inline', value: String(data.evaluations.filter((e) => e.gateType === 'Inline').length), hint: '' },
        { label: 'Final', value: String(data.evaluations.filter((e) => e.gateType === 'Final').length), hint: '' },
      ]}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Son Değerlendirmeler</p>
          {data.evaluations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz gate kaydı yok.</p>
          ) : (
            data.evaluations.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                <span>
                  {e.gateType} / {e.operationCode}
                </span>
                <StatusBadge
                  label={e.disposition.label}
                  tone={e.dispositionRaw === 'Pass' ? 'success' : e.dispositionRaw === 'Reject' ? 'danger' : 'critical'}
                />
              </div>
            ))
          )}
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 text-sm font-medium">Hızlı Gate (HEM → Inline)</p>
          {canQuality && fullState?.context ? (
            <Button
              onClick={() =>
                evaluate.mutate({
                  executionContextId: fullState.context.id,
                  productionOrderNo: po,
                  operationCode: 'HEM',
                  gateType: 'Inline',
                  actor,
                  role,
                  salesOrderId: fullState.context.salesOrderId,
                  salesOrderNo: fullState.context.salesOrderNo,
                })
              }
            >
              Inline Gate Değerlendir
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Kalite rolü gerekli.</p>
          )}
        </div>
      </div>
    </ExecutionPageFrame>
  )
}
