/**
 * Manufacturing Reasoning Engine UI — browse inference results only (no chat / LLM).
 */
import {
  useManufacturingReasoningCoverage,
  useManufacturingReasoningRun,
  useReasoningConstraints,
  useReasoningDecisions,
  useReasoningFacts,
  useReasoningRecommendations,
  useReasoningRules,
} from '@/application/brain-reasoning/use-brain-reasoning'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function BrainReasoningCoveragePage() {
  const { data, isLoading } = useManufacturingReasoningCoverage()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null
  const t = data.totals

  return (
    <ErpModuleShell
      title="Reasoning Coverage"
      description="Manufacturing Reasoning Engine · llmEnabled=false · sideEffects=NONE"
      kpis={[
        { label: 'Facts', value: String(t.facts) },
        { label: 'Rules', value: String(t.ruleEvaluations) },
        { label: 'Formulae', value: String(t.formulaeRun) },
        { label: 'Constraints', value: String(t.constraints) },
        { label: 'Decisions', value: String(t.decisions) },
        { label: 'Recommendations', value: String(t.recommendations) },
        { label: 'Graph hits', value: String(t.graphHits) },
        { label: 'Layers', value: data.implementedLayers.join(',') },
      ]}
      kpiColumns={4}
    >
      <div className="p-4 pt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pipeline <StatusBadge label={data.pipeline.join(' → ')} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataTable
              rowKey={(r) => r.module}
              data={data.sourceModules}
              columns={[
                { key: 'm', header: 'Fact source', render: (r) => r.module },
                { key: 'n', header: 'Facts', render: (r) => r.factCount },
              ]}
            />
            <DataTable
              rowKey={(r) => r.verdict}
              data={(Object.entries(data.verdictCounts) as Array<[string, number]>).map(
                ([verdict, count]) => ({ verdict, count }),
              )}
              columns={[
                { key: 'v', header: 'Verdict', render: (r) => r.verdict },
                { key: 'c', header: 'Count', render: (r) => r.count },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function BrainReasoningFactsPage() {
  const { data = [], isLoading } = useReasoningFacts()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Fact Engine · ERP → standardized facts</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={data}
          columns={[
            { key: 's', header: 'Source', render: (r) => r.sourceModule },
            { key: 't', header: 'Type', render: (r) => r.subjectType },
            { key: 'l', header: 'Label', render: (r) => r.label },
            {
              key: 'a',
              header: 'Attributes',
              render: (r) =>
                Object.entries(r.attributes)
                  .slice(0, 6)
                  .map(([k, v]) => `${k}=${String(v)}`)
                  .join(' · '),
            },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function BrainReasoningRulesPage() {
  const { data = [], isLoading } = useReasoningRules()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Rule Engine · PASS / WARNING / CRITICAL / BLOCKED</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.ruleId}
          data={data}
          columns={[
            { key: 'c', header: 'Code', render: (r) => r.ruleCode },
            { key: 'n', header: 'Name', render: (r) => r.ruleName },
            {
              key: 'v',
              header: 'Verdict',
              render: (r) => <StatusBadge label={r.verdict} />,
            },
            { key: 'm', header: 'Matched', render: (r) => (r.matched ? 'Yes' : 'No') },
            { key: 'msg', header: 'Message', render: (r) => r.message },
            { key: 'e', header: 'Evidence', render: (r) => r.evidence.join('; ') || '—' },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function BrainReasoningConstraintsPage() {
  const { data: run } = useManufacturingReasoningRun()
  const { data = [], isLoading } = useReasoningConstraints()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Constraint Engine</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={data}
            columns={[
              { key: 'd', header: 'Domain', render: (r) => r.domain },
              {
                key: 'v',
                header: 'Verdict',
                render: (r) => <StatusBadge label={r.verdict} />,
              },
              { key: 't', header: 'Title', render: (r) => r.title },
              { key: 'x', header: 'Detail', render: (r) => r.detail },
              { key: 'm', header: 'Modules', render: (r) => r.affectedModules.join(', ') },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formula Engine runs</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => `${r.formulaId}-${r.subjectId ?? 'x'}-${r.value}`}
            data={run?.formulae ?? []}
            columns={[
              { key: 'c', header: 'Formula', render: (r) => r.formulaCode },
              { key: 's', header: 'Subject', render: (r) => r.subjectLabel ?? '—' },
              { key: 'v', header: 'Value', render: (r) => (r.ok ? String(r.value) : '—') },
              { key: 'u', header: 'Unit', render: (r) => r.unit },
              {
                key: 'i',
                header: 'Input',
                render: (r) =>
                  Object.entries(r.input)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(', '),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function BrainReasoningDecisionsPage() {
  const { data = [], isLoading } = useReasoningDecisions()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <div className="space-y-4">
      {data.map((d) => (
        <Card key={d.decisionId}>
          <CardHeader>
            <CardTitle className="text-base">
              {d.name} <StatusBadge label={d.trigger} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Best: {d.best ? `${d.best.action} (score ${d.best.score})` : '—'}
            </div>
            <DataTable
              rowKey={(r) => r.stepId}
              data={d.path}
              columns={[
                { key: 'a', header: 'Step', render: (r) => r.action },
                { key: 'o', header: 'Outcome', render: (r) => r.outcome },
              ]}
            />
            <DataTable
              rowKey={(r) => r.id}
              data={d.candidates}
              columns={[
                { key: 'a', header: 'Candidate', render: (r) => r.action },
                { key: 's', header: 'Score', render: (r) => r.score },
                { key: 'r', header: 'Rationale', render: (r) => r.rationale },
                { key: 'k', header: 'Risk', render: (r) => r.risk },
              ]}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function BrainReasoningRecommendationsPage() {
  const { data = [], isLoading } = useReasoningRecommendations()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Recommendation Engine · explain only · never mutates ERP
        </CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={data}
          columns={[
            {
              key: 'v',
              header: 'Verdict',
              render: (r) => <StatusBadge label={r.verdict} />,
            },
            { key: 't', header: 'Title', render: (r) => r.title },
            { key: 'why', header: 'Reason', render: (r) => r.reason },
            { key: 'e', header: 'Evidence', render: (r) => r.evidence.slice(0, 4).join('; ') },
            { key: 'br', header: 'Rules', render: (r) => r.businessRulesUsed.join(', ') || '—' },
            { key: 'f', header: 'Formulae', render: (r) => r.formulaeUsed.join(', ') || '—' },
            { key: 'c', header: 'Confidence', render: (r) => `${r.confidence}%` },
            { key: 'risk', header: 'Risk', render: (r) => r.risk },
            { key: 'alt', header: 'Alternative', render: (r) => r.alternative ?? '—' },
            { key: 'm', header: 'Modules', render: (r) => r.affectedModules.join(', ') },
          ]}
        />
      </CardContent>
    </Card>
  )
}
