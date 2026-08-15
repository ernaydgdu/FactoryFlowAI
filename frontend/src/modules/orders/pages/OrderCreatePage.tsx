import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createOrder } from '@/infrastructure/api/orders-api.repository'

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

export function OrderCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [error, setError] = useState<string | null>(null)

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

    try {
      await createMutation.mutateAsync({
        orderNo: form.orderNo.trim(),
        buyerName: form.buyerName.trim(),
        productName: form.productName.trim(),
        totalQuantity,
        shipmentDate: form.shipmentDate,
      })
      navigate('/orders')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.')
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
            <Button size="sm" type="submit" form="order-create-form" disabled={createMutation.isPending}>
              <Save className="size-4" />
              {createMutation.isPending ? 'Kaydediliyor...' : 'Siparişi Kaydet'}
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

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/orders')}>
          İptal
        </Button>
        <Button size="lg" type="submit" form="order-create-form" disabled={createMutation.isPending}>
          <Save className="size-4" />
          {createMutation.isPending ? 'Kaydediliyor...' : 'Siparişi Kaydet'}
        </Button>
      </div>
    </div>
  )
}
