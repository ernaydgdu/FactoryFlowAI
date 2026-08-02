import { useParams, Link } from 'react-router-dom'

import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { useBomDesigner } from '@/application/bom-designer/use-bom-designer'

export function BomDesignerPage() {
  const { productId = '1' } = useParams<{ productId: string }>()
  const { data: bom, isLoading, isError } = useBomDesigner(productId)

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (isError || !bom) return <p className="p-8">BOM bulunamadı</p>

  return (
    <ErpModuleShell
      title="BOM Designer"
      description={`${bom.productCode} — ${bom.productName}`}
      headerActions={
        <Button variant="outline" asChild>
          <Link to={`/products/${productId}`}>← Ürün Kartına Dön</Link>
        </Button>
      }
      kpis={[
        { label: 'BOM Satırı', value: String(bom.lineCount), hint: 'Malzeme' },
        { label: 'Revizyon', value: String(bom.revisionNo), hint: 'Aktif' },
        { label: 'Sipariş Adet', value: bom.orderQty.toLocaleString('tr-TR'), hint: 'Hesaplama baz' },
        { label: 'Validasyon', value: bom.isValid ? 'Geçerli' : 'Hatalı', hint: bom.validationErrors.length ? bom.validationErrors[0] : 'OK' },
      ]}
    >
      <div className="overflow-x-auto p-4 pt-6">
        <DataTable
          rowKey={(l) => l.id}
          data={bom.lines}
          columns={[
            { key: 'code', header: 'Kod', render: (l) => l.materialCode },
            { key: 'name', header: 'Malzeme', render: (l) => l.materialName },
            { key: 'cat', header: 'Kategori', render: (l) => l.category },
            { key: 'cons', header: 'Tüketim', render: (l) => `${l.consumption} ${l.unit}` },
            { key: 'waste', header: 'Fire %', render: (l) => `${l.wastePercent}%` },
            { key: 'gross', header: 'Brüt İhtiyaç', render: (l) => l.grossRequired.toLocaleString('tr-TR') },
            { key: 'net', header: 'Net İhtiyaç', render: (l) => l.netRequired.toLocaleString('tr-TR') },
            { key: 'wh', header: 'Depo', render: (l) => l.warehouseCode },
            { key: 'req', header: 'Zorunluluk', render: (l) => <StatusBadge label={l.valid.label} tone={l.valid.tone} /> },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}
