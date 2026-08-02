import { Save } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { PageHeader } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getProductById } from '@/domain/data/products'
import { getSalesOrderById } from '@/domain/data/orders'

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

export function OrderEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const order = id ? getSalesOrderById(id) : undefined
  const product = order ? getProductById(order.productCardId) : undefined
  const [saved, setSaved] = useState(false)

  if (!order || !product) {
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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => navigate(`/orders/${order!.id}`), 800)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Düzenle — ${order.orderNo}`}
        description="Sipariş bilgilerini güncelleyin — mock kayıt simülasyonu."
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
              <Input id="customer" defaultValue={order.general.customer} required />
            </Field>
            <Field label="Marka" id="brand">
              <Input id="brand" defaultValue={order.general.brand} required />
            </Field>
            <Field label="Model" id="model">
              <Input id="model" defaultValue={product.productName} required />
            </Field>
            <Field label="PO No" id="poNo">
              <Input id="poNo" defaultValue={order.general.poNo} />
            </Field>
            <Field label="EXF" id="exf">
              <Input id="exf" type="date" defaultValue={order.general.exf} required />
            </Field>
            <Field label="Planlamacı" id="planner">
              <Input id="planner" defaultValue={order.planner} required />
            </Field>
            <Field label="Üretim Durumu" id="status">
              <select
                id="status"
                defaultValue={order.productionStatus}
                className={selectClass}
              >
                <option value="Beklemede">Beklemede</option>
                <option value="Üretimde">Üretimde</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="Sevk Edildi">Sevk Edildi</option>
              </select>
            </Field>
            <div className="flex items-center gap-3 md:col-span-2">
              <Button type="submit" size="lg">
                <Save className="size-4" /> Değişiklikleri Kaydet
              </Button>
              {saved ? (
                <span className="text-sm text-emerald-600">
                  Kaydedildi — yönlendiriliyor...
                </span>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  id,
  children,
}: {
  label: string
  id: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}
