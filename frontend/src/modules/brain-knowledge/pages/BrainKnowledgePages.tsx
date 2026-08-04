/**
 * Manufacturing Knowledge Engine UI — browse structured knowledge only (no chat / LLM).
 */
import { useState } from 'react'

import {
  useKnowledgeConceptNeighbors,
  useKnowledgeDecisions,
  useKnowledgeDictionary,
  useKnowledgeFlows,
  useKnowledgeFormulae,
  useKnowledgeKpis,
  useKnowledgeMachines,
  useKnowledgeRules,
  useManufacturingKnowledgeCoverage,
  useManufacturingKnowledgeSnapshot,
} from '@/application/brain-knowledge/use-brain-knowledge'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function BrainKnowledgeCoveragePage() {
  const { data, isLoading } = useManufacturingKnowledgeCoverage()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null
  const t = data.totals

  return (
    <ErpModuleShell
      title="Knowledge Coverage"
      description="Manufacturing Knowledge Engine · llmEnabled=false"
      kpis={[
        { label: 'Concepts', value: String(t.concepts) },
        { label: 'Edges', value: String(t.edges) },
        { label: 'Formulae', value: String(t.formulae) },
        { label: 'Rules', value: String(t.businessRules) },
        { label: 'Dictionary', value: String(t.dictionary) },
        { label: 'Machines', value: String(t.machines) },
        { label: 'KPIs', value: String(t.kpis) },
        { label: 'Layer', value: data.implementedLayers.join(',') },
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
          <CardContent>
            <DataTable
              rowKey={(r) => r.category}
              data={data.categories}
              columns={[
                { key: 'c', header: 'Category', render: (r) => r.category },
                { key: 'n', header: 'Count', render: (r) => r.count },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function BrainKnowledgeDictionaryPage() {
  const [q, setQ] = useState('')
  const { data = [], isLoading } = useKnowledgeDictionary(q)
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Textile Dictionary</CardTitle>
        <Input
          placeholder="Search term…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={data}
          columns={[
            { key: 't', header: 'Term', render: (r) => r.term },
            { key: 'c', header: 'Category', render: (r) => r.category },
            { key: 'd', header: 'Definition', render: (r) => r.definition },
            { key: 'm', header: 'Modules', render: (r) => r.relatedModules.join(', ') },
            { key: 'x', header: 'Decisions', render: (r) => r.typicalDecisions.join(', ') || '—' },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function BrainKnowledgeGraphPage() {
  const { data: snap } = useManufacturingKnowledgeSnapshot()
  const [conceptId, setConceptId] = useState('c-cotton')
  const { data: neighbors } = useKnowledgeConceptNeighbors(conceptId)
  const nodes = snap?.graph.nodes ?? []

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Knowledge Graph · navigate relations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={conceptId}
            onChange={(e) => setConceptId(e.target.value)}
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted-foreground">{neighbors?.concept?.definition}</p>
          <DataTable
            rowKey={(r) => r.edge.id}
            data={[
              ...(neighbors?.outbound.map((x) => ({ ...x, dir: 'out' as const })) ?? []),
              ...(neighbors?.inbound.map((x) => ({ ...x, dir: 'in' as const })) ?? []),
            ]}
            columns={[
              { key: 'd', header: 'Dir', render: (r) => r.dir },
              { key: 'r', header: 'Relation', render: (r) => r.edge.relation },
              { key: 'n', header: 'Concept', render: (r) => r.node.label },
              { key: 'c', header: 'Category', render: (r) => r.node.category },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All edges ({snap?.graph.edges.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={snap?.graph.edges ?? []}
            columns={[
              { key: 'f', header: 'From', render: (r) => r.fromId },
              { key: 'rel', header: 'Relation', render: (r) => r.relation },
              { key: 't', header: 'To', render: (r) => r.toId },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function BrainKnowledgeFormulaePage() {
  const { data = [], isLoading } = useKnowledgeFormulae()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Formula Library (executable metadata)</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={data}
          columns={[
            { key: 'c', header: 'Code', render: (r) => r.code },
            { key: 'n', header: 'Name', render: (r) => r.name },
            { key: 'e', header: 'Expression', render: (r) => r.expression },
            { key: 'u', header: 'Unit', render: (r) => r.resultUnit },
            { key: 'x', header: 'Explain', render: (r) => r.explanation },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function BrainKnowledgeRulesPage() {
  const { data = [], isLoading } = useKnowledgeRules()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Business Rule Library</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={data}
          columns={[
            { key: 'c', header: 'Code', render: (r) => r.code },
            { key: 's', header: 'Severity', render: (r) => r.severity },
            { key: 'w', header: 'When', render: (r) => r.when.map((c) => `${c.field} ${c.operator}`).join('; ') },
            { key: 't', header: 'Then', render: (r) => r.then.map((a) => a.type).join(', ') },
            { key: 'x', header: 'Explain', render: (r) => r.explanation },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function BrainKnowledgeFlowsPage() {
  const { data = [], isLoading } = useKnowledgeFlows()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  return (
    <div className="space-y-4">
      {data.map((flow) => (
        <Card key={flow.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {flow.name} · {flow.code}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">{flow.description}</p>
            <DataTable
              rowKey={(r) => r.id}
              data={flow.steps}
              columns={[
                { key: 's', header: '#', render: (r) => r.sequence },
                { key: 'l', header: 'Step', render: (r) => r.label },
                { key: 'c', header: 'Concept', render: (r) => r.conceptId },
                { key: 'm', header: 'Module', render: (r) => r.moduleRef ?? '—' },
              ]}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function BrainKnowledgeDecisionsPage() {
  const { data = [], isLoading } = useKnowledgeDecisions()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  return (
    <div className="space-y-4">
      {data.map((dec) => (
        <Card key={dec.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {dec.trigger} → {dec.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={dec.steps}
              columns={[
                { key: 's', header: '#', render: (r) => r.sequence },
                { key: 'a', header: 'Action', render: (r) => r.action },
                { key: 'o', header: 'Outcome', render: (r) => r.outcomeHint },
              ]}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function BrainKnowledgeMachinesPage() {
  const { data = [], isLoading } = useKnowledgeMachines()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Machine Library</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={data}
          columns={[
            { key: 'c', header: 'Code', render: (r) => r.code },
            { key: 'n', header: 'Name', render: (r) => r.name },
            { key: 'cap', header: 'Capacity/h', render: (r) => r.capacityUnitsPerHour },
            { key: 'setup', header: 'Setup min', render: (r) => r.setupTimeMinutes },
            { key: 'ops', header: 'Operations', render: (r) => r.supportedOperations.join(', ') },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function BrainKnowledgeKpisPage() {
  const { data = [], isLoading } = useKnowledgeKpis()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">KPI Knowledge</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={data}
          columns={[
            { key: 'c', header: 'Code', render: (r) => r.code },
            { key: 't', header: 'Target', render: (r) => r.target },
            { key: 'w', header: 'Warn', render: (r) => r.warningLevel },
            { key: 'k', header: 'Critical', render: (r) => r.criticalLevel },
            { key: 'f', header: 'Formula', render: (r) => r.formulaId },
            { key: 'r', header: 'Recommendation', render: (r) => r.recommendationLogic },
          ]}
        />
      </CardContent>
    </Card>
  )
}
