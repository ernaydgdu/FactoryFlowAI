import { Plus, Trash2 } from 'lucide-react'

import { selectClass } from '@/components/erp/form-field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { STOCK_CARDS } from '@/domain/data/stock-cards'

import type { UseOrderCreateReturn } from '../../hooks/use-order-create'

type TabProps = { form: UseOrderCreateReturn }

export function BomTab({ form }: TabProps) {
  const {
    form: f,
    totals,
    materialRequirements,
    addBomLine,
    updateBomLine,
    removeBomLine,
  } = form

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Ürün reçetesi (BOM) — tüm malzemeler stok kartından seçilir, elle yazılmaz.
          </p>
          <p className="mt-1 text-sm font-medium text-primary">
            {totals.grandTotal.toLocaleString('tr-TR')} adet → MRP otomatik hesaplanır
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={addBomLine}>
          <Plus className="size-4" /> Satır Ekle
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-3 font-medium">Malzeme</th>
              <th className="px-3 py-3 font-medium">Kategori</th>
              <th className="px-3 py-3 font-medium">Kod</th>
              <th className="px-3 py-3 font-medium">Depo</th>
              <th className="px-3 py-3 font-medium">Birim</th>
              <th className="px-3 py-3 font-medium">Sarfiyat</th>
              <th className="px-3 py-3 font-medium">Fire %</th>
              <th className="px-3 py-3 font-medium">Gerçek Sarf.</th>
              <th className="px-3 py-3 font-medium">Tedarikçi</th>
              <th className="px-3 py-3 font-medium text-right">MRP İhtiyaç</th>
              <th className="w-10 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {f.bom.map((line) => {
              const card = STOCK_CARDS.find((s) => s.id === line.stockCardId)
              const req = materialRequirements.find(
                (r) => r.stockCardId === line.stockCardId,
              )
              return (
                <tr key={line.id} className="border-b border-border/60">
                  <td className="px-3 py-2">
                    <select
                      value={line.stockCardId}
                      onChange={(e) =>
                        updateBomLine(line.id, 'stockCardId', e.target.value)
                      }
                      className={selectClass + ' h-8 min-w-[180px] text-xs'}
                    >
                      <option value="">Stok kartı seçin</option>
                      {STOCK_CARDS.map((sc) => (
                        <option key={sc.id} value={sc.id}>
                          {sc.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{card?.category ?? '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs">{card?.code ?? '—'}</td>
                  <td className="px-3 py-2 text-xs">{card?.warehouseName ?? '—'}</td>
                  <td className="px-3 py-2">{card?.unit ?? '—'}</td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.001}
                      value={line.consumption || ''}
                      onChange={(e) =>
                        updateBomLine(line.id, 'consumption', Number(e.target.value) || 0)
                      }
                      className="h-8 w-20"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={line.wastePercent || ''}
                      onChange={(e) =>
                        updateBomLine(line.id, 'wastePercent', Number(e.target.value) || 0)
                      }
                      className="h-8 w-16"
                    />
                  </td>
                  <td className="px-3 py-2 tabular-nums">{line.actualConsumption || '—'}</td>
                  <td className="px-3 py-2 text-xs">{card?.supplier ?? '—'}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">
                    {req
                      ? `${req.totalRequired.toLocaleString('tr-TR')} ${req.unit}`
                      : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeBomLine(line.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
