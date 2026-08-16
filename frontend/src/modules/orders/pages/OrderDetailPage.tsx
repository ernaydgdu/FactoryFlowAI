import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader, QualityRateCard, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { SIZE_PRESETS } from '@/modules/core/data/master-data'
import {
  createMaterial,
  createProductionEntry,
  createQualityEntry,
  deleteColorSize,
  fetchAiSuggestion,
  fetchColorSizes,
  fetchMaterials,
  fetchOrderById,
  fetchProductionEntries,
  fetchQualityEntries,
  updateMaterialStatus,
  upsertColorSize,
  type ApiMaterial,
  type ApiOrderColorSize,
  type ApiProductionEntry,
  type ApiQualityEntry,
  type CreateMaterialInput,
  type CreateProductionEntryInput,
  type CreateQualityEntryInput,
  type MaterialStatusValue,
  type ProductionStage,
} from '@/infrastructure/api/orders-api.repository'

import { OrderProgressBar } from '../components/OrderProgressBar'

const ORDER_STATUS_LABEL: Record<string, string> = {
  PLANNING: 'Beklemede',
  IN_PRODUCTION: 'Üretimde',
  COMPLETED: 'Tamamlandı',
  SHIPPED: 'Sevk Edildi',
}

const MATERIAL_STATUS_OPTIONS: MaterialStatusValue[] = ['PENDING', 'ARRIVED', 'PARTIAL']

const MATERIAL_STATUS_LABEL: Record<MaterialStatusValue, string> = {
  PENDING: 'Bekliyor',
  ARRIVED: 'Geldi',
  PARTIAL: 'Kısmi',
}

const MATERIAL_STATUS_TONE: Record<MaterialStatusValue, 'muted' | 'success' | 'warning'> = {
  PENDING: 'muted',
  ARRIVED: 'success',
  PARTIAL: 'warning',
}

const PRODUCTION_STAGES: ProductionStage[] = ['CUTTING', 'SEWING', 'IRONING', 'PACKING', 'SHIPPING']

const STAGE_LABEL: Record<ProductionStage, string> = {
  CUTTING: 'Kesim',
  SEWING: 'Dikim',
  IRONING: 'Ütü',
  PACKING: 'Paket',
  SHIPPING: 'Sevkiyat',
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function dateOnly(value: string): number {
  const d = new Date(value)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function computeLateDays(expectedArrival: string | null, exfDate: string): number {
  if (!expectedArrival) return 0
  const diffDays = Math.round((dateOnly(expectedArrival) - dateOnly(exfDate)) / 86_400_000)
  return diffDays > 0 ? diffDays : 0
}

export function OrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>()

  const orderQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.detail(id),
    queryFn: () => fetchOrderById(id),
    enabled: !!id,
  })

  if (orderQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Yükleniyor...</p>
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <PageHeader
        title="Sipariş Bulunamadı"
        description="Kayıt mevcut değil."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/orders">
              <ArrowLeft className="size-4" /> Listeye Dön
            </Link>
          </Button>
        }
      />
    )
  }

  const order = orderQuery.data

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.orderNo}
        description={`${order.buyerName} · ${order.productName} · ${order.totalQuantity.toLocaleString('tr-TR')} adet`}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/orders">
              <ArrowLeft className="size-4" /> Geri
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="general">
            <TabsList className="mb-4">
              <TabsTrigger value="general">Genel</TabsTrigger>
              <TabsTrigger value="purchase">Satın Alma</TabsTrigger>
              <TabsTrigger value="production">Üretim</TabsTrigger>
              <TabsTrigger value="quality">Kalite</TabsTrigger>
              <TabsTrigger value="color-sizes">Renk/Beden</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <div className="space-y-4">
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Müşteri" value={order.buyerName} />
                  <Field label="Ürün" value={order.productName} />
                  <Field label="Toplam Miktar" value={order.totalQuantity.toLocaleString('tr-TR')} />
                  <Field label="EXF Tarihi" value={formatDate(order.shipmentDate)} />
                  <Field label="Durum" value={ORDER_STATUS_LABEL[order.status] ?? order.status} />
                  <Field label="Oluşturulma" value={formatDate(order.createdAt)} />
                </dl>

                <OrderAiSuggestionCard orderId={id} />
              </div>
            </TabsContent>

            <TabsContent value="purchase">
              <MaterialsPanel orderId={id} exfDate={order.shipmentDate} />
            </TabsContent>

            <TabsContent value="production">
              <ProductionPanel orderId={id} totalQuantity={order.totalQuantity} />
            </TabsContent>

            <TabsContent value="quality">
              <QualityPanel orderId={id} />
            </TabsContent>

            <TabsContent value="color-sizes">
              <ColorSizePanel orderId={id} totalQuantity={order.totalQuantity} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
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

function OrderAiSuggestionCard({ orderId }: { orderId: string }) {
  const suggestionQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.aiSuggestion(orderId),
    queryFn: () => fetchAiSuggestion(orderId),
    enabled: !!orderId,
  })

  const suggestion = suggestionQuery.data
  if (!suggestion || suggestion.productType === null) {
    return null
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        <Sparkles className="size-4" /> AI Önerisi
      </p>
      {suggestion.warning ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400">
          ⚠️ {suggestion.warning}
        </div>
      ) : (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          ✓ Kumaş miktarı yeterli görünüyor
        </div>
      )}
    </div>
  )
}

type MaterialFormState = {
  materialName: string
  materialType: string
  supplierName: string
  orderedQuantity: string
  expectedArrival: string
  fabricWidth: string
  fabricWeight: string
  unitPrice: string
  currency: string
}

const INITIAL_MATERIAL_FORM: MaterialFormState = {
  materialName: '',
  materialType: '',
  supplierName: '',
  orderedQuantity: '',
  expectedArrival: '',
  fabricWidth: '',
  fabricWeight: '',
  unitPrice: '',
  currency: 'USD',
}

function MaterialsPanel({ orderId, exfDate }: { orderId: string; exfDate: string }) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<MaterialFormState>(INITIAL_MATERIAL_FORM)
  const [error, setError] = useState<string | null>(null)

  const materialsQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.materials(orderId),
    queryFn: () => fetchMaterials(orderId),
    enabled: !!orderId,
  })

  function invalidateMaterials() {
    return queryClient.invalidateQueries({
      queryKey: applicationQueryKeys.orderRecord.materials(orderId),
      refetchType: 'all',
    })
  }

  const addMutation = useMutation({
    mutationFn: (input: CreateMaterialInput) => createMaterial(orderId, input),
    onSuccess: invalidateMaterials,
  })

  const statusMutation = useMutation({
    mutationFn: ({ materialId, status }: { materialId: number; status: MaterialStatusValue }) =>
      updateMaterialStatus(orderId, materialId, status),
    onSuccess: invalidateMaterials,
  })

  function updateField(field: keyof MaterialFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleAddMaterial(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const orderedQuantity = Number(form.orderedQuantity)
    if (!form.materialName.trim() || !form.materialType.trim() || !form.supplierName.trim()) {
      setError('Malzeme adı, tipi ve tedarikçi zorunludur.')
      return
    }
    if (!form.orderedQuantity || Number.isNaN(orderedQuantity) || orderedQuantity <= 0) {
      setError('Sipariş miktarı geçerli bir sayı olmalıdır.')
      return
    }

    try {
      await addMutation.mutateAsync({
        materialName: form.materialName.trim(),
        materialType: form.materialType.trim(),
        supplierName: form.supplierName.trim(),
        orderedQuantity,
        expectedArrival: form.expectedArrival || undefined,
        fabricWidth: form.fabricWidth ? Number(form.fabricWidth) : undefined,
        fabricWeight: form.fabricWeight ? Number(form.fabricWeight) : undefined,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
        currency: form.currency.trim() || undefined,
      })
      setForm(INITIAL_MATERIAL_FORM)
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Malzeme eklenemedi.')
    }
  }

  const lateMaterialCount = (materialsQuery.data ?? []).filter(
    (m) => computeLateDays(m.expectedArrival, exfDate) > 0,
  ).length

  return (
    <div className="space-y-4">
      {lateMaterialCount > 0 ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
          ⚠️ Bu siparişte {lateMaterialCount} malzeme EXF tarihinden geç geliyor
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Siparişe ait kumaş/aksesuar malzemeleri</p>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4" /> Yeni Malzeme
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={handleAddMaterial}
          className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="materialName">Malzeme Adı</Label>
            <Input
              id="materialName"
              value={form.materialName}
              onChange={(e) => updateField('materialName', e.target.value)}
              placeholder="Pamuklu Kumaş"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="materialType">Tipi</Label>
            <Input
              id="materialType"
              value={form.materialType}
              onChange={(e) => updateField('materialType', e.target.value)}
              placeholder="Kumaş"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="supplierName">Tedarikçi</Label>
            <Input
              id="supplierName"
              value={form.supplierName}
              onChange={(e) => updateField('supplierName', e.target.value)}
              placeholder="Acme Tekstil"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="orderedQuantity">Sipariş Miktarı</Label>
            <Input
              id="orderedQuantity"
              type="number"
              min="1"
              value={form.orderedQuantity}
              onChange={(e) => updateField('orderedQuantity', e.target.value)}
              placeholder="500"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="expectedArrival">Beklenen Geliş</Label>
            <Input
              id="expectedArrival"
              type="date"
              value={form.expectedArrival}
              onChange={(e) => updateField('expectedArrival', e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fabricWidth">Kumaş Eni (cm)</Label>
            <Input
              id="fabricWidth"
              type="number"
              min="0"
              step="0.1"
              value={form.fabricWidth}
              onChange={(e) => updateField('fabricWidth', e.target.value)}
              placeholder="150"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fabricWeight">Gramaj (gr/m²)</Label>
            <Input
              id="fabricWeight"
              type="number"
              min="0"
              step="0.1"
              value={form.fabricWeight}
              onChange={(e) => updateField('fabricWeight', e.target.value)}
              placeholder="220"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="unitPrice">Birim Fiyat</Label>
            <Input
              id="unitPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.unitPrice}
              onChange={(e) => updateField('unitPrice', e.target.value)}
              placeholder="3.50"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="currency">Para Birimi</Label>
            <Input
              id="currency"
              value={form.currency}
              onChange={(e) => updateField('currency', e.target.value)}
              placeholder="USD"
            />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-5">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              İptal
            </Button>
            <Button type="submit" size="sm" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2">Malzeme</th>
              <th className="px-3 py-2">Tip</th>
              <th className="px-3 py-2">Tedarikçi</th>
              <th className="px-3 py-2">Sipariş Miktarı</th>
              <th className="px-3 py-2">Gelen Miktar</th>
              <th className="px-3 py-2">Beklenen Geliş</th>
              <th className="px-3 py-2">Kumaş Eni</th>
              <th className="px-3 py-2">Gramaj</th>
              <th className="px-3 py-2">Birim Fiyat</th>
              <th className="px-3 py-2">Para Birimi</th>
              <th className="px-3 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {materialsQuery.isLoading ? (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center text-muted-foreground">
                  Yükleniyor...
                </td>
              </tr>
            ) : materialsQuery.data && materialsQuery.data.length > 0 ? (
              materialsQuery.data.map((m) => (
                <MaterialRow
                  key={m.id}
                  material={m}
                  lateDays={computeLateDays(m.expectedArrival, exfDate)}
                  onStatusChange={(status) => statusMutation.mutate({ materialId: m.id, status })}
                  isUpdating={
                    statusMutation.isPending && statusMutation.variables?.materialId === m.id
                  }
                />
              ))
            ) : (
              <tr>
                <td colSpan={11} className="px-3 py-6 text-center text-muted-foreground">
                  Henüz malzeme eklenmedi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MaterialRow({
  material,
  lateDays,
  onStatusChange,
  isUpdating,
}: {
  material: ApiMaterial
  lateDays: number
  onStatusChange: (status: MaterialStatusValue) => void
  isUpdating: boolean
}) {
  const isLate = lateDays > 0

  return (
    <tr className={cn('border-b border-border/60', isLate && 'bg-destructive/5 text-destructive')}>
      <td className="px-3 py-2 font-medium">{material.materialName}</td>
      <td className="px-3 py-2">{material.materialType}</td>
      <td className="px-3 py-2">{material.supplierName}</td>
      <td className="px-3 py-2 tabular-nums">{material.orderedQuantity.toLocaleString('tr-TR')}</td>
      <td className="px-3 py-2 tabular-nums">{material.arrivedQuantity.toLocaleString('tr-TR')}</td>
      <td className="px-3 py-2">
        {formatDate(material.expectedArrival)}
        {isLate ? (
          <div className="mt-0.5 text-xs font-medium">
            ⚠️ EXF&apos;den {lateDays} gün sonra geliyor
          </div>
        ) : null}
      </td>
      <td className="px-3 py-2 tabular-nums">{material.fabricWidth != null ? `${material.fabricWidth} cm` : '—'}</td>
      <td className="px-3 py-2 tabular-nums">{material.fabricWeight != null ? `${material.fabricWeight} gr/m²` : '—'}</td>
      <td className="px-3 py-2 tabular-nums">
        {material.unitPrice != null ? material.unitPrice.toLocaleString('tr-TR') : '—'}
      </td>
      <td className="px-3 py-2">{material.currency ?? '—'}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <StatusBadge
            label={MATERIAL_STATUS_LABEL[material.status]}
            tone={MATERIAL_STATUS_TONE[material.status]}
          />
          <select
            className="h-7 rounded-md border border-input bg-transparent px-1.5 text-xs"
            value={material.status}
            disabled={isUpdating}
            onChange={(e) => onStatusChange(e.target.value as MaterialStatusValue)}
          >
            {MATERIAL_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {MATERIAL_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      </td>
    </tr>
  )
}

type ProductionFormState = {
  stage: ProductionStage
  quantity: string
  lineNo: string
  date: string
  notes: string
}

function initialProductionForm(): ProductionFormState {
  return {
    stage: 'CUTTING',
    quantity: '',
    lineNo: '',
    date: todayIso(),
    notes: '',
  }
}

function ProductionPanel({
  orderId,
  totalQuantity,
}: {
  orderId: string
  totalQuantity: number
}) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ProductionFormState>(initialProductionForm)
  const [error, setError] = useState<string | null>(null)

  const productionQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.production(orderId),
    queryFn: () => fetchProductionEntries(orderId),
    enabled: !!orderId,
  })

  const addMutation = useMutation({
    mutationFn: (input: CreateProductionEntryInput) => createProductionEntry(orderId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.orderRecord.production(orderId),
        refetchType: 'all',
      }),
  })

  function updateField(field: keyof ProductionFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleAddEntry(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const quantity = Number(form.quantity)
    if (!form.quantity || Number.isNaN(quantity) || quantity <= 0) {
      setError('Miktar geçerli bir sayı olmalıdır.')
      return
    }

    try {
      await addMutation.mutateAsync({
        stage: form.stage,
        quantity,
        date: form.date || undefined,
        lineNo: form.lineNo.trim() || undefined,
        notes: form.notes.trim() || undefined,
      })
      setForm(initialProductionForm())
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Üretim girişi eklenemedi.')
    }
  }

  const entries = productionQuery.data ?? []

  const stageTotals = PRODUCTION_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = entries
        .filter((e) => e.stage === stage)
        .reduce((sum, e) => sum + e.quantity, 0)
      return acc
    },
    {} as Record<ProductionStage, number>,
  )

  const shippedQuantity = stageTotals.SHIPPING
  const progressPercent =
    totalQuantity > 0 ? Math.round((shippedQuantity / totalQuantity) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Sevkiyat İlerlemesi</span>
          <span className="text-muted-foreground tabular-nums">
            {shippedQuantity.toLocaleString('tr-TR')} / {totalQuantity.toLocaleString('tr-TR')} adet
          </span>
        </div>
        <OrderProgressBar value={progressPercent} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {PRODUCTION_STAGES.map((stage) => (
          <div key={stage} className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">{STAGE_LABEL[stage]}</p>
            <p className="text-lg font-bold tabular-nums">
              {stageTotals[stage].toLocaleString('tr-TR')}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Siparişe ait üretim girişleri</p>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4" /> Yeni Üretim Girişi
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={handleAddEntry}
          className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="stage">Aşama</Label>
            <select
              id="stage"
              value={form.stage}
              onChange={(e) => updateField('stage', e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {PRODUCTION_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="quantity">Miktar</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => updateField('quantity', e.target.value)}
              placeholder="100"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lineNo">Hat No</Label>
            <Input
              id="lineNo"
              value={form.lineNo}
              onChange={(e) => updateField('lineNo', e.target.value)}
              placeholder="HAT-3"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="date">Tarih</Label>
            <Input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="notes">Notlar</Label>
            <Input
              id="notes"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="—"
            />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-5">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              İptal
            </Button>
            <Button type="submit" size="sm" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2">Aşama</th>
              <th className="px-3 py-2">Miktar</th>
              <th className="px-3 py-2">Hat No</th>
              <th className="px-3 py-2">Tarih</th>
              <th className="px-3 py-2">Notlar</th>
            </tr>
          </thead>
          <tbody>
            {productionQuery.isLoading ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Yükleniyor...
                </td>
              </tr>
            ) : entries.length > 0 ? (
              entries.map((entry) => <ProductionRow key={entry.id} entry={entry} />)
            ) : (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  Henüz üretim girişi eklenmedi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProductionRow({ entry }: { entry: ApiProductionEntry }) {
  return (
    <tr className="border-b border-border/60">
      <td className="px-3 py-2 font-medium">{STAGE_LABEL[entry.stage] ?? entry.stage}</td>
      <td className="px-3 py-2 tabular-nums">{entry.quantity.toLocaleString('tr-TR')}</td>
      <td className="px-3 py-2">{entry.lineNo ?? '—'}</td>
      <td className="px-3 py-2">{formatDate(entry.date)}</td>
      <td className="px-3 py-2">{entry.notes ?? '—'}</td>
    </tr>
  )
}

type QualityFormState = {
  checkedQty: string
  firstQuality: string
  secondQuality: string
  rejected: string
  defectType: string
  date: string
  notes: string
}

function initialQualityForm(): QualityFormState {
  return {
    checkedQty: '',
    firstQuality: '',
    secondQuality: '',
    rejected: '',
    defectType: '',
    date: todayIso(),
    notes: '',
  }
}

function QualityPanel({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<QualityFormState>(initialQualityForm)
  const [error, setError] = useState<string | null>(null)

  const qualityQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.quality(orderId),
    queryFn: () => fetchQualityEntries(orderId),
    enabled: !!orderId,
  })

  const addMutation = useMutation({
    mutationFn: (input: CreateQualityEntryInput) => createQualityEntry(orderId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.orderRecord.quality(orderId),
        refetchType: 'all',
      }),
  })

  function updateField(field: keyof QualityFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleAddEntry(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const checkedQty = Number(form.checkedQty)
    const firstQuality = Number(form.firstQuality)
    const secondQuality = Number(form.secondQuality)
    const rejected = Number(form.rejected)

    if (form.checkedQty === '' || Number.isNaN(checkedQty) || checkedQty <= 0) {
      setError('Kontrol edilen adet geçerli bir sayı olmalıdır.')
      return
    }
    if (
      form.firstQuality === '' ||
      form.secondQuality === '' ||
      form.rejected === '' ||
      Number.isNaN(firstQuality) ||
      Number.isNaN(secondQuality) ||
      Number.isNaN(rejected) ||
      firstQuality < 0 ||
      secondQuality < 0 ||
      rejected < 0
    ) {
      setError('1. kalite, 2. kalite ve ret adetleri geçerli (0 veya üzeri) sayılar olmalıdır.')
      return
    }
    if (firstQuality + secondQuality + rejected !== checkedQty) {
      setError(
        `1. kalite + 2. kalite + ret toplamı (${firstQuality + secondQuality + rejected}) kontrol edilen adede (${checkedQty}) eşit olmalı.`,
      )
      return
    }

    try {
      await addMutation.mutateAsync({
        checkedQty,
        firstQuality,
        secondQuality,
        rejected,
        defectType: form.defectType.trim() || undefined,
        date: form.date || undefined,
        notes: form.notes.trim() || undefined,
      })
      setForm(initialQualityForm())
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kalite girişi eklenemedi.')
    }
  }

  const entries = qualityQuery.data ?? []
  const totalChecked = entries.reduce((sum, e) => sum + e.checkedQty, 0)
  const totalSecondQuality = entries.reduce((sum, e) => sum + e.secondQuality, 0)
  const totalRejected = entries.reduce((sum, e) => sum + e.rejected, 0)
  const secondQualityRate = totalChecked > 0 ? (totalSecondQuality / totalChecked) * 100 : 0
  const rejectionRate = totalChecked > 0 ? (totalRejected / totalChecked) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <QualityRateCard
          label="2. Kalite Oranı"
          percent={secondQualityRate}
          hint="Kabul edilebilir aralık: %2-5"
        />
        <QualityRateCard
          label="Fire Oranı"
          percent={rejectionRate}
          hint="Kabul edilebilir aralık: %2-5"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Siparişe ait kalite kontrol girişleri</p>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4" /> Yeni Kalite Girişi
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={handleAddEntry}
          className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="checkedQty">Kontrol Edilen Adet</Label>
            <Input
              id="checkedQty"
              type="number"
              min="0"
              value={form.checkedQty}
              onChange={(e) => updateField('checkedQty', e.target.value)}
              placeholder="100"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="firstQuality">1. Kalite Adet</Label>
            <Input
              id="firstQuality"
              type="number"
              min="0"
              value={form.firstQuality}
              onChange={(e) => updateField('firstQuality', e.target.value)}
              placeholder="90"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="secondQuality">2. Kalite Adet</Label>
            <Input
              id="secondQuality"
              type="number"
              min="0"
              value={form.secondQuality}
              onChange={(e) => updateField('secondQuality', e.target.value)}
              placeholder="7"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="rejected">Ret Adet</Label>
            <Input
              id="rejected"
              type="number"
              min="0"
              value={form.rejected}
              onChange={(e) => updateField('rejected', e.target.value)}
              placeholder="3"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="defectType">Hata Türü</Label>
            <Input
              id="defectType"
              value={form.defectType}
              onChange={(e) => updateField('defectType', e.target.value)}
              placeholder="Dikiş hatası"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="qualityDate">Tarih</Label>
            <Input
              id="qualityDate"
              type="date"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="qualityNotes">Notlar</Label>
            <Input
              id="qualityNotes"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="—"
            />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              İptal
            </Button>
            <Button type="submit" size="sm" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2">Kontrol Edilen</th>
              <th className="px-3 py-2">1. Kalite</th>
              <th className="px-3 py-2">2. Kalite</th>
              <th className="px-3 py-2">Ret</th>
              <th className="px-3 py-2">Hata Türü</th>
              <th className="px-3 py-2">Tarih</th>
              <th className="px-3 py-2">Notlar</th>
            </tr>
          </thead>
          <tbody>
            {qualityQuery.isLoading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Yükleniyor...
                </td>
              </tr>
            ) : entries.length > 0 ? (
              entries.map((entry) => <QualityRow key={entry.id} entry={entry} />)
            ) : (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                  Henüz kalite girişi eklenmedi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function QualityRow({ entry }: { entry: ApiQualityEntry }) {
  return (
    <tr className="border-b border-border/60">
      <td className="px-3 py-2 tabular-nums">{entry.checkedQty.toLocaleString('tr-TR')}</td>
      <td className="px-3 py-2 tabular-nums">{entry.firstQuality.toLocaleString('tr-TR')}</td>
      <td className="px-3 py-2 tabular-nums">{entry.secondQuality.toLocaleString('tr-TR')}</td>
      <td className="px-3 py-2 tabular-nums">{entry.rejected.toLocaleString('tr-TR')}</td>
      <td className="px-3 py-2">{entry.defectType ?? '—'}</td>
      <td className="px-3 py-2">{formatDate(entry.date)}</td>
      <td className="px-3 py-2">{entry.notes ?? '—'}</td>
    </tr>
  )
}

type ColorSizeFormState = {
  color: string
  size: string
  quantity: string
}

const INITIAL_COLOR_SIZE_FORM: ColorSizeFormState = {
  color: '',
  size: '',
  quantity: '',
}

const LETTER_SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '4XL']

function sortSizes(sizes: string[]): string[] {
  const unique = Array.from(new Set(sizes))
  const allLetter = unique.every((s) => LETTER_SIZE_ORDER.includes(s.toUpperCase()))
  if (allLetter) {
    return unique.sort(
      (a, b) => LETTER_SIZE_ORDER.indexOf(a.toUpperCase()) - LETTER_SIZE_ORDER.indexOf(b.toUpperCase()),
    )
  }
  const allNumeric = unique.every((s) => !Number.isNaN(Number(s)))
  if (allNumeric) {
    return unique.sort((a, b) => Number(a) - Number(b))
  }
  return unique.sort((a, b) => a.localeCompare(b, 'tr-TR'))
}

function ColorSizePanel({ orderId, totalQuantity }: { orderId: string; totalQuantity: number }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ColorSizeFormState>(INITIAL_COLOR_SIZE_FORM)
  const [error, setError] = useState<string | null>(null)

  const colorSizesQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.colorSizes(orderId),
    queryFn: () => fetchColorSizes(orderId),
    enabled: !!orderId,
  })

  function invalidate() {
    return queryClient.invalidateQueries({
      queryKey: applicationQueryKeys.orderRecord.colorSizes(orderId),
      refetchType: 'all',
    })
  }

  const upsertMutation = useMutation({
    mutationFn: (input: { color: string; size: string; quantity: number }) =>
      upsertColorSize(orderId, input),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (colorSizeId: number) => deleteColorSize(orderId, colorSizeId),
    onSuccess: invalidate,
  })

  function updateField(field: keyof ColorSizeFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const quantity = Number(form.quantity)
    if (!form.color.trim() || !form.size.trim()) {
      setError('Renk ve beden alanları zorunludur.')
      return
    }
    if (form.quantity === '' || Number.isNaN(quantity) || quantity < 0) {
      setError('Miktar geçerli bir sayı olmalıdır.')
      return
    }

    try {
      await upsertMutation.mutateAsync({
        color: form.color.trim(),
        size: form.size.trim(),
        quantity,
      })
      setForm((prev) => ({ ...prev, size: '', quantity: '' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Renk/beden eklenemedi.')
    }
  }

  async function handleApplyTemplate(sizes: readonly string[]) {
    setError(null)
    if (!form.color.trim()) {
      setError('Şablon uygulamadan önce bir Renk girin.')
      return
    }

    const color = form.color.trim()
    const existingSizes = new Set(
      (colorSizesQuery.data ?? [])
        .filter((row) => row.color === color)
        .map((row) => row.size),
    )

    for (const size of sizes) {
      if (existingSizes.has(size)) continue
      await upsertMutation.mutateAsync({ color, size, quantity: 0 })
    }
  }

  const rows = colorSizesQuery.data ?? []
  const colors = Array.from(new Set(rows.map((r) => r.color))).sort((a, b) =>
    a.localeCompare(b, 'tr-TR'),
  )
  const sizes = sortSizes(rows.map((r) => r.size))
  const quantityByColorSize = new Map(rows.map((r) => [`${r.color}__${r.size}`, r.quantity]))

  const enteredTotal = rows.reduce((sum, r) => sum + r.quantity, 0)
  const diff = totalQuantity - enteredTotal
  const isBalanced = diff === 0

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'rounded-lg border px-4 py-3 text-sm font-medium',
          isBalanced
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        )}
      >
        Girilen Toplam: {enteredTotal.toLocaleString('tr-TR')} / Sipariş Toplamı:{' '}
        {totalQuantity.toLocaleString('tr-TR')}
        {isBalanced ? ' ✓' : ` — ⚠️ Fark: ${Math.abs(diff).toLocaleString('tr-TR')} adet`}
      </div>

      {colors.length > 0 && sizes.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2">Renk \ Beden</th>
                {sizes.map((size) => (
                  <th key={size} className="px-3 py-2 text-center">
                    {size}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colors.map((color) => (
                <tr key={color} className="border-b border-border/60">
                  <td className="px-3 py-2 font-medium">{color}</td>
                  {sizes.map((size) => (
                    <td key={size} className="px-3 py-2 text-center tabular-nums">
                      {quantityByColorSize.get(`${color}__${size}`)?.toLocaleString('tr-TR') ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={handleAdd}
        className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-3"
      >
        <div className="grid gap-1.5">
          <Label htmlFor="csColor">Renk</Label>
          <Input
            id="csColor"
            value={form.color}
            onChange={(e) => updateField('color', e.target.value)}
            placeholder="Lacivert"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="csSize">Beden</Label>
          <Input
            id="csSize"
            value={form.size}
            onChange={(e) => updateField('size', e.target.value)}
            placeholder="M"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="csQuantity">Miktar</Label>
          <Input
            id="csQuantity"
            type="number"
            min="0"
            value={form.quantity}
            onChange={(e) => updateField('quantity', e.target.value)}
            placeholder="100"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
          <Button type="submit" size="sm" disabled={upsertMutation.isPending}>
            <Plus className="size-4" /> Ekle
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={upsertMutation.isPending}
            onClick={() => handleApplyTemplate(SIZE_PRESETS.letter)}
          >
            {SIZE_PRESETS.letter.join('-')} ekle
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={upsertMutation.isPending}
            onClick={() => handleApplyTemplate(SIZE_PRESETS.numeric)}
          >
            {SIZE_PRESETS.numeric.join('-')} ekle
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2">Renk</th>
              <th className="px-3 py-2">Beden</th>
              <th className="px-3 py-2">Miktar</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {colorSizesQuery.isLoading ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  Yükleniyor...
                </td>
              </tr>
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <ColorSizeRow
                  key={row.id}
                  row={row}
                  onDelete={() => deleteMutation.mutate(row.id)}
                  isDeleting={deleteMutation.isPending && deleteMutation.variables === row.id}
                />
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                  Henüz renk/beden girilmedi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ColorSizeRow({
  row,
  onDelete,
  isDeleting,
}: {
  row: ApiOrderColorSize
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <tr className="border-b border-border/60">
      <td className="px-3 py-2 font-medium">{row.color}</td>
      <td className="px-3 py-2">{row.size}</td>
      <td className="px-3 py-2 tabular-nums">{row.quantity.toLocaleString('tr-TR')}</td>
      <td className="px-3 py-2 text-right">
        <Button variant="ghost" size="sm" disabled={isDeleting} onClick={onDelete}>
          <Trash2 className="size-4" />
        </Button>
      </td>
    </tr>
  )
}
