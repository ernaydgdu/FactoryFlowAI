import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { PageHeader, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrderProgressBar } from '@/modules/orders/components/OrderProgressBar'
import {
  useProductionOrderBrainInsight,
  useProductionOrderLifecycleDetail,
  useProductionOrderTwinSimulation,
  useTransitionProductionOrder,
} from '@/application/production-order-lifecycle/use-production-order-lifecycle'
import { LIFECYCLE_STATUS_ACTION_LABELS } from '@/application/production-order-lifecycle/production-order-lifecycle.dto'
import type { ProductionOrderLifecycleStatus } from '@/application/production-order-lifecycle/production-order-lifecycle.dto'

function Field({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

export function ProductionOrderLifecycleDetailPage() {
  const { productionOrderNo = '' } = useParams<{ productionOrderNo: string }>()
  const { data: order, isLoading, error } = useProductionOrderLifecycleDetail(productionOrderNo)
  const { data: brain } = useProductionOrderBrainInsight(productionOrderNo)
  const [runTwin, setRunTwin] = useState(false)
  const { data: twin } = useProductionOrderTwinSimulation(productionOrderNo, runTwin)
  const transition = useTransitionProductionOrder()

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!order) {
    return (
      <PageHeader
        title="Üretim Emri Bulunamadı"
        description={error?.message ?? 'Kayıt mevcut değil.'}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/production-order-lifecycle/orders">
              <ArrowLeft className="size-4" /> Listeye Dön
            </Link>
          </Button>
        }
      />
    )
  }

  const handleTransition = (toStatus: ProductionOrderLifecycleStatus) => {
    transition.mutate({ productionOrderNo: order.productionOrderNo, toStatus, actor: 'planner' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.productionOrderNo}
        description={`${order.salesOrderNo} · ${order.productName} · ${order.customer}`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/production-order-lifecycle/orders">
              <ArrowLeft className="size-4" /> Geri
            </Link>
          </Button>
        }
      />

      {order.terminRisk ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Termin riski — planlanan bitiş: {order.plannedFinish}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-card px-4 py-3">
        <Field label="Plan / Gerçek" value={`${order.plannedQty} / ${order.producedQty}`} />
        <Field label="Kalan" value={order.remainingQty} />
        <Field label="Fire" value={order.fireQty} />
        <Field label="Rework" value={order.reworkQty} />
        <Field label="Revizyon" value={order.revision} />
        <Field label="Öncelik" value={order.priority} />
        <div>
          <p className="text-xs text-muted-foreground">İlerleme</p>
          <OrderProgressBar value={order.progress} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Durum</p>
          <StatusBadge label={order.status.label} tone={order.status.tone} />
        </div>
      </div>

      {order.allowedTransitions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {order.allowedTransitions.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === 'Cancelled' ? 'destructive' : 'outline'}
              disabled={transition.isPending}
              onClick={() => handleTransition(s)}
            >
              {LIFECYCLE_STATUS_ACTION_LABELS[s]}
            </Button>
          ))}
        </div>
      ) : null}

      {transition.isError ? (
        <p className="text-sm text-destructive">{(transition.error as Error).message}</p>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="general">
            <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
              <TabsTrigger value="general">Genel</TabsTrigger>
              <TabsTrigger value="product">Ürün</TabsTrigger>
              <TabsTrigger value="operations">Operasyonlar</TabsTrigger>
              <TabsTrigger value="daily">Günlük Üretim</TabsTrigger>
              <TabsTrigger value="fire">Fire</TabsTrigger>
              <TabsTrigger value="rework">Rework</TabsTrigger>
              <TabsTrigger value="quality">Kalite</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="docs">Dokümanlar</TabsTrigger>
              <TabsTrigger value="comments">Yorumlar</TabsTrigger>
              <TabsTrigger value="brain">Brain Analizi</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="UE No" value={order.productionOrderNo} />
                <Field label="Sipariş" value={order.salesOrderNo} />
                <Field label="Müşteri" value={order.customer} />
                <Field label="Buyer" value={order.buyer} />
                <Field label="Atölye" value={order.workshop} />
                <Field label="Hat" value={order.line} />
                <Field label="Başlangıç" value={order.startDate} />
                <Field label="Plan Bitiş" value={order.plannedFinish} />
                <Field label="Gerçek Bitiş" value={order.actualFinish} />
                <Field label="Rezervasyon" value={order.reservationApplied ? 'Uygulandı (BR-03)' : 'Bekliyor'} />
                <Field label="Mamül Deposu" value={order.finishedGoodsReady ? 'Hazır (BR-08)' : 'Bekliyor'} />
              </dl>
            </TabsContent>

            <TabsContent value="product">
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Ürün Kodu" value={order.productCode} />
                <Field label="Ürün Adı" value={order.productName} />
                <Field label="Plan Adet" value={order.plannedQty} />
              </dl>
              <p className="mt-4 text-sm font-medium">BOM Snapshot (rev {order.snapshots.revision})</p>
              <table className="mt-2 w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2">Kod</th>
                    <th>Malzeme</th>
                    <th>Tüketim</th>
                    <th>Birim</th>
                  </tr>
                </thead>
                <tbody>
                  {order.snapshots.bom.map((b) => (
                    <tr key={b.code} className="border-b">
                      <td className="py-2">{b.code}</td>
                      <td>{b.name}</td>
                      <td>{b.consumption}</td>
                      <td>{b.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabsContent>

            <TabsContent value="operations">
              <p className="mb-2 text-sm text-muted-foreground">
                Operasyon Route Snapshot — {order.snapshots.capturedAt.slice(0, 10)}
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2">Sıra</th>
                    <th>Kod</th>
                    <th>Operasyon</th>
                    <th>Atölye</th>
                  </tr>
                </thead>
                <tbody>
                  {order.snapshots.operationRoute.map((op) => (
                    <tr key={op.sequence} className="border-b">
                      <td className="py-2">{op.sequence}</td>
                      <td>{op.code}</td>
                      <td>{op.name}</td>
                      <td>{op.workshopCode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabsContent>

            <TabsContent value="daily">
              <p className="mb-2 text-sm">
                <Link className="text-primary hover:underline" to="/production-order-lifecycle/daily-entry">
                  Günlük giriş ekranına git →
                </Link>
              </p>
              <Field label="Toplam Üretilen" value={order.producedQty} />
            </TabsContent>

            <TabsContent value="fire">
              <Field label="Fire Adet" value={order.fireQty} />
              <Field label="Red Adet" value={order.rejectQty} />
            </TabsContent>

            <TabsContent value="rework">
              <Field label="Rework Adet" value={order.reworkQty} />
            </TabsContent>

            <TabsContent value="quality">
              <Field label="2. Kalite" value={order.secondQualityQty} />
              <Field label="Red" value={order.rejectQty} />
            </TabsContent>

            <TabsContent value="timeline">
              <ul className="space-y-3">
                {order.auditTrail.map((t) => (
                  <li key={t.id} className="rounded border px-3 py-2 text-sm">
                    <span className="text-muted-foreground">{t.occurredAt.slice(0, 16).replace('T', ' ')}</span>
                    <span className="mx-2">·</span>
                    <span className="font-medium">{t.actor}</span>
                    <p className="mt-1">{t.action}</p>
                  </li>
                ))}
              </ul>
            </TabsContent>

            <TabsContent value="docs">
              <p className="text-sm text-muted-foreground">Doküman modülü entegrasyonu hazır — ekler burada listelenecek.</p>
            </TabsContent>

            <TabsContent value="comments">
              <p className="text-sm text-muted-foreground">Yorumlar — platform watcher ile senkronize edilebilir.</p>
            </TabsContent>

            <TabsContent value="brain">
              {brain ? (
                <dl className="grid gap-4 sm:grid-cols-2">
                  <Field label="Neden gecikiyor?" value={brain.whyDelayed} />
                  <Field label="En büyük darboğaz" value={brain.biggestBottleneck} />
                  <Field label="Bekleyen operasyon" value={brain.waitingOperation} />
                  <Field label="Kapasite yeterli mi?" value={brain.capacitySufficient ? 'Evet' : 'Hayır'} />
                  <Field label="Termin riski" value={brain.terminRisk ? 'Var' : 'Yok'} />
                  <Field label="En uygun atölye" value={brain.bestWorkshop} />
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">Brain analizi yükleniyor…</p>
              )}
              <div className="mt-4 space-y-2">
                <Button size="sm" variant="outline" onClick={() => setRunTwin(true)}>
                  Digital Twin Simülasyonu (sideEffects = NONE)
                </Button>
                {twin ? (
                  <div className="rounded border p-3 text-sm">
                    <p className="font-medium">{twin.summary}</p>
                    <p className="text-muted-foreground">Senaryo: {twin.scenarioId} · Etki: {twin.impactScore}</p>
                  </div>
                ) : null}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="mb-2 text-sm font-medium">Cost & Planning Snapshot</p>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Toplam Maliyet" value={`${order.snapshots.cost.total} ${order.snapshots.cost.currency}`} />
            <Field label="Termin Risk Skoru" value={order.snapshots.planning.terminRiskScore} />
            <Field label="Kapasite Kullanımı" value={`%${order.snapshots.planning.capacityUtilization}`} />
            <Field label="Plan Başlangıç" value={order.snapshots.planning.plannedStart} />
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
