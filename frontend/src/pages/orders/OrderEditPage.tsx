import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fetchOrderById, updateOrder } from '@/infrastructure/api/orders-api.repository'

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

export function OrderEditPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const orderQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.detail(id),
    queryFn: () => fetchOrderById(id),
    enabled: !!id,
  })

  useEffect(() => {
    const order = orderQuery.data
    if (!order) return
    setForm({
      orderNo: order.orderNo,
      buyerName: order.buyerName,
      productName: order.productName,
      totalQuantity: String(order.totalQuantity),
      shipmentDate: order.shipmentDate.slice(0, 10),
    })
  }, [orderQuery.data])

  const updateMutation = useMutation({
    mutationFn: (input: {
      orderNo: string
      buyerName: string
      productName: string
      totalQuantity: number
      shipmentDate: string
    }) => updateOrder(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.orderRecord.list(),
        refetchType: 'all',
      })
      queryClient.invalidateQueries({
        queryKey: applicationQueryKeys.orderRecord.detail(id),
        refetchType: 'all',
      })
    },
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

    setIsSubmitting(true)
    try {
      await updateMutation.mutateAsync({
        orderNo: form.orderNo.trim(),
        buyerName: form.buyerName.trim(),
        productName: form.productName.trim(),
        totalQuantity,
        shipmentDate: form.shipmentDate,
      })
      navigate(`/orders/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (orderQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Yükleniyor...</p>
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <PageHeader
        title="Sipariş Bulunamadı"
        description="Düzenlenecek sipariş kaydı mevcut değil."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/orders">Listeye Dön</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Düzenle — ${orderQuery.data.orderNo}`}
        description="Sipariş bilgilerini güncelleyin."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/orders/${id}`}>İptal</Link>
            </Button>
            <Button size="sm" type="submit" form="order-edit-form" disabled={isSubmitting}>
              <Save className="size-4" />
              {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
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
            id="order-edit-form"
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
        <Button variant="outline" asChild>
          <Link to={`/orders/${id}`}>İptal</Link>
        </Button>
        <Button size="lg" type="submit" form="order-edit-form" disabled={isSubmitting}>
          <Save className="size-4" />
          {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>
    </div>
  )
}
