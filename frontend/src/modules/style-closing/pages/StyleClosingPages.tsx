/**
 * Phase 7 Module 3 — Style Closing UI.
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAuth } from '@/application/platform/iam/auth-context'
import {
  newStyleClosingIdempotencyKey,
  useApproveStyleClosingMutation,
  useCheckStyleClosingMutation,
  useCloseStyleClosingMutation,
  useCreateStyleClosingMutation,
  useStyleClosingBrain,
  useStyleClosingDashboard,
  useStyleClosingDetail,
  useStyleClosingHistory,
  useStyleClosings,
  useSubmitStyleClosingApprovalMutation,
} from '@/application/style-closing/use-style-closing'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function useActorUserId(): string {
  const { user } = useAuth()
  return user?.id ?? 'system'
}

export function StyleClosingDashboardPage() {
  const { data, isLoading } = useStyleClosingDashboard()
  const { data: brain } = useStyleClosingBrain()
  const { data: lists } = useStyleClosings()
  const actorUserId = useActorUserId()
  const create = useCreateStyleClosingMutation()
  const [productCardId, setProductCardId] = useState('1')

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null

  return (
    <ErpModuleShell
      title="Style Closing Dashboard"
      description="Style completion KPIs · Brain summary"
      kpis={data.kpis}
    >
      <div className="p-4 pt-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-sm space-y-1">
            <span>Product / style id</span>
            <Input value={productCardId} onChange={(e) => setProductCardId(e.target.value)} />
          </label>
          <Button
            onClick={() =>
              create.mutate({
                productCardId,
                actorUserId,
                idempotencyKey: newStyleClosingIdempotencyKey('sc'),
              })
            }
          >
            Open style closing
          </Button>
        </div>
        {brain ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Brain Style Summary · avg margin {brain.avgMarginPercent}% · anomaly{' '}
                {brain.avgAnomalyScore}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                rowKey={(r) => r.id}
                data={brain.styleSummaries}
                columns={[
                  { key: 'code', header: 'Style', render: (r) => r.productCode },
                  { key: 'no', header: 'Batch', render: (r) => r.batchNo },
                  { key: 'st', header: 'Status', render: (r) => r.status },
                  { key: 'm', header: 'Margin %', render: (r) => r.marginPercent ?? '—' },
                  { key: 'miss', header: 'Missing', render: (r) => r.missingCount },
                ]}
              />
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Style batches</CardTitle>
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
                    <Link className="text-primary underline" to={`/style-closing/batches/${r.id}`}>
                      {r.batchNo}
                    </Link>
                  ),
                },
                { key: 'code', header: 'Style', render: (r) => r.productCode },
                {
                  key: 'st',
                  header: 'Status',
                  render: (r) => <StatusBadge label={r.status} />,
                },
                {
                  key: 'miss',
                  header: 'Missing',
                  render: (r) => r.missingRequirements.length,
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function StyleClosingDetailPage() {
  const { styleClosingId = '' } = useParams()
  const { data, isLoading } = useStyleClosingDetail(styleClosingId)
  const actorUserId = useActorUserId()
  const check = useCheckStyleClosingMutation()
  const submit = useSubmitStyleClosingApprovalMutation()
  const approve = useApproveStyleClosingMutation()
  const close = useCloseStyleClosingMutation()

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return <div className="p-8">Style closing bulunamadı</div>

  const cmd = { styleClosingId: data.id, actorUserId }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {data.batchNo} · <StatusBadge label={data.status} /> · {data.productCode}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            {data.productName} · approval {data.approvalStatus} · anomaly {data.anomalyScore}
          </div>
          <div className="flex flex-wrap gap-2">
            {data.status === 'Open' || data.status === 'Checking' || data.status === 'Ready' ? (
              <Button
                onClick={() =>
                  check.mutate({
                    ...cmd,
                    idempotencyKey: newStyleClosingIdempotencyKey('chk'),
                  })
                }
              >
                Run checklist
              </Button>
            ) : null}
            {data.status === 'Ready' && data.approvalStatus === 'None' ? (
              <Button
                onClick={() =>
                  submit.mutate({
                    ...cmd,
                    idempotencyKey: newStyleClosingIdempotencyKey('sub'),
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
                    idempotencyKey: newStyleClosingIdempotencyKey('appr'),
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
                    idempotencyKey: newStyleClosingIdempotencyKey('close'),
                  })
                }
              >
                Close style
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Completion Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.code}
            data={data.checklist}
            columns={[
              { key: 'l', header: 'Check', render: (r) => r.label },
              {
                key: 'p',
                header: 'Result',
                render: (r) => (r.applicable ? (r.passed ? 'PASS' : 'FAIL') : 'N/A'),
              },
              { key: 'd', header: 'Detail', render: (r) => r.detail },
            ]}
          />
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
    </div>
  )
}

export function StyleClosingChecklistPage() {
  const { data, isLoading } = useStyleClosings()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  const rows = (data ?? []).flatMap((s) =>
    s.checklist.map((c) => ({
      id: `${s.id}-${c.code}`,
      batchNo: s.batchNo,
      productCode: s.productCode,
      ...c,
    })),
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Completion Checklist</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={rows}
          columns={[
            { key: 'b', header: 'Batch', render: (r) => r.batchNo },
            { key: 's', header: 'Style', render: (r) => r.productCode },
            { key: 'l', header: 'Check', render: (r) => r.label },
            {
              key: 'p',
              header: 'Result',
              render: (r) => (r.applicable ? (r.passed ? 'PASS' : 'FAIL') : 'N/A'),
            },
            { key: 'd', header: 'Detail', render: (r) => r.detail },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function StyleClosingMissingPage() {
  const { data, isLoading } = useStyleClosings()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  const rows = (data ?? []).flatMap((s) =>
    s.missingRequirements.map((m) => ({
      id: `${s.id}-${m.code}`,
      batchNo: s.batchNo,
      productCode: s.productCode,
      styleClosingId: s.id,
      ...m,
    })),
  )
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Missing Requirements</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={rows}
          columns={[
            {
              key: 'b',
              header: 'Batch',
              render: (r) => (
                <Link
                  className="text-primary underline"
                  to={`/style-closing/batches/${r.styleClosingId}`}
                >
                  {r.batchNo}
                </Link>
              ),
            },
            { key: 's', header: 'Style', render: (r) => r.productCode },
            { key: 'c', header: 'Code', render: (r) => r.code },
            { key: 'd', header: 'Detail', render: (r) => r.detail },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function StyleClosingKpiPage() {
  const { data, isLoading } = useStyleClosings()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  const rows = (data ?? []).filter((s) => s.kpiSnapshot)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Final KPI Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={rows}
          columns={[
            {
              key: 'b',
              header: 'Batch',
              render: (r) => (
                <Link className="text-primary underline" to={`/style-closing/batches/${r.id}`}>
                  {r.batchNo}
                </Link>
              ),
            },
            { key: 's', header: 'Style', render: (r) => r.productCode },
            { key: 'prod', header: 'Produced', render: (r) => r.kpiSnapshot!.producedQty },
            { key: 'ship', header: 'Shipped', render: (r) => r.kpiSnapshot!.shippedQty },
            { key: 'rev', header: 'Revenue', render: (r) => r.kpiSnapshot!.revenueEstimate },
            { key: 'm', header: 'Margin %', render: (r) => r.kpiSnapshot!.marginPercent },
            { key: 'var', header: 'Variance', render: (r) => r.kpiSnapshot!.totalVariance },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function StyleClosingHistoryPage() {
  const { data, isLoading } = useStyleClosingHistory()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Historical Closings</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          rowKey={(r) => r.id}
          data={data ?? []}
          columns={[
            {
              key: 'b',
              header: 'Batch',
              render: (r) => (
                <Link className="text-primary underline" to={`/style-closing/batches/${r.id}`}>
                  {r.batchNo}
                </Link>
              ),
            },
            { key: 's', header: 'Style', render: (r) => r.productCode },
            { key: 'closed', header: 'Closed at', render: (r) => r.closedAt ?? '—' },
            { key: 'by', header: 'By', render: (r) => r.closedBy ?? '—' },
            {
              key: 'm',
              header: 'Margin %',
              render: (r) => r.finalMargin?.marginPercent ?? '—',
            },
          ]}
        />
      </CardContent>
    </Card>
  )
}
