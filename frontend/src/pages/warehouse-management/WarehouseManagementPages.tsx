import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useProductionOrderLifecycleList } from '@/application/production-order-lifecycle/use-production-order-lifecycle'
import {
  useFinishedGoodsReceiptMutation,
  useFinishedGoodsWarehouseOptions,
  useWarehouseDetail,
} from '@/application/warehouse-management/use-warehouse-management'
import { DataTable, ErpModuleShell } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const ACTOR = 'pilot-user'

export function WarehouseDetailPage() {
  const { code = '' } = useParams<{ code: string }>()
  const { data: detail, isLoading } = useWarehouseDetail(code)

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!detail) {
    return (
      <ErpModuleShell title="Depo Bulunamadı" description={`${code} kodlu depo bulunamadı.`} kpis={[]}>
        <div className="p-8">
          <Button size="sm" variant="outline" asChild><Link to="/warehouse">Depo listesine dön</Link></Button>
        </div>
      </ErpModuleShell>
    )
  }

  const kpis = [
    { label: 'Kalem Sayısı', value: String(detail.itemCount), hint: 'Bakiyesi olan stok kartı' },
    { label: 'Fiziksel Stok', value: String(detail.totalOnHand), hint: 'Toplam onHand' },
    { label: 'Rezerve', value: String(detail.totalReserved), hint: 'Toplam rezerve' },
    { label: 'Serbest', value: String(detail.totalAvailable), hint: 'Toplam kullanılabilir' },
  ]

  return (
    <ErpModuleShell title={`Depo — ${detail.name}`} description={`${detail.code} · ${detail.type} · ${detail.location}`} kpis={kpis}>
      <div className="p-4 pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <Button size="sm" variant="outline" asChild><Link to="/warehouse">← Depo listesine dön</Link></Button>
          {detail.type === 'Mamül' && (
            <Button size="sm" asChild><Link to="/warehouse/fg-receipt">Mamül Kabul</Link></Button>
          )}
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Son Hareketler</CardTitle></CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={detail.recentMovements}
              columns={[
                { key: 'date', header: 'Tarih', render: (r) => r.date },
                { key: 'movementNo', header: 'Hareket No', render: (r) => r.movementNo },
                { key: 'type', header: 'Tip', render: (r) => r.type },
                { key: 'material', header: 'Malzeme', render: (r) => r.material },
                { key: 'qty', header: 'Miktar', render: (r) => `${r.qty} ${r.unit}` },
                { key: 'referenceNo', header: 'Referans', render: (r) => r.referenceNo },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function FinishedGoodsReceiptPage() {
  const { data: fgWarehouses } = useFinishedGoodsWarehouseOptions()
  const { data: productionOrders } = useProductionOrderLifecycleList()
  const receiptMutation = useFinishedGoodsReceiptMutation()

  const [warehouseCode, setWarehouseCode] = useState('')
  const [productionOrderNo, setProductionOrderNo] = useState('')
  const [qty, setQty] = useState('1')

  const wh = warehouseCode || fgWarehouses?.[0]?.code || ''
  const po = productionOrderNo || productionOrders?.[0]?.productionOrderNo || ''
  const poRow = productionOrders?.find((p) => p.productionOrderNo === po)

  return (
    <ErpModuleShell
      title="Mamül Kabul"
      description="Üretim çıktısını Mamül deposuna PRODUCTION_OUTPUT hareketi ile kaydeder."
      kpis={[]}
    >
      <div className="p-4 pt-6 space-y-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Yeni Mamül Kabul</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="text-xs text-muted-foreground">Üretim Emri (UE)</label>
              <select
                className="flex h-9 rounded-md border px-2 text-sm"
                value={po}
                onChange={(e) => setProductionOrderNo(e.target.value)}
              >
                <option value="">Seçin</option>
                {(productionOrders ?? []).map((p) => (
                  <option key={p.id} value={p.productionOrderNo}>
                    {p.productionOrderNo} — {p.productName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Mamül Deposu</label>
              <select
                className="flex h-9 rounded-md border px-2 text-sm"
                value={wh}
                onChange={(e) => setWarehouseCode(e.target.value)}
              >
                <option value="">Seçin</option>
                {(fgWarehouses ?? []).map((w) => (
                  <option key={w.code} value={w.code}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Miktar</label>
              <Input value={qty} onChange={(e) => setQty(e.target.value)} className="w-24" />
            </div>
            <Button
              size="sm"
              disabled={!wh || !po || Number(qty) <= 0 || receiptMutation.isPending}
              onClick={() =>
                receiptMutation.mutate({
                  productionOrderId: poRow?.id ?? po,
                  productionOrderNo: po,
                  warehouseCode: wh,
                  quantity: Number(qty),
                  actorUserId: ACTOR,
                })
              }
            >
              Kaydet
            </Button>
          </CardContent>
          {receiptMutation.isError && (
            <CardContent className="pt-0 text-sm text-destructive">
              {(receiptMutation.error as Error)?.message ?? 'Mamül kabul kaydedilemedi.'}
            </CardContent>
          )}
          {receiptMutation.isSuccess && (
            <CardContent className="pt-0 text-sm text-emerald-600">
              Mamül kabul kaydedildi: {receiptMutation.data?.entityNo}
            </CardContent>
          )}
        </Card>
      </div>
    </ErpModuleShell>
  )
}
