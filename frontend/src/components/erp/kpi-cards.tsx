import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export type KpiItem = {
  label: string
  value: string
  hint?: string
}

type KpiCardsProps = {
  items: KpiItem[]
  columns?: 2 | 3 | 4 | 5
}

export function KpiCards({ items, columns = 4 }: KpiCardsProps) {
  const gridClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 xl:grid-cols-3',
    4: 'sm:grid-cols-2 xl:grid-cols-4',
    5: 'sm:grid-cols-2 xl:grid-cols-5',
  }[columns]

  return (
    <div className={gridClass + ' grid gap-4'}>
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardDescription>{item.label}</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {item.value}
            </CardTitle>
          </CardHeader>
          {item.hint ? (
            <CardContent>
              <p className="text-xs text-muted-foreground">{item.hint}</p>
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  )
}
