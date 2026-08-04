/**
 * Phase 4 Module 3 — Production Order: Status Board, Operation List,
 * Material Reservation. Kaynak: kalıcı UE aggregate'i + kalıcı stok defteri.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  mapSplitPlan,
  useMaterialReservationView,
  useProductionOrderOperationList,
  useProductionOrderStatusBoard,
  useReserveMaterialsMutation,
} from '@/application/production-order-lifecycle/use-production-order-board'
import { useProductionOrderLifecycleList } from '@/application/production-order-lifecycle/use-production-order-lifecycle'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const ACTOR = 'pilot-user'

export function ProductionOrderStatusBoardPage() {
  const { data: board, isLoading } = useProductionOrderStatusBoard()
  const [splitOrderNo, setSplitOrderNo] = useState('')
  const [splitQtyText, setSplitQtyText] = useState('')

  const splitPlan = useMemo(() => {
    if (!splitOrderNo || !splitQtyText.trim()) return null
    const quantities = splitQtyText
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => !Number.isNaN(n))
    return mapSplitPlan(splitOrderNo, quantities)
  }, [splitOrderNo, splitQtyText])

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!board) return null

  const visibleColumns = board.columns.filter((c) => c.count > 0 || !['Closed', 'Cancelled'].includes(c.status))

  return (
    <ErpModuleShell title="Durum Panosu" description="Üretim emirleri yaşam döngüsü durum panosu" kpis={board.kpis}>
      <div className="p-4 pt-6 space-y-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {visibleColumns.map((col) => (
            <div key={col.status} className="w-60 shrink-0 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between border-b p-2">
                <StatusBadge {...col.badge} />
                <span className="text-xs text-muted-foreground">
                  {col.count} UE · {col.totalRemainingQty} kalan
                </span>
              </div>
              <div className="space-y-2 p-2">
                {col.items.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
                {col.items.map((item) => (
                  <Link
                    key={item.productionOrderNo}
                    to={`/production-order-lifecycle/orders/${item.productionOrderNo}`}
                    className={cn(
                      'block rounded-md border bg-background p-2 text-xs hover:border-primary',
                      item.terminRisk && 'border-destructive/60',
                    )}
                  >
                    <div className="font-medium">{item.productionOrderNo}</div>
                    <div className="text-muted-foreground">{item.productName}</div>
                    <div className="mt-1 flex justify-between">
                      <span>{item.producedQty}/{item.plannedQty}</span>
                      <span>{item.lineCode}</span>
                    </div>
                    {item.terminRisk && <div className="mt-1 text-destructive">Termin riski</div>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Split Önizleme (iskelet — persistence yok)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Üretim Emri No</label>
                <Input
                  value={splitOrderNo}
                  onChange={(e) => setSplitOrderNo(e.target.value)}
                  placeholder="UE-2026-1001"
                  className="w-44"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Parça Miktarları (virgülle)</label>
                <Input
                  value={splitQtyText}
                  onChange={(e) => setSplitQtyText(e.target.value)}
                  placeholder="600, 400"
                  className="w-44"
                />
              </div>
            </div>
            {splitPlan && (
              <div className="text-sm">
                {splitPlan.valid ? (
                  <div className="space-y-1">
                    <p className="text-emerald-600">
                      Geçerli split planı — bölünebilir miktar: {splitPlan.splittableQty}
                    </p>
                    <ul className="text-muted-foreground">
                      {splitPlan.lines.map((l) => (
                        <li key={l.proposedNo}>
                          {l.proposedNo}: {l.quantity} adet
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <ul className="space-y-1 text-destructive">
                    {splitPlan.errors.map((e) => (
                      <li key={e}>● {e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function ProductionOrderOperationListPage() {
  const { data: rows, isLoading } = useProductionOrderOperationList()
  const [filter, setFilter] = useState('')

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  const allRows = rows ?? []
  const filtered = filter
    ? allRows.filter((r) => r.productionOrderNo.toLowerCase().includes(filter.toLowerCase()))
    : allRows

  const kpis = [
    { label: 'Operasyon Adımı', value: String(allRows.length), hint: 'Tüm aktif UE rotaları' },
    {
      label: 'Devam Eden',
      value: String(allRows.filter((r) => r.stepStatus.label === 'Devam Ediyor').length),
      hint: 'In Progress',
    },
    {
      label: 'Tamamlanan',
      value: String(allRows.filter((r) => r.stepStatus.label === 'Tamamlandı').length),
      hint: '',
    },
  ]

  return (
    <ErpModuleShell title="Operasyon Listesi" description="UE operasyon rotaları ve adım durumları" kpis={kpis}>
      <div className="p-4 pt-6 space-y-3">
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="UE No ile filtrele…"
          className="w-64"
        />
        <DataTable
          rowKey={(r) => r.id}
          data={filtered}
          columns={[
            {
              key: 'no',
              header: 'UE No',
              render: (r) => (
                <Link className="underline" to={`/production-order-lifecycle/orders/${r.productionOrderNo}`}>
                  {r.productionOrderNo}
                </Link>
              ),
            },
            { key: 'product', header: 'Ürün', render: (r) => r.productName },
            { key: 'seq', header: 'Sıra', render: (r) => r.sequence },
            { key: 'code', header: 'Operasyon', render: (r) => r.operationCode },
            { key: 'name', header: 'Ad', render: (r) => r.operationName },
            { key: 'ws', header: 'Atölye', render: (r) => r.workshopCode },
            { key: 'status', header: 'Durum', render: (r) => <StatusBadge {...r.stepStatus} /> },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function ProductionOrderReservationPage() {
  const { data: orders } = useProductionOrderLifecycleList()
  const [selectedNo, setSelectedNo] = useState('')

  const eligible = (orders ?? []).filter((o) =>
    ['Released', 'In Production', 'Paused'].includes(o.lifecycleStatus),
  )
  const orderNo = selectedNo || eligible[0]?.productionOrderNo || ''

  const { data: view, isLoading } = useMaterialReservationView(orderNo)
  const reserveMutation = useReserveMaterialsMutation()

  const kpis = view
    ? [
        { label: 'BOM Satırı', value: String(view.lines.length), hint: orderNo },
        {
          label: 'Rezerve Satır',
          value: String(view.lines.filter((l) => l.reservedQty >= l.requiredQty).length),
          hint: 'Kalıcı defterde',
        },
        {
          label: 'BR-03',
          value: view.reservationApplied ? 'Uygulandı' : 'Bekliyor',
          hint: 'Durum geçişi kuralı',
        },
        { label: 'Defter Durumu', value: view.fullyReserved ? 'Tam' : 'Eksik', hint: 'Stock Ledger' },
      ]
    : []

  return (
    <ErpModuleShell
      title="Malzeme Rezervasyonu"
      description="UE BOM rezervasyonlarının kalıcı stok defteri (Stock Ledger) karşılığı"
      kpis={kpis}
    >
      <div className="p-4 pt-6 space-y-4">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Üretim Emri (Released+)</label>
            <select
              className="flex h-9 rounded-md border px-2 text-sm"
              value={orderNo}
              onChange={(e) => setSelectedNo(e.target.value)}
            >
              {eligible.length === 0 && <option value="">Uygun UE yok</option>}
              {eligible.map((o) => (
                <option key={o.productionOrderNo} value={o.productionOrderNo}>
                  {o.productionOrderNo} — {o.productName}
                </option>
              ))}
            </select>
          </div>
          <Button
            size="sm"
            disabled={!orderNo || reserveMutation.isPending}
            onClick={() => reserveMutation.mutate({ productionOrderNo: orderNo, actorUserId: ACTOR })}
          >
            Rezervasyonu Deftere İşle
          </Button>
          {reserveMutation.isSuccess && (
            <span className="text-sm text-emerald-600">
              {reserveMutation.data.reservedCount} satır rezerve edildi
              {reserveMutation.data.skippedCount > 0 && `, ${reserveMutation.data.skippedCount} satır atlandı`}
              .
            </span>
          )}
          {reserveMutation.isError && (
            <span className="text-sm text-destructive">
              {(reserveMutation.error as Error)?.message ?? 'Rezervasyon işlenemedi.'}
            </span>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">BOM Rezervasyon Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-sm text-muted-foreground">Yükleniyor…</p>}
            {!isLoading && !view && <p className="text-sm text-muted-foreground">UE seçin.</p>}
            {view && (
              <DataTable
                rowKey={(l) => l.stockCardId}
                data={view.lines}
                columns={[
                  { key: 'code', header: 'Malzeme', render: (l) => `${l.code} — ${l.name}` },
                  { key: 'wh', header: 'Depo', render: (l) => l.warehouseCode },
                  { key: 'required', header: 'Gereken', render: (l) => `${l.requiredQty} ${l.unit}` },
                  { key: 'reserved', header: 'Rezerve', render: (l) => `${l.reservedQty} ${l.unit}` },
                  { key: 'available', header: 'Serbest', render: (l) => `${l.availableQty} ${l.unit}` },
                  { key: 'status', header: 'Durum', render: (l) => <StatusBadge {...l.status} /> },
                  { key: 'msg', header: 'Not', render: (l) => l.message },
                ]}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}
