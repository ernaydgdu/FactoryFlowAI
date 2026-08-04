import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { DataTable, ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import {
  useApproveMrpMutation,
  useMrpDashboard,
  useMrpKpis,
  useRegenerateMrpMutation,
  useReleaseProductionSuggestionsMutation,
  useReleasePurchaseSuggestionsMutation,
  useRunMrpMutation,
} from '@/application/mrp/use-mrp'
import type { MrpLineItemDto } from '@/application/mrp/mrp.dto'
import { useSizeSetList } from '@/application/planning/use-planning'
import { useDataList } from '@/hooks/use-data-list'

const ACTOR = 'planner-user'

function MrpActionBar({
  runId,
  version,
  status,
}: {
  runId: string
  version: number
  status: string
}) {
  const runMutation = useRunMrpMutation()
  const regenMutation = useRegenerateMrpMutation(runId)
  const approveMutation = useApproveMrpMutation(runId)
  const releasePurchase = useReleasePurchaseSuggestionsMutation(runId)
  const releaseProduction = useReleaseProductionSuggestionsMutation(runId)

  const busy =
    runMutation.isPending ||
    regenMutation.isPending ||
    approveMutation.isPending ||
    releasePurchase.isPending ||
    releaseProduction.isPending

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => runMutation.mutate({ actorUserId: ACTOR })}
      >
        MRP Run
      </Button>
      {runId && (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => regenMutation.mutate({ expectedVersion: version, actorUserId: ACTOR })}
          >
            Regenerate
          </Button>
          {status !== 'Approved' && status !== 'Released' && (
            <Button
              size="sm"
              disabled={busy}
              onClick={() => approveMutation.mutate({ expectedVersion: version, actorUserId: ACTOR })}
            >
              Onayla
            </Button>
          )}
          {(status === 'Approved' || status === 'Released') && (
            <>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  releasePurchase.mutate({ expectedVersion: version, actorUserId: ACTOR })
                }
              >
                SAT Serbest Bırak
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() =>
                  releaseProduction.mutate({ expectedVersion: version, actorUserId: ACTOR })
                }
              >
                UE Serbest Bırak
              </Button>
            </>
          )}
        </>
      )}
    </div>
  )
}

function ResultGrid({ lines }: { lines: MrpLineItemDto[] }) {
  const list = useDataList({
    data: lines,
    searchFields: [
      (l) => l.materialCode,
      (l) => l.materialName,
      (l) => l.category,
      (l) => l.supplier,
    ],
    initialSort: { key: 'netShortage', direction: 'desc' },
  })

  return (
    <div className="space-y-4">
      <ErpToolbar
        searchPlaceholder="Malzeme kodu, ad, kategori..."
        searchValue={list.search}
        onSearchChange={list.setSearch}
      />
      <DataTable
        rowKey={(l) => l.id}
        data={list.paginated}
        columns={[
          { key: 'code', header: 'Kod', render: (l) => l.materialCode },
          { key: 'name', header: 'Malzeme', render: (l) => l.materialName },
          { key: 'cat', header: 'Kategori', render: (l) => l.category },
          {
            key: 'gross',
            header: 'Brüt İhtiyaç',
            render: (l) => `${l.grossRequirement.toLocaleString('tr-TR')} ${l.unit}`,
          },
          {
            key: 'net',
            header: 'Net İhtiyaç',
            render: (l) => `${l.netRequirement.toLocaleString('tr-TR')} ${l.unit}`,
          },
          {
            key: 'stock',
            header: 'Mevcut Stok',
            render: (l) => l.availableStock.toLocaleString('tr-TR'),
          },
          { key: 'reserved', header: 'Rezerve', render: (l) => l.reservedStock.toLocaleString('tr-TR') },
          { key: 'po', header: 'Açık SAT', render: (l) => l.openPurchaseQty.toLocaleString('tr-TR') },
          { key: 'prod', header: 'Açık UE', render: (l) => l.openProductionQty.toLocaleString('tr-TR') },
          { key: 'rop', header: 'ROP', render: (l) => l.reorderPoint.toLocaleString('tr-TR') },
          { key: 'lt', header: 'LT (S/P/T)', render: (l) => `${l.supplierLeadDays}/${l.productionLeadDays}/${l.transitLeadDays}` },
          { key: 'lots', header: 'Lot', render: (l) => (l.fabricLotCount > 0 ? String(l.fabricLotCount) : '—') },
          { key: 'var', header: 'Varyant', render: (l) => l.variantCount.toLocaleString('tr-TR') },
          {
            key: 'shortage',
            header: 'Net Eksik',
            render: (l) => (
              <span className={l.netShortage > 0 ? 'font-medium text-destructive' : ''}>
                {l.netShortage.toLocaleString('tr-TR')} {l.unit}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Durum',
            render: (l) => <StatusBadge label={l.status.label} tone={l.status.tone} />,
          },
        ]}
      />
    </div>
  )
}

export function MrpPage() {
  const { data: dashboard, isLoading } = useMrpDashboard()
  const { data: kpisData } = useMrpKpis()

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  const run = dashboard?.run
  const lines = dashboard?.lines ?? []
  const shortages = lines.filter((l) => l.netShortage > 0)

  return (
    <ErpModuleShell
      title="MRP — Malzeme İhtiyaç Planı"
      description="Sales Order → BOM → Stok → SAT → UE → Net İhtiyaç planlama motoru."
      kpis={kpisData?.items ?? []}
      toolbar={
        <MrpActionBar
          runId={run?.id ?? ''}
          version={run?.version ?? 0}
          status={run?.status.label ?? 'Draft'}
        />
      }
    >
      <div className="grid gap-6 p-4 pt-6">
        {run && (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <span className="font-medium">{run.runNo}</span>
            {' · '}
            <StatusBadge label={run.status.label} tone={run.status.tone} />
            {' · '}
            Rev {run.revisionNo} · {run.openOrderCount} açık sipariş · {run.variantCount} varyant ·{' '}
            {new Date(run.generatedAt).toLocaleString('tr-TR')}
            {' · '}
            Stok karşılama: {dashboard?.inventoryCoverage.percent ?? 0}%
          </div>
        )}

        {(dashboard?.productConsolidations.length ?? 0) > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Multi Sales Order — Ürün Konsolidasyonu
            </h2>
            <DataTable
              rowKey={(c) => c.productCode}
              data={dashboard!.productConsolidations}
              columns={[
                { key: 'code', header: 'Ürün', render: (c) => c.productCode },
                { key: 'name', header: 'Ad', render: (c) => c.productName },
                { key: 'qty', header: 'Toplam Adet', render: (c) => c.totalQuantity.toLocaleString('tr-TR') },
                { key: 'orders', header: 'Sipariş', render: (c) => c.orderCount },
                { key: 'nos', header: 'Sipariş No', render: (c) => c.orderNos.join(', ') },
              ]}
            />
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            MRP Result Grid
          </h2>
          <ResultGrid lines={lines} />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Material Shortage ({shortages.length})
            </h2>
            <div className="max-h-64 overflow-auto rounded-lg border">
              {shortages.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Eksik malzeme yok.</p>
              ) : (
                <ul className="divide-y text-sm">
                  {shortages.map((l) => (
                    <li key={l.id} className="flex justify-between px-4 py-2">
                      <span>
                        {l.materialName}{' '}
                        <span className="text-muted-foreground">({l.materialCode})</span>
                      </span>
                      <span className="font-medium text-destructive tabular-nums">
                        {l.netShortage} {l.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Exception Messages
            </h2>
            <div className="max-h-64 overflow-auto rounded-lg border">
              {(dashboard?.exceptions.length ?? 0) === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">İstisna yok.</p>
              ) : (
                <ul className="divide-y text-sm">
                  {dashboard!.exceptions.map((ex) => (
                    <li key={`${ex.code}-${ex.entityRef ?? ex.message}`} className="px-4 py-2">
                      <span className="font-mono text-xs text-muted-foreground">{ex.code}</span>
                      <span
                        className={
                          ex.severity === 'critical'
                            ? ' text-destructive'
                            : ' text-amber-700 dark:text-amber-400'
                        }
                      >
                        {' '}
                        {ex.message}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Purchase Suggestions — Tedarikçi Grupları
            </h2>
            <DataTable
              rowKey={(g) => g.supplier}
              data={dashboard?.purchaseGroups ?? []}
              columns={[
                { key: 'sup', header: 'Tedarikçi', render: (g) => g.supplier },
                {
                  key: 'qty',
                  header: 'Toplam Miktar',
                  render: (g) => g.totalQuantity.toLocaleString('tr-TR'),
                },
                { key: 'lines', header: 'Satır', render: (g) => g.lineCount },
                { key: 'date', header: 'Termin', render: (g) => g.earliestRequiredDate },
              ]}
            />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Production Suggestions — Atölye / Hat / Kapasite
            </h2>
            <DataTable
              rowKey={(g) => `${g.workshopCode}-${g.productionLineCode}`}
              data={dashboard?.productionGroups ?? []}
              columns={[
                { key: 'ws', header: 'Atölye', render: (g) => g.workshopName },
                { key: 'line', header: 'Hat', render: (g) => g.productionLineCode },
                { key: 'cap', header: 'Günlük Kap.', render: (g) => g.capacityPerDay.toLocaleString('tr-TR') },
                { key: 'alloc', header: 'Tahsis', render: (g) => g.allocatedQty.toLocaleString('tr-TR') },
                {
                  key: 'util',
                  header: 'Doluluk %',
                  render: (g) => `${g.utilizationPercent}%`,
                },
              ]}
            />
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Purchase Suggestions
            </h2>
            <DataTable
              rowKey={(s) => s.id}
              data={dashboard?.purchaseSuggestions ?? []}
              columns={[
                { key: 'mat', header: 'Malzeme', render: (s) => s.materialName },
                {
                  key: 'qty',
                  header: 'Miktar',
                  render: (s) => `${s.quantity.toLocaleString('tr-TR')} ${s.unit}`,
                },
                { key: 'sup', header: 'Tedarikçi', render: (s) => s.supplier },
                {
                  key: 'st',
                  header: 'Durum',
                  render: (s) => <StatusBadge label={s.status.label} tone={s.status.tone} />,
                },
              ]}
            />
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Production Suggestions
            </h2>
            <DataTable
              rowKey={(s) => s.id}
              data={dashboard?.productionSuggestions ?? []}
              columns={[
                {
                  key: 'order',
                  header: 'Sipariş',
                  render: (s) => (
                    <Link to={`/orders/${s.salesOrderId}`} className="text-primary hover:underline">
                      {s.orderNo}
                    </Link>
                  ),
                },
                { key: 'product', header: 'Ürün', render: (s) => s.productCode },
                { key: 'ws', header: 'Atölye', render: (s) => s.workshopCode },
                { key: 'line', header: 'Hat', render: (s) => s.productionLineCode },
                {
                  key: 'qty',
                  header: 'Adet',
                  render: (s) => s.quantity.toLocaleString('tr-TR'),
                },
                {
                  key: 'st',
                  header: 'Durum',
                  render: (s) => <StatusBadge label={s.status.label} tone={s.status.tone} />,
                },
              ]}
            />
          </section>
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Inventory Coverage
          </h2>
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span>Karşılanan malzeme</span>
              <span className="font-medium">
                {dashboard?.inventoryCoverage.covered ?? 0} / {dashboard?.inventoryCoverage.total ?? 0}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${dashboard?.inventoryCoverage.percent ?? 0}%` }}
              />
            </div>
          </div>
        </section>
      </div>
    </ErpModuleShell>
  )
}

export function SizeSetsPage() {
  const { data: sizeSets = [], isLoading } = useSizeSetList()
  const list = useDataList({
    data: sizeSets,
    searchFields: [(s) => s.name, (s) => s.productType],
    initialSort: { key: 'name', direction: 'asc' },
  })

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Beden Setleri"
      description="Ürün tipine göre beden set tanımları."
      kpis={[]}
      toolbar={<ErpToolbar searchPlaceholder="Set adı ara..." searchValue={list.search} onSearchChange={list.setSearch} />}
      pagination={{
        page: list.page,
        totalPages: list.totalPages,
        pageSize: list.pageSize,
        totalCount: list.totalCount,
        onPageChange: list.setPage,
        onPageSizeChange: list.setPageSize,
      }}
    >
      <div className="p-4 pt-6">
        <DataTable
          rowKey={(s) => s.id}
          data={list.paginated}
          columns={[
            { key: 'name', header: 'Set Adı', render: (s) => s.name },
            { key: 'type', header: 'Ürün Tipi', render: (s) => s.productType },
            { key: 'sizes', header: 'Bedenler', render: (s) => s.sizes.join(', ') },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}
