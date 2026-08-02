import { useState } from 'react'

import { StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  checkExecutionPermission,
  useBundleManagement,
  useBundleScan,
  useHoldBundle,
  useIssueBundle,
  useMoveBundle,
} from '@/application/execution-platform'

import { ExecutionPageFrame } from '../components/ExecutionPageFrame'
import { PageLoading, RequireProductionOrder } from '../components/RequireProductionOrder'
import { useExecutionWorkspace } from '../context/ExecutionWorkspaceContext'

export function BundleBoardPage() {
  const { role, actor } = useExecutionWorkspace()
  const [scanCode, setScanCode] = useState('')
  const hold = useHoldBundle()
  const issue = useIssueBundle()
  const move = useMoveBundle()

  return (
    <RequireProductionOrder>
      {(po) => <BundleBoardContent po={po} role={role} actor={actor} scanCode={scanCode} setScanCode={setScanCode} hold={hold} issue={issue} move={move} />}
    </RequireProductionOrder>
  )
}

function BundleBoardContent({
  po,
  role,
  actor,
  scanCode,
  setScanCode,
  hold,
  issue,
  move,
}: {
  po: string
  role: ReturnType<typeof useExecutionWorkspace>['role']
  actor: string
  scanCode: string
  setScanCode: (v: string) => void
  hold: ReturnType<typeof useHoldBundle>
  issue: ReturnType<typeof useIssueBundle>
  move: ReturnType<typeof useMoveBundle>
}) {
  const { data, isLoading } = useBundleManagement(po)
  const { data: scanned } = useBundleScan(scanCode, scanCode.length > 8)

  if (isLoading || !data) return <PageLoading />

  const canUpdate = checkExecutionPermission(role, 'Update', 'Bundle')

  return (
    <ExecutionPageFrame
      title="Bundle Board"
      purpose="Kesimhane şefi / hat şefi — kart görünümü, scan, transfer, hold"
      kpis={[
        { label: 'Bundle', value: String(data.bundles.length), hint: po },
        { label: 'Toplam Adet', value: String(data.totalPieces), hint: '' },
        { label: 'Kuyruk Bekleme', value: String(data.waitTimes.length), hint: 'dk ort.' },
      ]}
      toolbar={
        <div className="flex gap-2">
          <Input
            placeholder="Barcode scan…"
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            className="h-9 w-64"
          />
          {scanned ? <StatusBadge label={scanned.bundleNo} tone="success" /> : null}
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.bundles.map((b) => (
          <article
            key={b.id}
            className="rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-semibold">{b.bundleNo}</p>
                <p className="text-xs text-muted-foreground">{b.colorName} / {b.sizeCode}</p>
              </div>
              <StatusBadge label={b.status.label} tone={b.status.label.includes('Hold') ? 'warning' : 'default'} />
            </div>
            <p className="mt-2 text-lg font-semibold tabular-nums">{b.pieceCount} adet</p>
            <p className="text-xs text-muted-foreground">Op: {b.currentOperationCode ?? '—'}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {canUpdate ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => issue.mutate({ bundleId: b.id, actor, role })}
                  >
                    Floor
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() =>
                      move.mutate({
                        bundleId: b.id,
                        toOperationCode: 'SEW',
                        workshopCode: 'FSN-A',
                        actor,
                        role,
                      })
                    }
                  >
                    Transfer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => hold.mutate({ bundleId: b.id, reasonCode: 'HOLD-UI', actor, role })}
                  >
                    Hold
                  </Button>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </ExecutionPageFrame>
  )
}
