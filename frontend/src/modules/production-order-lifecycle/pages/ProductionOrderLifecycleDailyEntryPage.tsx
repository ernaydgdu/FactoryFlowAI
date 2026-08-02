import { useState } from 'react'

import { DataTable, ErpModuleShell, ErpToolbar } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useAddDailyProductionEntryLifecycle,
  useProductionOrderDailyEntries,
  useProductionOrderLifecycleList,
} from '@/application/production-order-lifecycle/use-production-order-lifecycle'
import { useDataList } from '@/hooks/use-data-list'

export function ProductionOrderLifecycleDailyEntryPage() {
  const { data: orders = [] } = useProductionOrderLifecycleList()
  const activeOrders = orders.filter((o) => o.lifecycleStatus === 'In Production' || o.lifecycleStatus === 'Paused')
  const [selectedPo, setSelectedPo] = useState('')
  const { data: entries = [] } = useProductionOrderDailyEntries(selectedPo || undefined)
  const addEntry = useAddDailyProductionEntryLifecycle()

  const [form, setForm] = useState({
    entryDate: new Date().toISOString().slice(0, 10),
    planned: 0,
    produced: 0,
    reject: 0,
    rework: 0,
    secondQuality: 0,
    fire: 0,
  })

  const list = useDataList({
    data: selectedPo ? entries : [],
    searchFields: [(e) => e.productionOrderNo, (e) => e.recordedBy],
    initialSort: { key: 'entryDate', direction: 'desc' },
  })

  const submit = () => {
    if (!selectedPo) return
    addEntry.mutate({
      productionOrderNo: selectedPo,
      ...form,
      recordedBy: 'operator-01',
    })
  }

  return (
    <ErpModuleShell
      title="Günlük Üretim Girişi"
      description="Production Order ile ilişkili — plan, gerçek, fire, rework, 2.kalite"
      kpis={[
        { label: 'Aktif UE', value: String(activeOrders.length), hint: 'In Production / Paused' },
        { label: 'Kayıt', value: String(entries.length), hint: selectedPo || 'UE seçin' },
      ]}
      toolbar={
        <ErpToolbar searchPlaceholder="UE, operatör ara..." searchValue={list.search} onSearchChange={list.setSearch} />
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
      <div className="grid gap-6 p-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg border p-4">
          <div className="space-y-2">
            <Label>Üretim Emri</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              value={selectedPo}
              onChange={(e) => setSelectedPo(e.target.value)}
            >
              <option value="">UE seçin</option>
              {activeOrders.map((o) => (
                <option key={o.productionOrderNo} value={o.productionOrderNo}>
                  {o.productionOrderNo} — {o.salesOrderNo}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(['entryDate', 'planned', 'produced', 'reject', 'rework', 'secondQuality', 'fire'] as const).map((key) => (
              <div key={key} className="space-y-1">
                <Label>{key}</Label>
                <Input
                  type={key === 'entryDate' ? 'date' : 'number'}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      [key]: key === 'entryDate' ? e.target.value : Number(e.target.value),
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <Button onClick={submit} disabled={!selectedPo || addEntry.isPending}>
            Kaydet
          </Button>
          {addEntry.isError ? (
            <p className="text-sm text-destructive">{(addEntry.error as Error).message}</p>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <DataTable
            rowKey={(e) => e.id}
            data={list.paginated}
            columns={[
              { key: 'date', header: 'Tarih', render: (e) => e.entryDate },
              { key: 'plan', header: 'Plan', render: (e) => e.planned },
              { key: 'prod', header: 'Gerçek', render: (e) => e.produced },
              { key: 'reject', header: 'Red', render: (e) => e.reject },
              { key: 'rework', header: 'Rework', render: (e) => e.rework },
              { key: '2nd', header: '2.Kalite', render: (e) => e.secondQuality },
              { key: 'fire', header: 'Fire', render: (e) => e.fire },
              { key: 'by', header: 'Operatör', render: (e) => e.recordedBy },
            ]}
          />
        </div>
      </div>
    </ErpModuleShell>
  )
}
