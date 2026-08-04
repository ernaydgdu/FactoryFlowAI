import { useState, type FormEvent } from 'react'

import type {
  CostSheetDesignerViewDto,
  CostSheetLineCommandInput,
} from '@/application/cost-sheet-designer/cost-sheet-designer.dto'
import {
  CostSheetDomainError,
  useCreateCostSheetRevisionMutation,
} from '@/application/cost-sheet-designer/use-cost-sheet-designer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCardModal } from '@/modules/product-card/components/ProductCardModal'

type Props = {
  costSheet: CostSheetDesignerViewDto
  lines: CostSheetLineCommandInput[]
  actorUserId: string
  open: boolean
  onClose: () => void
  onSuccess?: (msg: string) => void
}

export function CostSheetRevisionDialog({ costSheet, lines, actorUserId, open, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const revisionMutation = useCreateCostSheetRevisionMutation(costSheet.productId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Revizyon nedeni zorunludur.')
      return
    }
    setError(null)
    try {
      await revisionMutation.mutateAsync({
        expectedVersion: costSheet.productVersion,
        actorUserId,
        reason: reason.trim(),
        lines,
      })
      setReason('')
      onSuccess?.('Maliyet revizyonu oluşturuldu.')
      onClose()
    } catch (err) {
      setError(err instanceof CostSheetDomainError ? err.message : 'Revizyon başarısız.')
    }
  }

  return (
    <ProductCardModal
      open={open}
      title="Maliyet Revizyonu"
      description={`${costSheet.productCode} — Mevcut Rev. ${costSheet.revisionNo}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Yeni revizyon taslak olarak oluşturulur. Mevcut satır tutarları taşınır.
        </p>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">Değişiklik Nedeni</span>
          <Input value={reason} onChange={(e) => setReason(e.target.value)} required />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
          <Button type="submit" disabled={revisionMutation.isPending}>
            {revisionMutation.isPending ? 'Oluşturuluyor…' : 'Revizyon Oluştur'}
          </Button>
        </div>
      </form>
    </ProductCardModal>
  )
}
