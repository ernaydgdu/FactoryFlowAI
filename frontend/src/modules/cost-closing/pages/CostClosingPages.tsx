/**
 * Phase 7 Module 2 — Cost Closing UI.
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAuth } from '@/application/platform/iam/auth-context'
import {
  newCostClosingIdempotencyKey,
  useApproveCostClosingMutation,
  useCalculateCostClosingMutation,
  useCloseCostClosingMutation,
  useCostClosingBrain,
  useCostClosingDashboard,
  useCostClosingDetail,
  useCostClosingHistory,
  useCostClosings,
  useCreateCostClosingMutation,
  useReconcileCostClosingMutation,
  useReverseCostClosingMutation,
  useSubmitCostClosingApprovalMutation,
} from '@/application/cost-closing/use-cost-closing'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function useActorUserId(): string {
  const { user } = useAuth()
  return user?.id ?? 'system'
}

export function CostClosingDashboardPage() {
  const { data, isLoading } = useCostClosingDashboard()
  const { data: brain } = useCostClosingBrain()
  const { data: lists } = useCostClosings()
  const actorUserId = useActorUserId()
  const create = useCreateCostClosingMutation()
  const [salesOrderId, setSalesOrderId] = useState('1')

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null

  return (
    <ErpModuleShell
      title="Cost Closing Dashboard"
      description="Lifecycle KPIs · Brain variance"
      kpis={data.kpis}
    >
      <div className="p-4 pt-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-sm space-y-1">
            <span>Sales order id</span>
            <Input value={salesOrderId} onChange={(e) => setSalesOrderId(e.target.value)} />
          </label>
          <Button
            onClick={() =>
              create.mutate({
                salesOrderId,
                actorUserId,
                idempotencyKey: newCostClosingIdempotencyKey('cc'),
              })
            }
          >
            Open cost closing
          </Button>
        </div>
        {brain ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Brain · avg anomaly {brain.avgAnomalyScore} · closed {brain.closed}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                rowKey={(r) => r.id}
                data={brain.varianceInsights}
                columns={[
                  { key: 'no', header: 'Batch', render: (r) => r.batchNo },
                  { key: 'var', header: 'Variance', render: (r) => r.totalVariance },
                  { key: 'hint', header: 'Profitability', render: (r) => r.profitabilityHint ?? '—' },
                  { key: 'a', header: 'Anomaly', render: (r) => r.anomalyScore },
                ]}
              />
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Batches</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={lists ?? []}
              columns={[
                {
                  key: 'no',
                  header: 'Batch',
                  render: (r) => (
                    <Link className="text-primary underline" to={`/cost-closing/batches/${r.id}`}>
                      {r.batchNo}
                    </Link>
                  ),
                },
                { key: 'so', header: 'SO', render: (r) => r.salesOrderNo },
                {
                  key: 'st',
                  header: 'Status',
                  render: (r) => <StatusBadge label={r.status} />,
                },
                {
                  key: 'var',
                  header: 'Variance',
                  render: (r) => r.variances?.totalVariance ?? '—',
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function CostClosingDetailPage() {
  const { costClosingId = '' } = useParams()
  const { data, isLoading } = useCostClosingDetail(costClosingId)
  const actorUserId = useActorUserId()
  const calculate = useCalculateCostClosingMutation()
  const reconcile = useReconcileCostClosingMutation()
  const submit = useSubmitCostClosingApprovalMutation()
  const approve = useApproveCostClosingMutation()
  const close = useCloseCostClosingMutation()
  const reverse = useReverseCostClosingMutation()

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return <div className="p-8">Cost closing bulunamadı</div>

  const cmd = { costClosingId: data.id, actorUserId }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {data.batchNo} · <StatusBadge label={data.status} /> · {data.salesOrderNo}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            Period {data.financialPeriodCode} · product {data.productCode} · approval{' '}
            {data.approvalStatus}
          </div>
          <div className="flex flex-wrap gap-2">
            {data.status === 'Open' || data.status === 'Calculating' ? (
              <Button
                onClick={() =>
                  calculate.mutate({
                    ...cmd,
                    idempotencyKey: newCostClosingIdempotencyKey('calc'),
                  })
                }
              >
                Calculate
              </Button>
            ) : null}
            {data.status === 'Calculating' || data.status === 'Reconciling' ? (
              <Button
                onClick={() =>
                  reconcile.mutate({
                    ...cmd,
                    idempotencyKey: newCostClosingIdempotencyKey('rec'),
                  })
                }
              >
                Reconcile
              </Button>
            ) : null}
            {data.status === 'Reconciling' && data.approvalStatus === 'None' ? (
              <Button
                onClick={() =>
                  submit.mutate({
                    ...cmd,
                    idempotencyKey: newCostClosingIdempotencyKey('sub'),
                  })
                }
              >
                Submit approval
              </Button>
            ) : null}
            {data.approvalStatus === 'Pending' ? (
              <Button
                onClick={() =>
                  approve.mutate({
                    ...cmd,
                    idempotencyKey: newCostClosingIdempotencyKey('appr'),
                  })
                }
              >
                Approve
              </Button>
            ) : null}
            {data.status === 'Approved' ? (
              <Button
                onClick={() =>
                  close.mutate({
                    ...cmd,
                    idempotencyKey: newCostClosingIdempotencyKey('close'),
                  })
                }
              >
                Close
              </Button>
            ) : null}
            {data.status === 'Open' ||
            data.status === 'Calculating' ||
            data.status === 'Reconciling' ? (
              <Button
                variant="outline"
                onClick={() =>
                  reverse.mutate({
                    ...cmd,
                    idempotencyKey: newCostClosingIdempotencyKey('rev'),
                  })
                }
              >
                Reverse
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approval Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={data.timeline}
            columns={[
              { key: 't', header: 'When', render: (r) => r.occurredAt },
              { key: 'a', header: 'Action', render: (r) => r.action },
              { key: 's', header: 'Status', render: (r) => r.status },
              { key: 'u', header: 'Actor', render: (r) => r.actorUserId },
              { key: 'n', header: 'Note', render: (r) => r.note ?? '—' },
            ]}
          />
        </CardContent>
      </Card>

      {data.gates.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reconciliation gates</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.code}
              data={data.gates}
              columns={[
                { key: 'c', header: 'Gate', render: (r) => r.code },
                {
                  key: 'p',
                  header: 'Pass',
                  render: (r) => (r.applicable ? (r.passed ? 'PASS' : 'FAIL') : 'N/A'),
                },
                { key: 'd', header: 'Detail', render: (r) => r.detail },
              ]}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export function CostClosingVariancePage() {
  const { data, isLoading } = useCostClosings()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  const rows = (data ?? []).filter((c) => c.variances)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Variance Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={rows}
          columns={[
            {
              key: 'no',
              header: 'Batch',
              render: (r) => (
                <Link className="text-primary underline" to={`/cost-closing/batches/${r.id}`}>
                  {r.batchNo}
                </Link>
              ),
            },
            { key: 'mat', header: 'Material', render: (r) => r.variances!.material.variance },
            { key: 'lab', header: 'Labor', render: (r) => r.variances!.labor.variance },
            { key: 'oh', header: 'Overhead', render: (r) => r.variances!.overhead.variance },
            { key: 'prd', header: 'Production', render: (r) => r.variances!.production.variance },
            { key: 'tot', header: 'Total', render: (r) => r.variances!.totalVariance },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function CostClosingReconciliationPage() {
  const { data, isLoading } = useCostClosings()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  const rows = (data ?? []).filter((c) => c.financialReconciliation || c.gates.length)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reconciliation View</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={rows}
            columns={[
              {
                key: 'no',
                header: 'Batch',
                render: (r) => (
                  <Link className="text-primary underline" to={`/cost-closing/batches/${r.id}`}>
                    {r.batchNo}
                  </Link>
                ),
              },
              {
                key: 'st',
                header: 'Status',
                render: (r) => <StatusBadge label={r.status} />,
              },
              {
                key: 'bal',
                header: 'Fin balanced',
                render: (r) =>
                  r.financialReconciliation
                    ? String(r.financialReconciliation.balanced)
                    : '—',
              },
              {
                key: 'open',
                header: 'Open postings',
                render: (r) => r.financialReconciliation?.openPostings ?? '—',
              },
              {
                key: 'gates',
                header: 'Gates fail',
                render: (r) =>
                  r.gates.filter((g) => g.applicable && !g.passed).length,
              },
              {
                key: 'reval',
                header: 'Revaluation',
                render: (r) => r.inventoryRevaluation?.revaluationAmount ?? '—',
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function CostClosingHistoryPage() {
  const { data, isLoading } = useCostClosingHistory()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Closing History</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={data ?? []}
          columns={[
            {
              key: 'no',
              header: 'Batch',
              render: (r) => (
                <Link className="text-primary underline" to={`/cost-closing/batches/${r.id}`}>
                  {r.batchNo}
                </Link>
              ),
            },
            {
              key: 'st',
              header: 'Status',
              render: (r) => <StatusBadge label={r.status} />,
            },
            {
              key: 'closed',
              header: 'Closed at',
              render: (r) => r.closingResult?.closedAt ?? '—',
            },
            {
              key: 'by',
              header: 'By',
              render: (r) => r.closingResult?.closedBy ?? '—',
            },
            {
              key: 'var',
              header: 'Variance',
              render: (r) => r.closingResult?.totalVariance ?? r.variances?.totalVariance ?? '—',
            },
          ]}
        />
      </CardContent>
    </Card>
  )
}
