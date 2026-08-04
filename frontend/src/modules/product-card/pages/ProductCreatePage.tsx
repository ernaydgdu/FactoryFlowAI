import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { useAuth } from '@/application/platform/iam/auth-context'
import {
  ProductCardDomainError,
  useCreateProductCardMutation,
} from '@/application/product-card/use-product-card'
import { PageHeader } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import {
  emptyProductCardFormValues,
  ProductCardFormFields,
  type ProductCardFormValues,
} from '../components/ProductCardFormFields'

export function ProductCreatePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const createMutation = useCreateProductCardMutation()
  const [values, setValues] = useState<ProductCardFormValues>(emptyProductCardFormValues())
  const [error, setError] = useState<string | null>(null)

  function handleChange(key: keyof ProductCardFormValues, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const result = await createMutation.mutateAsync({
        productCode: values.productCode,
        productName: values.productName,
        customerModelNo: values.customerModelNo || undefined,
        internalModelNo: values.internalModelNo || undefined,
        pattern: values.pattern || undefined,
        weight: values.weight || undefined,
        description: values.description || undefined,
        customerId: values.customerId || undefined,
        brandId: values.brandId || undefined,
        seasonId: values.seasonId || undefined,
        sizeSetId: values.sizeSetId || undefined,
        actorUserId: user?.id ?? 'system',
      })
      navigate(`/products/${result.id}`)
    } catch (err) {
      setError(err instanceof ProductCardDomainError ? err.message : 'Kayıt oluşturulamadı.')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Yeni Ürün Kartı"
        description="Teknik SSOT — ürün kartı taslak olarak oluşturulur; onay akışı ayrı adımlardır."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/products"><ArrowLeft className="size-4" /> Listeye dön</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Temel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <ProductCardFormFields values={values} onChange={handleChange} />
            {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Kaydediliyor…' : 'Taslak Oluştur'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/products')}>
                İptal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
