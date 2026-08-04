/**
 * Phase 4 Module 2 — Production Planning (scheduling).
 * Kaynak: persisted üretim emirleri + master-data kapasiteleri
 * (scheduling / constraint engine). Demo SALES_ORDERS kullanılmaz.
 */
import { useState } from 'react'
import type { DragEvent } from 'react'

import type { ScheduleBoardCellDto } from '@/application/production-planning/production-planning-scheduling.dto'
import {
  useCapacityView,
  useLineLoad,
  useReschedulePlanMutation,
  useScheduleBoard,
} from '@/application/production-planning/use-production-planning-scheduling'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { SchedulingMode } from '@/domain/production-planning/planning.types'

const ACTOR = 'pilot-user'

function ModeToggle({ mode, onChange }: { mode: SchedulingMode; onChange: (m: SchedulingMode) => void }) {
  return (
    <div className="flex gap-1">
      {(['FINITE', 'INFINITE'] as const).map((m) => (
        <Button key={m} size="sm" variant={mode === m ? 'default' : 'outline'} onClick={() => onChange(m)}>
          {m === 'FINITE' ? 'Finite (kapasiteli)' : 'Infinite (sınırsız)'}
        </Button>
      ))}
    </div>
  )
}

function ViolationsPanel({ violations }: { violations: { id: string; severity: string; message: string }[] }) {
  if (violations.length === 0) {
    return <p className="text-sm text-muted-foreground">Kısıt ihlali yok.</p>
  }
  return (
    <ul className="space-y-1">
      {violations.map((v) => (
        <li key={v.id} className={cn('text-sm', v.severity === 'error' ? 'text-destructive' : 'text-amber-600')}>
          {v.severity === 'error' ? '●' : '○'} {v.message}
        </li>
      ))}
    </ul>
  )
}

/**
 * Haftalık/Günlük çizelge board'u. Drag & Drop yalnızca iskelet:
 * UE çipi sürüklenip bir hat-gün hücresine bırakıldığında emrin plan
 * başlangıcı o güne taşınır (süre korunur, optimizasyon yapılmaz).
 */
export function PlanningBoardPage() {
  const [mode, setMode] = useState<SchedulingMode>('FINITE')
  const { data: board, isLoading } = useScheduleBoard(mode)
  const rescheduleMutation = useReschedulePlanMutation()

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!board) return null

  const orderByNo = new Map(board.orders.map((o) => [o.productionOrderNo, o]))

  const handleDrop = (e: DragEvent, targetDate: string, targetLineCode: string) => {
    e.preventDefault()
    const productionOrderNo = e.dataTransfer.getData('text/plain')
    const order = orderByNo.get(productionOrderNo)
    if (!order) return
    const start = order.scheduledStart ?? targetDate
    const finish = order.scheduledFinish ?? order.requestedFinish
    const durationMs = Math.max(0, new Date(finish).getTime() - new Date(start).getTime())
    const newFinish = new Date(new Date(`${targetDate}T00:00:00Z`).getTime() + durationMs)
      .toISOString()
      .slice(0, 10)
    rescheduleMutation.mutate({
      productionOrderNo,
      plannedStart: targetDate,
      plannedFinish: newFinish,
      lineCode: targetLineCode,
      actorUserId: ACTOR,
    })
  }

  const cellTitle = (cell: ScheduleBoardCellDto) =>
    cell.orders.map((o) => `${o.productionOrderNo}: ${o.qty}`).join('\n')

  return (
    <ErpModuleShell
      title="Planlama Board"
      description={`Haftalık/günlük çizelge — ${board.referenceDate} itibarıyla, ${mode === 'FINITE' ? 'finite' : 'infinite'} mod`}
      kpis={board.kpis}
    >
      <div className="p-4 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <ModeToggle mode={mode} onChange={setMode} />
          {rescheduleMutation.isError && (
            <span className="text-sm text-destructive">
              {(rescheduleMutation.error as Error)?.message ?? 'Yeniden planlama başarısız.'}
            </span>
          )}
          {rescheduleMutation.isSuccess && (
            <span className="text-sm text-emerald-600">
              Plan güncellendi: {rescheduleMutation.data?.entityNo}
            </span>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hat × Gün Yük Izgarası</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-xs">
              <thead>
                <tr>
                  <th className="p-1 text-left font-medium text-muted-foreground">Hat</th>
                  {board.days.map((d) => (
                    <th key={d.date} className="p-1 text-center font-medium text-muted-foreground">
                      {d.dayLabel}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {board.rows.map((row) => (
                  <tr key={row.lineCode} className="border-t">
                    <td className="p-1 whitespace-nowrap font-medium">
                      {row.lineCode}
                      <span className="ml-1 text-muted-foreground">({row.capacityPerDay}/gün)</span>
                    </td>
                    {row.cells.map((cell) => (
                      <td
                        key={cell.date}
                        title={cellTitle(cell)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, cell.date, row.lineCode)}
                        className={cn(
                          'p-1 text-center align-middle border-l',
                          cell.overloaded
                            ? 'bg-destructive/15 text-destructive font-semibold'
                            : cell.loadQty > 0
                              ? 'bg-emerald-500/10'
                              : 'bg-muted/30 text-muted-foreground',
                        )}
                      >
                        {cell.loadQty > 0 ? `${Math.round(cell.loadQty)} (%${cell.utilizationPercent})` : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Çizelgelenen Üretim Emirleri (sürükle → hücreye bırak)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {board.orders.map((o) => (
                <div
                  key={o.productionOrderNo}
                  draggable
                  data-draggable="true"
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', o.productionOrderNo)}
                  className={cn(
                    'cursor-grab rounded-md border px-2 py-1 text-xs',
                    o.overloaded ? 'border-destructive text-destructive' : 'border-border',
                  )}
                >
                  <span className="font-medium">{o.productionOrderNo}</span> · {o.lineCode} ·{' '}
                  {Math.round(o.remainingQty)} adet
                  {o.shiftedDays > 0 && <span className="ml-1 text-amber-600">+{o.shiftedDays}g kayma</span>}
                </div>
              ))}
            </div>
            <DataTable
              rowKey={(o) => o.productionOrderNo}
              data={board.orders}
              columns={[
                { key: 'no', header: 'UE No', render: (o) => o.productionOrderNo },
                { key: 'product', header: 'Ürün', render: (o) => o.productName },
                { key: 'line', header: 'Hat', render: (o) => o.lineCode },
                { key: 'status', header: 'Durum', render: (o) => <StatusBadge {...o.status} /> },
                { key: 'qty', header: 'Kalan', render: (o) => Math.round(o.remainingQty) },
                { key: 'start', header: 'Plan Başlangıç', render: (o) => o.scheduledStart ?? '—' },
                { key: 'finish', header: 'Plan Bitiş', render: (o) => o.scheduledFinish ?? '—' },
                { key: 'termin', header: 'Termin', render: (o) => o.requestedFinish },
                {
                  key: 'shift',
                  header: 'Kayma',
                  render: (o) => (o.shiftedDays > 0 ? `${o.shiftedDays} iş günü` : '—'),
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kısıt İhlalleri (Constraint Engine)</CardTitle>
          </CardHeader>
          <CardContent>
            <ViolationsPanel violations={board.violations} />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function CapacityViewPage() {
  const [mode, setMode] = useState<SchedulingMode>('FINITE')
  const { data: view, isLoading } = useCapacityView(mode)

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!view) return null

  return (
    <ErpModuleShell
      title="Kapasite Görünümü"
      description="Atölye ve hat bazında zaman fazlı kapasite / yük dengesi"
      kpis={view.kpis}
    >
      <div className="p-4 pt-6 space-y-4">
        <ModeToggle mode={mode} onChange={setMode} />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atölye Kapasite Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(w) => w.workshopCode}
              data={view.workshops}
              columns={[
                { key: 'code', header: 'Atölye', render: (w) => w.workshopCode },
                { key: 'name', header: 'Ad', render: (w) => w.workshopName },
                { key: 'lines', header: 'Hat Sayısı', render: (w) => w.lineCount },
                { key: 'cap', header: 'Ufuk Kapasitesi', render: (w) => w.horizonCapacity },
                { key: 'load', header: 'Toplam Yük', render: (w) => Math.round(w.totalLoad) },
                { key: 'util', header: 'Doluluk', render: (w) => `%${w.utilizationPercent}` },
                { key: 'over', header: 'Aşırı Yüklü Gün', render: (w) => w.overloadedDays },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kısıt İhlalleri</CardTitle>
          </CardHeader>
          <CardContent>
            <ViolationsPanel violations={view.violations} />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function LineLoadPage() {
  const [mode, setMode] = useState<SchedulingMode>('FINITE')
  const { data: lines, isLoading } = useLineLoad(mode)

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  const rows = lines ?? []
  const kpis = [
    { label: 'Hat', value: String(rows.length), hint: 'Aktif üretim hattı' },
    {
      label: 'Ortalama Doluluk',
      value: `%${Math.round(rows.reduce((s, l) => s + l.utilizationPercent, 0) / Math.max(1, rows.length))}`,
      hint: 'Planlama ufku',
    },
    {
      label: 'Aşırı Yüklü Hat',
      value: String(rows.filter((l) => l.overloadedDays > 0).length),
      hint: 'En az 1 gün aşırı yük',
    },
  ]

  return (
    <ErpModuleShell title="Hat Yükü" description="Work center load — hat bazında planlama ufku yükü" kpis={kpis}>
      <div className="p-4 pt-6 space-y-4">
        <ModeToggle mode={mode} onChange={setMode} />
        <DataTable
          rowKey={(l) => l.lineCode}
          data={rows}
          columns={[
            { key: 'code', header: 'Hat', render: (l) => l.lineCode },
            { key: 'name', header: 'Ad', render: (l) => l.lineName },
            { key: 'ws', header: 'Atölye', render: (l) => l.workshopName },
            { key: 'cap', header: 'Günlük Kapasite', render: (l) => l.capacityPerDay },
            { key: 'horizon', header: 'Ufuk Kapasitesi', render: (l) => l.horizonCapacity },
            { key: 'load', header: 'Toplam Yük', render: (l) => Math.round(l.totalLoad) },
            { key: 'util', header: 'Doluluk', render: (l) => `%${l.utilizationPercent}` },
            { key: 'status', header: 'Durum', render: (l) => <StatusBadge {...l.loadStatus} /> },
            { key: 'orders', header: 'Aktif UE', render: (l) => l.activeOrderCount },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}
