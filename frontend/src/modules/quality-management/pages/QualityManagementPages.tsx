/**
 * Phase 5 Module 2 — Quality Management UI.
 * Kaynak: qualityGateEvaluations stream + Bundle OnHold (yeni aggregate yok).
 */
import { useState } from 'react'

import { useShopFloorContexts } from '@/application/shop-floor/use-shop-floor'
import {
  useAcceptMutation,
  useCompleteReworkMutation,
  useHoldMutation,
  useHoldQueue,
  useQcPlanSteps,
  useQualityDashboard,
  useQualityInspections,
  useRejectMutation,
  useReworkMutation,
  useReworkQueue,
} from '@/application/quality/use-quality'
import { mapCapaPlan } from '@/application/quality/quality.mapper'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { QualityGateType } from '@/domain/execution-platform/execution-types'

const ACTOR = 'pilot-user'

function PoSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const { data: contexts } = useShopFloorContexts()
  return (
    <div>
      <label className="text-xs text-muted-foreground">Üretim Emri</label>
      <select
        className="flex h-9 min-w-[180px] rounded-md border px-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Seçin</option>
        {(contexts ?? []).map((c) => (
          <option key={c.productionOrderNo} value={c.productionOrderNo}>
            {c.productionOrderNo} — {c.productCode}
          </option>
        ))}
      </select>
    </div>
  )
}

export function QualityDashboardPage() {
  const { data, isLoading } = useQualityDashboard()
  const [capaNcr, setCapaNcr] = useState('')
  const capa = capaNcr ? mapCapaPlan(capaNcr, ACTOR) : null

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null

  return (
    <ErpModuleShell title="QC Dashboard" description="Muayene, NCR ve QC plan coverage" kpis={data.kpis}>
      <div className="p-4 pt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">QC Plan (route gate adımları)</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => `${r.operationCode}-${r.gateType}`}
              data={data.planSteps}
              columns={[
                { key: 'seq', header: 'Sıra', render: (r) => r.sequence },
                { key: 'op', header: 'Operasyon', render: (r) => r.operationCode },
                { key: 'gate', header: 'Gate', render: (r) => r.gateType },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">UE Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.productionOrderNo}
              data={data.coverage}
              columns={[
                { key: 'po', header: 'UE', render: (r) => r.productionOrderNo },
                { key: 'p', header: 'Ürün', render: (r) => r.productCode },
                { key: 'c', header: 'Coverage', render: (r) => `%${r.coveragePercent}` },
                { key: 's', header: 'Adımlar', render: (r) => r.stepsLabel },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">NCR Kayıtları (Reject / Hold / Scrap)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DataTable
              rowKey={(r) => r.id}
              data={data.ncrs}
              columns={[
                {
                  key: 'id',
                  header: 'NCR',
                  render: (r) => (
                    <button type="button" className="underline" onClick={() => setCapaNcr(r.id)}>
                      {r.id}
                    </button>
                  ),
                },
                { key: 'po', header: 'UE', render: (r) => r.productionOrderNo },
                { key: 'op', header: 'Op', render: (r) => r.operationCode },
                { key: 'd', header: 'Disposition', render: (r) => r.disposition },
                { key: 'st', header: 'Durum', render: (r) => <StatusBadge {...r.status} /> },
                { key: 'at', header: 'Açılış', render: (r) => r.openedAt },
              ]}
            />
            {capa && (
              <div className="rounded-md border p-3 text-sm">
                <p className="font-medium">CAPA İskeleti — {capa.ncrId}</p>
                {capa.valid ? (
                  <ul className="mt-1 list-disc pl-5 text-muted-foreground">
                    {capa.proposedActions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                ) : (
                  <ul className="mt-1 text-destructive">
                    {capa.errors.map((e) => (
                      <li key={e}>● {e}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs text-muted-foreground">Persist yok — plan önerisi.</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Son Muayeneler</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={data.recentInspections}
              columns={[
                { key: 'po', header: 'UE', render: (r) => r.productionOrderNo },
                { key: 'op', header: 'Op', render: (r) => r.operationCode },
                { key: 'g', header: 'Gate', render: (r) => r.gateType },
                { key: 'd', header: 'Sonuç', render: (r) => <StatusBadge {...r.disposition} /> },
                { key: 'ncr', header: 'NCR', render: (r) => r.ncrId },
                { key: 'at', header: 'Zaman', render: (r) => r.evaluatedAt },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function QualityInspectionPage() {
  const { data: contexts } = useShopFloorContexts()
  const { data: plan } = useQcPlanSteps()
  const { data: inspections } = useQualityInspections()
  const accept = useAcceptMutation()
  const reject = useRejectMutation()
  const rework = useReworkMutation()
  const hold = useHoldMutation()

  const [po, setPo] = useState('')
  const productionOrderNo = po || contexts?.[0]?.productionOrderNo || ''
  const [stepKey, setStepKey] = useState('')
  const steps = plan ?? []
  const selected = steps.find((s) => `${s.operationCode}|${s.gateType}` === stepKey) ?? steps[0]
  const operationCode = selected?.operationCode ?? ''
  const gateType = (selected?.gateType ?? 'Inline') as QualityGateType

  const pending = accept.isPending || reject.isPending || rework.isPending || hold.isPending
  const err = (accept.error || reject.error || rework.error || hold.error) as Error | null
  const ok =
    accept.isSuccess || reject.isSuccess || rework.isSuccess || hold.isSuccess
      ? (accept.data || reject.data || rework.data || hold.data)
      : null

  const base = { productionOrderNo, operationCode, gateType, actorUserId: ACTOR }

  return (
    <ErpModuleShell title="Inspection Screen" description="Accept / Reject / Rework / Hold → kalıcı gate evaluation" kpis={[]}>
      <div className="p-4 pt-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <PoSelect value={productionOrderNo} onChange={setPo} />
          <div>
            <label className="text-xs text-muted-foreground">QC Plan Adımı</label>
            <select
              className="flex h-9 min-w-[200px] rounded-md border px-2 text-sm"
              value={stepKey || (selected ? `${selected.operationCode}|${selected.gateType}` : '')}
              onChange={(e) => setStepKey(e.target.value)}
            >
              {steps.map((s) => (
                <option key={`${s.operationCode}|${s.gateType}`} value={`${s.operationCode}|${s.gateType}`}>
                  {s.gateType} @ {s.operationCode}
                </option>
              ))}
            </select>
          </div>
          <Button size="sm" disabled={!productionOrderNo || !operationCode || pending} onClick={() => accept.mutate(base)}>
            Accept
          </Button>
          <Button size="sm" variant="destructive" disabled={!productionOrderNo || !operationCode || pending} onClick={() => reject.mutate(base)}>
            Reject
          </Button>
          <Button size="sm" variant="outline" disabled={!productionOrderNo || !operationCode || pending} onClick={() => rework.mutate(base)}>
            Rework
          </Button>
          <Button size="sm" variant="secondary" disabled={!productionOrderNo || !operationCode || pending} onClick={() => hold.mutate(base)}>
            Hold
          </Button>
        </div>
        {err && <p className="text-sm text-destructive">{err.message}</p>}
        {ok && (
          <p className="text-sm text-emerald-600">
            Kaydedildi: {ok.disposition} — {ok.evaluationId}
            {ok.ncrId ? ` · ${ok.ncrId}` : ''}
          </p>
        )}
        <DataTable
          rowKey={(r) => r.id}
          data={inspections ?? []}
          columns={[
            { key: 'po', header: 'UE', render: (r) => r.productionOrderNo },
            { key: 'op', header: 'Op', render: (r) => r.operationCode },
            { key: 'g', header: 'Gate', render: (r) => r.gateType },
            { key: 'd', header: 'Sonuç', render: (r) => <StatusBadge {...r.disposition} /> },
            { key: 'ncr', header: 'NCR', render: (r) => r.ncrId },
            { key: 'by', header: 'Aktör', render: (r) => r.evaluatedBy },
            { key: 'at', header: 'Zaman', render: (r) => r.evaluatedAt },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function QualityReworkQueuePage() {
  const { data, isLoading } = useReworkQueue()
  const complete = useCompleteReworkMutation()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Rework Queue"
      description="Disposition=Rework olan açık muayeneler"
      kpis={[{ label: 'Açık Rework', value: String(data?.length ?? 0), hint: '' }]}
    >
      <div className="p-4 pt-6 space-y-3">
        {complete.isError && <p className="text-sm text-destructive">{(complete.error as Error)?.message}</p>}
        <DataTable
          rowKey={(r) => r.evaluationId}
          data={data ?? []}
          columns={[
            { key: 'po', header: 'UE', render: (r) => r.productionOrderNo },
            { key: 'op', header: 'Op', render: (r) => r.operationCode },
            { key: 'g', header: 'Gate', render: (r) => r.gateType },
            { key: 'b', header: 'Bundle', render: (r) => r.bundleId },
            { key: 'q', header: 'Rework Qty', render: (r) => r.reworkQty },
            { key: 'at', header: 'Zaman', render: (r) => r.evaluatedAt },
            {
              key: 'act',
              header: '',
              render: (r) => (
                <Button
                  size="sm"
                  disabled={complete.isPending}
                  onClick={() =>
                    complete.mutate({
                      productionOrderNo: r.productionOrderNo,
                      operationCode: r.operationCode,
                      bundleId: r.bundleId === '—' ? undefined : r.bundleId,
                      actorUserId: ACTOR,
                    })
                  }
                >
                  Rework Tamamla
                </Button>
              ),
            },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function QualityHoldQueuePage() {
  const { data, isLoading } = useHoldQueue()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Hold Queue"
      description="OnHold bundle'lar (kalite Hold / Reject yan etkisi)"
      kpis={[{ label: 'Hold Bundle', value: String(data?.length ?? 0), hint: '' }]}
    >
      <div className="p-4 pt-6">
        <DataTable
          rowKey={(r) => r.bundleId}
          data={data ?? []}
          columns={[
            { key: 'b', header: 'Bundle', render: (r) => r.bundleNo },
            { key: 'po', header: 'UE', render: (r) => r.productionOrderNo },
            { key: 'op', header: 'Op', render: (r) => r.currentOperationCode },
            { key: 'qty', header: 'Adet', render: (r) => r.pieceCount },
            { key: 'r', header: 'Neden', render: (r) => r.reasonCode },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}
