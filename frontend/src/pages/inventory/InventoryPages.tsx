import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import {
  useCycleCountMutation,
  useGoodsIssueMutation,
  useGoodsReceiptMutation,
  useInventoryBalanceList,
  useInventoryCycleCounts,
  useInventoryDashboard,
  useInventoryKpis,
  useInventoryMovementList,
  useInventoryOutbound,
  useInventoryReservations,
  useInventoryTransfers,
  useReservationMutation,
  useTransferMutation,
  useWarehouseList,
} from '@/application/inventory/use-inventory'
import { usePurchaseOrderDetail, usePurchaseOrderList } from '@/application/purchasing/use-purchasing'
import { DataTable, ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { warehouseRepository } from '@/domain/master-data'
import { queryAllStockCards } from '@/domain/stock-card/stock-card-query.service'
import { useDataList } from '@/hooks/use-data-list'

const ACTOR = 'pilot-user'

function defaultWarehouseCode(): string {
  return (
    warehouseRepository.getActive().find((w) => w.type === 'Hammadde')?.code ??
    warehouseRepository.getActive()[0]?.code ??
    'HMD-01'
  )
}

function MovementTable({
  data,
  searchPlaceholder,
}: {
  data: { id: string; date: string; movementNo: string; typeLabel: string; material: string; qty: number; unit: string; warehouse: string; referenceNo: string; status: { label: string; tone: string } }[]
  searchPlaceholder: string
}) {
  const list = useDataList({
    data,
    searchFields: [(r) => r.material, (r) => r.warehouse, (r) => r.movementNo],
    initialSort: { key: 'date', direction: 'desc' },
  })
  return (
    <>
      <ErpToolbar searchPlaceholder={searchPlaceholder} searchValue={list.search} onSearchChange={list.setSearch} className="mb-4" />
      <DataTable
        rowKey={(r) => r.id}
        data={list.paginated}
        columns={[
          { key: 'date', header: 'Tarih', render: (r) => r.date },
          { key: 'movementNo', header: 'Hareket No', render: (r) => r.movementNo },
          { key: 'type', header: 'Tip', render: (r) => r.typeLabel },
          { key: 'material', header: 'Malzeme', render: (r) => r.material },
          { key: 'qty', header: 'Miktar', render: (r) => `${r.qty.toLocaleString('tr-TR')} ${r.unit}` },
          { key: 'warehouse', header: 'Depo', render: (r) => r.warehouse },
          { key: 'ref', header: 'Referans', render: (r) => r.referenceNo },
          { key: 'status', header: 'Durum', render: (r) => <StatusBadge label={r.status.label} tone={r.status.tone as 'success' | 'warning' | 'default'} /> },
        ]}
      />
    </>
  )
}

export function InventoryDashboardPage() {
  const { data, isLoading } = useInventoryDashboard()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  const kpis = data?.kpis

  return (
    <ErpModuleShell
      title="Envanter Dashboard"
      description="Stok ledger, bakiye ve hareket özeti."
      kpis={kpis?.items ?? []}
    >
      <div className="grid gap-4 p-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Son Hareketler</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.recentMovements ?? []).slice(0, 8).map((m) => (
              <div key={m.id} className="flex justify-between border-b pb-1">
                <span>{m.movementNo} — {m.material}</span>
                <span className="text-muted-foreground">{m.typeLabel}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Kritik Stok</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.lowStock ?? []).map((b) => (
              <div key={b.id} className="flex justify-between border-b pb-1">
                <span>{b.materialCode} @ {b.warehouseName}</span>
                <span>Eldeki: {b.onHand} / Rez: {b.reserved}</span>
              </div>
            ))}
            {(data?.lowStock ?? []).length === 0 && <p className="text-muted-foreground">Kritik stok yok.</p>}
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function StockInquiryPage() {
  const { data, isLoading } = useInventoryBalanceList()
  const list = useDataList({
    data: data ?? [],
    searchFields: [(r) => r.materialCode, (r) => r.materialName, (r) => r.warehouseName],
    initialSort: { key: 'materialCode', direction: 'asc' },
  })
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell title="Stok Sorgulama" description="Depo bazlı bakiye görünümü." kpis={[]}>
      <div className="p-4 pt-6">
        <ErpToolbar searchPlaceholder="Malzeme, depo ara..." searchValue={list.search} onSearchChange={list.setSearch} className="mb-4" />
        <DataTable
          rowKey={(r) => r.id}
          data={list.paginated}
          columns={[
            { key: 'code', header: 'Kod', render: (r) => r.materialCode },
            { key: 'name', header: 'Malzeme', render: (r) => r.materialName },
            { key: 'wh', header: 'Depo', render: (r) => r.warehouseName },
            { key: 'onHand', header: 'Eldeki', render: (r) => r.onHand.toLocaleString('tr-TR') },
            { key: 'reserved', header: 'Rezerve', render: (r) => r.reserved.toLocaleString('tr-TR') },
            { key: 'available', header: 'Serbest', render: (r) => r.available.toLocaleString('tr-TR') },
            { key: 'unit', header: 'Birim', render: (r) => r.unit },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function StockLedgerPage() {
  const { data, isLoading } = useInventoryMovementList()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  return (
    <ErpModuleShell title="Stok Ledger" description="Immutable hareket defteri." kpis={[]}>
      <div className="p-4 pt-6">
        <MovementTable data={data ?? []} searchPlaceholder="Hareket no, malzeme ara..." />
      </div>
    </ErpModuleShell>
  )
}

export function WarehouseDashboardPage() {
  const { data: warehouses, isLoading } = useWarehouseList()
  const { data: kpis } = useInventoryKpis()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell title="Depo Yönetimi" description="Depo hiyerarşisi ve operasyon merkezi." kpis={kpis?.items ?? []}>
      <div className="p-4 pt-6">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild><Link to="/warehouse/inbound">Mal Giriş</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/warehouse/outbound">Mal Çıkış</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/warehouse/transfer">Transfer</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/warehouse/reservation">Rezervasyon</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/warehouse/count">Sayım</Link></Button>
          <Button size="sm" variant="outline" asChild><Link to="/warehouse/fg-receipt">Mamül Kabul</Link></Button>
        </div>
        <DataTable
          rowKey={(r) => r.id}
          data={warehouses ?? []}
          columns={[
            { key: 'code', header: 'Kod', render: (r) => <Link className="underline" to={`/warehouse/${r.code}`}>{r.code}</Link> },
            { key: 'name', header: 'Depo', render: (r) => '  '.repeat(r.depth) + r.name },
            { key: 'type', header: 'Tip', render: (r) => r.type },
            { key: 'whType', header: 'Depo Türü', render: (r) => r.warehouseType },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function GoodsReceiptPage() {
  const { data, isLoading } = useInventoryMovementList()
  const inbound = (data ?? []).filter((m) => m.type === 'RECEIPT')
  const receiptMutation = useGoodsReceiptMutation()
  const { data: pos } = usePurchaseOrderList()
  const [poId, setPoId] = useState('')
  const { data: poDetail } = usePurchaseOrderDetail(poId)
  const [qty, setQty] = useState('100')
  const wh = defaultWarehouseCode()

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell title="Mal Kabul (GR)" description="PO → Goods Receipt → Inventory RECEIPT hareketi." kpis={[]}>
      <div className="p-4 pt-6 space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Yeni Mal Kabul</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-xs text-muted-foreground">PO</label>
              <select className="flex h-9 rounded-md border px-2 text-sm" value={poId} onChange={(e) => setPoId(e.target.value)}>
                <option value="">Seçin</option>
                {(pos ?? []).filter((p) => p.lifecycleStatus === 'Open' || p.lifecycleStatus === 'Partially Received').map((p) => (
                  <option key={p.id} value={p.id}>{p.poNo}</option>
                ))}
              </select>
            </div>
            <div><label className="text-xs text-muted-foreground">Miktar</label><Input value={qty} onChange={(e) => setQty(e.target.value)} className="w-24" /></div>
            <Button size="sm" disabled={!poId || !poDetail?.lines[0] || receiptMutation.isPending} onClick={() => {
              const line = poDetail!.lines[0]!
              receiptMutation.mutate({
                purchaseOrderId: poId,
                warehouseCode: wh,
                lines: [{ materialCode: line.materialCode, quantity: Number(qty) }],
                actorUserId: ACTOR,
              })
            }}><Plus className="size-4" /> Kaydet</Button>
          </CardContent>
        </Card>
        <MovementTable data={inbound} searchPlaceholder="GR hareketleri ara..." />
      </div>
    </ErpModuleShell>
  )
}

export function GoodsIssuePage() {
  const { data, isLoading } = useInventoryOutbound()
  const issueMutation = useGoodsIssueMutation()
  const cards = queryAllStockCards()
  const [cardId, setCardId] = useState(cards[0]?.id ?? '')
  const [qty, setQty] = useState('10')
  const wh = cards.find((c) => c.id === cardId)?.warehouseCode ?? defaultWarehouseCode()

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell title="Mal Çıkış" description="Üretime malzeme çıkışı — CONSUMPTION hareketi." kpis={[]}>
      <div className="p-4 pt-6 space-y-4">
        <Card>
          <CardContent className="pt-4 flex flex-wrap gap-2 items-end">
            <select className="flex h-9 rounded-md border px-2 text-sm" value={cardId} onChange={(e) => setCardId(e.target.value)}>
              {cards.slice(0, 20).map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
            <Input value={qty} onChange={(e) => setQty(e.target.value)} className="w-24" />
            <Button size="sm" disabled={issueMutation.isPending} onClick={() => issueMutation.mutate({
              stockCardId: cardId,
              warehouseCode: wh,
              quantity: Number(qty),
              referenceType: 'PRODUCTION',
              referenceId: 'prod-issue',
              referenceNo: 'UE-MANUAL',
              reason: 'Manuel mal çıkış',
              actorUserId: ACTOR,
            })}>Çıkış Yap</Button>
          </CardContent>
        </Card>
        <MovementTable data={data ?? []} searchPlaceholder="Çıkış hareketleri ara..." />
      </div>
    </ErpModuleShell>
  )
}

export function TransferPage() {
  const { data, isLoading } = useInventoryTransfers()
  const transferMutation = useTransferMutation()
  const whs = warehouseRepository.getActive()
  const cards = queryAllStockCards()
  const [from, setFrom] = useState(whs[0]?.code ?? '')
  const [to, setTo] = useState(whs[1]?.code ?? whs[0]?.code ?? '')
  const [cardId, setCardId] = useState(cards[0]?.id ?? '')

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell title="Depo Transferi" description="TRANSFER_OUT + TRANSFER_IN çift hareket." kpis={[]}>
      <div className="p-4 pt-6 space-y-4">
        <Card>
          <CardContent className="pt-4 flex flex-wrap gap-2">
            <select className="h-9 rounded-md border px-2 text-sm" value={cardId} onChange={(e) => setCardId(e.target.value)}>
              {cards.slice(0, 15).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
            <select className="h-9 rounded-md border px-2 text-sm" value={from} onChange={(e) => setFrom(e.target.value)}>
              {whs.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
            </select>
            <span className="self-center">→</span>
            <select className="h-9 rounded-md border px-2 text-sm" value={to} onChange={(e) => setTo(e.target.value)}>
              {whs.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
            </select>
            <Button size="sm" disabled={transferMutation.isPending} onClick={() => transferMutation.mutate({
              stockCardId: cardId,
              quantity: 5,
              fromWarehouseCode: from,
              toWarehouseCode: to,
              referenceId: `tr-${Date.now()}`,
              referenceNo: `TR-${Date.now()}`,
              reason: 'Depo transferi',
              actorUserId: ACTOR,
            })}>Transfer</Button>
          </CardContent>
        </Card>
        <MovementTable data={data ?? []} searchPlaceholder="Transfer hareketleri ara..." />
      </div>
    </ErpModuleShell>
  )
}

export function ReservationPage() {
  const { data, isLoading } = useInventoryReservations()
  const reserveMutation = useReservationMutation()
  const cards = queryAllStockCards()
  const [cardId, setCardId] = useState(cards[0]?.id ?? '')
  const wh = cards.find((c) => c.id === cardId)?.warehouseCode ?? defaultWarehouseCode()

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell title="Rezervasyon" description="Üretim emri için stok ayırma." kpis={[]}>
      <div className="p-4 pt-6 space-y-4">
        <Card>
          <CardContent className="pt-4 flex flex-wrap gap-2">
            <select className="h-9 rounded-md border px-2 text-sm" value={cardId} onChange={(e) => setCardId(e.target.value)}>
              {cards.slice(0, 15).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
            <Button size="sm" disabled={reserveMutation.isPending} onClick={() => reserveMutation.mutate({
              stockCardId: cardId,
              warehouseCode: wh,
              quantity: 10,
              referenceType: 'PRODUCTION',
              referenceId: 'po-reserve',
              referenceNo: 'UE-RESERVE',
              reason: 'Üretim rezervasyonu',
              actorUserId: ACTOR,
            })}>Rezerve Et</Button>
          </CardContent>
        </Card>
        <MovementTable data={data ?? []} searchPlaceholder="Rezervasyon hareketleri ara..." />
      </div>
    </ErpModuleShell>
  )
}

export function CycleCountPage() {
  const cycleMutation = useCycleCountMutation()
  const { data, isLoading } = useInventoryCycleCounts()
  const cards = queryAllStockCards()
  const [cardId, setCardId] = useState(cards[0]?.id ?? '')
  const [counted, setCounted] = useState('100')
  const wh = cards.find((c) => c.id === cardId)?.warehouseCode ?? defaultWarehouseCode()

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell title="Sayım" description="Cycle count → ADJUSTMENT hareketi." kpis={[]}>
      <div className="p-4 pt-6 space-y-4">
        <Card>
          <CardContent className="pt-4 flex flex-wrap gap-2">
            <select className="h-9 rounded-md border px-2 text-sm" value={cardId} onChange={(e) => setCardId(e.target.value)}>
              {cards.slice(0, 15).map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
            <Input value={counted} onChange={(e) => setCounted(e.target.value)} className="w-24" placeholder="Sayım" />
            <Button size="sm" disabled={cycleMutation.isPending} onClick={() => cycleMutation.mutate({
              stockCardId: cardId,
              warehouseCode: wh,
              countedQty: Number(counted),
              countNo: `CNT-${Date.now()}`,
              actorUserId: ACTOR,
            })}>Sayım Kaydet</Button>
          </CardContent>
        </Card>
        <MovementTable data={data ?? []} searchPlaceholder="Sayım düzeltmeleri ara..." />
      </div>
    </ErpModuleShell>
  )
}

export function InventoryHubPage() {
  return (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-2xl font-semibold">Envanter & Depo</h2>
        <p className="text-muted-foreground">Purchasing → GR → Inventory → Reservation → Production</p>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Dashboard</TabsTrigger>
          <TabsTrigger value="stock">Stok Sorgu</TabsTrigger>
          <TabsTrigger value="ledger">Ledger</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4"><InventoryDashboardPage /></TabsContent>
        <TabsContent value="stock" className="mt-4"><StockInquiryPage /></TabsContent>
        <TabsContent value="ledger" className="mt-4"><StockLedgerPage /></TabsContent>
      </Tabs>
    </div>
  )
}
