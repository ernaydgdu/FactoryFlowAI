import { Save } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useAuth } from '@/application/platform/iam/auth-context'
import {
  SalesOrderDomainError,
  useSalesOrderDetail,
  useUpdateSalesOrderMutation,
} from '@/application/sales-order/use-sales-order'
import { PageHeader } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSalesOrderById } from '@/domain/data/orders'

export function OrderEditPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: detail } = useSalesOrderDetail(id)
  const order = getSalesOrderById(id)
  const updateMutation = useUpdateSalesOrderMutation(id)
  const [error, setError] = useState<string | null>(null)

  if (!order || !detail) {
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

  if (!detail.editable) {
    return (
      <PageHeader
        title={`Düzenle — ${order.orderNo}`}
        description="Bu sipariş düzenlenemez durumda."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={`/orders/${order.id}`}>Detaya Dön</Link>
          </Button>
        }
      />
    )
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!order || !detail) return
    setError(null)
    const form = new FormData(e.currentTarget)
    const current = order
    try {
      await updateMutation.mutateAsync({
        expectedVersion: detail.version,
        actorUserId: user?.id ?? 'system',
        productCardId: current.productCardId,
        general: {
          customer: String(form.get('customer') ?? current.general.customer),
          brand: String(form.get('brand') ?? current.general.brand),
          buyer: current.general.buyer,
          merchandiser: String(form.get('planner') ?? current.general.merchandiser),
          season: current.general.season,
          collection: current.general.collection,
          poNo: String(form.get('poNo') ?? current.general.poNo),
          poDate: current.general.poDate,
          orderDate: current.general.orderDate,
          exf: String(form.get('exf') ?? current.general.exf),
          deliveryTerm: current.general.deliveryTerm,
          paymentTerm: current.general.paymentTerm,
          factory: current.general.factory,
          currency: current.general.currency,
          notes: current.general.notes,
        },
        matrix: current.matrix,
        unitPrice: current.unitPrice,
        lineDeliveryDate: String(form.get('exf') ?? current.general.exf),
      })
      navigate(`/orders/${current.id}`)
    } catch (err) {
      setError(err instanceof SalesOrderDomainError ? err.message : 'Kayıt başarısız.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Düzenle — ${order.orderNo}`}
        description="Sipariş bilgilerini güncelleyin."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={`/orders/${order.id}`}>İptal</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Sipariş Bilgileri</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-6 md:grid-cols-2" onSubmit={handleSubmit}>
            <Field label="Müşteri" id="customer">
              <Input id="customer" name="customer" defaultValue={order.general.customer} required />
            </Field>
            <Field label="Marka" id="brand">
              <Input id="brand" name="brand" defaultValue={order.general.brand} required />
            </Field>
            <Field label="PO No" id="poNo">
              <Input id="poNo" name="poNo" defaultValue={order.general.poNo} />
            </Field>
            <Field label="EXF" id="exf">
              <Input id="exf" name="exf" type="date" defaultValue={order.general.exf} required />
            </Field>
            <Field label="Planlamacı" id="planner">
              <Input id="planner" name="planner" defaultValue={order.planner} required />
            </Field>
            <Field label="Birim Fiyat (USD)" id="unitPrice">
              <Input id="unitPrice" name="unitPrice" type="number" step="0.01" defaultValue={order.unitPrice} readOnly />
            </Field>
            {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
            <div className="md:col-span-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="size-4" />
                {updateMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}
