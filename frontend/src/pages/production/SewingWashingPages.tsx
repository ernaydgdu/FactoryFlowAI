import { DataTable, ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import { SEWING_LINE_RECORDS, WASHING_LOTS } from '@/domain/data/workflows'
import { useDataList } from '@/hooks/use-data-list'

const sewingTone = {
  'Devam Ediyor': 'default',
  Tamamlandı: 'success',
  Duruş: 'danger',
} as const

const washTone = {
  Gönderildi: 'default',
  Bekliyor: 'muted',
  Yıkamada: 'warning',
  Geldi: 'default',
  'Kalite Bekliyor': 'warning',
  Tamamlandı: 'success',
} as const

export function SewingTrackingPage() {
  const list = useDataList({
    data: SEWING_LINE_RECORDS,
    searchFields: [(r) => r.lineCode, (r) => r.orderNo, (r) => r.operator],
    initialSort: { key: 'lineCode', direction: 'asc' },
  })

  const avgEff = Math.round(
    SEWING_LINE_RECORDS.reduce((s, r) => s + r.efficiency, 0) / SEWING_LINE_RECORDS.length,
  )

  return (
    <ErpModuleShell
      title="Dikim Takibi"
      description="Hat, operatör, plan/gerçekleşen, saatlik üretim, verim, duruş, fire ve rework."
      kpis={[
        { label: 'Aktif Hat', value: String(SEWING_LINE_RECORDS.filter((r) => r.status === 'Devam Ediyor').length), hint: 'Üretimde' },
        { label: 'Duruş', value: String(SEWING_LINE_RECORDS.filter((r) => r.status === 'Duruş').length), hint: 'Makine arızası vb.' },
        { label: 'Ort. Verim', value: `%${avgEff}`, hint: 'Günlük' },
        { label: 'Toplam Rework', value: String(SEWING_LINE_RECORDS.reduce((s, r) => s + r.reworkQty, 0)), hint: 'Adet' },
      ]}
      toolbar={
        <ErpToolbar
          searchPlaceholder="Hat, sipariş, operatör ara..."
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
          rowKey={(r) => r.id}
          data={list.paginated}
          columns={[
            { key: 'line', header: 'Hat', render: (r) => <span className="font-medium">{r.lineCode}</span> },
            { key: 'order', header: 'Sipariş', render: (r) => r.orderNo },
            { key: 'op', header: 'Operatör', render: (r) => r.operator },
            { key: 'shift', header: 'Vardiya', render: (r) => r.shift },
            { key: 'plan', header: 'Plan', render: (r) => r.plannedQty.toLocaleString('tr-TR') },
            { key: 'actual', header: 'Gerçekleşen', render: (r) => r.producedQty.toLocaleString('tr-TR') },
            { key: 'hourly', header: 'Saatlik', render: (r) => r.hourlyRate },
            { key: 'eff', header: 'Verim %', render: (r) => `%${r.efficiency}` },
            { key: 'down', header: 'Duruş (dk)', render: (r) => r.downtimeMin || '—' },
            { key: 'waste', header: 'Fire', render: (r) => r.wasteQty },
            { key: 'rework', header: 'Rework', render: (r) => r.reworkQty || '—' },
            {
              key: 'status',
              header: 'Durum',
              render: (r) => <StatusBadge label={r.status} tone={sewingTone[r.status]} />,
            },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

export function WashingTrackingPage() {
  const list = useDataList({
    data: WASHING_LOTS,
    searchFields: [(r) => r.lotNo, (r) => r.orderNo, (r) => r.color, (r) => r.facility],
    initialSort: { key: 'lotNo', direction: 'asc' },
  })

  return (
    <ErpModuleShell
      title="Yıkama Takibi"
      description="Lot bazlı yıkama süreci — gönderildi, yıkamada, geldi, kalite bekliyor."
      kpis={[
        { label: 'Yıkamada', value: String(WASHING_LOTS.filter((r) => r.status === 'Yıkamada').length), hint: 'Fason tesis' },
        { label: 'Gönderildi', value: String(WASHING_LOTS.filter((r) => r.status === 'Gönderildi').length), hint: 'Yolda' },
        { label: 'Kalite Bekliyor', value: String(WASHING_LOTS.filter((r) => r.status === 'Kalite Bekliyor').length), hint: 'QC öncesi' },
        { label: 'Tamamlandı', value: String(WASHING_LOTS.filter((r) => r.status === 'Tamamlandı').length), hint: 'Üretime döndü' },
      ]}
      toolbar={
        <ErpToolbar
          searchPlaceholder="Lot, sipariş, renk ara..."
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
          rowKey={(r) => r.id}
          data={list.paginated}
          columns={[
            { key: 'lot', header: 'Lot No', render: (r) => <span className="font-medium">{r.lotNo}</span> },
            { key: 'order', header: 'Sipariş', render: (r) => r.orderNo },
            { key: 'color', header: 'Renk', render: (r) => r.color },
            { key: 'qty', header: 'Adet', render: (r) => r.quantity.toLocaleString('tr-TR') },
            { key: 'type', header: 'Yıkama Tipi', render: (r) => r.washType },
            { key: 'facility', header: 'Tesis', render: (r) => r.facility },
            { key: 'sent', header: 'Gönderim', render: (r) => r.sentDate },
            { key: 'expected', header: 'Beklenen Dönüş', render: (r) => r.expectedReturn },
            { key: 'actual', header: 'Gerçek Dönüş', render: (r) => r.actualReturn ?? '—' },
            {
              key: 'status',
              header: 'Durum',
              render: (r) => <StatusBadge label={r.status} tone={washTone[r.status]} />,
            },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}
