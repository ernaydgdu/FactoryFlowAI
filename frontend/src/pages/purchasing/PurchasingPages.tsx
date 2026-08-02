import { Link, useParams } from 'react-router-dom'

import { DataTable, ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  PURCHASE_ORDERS,
  PURCHASE_REQUISITIONS,
} from '@/domain/data/workflows'
import { useDataList } from '@/hooks/use-data-list'

const prStatusTone = {
  Açık: 'warning',
  'PO Oluşturuldu': 'success',
  İptal: 'muted',
} as const

const poStatusTone = {
  Açık: 'default',
  'Kısmi Teslim': 'warning',
  Tamamlandı: 'success',
  Gecikmiş: 'danger',
} as const

export function PurchasingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Satın Alma</h2>
        <p className="text-muted-foreground">
          MRP → Satın Alma Talebi → Satın Alma Siparişi iş akışı
        </p>
      </div>
      <Tabs defaultValue="pr">
        <TabsList>
          <TabsTrigger value="pr">Satın Alma Talepleri ({PURCHASE_REQUISITIONS.length})</TabsTrigger>
          <TabsTrigger value="po">Satın Alma Siparişleri ({PURCHASE_ORDERS.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pr" className="mt-4">
          <PurchaseRequisitionList />
        </TabsContent>
        <TabsContent value="po" className="mt-4">
          <PurchaseOrderList />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PurchaseRequisitionList() {
  const list = useDataList({
    data: PURCHASE_REQUISITIONS,
    searchFields: [
      (r) => r.prNo,
      (r) => r.orderNo,
      (r) => r.materialCode,
      (r) => r.materialName,
      (r) => r.suggestedSupplier,
    ],
    initialSort: { key: 'prNo', direction: 'desc' },
  })

  const open = PURCHASE_REQUISITIONS.filter((r) => r.status === 'Açık').length
  const converted = PURCHASE_REQUISITIONS.filter((r) => r.status === 'PO Oluşturuldu').length

  return (
    <ErpModuleShell
      title="Satın Alma Talepleri"
      description="MRP sonrası otomatik oluşan talepler — PO'ya dönüşüm bekliyor."
      kpis={[
        { label: 'Toplam PR', value: String(PURCHASE_REQUISITIONS.length), hint: 'MRP kaynaklı' },
        { label: 'Açık', value: String(open), hint: 'PO bekliyor' },
        { label: 'PO Oluşturuldu', value: String(converted), hint: 'Dönüştürüldü' },
        { label: 'Kumaş PR', value: String(PURCHASE_REQUISITIONS.filter((r) => r.category === 'Kumaş').length), hint: 'Kritik malzeme' },
      ]}
      toolbar={
        <ErpToolbar
          searchPlaceholder="PR no, sipariş, malzeme ara..."
          searchValue={list.search}
          onSearchChange={list.setSearch}
        />
      }
      pagination={{
        page: list.page,
        totalPages: list.totalPages,
        pageSize: list.pageSize,
        totalCount: list.totalCount,
        onPageChange: list.setPage,
        onPageSizeChange: list.setPageSize,
      }}
    >
      <div className="overflow-x-auto p-4 pt-6">
        <DataTable
          rowKey={(r) => r.id}
          data={list.paginated}
          columns={[
            { key: 'pr', header: 'PR No', render: (r) => <span className="font-medium">{r.prNo}</span> },
            { key: 'order', header: 'Sipariş', render: (r) => r.orderNo },
            { key: 'cat', header: 'Kategori', render: (r) => r.category },
            { key: 'mat', header: 'Malzeme', render: (r) => `${r.materialCode} — ${r.materialName}` },
            { key: 'qty', header: 'Miktar', render: (r) => `${r.quantity.toLocaleString('tr-TR')} ${r.unit}` },
            { key: 'supplier', header: 'Önerilen Tedarikçi', render: (r) => r.suggestedSupplier },
            { key: 'date', header: 'Termin', render: (r) => r.requiredDate },
            {
              key: 'status',
              header: 'Durum',
              render: (r) => <StatusBadge label={r.status} tone={prStatusTone[r.status]} />,
            },
            {
              key: 'action',
              header: '',
              render: (r) =>
                r.status === 'Açık' ? (
                  <Button size="sm" variant="outline">PO Oluştur</Button>
                ) : (
                  <span className="text-xs text-muted-foreground">PO bağlı</span>
                ),
            },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

function PurchaseOrderList() {
  const list = useDataList({
    data: PURCHASE_ORDERS,
    searchFields: [(r) => r.poNo, (r) => r.orderNo, (r) => r.supplier],
    initialSort: { key: 'poNo', direction: 'desc' },
  })

  const delayed = PURCHASE_ORDERS.filter((p) => p.status === 'Gecikmiş').length

  return (
    <ErpModuleShell
      title="Satın Alma Siparişleri"
      description="Tedarikçi, termin, teslim depo, fiyat ve lot takibi."
      kpis={[
        { label: 'Toplam PO', value: String(PURCHASE_ORDERS.length), hint: 'Aktif siparişler' },
        { label: 'Gecikmiş', value: String(delayed), hint: 'Termin aşımı' },
        { label: 'Kısmi Teslim', value: String(PURCHASE_ORDERS.filter((p) => p.status === 'Kısmi Teslim').length), hint: 'Devam eden' },
        { label: 'Tamamlandı', value: String(PURCHASE_ORDERS.filter((p) => p.status === 'Tamamlandı').length), hint: 'Kapandı' },
      ]}
      toolbar={
        <ErpToolbar
          searchPlaceholder="PO no, sipariş, tedarikçi ara..."
          searchValue={list.search}
          onSearchChange={list.setSearch}
        />
      }
      pagination={{
        page: list.page,
        totalPages: list.totalPages,
        pageSize: list.pageSize,
        totalCount: list.totalCount,
        onPageChange: list.setPage,
        onPageSizeChange: list.setPageSize,
      }}
    >
      <div className="overflow-x-auto p-4 pt-6">
        <DataTable
          rowKey={(r) => r.id}
          data={list.paginated}
          columns={[
            {
              key: 'po',
              header: 'PO No',
              render: (r) => (
                <Link to={`/purchasing/orders/${r.id}`} className="font-medium text-primary hover:underline">
                  {r.poNo}
                </Link>
              ),
            },
            { key: 'order', header: 'Sipariş', render: (r) => r.orderNo },
            { key: 'supplier', header: 'Tedarikçi', render: (r) => r.supplier },
            { key: 'termin', header: 'Termin', render: (r) => r.termin },
            { key: 'wh', header: 'Teslim Deposu', render: (r) => r.deliveryWarehouse },
            {
              key: 'amount',
              header: 'Tutar',
              render: (r) => `${r.totalAmount.toLocaleString('tr-TR')} ${r.currency}`,
            },
            {
              key: 'status',
              header: 'Durum',
              render: (r) => <StatusBadge label={r.status} tone={poStatusTone[r.status]} />,
            },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function PurchaseOrderDetailPage({ poId }: { poId: string }) {
  const po = PURCHASE_ORDERS.find((p) => p.id === poId)
  if (!po) return <p>PO bulunamadı</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{po.poNo}</h2>
          <p className="text-muted-foreground">
            {po.supplier} · {po.orderNo} · Termin {po.termin}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/purchasing">← Satın Alma</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Teslim Deposu</p><p className="font-medium">{po.deliveryWarehouse}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Para Birimi</p><p className="font-medium">{po.currency}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Toplam Tutar</p><p className="font-medium">{po.totalAmount.toLocaleString('tr-TR')} {po.currency}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Durum</p><StatusBadge label={po.status} tone={poStatusTone[po.status]} /></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">PO Satırları — Lot / Teslim / Kalan</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2">Malzeme</th>
                <th className="px-3 py-2">Miktar</th>
                <th className="px-3 py-2">Birim Fiyat</th>
                <th className="px-3 py-2">KDV %</th>
                <th className="px-3 py-2">Lot</th>
                <th className="px-3 py-2">Teslim Edilen</th>
                <th className="px-3 py-2">Kalan</th>
              </tr>
            </thead>
            <tbody>
              {po.lines.map((line) => (
                <tr key={line.id} className="border-b border-border/60">
                  <td className="px-3 py-2">{line.materialCode} — {line.materialName}</td>
                  <td className="px-3 py-2 tabular-nums">{line.quantity} {line.unit}</td>
                  <td className="px-3 py-2 tabular-nums">{line.unitPrice.toFixed(2)}</td>
                  <td className="px-3 py-2">{line.vatRate}%</td>
                  <td className="px-3 py-2">{line.lot ?? '—'}</td>
                  <td className="px-3 py-2 tabular-nums text-emerald-700">{line.deliveredQty}</td>
                  <td className="px-3 py-2 tabular-nums text-amber-700">{line.remainingQty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

export function PurchaseOrderDetailRoute() {
  const { poId } = useParams<{ poId: string }>()
  if (!poId) return null
  return <PurchaseOrderDetailPage poId={poId} />
}
