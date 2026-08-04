import { useState, type FormEvent } from 'react'

import type { ProductCardDetailDto } from '@/application/product-card/product-card.dto'
import {
  ProductCardDomainError,
  useCreateProductCardRevisionMutation,
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

export function ProductRevisionDialog({
  product,
  actorUserId,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const revisionMutation = useCreateProductCardRevisionMutation()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Revizyon nedeni zorunludur.')
      return
    }
    setError(null)
    try {
      await revisionMutation.mutateAsync({
        id: product.id,
        expectedVersion: product.version,
        actorUserId,
        reason: reason.trim(),
      })
      setReason('')
      onSuccess?.('Yeni revizyon oluşturuldu.')
      onClose()
    } catch (err) {
      setError(err instanceof ProductCardDomainError ? err.message : 'Revizyon oluşturulamadı.')
    }
  }

  return (
    <ProductCardModal
      open={open}
      title="Yeni Revizyon"
      description={`${product.productCode} — mevcut rev. ${product.revisions.at(-1)?.revisionNo ?? 1}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Önceki revizyonlar değişmez. Yeni revizyon <strong>Draft</strong> durumunda başlar.
        </p>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">Değişiklik Nedeni *</span>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Örn. BOM güncellemesi, yeni renk varyantı"
            required
          />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" disabled={revisionMutation.isPending || !reason.trim()}>
            {revisionMutation.isPending ? 'Oluşturuluyor…' : 'Revizyon Oluştur'}
          </Button>
        </div>
      </form>
    </ProductCardModal>
  )
}
