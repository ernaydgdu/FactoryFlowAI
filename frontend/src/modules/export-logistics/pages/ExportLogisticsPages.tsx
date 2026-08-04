/**
 * Phase 6 Module 3 — Export Logistics Orchestration UI.
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAuth } from '@/application/platform/iam/auth-context'
import {
  newExportLogisticsIdempotencyKey,
  useAssignContainerMutation,
  useClearCustomsMutation,
  useConfirmBookingMutation,
  useCreateExportShipmentMutation,
  useExportLogisticsBrain,
  useExportLogisticsDashboard,
  useExportShipmentDetail,
  useExportShipments,
  useTransitionExportShipmentMutation,
} from '@/application/export-logistics/use-export-logistics'
import type { ExportShipmentStatus } from '@/domain/export-logistics/export-logistics.types'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function useActorUserId(): string {
  const { user } = useAuth()
  return user?.id ?? 'system'
}

export function ExportLogisticsDashboardPage() {
  const { data, isLoading } = useExportLogisticsDashboard()
  const { data: brain } = useExportLogisticsBrain()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null

  return (
    <ErpModuleShell
      title="Export Status Dashboard"
      description="Orchestration KPIs · delay risk"
      kpis={data.kpis}
    >
      <div className="p-4 pt-6 space-y-4">
        <Button asChild>
          <Link to="/export-logistics/dispatch">Dispatch Wizard</Link>
        </Button>
        {brain ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Brain · avg delay risk {brain.avgDelayRiskScore} · blocked {brain.blocked}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                rowKey={(r) => r.id}
                data={brain.shipments.slice(0, 10)}
                columns={[
                  { key: 'no', header: 'EXS', render: (r) => r.exportShipmentNo },
                  { key: 'st', header: 'Status', render: (r) => r.status },
                  { key: 'risk', header: 'Risk', render: (r) => r.delayRiskScore },
                  { key: 'delay', header: 'Pred. delay d', render: (r) => r.predictedDelayDays },
                  {
                    key: 'flags',
                    header: 'Gates fail',
                    render: (r) => r.gateFailures.join(', ') || '—',
                  },
                ]}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </ErpModuleShell>
  )
}

export function ExportShipmentBoardPage() {
  const { data, isLoading } = useExportShipments()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Shipment Board</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={data ?? []}
            columns={[
              {
                key: 'no',
                header: 'EXS',
                render: (r) => (
                  <Link className="text-primary underline" to={`/export-logistics/board/${r.id}`}>
                    {r.exportShipmentNo}
                  </Link>
                ),
              },
              { key: 'sh', header: 'Shipment', render: (r) => r.shipmentNo },
              { key: 'st', header: 'Export', render: (r) => <StatusBadge label={r.status} /> },
              { key: 'cus', header: 'Customs', render: (r) => r.customsStatus },
              { key: 'ctr', header: 'Container', render: (r) => r.container?.containerNo ?? '—' },
              { key: 'seal', header: 'Seal', render: (r) => r.container?.sealNo ?? '—' },
              { key: 'pol', header: 'POL', render: (r) => r.portOfLoading ?? '—' },
              { key: 'pod', header: 'POD', render: (r) => r.portOfDischarge ?? '—' },
              { key: 'risk', header: 'Risk', render: (r) => r.delayRiskScore },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function ExportShipmentDetailPage() {
  const actorUserId = useActorUserId()
  const { exportShipmentId = '' } = useParams()
  const { data, isLoading } = useExportShipmentDetail(exportShipmentId)
  const confirm = useConfirmBookingMutation()
  const assign = useAssignContainerMutation()
  const customs = useClearCustomsMutation()
  const transition = useTransitionExportShipmentMutation()
  const [containerNo, setContainerNo] = useState('')
  const [sealNo, setSealNo] = useState('')
  const [err, setErr] = useState('')

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return <div className="p-8">Export shipment bulunamadı.</div>

  const flow: ExportShipmentStatus[] = [
    'Booked',
    'ContainerAssigned',
    'DocumentsComplete',
    'CustomsCleared',
    'Loaded',
    'Departed',
    'Arrived',
    'Closed',
  ]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {data.exportShipmentNo} · {data.shipmentNo}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.status} · customs {data.customsStatus} · risk {data.delayRiskScore} · pred delay{' '}
            {data.predictedDelayDays}d
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            size="sm"
            disabled={confirm.isPending}
            onClick={() =>
              void confirm
                .mutateAsync({
                  exportShipmentId: data.id,
                  bookingNo: data.booking.bookingNo || `BK-${data.exportShipmentNo}`,
                  vesselName: data.voyage.vesselName ?? 'KEPLER STAR',
                  voyageNo: data.voyage.voyageNo ?? 'V001',
                  portOfLoading: data.portOfLoading ?? 'TRIST',
                  portOfDischarge: data.portOfDischarge ?? 'DEHAM',
                  etd: data.etd ?? new Date().toISOString().slice(0, 10),
                  eta: data.eta ?? new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
                  forwarderCode: data.forwarder.forwarderCode ?? 'FWD-01',
                  idempotencyKey: newExportLogisticsIdempotencyKey('bk'),
                  actorUserId,
                })
                .catch((e: Error) => setErr(e.message))
            }
          >
            Confirm Booking
          </Button>
          <input
            className="h-9 rounded-md border px-2 text-sm"
            placeholder="Container"
            value={containerNo}
            onChange={(e) => setContainerNo(e.target.value)}
          />
          <input
            className="h-9 rounded-md border px-2 text-sm"
            placeholder="Seal"
            value={sealNo}
            onChange={(e) => setSealNo(e.target.value)}
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={assign.isPending || !containerNo || !sealNo}
            onClick={() =>
              void assign
                .mutateAsync({
                  exportShipmentId: data.id,
                  containerNo,
                  containerType: '40HC',
                  sealNo,
                  idempotencyKey: newExportLogisticsIdempotencyKey('ctr'),
                  actorUserId,
                })
                .catch((e: Error) => setErr(e.message))
            }
          >
            Assign Container
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={customs.isPending}
            onClick={() =>
              void customs
                .mutateAsync({
                  exportShipmentId: data.id,
                  note: 'Cleared',
                  idempotencyKey: newExportLogisticsIdempotencyKey('cus'),
                  actorUserId,
                })
                .catch((e: Error) => setErr(e.message))
            }
          >
            Clear Customs
          </Button>
          {flow.map((to) => (
            <Button
              key={to}
              size="sm"
              variant="outline"
              disabled={transition.isPending || data.status === to}
              onClick={() =>
                void transition
                  .mutateAsync({
                    exportShipmentId: data.id,
                    toStatus: to,
                    idempotencyKey: newExportLogisticsIdempotencyKey(`tr-${to}`),
                    actorUserId,
                  })
                  .catch((e: Error) => setErr(e.message))
              }
            >
              → {to}
            </Button>
          ))}
        </CardContent>
      </Card>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gate Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm">
            {data.gateChecks.map((g) => (
              <li key={g.code}>
                {g.passed ? '✓' : '✗'} {g.code}: {g.detail}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customs Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={data.statusLog}
            columns={[
              { key: 'st', header: 'Status', render: (r) => r.status },
              { key: 'at', header: 'At', render: (r) => r.occurredAt },
              { key: 'by', header: 'Actor', render: (r) => r.actorUserId },
              { key: 'n', header: 'Note', render: (r) => r.note ?? '—' },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function ExportDispatchWizardPage() {
  const actorUserId = useActorUserId()
  const create = useCreateExportShipmentMutation()
  const [shipmentId, setShipmentId] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [activeId, setActiveId] = useState('')

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dispatch Wizard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Creates ExportShipment orchestration over an existing Shipment. Load requires Issued CI,
            Approved PL, container+seal, booking, weight/CBM pass, customs cleared.
          </p>
          <input
            className="h-9 w-full rounded-md border px-2 text-sm"
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
            placeholder="Shipment Id"
          />
          <Button
            disabled={create.isPending || !shipmentId}
            onClick={() =>
              void create
                .mutateAsync({
                  shipmentId,
                  idempotencyKey: newExportLogisticsIdempotencyKey('exs'),
                  actorUserId,
                })
                .then((s) => {
                  setActiveId(s.id)
                  setMsg(`Created ${s.exportShipmentNo}`)
                  setErr('')
                })
                .catch((e: Error) => setErr(e.message))
            }
          >
            Create Export Shipment
          </Button>
          {activeId ? (
            <Button variant="link" asChild>
              <Link to={`/export-logistics/board/${activeId}`}>Open board detail</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
    </div>
  )
}
