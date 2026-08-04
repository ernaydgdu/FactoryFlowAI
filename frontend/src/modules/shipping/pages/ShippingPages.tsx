/**
 * Phase 6 Module 1 — Shipment Management UI.
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAuth } from '@/application/platform/iam/auth-context'
import {
  newShipmentIdempotencyKey,
  useAddShipmentLoadMutation,
  useCreateShipmentMutation,
  usePostShipmentInventoryMutation,
  useShipmentDashboard,
  useShipmentDetail,
  useShipments,
  useTransitionShipmentMutation,
  useUpdateShipmentLogisticsMutation,
} from '@/application/shipment/use-shipment'
import type { ShipmentStatus } from '@/domain/shipment/shipment.types'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function useActorUserId(): string {
  const { user } = useAuth()
  return user?.id ?? 'system'
}

export function ShipmentDashboardPage() {
  const { data, isLoading } = useShipmentDashboard()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null

  return (
    <ErpModuleShell title="Shipment Dashboard" description="Booking · load · dispatch" kpis={data.kpis}>
      <div className="p-4 pt-6 space-y-4">
        <Button asChild>
          <Link to="/shipping/station">New Shipment</Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Son Sevkiyatlar</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={data.shipments.slice(0, 20)}
              columns={[
                {
                  key: 'no',
                  header: 'SH',
                  render: (r) => (
                    <Link className="text-primary underline" to={`/shipping/shipments/${r.id}`}>
                      {r.shipmentNo}
                    </Link>
                  ),
                },
                { key: 'so', header: 'SO', render: (r) => r.salesOrderNo },
                { key: 'st', header: 'Durum', render: (r) => <StatusBadge label={r.status} /> },
                { key: 'ctr', header: 'Container', render: (r) => r.containerNo ?? '—' },
                { key: 'pol', header: 'POL', render: (r) => r.portOfLoading ?? '—' },
                { key: 'pod', header: 'POD', render: (r) => r.portOfDischarge ?? '—' },
                { key: 'qty', header: 'Qty', render: (r) => r.totals.totalQty },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function ShipmentListPage() {
  const { data, isLoading } = useShipments()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <div className="space-y-4">
      <Button asChild>
        <Link to="/shipping/station">Yeni / Station</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={data ?? []}
            columns={[
              {
                key: 'no',
                header: 'SH',
                render: (r) => (
                  <Link className="text-primary underline" to={`/shipping/shipments/${r.id}`}>
                    {r.shipmentNo}
                  </Link>
                ),
              },
              { key: 'so', header: 'SO', render: (r) => r.salesOrderNo },
              { key: 'book', header: 'Booking', render: (r) => r.bookingNo ?? '—' },
              { key: 'vessel', header: 'Vessel', render: (r) => r.vesselName ?? '—' },
              { key: 'st', header: 'Status', render: (r) => <StatusBadge label={r.status} /> },
              { key: 'pkg', header: 'Pkgs', render: (r) => r.totals.packageCount },
              { key: 'inv', header: 'Inventory', render: (r) => r.inventoryReferenceNo ?? '—' },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function ShipmentDetailPage() {
  const actorUserId = useActorUserId()
  const { shipmentId = '' } = useParams()
  const { data, isLoading } = useShipmentDetail(shipmentId)
  const update = useUpdateShipmentLogisticsMutation()
  const addLoad = useAddShipmentLoadMutation()
  const transition = useTransitionShipmentMutation()
  const postInv = usePostShipmentInventoryMutation()
  const [packingListId, setPackingListId] = useState('')
  const [wh, setWh] = useState('MML-01')
  const [err, setErr] = useState('')

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return <div className="p-8">Shipment bulunamadı.</div>

  const transitions: ShipmentStatus[] = ['Booked', 'Loaded', 'Dispatched', 'InTransit', 'Delivered', 'Closed']

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {data.shipmentNo} · {data.salesOrderNo}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.status} · {data.totals.packageCount} pkg · {data.totals.totalQty} qty ·{' '}
            {data.totals.volumeCbm} CBM
            {data.vesselName ? ` · ${data.vesselName}` : ''}
            {data.portOfLoading && data.portOfDischarge
              ? ` · ${data.portOfLoading}→${data.portOfDischarge}`
              : ''}
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {transitions.map((to) => (
            <Button
              key={to}
              size="sm"
              variant="outline"
              disabled={transition.isPending || data.status === to}
              onClick={() =>
                void transition
                  .mutateAsync({
                    shipmentId: data.id,
                    toStatus: to,
                    idempotencyKey: newShipmentIdempotencyKey(`tr-${to}`),
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logistics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <Button
            disabled={update.isPending}
            onClick={() =>
              void update
                .mutateAsync({
                  shipmentId: data.id,
                  bookingNo: data.bookingNo ?? `BK-${data.shipmentNo}`,
                  containerNo: data.containerNo ?? 'MSKU1234567',
                  containerType: data.containerType ?? '40HC',
                  sealNo: data.sealNo ?? 'SEAL-1',
                  vesselName: data.vesselName ?? 'KEPLER STAR',
                  voyageNo: data.voyageNo ?? 'V001',
                  portOfLoading: data.portOfLoading ?? 'TRIST',
                  portOfDischarge: data.portOfDischarge ?? 'DEHAM',
                  etd: data.etd ?? new Date().toISOString().slice(0, 10),
                  eta: data.eta ?? new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
                  forwarderCode: data.forwarderCode ?? 'FWD-01',
                  idempotencyKey: newShipmentIdempotencyKey('log'),
                  actorUserId,
                })
                .catch((e: Error) => setErr(e.message))
            }
          >
            Fill / Update Logistics
          </Button>
          <div className="flex gap-2">
            <input
              className="h-9 flex-1 rounded-md border px-2 text-sm"
              value={packingListId}
              onChange={(e) => setPackingListId(e.target.value)}
              placeholder="Packing List Id"
            />
            <Button
              disabled={addLoad.isPending || !packingListId}
              onClick={() =>
                void addLoad
                  .mutateAsync({
                    shipmentId: data.id,
                    packingListId,
                    idempotencyKey: newShipmentIdempotencyKey('load'),
                    actorUserId,
                  })
                  .catch((e: Error) => setErr(e.message))
              }
            >
              Add Load
            </Button>
          </div>
          <div className="flex gap-2">
            <input
              className="h-9 flex-1 rounded-md border px-2 text-sm"
              value={wh}
              onChange={(e) => setWh(e.target.value)}
              placeholder="Warehouse"
            />
            <Button
              variant="secondary"
              disabled={postInv.isPending}
              onClick={() =>
                void postInv
                  .mutateAsync({
                    shipmentId: data.id,
                    warehouseCode: wh,
                    idempotencyKey: newShipmentIdempotencyKey('inv'),
                    actorUserId,
                  })
                  .catch((e: Error) => setErr(e.message))
              }
            >
              Post Inventory
            </Button>
          </div>
        </CardContent>
      </Card>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Load Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={data.loadLines}
            columns={[
              { key: 'pl', header: 'PL', render: (r) => r.packingListNo },
              { key: 'pkg', header: 'Package', render: (r) => r.packageNo },
              { key: 'sscc', header: 'SSCC', render: (r) => r.sscc ?? '—' },
              { key: 'qty', header: 'Qty', render: (r) => r.quantity },
              { key: 'gw', header: 'Gross', render: (r) => r.grossWeightKg },
              { key: 'cbm', header: 'CBM', render: (r) => r.volumeCbm },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Log</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={data.statusLog}
            columns={[
              { key: 'st', header: 'Status', render: (r) => r.status },
              { key: 'at', header: 'At', render: (r) => r.occurredAt },
              { key: 'by', header: 'Actor', render: (r) => r.actorUserId },
              { key: 'note', header: 'Note', render: (r) => r.note ?? '—' },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function ShipmentStationPage() {
  const actorUserId = useActorUserId()
  const create = useCreateShipmentMutation()
  const [salesOrderId, setSalesOrderId] = useState('1')
  const [packingListId, setPackingListId] = useState('')
  const [bookingNo, setBookingNo] = useState('')
  const [pol, setPol] = useState('TRIST')
  const [pod, setPod] = useState('DEHAM')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create Shipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <input className="h-9 w-full rounded-md border px-2 text-sm" value={salesOrderId} onChange={(e) => setSalesOrderId(e.target.value)} placeholder="Sales Order Id" />
          <input className="h-9 w-full rounded-md border px-2 text-sm" value={packingListId} onChange={(e) => setPackingListId(e.target.value)} placeholder="Packing List Id (opt)" />
          <input className="h-9 w-full rounded-md border px-2 text-sm" value={bookingNo} onChange={(e) => setBookingNo(e.target.value)} placeholder="Booking No" />
          <div className="grid grid-cols-2 gap-2">
            <input className="h-9 rounded-md border px-2 text-sm" value={pol} onChange={(e) => setPol(e.target.value)} placeholder="POL" />
            <input className="h-9 rounded-md border px-2 text-sm" value={pod} onChange={(e) => setPod(e.target.value)} placeholder="POD" />
          </div>
          <Button
            disabled={create.isPending}
            onClick={() =>
              void create
                .mutateAsync({
                  salesOrderId,
                  packingListId: packingListId || undefined,
                  bookingNo: bookingNo || undefined,
                  portOfLoading: pol,
                  portOfDischarge: pod,
                  idempotencyKey: newShipmentIdempotencyKey('sh'),
                  actorUserId,
                })
                .then((s) => {
                  setMsg(`Created ${s.shipmentNo}`)
                  setErr('')
                })
                .catch((e: Error) => setErr(e.message))
            }
          >
            Create
          </Button>
        </CardContent>
      </Card>
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
    </div>
  )
}

/** Containers board — live shipments with container assignment. */
export function ShipmentContainersPage() {
  const { data, isLoading } = useShipments()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  const withContainer = (data ?? []).filter((s) => s.containerNo)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Container Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={withContainer}
            columns={[
              {
                key: 'no',
                header: 'SH',
                render: (r) => (
                  <Link className="text-primary underline" to={`/shipping/shipments/${r.id}`}>
                    {r.shipmentNo}
                  </Link>
                ),
              },
              { key: 'ctr', header: 'Container', render: (r) => r.containerNo },
              { key: 'type', header: 'Type', render: (r) => r.containerType ?? '—' },
              { key: 'seal', header: 'Seal', render: (r) => r.sealNo ?? '—' },
              { key: 'etd', header: 'ETD', render: (r) => r.etd ?? '—' },
              { key: 'eta', header: 'ETA', render: (r) => r.eta ?? '—' },
              { key: 'st', header: 'Status', render: (r) => <StatusBadge label={r.status} /> },
            ]}
          />
          {withContainer.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz container atanmış sevkiyat yok.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

/** Legacy route alias. */
export function ShippingPage() {
  return <ShipmentDashboardPage />
}
