/**
 * Phase 5 Module 4 — Packaging & Packing List UI.
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import {
  newPackagingIdempotencyKey,
  useAddPackageMutation,
  useAutoGenerateFromFgMutation,
  useBindShipmentMutation,
  useConfirmPackingListMutation,
  useCreatePackingListMutation,
  usePackagingDashboard,
  usePackingListDetail,
  usePackingLists,
  useValidatePackingListMutation,
} from '@/application/packaging/use-packaging'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ACTOR = 'pilot-user'

export function PackagingDashboardPage() {
  const { data, isLoading } = usePackagingDashboard()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null

  return (
    <ErpModuleShell title="Packaging Dashboard" description="Packing lists & package totals" kpis={data.kpis}>
      <div className="p-4 pt-6 space-y-4">
        <Button asChild>
          <Link to="/packaging/station">Packing Station</Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Son Packing Listler</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={data.lists.slice(0, 20)}
              columns={[
                {
                  key: 'no',
                  header: 'PL',
                  render: (r) => (
                    <Link className="text-primary underline" to={`/packaging/lists/${r.id}`}>
                      {r.packingListNo}
                    </Link>
                  ),
                },
                { key: 'so', header: 'Sipariş', render: (r) => r.salesOrderNo },
                { key: 'st', header: 'Durum', render: (r) => <StatusBadge label={r.status} /> },
                { key: 'pkg', header: 'Paket', render: (r) => r.totals.packageCount },
                { key: 'qty', header: 'Adet', render: (r) => r.totals.totalQty },
                { key: 'cbm', header: 'CBM', render: (r) => r.totals.volumeCbm },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function PackingListPage() {
  const { data, isLoading } = usePackingLists()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button asChild>
          <Link to="/packaging/station">Yeni / Station</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Packing Lists</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={data ?? []}
            columns={[
              {
                key: 'no',
                header: 'PL',
                render: (r) => (
                  <Link className="text-primary underline" to={`/packaging/lists/${r.id}`}>
                    {r.packingListNo}
                  </Link>
                ),
              },
              { key: 'so', header: 'SO', render: (r) => r.salesOrderNo },
              { key: 'ue', header: 'UE', render: (r) => r.productionOrderNo ?? '—' },
              { key: 'st', header: 'Durum', render: (r) => <StatusBadge label={r.status} /> },
              { key: 'pkg', header: 'Paket', render: (r) => r.totals.packageCount },
              { key: 'w', header: 'Brüt kg', render: (r) => r.totals.grossWeightKg },
              { key: 'ship', header: 'Sevkiyat', render: (r) => r.shipmentReferenceNo ?? '—' },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function PackingListDetailPage() {
  const { packingListId = '' } = useParams()
  const { data, isLoading } = usePackingListDetail(packingListId)
  const validate = useValidatePackingListMutation()
  const confirm = useConfirmPackingListMutation()
  const bind = useBindShipmentMutation()
  const [wh, setWh] = useState('MML-01')
  const [err, setErr] = useState('')

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return <div className="p-8">Packing list bulunamadı.</div>

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {data.packingListNo} · {data.salesOrderNo}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.status} · {data.totals.packageCount} paket · {data.totals.totalQty} adet ·{' '}
            {data.totals.volumeCbm} CBM
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            disabled={validate.isPending}
            onClick={() =>
              void validate
                .mutateAsync({ packingListId: data.id, actorUserId: ACTOR })
                .catch((e: Error) => setErr(e.message))
            }
          >
            Validate
          </Button>
          <Button
            variant="secondary"
            disabled={confirm.isPending}
            onClick={() =>
              void confirm
                .mutateAsync({ packingListId: data.id, actorUserId: ACTOR })
                .catch((e: Error) => setErr(e.message))
            }
          >
            Confirm
          </Button>
          <input
            className="h-9 rounded-md border px-2 text-sm"
            value={wh}
            onChange={(e) => setWh(e.target.value)}
            placeholder="Warehouse"
          />
          <Button
            variant="outline"
            disabled={bind.isPending}
            onClick={() =>
              void bind
                .mutateAsync({
                  packingListId: data.id,
                  warehouseCode: wh,
                  idempotencyKey: newPackagingIdempotencyKey('ship'),
                  actorUserId: ACTOR,
                })
                .catch((e: Error) => setErr(e.message))
            }
          >
            Bind Shipment
          </Button>
        </CardContent>
      </Card>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {data.validationErrors.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm text-amber-800">
              {data.validationErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Packages (Carton / Pallet)</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={data.packages}
            columns={[
              { key: 'no', header: 'No', render: (r) => r.packageNo },
              { key: 'k', header: 'Kind', render: (r) => r.kind },
              { key: 'sscc', header: 'SSCC', render: (r) => <span className="font-mono text-xs">{r.sscc}</span> },
              { key: 'bc', header: 'Barcode', render: (r) => <span className="font-mono text-xs">{r.barcode}</span> },
              { key: 'qty', header: 'Qty', render: (r) => r.lines.reduce((s, l) => s + l.quantity, 0) },
              { key: 'nw', header: 'Net kg', render: (r) => r.netWeightKg },
              { key: 'gw', header: 'Gross kg', render: (r) => r.grossWeightKg },
              { key: 'cbm', header: 'CBM', render: (r) => r.volumeCbm },
              { key: 'st', header: 'Status', render: (r) => r.status },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function PackingStationPage() {
  const create = useCreatePackingListMutation()
  const addPkg = useAddPackageMutation()
  const autoGen = useAutoGenerateFromFgMutation()
  const [salesOrderId, setSalesOrderId] = useState('1')
  const [productionOrderNo, setProductionOrderNo] = useState('')
  const [warehouseCode, setWarehouseCode] = useState('MML-01')
  const [activePlId, setActivePlId] = useState('')
  const [color, setColor] = useState('Black')
  const [size, setSize] = useState('M')
  const [qty, setQty] = useState('10')
  const [net, setNet] = useState('2.5')
  const [kind, setKind] = useState<'Carton' | 'Pallet'>('Carton')
  const [unitsPerCarton, setUnitsPerCarton] = useState('20')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create Packing List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <input className="h-9 w-full rounded-md border px-2 text-sm" value={salesOrderId} onChange={(e) => setSalesOrderId(e.target.value)} placeholder="Sales Order Id" />
          <input className="h-9 w-full rounded-md border px-2 text-sm" value={productionOrderNo} onChange={(e) => setProductionOrderNo(e.target.value)} placeholder="UE No (opt)" />
          <input className="h-9 w-full rounded-md border px-2 text-sm" value={warehouseCode} onChange={(e) => setWarehouseCode(e.target.value)} placeholder="Warehouse" />
          <Button
            disabled={create.isPending}
            onClick={() =>
              void create
                .mutateAsync({
                  salesOrderId,
                  productionOrderNo: productionOrderNo || undefined,
                  warehouseCode,
                  idempotencyKey: newPackagingIdempotencyKey('pl'),
                  actorUserId: ACTOR,
                })
                .then((pl) => {
                  setActivePlId(pl.id)
                  setMsg(`Created ${pl.packingListNo}`)
                  setErr('')
                })
                .catch((e: Error) => setErr(e.message))
            }
          >
            Create
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auto-generate from Finished Goods / Matrix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <input className="h-9 w-full rounded-md border px-2 text-sm" value={unitsPerCarton} onChange={(e) => setUnitsPerCarton(e.target.value)} placeholder="Units / carton" />
          <Button
            disabled={autoGen.isPending || !productionOrderNo}
            onClick={() =>
              void autoGen
                .mutateAsync({
                  salesOrderId,
                  productionOrderNo,
                  warehouseCode,
                  unitsPerCarton: Number(unitsPerCarton),
                  netWeightPerUnitKg: 0.25,
                  idempotencyKey: newPackagingIdempotencyKey('auto'),
                  actorUserId: ACTOR,
                })
                .then((pl) => {
                  setActivePlId(pl.id)
                  setMsg(`Auto ${pl.packingListNo} · ${pl.totals.packageCount} carton`)
                  setErr('')
                })
                .catch((e: Error) => setErr(e.message))
            }
          >
            Auto Generate
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Carton / Pallet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <input className="h-9 w-full rounded-md border px-2 text-sm" value={activePlId} onChange={(e) => setActivePlId(e.target.value)} placeholder="Packing List Id" />
          <div className="flex gap-2">
            <Button size="sm" variant={kind === 'Carton' ? 'default' : 'outline'} onClick={() => setKind('Carton')}>
              Carton
            </Button>
            <Button size="sm" variant={kind === 'Pallet' ? 'default' : 'outline'} onClick={() => setKind('Pallet')}>
              Pallet
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <input className="h-9 rounded-md border px-2 text-sm" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Color" />
            <input className="h-9 rounded-md border px-2 text-sm" value={size} onChange={(e) => setSize(e.target.value)} placeholder="Size" />
            <input className="h-9 rounded-md border px-2 text-sm" type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
            <input className="h-9 rounded-md border px-2 text-sm" type="number" value={net} onChange={(e) => setNet(e.target.value)} placeholder="Net kg" />
          </div>
          <Button
            disabled={addPkg.isPending || !activePlId}
            onClick={() =>
              void addPkg
                .mutateAsync({
                  packingListId: activePlId,
                  kind,
                  lines: [{ color, size, quantity: Number(qty) }],
                  netWeightKg: Number(net),
                  idempotencyKey: newPackagingIdempotencyKey('pkg'),
                  actorUserId: ACTOR,
                })
                .then((pl) => {
                  setMsg(`Package added · ${pl.totals.packageCount} total`)
                  setErr('')
                })
                .catch((e: Error) => setErr(e.message))
            }
          >
            Add Package
          </Button>
          {activePlId ? (
            <Button variant="link" asChild>
              <Link to={`/packaging/lists/${activePlId}`}>Open detail</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
    </div>
  )
}

/** Legacy route alias — demo CARTONS replaced by live dashboard. */
export function PackagingPage() {
  return <PackagingDashboardPage />
}
