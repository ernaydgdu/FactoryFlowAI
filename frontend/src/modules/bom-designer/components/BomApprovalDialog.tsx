import { useState, type FormEvent } from 'react'

import type { BomDesignerViewDto } from '@/application/bom-designer/bom-designer.dto'
import {
  BomDomainError,
  useApproveBomMutation,
} from '@/application/bom-designer/use-bom-designer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCardModal } from '@/modules/product-card/components/ProductCardModal'

type Props = {
  bom: BomDesignerViewDto
  actorUserId: string
  open: boolean
  onClose: () => void
  onSuccess?: (msg: string) => void
}

export function BomApprovalDialog({ bom, actorUserId, open, onClose, onSuccess }: Props) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const approveMutation = useApproveBomMutation(bom.productId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await approveMutation.mutateAsync({
        expectedVersion: bom.productVersion,
        actorUserId,
        comment: comment.trim() || undefined,
      })
      setComment('')
      onSuccess?.('BOM onaylandı.')
      onClose()
    } catch (err) {
      setError(err instanceof BomDomainError ? err.message : 'Onay başarısız.')
    }
  }

  return (
    <ProductCardModal
      open={open}
      title="BOM Onayı"
      description={`${bom.productCode} — Rev. ${bom.revisionNo}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Onay sonrası BOM <strong>Approved</strong> durumuna geçer; ardından revizyon aktive edilebilir.
        </p>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">Onay Notu</span>
          <Input value={comment} onChange={(e) => setComment(e.target.value)} />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
          <Button type="submit" disabled={approveMutation.isPending}>
            {approveMutation.isPending ? 'Onaylanıyor…' : 'Onayla'}
          </Button>
        </div>
      </form>
    </ProductCardModal>
  )
}
