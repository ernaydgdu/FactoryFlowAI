import { SIZE_PRESETS } from '@/modules/core/data/master-data'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

import type { UseOrderCreateReturn } from '../../hooks/use-order-create'

type TabProps = { form: UseOrderCreateReturn }

export function SizesMatrixTab({ form }: TabProps) {
  const {
    form: f,
    totals,
    toggleSize,
    setMatrixQty,
  } = form

  const activeColors = f.colors.filter((c) => c.active)

  return (
    <div className="space-y-6">
      <section>
        <h4 className="mb-3 text-sm font-medium">Beden Seçimi</h4>
        <div className="space-y-3">
          {(
            [
              ['Harf Beden', SIZE_PRESETS.letter],
              ['Sayısal Beden', SIZE_PRESETS.numeric],
              ['Bebek Beden', SIZE_PRESETS.baby],
            ] as const
          ).map(([label, sizes]) => (
            <div key={label}>
              <p className="mb-1.5 text-xs text-muted-foreground">{label}</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const selected = f.sizes.includes(size)
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={cn(
                        'rounded-md border px-3 py-1 text-sm transition-colors',
                        selected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:bg-muted/60',
                      )}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        {f.sizes.length === 0 ? (
          <p className="mt-2 text-sm text-amber-600">
            En az bir beden seçilmelidir.
          </p>
        ) : null}
      </section>

      {f.sizes.length > 0 && activeColors.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium">Renk × Beden Matrisi</h4>
            <p className="text-sm font-semibold tabular-nums text-primary">
              Toplam: {totals.grandTotal.toLocaleString('tr-TR')} adet
            </p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Renk</th>
                  {f.sizes.map((size) => (
                    <th key={size} className="px-3 py-3 text-center font-medium">
                      {size}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right font-medium">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {activeColors.map((color) => (
                  <tr key={color.id} className="border-b border-border/60">
                    <td className="px-4 py-2 font-medium whitespace-nowrap">
                      {color.code || '—'}
                    </td>
                    {f.sizes.map((size) => (
                      <td key={size} className="px-2 py-2">
                        <Input
                          type="number"
                          min={0}
                          value={f.matrix[color.id]?.[size] ?? ''}
                          onChange={(e) =>
                            setMatrixQty(
                              color.id,
                              size,
                              Number(e.target.value) || 0,
                            )
                          }
                          className="h-8 w-20 text-center tabular-nums"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-2 text-right font-medium tabular-nums">
                      {(totals.byColor[color.id] ?? 0).toLocaleString('tr-TR')}
                    </td>
                  </tr>
                ))}
                <tr className="bg-muted/30 font-medium">
                  <td className="px-4 py-2">Toplam</td>
                  {f.sizes.map((size) => (
                    <td key={size} className="px-3 py-2 text-center tabular-nums">
                      {(totals.bySize[size] ?? 0).toLocaleString('tr-TR')}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right tabular-nums text-primary">
                    {totals.grandTotal.toLocaleString('tr-TR')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  )
}
