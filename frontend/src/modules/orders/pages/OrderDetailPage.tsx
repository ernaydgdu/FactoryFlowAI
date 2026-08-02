import { ArrowLeft, Pencil } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'

import { PageHeader, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getProductById } from '@/domain/data/products'
import { getSalesOrderById } from '@/domain/data/orders'
import { getSizeSetById } from '@/domain/data/size-sets'
import { getStockCardById } from '@/domain/data/stock-cards'

import { OrderProgressBar } from '../components/OrderProgressBar'
import { productionStatusTone } from '../constants'

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const order = id ? getSalesOrderById(id) : undefined

  if (!order) {
    return (
      <PageHeader
        title="Sipariş Bulunamadı"
        description="Kayıt mevcut değil."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/orders"><ArrowLeft className="size-4" /> Listeye Dön</Link>
          </Button>
        }
      />
    )
  }

  const product = getProductById(order.productCardId)!
  const sizeSet = getSizeSetById(order.sizeSetId)!
  const sizes = sizeSet.sizes
  const g = order.general
  const prod = order.production

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.orderNo}
        description={`${g.customer} · ${product.productName} · ${product.season} · ${order.matrixTotals.grandTotal.toLocaleString('tr-TR')} adet`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/orders"><ArrowLeft className="size-4" /> Geri</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/orders/${order.id}/edit`}><Pencil className="size-4" /> Düzenle</Link>
            </Button>
          </>
        }
      />

      {order.terminRisk ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Termin riski — EXF: {order.exfDate}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-card px-4 py-3">
        <Stat label="Toplam Adet" value={order.matrixTotals.grandTotal.toLocaleString('tr-TR')} />
        <Stat label="Üretim Emri" value={prod.workOrderNo} />
        <Stat label="Plan / Gerçek" value={`${prod.plannedQty} / ${prod.producedQty}`} />
        <Stat label="Fire" value={String(prod.wasteQty)} highlight={prod.wasteQty > 0} />
        <div>
          <p className="text-xs text-muted-foreground">İlerleme</p>
          <OrderProgressBar value={order.progress} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Durum</p>
          <StatusBadge label={order.productionStatus} tone={productionStatusTone[order.productionStatus]} />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="general">
            <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
              <TabsTrigger value="general">Genel</TabsTrigger>
              <TabsTrigger value="product">Ürün</TabsTrigger>
              <TabsTrigger value="matrix">Renk/Beden</TabsTrigger>
              <TabsTrigger value="bom">BOM</TabsTrigger>
              <TabsTrigger value="mrp">MRP</TabsTrigger>
              <TabsTrigger value="purchase">Satın Alma</TabsTrigger>
              <TabsTrigger value="warehouse">Depolar</TabsTrigger>
              <TabsTrigger value="production">Üretim</TabsTrigger>
              <TabsTrigger value="quality">Kalite</TabsTrigger>
              <TabsTrigger value="wash">Yıkama</TabsTrigger>
              <TabsTrigger value="packing">Paketleme</TabsTrigger>
              <TabsTrigger value="shipping">Sevkiyat</TabsTrigger>
              <TabsTrigger value="cost">Maliyet</TabsTrigger>
              <TabsTrigger value="docs">Dökümanlar</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Müşteri" value={g.customer} />
                <Field label="Marka" value={g.brand} />
                <Field label="Buyer" value={g.buyer} />
                <Field label="Merchandiser" value={g.merchandiser} />
                <Field label="PO No" value={g.poNo} />
                <Field label="PO Tarihi" value={g.poDate} />
                <Field label="Sipariş Tarihi" value={g.orderDate} />
                <Field label="EXF" value={order.exfDate} />
                <Field label="Teslim" value={g.deliveryTerm} />
                <Field label="Ödeme" value={g.paymentTerm} />
                <Field label="Fabrika" value={g.factory} />
                <Field label="Planlamacı" value={order.planner} />
                <Field label="Kumaş" value={order.fabricStatus} />
                <Field label="Aksesuar" value={order.accessoryStatus} />
              </dl>
            </TabsContent>

            <TabsContent value="product">
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Ürün Kodu" value={product.productCode} />
                <Field label="Müşteri Model" value={product.customerModelNo} />
                <Field label="İç Model" value={product.internalModelNo} />
                <Field label="Ürün Adı" value={product.productName} />
                <Field label="Grup / Alt Grup" value={`${product.productGroup} / ${product.subGroup}`} />
                <Field label="Cinsiyet / Yaş" value={`${product.gender} / ${product.ageGroup}`} />
                <Field label="Fit / Kalıp" value={`${product.fit} / ${product.pattern}`} />
                <Field label="Kumaş" value={product.fabricType} />
                <Field label="Kompozisyon" value={product.composition} />
                <Field label="Gramaj" value={product.weight} />
                <Field label="Yıkama / Baskı / Nakış" value={`${product.wash} / ${product.print} / ${product.embroidery}`} />
                <Field label="Beden Seti" value={sizeSet.name} />
                <Field label="Durum" value={product.status} />
              </dl>
              <Button variant="link" className="mt-4 px-0" asChild>
                <Link to={`/products/${product.id}`}>Ürün kartına git →</Link>
              </Button>
            </TabsContent>

            <TabsContent value="matrix">
              <MatrixTable product={product} sizes={sizes} matrix={order.matrix} totals={order.matrixTotals} />
            </TabsContent>

            <TabsContent value="bom">
              <BomTable bom={product.bom} />
            </TabsContent>

            <TabsContent value="mrp">
              <MrpPanel order={order} />
            </TabsContent>

            <TabsContent value="purchase">
              <PurchasePanel mrp={order.mrp.lines} />
            </TabsContent>

            <TabsContent value="warehouse">
              <WarehousePanel order={order} />
            </TabsContent>

            <TabsContent value="production">
              <ProductionPanel order={order} />
            </TabsContent>

            <TabsContent value="quality">
              <QualityPanel production={prod} />
            </TabsContent>

            <TabsContent value="wash">
              <PlaceholderPanel title="Yıkama Takibi" items={[
                { label: 'Yıkama Tipi', value: product.wash },
                { label: 'Durum', value: order.progress > 50 ? 'Tamamlandı' : 'Bekliyor' },
                { label: 'Atölye', value: 'Yıkama — Bursa' },
              ]} />
            </TabsContent>

            <TabsContent value="packing">
              <PlaceholderPanel title="Paketleme" items={[
                { label: 'Poşet', value: `${order.matrixTotals.grandTotal} adet` },
                { label: 'Askı', value: product.productGroup.includes('Dış') ? `${order.matrixTotals.grandTotal} adet` : '—' },
                { label: 'Koli Planı', value: `${Math.ceil(order.matrixTotals.grandTotal / 48)} koli` },
              ]} />
            </TabsContent>

            <TabsContent value="shipping">
              <PlaceholderPanel title="Sevkiyat" items={[
                { label: 'EXF', value: order.exfDate },
                { label: 'Durum', value: order.productionStatus === 'Sevk Edildi' ? 'Sevk Edildi' : 'Hazırlanıyor' },
                { label: 'Konteyner', value: '—' },
              ]} />
            </TabsContent>

            <TabsContent value="cost">
              <CostPanel orderQty={order.matrixTotals.grandTotal} mrp={order.mrp.lines} />
            </TabsContent>

            <TabsContent value="docs">
              <p className="text-sm text-muted-foreground">
                Teknik föy, fit onay, renk onay — mock döküman listesi.
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                <li className="rounded border border-border px-3 py-2">Teknik_Föy_{product.internalModelNo}.pdf</li>
                <li className="rounded border border-border px-3 py-2">Fit_Onay_{product.season}.pdf</li>
                <li className="rounded border border-border px-3 py-2">Renk_Onay_{product.colors[0]?.name}.pdf</li>
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${highlight ? 'text-amber-600' : ''}`}>{value}</p>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  )
}

function MatrixTable({
  product,
  sizes,
  matrix,
  totals,
}: {
  product: ReturnType<typeof getProductById>
  sizes: string[]
  matrix: Record<string, Record<string, number>>
  totals: { byColor: Record<string, number>; bySize: Record<string, number>; grandTotal: number }
}) {
  if (!product) return null
  const colors = product.colors.filter((c) => c.active)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
            <th className="px-3 py-2 text-left">Renk</th>
            {sizes.map((s) => (
              <th key={s} className="px-3 py-2 text-center">{s}</th>
            ))}
            <th className="px-3 py-2 text-right">Toplam</th>
          </tr>
        </thead>
        <tbody>
          {colors.map((c) => (
            <tr key={c.id} className="border-b border-border/60">
              <td className="px-3 py-2 font-medium">{c.name}</td>
              {sizes.map((s) => (
                <td key={s} className="px-3 py-2 text-center tabular-nums">
                  {(matrix[c.id]?.[s] ?? 0).toLocaleString('tr-TR')}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-medium tabular-nums">
                {(totals.byColor[c.id] ?? 0).toLocaleString('tr-TR')}
              </td>
            </tr>
          ))}
          <tr className="bg-muted/30 font-medium">
            <td className="px-3 py-2">Toplam</td>
            {sizes.map((s) => (
              <td key={s} className="px-3 py-2 text-center tabular-nums">
                {(totals.bySize[s] ?? 0).toLocaleString('tr-TR')}
              </td>
            ))}
            <td className="px-3 py-2 text-right tabular-nums text-primary">
              {totals.grandTotal.toLocaleString('tr-TR')}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function BomTable({ bom }: { bom: import('@/domain/types').BomLine[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2">Kategori</th>
            <th className="px-3 py-2">Kod</th>
            <th className="px-3 py-2">Malzeme</th>
            <th className="px-3 py-2">Depo</th>
            <th className="px-3 py-2">Birim</th>
            <th className="px-3 py-2">Sarfiyat</th>
            <th className="px-3 py-2">Fire %</th>
            <th className="px-3 py-2">Gerçek Sarf.</th>
            <th className="px-3 py-2">Tedarikçi</th>
            <th className="px-3 py-2">Lead Time</th>
          </tr>
        </thead>
        <tbody>
          {bom.map((line) => {
            const card = getStockCardById(line.stockCardId)
            if (!card) return null
            return (
              <tr key={line.id} className="border-b border-border/60">
                <td className="px-3 py-2">{card.category}</td>
                <td className="px-3 py-2 font-mono text-xs">{card.code}</td>
                <td className="px-3 py-2">{card.name}</td>
                <td className="px-3 py-2">{card.warehouseName}</td>
                <td className="px-3 py-2">{card.unit}</td>
                <td className="px-3 py-2 tabular-nums">{line.consumption}</td>
                <td className="px-3 py-2 tabular-nums">{line.wastePercent}%</td>
                <td className="px-3 py-2 tabular-nums">{line.actualConsumption}</td>
                <td className="px-3 py-2">{card.supplier}</td>
                <td className="px-3 py-2">{card.leadTimeDays} gün</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MrpPanel({ order }: { order: NonNullable<ReturnType<typeof getSalesOrderById>> }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        MRP — {order.mrp.orderQty.toLocaleString('tr-TR')} adet sipariş için otomatik malzeme ihtiyaç planı
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2">Malzeme</th>
              <th className="px-3 py-2">Kategori</th>
              <th className="px-3 py-2">Depo</th>
              <th className="px-3 py-2">Birim Sarf.</th>
              <th className="px-3 py-2">Fire</th>
              <th className="px-3 py-2 text-right">Brüt İhtiyaç</th>
              <th className="px-3 py-2 text-right">Net İhtiyaç</th>
              <th className="px-3 py-2">Tedarikçi</th>
              <th className="px-3 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {order.mrp.lines.map((line) => (
              <tr key={line.id} className="border-b border-border/60">
                <td className="px-3 py-2 font-medium">{line.materialName}</td>
                <td className="px-3 py-2">{line.category}</td>
                <td className="px-3 py-2">{line.warehouse}</td>
                <td className="px-3 py-2 tabular-nums">{line.consumptionPerUnit} {line.unit}</td>
                <td className="px-3 py-2 tabular-nums">{line.wastePercent}%</td>
                <td className="px-3 py-2 text-right tabular-nums">{line.grossRequired.toLocaleString('tr-TR')}</td>
                <td className="px-3 py-2 text-right font-medium tabular-nums text-primary">
                  {line.netRequired.toLocaleString('tr-TR')} {line.unit}
                </td>
                <td className="px-3 py-2">{line.supplier}</td>
                <td className="px-3 py-2">
                  <StatusBadge label={line.status} tone="default" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PurchasePanel({ mrp }: { mrp: import('@/domain/types').MrpLine[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2">Malzeme</th>
            <th className="px-3 py-2">Miktar</th>
            <th className="px-3 py-2">Tedarikçi</th>
            <th className="px-3 py-2">Lead Time</th>
            <th className="px-3 py-2">PO Durumu</th>
          </tr>
        </thead>
        <tbody>
          {mrp.map((line) => (
            <tr key={line.id} className="border-b border-border/60">
              <td className="px-3 py-2">{line.materialName}</td>
              <td className="px-3 py-2 tabular-nums">{line.netRequired.toLocaleString('tr-TR')} {line.unit}</td>
              <td className="px-3 py-2">{line.supplier}</td>
              <td className="px-3 py-2">{line.leadTimeDays} gün</td>
              <td className="px-3 py-2">
                <StatusBadge
                  label={line.status === 'Hesaplandı' ? 'PO Bekliyor' : line.status}
                  tone={line.status === 'Karşılandı' ? 'success' : 'muted'}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WarehousePanel({ order }: { order: NonNullable<ReturnType<typeof getSalesOrderById>> }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">BOM rezervasyonu ve üretim sarfiyatı — depo bazlı</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2">Malzeme</th>
            <th className="px-3 py-2">Kaynak Depo</th>
            <th className="px-3 py-2">Tüketilen</th>
            <th className="px-3 py-2">Fason Depoda Kalan</th>
          </tr>
        </thead>
        <tbody>
          {order.consumptions.map((c) => (
            <tr key={c.stockCardId} className="border-b border-border/60">
              <td className="px-3 py-2">{c.materialName}</td>
              <td className="px-3 py-2">{c.warehouse}</td>
              <td className="px-3 py-2 tabular-nums">{c.totalConsumed.toLocaleString('tr-TR')} {c.unit}</td>
              <td className="px-3 py-2 tabular-nums">{c.remainingInWorkshop.toLocaleString('tr-TR')} {c.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProductionPanel({
  order,
}: {
  order: NonNullable<ReturnType<typeof getSalesOrderById>>
}) {
  const p = order.production
  return (
    <div className="space-y-4">
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Üretim Emri" value={p.workOrderNo} />
        <Field label="Plan Adet" value={String(p.plannedQty)} />
        <Field label="Gerçekleşen" value={String(p.producedQty)} />
        <Field label="Fire" value={String(p.wasteQty)} />
        <Field label="Rework" value={String(p.reworkQty)} />
        <Field label="2. Kalite" value={String(p.secondQualityQty)} />
        <Field label="BOM Rezerve" value={p.bomReserved ? 'Evet' : 'Hayır'} />
        <Field label="Durum" value={p.status} />
      </dl>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sarfiyat Özeti — {p.producedQty} adet üretim</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {order.consumptions.slice(0, 4).map((c) => (
              <li key={c.stockCardId}>
                {c.materialName}: {c.consumptionPerUnit} {c.unit}/adet × {p.producedQty} ={' '}
                <span className="font-medium text-primary">{c.totalConsumed} {c.unit}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function QualityPanel({ production }: { production: import('@/domain/types').ProductionOrderLink }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Inline QC" value={production.producedQty > 0 ? 'Devam Ediyor' : 'Bekliyor'} />
      <Field label="Final Inspection" value={production.progress >= 90 ? 'Tamamlandı' : 'Bekliyor'} />
      <Field label="Fire" value={String(production.wasteQty)} />
      <Field label="Rework" value={String(production.reworkQty)} />
      <Field label="2. Kalite" value={String(production.secondQualityQty)} />
      <Field label="AQL Sonuç" value={production.progress >= 90 ? 'Pass' : '—'} />
    </dl>
  )
}

function CostPanel({
  orderQty,
  mrp,
}: {
  orderQty: number
  mrp: import('@/domain/types').MrpLine[]
}) {
  const fabric = mrp.find((l) => l.category === 'Kumaş')
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Sipariş Adedi" value={orderQty.toLocaleString('tr-TR')} />
      <Field label="Kumaş İhtiyacı" value={fabric ? `${fabric.netRequired} ${fabric.unit}` : '—'} />
      <Field label="CM (mock)" value="$4.20/adet" />
      <Field label="Malzeme Maliyeti (mock)" value="$12.800" />
      <Field label="Toplam Maliyet (mock)" value={`$${(orderQty * 4.2 + 12800).toLocaleString('tr-TR')}`} />
      <Field label="Kârlılık (mock)" value="%18,4" />
    </dl>
  )
}

function PlaceholderPanel({
  title,
  items,
}: {
  title: string
  items: { label: string; value: string }[]
}) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-medium">{title}</h4>
      <dl className="grid gap-3 sm:grid-cols-2">
        {items.map((i) => (
          <Field key={i.label} label={i.label} value={i.value} />
        ))}
      </dl>
    </div>
  )
}
