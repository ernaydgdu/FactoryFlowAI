import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Save, Trash2, X } from 'lucide-react'
import { useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { SIZE_PRESETS } from '@/modules/core/data/master-data'
import {
  createBOMItem,
  createOrder,
  upsertColorSize,
  type BOMMaterialType,
  type BOMUnit,
} from '@/infrastructure/api/orders-api.repository'

type FormState = {
  orderNo: string
  buyerName: string
  productName: string
  totalQuantity: string
  shipmentDate: string
}

const INITIAL_FORM: FormState = {
  orderNo: '',
  buyerName: '',
  productName: '',
  totalQuantity: '',
  shipmentDate: '',
}

type ColorSizeRow = {
  key: string
  color: string
  size: string
  quantity: string
}

let colorSizeRowCounter = 0

function createColorSizeRow(): ColorSizeRow {
  colorSizeRowCounter += 1
  return { key: `csr-${colorSizeRowCounter}`, color: '', size: '', quantity: '' }
}

// Beden tablosu seçenekleri — "letter" ve "numeric" master-data.ts'teki
// SIZE_PRESETS ile aynı (OrderDetailPage'deki "... ekle" butonlarıyla
// tutarlı); "custom" seçilirse kullanıcı virgülle ayırarak kendi beden
// listesini elle girer (bkz. `customSizesInput`).
const SIZE_TABLE_OPTIONS: { id: string; label: string; sizes: readonly string[] | null }[] = [
  { id: 'letter', label: SIZE_PRESETS.letter.join('-'), sizes: SIZE_PRESETS.letter },
  { id: 'eu', label: SIZE_PRESETS.eu.join('-'), sizes: SIZE_PRESETS.eu },
  { id: 'numeric', label: SIZE_PRESETS.numeric.join('-'), sizes: SIZE_PRESETS.numeric },
  { id: 'custom', label: 'Özel (elle gir)', sizes: null },
]

function matrixCellKey(color: string, size: string): string {
  return `${color}|${size}`
}

type BOMRow = {
  key: string
  materialName: string
  materialType: BOMMaterialType
  unitConsumption: string
  unit: BOMUnit
  wastagePercent: string
}

let bomRowCounter = 0

function createBOMRow(): BOMRow {
  bomRowCounter += 1
  return {
    key: `bom-${bomRowCounter}`,
    materialName: '',
    materialType: 'KUMAS',
    unitConsumption: '',
    unit: 'METRE',
    wastagePercent: '3',
  }
}

const BOM_MATERIAL_TYPE_LABEL: Record<BOMMaterialType, string> = {
  KUMAS: 'Kumaş',
  AKSESUAR: 'Aksesuar',
}

const BOM_UNIT_LABEL: Record<BOMUnit, string> = {
  METRE: 'Metre',
  ADET: 'Adet',
  GRAM: 'Gram',
  KG: 'Kg',
}

export function OrderCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [colors, setColors] = useState<string[]>([])
  const [colorInput, setColorInput] = useState('')
  const [sizeTableId, setSizeTableId] = useState('')
  const [customSizesInput, setCustomSizesInput] = useState('')
  const [matrixQuantities, setMatrixQuantities] = useState<Record<string, string>>({})
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [colorSizeRows, setColorSizeRows] = useState<ColorSizeRow[]>([])
  const [bomRows, setBomRows] = useState<BOMRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.orderRecord.list(),
        refetchType: 'all',
      }),
  })

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function addColorSizeRow() {
    setColorSizeRows((prev) => [...prev, createColorSizeRow()])
  }

  function updateColorSizeRow(key: string, field: keyof Omit<ColorSizeRow, 'key'>, value: string) {
    setColorSizeRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
    )
  }

  function removeColorSizeRow(key: string) {
    setColorSizeRows((prev) => prev.filter((row) => row.key !== key))
  }

  function addColor(raw: string) {
    const value = raw.trim()
    if (!value) return
    setColors((prev) => (prev.includes(value) ? prev : [...prev, value]))
    setColorInput('')
  }

  function removeColor(value: string) {
    setColors((prev) => prev.filter((c) => c !== value))
  }

  // Kullanıcı virgül yazdığı anda (paste dahil) o ana kadarki metni bir
  // renk chip'i olarak eklenir; son (virgülsüz) parça input'ta kalır.
  function handleColorInputChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (raw.includes(',')) {
      const parts = raw.split(',')
      const last = parts.pop() ?? ''
      parts.forEach(addColor)
      setColorInput(last)
    } else {
      setColorInput(raw)
    }
  }

  function handleColorInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addColor(colorInput)
    }
  }

  function updateMatrixQuantity(color: string, size: string, value: string) {
    setMatrixQuantities((prev) => ({ ...prev, [matrixCellKey(color, size)]: value }))
  }

  function matrixCellValue(color: string, size: string): number {
    return Number(matrixQuantities[matrixCellKey(color, size)]) || 0
  }

  function addBOMRow() {
    setBomRows((prev) => [...prev, createBOMRow()])
  }

  function updateBOMRow(key: string, field: keyof Omit<BOMRow, 'key'>, value: string) {
    setBomRows((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)))
  }

  function removeBOMRow(key: string) {
    setBomRows((prev) => prev.filter((row) => row.key !== key))
  }

  const colorSizeEnteredTotal = colorSizeRows.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0),
    0,
  )
  const totalQuantityNumber = Number(form.totalQuantity) || 0

  const selectedSizeOption = SIZE_TABLE_OPTIONS.find((o) => o.id === sizeTableId) ?? null
  const selectedSizes =
    selectedSizeOption?.sizes ??
    (sizeTableId === 'custom'
      ? customSizesInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [])
  const showMatrix = colors.length > 0 && selectedSizes.length > 0

  const matrixColumnTotals = selectedSizes.map((size) =>
    colors.reduce((sum, color) => sum + matrixCellValue(color, size), 0),
  )
  const matrixRowTotals = colors.map((color) =>
    selectedSizes.reduce((sum, size) => sum + matrixCellValue(color, size), 0),
  )
  const matrixGrandTotal = matrixColumnTotals.reduce((sum, t) => sum + t, 0)
  const combinedEnteredTotal = matrixGrandTotal + colorSizeEnteredTotal

  function estimatedBOMNeed(row: BOMRow): number {
    const unitConsumption = Number(row.unitConsumption) || 0
    const wastagePercent = Number(row.wastagePercent) || 0
    return totalQuantityNumber * unitConsumption * (1 + wastagePercent / 100)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const totalQuantity = Number(form.totalQuantity)

    if (!form.orderNo.trim() || !form.buyerName.trim() || !form.productName.trim()) {
      setError('Sipariş No, Müşteri Adı ve Ürün Adı zorunludur.')
      return
    }
    if (!form.totalQuantity || Number.isNaN(totalQuantity) || totalQuantity <= 0) {
      setError('Toplam miktar geçerli bir sayı olmalıdır.')
      return
    }
    if (!form.shipmentDate) {
      setError('EXF tarihi zorunludur.')
      return
    }

    const matrixEntries: { color: string; size: string; quantity: number }[] = []
    if (showMatrix) {
      for (const color of colors) {
        for (const size of selectedSizes) {
          const raw = matrixQuantities[matrixCellKey(color, size)]
          if (raw === undefined || raw === '') continue
          const quantity = Number(raw)
          if (Number.isNaN(quantity) || quantity < 0) {
            setError(`"${color} / ${size}" hücresi için geçerli bir miktar girin.`)
            return
          }
          if (quantity > 0) {
            matrixEntries.push({ color, size, quantity })
          }
        }
      }
    }

    const validColorSizeRows = colorSizeRows.filter(
      (row) => row.color.trim() && row.size.trim(),
    )
    for (const row of validColorSizeRows) {
      const quantity = Number(row.quantity)
      if (row.quantity === '' || Number.isNaN(quantity) || quantity < 0) {
        setError(`"${row.color} / ${row.size}" satırı için geçerli bir miktar girin.`)
        return
      }
    }

    const validBOMRows = bomRows.filter((row) => row.materialName.trim())
    for (const row of validBOMRows) {
      const unitConsumption = Number(row.unitConsumption)
      if (!row.unitConsumption || Number.isNaN(unitConsumption) || unitConsumption <= 0) {
        setError(`"${row.materialName}" bileşeni için geçerli bir birim tüketim girin.`)
        return
      }
      const wastagePercent = Number(row.wastagePercent)
      if (row.wastagePercent !== '' && (Number.isNaN(wastagePercent) || wastagePercent < 0)) {
        setError(`"${row.materialName}" bileşeni için geçerli bir fire payı girin.`)
        return
      }
    }

    setIsSubmitting(true)
    try {
      const order = await createMutation.mutateAsync({
        orderNo: form.orderNo.trim(),
        buyerName: form.buyerName.trim(),
        productName: form.productName.trim(),
        totalQuantity,
        shipmentDate: form.shipmentDate,
      })

      for (const entry of matrixEntries) {
        await upsertColorSize(order.id, entry)
      }

      for (const row of validColorSizeRows) {
        await upsertColorSize(order.id, {
          color: row.color.trim(),
          size: row.size.trim(),
          quantity: Number(row.quantity),
        })
      }

      for (const row of validBOMRows) {
        await createBOMItem(order.id, {
          materialName: row.materialName.trim(),
          materialType: row.materialType,
          unitConsumption: Number(row.unitConsumption),
          unit: row.unit,
          wastagePercent: row.wastagePercent ? Number(row.wastagePercent) : undefined,
        })
      }

      navigate('/orders')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yeni Sipariş"
        description="Yeni bir sipariş kaydı oluşturun."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate('/orders')}>
              İptal
            </Button>
            <Button
              size="sm"
              type="submit"
              form="order-create-form"
              disabled={isSubmitting}
              className="bg-brand text-brand-foreground hover:bg-brand/90"
            >
              <Save className="size-4" />
              {isSubmitting ? 'Kaydediliyor...' : 'Siparişi Kaydet'}
            </Button>
          </>
        }
      />

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Sipariş Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            id="order-create-form"
            onSubmit={handleSubmit}
            className="grid max-w-xl gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="orderNo">Sipariş No</Label>
              <Input
                id="orderNo"
                value={form.orderNo}
                onChange={(e) => updateField('orderNo', e.target.value)}
                placeholder="PO-2026-0001"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="buyerName">Müşteri Adı</Label>
              <Input
                id="buyerName"
                value={form.buyerName}
                onChange={(e) => updateField('buyerName', e.target.value)}
                placeholder="Zara"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="productName">Ürün Adı</Label>
              <Input
                id="productName"
                value={form.productName}
                onChange={(e) => updateField('productName', e.target.value)}
                placeholder="T-Shirt"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="totalQuantity">Toplam Miktar</Label>
              <Input
                id="totalQuantity"
                type="number"
                min="1"
                value={form.totalQuantity}
                onChange={(e) => updateField('totalQuantity', e.target.value)}
                placeholder="1000"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="shipmentDate">EXF Tarihi</Label>
              <Input
                id="shipmentDate"
                type="date"
                value={form.shipmentDate}
                onChange={(e) => updateField('shipmentDate', e.target.value)}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Renk/Beden Dağılımı (Opsiyonel)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="colorInput">Renkler</Label>
              <Input
                id="colorInput"
                value={colorInput}
                onChange={handleColorInputChange}
                onKeyDown={handleColorInputKeyDown}
                placeholder="Renk yazıp Enter'a basın (Lacivert, Beyaz, Siyah...)"
              />
              {colors.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {colors.map((color) => (
                    <span
                      key={color}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-sm"
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => removeColor(color)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`${color} rengini kaldır`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sizeTable">Beden Tablosu</Label>
              <select
                id="sizeTable"
                value={sizeTableId}
                onChange={(e) => setSizeTableId(e.target.value)}
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">Seçiniz...</option>
                {SIZE_TABLE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              {sizeTableId === 'custom' ? (
                <Input
                  value={customSizesInput}
                  onChange={(e) => setCustomSizesInput(e.target.value)}
                  placeholder="34,36,38,40"
                />
              ) : null}
            </div>
          </div>

          {showMatrix ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2">Renk</th>
                    {selectedSizes.map((size) => (
                      <th key={size} className="px-2 py-2 text-center">
                        {size}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right">Satır Toplamı</th>
                  </tr>
                </thead>
                <tbody>
                  {colors.map((color, colorIndex) => (
                    <tr key={color} className="border-b border-border/60">
                      <td className="px-3 py-2 font-medium whitespace-nowrap">{color}</td>
                      {selectedSizes.map((size) => (
                        <td key={size} className="px-2 py-2">
                          <Input
                            type="number"
                            min="0"
                            value={matrixQuantities[matrixCellKey(color, size)] ?? ''}
                            onChange={(e) => updateMatrixQuantity(color, size, e.target.value)}
                            placeholder="0"
                            className="w-20 text-center"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right font-medium tabular-nums">
                        {matrixRowTotals[colorIndex].toLocaleString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/20 text-sm font-medium">
                    <td className="px-3 py-2">Sütun Toplamı</td>
                    {matrixColumnTotals.map((total, index) => (
                      <td key={selectedSizes[index]} className="px-2 py-2 text-center tabular-nums">
                        {total.toLocaleString('tr-TR')}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right tabular-nums">
                      {matrixGrandTotal.toLocaleString('tr-TR')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Matris tablosunu görmek için en az bir renk ekleyin ve bir beden tablosu seçin. Bu
              bölüm opsiyoneldir, boş bırakabilirsiniz.
            </p>
          )}

          {showMatrix || colorSizeRows.length > 0 ? (
            <div
              className={cn(
                'rounded-lg border px-4 py-3 text-sm font-medium',
                combinedEnteredTotal === totalQuantityNumber
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
              )}
            >
              Girilen Toplam: {combinedEnteredTotal.toLocaleString('tr-TR')} / Sipariş Toplamı
              (Toplam Miktar alanından): {totalQuantityNumber.toLocaleString('tr-TR')}
              {combinedEnteredTotal === totalQuantityNumber ? ' ✓' : ''}
            </div>
          ) : null}

          {!showManualEntry && colorSizeRows.length === 0 ? (
            <button
              type="button"
              onClick={() => setShowManualEntry(true)}
              className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              veya elle satır ekle
            </button>
          ) : null}

          {showManualEntry || colorSizeRows.length > 0 ? (
            <div className="space-y-4 border-t border-border/60 pt-4">
              {colorSizeRows.length > 0 ? (
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
                      {colorSizeRows.map((row) => (
                        <tr key={row.key} className="border-b border-border/60">
                          <td className="px-3 py-2">
                            <Input
                              value={row.color}
                              onChange={(e) =>
                                updateColorSizeRow(row.key, 'color', e.target.value)
                              }
                              placeholder="Lacivert"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              value={row.size}
                              onChange={(e) => updateColorSizeRow(row.key, 'size', e.target.value)}
                              placeholder="M"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Input
                              type="number"
                              min="0"
                              value={row.quantity}
                              onChange={(e) =>
                                updateColorSizeRow(row.key, 'quantity', e.target.value)
                              }
                              placeholder="100"
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeColorSizeRow(row.key)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nadir durumlar için (ör. tek bir özel renk/beden kombinasyonu) tek tek satır
                  ekleyebilirsiniz.
                </p>
              )}

              <Button type="button" variant="outline" size="sm" onClick={addColorSizeRow}>
                <Plus className="size-4" /> Renk/Beden Ekle
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">BOM - Ürün Ağacı (Opsiyonel)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {bomRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2">Malzeme Adı</th>
                    <th className="px-3 py-2">Tip</th>
                    <th className="px-3 py-2">Birim Tüketim</th>
                    <th className="px-3 py-2">Birim</th>
                    <th className="px-3 py-2">Fire Payı (%)</th>
                    <th className="px-3 py-2">Tahmini Toplam İhtiyaç</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {bomRows.map((row) => (
                    <tr key={row.key} className="border-b border-border/60">
                      <td className="px-3 py-2">
                        <Input
                          value={row.materialName}
                          onChange={(e) => updateBOMRow(row.key, 'materialName', e.target.value)}
                          placeholder="Ana Kumaş"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={row.materialType}
                          onChange={(e) =>
                            updateBOMRow(row.key, 'materialType', e.target.value)
                          }
                          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                        >
                          {(Object.keys(BOM_MATERIAL_TYPE_LABEL) as BOMMaterialType[]).map((t) => (
                            <option key={t} value={t}>
                              {BOM_MATERIAL_TYPE_LABEL[t]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.unitConsumption}
                          onChange={(e) =>
                            updateBOMRow(row.key, 'unitConsumption', e.target.value)
                          }
                          placeholder="1.4"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={row.unit}
                          onChange={(e) => updateBOMRow(row.key, 'unit', e.target.value)}
                          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                        >
                          {(Object.keys(BOM_UNIT_LABEL) as BOMUnit[]).map((u) => (
                            <option key={u} value={u}>
                              {BOM_UNIT_LABEL[u]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={row.wastagePercent}
                          onChange={(e) =>
                            updateBOMRow(row.key, 'wastagePercent', e.target.value)
                          }
                          placeholder="3"
                        />
                      </td>
                      <td className="px-3 py-2 tabular-nums text-muted-foreground">
                        {estimatedBOMNeed(row).toLocaleString('tr-TR', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1,
                        })}{' '}
                        {BOM_UNIT_LABEL[row.unit]}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBOMRow(row.key)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Henüz ürün ağacı bileşeni eklenmedi. Bu bölüm opsiyoneldir, boş bırakabilirsiniz.
            </p>
          )}

          <Button type="button" variant="outline" size="sm" onClick={addBOMRow}>
            <Plus className="size-4" /> Bileşen Ekle
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/orders')}>
          İptal
        </Button>
        <Button
          size="lg"
          type="submit"
          form="order-create-form"
          disabled={isSubmitting}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          <Save className="size-4" />
          {isSubmitting ? 'Kaydediliyor...' : 'Siparişi Kaydet'}
        </Button>
      </div>
    </div>
  )
}
