import { useState, type FormEvent } from 'react'

import type { ProductCardDetailDto } from '@/application/product-card/product-card.dto'
import {
  ProductCardDomainError,
  useApproveProductCardMutation,
} from '@/application/product-card/use-product-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { ProductCardModal } from './ProductCardModal'

type Props = {
  product: ProductCardDetailDto
  actorUserId: string
  open: boolean
  onClose: () => void
  onSuccess?: (message: string) => void
}

export function ProductApprovalDialog({
  product,
  actorUserId,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const approveMutation = useApproveProductCardMutation()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await approveMutation.mutateAsync({
        id: product.id,
        expectedVersion: product.version,
        actorUserId,
        comment: comment.trim() || undefined,
      })
      setComment('')
      onSuccess?.('Ürün kartı onaylandı.')
      onClose()
    } catch (err) {
      setError(err instanceof ProductCardDomainError ? err.message : 'Onay işlemi başarısız.')
    }
  }

  return (
    <ProductCardModal
      open={open}
      title="Ürün Kartı Onayı"
      description={`${product.productCode} — ${product.productName}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Onay sonrası kart <strong>Approved</strong> durumuna geçer ve sipariş seçiminde kullanılabilir.
        </p>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">Onay Notu</span>
          <Input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Opsiyonel onay açıklaması"
          />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" disabled={approveMutation.isPending}>
            {approveMutation.isPending ? 'Onaylanıyor…' : 'Onayla'}
          </Button>
        </div>
      </form>
    </ProductCardModal>
  )
}
