import { selectClass } from '@/components/erp/form-field'
import { Input } from '@/components/ui/input'
import { WAREHOUSES } from '@/modules/core/data/warehouses'

import type { UseOrderCreateReturn } from '../../hooks/use-order-create'

type TabProps = { form: UseOrderCreateReturn }

export function OperationsTab({ form }: TabProps) {
  const { form: f, updateOperation } = form

  const workshops = WAREHOUSES.filter(
    (w) =>
      w.type === 'Fason' ||
      w.type === 'Kesimhane' ||
      w.type === 'Ütü Paket' ||
      w.type === 'Yıkama',
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="px-4 py-3 font-medium">Sıra</th>
            <th className="px-4 py-3 font-medium">Kod</th>
            <th className="px-4 py-3 font-medium">Operasyon</th>
            <th className="px-4 py-3 font-medium">Atölye / Hat</th>
            <th className="px-4 py-3 font-medium">Plan Gün</th>
            <th className="px-4 py-3 font-medium">Aktif</th>
          </tr>
        </thead>
        <tbody>
          {f.operations
            .slice()
            .sort((a, b) => a.sequence - b.sequence)
            .map((op) => (
              <tr key={op.id} className="border-b border-border/60">
                <td className="px-4 py-2 tabular-nums">{op.sequence}</td>
                <td className="px-4 py-2 font-mono text-xs">{op.code}</td>
                <td className="px-4 py-2">{op.name}</td>
                <td className="px-4 py-2">
                  <select
                    value={op.workshop}
                    onChange={(e) =>
                      updateOperation(op.id, 'workshop', e.target.value)
                    }
                    className={selectClass + ' h-8 text-xs'}
                  >
                    {workshops.map((w) => (
                      <option key={w.id} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <Input
                    type="number"
                    min={0}
                    step={0.5}
                    value={op.plannedDays}
                    onChange={(e) =>
                      updateOperation(
                        op.id,
                        'plannedDays',
                        Number(e.target.value) || 0,
                      )
                    }
                    className="h-8 w-20"
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={op.active}
                    onChange={(e) =>
                      updateOperation(op.id, 'active', e.target.checked)
                    }
                    className="size-4 accent-primary"
                  />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
