import { Link, useParams } from 'react-router-dom'

import { DataTable, ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MERCHANDISING_RECORDS, getMerchandisingByOrderId } from '@/domain/data/workflows'
import type { SampleStage } from '@/domain/types/workflows'
import { useDataList } from '@/hooks/use-data-list'

const statusTone = {
  'Üretime Hazır': 'success',
  Onaylı: 'success',
  Sample: 'default',
  Hazırlık: 'muted',
} as const

const sampleTone = {
  Onaylandı: 'success',
  Reddedildi: 'danger',
  'Onay Bekliyor': 'warning',
  Gönderildi: 'default',
  Bekliyor: 'muted',
  Revize: 'warning',
} as const

export function MerchandisingListPage() {
  const list = useDataList({
    data: MERCHANDISING_RECORDS,
    searchFields: [(m) => m.orderNo, (m) => m.buyer, (m) => m.merchandiser, (m) => m.collection],
    initialSort: { key: 'orderNo', direction: 'desc' },
  })

  const kpis = [
    { label: 'Hazırlıkta', value: String(MERCHANDISING_RECORDS.filter((m) => m.status === 'Hazırlık').length), hint: 'Sample başlamadı' },
    { label: 'Sample Süreci', value: String(MERCHANDISING_RECORDS.filter((m) => m.status === 'Sample').length), hint: 'Onay bekliyor' },
    { label: 'Üretime Hazır', value: String(MERCHANDISING_RECORDS.filter((m) => m.status === 'Üretime Hazır').length), hint: 'Tüm sample OK' },
    { label: 'Ort. Hazırlık', value: '%62', hint: 'Sample tamamlanma' },
  ]

  return (
    <ErpModuleShell
      title="Merchandising"
      description="Sipariş üretime girmeden önce — sample, onay ve ticari koşullar."
      kpis={kpis}
      toolbar={
        <ErpToolbar
          searchPlaceholder="Sipariş, buyer, merchandiser ara..."
          searchValue={list.search}
          onSearchChange={list.setSearch}
        />
      }
      pagination={{
        page: list.page,
        totalPages: list.totalPages,
        pageSize: list.pageSize,
        totalCount: list.totalCount,
        onPageChange: list.setPage,
        onPageSizeChange: list.setPageSize,
      }}
    >
      <div className="overflow-x-auto p-4 pt-6">
        <DataTable
          rowKey={(m) => m.id}
          data={list.paginated}
          columns={[
            {
              key: 'order',
              header: 'Sipariş',
              render: (m) => (
                <Link to={`/merchandising/${m.orderId}`} className="font-medium text-primary hover:underline">
                  {m.orderNo}
                </Link>
              ),
            },
            { key: 'buyer', header: 'Buyer', render: (m) => m.buyer },
            { key: 'merch', header: 'Merchandiser', render: (m) => m.merchandiser },
            { key: 'collection', header: 'Collection', render: (m) => m.collection },
            { key: 'incoterm', header: 'Incoterm', render: (m) => m.incoterm },
            { key: 'fob', header: 'FOB', render: (m) => `$${m.fob.toFixed(2)}` },
            { key: 'cm', header: 'CM', render: (m) => `$${m.cm.toFixed(2)}` },
            {
              key: 'ready',
              header: 'Hazırlık',
              render: (m) => (
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${m.readinessPercent}%` }} />
                  </div>
                  <span className="text-xs tabular-nums">{m.readinessPercent}%</span>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Durum',
              render: (m) => <StatusBadge label={m.status} tone={statusTone[m.status]} />,
            },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function MerchandisingDetailPage({ orderId }: { orderId: string }) {
  const record = getMerchandisingByOrderId(orderId)
  if (!record) return <p>Kayıt bulunamadı</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{record.orderNo}</h2>
          <p className="text-muted-foreground">Merchandising — {record.buyer} / {record.merchandiser}</p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/merchandising">← Listeye dön</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Delivery Window" value={record.deliveryWindow} />
        <InfoCard label="Payment Term" value={record.paymentTerm} />
        <InfoCard label="Incoterm / Country" value={`${record.incoterm} · ${record.country}`} />
        <InfoCard label="FOB / CM" value={`$${record.fob} / $${record.cm}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sample Takip</CardTitle>
        </CardHeader>
        <CardContent>
          <SampleTimeline samples={record.samples} />
        </CardContent>
      </Card>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </CardContent>
    </Card>
  )
}

function SampleTimeline({ samples }: { samples: SampleStage[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2">Sample</th>
            <th className="px-3 py-2">Durum</th>
            <th className="px-3 py-2">Versiyon</th>
            <th className="px-3 py-2">Gönderim</th>
            <th className="px-3 py-2">Onay</th>
            <th className="px-3 py-2">Not</th>
          </tr>
        </thead>
        <tbody>
          {samples.map((s) => (
            <tr key={s.id} className="border-b border-border/60">
              <td className="px-3 py-2 font-medium">{s.type}</td>
              <td className="px-3 py-2">
                <StatusBadge label={s.status} tone={sampleTone[s.status]} />
              </td>
              <td className="px-3 py-2">v{s.version}</td>
              <td className="px-3 py-2">{s.sentDate ?? '—'}</td>
              <td className="px-3 py-2">{s.approvedDate ?? '—'}</td>
              <td className="px-3 py-2 text-muted-foreground">{s.notes ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function MerchandisingDetailRoute() {
  const { orderId } = useParams<{ orderId: string }>()
  if (!orderId) return null
  return <MerchandisingDetailPage orderId={orderId} />
}
