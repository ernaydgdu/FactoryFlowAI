/**
 * Manufacturing Simulation Engine UI — browse hypothetical scenarios (no chat / LLM / ERP mutate).
 */
import { useMemo, useState } from 'react'

import {
  useManufacturingSimulationCoverage,
  useManufacturingSimulationRun,
} from '@/application/brain-simulation/use-brain-simulation'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ScenarioSlot } from '@/domain/brain/manufacturing-simulation'

export function BrainSimulationCoveragePage() {
  const { data, isLoading } = useManufacturingSimulationCoverage()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null

  return (
    <ErpModuleShell
      title="Simulation Coverage"
      description="Manufacturing Simulation Engine · llmEnabled=false · read-only"
      kpis={[
        { label: 'Scenarios', value: String(data.totals.scenarios) },
        { label: 'Timeline pts', value: String(data.totals.timelinePoints) },
        { label: 'Compare rows', value: String(data.totals.comparisonRows) },
        { label: 'Plans used', value: String(data.consumed.planningPlans) },
        { label: 'Constraints', value: String(data.consumed.reasoningConstraints) },
        { label: 'Facts', value: String(data.consumed.reasoningFacts) },
        { label: 'Layers', value: data.implementedLayers.join(',') },
        { label: 'Side effects', value: data.sideEffects },
      ]}
      kpiColumns={4}
    >
      <div className="p-4 pt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pipeline <StatusBadge label={data.pipeline.join(' → ')} />
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Hypothetical shocks over preferred plan baseline. Never mutates ERP.
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

function useSelectedScenario() {
  const { data: run, isLoading } = useManufacturingSimulationRun()
  const [slot, setSlot] = useState<ScenarioSlot>('A')
  const scenario = useMemo(
    () => run?.scenarios.find((s) => s.slot === slot) ?? run?.scenarios[0] ?? null,
    [run, slot],
  )
  return { run, scenario, slot, setSlot, isLoading }
}

function SlotPicker(props: {
  slot: ScenarioSlot
  onChange: (s: ScenarioSlot) => void
  labels: Partial<Record<ScenarioSlot, string>>
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(['CURRENT', 'A', 'B', 'C'] as ScenarioSlot[]).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => props.onChange(s)}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            props.slot === s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          {s}
          {props.labels[s] ? ` · ${props.labels[s]}` : ''}
        </button>
      ))}
    </div>
  )
}

export function BrainSimulationScenariosPage() {
  const { run, scenario, slot, setSlot, isLoading } = useSelectedScenario()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!run || !scenario) return null
  const labels = Object.fromEntries(
    run.scenarios.map((s) => [s.slot, s.definition.code]),
  ) as Partial<Record<ScenarioSlot, string>>

  return (
    <div className="space-y-4">
      <SlotPicker slot={slot} onChange={setSlot} labels={labels} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {scenario.definition.name}{' '}
            <StatusBadge label={`${scenario.metrics.confidence}% conf`} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{scenario.definition.question}</p>
          <DataTable
            rowKey={(r) => `${r.type}-${r.target}`}
            data={scenario.definition.shocks}
            columns={[
              { key: 't', header: 'Shock', render: (r) => r.type },
              { key: 'g', header: 'Target', render: (r) => r.target },
              { key: 'm', header: 'Magnitude', render: (r) => `${r.magnitude} ${r.unit}` },
            ]}
          />
          <div>
            <div className="font-medium mb-1">Drivers</div>
            <ul className="list-disc pl-5 text-muted-foreground">
              {scenario.drivers.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">Assumptions</div>
            <ul className="list-disc pl-5 text-muted-foreground">
              {scenario.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All scenarios</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.slot}
            data={run.scenarios}
            columns={[
              { key: 's', header: 'Slot', render: (r) => r.slot },
              { key: 'n', header: 'Name', render: (r) => r.definition.name },
              { key: 'q', header: 'Question', render: (r) => r.definition.question },
              { key: 'sh', header: 'Shocks', render: (r) => r.definition.shocks.length },
              { key: 'c', header: 'Confidence', render: (r) => `${r.metrics.confidence}%` },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function BrainSimulationComparePage() {
  const { data: run, isLoading } = useManufacturingSimulationRun()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!run) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Current vs Scenario A / B / C</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.metric}
          data={run.comparison}
          columns={[
            { key: 'm', header: 'Metric', render: (r) => r.metric },
            { key: 'cur', header: 'Current', render: (r) => r.current },
            { key: 'a', header: 'A', render: (r) => r.a },
            { key: 'b', header: 'B', render: (r) => r.b },
            { key: 'c', header: 'C', render: (r) => r.c },
            { key: 'u', header: 'Unit', render: (r) => r.unit },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function BrainSimulationTimelinePage() {
  const { run, scenario, slot, setSlot, isLoading } = useSelectedScenario()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!run || !scenario) return null
  const labels = Object.fromEntries(
    run.scenarios.map((s) => [s.slot, s.definition.code]),
  ) as Partial<Record<ScenarioSlot, string>>
  const maxWip = Math.max(1, ...scenario.timeline.map((t) => t.wip))
  const maxUtil = Math.max(1, ...scenario.timeline.map((t) => t.utilization))

  return (
    <div className="space-y-4">
      <SlotPicker slot={slot} onChange={setSlot} labels={labels} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline visualization data · {scenario.slot}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {scenario.timeline.map((t) => (
            <div key={t.dayOffset} className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>{t.label}</span>
                <span>
                  WIP {t.wip} · Util {t.utilization}% · Q {t.queue} · Inv {t.inventory}
                </span>
              </div>
              <div className="flex gap-2 h-2">
                <div
                  className="bg-primary/70 rounded-sm"
                  style={{ width: `${(t.wip / maxWip) * 100}%` }}
                  title={`WIP ${t.wip}`}
                />
                <div
                  className="bg-amber-500/70 rounded-sm"
                  style={{ width: `${(t.utilization / maxUtil) * 100}%` }}
                  title={`Util ${t.utilization}%`}
                />
              </div>
            </div>
          ))}
          <DataTable
            rowKey={(r) => String(r.dayOffset)}
            data={scenario.timeline}
            columns={[
              { key: 'd', header: 'Day', render: (r) => r.label },
              { key: 'w', header: 'WIP', render: (r) => r.wip },
              { key: 'u', header: 'Util %', render: (r) => r.utilization },
              { key: 'c', header: 'Completions', render: (r) => r.completions },
              { key: 'q', header: 'Queue', render: (r) => r.queue },
              { key: 'i', header: 'Inventory', render: (r) => r.inventory },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function BrainSimulationImpactsPage() {
  const { run, scenario, slot, setSlot, isLoading } = useSelectedScenario()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!run || !scenario) return null
  const m = scenario.metrics
  const labels = Object.fromEntries(
    run.scenarios.map((s) => [s.slot, s.definition.code]),
  ) as Partial<Record<ScenarioSlot, string>>

  const rows = [
    { k: 'OTIF impact', v: `${m.otifImpactPct} pp` },
    { k: 'Completion day Δ', v: `${m.productionCompletionDayOffset} d` },
    { k: 'Resource utilization', v: `${m.resourceUtilizationPct}%` },
    { k: 'Queue growth', v: String(m.queueGrowthUnits) },
    { k: 'Bottleneck', v: m.bottleneckLabel },
    { k: 'Bottleneck moved', v: m.bottleneckMoved ? 'Yes' : 'No' },
    { k: 'WIP Δ', v: String(m.wipDelta) },
    { k: 'Inventory impact', v: String(m.inventoryImpactUnits) },
    { k: 'Purchasing impact', v: String(m.purchasingImpactQty) },
    { k: 'Shipment delay', v: `${m.shipmentDelayDays} d` },
    { k: 'Cost Δ', v: String(m.costDelta) },
    { k: 'Confidence', v: `${m.confidence}%` },
  ]

  return (
    <div className="space-y-4">
      <SlotPicker slot={slot} onChange={setSlot} labels={labels} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Simulation impacts · {scenario.definition.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.k}
            data={rows}
            columns={[
              { key: 'k', header: 'Metric', render: (r) => r.k },
              { key: 'v', header: 'Value', render: (r) => r.v },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
