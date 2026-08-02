import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrderProgressBar } from '@/modules/orders/components/OrderProgressBar'
import { useCapacityPlanning } from '@/application/production-planning/use-production-planning'

export function CapacityPlanningPage() {
  const { data, isLoading } = useCapacityPlanning()
  if (isLoading || !data) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell title="Kapasite Planlama" description="Atölye, hat, makine ve operatör bazında kapasite" kpis={[]}>
      <Tabs defaultValue="workshop" className="p-4">
        <TabsList>
          <TabsTrigger value="workshop">Atölye</TabsTrigger>
          <TabsTrigger value="line">Hat</TabsTrigger>
          <TabsTrigger value="machine">Makine</TabsTrigger>
          <TabsTrigger value="operator">Operatör</TabsTrigger>
        </TabsList>
        <TabsContent value="workshop">
          <DataTable rowKey={(w) => w.code} data={data.workshops} columns={[
            { key: 'code', header: 'Kod', render: (w) => w.code },
            { key: 'name', header: 'Atölye', render: (w) => w.name },
            { key: 'cap', header: 'Kapasite', render: (w) => w.monthlyCapacity.toLocaleString('tr-TR') },
            { key: 'alloc', header: 'Tahsis', render: (w) => w.allocated.toLocaleString('tr-TR') },
            { key: 'rem', header: 'Kalan', render: (w) => w.remaining.toLocaleString('tr-TR') },
            { key: 'util', header: 'Doluluk', render: (w) => <OrderProgressBar value={w.utilizationPercent} /> },
            { key: 'st', header: 'Durum', render: (w) => <StatusBadge label={w.status.label} tone={w.status.tone} /> },
          ]} />
        </TabsContent>
        <TabsContent value="line">
          <DataTable rowKey={(l) => l.id} data={data.lines} columns={[
            { key: 'code', header: 'Hat', render: (l) => l.code },
            { key: 'ws', header: 'Atölye', render: (l) => l.workshop },
            { key: 'cap', header: 'Günlük Kap.', render: (l) => l.capacityPerDay },
            { key: 'load', header: 'Yük', render: (l) => `%${l.loadPercent}` },
          ]} />
        </TabsContent>
        <TabsContent value="machine">
          <DataTable rowKey={(m) => m.id} data={data.machines} columns={[
            { key: 'code', header: 'Kod', render: (m) => m.code },
            { key: 'name', header: 'Makine', render: (m) => m.name },
            { key: 'line', header: 'Hat', render: (m) => m.line },
            { key: 'type', header: 'Tip', render: (m) => m.machineType },
          ]} />
        </TabsContent>
        <TabsContent value="operator">
          <DataTable rowKey={(o) => o.id} data={data.operators} columns={[
            { key: 'name', header: 'Operatör', render: (o) => o.name },
            { key: 'role', header: 'Rol', render: (o) => o.role },
            { key: 'ws', header: 'Atölye', render: (o) => o.workshop },
          ]} />
        </TabsContent>
      </Tabs>
    </ErpModuleShell>
  )
}
