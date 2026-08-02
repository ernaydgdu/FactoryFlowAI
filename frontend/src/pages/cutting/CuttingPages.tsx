import { useMemo, useState } from 'react'

import { DataTable, ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CUTTING_ORDERS, PASTAL_PLANS } from '@/domain/data/workflows'
import { calculatePastal } from '@/domain/services/pastal-calculator'
import { useDataList } from '@/hooks/use-data-list'

const pastalTone = {
  Taslak: 'muted',
  Onaylı: 'default',
  Kesimde: 'warning',
  Tamamlandı: 'success',
} as const

const cutTone = {
  Planlandı: 'muted',
  Kesimde: 'warning',
  Tamamlandı: 'success',
} as const

export function CuttingWorkflowPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Kumaş Kesimi</h2>
        <p className="text-muted-foreground">
          Sipariş → Pastal → Marker → Kesim Emri → Gerçek Kesim → Fire → Kesim Deposu
        </p>
      </div>
      <Tabs defaultValue="cutting">
        <TabsList>
          <TabsTrigger value="cutting">Kesim Emirleri</TabsTrigger>
          <TabsTrigger value="pastal">Pastal Planlama</TabsTrigger>
        </TabsList>
        <TabsContent value="cutting" className="mt-4">
          <CuttingOrderList />
        </TabsContent>
        <TabsContent value="pastal" className="mt-4">
          <PastalPlanningSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CuttingOrderList() {
  const list = useDataList({
    data: CUTTING_ORDERS,
    searchFields: [(c) => c.cuttingNo, (c) => c.orderNo, (c) => c.pastalNo],
    initialSort: { key: 'cuttingNo', direction: 'desc' },
  })

  return (
    <ErpModuleShell
      title="Kesim Emirleri"
      description="Pastal bazlı kesim planı, gerçekleşen adet ve fire takibi."
      kpis={[
        { label: 'Aktif Kesim', value: String(CUTTING_ORDERS.filter((c) => c.status === 'Kesimde').length), hint: 'Devam eden' },
        { label: 'Planlandı', value: String(CUTTING_ORDERS.filter((c) => c.status === 'Planlandı').length), hint: 'Bekleyen' },
        { label: 'Ort. Fire', value: `%${Math.round(CUTTING_ORDERS.reduce((s, c) => s + c.wastePercent, 0) / CUTTING_ORDERS.length)}`, hint: 'Kesim kaybı' },
        { label: 'Tamamlandı', value: String(CUTTING_ORDERS.filter((c) => c.status === 'Tamamlandı').length), hint: 'Kesim deposu' },
      ]}
      toolbar={
        <ErpToolbar
          searchPlaceholder="Kesim no, sipariş, pastal ara..."
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
          rowKey={(c) => c.id}
          data={list.paginated}
          columns={[
            { key: 'cutNo', header: 'Kesim No', render: (c) => <span className="font-medium">{c.cuttingNo}</span> },
            { key: 'order', header: 'Sipariş', render: (c) => c.orderNo },
            { key: 'pastal', header: 'Pastal', render: (c) => c.pastalNo },
            { key: 'plan', header: 'Plan', render: (c) => c.plannedQty.toLocaleString('tr-TR') },
            { key: 'cutQty', header: 'Kesilen', render: (c) => c.cutQty.toLocaleString('tr-TR') },
            { key: 'waste', header: 'Fire', render: (c) => `${c.wasteQty} (%${c.wastePercent})` },
            { key: 'wh', header: 'Depo', render: (c) => c.warehouse },
            { key: 'date', header: 'Tarih', render: (c) => c.cuttingDate },
            {
              key: 'status',
              header: 'Durum',
              render: (c) => <StatusBadge label={c.status} tone={cutTone[c.status]} />,
            },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

function PastalPlanningSection() {
  const list = useDataList({
    data: PASTAL_PLANS,
    searchFields: [(p) => p.pastalNo, (p) => p.markerNo, (p) => p.orderNo],
    initialSort: { key: 'pastalNo', direction: 'asc' },
  })

  return (
    <div className="space-y-6">
      <PastalCalculator />
      <ErpModuleShell
        title="Pastal Planları"
        description="Onaylı pastal ve marker kayıtları — verim ve tüketim özeti."
        kpis={[
          { label: 'Pastal', value: String(PASTAL_PLANS.length), hint: 'Toplam plan' },
          { label: 'Ort. Verim', value: `%${Math.round(PASTAL_PLANS.reduce((s, p) => s + p.yieldPercent, 0) / PASTAL_PLANS.length)}`, hint: 'Marker verimi' },
          { label: 'Kesimde', value: String(PASTAL_PLANS.filter((p) => p.status === 'Kesimde').length), hint: 'Aktif' },
          { label: 'Toplam Tüketim', value: `${Math.round(PASTAL_PLANS.reduce((s, p) => s + p.fabricConsumption, 0)).toLocaleString('tr-TR')} m`, hint: 'Kumaş' },
        ]}
        toolbar={
          <ErpToolbar
            searchPlaceholder="Pastal, marker, sipariş ara..."
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
            rowKey={(p) => p.id}
            data={list.paginated}
            columns={[
              { key: 'pastal', header: 'Pastal', render: (p) => <span className="font-medium">{p.pastalNo}</span> },
              { key: 'marker', header: 'Marker', render: (p) => p.markerNo },
              { key: 'order', header: 'Sipariş', render: (p) => p.orderNo },
              { key: 'width', header: 'En (cm)', render: (p) => p.fabricWidth },
              { key: 'ply', header: 'Kat', render: (p) => p.plyCount },
              { key: 'len', header: 'Boy (m)', render: (p) => p.pastalLength },
              { key: 'yield', header: 'Verim %', render: (p) => `%${p.yieldPercent}` },
              { key: 'waste', header: 'Fire %', render: (p) => `%${p.wastePercent}` },
              { key: 'cons', header: 'Tüketim (m)', render: (p) => p.fabricConsumption.toLocaleString('tr-TR') },
              { key: 'pcs', header: 'Adet', render: (p) => p.plannedPieces.toLocaleString('tr-TR') },
              {
                key: 'status',
                header: 'Durum',
                render: (p) => <StatusBadge label={p.status} tone={pastalTone[p.status]} />,
              },
            ]}
          />
        </div>
      </ErpModuleShell>
    </div>
  )
}

function PastalCalculator() {
  const [fabricWidth, setFabricWidth] = useState(150)
  const [plyCount, setPlyCount] = useState(25)
  const [pastalLength, setPastalLength] = useState(8)
  const [markerEfficiency, setMarkerEfficiency] = useState(85)
  const [wastePercent, setWastePercent] = useState(4)
  const [consumptionPerPiece, setConsumptionPerPiece] = useState(1.58)
  const [orderQty, setOrderQty] = useState(5000)

  const result = useMemo(
    () =>
      calculatePastal({
        fabricWidth,
        plyCount,
        pastalLength,
        markerEfficiency,
        wastePercent,
        consumptionPerPiece,
        orderQty,
      }),
    [fabricWidth, plyCount, pastalLength, markerEfficiency, wastePercent, consumptionPerPiece, orderQty],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pastal Hesaplama</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-7">
          <Field label="Kumaş Eni (cm)" value={fabricWidth} onChange={setFabricWidth} />
          <Field label="Kat Adedi" value={plyCount} onChange={setPlyCount} />
          <Field label="Pastal Boyu (m)" value={pastalLength} onChange={setPastalLength} step={0.5} />
          <Field label="Verim %" value={markerEfficiency} onChange={setMarkerEfficiency} />
          <Field label="Fire %" value={wastePercent} onChange={setWastePercent} />
          <Field label="Parça Tüketim (m)" value={consumptionPerPiece} onChange={setConsumptionPerPiece} step={0.01} />
          <Field label="Sipariş Adedi" value={orderQty} onChange={setOrderQty} />
        </div>
        <div className="mt-4 grid gap-3 rounded-lg border bg-muted/30 p-4 sm:grid-cols-4">
          <Result label="Pastal Başına Adet" value={String(result.piecesPerPastal)} />
          <Result label="Gerekli Pastal" value={String(result.pastalsNeeded)} />
          <Result label="Toplam Kumaş (m)" value={result.fabricConsumption.toLocaleString('tr-TR')} />
          <Result label="Verim / Fire" value={`%${result.yieldPercent} / %${result.wastePercent}`} />
        </div>
        <div className="mt-3">
          <Button size="sm">Pastal Oluştur</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  )
}
