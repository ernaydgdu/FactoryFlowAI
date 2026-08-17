import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { useAuth } from '@/application/platform/iam/auth-context'
import { PageHeader, QualityRateCard, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
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
  deleteMaterial,
  deleteProductionEntry,
  deleteQualityEntry,
  fetchAiSuggestion,
  fetchApprovalStages,
  fetchColorSizes,
  fetchMaterials,
  fetchMaterialStockAvailability,
  fetchOrderById,
  fetchOrderForecast,
  fetchProductionEntries,
  fetchQualityEntries,
  fulfillMaterialFromStock,
  updateApprovalStage,
  updateMaterial,
  updateMaterialStatus,
  upsertColorSize,
  type ApiApprovalStage,
  type ApiMaterial,
  type ApiOrderColorSize,
  type ApiProductionEntry,
  type ApiQualityEntry,
  type ApprovalStageType,
  type CreateMaterialInput,
  type CreateProductionEntryInput,
  type CreateQualityEntryInput,
  type MaterialStatusValue,
  type ProductionStage,
  type UpdateMaterialInput,
} from '@/infrastructure/api/orders-api.repository'

import { OrderProgressBar } from '../components/OrderProgressBar'

function useCanManageOrderRecords(): boolean {
  const { user } = useAuth()
  return user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'PLANNER'
}

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
              <TabsTrigger value="approval">Onay Süreci</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <div className="space-y-4">
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label="Müşteri" value={order.buyerName} />
                  <Field label="Ürün" value={order.productName} />
                  <TotalQuantityField
                    totalQuantity={order.totalQuantity}
                    colorSizes={order.colorSizes ?? []}
                  />
                  <Field label="EXF Tarihi" value={formatDate(order.shipmentDate)} />
                  <div>
                    <dt className="text-xs text-muted-foreground">Durum</dt>
                    <dd className="mt-0.5 flex items-center gap-2 text-sm font-medium">
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                      <CuttingReadinessBadge orderId={id} />
                    </dd>
                  </div>
                  <Field label="Oluşturulma" value={formatDate(order.createdAt)} />
                </dl>

                <OrderAiSuggestionCard orderId={id} />
              </div>
            </TabsContent>

            <TabsContent value="purchase">
              <div className="space-y-4">
                <CuttingApprovalWarningBanner orderId={id} />
                <MaterialsPanel orderId={id} exfDate={order.shipmentDate} />
              </div>
            </TabsContent>

            <TabsContent value="production">
              <div className="space-y-4">
                <CuttingApprovalWarningBanner orderId={id} />
                <ProductionPanel orderId={id} totalQuantity={order.totalQuantity} />
              </div>
            </TabsContent>

            <TabsContent value="quality">
              <QualityPanel orderId={id} />
            </TabsContent>

            <TabsContent value="color-sizes">
              <ColorSizePanel orderId={id} totalQuantity={order.totalQuantity} />
            </TabsContent>

            <TabsContent value="approval">
              <ApprovalStagePanel orderId={id} />
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

function TotalQuantityField({
  totalQuantity,
  colorSizes,
}: {
  totalQuantity: number
  colorSizes: { quantity: number }[]
}) {
  const colorSizeSum = colorSizes.reduce((sum, cs) => sum + cs.quantity, 0)
  const hasMismatch = colorSizes.length > 0 && colorSizeSum !== totalQuantity

  return (
    <div>
      <dt className="text-xs text-muted-foreground">Toplam Miktar</dt>
      <dd className="mt-0.5 text-sm font-medium">
        {totalQuantity.toLocaleString('tr-TR')}
        {hasMismatch ? (
          <span className="ml-1.5 text-xs font-normal text-amber-600">
            (Renk/Beden toplamı: {colorSizeSum.toLocaleString('tr-TR')} - fark var)
          </span>
        ) : null}
      </dd>
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
  const canManage = useCanManageOrderRecords()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<MaterialFormState>(INITIAL_MATERIAL_FORM)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ApiMaterial | null>(null)

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

  function invalidateMaterialsAndStock() {
    return Promise.all([
      invalidateMaterials(),
      queryClient.invalidateQueries({
        queryKey: [...applicationQueryKeys.orderRecord.all, 'material-stock-availability', orderId],
        refetchType: 'all',
      }),
      queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.stockRecord.all,
        refetchType: 'all',
      }),
    ])
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

  const editMutation = useMutation({
    mutationFn: ({
      materialId,
      input,
    }: {
      materialId: number
      input: UpdateMaterialInput
    }) => updateMaterial(orderId, materialId, input),
    onSuccess: invalidateMaterials,
  })

  const deleteMutation = useMutation({
    mutationFn: (materialId: number) => deleteMaterial(orderId, materialId),
    onSuccess: invalidateMaterials,
  })

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    await deleteMutation.mutateAsync(pendingDelete.id)
    setPendingDelete(null)
  }

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
              {canManage ? <th className="px-3 py-2" /> : null}
            </tr>
          </thead>
          <tbody>
            {materialsQuery.isLoading ? (
              <tr>
                <td colSpan={canManage ? 12 : 11} className="px-3 py-6 text-center text-muted-foreground">
                  Yükleniyor...
                </td>
              </tr>
            ) : materialsQuery.data && materialsQuery.data.length > 0 ? (
              materialsQuery.data.map((m) => (
                <MaterialRow
                  key={m.id}
                  orderId={orderId}
                  material={m}
                  lateDays={computeLateDays(m.expectedArrival, exfDate)}
                  onStatusChange={(status) => statusMutation.mutate({ materialId: m.id, status })}
                  isUpdating={
                    statusMutation.isPending && statusMutation.variables?.materialId === m.id
                  }
                  canManage={canManage}
                  onSaveEdit={(input) => editMutation.mutateAsync({ materialId: m.id, input })}
                  isSaving={
                    editMutation.isPending && editMutation.variables?.materialId === m.id
                  }
                  onRequestDelete={() => setPendingDelete(m)}
                  onFulfilled={invalidateMaterialsAndStock}
                />
              ))
            ) : (
              <tr>
                <td colSpan={canManage ? 12 : 11} className="px-3 py-6 text-center text-muted-foreground">
                  Henüz malzeme eklenmedi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Malzemeyi Sil"
        description={
          pendingDelete
            ? `"${pendingDelete.materialName}" malzemesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
            : ''
        }
        confirmLabel="Sil"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

type MaterialEditFormState = {
  materialName: string
  supplierName: string
  orderedQuantity: string
  expectedArrival: string
  fabricWidth: string
  fabricWeight: string
  unitPrice: string
  currency: string
}

function materialToEditForm(material: ApiMaterial): MaterialEditFormState {
  return {
    materialName: material.materialName,
    supplierName: material.supplierName,
    orderedQuantity: String(material.orderedQuantity),
    expectedArrival: material.expectedArrival ? material.expectedArrival.slice(0, 10) : '',
    fabricWidth: material.fabricWidth != null ? String(material.fabricWidth) : '',
    fabricWeight: material.fabricWeight != null ? String(material.fabricWeight) : '',
    unitPrice: material.unitPrice != null ? String(material.unitPrice) : '',
    currency: material.currency ?? '',
  }
}

function MaterialRow({
  orderId,
  material,
  lateDays,
  onStatusChange,
  isUpdating,
  canManage,
  onSaveEdit,
  isSaving,
  onRequestDelete,
  onFulfilled,
}: {
  orderId: string
  material: ApiMaterial
  lateDays: number
  onStatusChange: (status: MaterialStatusValue) => void
  isUpdating: boolean
  canManage: boolean
  onSaveEdit: (input: UpdateMaterialInput) => Promise<unknown>
  isSaving: boolean
  onRequestDelete: () => void
  onFulfilled: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<MaterialEditFormState>(() => materialToEditForm(material))
  const [editError, setEditError] = useState<string | null>(null)
  const isLate = lateDays > 0

  function startEdit() {
    setEditForm(materialToEditForm(material))
    setEditError(null)
    setIsEditing(true)
  }

  function updateEditField(field: keyof MaterialEditFormState, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    setEditError(null)
    const orderedQuantity = Number(editForm.orderedQuantity)
    if (!editForm.materialName.trim() || !editForm.supplierName.trim()) {
      setEditError('Malzeme adı ve tedarikçi zorunludur.')
      return
    }
    if (!editForm.orderedQuantity || Number.isNaN(orderedQuantity) || orderedQuantity <= 0) {
      setEditError('Sipariş miktarı geçerli bir sayı olmalıdır.')
      return
    }

    try {
      await onSaveEdit({
        materialName: editForm.materialName.trim(),
        supplierName: editForm.supplierName.trim(),
        orderedQuantity,
        expectedArrival: editForm.expectedArrival || undefined,
        fabricWidth: editForm.fabricWidth ? Number(editForm.fabricWidth) : undefined,
        fabricWeight: editForm.fabricWeight ? Number(editForm.fabricWeight) : undefined,
        unitPrice: editForm.unitPrice ? Number(editForm.unitPrice) : undefined,
        currency: editForm.currency.trim() || undefined,
      })
      setIsEditing(false)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Malzeme güncellenemedi.')
    }
  }

  if (isEditing) {
    return (
      <tr className="border-b border-border/60 bg-muted/20">
        <td className="px-3 py-2">
          <Input
            value={editForm.materialName}
            onChange={(e) => updateEditField('materialName', e.target.value)}
            className="h-8"
          />
        </td>
        <td className="px-3 py-2 text-muted-foreground">{material.materialType}</td>
        <td className="px-3 py-2">
          <Input
            value={editForm.supplierName}
            onChange={(e) => updateEditField('supplierName', e.target.value)}
            className="h-8"
          />
        </td>
        <td className="px-3 py-2">
          <Input
            type="number"
            min="0"
            value={editForm.orderedQuantity}
            onChange={(e) => updateEditField('orderedQuantity', e.target.value)}
            className="h-8 w-24"
          />
        </td>
        <td className="px-3 py-2 tabular-nums">{material.arrivedQuantity.toLocaleString('tr-TR')}</td>
        <td className="px-3 py-2">
          <Input
            type="date"
            value={editForm.expectedArrival}
            onChange={(e) => updateEditField('expectedArrival', e.target.value)}
            className="h-8"
          />
        </td>
        <td className="px-3 py-2">
          <Input
            type="number"
            min="0"
            step="0.1"
            value={editForm.fabricWidth}
            onChange={(e) => updateEditField('fabricWidth', e.target.value)}
            className="h-8 w-20"
          />
        </td>
        <td className="px-3 py-2">
          <Input
            type="number"
            min="0"
            step="0.1"
            value={editForm.fabricWeight}
            onChange={(e) => updateEditField('fabricWeight', e.target.value)}
            className="h-8 w-20"
          />
        </td>
        <td className="px-3 py-2">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={editForm.unitPrice}
            onChange={(e) => updateEditField('unitPrice', e.target.value)}
            className="h-8 w-20"
          />
        </td>
        <td className="px-3 py-2">
          <Input
            value={editForm.currency}
            onChange={(e) => updateEditField('currency', e.target.value)}
            className="h-8 w-16"
          />
        </td>
        <td className="px-3 py-2">
          <StatusBadge
            label={MATERIAL_STATUS_LABEL[material.status]}
            tone={MATERIAL_STATUS_TONE[material.status]}
          />
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-emerald-600 hover:text-emerald-600"
              disabled={isSaving}
              onClick={handleSave}
              title="Kaydet"
            >
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={isSaving}
              onClick={() => setIsEditing(false)}
              title="İptal"
            >
              <X className="size-4" />
            </Button>
          </div>
          {editError ? (
            <p className="mt-1 max-w-[200px] text-xs text-destructive">{editError}</p>
          ) : null}
        </td>
      </tr>
    )
  }

  return (
    <>
    <tr className={cn('border-b border-border/60', isLate && 'bg-destructive/5 text-destructive')}>
      <td className="px-3 py-2 font-medium">
        {material.materialName}
        {material.hasStockLot ? (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">📦 Stoğa işlendi</span>
        ) : null}
      </td>
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
      {canManage ? (
        <td className="px-3 py-2">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={startEdit}
              title="Düzenle"
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onRequestDelete}
              title="Sil"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </td>
      ) : null}
    </tr>
    {material.status === 'PENDING' ? (
      <MaterialStockSuggestionRow
        orderId={orderId}
        material={material}
        canManage={canManage}
        colSpan={canManage ? 12 : 11}
        onFulfilled={onFulfilled}
      />
    ) : null}
    </>
  )
}

function MaterialStockSuggestionRow({
  orderId,
  material,
  canManage,
  colSpan,
  onFulfilled,
}: {
  orderId: string
  material: ApiMaterial
  canManage: boolean
  colSpan: number
  onFulfilled: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState<string | null>(null)

  const availabilityQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.materialStockAvailability(orderId, material.id),
    queryFn: () => fetchMaterialStockAvailability(orderId, material.id),
  })

  const fulfillMutation = useMutation({
    mutationFn: (qty: number) => fulfillMaterialFromStock(orderId, material.id, qty),
    onSuccess: () => {
      setShowForm(false)
      setQuantity('')
      setError(null)
      onFulfilled()
    },
  })

  const availableQty = availabilityQuery.data?.availableQty ?? 0
  if (availableQty <= 0) return null

  function handleOpenForm() {
    const defaultQty = Math.min(material.orderedQuantity, availableQty)
    setQuantity(String(defaultQty))
    setError(null)
    setShowForm(true)
  }

  async function handleConfirm() {
    setError(null)
    const qty = Number(quantity)
    if (!quantity || Number.isNaN(qty) || qty <= 0) {
      setError('Miktar geçerli bir sayı olmalıdır.')
      return
    }
    if (qty > availableQty) {
      setError(`Stokta yeterli miktar yok, mevcut: ${availableQty}`)
      return
    }
    try {
      await fulfillMutation.mutateAsync(qty)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stoktan karşılama başarısız.')
    }
  }

  return (
    <tr className="border-b border-border/60 bg-emerald-500/5">
      <td colSpan={colSpan} className="px-3 py-2">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium text-emerald-700 dark:text-emerald-400">
            📦 Stokta {availableQty.toLocaleString('tr-TR')} birim mevcut
          </span>
          {canManage && !showForm ? (
            <Button size="sm" variant="outline" onClick={handleOpenForm}>
              Stoktan Karşıla
            </Button>
          ) : null}
          {showForm ? (
            <>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-8 w-32"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowForm(false)}
                disabled={fulfillMutation.isPending}
              >
                İptal
              </Button>
              <Button size="sm" onClick={handleConfirm} disabled={fulfillMutation.isPending}>
                {fulfillMutation.isPending ? 'Kaydediliyor...' : 'Onayla'}
              </Button>
            </>
          ) : null}
          {error ? <span className="text-xs text-destructive">{error}</span> : null}
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

function CompletionForecastCard({ orderId }: { orderId: string }) {
  const forecastQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.forecast(orderId),
    queryFn: () => fetchOrderForecast(orderId),
    enabled: !!orderId,
  })

  const forecast = forecastQuery.data

  if (forecastQuery.isLoading) {
    return (
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">Tamamlanma tahmini hesaplanıyor...</p>
      </div>
    )
  }

  if (!forecast || !forecast.hasEnoughData) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <p className="mb-1 text-sm font-medium">Tamamlanma Tahmini</p>
        <p className="text-sm text-muted-foreground">
          Tahmin için yeterli üretim verisi yok (son 7 günde giriş gerekli).
        </p>
      </div>
    )
  }

  const completionDate = new Date(forecast.estimatedCompletionDate as string).toLocaleDateString(
    'tr-TR',
    { day: '2-digit', month: 'short', year: 'numeric' },
  )

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        forecast.willMeetDeadline
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-destructive/30 bg-destructive/5',
      )}
    >
      <p className="mb-2 text-sm font-medium">Tamamlanma Tahmini</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-foreground">Günlük ortalama</p>
          <p className="text-sm font-semibold tabular-nums">
            {forecast.dailyAverageRate?.toLocaleString('tr-TR')} adet/gün
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Tahmini bitiş</p>
          <p className="text-sm font-semibold">{completionDate}</p>
        </div>
      </div>
      <div className="mt-3">
        {forecast.willMeetDeadline ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            ✓ Termine yetişecek
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-sm font-semibold text-destructive">
            ⚠️ {forecast.delayDays} gün gecikme riski
          </span>
        )}
      </div>
    </div>
  )
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
  const canManage = useCanManageOrderRecords()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ProductionFormState>(initialProductionForm)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ApiProductionEntry | null>(null)
  const [fabricConsumptionNote, setFabricConsumptionNote] = useState<string | null>(null)
  const [finishedGoodsNote, setFinishedGoodsNote] = useState<string | null>(null)

  const productionQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.production(orderId),
    queryFn: () => fetchProductionEntries(orderId),
    enabled: !!orderId,
  })

  function invalidateProduction() {
    return Promise.all([
      queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.orderRecord.production(orderId),
        refetchType: 'all',
      }),
      queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.orderRecord.forecast(orderId),
        refetchType: 'all',
      }),
    ])
  }

  const addMutation = useMutation({
    mutationFn: (input: CreateProductionEntryInput) => createProductionEntry(orderId, input),
    onSuccess: invalidateProduction,
  })

  const deleteMutation = useMutation({
    mutationFn: (entryId: number) => deleteProductionEntry(orderId, entryId),
    onSuccess: invalidateProduction,
  })

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    await deleteMutation.mutateAsync(pendingDelete.id)
    setPendingDelete(null)
  }

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

    setFabricConsumptionNote(null)
    setFinishedGoodsNote(null)
    try {
      const result = await addMutation.mutateAsync({
        stage: form.stage,
        quantity,
        date: form.date || undefined,
        lineNo: form.lineNo.trim() || undefined,
        notes: form.notes.trim() || undefined,
      })
      if (result.fabricConsumption?.success) {
        setFabricConsumptionNote(
          `✓ ${result.fabricConsumption.consumedQty.toLocaleString('tr-TR')} metre kumaş ${result.fabricConsumption.warehouseName}'ndan otomatik düşüldü`,
        )
      }
      if (result.finishedGoodsEntry) {
        setFinishedGoodsNote(
          `✓ ${result.finishedGoodsEntry.addedQty.toLocaleString('tr-TR')} adet mamul ${result.finishedGoodsEntry.warehouseName}'na eklendi`,
        )
      }
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

      <CompletionForecastCard orderId={orderId} />

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

      {fabricConsumptionNote ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {fabricConsumptionNote}
        </div>
      ) : null}

      {finishedGoodsNote ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {finishedGoodsNote}
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
              {canManage ? <th className="px-3 py-2" /> : null}
            </tr>
          </thead>
          <tbody>
            {productionQuery.isLoading ? (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="px-3 py-6 text-center text-muted-foreground">
                  Yükleniyor...
                </td>
              </tr>
            ) : entries.length > 0 ? (
              entries.map((entry) => (
                <ProductionRow
                  key={entry.id}
                  entry={entry}
                  canManage={canManage}
                  onRequestDelete={() => setPendingDelete(entry)}
                />
              ))
            ) : (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="px-3 py-6 text-center text-muted-foreground">
                  Henüz üretim girişi eklenmedi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Üretim Girişini Sil"
        description={
          pendingDelete
            ? `${STAGE_LABEL[pendingDelete.stage] ?? pendingDelete.stage} aşamasındaki ${pendingDelete.quantity.toLocaleString('tr-TR')} adetlik üretim girişini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
            : ''
        }
        confirmLabel="Sil"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

function ProductionRow({
  entry,
  canManage,
  onRequestDelete,
}: {
  entry: ApiProductionEntry
  canManage: boolean
  onRequestDelete: () => void
}) {
  return (
    <tr className="border-b border-border/60">
      <td className="px-3 py-2 font-medium">{STAGE_LABEL[entry.stage] ?? entry.stage}</td>
      <td className="px-3 py-2 tabular-nums">{entry.quantity.toLocaleString('tr-TR')}</td>
      <td className="px-3 py-2">{entry.lineNo ?? '—'}</td>
      <td className="px-3 py-2">{formatDate(entry.date)}</td>
      <td className="px-3 py-2">{entry.notes ?? '—'}</td>
      {canManage ? (
        <td className="px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onRequestDelete}
            title="Sil"
          >
            <Trash2 className="size-4" />
          </Button>
        </td>
      ) : null}
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
  const canManage = useCanManageOrderRecords()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<QualityFormState>(initialQualityForm)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ApiQualityEntry | null>(null)

  const qualityQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.quality(orderId),
    queryFn: () => fetchQualityEntries(orderId),
    enabled: !!orderId,
  })

  function invalidateQuality() {
    return queryClient.invalidateQueries({
      queryKey: applicationQueryKeys.orderRecord.quality(orderId),
      refetchType: 'all',
    })
  }

  const addMutation = useMutation({
    mutationFn: (input: CreateQualityEntryInput) => createQualityEntry(orderId, input),
    onSuccess: invalidateQuality,
  })

  const deleteMutation = useMutation({
    mutationFn: (entryId: number) => deleteQualityEntry(orderId, entryId),
    onSuccess: invalidateQuality,
  })

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    await deleteMutation.mutateAsync(pendingDelete.id)
    setPendingDelete(null)
  }

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
              {canManage ? <th className="px-3 py-2" /> : null}
            </tr>
          </thead>
          <tbody>
            {qualityQuery.isLoading ? (
              <tr>
                <td colSpan={canManage ? 8 : 7} className="px-3 py-6 text-center text-muted-foreground">
                  Yükleniyor...
                </td>
              </tr>
            ) : entries.length > 0 ? (
              entries.map((entry) => (
                <QualityRow
                  key={entry.id}
                  entry={entry}
                  canManage={canManage}
                  onRequestDelete={() => setPendingDelete(entry)}
                />
              ))
            ) : (
              <tr>
                <td colSpan={canManage ? 8 : 7} className="px-3 py-6 text-center text-muted-foreground">
                  Henüz kalite girişi eklenmedi.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Kalite Girişini Sil"
        description={
          pendingDelete
            ? `${pendingDelete.checkedQty.toLocaleString('tr-TR')} adetlik kalite kontrol girişini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`
            : ''
        }
        confirmLabel="Sil"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

function QualityRow({
  entry,
  canManage,
  onRequestDelete,
}: {
  entry: ApiQualityEntry
  canManage: boolean
  onRequestDelete: () => void
}) {
  return (
    <tr className="border-b border-border/60">
      <td className="px-3 py-2 tabular-nums">{entry.checkedQty.toLocaleString('tr-TR')}</td>
      <td className="px-3 py-2 tabular-nums">{entry.firstQuality.toLocaleString('tr-TR')}</td>
      <td className="px-3 py-2 tabular-nums">{entry.secondQuality.toLocaleString('tr-TR')}</td>
      <td className="px-3 py-2 tabular-nums">{entry.rejected.toLocaleString('tr-TR')}</td>
      <td className="px-3 py-2">{entry.defectType ?? '—'}</td>
      <td className="px-3 py-2">{formatDate(entry.date)}</td>
      <td className="px-3 py-2">{entry.notes ?? '—'}</td>
      {canManage ? (
        <td className="px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onRequestDelete}
            title="Sil"
          >
            <Trash2 className="size-4" />
          </Button>
        </td>
      ) : null}
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
  const canManage = useCanManageOrderRecords()
  const [form, setForm] = useState<ColorSizeFormState>(INITIAL_COLOR_SIZE_FORM)
  const [error, setError] = useState<string | null>(null)

  const colorSizesQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.colorSizes(orderId),
    queryFn: () => fetchColorSizes(orderId),
    enabled: !!orderId,
  })

  function invalidate() {
    return Promise.all([
      queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.orderRecord.colorSizes(orderId),
        refetchType: 'all',
      }),
      // Sipariş detayı da colorSizes içerdiğinden ("Genel" sekmesindeki
      // tutarlılık göstergesi), o sorguyu da tazelemek gerekir.
      queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.orderRecord.detail(orderId),
        refetchType: 'all',
      }),
    ])
  }

  const upsertMutation = useMutation({
    mutationFn: (input: { color: string; size: string; quantity: number }) =>
      upsertColorSize(orderId, input),
    onSuccess: invalidate,
  })

  const editMutation = useMutation({
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
                  canManage={canManage}
                  onSaveEdit={(quantity) =>
                    editMutation.mutateAsync({ color: row.color, size: row.size, quantity })
                  }
                  isSaving={
                    editMutation.isPending &&
                    editMutation.variables?.color === row.color &&
                    editMutation.variables?.size === row.size
                  }
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

const APPROVAL_STAGE_LABEL: Record<ApprovalStageType, string> = {
  PP_NUMUNE: 'PP Numune Onayı',
  PASTAL_ONAY: 'Pastal Onayı',
  SARFIYAT_ONAY: 'Sarfiyat Onayı',
  KESIM_ONAY: 'Kesim Onayı',
}

const APPROVAL_STATUS_ICON: Record<ApiApprovalStage['status'], string> = {
  PENDING: '⏳',
  APPROVED: '✅',
  REJECTED: '❌',
}

const APPROVAL_STATUS_LABEL: Record<ApiApprovalStage['status'], string> = {
  PENDING: 'Bekliyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
}

const APPROVAL_STATUS_TONE: Record<ApiApprovalStage['status'], string> = {
  PENDING: 'border-border text-muted-foreground',
  APPROVED: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  REJECTED: 'border-destructive/30 bg-destructive/5 text-destructive',
}

function CuttingReadinessBadge({ orderId }: { orderId: string }) {
  const stagesQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.approvalStages(orderId),
    queryFn: () => fetchApprovalStages(orderId),
    enabled: !!orderId,
  })

  if (stagesQuery.isLoading || !stagesQuery.data) {
    return null
  }

  const kesimOnay = stagesQuery.data.find((s) => s.stageType === 'KESIM_ONAY')
  const isReady = kesimOnay?.status === 'APPROVED'

  return (
    <StatusBadge
      label={isReady ? '✓ Kesime Hazır' : '⏳ Onay Bekliyor'}
      tone={isReady ? 'success' : 'warning'}
    />
  )
}

function CuttingApprovalWarningBanner({ orderId }: { orderId: string }) {
  const stagesQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.approvalStages(orderId),
    queryFn: () => fetchApprovalStages(orderId),
    enabled: !!orderId,
  })

  if (stagesQuery.isLoading || !stagesQuery.data) {
    return null
  }

  const allApproved = (
    ['PP_NUMUNE', 'PASTAL_ONAY', 'SARFIYAT_ONAY', 'KESIM_ONAY'] as ApprovalStageType[]
  ).every(
    (stageType) =>
      stagesQuery.data.find((s) => s.stageType === stageType)?.status === 'APPROVED',
  )

  if (allApproved) {
    return null
  }

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700 dark:text-amber-400">
      ⚠️ Bu siparişte kesim onayı henüz verilmedi. Üretim girişi yapmadan önce Onay Süreci
      sekmesini kontrol edin.
    </div>
  )
}

function ApprovalStagePanel({ orderId }: { orderId: string }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const stagesQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.approvalStages(orderId),
    queryFn: () => fetchApprovalStages(orderId),
    enabled: !!orderId,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      stageId,
      status,
    }: {
      stageId: number
      status: 'APPROVED' | 'REJECTED'
    }) =>
      updateApprovalStage(orderId, stageId, {
        status,
        approvedBy: user?.fullName ?? 'Bilinmeyen Kullanıcı',
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.orderRecord.approvalStages(orderId),
        refetchType: 'all',
      }),
  })

  async function handleUpdate(stageId: number, status: 'APPROVED' | 'REJECTED') {
    setError(null)
    try {
      await updateMutation.mutateAsync({ stageId, status })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aşama güncellenemedi.')
    }
  }

  const stages = stagesQuery.data ?? []
  const approvedCount = stages.filter((s) => s.status === 'APPROVED').length

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border px-4 py-3 text-sm font-medium">
        {approvedCount}/{stages.length || 4} aşama tamamlandı
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {stagesQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-6">
          {stages.map((stage) => (
            <li key={stage.id} className="relative">
              <span
                className={cn(
                  'absolute -left-[1.95rem] flex size-6 items-center justify-center rounded-full border bg-background text-xs',
                  APPROVAL_STATUS_TONE[stage.status],
                )}
              >
                {APPROVAL_STATUS_ICON[stage.status]}
              </span>
              <div
                className={cn(
                  'rounded-lg border p-4',
                  stage.status === 'PENDING' ? 'border-border' : APPROVAL_STATUS_TONE[stage.status],
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{APPROVAL_STAGE_LABEL[stage.stageType]}</p>
                  <StatusBadge
                    label={APPROVAL_STATUS_LABEL[stage.status]}
                    tone={
                      stage.status === 'APPROVED'
                        ? 'success'
                        : stage.status === 'REJECTED'
                          ? 'danger'
                          : 'muted'
                    }
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {stage.approvedBy ? `Onaylayan: ${stage.approvedBy}` : 'Henüz işlem yapılmadı'}
                  {stage.approvedAt ? ` · ${formatDate(stage.approvedAt)}` : ''}
                </div>
                {stage.status === 'PENDING' ? (
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      disabled={updateMutation.isPending}
                      onClick={() => handleUpdate(stage.id, 'APPROVED')}
                    >
                      <Check className="size-4" /> Onayla
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={updateMutation.isPending}
                      onClick={() => handleUpdate(stage.id, 'REJECTED')}
                    >
                      <X className="size-4" /> Reddet
                    </Button>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function ColorSizeRow({
  row,
  canManage,
  onSaveEdit,
  isSaving,
  onDelete,
  isDeleting,
}: {
  row: ApiOrderColorSize
  canManage: boolean
  onSaveEdit: (quantity: number) => Promise<unknown>
  isSaving: boolean
  onDelete: () => void
  isDeleting: boolean
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [quantityInput, setQuantityInput] = useState(String(row.quantity))
  const [editError, setEditError] = useState<string | null>(null)

  function startEdit() {
    setQuantityInput(String(row.quantity))
    setEditError(null)
    setIsEditing(true)
  }

  async function handleSave() {
    setEditError(null)
    const quantity = Number(quantityInput)
    if (quantityInput === '' || Number.isNaN(quantity) || quantity < 0) {
      setEditError('Geçerli bir miktar girin.')
      return
    }

    try {
      await onSaveEdit(quantity)
      setIsEditing(false)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Güncellenemedi.')
    }
  }

  return (
    <tr className="border-b border-border/60">
      <td className="px-3 py-2 font-medium">{row.color}</td>
      <td className="px-3 py-2">{row.size}</td>
      <td className="px-3 py-2 tabular-nums">
        {isEditing ? (
          <div>
            <Input
              type="number"
              min="0"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              className="h-8 w-24"
            />
            {editError ? <p className="mt-1 text-xs text-destructive">{editError}</p> : null}
          </div>
        ) : (
          row.quantity.toLocaleString('tr-TR')
        )}
      </td>
      <td className="px-3 py-2 text-right">
        {isEditing ? (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-emerald-600 hover:text-emerald-600"
              disabled={isSaving}
              onClick={handleSave}
              title="Kaydet"
            >
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={isSaving}
              onClick={() => setIsEditing(false)}
              title="İptal"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1">
            {canManage ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={startEdit}
                title="Düzenle"
              >
                <Pencil className="size-4" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              disabled={isDeleting}
              onClick={onDelete}
              title="Sil"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )}
      </td>
    </tr>
  )
}
