import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { UseOrderCreateReturn } from '../../hooks/use-order-create'

type TabProps = { form: UseOrderCreateReturn }

export function ColorsTab({ form }: TabProps) {
  const { form: f, addColor, updateColor, removeColor } = form

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Sipariş renkleri — istenen kadar renk eklenebilir.
        </p>
        <Button type="button" size="sm" variant="outline" onClick={addColor}>
          <Plus className="size-4" /> Renk Ekle
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Renk Kodu</th>
              <th className="px-4 py-3 font-medium">Pantone</th>
              <th className="px-4 py-3 font-medium">Açıklama</th>
              <th className="px-4 py-3 font-medium">Aktif</th>
              <th className="px-4 py-3 font-medium w-16" />
            </tr>
          </thead>
          <tbody>
            {f.colors.map((color) => (
              <tr key={color.id} className="border-b border-border/60">
                <td className="px-4 py-2">
                  <Input
                    value={color.code}
                    onChange={(e) =>
                      updateColor(color.id, 'code', e.target.value.toUpperCase())
                    }
                    placeholder="INDIGO"
                    className="h-8"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    value={color.pantone}
                    onChange={(e) =>
                      updateColor(color.id, 'pantone', e.target.value)
                    }
                    placeholder="19-4029 TCX"
                    className="h-8"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    value={color.description}
                    onChange={(e) =>
                      updateColor(color.id, 'description', e.target.value)
                    }
                    placeholder="Renk açıklaması"
                    className="h-8"
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={color.active}
                    onChange={(e) =>
                      updateColor(color.id, 'active', e.target.checked)
                    }
                    className="size-4 accent-primary"
                  />
                </td>
                <td className="px-4 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeColor(color.id)}
                    disabled={f.colors.length <= 1}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
