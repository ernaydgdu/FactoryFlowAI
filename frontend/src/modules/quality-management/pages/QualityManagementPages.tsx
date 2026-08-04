/**
 * Phase 5 Module 2 — Quality Management UI.
 * Kaynak: qualityGateEvaluations stream + Bundle OnHold (yeni aggregate yok).
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useShopFloorContexts } from '@/application/shop-floor/use-shop-floor'
import {
  useAcceptMutation,
  useCompleteReworkMutation,
  useHoldMutation,
  useHoldQueue,
  useNcrDetail,
  useQcPlanSteps,
  useQualityDashboard,
  useQualityInspections,
  useQualityTimeline,
  useRejectMutation,
  useReworkMutation,
  useReworkQueue,
} from '@/application/quality/use-quality'
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
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={data.ncrs}
              columns={[
                {
                  key: 'id',
                  header: 'NCR',
                  render: (r) => (
                    <Link className="underline" to={`/quality-management/ncr/${r.id}`}>
                      {r.id}
                    </Link>
                  ),
                },
                { key: 'po', header: 'UE', render: (r) => r.productionOrderNo },
                { key: 'op', header: 'Op', render: (r) => r.operationCode },
                { key: 'd', header: 'Disposition', render: (r) => r.disposition },
                { key: 'st', header: 'Durum', render: (r) => <StatusBadge {...r.status} /> },
                { key: 'at', header: 'Açılış', render: (r) => r.openedAt },
              ]}
            />
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
                {
                  key: 'ncr',
                  header: 'NCR',
                  render: (r) =>
                    r.ncrId !== '—' ? (
                      <Link className="underline" to={`/quality-management/ncr/${r.ncrId}`}>
                        {r.ncrId}
                      </Link>
                    ) : (
                      '—'
                    ),
                },
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

export function QualityNcrDetailPage() {
  const { ncrId = '' } = useParams<{ ncrId: string }>()
  const { data: detail, isLoading } = useNcrDetail(ncrId)

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!detail) {
    return (
      <ErpModuleShell title="NCR Bulunamadı" description={ncrId} kpis={[]}>
        <div className="p-8">
          <Button size="sm" variant="outline" asChild>
            <Link to="/quality-management/dashboard">Dashboard&apos;a dön</Link>
          </Button>
        </div>
      </ErpModuleShell>
    )
  }

  return (
    <ErpModuleShell
      title={`NCR — ${detail.id}`}
      description={`${detail.productionOrderNo} · ${detail.operationCode} · ${detail.disposition}`}
      kpis={[
        { label: 'Durum', value: detail.status.label, hint: detail.gateType },
        { label: 'Bundle', value: detail.bundleId, hint: '' },
        { label: 'Evaluation', value: detail.evaluationId, hint: 'Gate stream' },
        { label: 'Açan', value: detail.openedBy, hint: detail.openedAt },
      ]}
    >
      <div className="p-4 pt-6 space-y-4">
        <Button size="sm" variant="outline" asChild>
          <Link to="/quality-management/dashboard">← Dashboard</Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">NCR Detay</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              <StatusBadge {...detail.status} /> · {detail.disposition} @ {detail.gateType}
            </p>
            <p className="text-muted-foreground">Notlar: {detail.notes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">CAPA İskeleti (persist yok)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {detail.capa.valid ? (
              <ul className="list-disc pl-5 text-muted-foreground">
                {detail.capa.proposedActions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            ) : (
              <ul className="text-destructive">
                {detail.capa.errors.map((e) => (
                  <li key={e}>● {e}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">İlişkili Quality Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={detail.relatedTimeline}
              columns={[
                { key: 't', header: 'Zaman', render: (r) => r.occurredAt },
                { key: 'e', header: 'Olay', render: (r) => r.eventType },
                { key: 'title', header: 'Başlık', render: (r) => r.title },
                { key: 'a', header: 'Aktör', render: (r) => r.actor },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function QualityTimelinePage() {
  const { data: contexts } = useShopFloorContexts()
  const [po, setPo] = useState('')
  const { data: timeline, isLoading } = useQualityTimeline(po)

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Quality Timeline"
      description="Kalite olayları — execution event stream (QualityPassed/Rejected/Reworked/Hold)"
      kpis={[{ label: 'Olay', value: String(timeline?.length ?? 0), hint: po || 'Tümü' }]}
    >
      <div className="p-4 pt-6 space-y-3">
        <PoSelect value={po} onChange={setPo} />
        <p className="text-xs text-muted-foreground">
          Boş bırakılırsa tüm UE kalite olayları listelenir. Context sayısı: {contexts?.length ?? 0}
        </p>
        <DataTable
          rowKey={(r) => r.id}
          data={timeline ?? []}
          columns={[
            { key: 't', header: 'Zaman', render: (r) => r.occurredAt },
            { key: 'po', header: 'UE', render: (r) => r.productionOrderNo },
            { key: 'e', header: 'Olay', render: (r) => r.eventType },
            { key: 'title', header: 'Başlık', render: (r) => r.title },
            { key: 'op', header: 'Op', render: (r) => r.operationCode },
            { key: 'b', header: 'Bundle', render: (r) => r.bundleId },
            { key: 'a', header: 'Aktör', render: (r) => r.actor },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}
