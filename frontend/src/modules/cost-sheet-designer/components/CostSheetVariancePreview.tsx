import type { CostSheetVarianceDto } from '@/application/cost-sheet-designer/cost-sheet-designer.dto'
import { DataTable } from '@/components/erp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
  variance: CostSheetVarianceDto[]
  totalCurrent: number
  totalPrevious: number
}

export function CostSheetVariancePreview({ variance, totalCurrent, totalPrevious }: Props) {
  const totalDelta = Math.round((totalCurrent - totalPrevious) * 100) / 100
  const totalDeltaPercent =
    totalPrevious > 0 ? Math.round((totalDelta / totalPrevious) * 1000) / 10 : totalCurrent > 0 ? 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Variance Preview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Mevcut Toplam</p>
            <p className="text-lg font-semibold tabular-nums">{totalCurrent.toFixed(2)} USD</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Önceki Toplam</p>
            <p className="text-lg font-semibold tabular-nums">{totalPrevious.toFixed(2)} USD</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Fark</p>
            <p className={`text-lg font-semibold tabular-nums ${totalDelta >= 0 ? 'text-destructive' : 'text-green-600'}`}>
              {totalDelta >= 0 ? '+' : ''}{totalDelta.toFixed(2)} ({totalDeltaPercent}%)
            </p>
          </div>
        </div>
        <DataTable<CostSheetVarianceDto>
          columns={[
            { key: 'label', header: 'Kalem', render: (r) => r.label },
            { key: 'previous', header: 'Önceki', render: (r) => r.previous.toFixed(2) },
            { key: 'current', header: 'Mevcut', render: (r) => r.current.toFixed(2) },
            {
              key: 'delta',
              header: 'Fark',
              render: (r) => (
                <span className={r.delta >= 0 ? 'text-destructive' : 'text-green-600'}>
                  {r.delta >= 0 ? '+' : ''}{r.delta.toFixed(2)} ({r.deltaPercent}%)
                </span>
              ),
            },
          ]}
          data={variance}
          rowKey={(r) => r.key}
        />
      </CardContent>
    </Card>
  )
}
