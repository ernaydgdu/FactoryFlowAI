import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { useAuth } from '@/application/platform/iam/auth-context'
import {
  ProductCardDomainError,
  useProductCardEditForm,
  useUpdateProductCardMutation,
} from '@/application/product-card/use-product-card'
import { PageHeader, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { productCardStatusBadge } from '@/application/product-card/product-card.dto'

import {
  ProductCardFormFields,
  type ProductCardFormValues,
} from '../components/ProductCardFormFields'

type Props = {
  id: string
}

export function ProductEditPage({ id }: Props) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: editForm, isLoading, isError } = useProductCardEditForm(id)
  const updateMutation = useUpdateProductCardMutation()
  const [values, setValues] = useState<ProductCardFormValues | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editForm) {
      setValues({
        productCode: editForm.productCode,
        productName: editForm.productName,
        customerModelNo: editForm.customerModelNo,
        internalModelNo: editForm.internalModelNo,
        pattern: editForm.pattern,
        weight: editForm.weight,
        description: editForm.description,
        customerId: editForm.customerId,
        brandId: editForm.brandId,
        seasonId: editForm.seasonId,
        sizeSetId: editForm.sizeSetId,
      })
    }
  }, [editForm])

  function handleChange(key: keyof ProductCardFormValues, value: string) {
    setValues((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!editForm || !values) return
    setError(null)
    try {
      await updateMutation.mutateAsync({
        id: editForm.id,
        expectedVersion: editForm.version,
        actorUserId: user?.id ?? 'system',
        ...values,
        customerId: values.customerId || undefined,
        brandId: values.brandId || undefined,
        seasonId: values.seasonId || undefined,
        sizeSetId: values.sizeSetId || undefined,
      })
      navigate(`/products/${id}`)
    } catch (err) {
      setError(err instanceof ProductCardDomainError ? err.message : 'Güncelleme başarısız.')
    }
  }

  if (isLoading || !values) {
    return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  }

  if (isError || !editForm) {
    return <p className="p-8">Ürün kartı bulunamadı.</p>
  }

  if (!editForm.editable) {
    return (
      <div className="space-y-4 p-8">
        <p>Bu durumda düzenleme yapılamaz.</p>
        <Button variant="outline" asChild>
          <Link to={`/products/${id}`}>Detaya dön</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Ürün Kartı Düzenle"
        description={editForm.productCode}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge {...productCardStatusBadge(editForm.lifecycleStatus)} />
            <Button variant="outline" size="sm" asChild>
              <Link to={`/products/${id}`}>
                <ArrowLeft className="size-4" /> Detaya dön
              </Link>
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Temel Bilgiler</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <ProductCardFormFields
              values={values}
              onChange={handleChange}
              codeReadOnly
            />
            {error && <p className="text-sm text-destructive md:col-span-2">{error}</p>}
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(`/products/${id}`)}>
                İptal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
