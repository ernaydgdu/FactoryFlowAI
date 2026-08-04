import { useState, type FormEvent } from 'react'

import type { BomDesignerViewDto, BomLineCommandInput } from '@/application/bom-designer/bom-designer.dto'
import {
  BomDomainError,
  useCreateBomRevisionMutation,
} from '@/application/bom-designer/use-bom-designer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCardModal } from '@/modules/product-card/components/ProductCardModal'

type Props = {
  bom: BomDesignerViewDto
  lines: BomLineCommandInput[]
  actorUserId: string
  open: boolean
  onClose: () => void
  onSuccess?: (msg: string) => void
}

export function BomRevisionDialog({ bom, lines, actorUserId, open, onClose, onSuccess }: Props) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const revisionMutation = useCreateBomRevisionMutation(bom.productId)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Revizyon nedeni zorunludur.')
      return
    }
    setError(null)
    try {
      await revisionMutation.mutateAsync({
        expectedVersion: bom.productVersion,
        actorUserId,
        reason: reason.trim(),
        lines,
      })
      setReason('')
      onSuccess?.('BOM revizyonu oluşturuldu.')
      onClose()
    } catch (err) {
      setError(err instanceof BomDomainError ? err.message : 'Revizyon başarısız.')
    }
  }

  return (
    <ProductCardModal
      open={open}
      title="BOM Revizyonu"
      description={`Mevcut Rev. ${bom.revisionNo} → yeni taslak revizyon`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {lines.length} satır yeni revizyona kopyalanır. Önceki revizyonlar immutable kalır.
        </p>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">Değişiklik Nedeni *</span>
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
