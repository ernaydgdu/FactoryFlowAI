import { Plus } from 'lucide-react'
import { useState } from 'react'

import { DataTable, ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { FABRIC_ROLLS } from '@/domain/data/workflows'
import { useDataList } from '@/hooks/use-data-list'

const rollStatusTone = {
  Serbest: 'success',
  Rezerve: 'warning',
  Kesimde: 'default',
  Tüketildi: 'muted',
} as const

export function FabricReceiptPage() {
  const [quality, setQuality] = useState('all')
  const list = useDataList({
    data: FABRIC_ROLLS,
    searchFields: [
      (r) => r.lot,
      (r) => r.rollNo,
      (r) => r.fabricCode,
      (r) => r.color,
      (r) => r.batch,
      (r) => r.dyeLot,
      (r) => r.receiptNo,
    ],
    filterFn: quality === 'all' ? undefined : (r) => r.quality === quality,
    initialSort: { key: 'rollNo', direction: 'asc' },
  })

  const totalMeters = FABRIC_ROLLS.reduce((s, r) => s + r.meters, 0)
  const reserved = FABRIC_ROLLS.filter((r) => r.status === 'Rezerve').length

  return (
    <ErpModuleShell
      title="Kumaş Girişi — Top Top"
      description="Lot, top, metre, kg, en, gramaj, renk, parti, boya lotu, raf ve palet takibi."
      kpis={[
        { label: 'Top Sayısı', value: String(FABRIC_ROLLS.length), hint: 'Depoda' },
        { label: 'Toplam Metre', value: `${totalMeters.toLocaleString('tr-TR')} m`, hint: 'Serbest + rezerve' },
        { label: 'Rezerve Top', value: String(reserved), hint: 'Siparişe bağlı' },
        { label: '1. Kalite', value: String(FABRIC_ROLLS.filter((r) => r.quality === '1. Kalite').length), hint: 'Kullanılabilir' },
      ]}
      toolbar={
        <ErpToolbar
          searchPlaceholder="Lot, top no, renk, parti ara..."
          searchValue={list.search}
          onSearchChange={list.setSearch}
          filters={[
            {
              id: 'q',
              label: 'Kalite',
              value: quality,
              onChange: (v) => { setQuality(v); list.setPage(1) },
              options: [
                { label: 'Tümü', value: 'all' },
                { label: '1. Kalite', value: '1. Kalite' },
                { label: '2. Kalite', value: '2. Kalite' },
              ],
            },
          ]}
          actions={<Button size="sm"><Plus className="size-4" /> Top Girişi</Button>}
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
            { key: 'receipt', header: 'Giriş No', render: (r) => r.receiptNo },
            { key: 'lot', header: 'LOT', render: (r) => <span className="font-medium">{r.lot}</span> },
            { key: 'top', header: 'TOP', render: (r) => r.rollNo },
            { key: 'fabric', header: 'Kumaş', render: (r) => `${r.fabricCode} — ${r.fabricName}` },
            { key: 'm', header: 'Metre', render: (r) => r.meters.toLocaleString('tr-TR') },
            { key: 'kg', header: 'KG', render: (r) => r.kg.toLocaleString('tr-TR') },
            { key: 'width', header: 'En (cm)', render: (r) => r.width },
            { key: 'weight', header: 'Gramaj', render: (r) => r.weight },
            { key: 'color', header: 'Renk', render: (r) => r.color },
            { key: 'batch', header: 'Parti', render: (r) => r.batch },
            { key: 'dye', header: 'Boya Lotu', render: (r) => r.dyeLot },
            { key: 'quality', header: 'Kalite', render: (r) => r.quality },
            { key: 'wh', header: 'Depo', render: (r) => r.warehouse },
            { key: 'rack', header: 'Raf', render: (r) => r.rack },
            { key: 'pallet', header: 'Palet', render: (r) => r.pallet },
            {
              key: 'status',
              header: 'Durum',
              render: (r) => <StatusBadge label={r.status} tone={rollStatusTone[r.status]} />,
            },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}
