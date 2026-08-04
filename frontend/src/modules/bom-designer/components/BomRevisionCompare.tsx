import { useBomRevisionCompare } from '@/application/bom-designer/use-bom-designer'
import { DataTable } from '@/components/erp'

type Props = {
  productId: string
  revisionRecordId: string | null
}

export function BomRevisionCompare({ productId, revisionRecordId }: Props) {
  const { data, isLoading } = useBomRevisionCompare(productId, revisionRecordId)

  if (!revisionRecordId) {
    return <p className="text-sm text-muted-foreground">Karşılaştırmak için bir revizyon seçin.</p>
  }
  if (isLoading) return <p className="text-sm text-muted-foreground">Yükleniyor…</p>
  if (!data) return <p className="text-sm text-muted-foreground">Revizyon bulunamadı.</p>

  const comparedMap = new Map(data.compared.map((l) => [l.stockCardId, l]))

  const rows = data.current.map((line) => {
    const old = comparedMap.get(line.stockCardId)
    return {
      id: line.id,
      material: line.materialCode,
      currentCons: line.consumption,
      oldCons: old?.consumption ?? '—',
      currentWaste: line.wastePercent,
      oldWaste: old?.wastePercent ?? '—',
      changed: old
        ? old.consumption !== line.consumption || old.wastePercent !== line.wastePercent
        : true,
    }
  })

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Aktif BOM ile seçili entity revizyon payload karşılaştırması.
      </p>
      <DataTable
        rowKey={(r) => r.id}
        data={rows}
        columns={[
          { key: 'mat', header: 'Malzeme', render: (r) => r.material },
          { key: 'oldC', header: 'Eski Tüketim', render: (r) => String(r.oldCons) },
          { key: 'newC', header: 'Güncel Tüketim', render: (r) => String(r.currentCons) },
          { key: 'oldW', header: 'Eski Fire %', render: (r) => String(r.oldWaste) },
          { key: 'newW', header: 'Güncel Fire %', render: (r) => String(r.currentWaste) },
          {
            key: 'chg',
            header: 'Değişti',
            render: (r) => (r.changed ? 'Evet' : 'Hayır'),
          },
        ]}
      />
    </div>
  )
}
