import { selectClass } from '@/components/erp/form-field'
import { Input } from '@/components/ui/input'

import type { UseOrderCreateReturn } from '../../hooks/use-order-create'

type TabProps = { form: UseOrderCreateReturn }

export function TerminTab({ form }: TabProps) {
  const { form: f, updateMilestone } = form

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Termin planı ve kritik milestone takibi — EXF tarihine göre planlanır.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Milestone</th>
              <th className="px-4 py-3 font-medium">Tarih</th>
              <th className="px-4 py-3 font-medium">Sorumlu</th>
              <th className="px-4 py-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {f.milestones.map((ms) => (
              <tr key={ms.id} className="border-b border-border/60">
                <td className="px-4 py-2 font-medium">{ms.name}</td>
                <td className="px-4 py-2">
                  <Input
                    type="date"
                    value={ms.date}
                    onChange={(e) =>
                      updateMilestone(ms.id, 'date', e.target.value)
                    }
                    className="h-8"
                  />
                </td>
                <td className="px-4 py-2">
                  <Input
                    value={ms.responsible}
                    onChange={(e) =>
                      updateMilestone(ms.id, 'responsible', e.target.value)
                    }
                    className="h-8"
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    value={ms.status}
                    onChange={(e) =>
                      updateMilestone(ms.id, 'status', e.target.value)
                    }
                    className={selectClass + ' h-8 text-xs'}
                  >
                    <option value="Planlandı">Planlandı</option>
                    <option value="Onaylandı">Onaylandı</option>
                    <option value="Gecikti">Gecikti</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {f.general.exf ? (
        <p className="text-sm">
          Hedef EXF:{' '}
          <span className="font-medium text-primary">{f.general.exf}</span>
        </p>
      ) : null}
    </div>
  )
}
