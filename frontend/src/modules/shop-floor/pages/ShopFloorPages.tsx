/**
 * Phase 5 Module 1 — Shop Floor MES UI.
 * Kaynak: kalıcı execution-platform + production-order + stock ledger portları.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { SHIFT_OPTIONS } from '@/application/shop-floor/shop-floor.mapper'
import {
  useCompleteOperationMutation,
  useCompletionConfirmationMutation,
  useDeclareProductionMutation,
  useFinishWorkSessionMutation,
  useMoveBundleMutation,
  usePauseOperationMutation,
  useResumeOperationMutation,
  useShopFloorBundles,
  useShopFloorContexts,
  useShopFloorLabor,
  useShopFloorMachines,
  useShopFloorOperations,
  useShopFloorOptions,
  useShopFloorProgress,
  useShopFloorSessions,
  useShopFloorTimeline,
  useStartOperationMutation,
  useStartWorkSessionMutation,
  useWorkstationView,
} from '@/application/shop-floor/use-shop-floor'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const ACTOR = 'pilot-user'

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <select
        className="flex h-9 w-full min-w-[140px] rounded-md border px-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Seçin</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function useDefaultPo() {
  const { data: contexts } = useShopFloorContexts()
  const [selected, setSelected] = useState('')
  const po = selected || contexts?.[0]?.productionOrderNo || ''
  const ctx = contexts?.find((c) => c.productionOrderNo === po)
  return { contexts: contexts ?? [], po, setSelected, ctx }
}

export function ShopFloorOperatorPage() {
  const { contexts, po, setSelected, ctx } = useDefaultPo()
  const { data: options } = useShopFloorOptions()
  const { data: ops } = useShopFloorOperations(po)
  const { data: sessions } = useShopFloorSessions(po)
  const startSession = useStartWorkSessionMutation()
  const finishSession = useFinishWorkSessionMutation()
  const completeOrder = useCompletionConfirmationMutation()

  const [operationCode, setOperationCode] = useState('')
  const [machineId, setMachineId] = useState('')
  const [operatorId, setOperatorId] = useState('')
  const [shiftCode, setShiftCode] = useState('SHIFT-1')

  const op = operationCode || ops?.[0]?.operationCode || ''
  const machine = machineId || options?.machines?.[0]?.value || ''
  const operator = operatorId || options?.operators?.[0]?.value || ''
  const activeSessions = (sessions ?? []).filter((s) => s.rawStatus === 'InProgress' || s.rawStatus === 'Paused')

  const kpis = [
    { label: 'Aktif UE', value: String(contexts.length), hint: 'Execution context' },
    { label: 'Aktif Oturum', value: String(activeSessions.length), hint: 'Work session' },
    { label: 'Operasyon', value: String(ops?.length ?? 0), hint: po || '—' },
    {
      label: 'İlerleme',
      value: `%${ops && ops.length ? Math.round(ops.reduce((s, o) => s + o.progressPercent, 0) / ops.length) : 0}`,
      hint: 'Ort. operasyon',
    },
  ]

  return (
    <ErpModuleShell title="Operatör Dashboard" description="Work session başlat / bitir · tamamlama onayı" kpis={kpis}>
      <div className="p-4 pt-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <SelectField
            label="Üretim Emri"
            value={po}
            onChange={setSelected}
            options={contexts.map((c) => ({
              value: c.productionOrderNo,
              label: `${c.productionOrderNo} — ${c.productCode}`,
            }))}
          />
          <SelectField
            label="Operasyon"
            value={op}
            onChange={setOperationCode}
            options={(ops ?? []).map((o) => ({
              value: o.operationCode,
              label: `${o.sequence}. ${o.operationCode} — ${o.operationName}`,
            }))}
          />
          <SelectField label="Makine" value={machine} onChange={setMachineId} options={options?.machines ?? []} />
          <SelectField label="Operatör" value={operator} onChange={setOperatorId} options={options?.operators ?? []} />
          <SelectField label="Vardiya" value={shiftCode} onChange={setShiftCode} options={SHIFT_OPTIONS} />
          <Button
            size="sm"
            disabled={!po || !op || !machine || !operator || startSession.isPending}
            onClick={() =>
              startSession.mutate({
                productionOrderNo: po,
                operationCode: op,
                lineId: ctx?.lineId || 'LINE-1',
                workshopCode: ctx?.workshopCode || 'FSN-A',
                machineId: machine,
                operatorId: operator,
                shiftCode,
                plannedQty: ctx?.plannedQty ?? 0,
                actorUserId: ACTOR,
              })
            }
          >
            Oturum Başlat
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!po || completeOrder.isPending}
            onClick={() => completeOrder.mutate({ productionOrderNo: po, actorUserId: ACTOR })}
          >
            Tamamlama Onayı (FG)
          </Button>
        </div>
        {(startSession.isError || finishSession.isError || completeOrder.isError) && (
          <p className="text-sm text-destructive">
            {(
              (startSession.error || finishSession.error || completeOrder.error) as Error
            )?.message ?? 'İşlem başarısız'}
          </p>
        )}
        {(startSession.isSuccess || completeOrder.isSuccess) && (
          <p className="text-sm text-emerald-600">
            {startSession.isSuccess && 'Oturum başlatıldı. '}
            {completeOrder.isSuccess &&
              `Tamamlandı — FG hareket: ${completeOrder.data?.finishedGoodsMovementNo ?? '—'}`}
          </p>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktif / Son Work Session&apos;lar</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={sessions ?? []}
              columns={[
                { key: 'op', header: 'Operasyon', render: (r) => r.operationCode },
                { key: 'm', header: 'Makine', render: (r) => r.machineId },
                { key: 'o', header: 'Operatör', render: (r) => r.operatorId },
                { key: 'st', header: 'Durum', render: (r) => <StatusBadge {...r.status} /> },
                { key: 'qty', header: 'Üretilen', render: (r) => r.completedQty },
                {
                  key: 'act',
                  header: '',
                  render: (r) =>
                    r.rawStatus === 'InProgress' || r.rawStatus === 'Paused' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          finishSession.mutate({
                            productionOrderNo: r.productionOrderNo,
                            operationCode: r.operationCode,
                            sessionId: r.id,
                            completedQty: r.plannedQty,
                            actorUserId: ACTOR,
                          })
                        }
                      >
                        Bitir
                      </Button>
                    ) : null,
                },
              ]}
            />
          </CardContent>
        </Card>
        <div className="flex gap-2 text-sm">
          <Link className="underline" to="/execution-platform/quality">
            Kalite Gate (giriş)
          </Link>
          <Link className="underline" to="/execution-platform/wip">
            WIP Monitor
          </Link>
        </div>
      </div>
    </ErpModuleShell>
  )
}

export function ShopFloorWorkstationPage() {
  const { data: machines } = useShopFloorMachines()
  const [machineId, setMachineId] = useState('')
  const mid = machineId || machines?.[0]?.machineId || ''
  const { data: view, isLoading } = useWorkstationView(mid)

  if (isLoading && !view) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Workstation"
      description="Makine bazlı oturum ve durum ekranı"
      kpis={[
        { label: 'Makine', value: view?.machine?.machineId ?? '—', hint: view?.machine?.machineName ?? '' },
        { label: 'Durum', value: view?.machine?.status.label ?? '—', hint: view?.machine?.lineCode ?? '' },
        {
          label: 'Aktif UE',
          value: view?.machine?.activeProductionOrderNo ?? '—',
          hint: view?.machine?.activeOperationCode ?? '',
        },
        { label: 'Bugün Üretim', value: String(view?.machine?.completedQtyToday ?? 0), hint: 'Oturum toplamı' },
      ]}
    >
      <div className="p-4 pt-6 space-y-4">
        <SelectField
          label="Makine"
          value={mid}
          onChange={setMachineId}
          options={(machines ?? []).map((m) => ({ value: m.machineId, label: `${m.machineId} — ${m.machineName}` }))}
        />
        <DataTable
          rowKey={(r) => r.id}
          data={view?.sessions ?? []}
          columns={[
            { key: 'po', header: 'UE', render: (r) => r.productionOrderNo },
            { key: 'op', header: 'Operasyon', render: (r) => r.operationCode },
            { key: 'op2', header: 'Operatör', render: (r) => r.operatorId },
            { key: 'st', header: 'Durum', render: (r) => <StatusBadge {...r.status} /> },
            { key: 'qty', header: 'Üretilen', render: (r) => r.completedQty },
            { key: 'dt', header: 'Duruş (dk)', render: (r) => r.downtimeMinutes },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function ShopFloorOperationPage() {
  const { contexts, po, setSelected, ctx } = useDefaultPo()
  const { data: ops } = useShopFloorOperations(po)
  const { data: options } = useShopFloorOptions()
  const startOp = useStartOperationMutation()
  const pauseOp = usePauseOperationMutation()
  const resumeOp = useResumeOperationMutation()
  const completeOp = useCompleteOperationMutation()

  const machine = options?.machines?.[0]?.value ?? 'MCH-1'
  const operator = options?.operators?.[0]?.value ?? 'OP-1'

  return (
    <ErpModuleShell title="Operasyon Ekranı" description="Operasyon başlat / duraklat / devam / tamamla" kpis={[]}>
      <div className="p-4 pt-6 space-y-4">
        <SelectField
          label="Üretim Emri"
          value={po}
          onChange={setSelected}
          options={contexts.map((c) => ({
            value: c.productionOrderNo,
            label: `${c.productionOrderNo} — ${c.productCode}`,
          }))}
        />
        {(startOp.isError || pauseOp.isError || resumeOp.isError || completeOp.isError) && (
          <p className="text-sm text-destructive">
            {((startOp.error || pauseOp.error || resumeOp.error || completeOp.error) as Error)?.message}
          </p>
        )}
        <DataTable
          rowKey={(r) => r.operationCode}
          data={ops ?? []}
          columns={[
            { key: 'seq', header: '#', render: (r) => r.sequence },
            { key: 'code', header: 'Kod', render: (r) => r.operationCode },
            { key: 'name', header: 'Ad', render: (r) => r.operationName },
            { key: 'st', header: 'Durum', render: (r) => <StatusBadge {...r.status} /> },
            { key: 'prog', header: 'İlerleme', render: (r) => `${r.completedQty}/${r.plannedQty} (%${r.progressPercent})` },
            {
              key: 'gate',
              header: 'Kalite',
              render: (r) => (r.requiredGate ? `${r.requiredGate}${r.gatePassed ? ' ✓' : ' ·'}` : '—'),
            },
            {
              key: 'act',
              header: 'Aksiyon',
              render: (r) => (
                <div className="flex flex-wrap gap-1">
                  {r.rawStatus !== 'InProgress' && r.rawStatus !== 'Completed' && (
                    <Button
                      size="sm"
                      onClick={() =>
                        startOp.mutate({
                          productionOrderNo: po,
                          operationCode: r.operationCode,
                          lineId: ctx?.lineId,
                          workshopCode: ctx?.workshopCode,
                          machineId: machine,
                          operatorId: operator,
                          shiftCode: 'SHIFT-1',
                          plannedQty: r.plannedQty,
                          actorUserId: ACTOR,
                        })
                      }
                    >
                      Başlat
                    </Button>
                  )}
                  {r.rawStatus === 'InProgress' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        pauseOp.mutate({
                          productionOrderNo: po,
                          operationCode: r.operationCode,
                          actorUserId: ACTOR,
                        })
                      }
                    >
                      Duraklat
                    </Button>
                  )}
                  {r.rawStatus === 'Paused' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        resumeOp.mutate({
                          productionOrderNo: po,
                          operationCode: r.operationCode,
                          actorUserId: ACTOR,
                        })
                      }
                    >
                      Devam
                    </Button>
                  )}
                  {r.rawStatus !== 'Completed' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        completeOp.mutate({
                          productionOrderNo: po,
                          operationCode: r.operationCode,
                          completedQty: r.plannedQty,
                          actorUserId: ACTOR,
                        })
                      }
                    >
                      Tamamla
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function ShopFloorBundlePage() {
  const { contexts, po, setSelected, ctx } = useDefaultPo()
  const { data: bundles } = useShopFloorBundles(po)
  const { data: ops } = useShopFloorOperations(po)
  const moveBundle = useMoveBundleMutation()
  const [toOp, setToOp] = useState('')

  const targetOp = toOp || ops?.find((o) => o.rawStatus !== 'Completed')?.operationCode || ops?.[0]?.operationCode || ''

  return (
    <ErpModuleShell title="Bundle Tracking" description="Bundle taşıma (WIP transfer) — kalıcı repository" kpis={[]}>
      <div className="p-4 pt-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <SelectField
            label="Üretim Emri"
            value={po}
            onChange={setSelected}
            options={contexts.map((c) => ({
              value: c.productionOrderNo,
              label: `${c.productionOrderNo} — ${c.productCode}`,
            }))}
          />
          <SelectField
            label="Hedef Operasyon"
            value={targetOp}
            onChange={setToOp}
            options={(ops ?? []).map((o) => ({
              value: o.operationCode,
              label: `${o.sequence}. ${o.operationCode}`,
            }))}
          />
        </div>
        {moveBundle.isError && (
          <p className="text-sm text-destructive">{(moveBundle.error as Error)?.message}</p>
        )}
        <DataTable
          rowKey={(r) => r.id}
          data={bundles ?? []}
          columns={[
            { key: 'no', header: 'Bundle', render: (r) => r.bundleNo },
            { key: 'st', header: 'Durum', render: (r) => r.status },
            { key: 'op', header: 'Mevcut Op', render: (r) => r.currentOperationCode },
            { key: 'ws', header: 'Atölye', render: (r) => r.workshopCode },
            { key: 'qty', header: 'Adet', render: (r) => r.pieceCount },
            {
              key: 'act',
              header: '',
              render: (r) => (
                <Button
                  size="sm"
                  disabled={!targetOp || moveBundle.isPending}
                  onClick={() =>
                    moveBundle.mutate({
                      bundleId: r.id,
                      toOperationCode: targetOp,
                      workshopCode: ctx?.workshopCode || r.workshopCode || 'FSN-A',
                      lineId: ctx?.lineId,
                      actorUserId: ACTOR,
                    })
                  }
                >
                  Taşı
                </Button>
              ),
            },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function ShopFloorDeclarationPage() {
  const { contexts, po, setSelected, ctx } = useDefaultPo()
  const { data: ops } = useShopFloorOperations(po)
  const { data: options } = useShopFloorOptions()
  const declare = useDeclareProductionMutation()

  const [operationCode, setOperationCode] = useState('')
  const [produced, setProduced] = useState('10')
  const op = operationCode || ops?.[0]?.operationCode || ''
  const machine = options?.machines?.[0]?.value ?? 'MCH-1'
  const operator = options?.operators?.[0]?.value ?? 'OP-1'

  return (
    <ErpModuleShell
      title="Production Declaration"
      description="Operasyon girişi + UE producedQty köprüsü (tek komut)"
      kpis={[]}
    >
      <div className="p-4 pt-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <SelectField
            label="Üretim Emri"
            value={po}
            onChange={setSelected}
            options={contexts.map((c) => ({
              value: c.productionOrderNo,
              label: `${c.productionOrderNo} — ${c.productCode}`,
            }))}
          />
          <SelectField
            label="Operasyon"
            value={op}
            onChange={setOperationCode}
            options={(ops ?? []).map((o) => ({
              value: o.operationCode,
              label: `${o.sequence}. ${o.operationCode}`,
            }))}
          />
          <div>
            <label className="text-xs text-muted-foreground">Üretilen</label>
            <Input className="w-24" value={produced} onChange={(e) => setProduced(e.target.value)} />
          </div>
          <Button
            size="sm"
            disabled={!po || !op || Number(produced) <= 0 || declare.isPending}
            onClick={() =>
              declare.mutate({
                productionOrderNo: po,
                operationCode: op,
                lineId: ctx?.lineId || 'LINE-1',
                operatorId: operator,
                machineId: machine,
                shiftCode: 'SHIFT-1',
                entryDate: new Date().toISOString().slice(0, 10),
                planned: Number(produced),
                produced: Number(produced),
                reject: 0,
                rework: 0,
                secondQuality: 0,
                fire: 0,
                downtimeMinutes: 0,
                actorUserId: ACTOR,
              })
            }
          >
            Deklare Et
          </Button>
        </div>
        {declare.isError && <p className="text-sm text-destructive">{(declare.error as Error)?.message}</p>}
        {declare.isSuccess && (
          <p className="text-sm text-emerald-600">
            Deklare edildi — UE toplam: {declare.data.producedQtyTotal}, kalan: {declare.data.remainingQty}
          </p>
        )}
      </div>
    </ErpModuleShell>
  )
}

export function ShopFloorMachineStatusPage() {
  const { data, isLoading } = useShopFloorMachines()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  const rows = data ?? []
  return (
    <ErpModuleShell
      title="Machine Status"
      description="Work session'lardan türetilen makine durumu (Running / Paused / Idle)"
      kpis={[
        { label: 'Makine', value: String(rows.length), hint: 'Master data + oturum' },
        { label: 'Çalışıyor', value: String(rows.filter((r) => r.rawStatus === 'Running').length), hint: '' },
        { label: 'Duraklatıldı', value: String(rows.filter((r) => r.rawStatus === 'Paused').length), hint: '' },
      ]}
    >
      <div className="p-4 pt-6">
        <DataTable
          rowKey={(r) => r.machineId}
          data={rows}
          columns={[
            { key: 'id', header: 'Makine', render: (r) => r.machineId },
            { key: 'name', header: 'Ad', render: (r) => r.machineName },
            { key: 'type', header: 'Tip', render: (r) => r.machineType },
            { key: 'line', header: 'Hat', render: (r) => r.lineCode },
            { key: 'st', header: 'Durum', render: (r) => <StatusBadge {...r.status} /> },
            { key: 'po', header: 'Aktif UE', render: (r) => r.activeProductionOrderNo },
            { key: 'op', header: 'Operasyon', render: (r) => r.activeOperationCode },
            { key: 'qty', header: 'Bugün', render: (r) => r.completedQtyToday },
            { key: 'dt', header: 'Duruş', render: (r) => r.downtimeMinutes },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function ShopFloorLaborPage() {
  const { data, isLoading } = useShopFloorLabor()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  return (
    <ErpModuleShell title="Labor Tracking" description="Operatör / işçilik — work session read-model" kpis={[]}>
      <div className="p-4 pt-6">
        <DataTable
          rowKey={(r) => r.operatorId}
          data={data ?? []}
          columns={[
            { key: 'name', header: 'Operatör', render: (r) => r.operatorName },
            { key: 'dept', header: 'Departman', render: (r) => r.department },
            { key: 'st', header: 'Durum', render: (r) => <StatusBadge {...r.status} /> },
            { key: 'po', header: 'Aktif UE', render: (r) => r.activeProductionOrderNo },
            { key: 'op', header: 'Operasyon', render: (r) => r.activeOperationCode },
            { key: 'm', header: 'Makine', render: (r) => r.activeMachineId },
            { key: 'qty', header: 'Üretilen', render: (r) => r.totalCompletedQty },
            { key: 'rw', header: 'Rework', render: (r) => r.totalReworkQty },
            { key: 'rj', header: 'Reject', render: (r) => r.totalRejectQty },
            { key: 'dt', header: 'Duruş', render: (r) => r.totalDowntimeMinutes },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function ShopFloorTimelinePage() {
  const { data: contexts } = useShopFloorContexts()
  const [po, setPo] = useState('')
  const { data: progress } = useShopFloorProgress()
  const { data: timeline } = useShopFloorTimeline(po)

  const progressForPo = useMemo(
    () => (progress ?? []).filter((r) => !po || r.productionOrderNo === po),
    [progress, po],
  )

  return (
    <ErpModuleShell title="Execution Timeline" description="Kalıcı execution event stream + operasyon ilerleme" kpis={[]}>
      <div className="p-4 pt-6 space-y-4">
        <SelectField
          label="Üretim Emri (filtre)"
          value={po}
          onChange={setPo}
          options={[
            ...(contexts ?? []).map((c) => ({
              value: c.productionOrderNo,
              label: `${c.productionOrderNo} — ${c.productCode}`,
            })),
          ]}
        />
        <p className="text-xs text-muted-foreground">Boş bırakılırsa tüm UE olayları listelenir.</p>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operasyon İlerlemesi</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={progressForPo}
              columns={[
                { key: 'po', header: 'UE', render: (r) => r.productionOrderNo },
                { key: 'seq', header: '#', render: (r) => r.sequence },
                { key: 'op', header: 'Operasyon', render: (r) => `${r.operationCode} — ${r.operationName}` },
                { key: 'st', header: 'Durum', render: (r) => <StatusBadge {...r.status} /> },
                { key: 'p', header: '%', render: (r) => r.progressPercent },
                { key: 'g', header: 'Gate', render: (r) => r.gateLabel },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Olay Akışı</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={timeline ?? []}
              columns={[
                { key: 't', header: 'Zaman', render: (r) => r.occurredAt },
                { key: 'e', header: 'Olay', render: (r) => r.eventType },
                { key: 'title', header: 'Başlık', render: (r) => r.title },
                { key: 'd', header: 'Açıklama', render: (r) => r.description },
                { key: 'a', header: 'Aktör', render: (r) => r.actor },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}
