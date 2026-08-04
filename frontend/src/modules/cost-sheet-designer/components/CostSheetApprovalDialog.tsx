import { useState, type FormEvent } from 'react'

import type { CostSheetDesignerViewDto } from '@/application/cost-sheet-designer/cost-sheet-designer.dto'
import {
  CostSheetDomainError,
  useApproveCostSheetMutation,
} from '@/application/cost-sheet-designer/use-cost-sheet-designer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCardModal } from '@/modules/product-card/components/ProductCardModal'

type Props = {
  costSheet: CostSheetDesignerViewDto
  actorUserId: string
  open: boolean
  onClose: () => void
  onSuccess?: (msg: string) => void
}

export function CostSheetApprovalDialog({ costSheet, actorUserId, open, onClose, onSuccess }: Props) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const approveMutation = useApproveCostSheetMutation(costSheet.productId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await approveMutation.mutateAsync({
        expectedVersion: costSheet.productVersion,
        actorUserId,
        comment: comment.trim() || undefined,
      })
      setComment('')
      onSuccess?.('Maliyet çizelgesi onaylandı.')
      onClose()
    } catch (err) {
      setError(err instanceof CostSheetDomainError ? err.message : 'Onay başarısız.')
    }
  }

  return (
    <ProductCardModal
      open={open}
      title="Maliyet Onayı"
      description={`${costSheet.productCode} — Rev. ${costSheet.revisionNo}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Onay sonrası çizelge <strong>Approved</strong> durumuna geçer; ardından revizyon aktive edilebilir.
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
