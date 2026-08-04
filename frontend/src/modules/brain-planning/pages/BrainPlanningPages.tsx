/**
 * Manufacturing Planning Engine UI — browse plan recommendations only (no chat / LLM / ERP mutate).
 */
import { useMemo, useState } from 'react'

import {
  useManufacturingPlanningCoverage,
  useManufacturingPlanningRun,
} from '@/application/brain-planning/use-brain-planning'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PlanVariant } from '@/domain/brain/manufacturing-planning'

export function BrainPlanningCoveragePage() {
  const { data, isLoading } = useManufacturingPlanningCoverage()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null
  const t = data.totals
  const c = data.consumedFromReasoning

  return (
    <ErpModuleShell
      title="Planning Coverage"
      description="Manufacturing Planning Engine · llmEnabled=false · recommend-only"
      kpis={[
        { label: 'Plans', value: String(t.plans) },
        { label: 'Preferred', value: data.preferredVariant },
        { label: 'Sequence', value: String(t.sequenceSteps) },
        { label: 'Materials', value: String(t.materialRows) },
        { label: 'Purchasing', value: String(t.purchasingSuggestions) },
        { label: 'Bottlenecks', value: String(t.bottlenecks) },
        { label: 'From facts', value: String(c.facts) },
        { label: 'Layers', value: data.implementedLayers.join(',') },
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
            Consumed reasoning: {c.facts} facts · {c.constraints} constraints · {c.decisions}{' '}
            decisions · {c.recommendations} recommendations
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

function useSelectedPlan() {
  const { data: run, isLoading } = useManufacturingPlanningRun()
  const [variant, setVariant] = useState<PlanVariant | null>(null)
  const preferred = run?.preferredVariant ?? 'A'
  const selected = variant ?? preferred
  const plan = useMemo(
    () => run?.plans.find((p) => p.variant === selected) ?? run?.plans[0] ?? null,
    [run, selected],
  )
  return { run, plan, selected, setVariant, preferred, isLoading }
}

function PlanPicker(props: {
  selected: PlanVariant
  preferred: PlanVariant
  onChange: (v: PlanVariant) => void
  confidences: Partial<Record<PlanVariant, number>>
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {(['A', 'B', 'C'] as PlanVariant[]).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => props.onChange(v)}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            props.selected === v ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
          }`}
        >
          Plan {v}
          {props.preferred === v ? ' ★' : ''}
          {props.confidences[v] != null ? ` · ${props.confidences[v]}%` : ''}
        </button>
      ))}
    </div>
  )
}

export function BrainPlanningPlansPage() {
  const { run, plan, selected, setVariant, preferred, isLoading } = useSelectedPlan()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!run || !plan) return null
  const confidences = Object.fromEntries(run.plans.map((p) => [p.variant, p.confidence])) as Partial<
    Record<PlanVariant, number>
  >

  return (
    <div className="space-y-4">
      <PlanPicker
        selected={selected}
        preferred={preferred}
        onChange={setVariant}
        confidences={confidences}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {plan.name} <StatusBadge label={`confidence ${plan.confidence}%`} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>{plan.strategy}</div>
          <div className="text-muted-foreground">{plan.explanation.why}</div>
          <DataTable
            rowKey={(r) => r.variant}
            data={run.plans}
            columns={[
              { key: 'v', header: 'Variant', render: (r) => r.variant },
              { key: 'n', header: 'Name', render: (r) => r.name },
              { key: 'c', header: 'Confidence', render: (r) => `${r.confidence}%` },
              { key: 's', header: 'Steps', render: (r) => r.sequencing.length },
              { key: 'b', header: 'Bottlenecks', render: (r) => r.bottlenecks.length },
              {
                key: 'r',
                header: 'High delivery risk',
                render: (r) =>
                  r.deliveryRisks.filter((d) => d.riskLevel === 'HIGH' || d.riskLevel === 'CRITICAL')
                    .length,
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function BrainPlanningSequencingPage() {
  const { run, plan, selected, setVariant, preferred, isLoading } = useSelectedPlan()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!run || !plan) return null

  return (
    <div className="space-y-4">
      <PlanPicker
        selected={selected}
        preferred={preferred}
        onChange={setVariant}
        confidences={Object.fromEntries(run.plans.map((p) => [p.variant, p.confidence]))}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Production sequencing</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => `${r.sequence}-${r.productionOrderNo}`}
            data={plan.sequencing}
            columns={[
              { key: 'q', header: '#', render: (r) => r.sequence },
              { key: 'po', header: 'PO', render: (r) => r.productionOrderNo },
              { key: 'so', header: 'SO', render: (r) => r.salesOrderNo },
              { key: 'p', header: 'Product', render: (r) => r.productCode },
              { key: 'w', header: 'Workshop', render: (r) => r.workshopCode },
              { key: 'op', header: 'Op hint', render: (r) => r.operationHint },
              { key: 'd', header: 'Start+d', render: (r) => r.plannedStartDayOffset },
              { key: 'dur', header: 'Days', render: (r) => r.plannedDurationDays },
              { key: 'pr', header: 'Priority', render: (r) => r.priority },
              { key: 'qty', header: 'Remain', render: (r) => r.remainingQty },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Critical path</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={plan.criticalPath}
            columns={[
              { key: 'l', header: 'Node', render: (r) => r.label },
              { key: 'd', header: 'Days', render: (r) => r.durationDays },
              { key: 'dep', header: 'Depends', render: (r) => r.dependsOn.join(', ') || '—' },
              { key: 'm', header: 'Module', render: (r) => r.moduleRef },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function BrainPlanningAllocationPage() {
  const { run, plan, selected, setVariant, preferred, isLoading } = useSelectedPlan()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!run || !plan) return null

  return (
    <div className="space-y-4">
      <PlanPicker
        selected={selected}
        preferred={preferred}
        onChange={setVariant}
        confidences={Object.fromEntries(run.plans.map((p) => [p.variant, p.confidence]))}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Capacity allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.workshopCode}
            data={plan.capacity}
            columns={[
              { key: 'w', header: 'Workshop', render: (r) => r.workshopName },
              { key: 'o', header: 'Orders', render: (r) => r.allocatedOrders },
              { key: 'q', header: 'Qty', render: (r) => r.allocatedQty },
              { key: 'ub', header: 'Util before', render: (r) => `${r.utilizationBefore}%` },
              { key: 'ua', header: 'Util after', render: (r) => `${r.utilizationAfter}%` },
              { key: 'f', header: 'Free before', render: (r) => r.freeCapacityBefore },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Machine allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => `${r.productionOrderNo}-${r.machineCode}-${r.operationCode}`}
            data={plan.machines}
            columns={[
              { key: 'm', header: 'Machine', render: (r) => r.machineName },
              { key: 'op', header: 'Operation', render: (r) => r.operationCode },
              { key: 'po', header: 'PO', render: (r) => r.productionOrderNo },
              { key: 'h', header: 'Hours', render: (r) => r.estimatedHours },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Operator allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.workshopCode}
            data={plan.operators}
            columns={[
              { key: 'w', header: 'Workshop', render: (r) => r.workshopCode },
              { key: 'o', header: 'Operators', render: (r) => r.estimatedOperators },
              { key: 's', header: 'SAM min', render: (r) => r.samMinutes },
              { key: 'sh', header: 'Shift', render: (r) => r.shiftHint },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Material allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.materialCode}
            data={plan.materials}
            columns={[
              { key: 'c', header: 'Material', render: (r) => r.materialCode },
              { key: 'n', header: 'Name', render: (r) => r.materialName },
              { key: 'r', header: 'Required', render: (r) => r.requiredQty },
              { key: 'a', header: 'Available+', render: (r) => r.availableQty },
              { key: 's', header: 'Shortfall', render: (r) => r.shortfall },
              { key: 'u', header: 'Unit', render: (r) => r.unit },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Purchasing suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.materialCode}
            data={plan.purchasing}
            columns={[
              { key: 'c', header: 'Material', render: (r) => r.materialCode },
              { key: 'q', header: 'Qty', render: (r) => r.quantity },
              { key: 's', header: 'Supplier', render: (r) => r.supplierHint },
              { key: 'r', header: 'Reason', render: (r) => r.reason },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function BrainPlanningRiskPage() {
  const { run, plan, selected, setVariant, preferred, isLoading } = useSelectedPlan()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!run || !plan) return null

  return (
    <div className="space-y-4">
      <PlanPicker
        selected={selected}
        preferred={preferred}
        onChange={setVariant}
        confidences={Object.fromEntries(run.plans.map((p) => [p.variant, p.confidence]))}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shipment impact</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.salesOrderNo}
            data={plan.shipmentImpact}
            columns={[
              { key: 's', header: 'SO', render: (r) => r.salesOrderNo },
              { key: 'p', header: 'Partial?', render: (r) => (r.canShipPartial ? 'Yes' : 'No') },
              { key: 'd', header: 'Delay d', render: (r) => r.delayedDays },
              { key: 'q', header: 'Quality block', render: (r) => (r.blockedByQuality ? 'Yes' : 'No') },
              { key: 'n', header: 'Note', render: (r) => r.note },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery risk</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.salesOrderNo}
            data={plan.deliveryRisks}
            columns={[
              { key: 's', header: 'SO', render: (r) => r.salesOrderNo },
              {
                key: 'l',
                header: 'Level',
                render: (r) => <StatusBadge label={r.riskLevel} />,
              },
              { key: 'sc', header: 'Score', render: (r) => r.score },
              { key: 'd', header: 'Drivers', render: (r) => r.drivers.join('; ') },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bottleneck analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={plan.bottlenecks}
            columns={[
              { key: 'k', header: 'Kind', render: (r) => r.kind },
              { key: 'l', header: 'Label', render: (r) => r.label },
              {
                key: 's',
                header: 'Severity',
                render: (r) => <StatusBadge label={r.severity} />,
              },
              { key: 'e', header: 'Evidence', render: (r) => r.evidence.join('; ') },
              { key: 'a', header: 'Relief', render: (r) => r.reliefActions.join(', ') },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function BrainPlanningExplanationPage() {
  const { run, plan, selected, setVariant, preferred, isLoading } = useSelectedPlan()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!run || !plan) return null
  const e = plan.explanation

  return (
    <div className="space-y-4">
      <PlanPicker
        selected={selected}
        preferred={preferred}
        onChange={setVariant}
        confidences={Object.fromEntries(run.plans.map((p) => [p.variant, p.confidence]))}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Why this plan <StatusBadge label={`${plan.confidence}% confidence`} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{e.why}</p>
          <div>
            <div className="font-medium mb-1">Assumptions</div>
            <ul className="list-disc pl-5 text-muted-foreground">
              {e.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">Constraints evaluated</div>
            <p className="text-muted-foreground">{e.constraintsEvaluated.join(' · ') || '—'}</p>
          </div>
          <div>
            <div className="font-medium mb-1">KPIs improved</div>
            <p className="text-muted-foreground">{e.kpisImproved.join(', ')}</p>
          </div>
          <div>
            <div className="font-medium mb-1">Risks remaining</div>
            <ul className="list-disc pl-5 text-muted-foreground">
              {e.risksRemaining.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
