/**
 * Phase 8 — Enterprise Hardening observability UI.
 */
import {
  useBootstrapDiagnostics,
  useEnterpriseAiFoundation,
  useEnterpriseAudit,
  useEnterpriseDashboard,
  useEnterpriseHealth,
  useEnterprisePerformance,
} from '@/application/enterprise-hardening/use-enterprise-hardening'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function EnterpriseHealthPage() {
  const { data, isLoading } = useEnterpriseDashboard()
  const { data: health } = useEnterpriseHealth()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null

  return (
    <ErpModuleShell title="Health Dashboard" description="Enterprise readiness" kpis={data.kpis}>
      <div className="p-4 pt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Overall <StatusBadge label={health?.overall ?? data.health.overall} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={data.health.checks}
              columns={[
                { key: 'id', header: 'Check', render: (r) => r.id },
                { key: 'ok', header: 'OK', render: (r) => (r.ok ? 'PASS' : 'FAIL') },
                { key: 'd', header: 'Detail', render: (r) => r.detail },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reliability</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>{data.reliability.optimisticLocking}</div>
            <div>{data.reliability.transactionBoundary}</div>
            <div>{data.reliability.idempotency}</div>
            <div>{data.reliability.recovery}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">PostgreSQL cutover</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-2">{data.health.postgres.summary}</p>
            <DataTable
              rowKey={(r) => r.port}
              data={data.health.postgres.ports}
              columns={[
                { key: 'p', header: 'Port', render: (r) => r.port },
                { key: 's', header: 'Status', render: (r) => r.status },
                { key: 'n', header: 'Notes', render: (r) => r.notes },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function EnterpriseBootstrapPage() {
  const { data, isLoading } = useBootstrapDiagnostics()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Bootstrap Diagnostics · <StatusBadge label={data.overall} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          Backend {data.backend} · ready={String(data.ready)} · started {data.startedAt ?? '—'} ·
          finished {data.finishedAt ?? '—'}
        </div>
        {data.fatalError ? (
          <div className="text-sm text-destructive">{data.fatalError}</div>
        ) : null}
        <DataTable
          rowKey={(r) => r.id}
          data={data.phases}
          columns={[
            { key: 'l', header: 'Phase', render: (r) => r.label },
            { key: 's', header: 'Status', render: (r) => r.status },
            { key: 'ms', header: 'ms', render: (r) => r.durationMs },
            { key: 'iso', header: 'Isolated', render: (r) => String(r.isolated) },
            { key: 'e', header: 'Error', render: (r) => r.error ?? '—' },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function EnterprisePerformancePage() {
  const { data, isLoading } = useEnterprisePerformance()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null
  const s = data.summary

  return (
    <ErpModuleShell
      title="Performance Dashboard"
      description="Client metrics · RQ invalidation discipline"
      kpis={[
        { label: 'Page avg ms', value: String(Math.round(s.averagePageLoad)) },
        { label: 'Domain avg ms', value: String(Math.round(s.averageDomainExecution)) },
        { label: 'Brain avg ms', value: String(Math.round(s.averageBrainExecution)) },
        { label: 'Cache hit %', value: String(s.cacheHitRatio) },
        { label: 'Samples', value: String(s.totalMetrics) },
      ]}
    >
      <div className="p-4 pt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Slowest services</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => `${r.name}-${r.timestamp}`}
              data={data.slowest}
              columns={[
                { key: 'n', header: 'Name', render: (r) => r.name },
                { key: 'c', header: 'Category', render: (r) => r.category },
                { key: 'd', header: 'ms', render: (r) => Math.round(r.durationMs) },
                { key: 't', header: 'When', render: (r) => r.timestamp },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function EnterpriseAuditPage() {
  const { data, isLoading } = useEnterpriseAudit()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Audit Dashboard · last {data.totalShown}</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={data.logs}
          columns={[
            { key: 't', header: 'When', render: (r) => r.changedAt },
            { key: 'e', header: 'Entity', render: (r) => `${r.entityType}:${r.entityId}` },
            { key: 'a', header: 'Action', render: (r) => r.action },
            { key: 'u', header: 'Actor', render: (r) => r.changedBy },
            { key: 'd', header: 'Description', render: (r) => r.description ?? '—' },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function EnterpriseAiFoundationPage() {
  const { data, isLoading } = useEnterpriseAiFoundation()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            AI Foundation · twin score {data.twinCompletenessScore} · LLM{' '}
            {String(data.explainability.llmEnabled)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div>{data.explainability.auditHint}</div>
          <div>Critical twin flags: {data.twinCriticalFlags.join(', ') || 'none'}</div>
          <div>Node types: {data.twinNodeTypesPresent.join(', ')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brain read models</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.domain}
            data={data.brainReadModels}
            columns={[
              { key: 'd', header: 'Domain', render: (r) => r.domain },
              { key: 's', header: 'Surface', render: (r) => r.surface },
              { key: 'a', header: 'Available', render: (r) => String(r.available) },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Domain event catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => `${r.aggregate}-${r.eventType}`}
            data={data.domainEventCatalog}
            columns={[
              { key: 'a', header: 'Aggregate', render: (r) => r.aggregate },
              { key: 'e', header: 'Event', render: (r) => r.eventType },
              { key: 'x', header: 'Explainability', render: (r) => r.explainability },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recommendations (sideEffects=NONE)</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={data.recommendations}
            columns={[
              { key: 'd', header: 'Domain', render: (r) => r.domain },
              { key: 't', header: 'Title', render: (r) => r.title },
              { key: 'r', header: 'Rationale', render: (r) => r.rationale },
              { key: 'c', header: 'Conf', render: (r) => r.confidence },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={data.predictions}
            columns={[
              { key: 'd', header: 'Domain', render: (r) => r.domain },
              { key: 'm', header: 'Metric', render: (r) => r.metric },
              { key: 'v', header: 'Value', render: (r) => `${r.value} ${r.unit}` },
              { key: 'x', header: 'Explain', render: (r) => r.explainability },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
