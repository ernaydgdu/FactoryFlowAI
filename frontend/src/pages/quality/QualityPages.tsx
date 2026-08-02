import { useState } from 'react'

import { ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QUALITY_INSPECTIONS } from '@/domain/data/workflows'
import type { QualityModule } from '@/domain/types/workflows'
import { useDataList } from '@/hooks/use-data-list'

const aqlTone = {
  Pass: 'success',
  Fail: 'danger',
  Pending: 'warning',
} as const

function QualityModulePage({ module }: { module: QualityModule }) {
  const data = QUALITY_INSPECTIONS.filter((q) => q.module === module)
  const list = useDataList({
    data,
    searchFields: [(q) => q.inspectionNo, (q) => q.orderNo, (q) => q.inspector],
    initialSort: { key: 'inspectionNo', direction: 'desc' },
  })

  const failCount = data.filter((q) => q.aqlResult === 'Fail').length

  return (
    <ErpModuleShell
      title={`${module} Inspection`}
      description="Defect kodları, AQL, reject, repair ve 2. kalite takibi."
      kpis={[
        { label: 'Toplam Kontrol', value: String(data.length), hint: module },
        { label: 'AQL Fail', value: String(failCount), hint: 'Red' },
        { label: 'Toplam Reject', value: String(data.reduce((s, q) => s + q.rejectQty, 0)), hint: 'Adet' },
        { label: '2. Kalite', value: String(data.reduce((s, q) => s + q.secondQualityQty, 0)), hint: 'Adet' },
      ]}
      toolbar={
        <ErpToolbar
          searchPlaceholder="Kontrol no, sipariş ara..."
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
        {list.paginated.map((q) => (
          <Card key={q.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm font-medium">{q.inspectionNo} — {q.orderNo}</CardTitle>
                <div className="flex items-center gap-2">
                  <StatusBadge label={`AQL ${q.aqlLevel}`} tone="default" />
                  <StatusBadge label={q.aqlResult} tone={aqlTone[q.aqlResult]} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
                <Metric label="Kontrol" value={q.inspectedQty} />
                <Metric label="Pass" value={q.passedQty} />
                <Metric label="Reject" value={q.rejectQty} highlight="danger" />
                <Metric label="Repair" value={q.repairQty} highlight="warning" />
                <Metric label="2. Kalite" value={q.secondQualityQty} />
              </div>
              {q.defects.length > 0 ? (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-1 pr-3">Kod</th>
                      <th className="py-1 pr-3">Defect</th>
                      <th className="py-1">Adet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.defects.map((d) => (
                      <tr key={d.code} className="border-b border-border/40">
                        <td className="py-1 pr-3 font-mono">{d.code}</td>
                        <td className="py-1 pr-3">{d.name}</td>
                        <td className="py-1">{d.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {q.inspector} · {q.date}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </ErpModuleShell>
  )
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string
  value: number
  highlight?: 'danger' | 'warning'
}) {
  const color =
    highlight === 'danger'
      ? 'text-destructive'
      : highlight === 'warning'
        ? 'text-amber-700'
        : ''
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}

export function QualityHubPage() {
  const [tab, setTab] = useState<QualityModule>('Inline')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Kalite Kontrol</h2>
        <p className="text-muted-foreground">
          Inline, Midline ve Final Inspection — AQL bazlı kalite yönetimi
        </p>
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as QualityModule)}>
        <TabsList>
          <TabsTrigger value="Inline">Inline</TabsTrigger>
          <TabsTrigger value="Midline">Midline</TabsTrigger>
          <TabsTrigger value="Final">Final</TabsTrigger>
        </TabsList>
        <TabsContent value="Inline"><QualityModulePage module="Inline" /></TabsContent>
        <TabsContent value="Midline"><QualityModulePage module="Midline" /></TabsContent>
        <TabsContent value="Final"><QualityModulePage module="Final" /></TabsContent>
      </Tabs>
    </div>
  )
}

export function InlineQualityPage() {
  return <QualityModulePage module="Inline" />
}

export function MidlineQualityPage() {
  return <QualityModulePage module="Midline" />
}

export function FinalQualityPage() {
  return <QualityModulePage module="Final" />
}
