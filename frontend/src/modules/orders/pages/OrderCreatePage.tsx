import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Save, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { createOrder, upsertColorSize } from '@/infrastructure/api/orders-api.repository'

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

export function OrderCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [colorSizeRows, setColorSizeRows] = useState<ColorSizeRow[]>([])
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

  const colorSizeEnteredTotal = colorSizeRows.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0),
    0,
  )
  const totalQuantityNumber = Number(form.totalQuantity) || 0

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

    setIsSubmitting(true)
    try {
      const order = await createMutation.mutateAsync({
        orderNo: form.orderNo.trim(),
        buyerName: form.buyerName.trim(),
        productName: form.productName.trim(),
        totalQuantity,
        shipmentDate: form.shipmentDate,
      })

      for (const row of validColorSizeRows) {
        await upsertColorSize(order.id, {
          color: row.color.trim(),
          size: row.size.trim(),
          quantity: Number(row.quantity),
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
            <Button size="sm" type="submit" form="order-create-form" disabled={isSubmitting}>
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
                          onChange={(e) => updateColorSizeRow(row.key, 'color', e.target.value)}
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
                          onChange={(e) => updateColorSizeRow(row.key, 'quantity', e.target.value)}
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
              Henüz renk/beden satırı eklenmedi. Bu bölüm opsiyoneldir, boş bırakabilirsiniz.
            </p>
          )}

          <Button type="button" variant="outline" size="sm" onClick={addColorSizeRow}>
            <Plus className="size-4" /> Renk/Beden Ekle
          </Button>

          {colorSizeRows.length > 0 ? (
            <div
              className={cn(
                'rounded-lg border px-4 py-3 text-sm font-medium',
                colorSizeEnteredTotal === totalQuantityNumber
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
              )}
            >
              Girilen Toplam: {colorSizeEnteredTotal.toLocaleString('tr-TR')} / Sipariş Toplamı
              (Toplam Miktar alanından): {totalQuantityNumber.toLocaleString('tr-TR')}
              {colorSizeEnteredTotal === totalQuantityNumber ? ' ✓' : ''}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/orders')}>
          İptal
        </Button>
        <Button size="lg" type="submit" form="order-create-form" disabled={isSubmitting}>
          <Save className="size-4" />
          {isSubmitting ? 'Kaydediliyor...' : 'Siparişi Kaydet'}
        </Button>
      </div>
    </div>
  )
}
