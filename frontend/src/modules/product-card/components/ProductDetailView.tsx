import { Link } from 'react-router-dom'

import { DataTable, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ProductCardDetailDto } from '@/application/product-card/product-card.dto'

type TabId = 'overview' | 'bom' | 'colors' | 'sizes' | 'technical' | 'revisions' | 'relations' | 'documents' | 'timeline'

type Props = {
  product: ProductCardDetailDto
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Genel' },
  { id: 'bom', label: 'BOM' },
  { id: 'colors', label: 'Renkler' },
  { id: 'sizes', label: 'Beden Seti' },
  { id: 'technical', label: 'Teknik' },
  { id: 'revisions', label: 'Revizyonlar' },
  { id: 'relations', label: 'İlişkiler' },
  { id: 'documents', label: 'Dokümanlar' },
  { id: 'timeline', label: 'Timeline' },
]

function FieldGrid({ fields }: { fields: [string, string][] }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="font-medium">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function ProductDetailView({ product, activeTab, onTabChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">{product.productCode}</h2>
            <StatusBadge label={product.status.label} tone={product.status.tone} />
          </div>
          <p className="text-muted-foreground">{product.productName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {product.customerModelNo} · {product.internalModelNo}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/products">← Listeye dön</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-1 border-b pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Müşteri & Ticari</CardTitle></CardHeader>
            <CardContent>
              <FieldGrid fields={[
                ['Müşteri', product.header.customer],
                ['Marka', product.header.brand],
                ['Buyer', product.header.buyer],
                ['Merchandiser', product.header.merchandiser],
                ['Sezon', product.header.season],
                ['Koleksiyon', product.header.collection],
              ]} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Sınıflandırma</CardTitle></CardHeader>
            <CardContent>
              <FieldGrid fields={[
                ['Ürün Grubu', product.classification.productGroup],
                ['Alt Grup', product.classification.subGroup],
                ['Cinsiyet', product.classification.gender],
                ['Yaş Grubu', product.classification.ageGroup],
                ['Fit', product.classification.fit],
                ['GTIP', product.classification.gtip],
                ['Menşei', product.classification.countryOfOrigin],
              ]} />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'bom' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Bill of Materials — {product.bom.length} satır</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/products/${product.id}/bom`}>BOM Designer →</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/products/${product.id}/cost-sheet`}>Cost Sheet →</Link>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <DataTable
              rowKey={(l) => l.id}
              data={product.bom}
              columns={[
                { key: 'code', header: 'Kod', render: (l) => l.materialCode },
                { key: 'name', header: 'Malzeme', render: (l) => l.materialName },
                { key: 'cat', header: 'Kategori', render: (l) => l.category },
                { key: 'cons', header: 'Tüketim', render: (l) => `${l.consumption} ${l.unit}` },
                { key: 'waste', header: 'Fire %', render: (l) => `${l.wastePercent}%` },
                { key: 'actual', header: 'Net', render: (l) => l.actualConsumption.toFixed(3) },
                { key: 'wh', header: 'Depo', render: (l) => l.warehouseCode },
                { key: 'lt', header: 'LT', render: (l) => `${l.leadTimeDays} gün` },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'colors' && (
        <Card>
          <CardContent className="pt-6">
            <DataTable
              rowKey={(c) => c.id}
              data={product.colors}
              columns={[
                { key: 'code', header: 'Renk Kodu', render: (c) => c.colorCode },
                { key: 'name', header: 'Renk Adı', render: (c) => c.colorName },
                { key: 'pantone', header: 'Pantone', render: (c) => c.pantone ?? '—' },
                {
                  key: 'default',
                  header: 'Varsayılan',
                  render: (c) => c.isDefault ? <StatusBadge label="Evet" tone="success" /> : '—',
                },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'sizes' && (
        <Card>
          <CardContent className="pt-6">
            <p className="mb-4 text-sm text-muted-foreground">
              Beden Seti: <span className="font-medium text-foreground">{product.sizeMatrix.sizeSetName}</span>
              {' · '}{product.sizeMatrix.sizes.length} beden
            </p>
            <div className="flex flex-wrap gap-2">
              {product.sizeMatrix.sizes.map((s) => (
                <span key={s} className="rounded-md border px-3 py-1.5 text-sm font-medium">{s}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'technical' && (
        <Card>
          <CardContent className="pt-6">
            <FieldGrid fields={[
              ['Kumaş Tipi', product.technical.fabricType],
              ['Kompozisyon', product.technical.composition],
              ['Gramaj', product.technical.weight],
              ['Yıkama', product.technical.wash],
              ['Baskı', product.technical.print],
              ['Nakış', product.technical.embroidery],
              ['Kalıp', product.technical.pattern],
              ['Teknik Föy', product.technical.technicalSheetRef],
              ['Ölçü Tablosu', product.technical.measurementChartId],
              ['Operasyon Rotası', `${product.operationRouteCount} operasyon`],
              ['Kalite Planı', product.qualityPlanId],
            ]} />
          </CardContent>
        </Card>
      )}

      {activeTab === 'revisions' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Revizyon Geçmişi</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <DataTable
              rowKey={(r) => String(r.revisionNo)}
              data={product.revisions}
              columns={[
                { key: 'no', header: 'Rev.', render: (r) => String(r.revisionNo) },
                { key: 'status', header: 'Durum', render: (r) => r.status },
                { key: 'at', header: 'Tarih', render: (r) => new Date(r.changedAt).toLocaleString('tr-TR') },
                { key: 'by', header: 'Kullanıcı', render: (r) => r.changedBy },
                { key: 'note', header: 'Not', render: (r) => r.changeNote },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'relations' && (
        <Card>
          <CardContent className="pt-6">
            <DataTable
              rowKey={(r) => r.id}
              data={product.relations}
              columns={[
                { key: 'type', header: 'Entity', render: (r) => r.type },
                { key: 'label', header: 'İlişki', render: (r) => r.label },
                { key: 'kind', header: 'Tür', render: (r) => r.kind },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card>
          <CardContent className="pt-6">
            {product.documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz doküman yok.</p>
            ) : (
              <DataTable
                rowKey={(d) => d.id}
                data={product.documents}
                columns={[
                  { key: 'kind', header: 'Tür', render: (d) => d.kind },
                  { key: 'file', header: 'Dosya', render: (d) => d.fileName },
                  { key: 'by', header: 'Yükleyen', render: (d) => d.uploadedBy },
                  { key: 'at', header: 'Tarih', render: (d) => new Date(d.uploadedAt).toLocaleDateString('tr-TR') },
                ]}
              />
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'timeline' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {product.timeline.map((t) => (
                <div key={t.id} className="flex gap-4 border-b pb-3 last:border-0">
                  <div className="w-36 shrink-0 text-xs text-muted-foreground">
                    {new Date(t.occurredAt).toLocaleString('tr-TR')}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.action}</p>
                    <p className="text-xs text-muted-foreground">{t.actor}{t.reason ? ` — ${t.reason}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
