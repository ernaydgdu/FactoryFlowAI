import { ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CONTAINER_PLANS } from '@/domain/data/workflows'
import { useDataList } from '@/hooks/use-data-list'

const containerTone = {
  Planlandı: 'muted',
  Yüklendi: 'warning',
  Yolda: 'default',
  Varış: 'success',
} as const

export function ContainerPlanningPage() {
  const list = useDataList({
    data: CONTAINER_PLANS,
    searchFields: [
      (c) => c.containerNo,
      (c) => c.bookingNo,
      (c) => c.forwarder,
      (c) => c.orderNos.join(' '),
    ],
    initialSort: { key: 'containerNo', direction: 'asc' },
  })

  return (
    <ErpModuleShell
      title="Konteyner Planı"
      description="Siparişlerin konteynere atanması — ETD, ETA, forwarder, booking, seal."
      kpis={[
        { label: 'Konteyner', value: String(CONTAINER_PLANS.length), hint: 'Planlı' },
        { label: 'Yolda', value: String(CONTAINER_PLANS.filter((c) => c.status === 'Yolda').length), hint: 'Transit' },
        { label: 'Toplam Koli', value: String(CONTAINER_PLANS.reduce((s, c) => s + c.totalCartons, 0)), hint: 'Yüklenecek' },
        { label: 'Toplam Adet', value: CONTAINER_PLANS.reduce((s, c) => s + c.totalQty, 0).toLocaleString('tr-TR'), hint: 'Sevkiyat' },
      ]}
      toolbar={
        <ErpToolbar
          searchPlaceholder="Konteyner, booking, forwarder ara..."
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
      <div className="space-y-4 p-4 pt-6">
        {list.paginated.map((container) => (
          <Card key={container.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{container.containerNo}</CardTitle>
                <StatusBadge label={container.status} tone={containerTone[container.status]} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Info label="Booking" value={container.bookingNo} />
                <Info label="Tip" value={container.containerType} />
                <Info label="ETD" value={container.etd} />
                <Info label="ETA" value={container.eta} />
                <Info label="Forwarder" value={container.forwarder} />
                <Info label="Seal" value={container.sealNo} />
                <Info label="Koli" value={String(container.totalCartons)} />
                <Info label="Adet" value={container.totalQty.toLocaleString('tr-TR')} />
              </div>
              <div className="mt-3 rounded-md border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">Atanan Siparişler</p>
                <p className="mt-1 text-sm">{container.orderNos.join(', ')}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ErpModuleShell>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  )
}
