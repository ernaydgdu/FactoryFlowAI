/**
 * Manufacturing Memory Engine UI — browse immutable memory (no chat / LLM / ERP mutate).
 */
import { useState } from 'react'

import {
  useManufacturingMemoryCoverage,
  useManufacturingMemoryRun,
  useMemoryIndexes,
  useMemoryPreset,
  useMemoryRecords,
  useProductionOrderMemoryReplay,
} from '@/application/brain-memory/use-brain-memory'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { MemoryQueryPreset } from '@/domain/brain/manufacturing-memory'

const PRESETS: Array<{ id: MemoryQueryPreset; label: string }> = [
  { id: 'decisions-by-style', label: 'Decisions by style' },
  { id: 'supplier-delays', label: 'Supplier delays' },
  { id: 'planning-accuracy-by-machine', label: 'Planning by machine' },
  { id: 'recurring-bottlenecks', label: 'Recurring bottlenecks' },
  { id: 'historical-otif', label: 'Historical OTIF' },
  { id: 'recurring-quality-failures', label: 'Quality failures' },
  { id: 'recurring-purchasing-shortages', label: 'Purchasing shortages' },
  { id: 'recurring-inventory-shortages', label: 'Inventory shortages' },
]

export function BrainMemoryCoveragePage() {
  const { data: run, isLoading } = useManufacturingMemoryRun()
  const { data: coverage } = useManufacturingMemoryCoverage()
  if (isLoading || !coverage || !run) {
    return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  }

  return (
    <ErpModuleShell
      title="Memory Coverage"
      description="Manufacturing Memory Engine · append-only brainDecisionMemory · erpMutations=false"
      kpis={[
        { label: 'Records', value: String(coverage.totals.records) },
        { label: 'Modules', value: String(coverage.totals.modules) },
        { label: 'Index buckets', value: String(coverage.totals.indexBuckets) },
        { label: 'Presets', value: String(coverage.totals.queryPresets) },
        { label: 'Appended', value: String(run.appendStats.appended) },
        { label: 'Skipped', value: String(run.appendStats.skipped) },
        { label: 'Layers', value: coverage.implementedLayers.join(',') },
        { label: 'LLM', value: String(coverage.llmEnabled) },
      ]}
      kpiColumns={4}
    >
      <div className="p-4 pt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pipeline <StatusBadge label={coverage.pipeline.join(' → ')} />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <DataTable
              rowKey={(r) => r.module}
              data={coverage.byModule}
              columns={[
                { key: 'm', header: 'Module', render: (r) => r.module },
                { key: 'c', header: 'Records', render: (r) => r.count },
              ]}
            />
            <DataTable
              rowKey={(r) => r.index}
              data={coverage.byIndex}
              columns={[
                { key: 'i', header: 'Index', render: (r) => r.index },
                { key: 'c', header: 'Hits', render: (r) => r.count },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function BrainMemoryRecordsPage() {
  const { data = [], isLoading } = useMemoryRecords()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Memory records · immutable journal</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={data}
          columns={[
            { key: 't', header: 'Time', render: (r) => r.timestamp.slice(0, 19) },
            { key: 'm', header: 'Module', render: (r) => r.module },
            { key: 'a', header: 'Aggregate', render: (r) => r.aggregate },
            { key: 'e', header: 'Event', render: (r) => r.event },
            { key: 'd', header: 'Decision', render: (r) => r.decision },
            {
              key: 'act',
              header: 'Executed action',
              render: (r) => r.action.executed ?? r.action.status,
            },
            {
              key: 's',
              header: 'Outcome',
              render: (r) => <StatusBadge label={r.success} />,
            },
            { key: 'c', header: 'Conf', render: (r) => `${r.confidence}%` },
            { key: 'acc', header: 'Accuracy', render: (r) => r.accuracy.status },
            { key: 'tr', header: 'Trace', render: (r) => r.traceId },
            { key: 'x', header: 'Context', render: (r) => r.context },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function BrainMemoryIndexesPage() {
  const { data = [], isLoading } = useMemoryIndexes()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Deterministic memory indexes</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => `${r.index}::${r.key}`}
          data={data}
          columns={[
            { key: 'i', header: 'Index', render: (r) => r.index },
            { key: 'k', header: 'Key', render: (r) => r.key },
            { key: 'c', header: 'Count', render: (r) => r.count },
            { key: 'l', header: 'Last', render: (r) => r.lastTimestamp.slice(0, 19) },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function BrainMemoryQueriesPage() {
  const [preset, setPreset] = useState<MemoryQueryPreset>('recurring-bottlenecks')
  const [styleCode, setStyleCode] = useState('')
  const { data, isLoading } = useMemoryPreset(preset, styleCode || undefined)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <select
          className="rounded-md border px-3 py-2 text-sm"
          value={preset}
          onChange={(e) => setPreset(e.target.value as MemoryQueryPreset)}
        >
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        {preset === 'decisions-by-style' ? (
          <Input
            className="max-w-xs"
            placeholder="Style code (optional)"
            value={styleCode}
            onChange={(e) => setStyleCode(e.target.value)}
          />
        ) : null}
      </div>
      {isLoading || !data ? (
        <div className="p-8 text-muted-foreground">Yükleniyor…</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{data.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{data.description}</p>
            <div className="text-xs text-muted-foreground">
              Summary:{' '}
              {Object.entries(data.summary)
                .map(([k, v]) => `${k}=${String(v)}`)
                .join(' · ') || '—'}
            </div>
            <DataTable
              rowKey={(r) => r.id}
              data={data.records}
              columns={[
                { key: 'm', header: 'Module', render: (r) => r.module },
                { key: 'e', header: 'Event', render: (r) => r.event },
                { key: 'd', header: 'Decision', render: (r) => r.decision },
                { key: 'o', header: 'Outcome', render: (r) => r.success },
                { key: 'c', header: 'Context', render: (r) => r.context },
              ]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function BrainMemoryDecisionsPage() {
  const { data, isLoading } = useMemoryPreset('decisions-by-style')
  if (isLoading || !data) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Decision history <StatusBadge label={String(data.summary.styleCode ?? '')} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={data.records}
          columns={[
            { key: 't', header: 'Time', render: (r) => r.timestamp.slice(0, 19) },
            { key: 'd', header: 'Decision', render: (r) => r.decision },
            { key: 'e', header: 'Event', render: (r) => r.event },
            { key: 'm', header: 'Module', render: (r) => r.module },
            {
              key: 'con',
              header: 'Constraints',
              render: (r) => r.constraints.join(', ') || '—',
            },
            { key: 'f', header: 'Final', render: (r) => r.finalOutcome },
            { key: 'c', header: 'Conf', render: (r) => `${r.confidence}%` },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function BrainMemoryTimelinePage() {
  const [productionOrderNo, setProductionOrderNo] = useState('')
  const { data: records = [] } = useMemoryRecords()
  const options = [
    ...new Set(
      records
        .map((r) => r.references.productionOrderNo)
        .filter((v): v is string => Boolean(v)),
    ),
  ].sort()
  const selected = productionOrderNo || options[0] || ''
  const { data, isLoading } = useProductionOrderMemoryReplay(selected)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Production Order timeline replay</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={selected}
            onChange={(e) => setProductionOrderNo(e.target.value)}
          >
            {options.map((po) => (
              <option key={po} value={po}>
                {po}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>
      {isLoading || !data ? (
        <div className="p-8 text-muted-foreground">Yükleniyor…</div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Reconstructed experience <StatusBadge label={data.productionOrderNo} />
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 text-sm">
              {(
                [
                  ['Known facts', data.reconstructed.knownFacts],
                  ['Constraints', data.reconstructed.constraints],
                  ['Rules fired', data.reconstructed.rulesFired],
                  ['Recommendations', data.reconstructed.recommendations],
                  ['Executed actions', data.reconstructed.executedActions],
                  ['Subsequent outcomes', data.reconstructed.subsequentOutcomes],
                ] as const
              ).map(([label, values]) => (
                <div key={label}>
                  <div className="font-medium">{label}</div>
                  <ul className="list-disc pl-5 text-muted-foreground">
                    {(values.length ? values : ['—']).map((value) => (
                      <li key={value}>{value}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Immutable chain</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                rowKey={(r) => r.id}
                data={data.records}
                columns={[
                  { key: 't', header: 'Time', render: (r) => r.timestamp.slice(0, 19) },
                  { key: 'm', header: 'Module', render: (r) => r.module },
                  { key: 'o', header: 'Observation', render: (r) => r.observation },
                  { key: 'd', header: 'Decision', render: (r) => r.decision },
                  {
                    key: 'a',
                    header: 'Action',
                    render: (r) => r.action.executed ?? r.action.status,
                  },
                  { key: 'out', header: 'Outcome', render: (r) => r.outcome.actual },
                  { key: 'acc', header: 'Accuracy', render: (r) => r.accuracy.status },
                  { key: 'l', header: 'Lessons', render: (r) => r.lessons.join('; ') },
                ]}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
