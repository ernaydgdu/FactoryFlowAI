import { useEffect, useState, type FormEvent } from 'react'

import type { BomDesignerLineDto, BomLineCommandInput } from '@/application/bom-designer/bom-designer.dto'
import { useStockCardOptions } from '@/application/bom-designer/use-bom-designer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { ProductCardModal } from '@/modules/product-card/components/ProductCardModal'

type Props = {
  open: boolean
  line?: BomDesignerLineDto | null
  onClose: () => void
  onSave: (line: BomLineCommandInput) => void
}

export function BomLineDialog({ open, line, onClose, onSave }: Props) {
  const { data: stockOptions = [] } = useStockCardOptions()
  const [stockCardId, setStockCardId] = useState('')
  const [consumption, setConsumption] = useState('1')
  const [wastePercent, setWastePercent] = useState('0')
  const [alternativeStockCardId, setAlternativeStockCardId] = useState('')
  const [notes, setNotes] = useState('')
  const [requirement, setRequirement] = useState<'Zorunlu' | 'Opsiyonel'>('Zorunlu')

  useEffect(() => {
    if (line) {
      setStockCardId(line.stockCardId)
      setConsumption(String(line.consumption))
      setWastePercent(String(line.wastePercent))
      setAlternativeStockCardId(line.alternativeStockCardId ?? '')
      setNotes(line.notes ?? '')
      setRequirement(line.requirement)
    } else {
      setStockCardId('')
      setConsumption('1')
      setWastePercent('3')
      setAlternativeStockCardId('')
      setNotes('')
      setRequirement('Zorunlu')
    }
  }, [line, open])

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave({
      id: line?.id,
      stockCardId,
      consumption: Number(consumption),
      wastePercent: Number(wastePercent),
      alternativeStockCardId: alternativeStockCardId || undefined,
      notes: notes || undefined,
      requirement,
    })
    onClose()
  }

  const selectClass =
    'flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm'

  return (
    <ProductCardModal
      open={open}
      title={line ? 'BOM Satırı Düzenle' : 'BOM Satırı Ekle'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-2 text-sm">
          <span className="font-medium">Malzeme (Stok Kartı) *</span>
          <select
            className={selectClass}
            value={stockCardId}
            onChange={(e) => setStockCardId(e.target.value)}
            required
          >
            <option value="">Seçin…</option>
            {stockOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Tüketim (UOM) *</span>
            <Input value={consumption} onChange={(e) => setConsumption(e.target.value)} required type="number" step="0.001" min="0" />
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Fire %</span>
            <Input value={wastePercent} onChange={(e) => setWastePercent(e.target.value)} type="number" step="0.1" min="0" />
          </label>
        </div>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">Alternatif Malzeme</span>
          <select
            className={selectClass}
            value={alternativeStockCardId}
            onChange={(e) => setAlternativeStockCardId(e.target.value)}
          >
            <option value="">Yok</option>
            {stockOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">Zorunluluk</span>
          <select
            className={selectClass}
            value={requirement}
            onChange={(e) => setRequirement(e.target.value as 'Zorunlu' | 'Opsiyonel')}
          >
            <option value="Zorunlu">Zorunlu</option>
            <option value="Opsiyonel">Opsiyonel</option>
          </select>
        </label>
        <label className="block space-y-2 text-sm">
          <span className="font-medium">Not</span>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Satır notu" />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
          <Button type="submit">Kaydet</Button>
        </div>
      </form>
    </ProductCardModal>
  )
}
