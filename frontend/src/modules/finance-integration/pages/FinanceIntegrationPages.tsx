/**
 * Phase 7 Module 1 — Finance Integration UI.
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAuth } from '@/application/platform/iam/auth-context'
import {
  newFinanceIdempotencyKey,
  useCloseFinancialPeriodMutation,
  useEnqueueFinanceEventsMutation,
  useFinanceBatchDetail,
  useFinanceBatches,
  useFinanceBrain,
  useFinanceDashboard,
  useFinanceFailed,
  useFinanceMappings,
  useFinancePeriods,
  useFinanceQueue,
  useFinanceResults,
  usePostBatchMutation,
  useReverseBatchMutation,
  useUpsertGlMappingMutation,
} from '@/application/finance-integration/use-finance-integration'
import type { AccountingSourceEventType } from '@/domain/finance-integration/finance-integration.types'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function useActorUserId(): string {
  const { user } = useAuth()
  return user?.id ?? 'system'
}

export function FinanceTimelinePage() {
  const { data, isLoading } = useFinanceDashboard()
  const { data: brain } = useFinanceBrain()
  const { data: batches } = useFinanceBatches()
  const actorUserId = useActorUserId()
  const enqueue = useEnqueueFinanceEventsMutation()

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return null

  return (
    <ErpModuleShell title="Financial Timeline" description="Posting KPIs · Brain insights" kpis={data.kpis}>
      <div className="p-4 pt-6 space-y-4">
        <Button
          onClick={() =>
            enqueue.mutate({
              actorUserId,
              idempotencyKey: newFinanceIdempotencyKey('enq'),
            })
          }
          disabled={enqueue.isPending}
        >
          Enqueue operational events
        </Button>
        {brain ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Brain · anomaly avg {brain.avgCostAnomalyScore} · debit posted{' '}
                {brain.totalDebitPosted}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                rowKey={(r) => r.batchId}
                data={brain.profitabilityInsights}
                columns={[
                  { key: 'no', header: 'Batch', render: (r) => r.batchNo },
                  { key: 'src', header: 'Source', render: (r) => r.sourceEventType },
                  { key: 'hint', header: 'Profitability', render: (r) => r.hint },
                  { key: 'a', header: 'Anomaly', render: (r) => r.costAnomalyScore },
                ]}
              />
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={batches ?? []}
              columns={[
                {
                  key: 'no',
                  header: 'Batch',
                  render: (r) => (
                    <Link className="text-primary underline" to={`/finance-integration/queue/${r.id}`}>
                      {r.batchNo}
                    </Link>
                  ),
                },
                { key: 'src', header: 'Source', render: (r) => r.sourceEventType },
                {
                  key: 'st',
                  header: 'Status',
                  render: (r) => <StatusBadge label={r.status} />,
                },
                {
                  key: 'amt',
                  header: 'Debit',
                  render: (r) => r.journalEntry.debitTotal,
                },
                {
                  key: 'tl',
                  header: 'Last action',
                  render: (r) => r.timeline[r.timeline.length - 1]?.action ?? '—',
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function FinancePostingQueuePage() {
  const { data, isLoading } = useFinanceQueue()
  const actorUserId = useActorUserId()
  const post = usePostBatchMutation()

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Posting Queue</CardTitle>
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
                <Link className="text-primary underline" to={`/finance-integration/queue/${r.id}`}>
                  {r.batchNo}
                </Link>
              ),
            },
            { key: 'src', header: 'Source', render: (r) => r.sourceEventType },
            { key: 'ref', header: 'Ref', render: (r) => r.sourceReferenceNo },
            { key: 'per', header: 'Period', render: (r) => r.financialPeriodCode },
            { key: 'dr', header: 'Debit', render: (r) => r.journalEntry.debitTotal },
            { key: 'cr', header: 'Credit', render: (r) => r.journalEntry.creditTotal },
            {
              key: 'act',
              header: '',
              render: (r) => (
                <Button
                  size="sm"
                  onClick={() =>
                    post.mutate({
                      batchId: r.id,
                      actorUserId,
                      idempotencyKey: newFinanceIdempotencyKey('post'),
                    })
                  }
                >
                  Post
                </Button>
              ),
            },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function FinanceBatchDetailPage() {
  const { batchId = '' } = useParams()
  const { data, isLoading } = useFinanceBatchDetail(batchId)
  const actorUserId = useActorUserId()
  const post = usePostBatchMutation()
  const reverse = useReverseBatchMutation()

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return <div className="p-8">Batch bulunamadı</div>

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {data.batchNo} · <StatusBadge label={data.status} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            {data.sourceEventType} · {data.sourceReferenceNo} · period {data.financialPeriodCode}
          </div>
          <div>
            Journal {data.journalEntry.journalNo} · D {data.journalEntry.debitTotal} / C{' '}
            {data.journalEntry.creditTotal} · balanced={String(data.journalEntry.balanced)}
          </div>
          {data.postingResult ? (
            <div>
              Posted {data.postingResult.postedAt} by {data.postingResult.postedBy} ·{' '}
              {data.postingResult.externalRef}
            </div>
          ) : null}
          {data.postingError ? (
            <div className="text-destructive">
              {data.postingError.code}: {data.postingError.message}
            </div>
          ) : null}
          <div className="flex gap-2">
            {data.status === 'Queued' || data.status === 'Failed' ? (
              <Button
                onClick={() =>
                  post.mutate({
                    batchId: data.id,
                    actorUserId,
                    idempotencyKey: newFinanceIdempotencyKey('post'),
                  })
                }
              >
                Post
              </Button>
            ) : null}
            {data.status === 'Posted' ? (
              <Button
                variant="outline"
                onClick={() =>
                  reverse.mutate({
                    batchId: data.id,
                    actorUserId,
                    idempotencyKey: newFinanceIdempotencyKey('rev'),
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
          <CardTitle className="text-base">Journal Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={data.journalEntry.lines}
            columns={[
              { key: 'n', header: '#', render: (r) => r.lineNo },
              { key: 'gl', header: 'GL', render: (r) => `${r.glAccountCode} ${r.glAccountName}` },
              { key: 'side', header: 'Side', render: (r) => r.side },
              { key: 'amt', header: 'Amount', render: (r) => r.amount },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={data.timeline}
            columns={[
              { key: 't', header: 'When', render: (r) => r.occurredAt },
              { key: 'a', header: 'Action', render: (r) => r.action },
              { key: 'u', header: 'Actor', render: (r) => r.actorUserId },
              { key: 'n', header: 'Note', render: (r) => r.note ?? '—' },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function FinancePostingResultPage() {
  const { data, isLoading } = useFinanceResults()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Posting Result</CardTitle>
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
                <Link className="text-primary underline" to={`/finance-integration/queue/${r.id}`}>
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
              key: 'ext',
              header: 'External',
              render: (r) => r.postingResult?.externalRef ?? '—',
            },
            { key: 'dr', header: 'Debit', render: (r) => r.journalEntry.debitTotal },
            { key: 'cr', header: 'Credit', render: (r) => r.journalEntry.creditTotal },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function FinanceFailedPostingPage() {
  const { data, isLoading } = useFinanceFailed()
  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Failed Posting</CardTitle>
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
                <Link className="text-primary underline" to={`/finance-integration/queue/${r.id}`}>
                  {r.batchNo}
                </Link>
              ),
            },
            { key: 'src', header: 'Source', render: (r) => r.sourceEventType },
            {
              key: 'err',
              header: 'Error',
              render: (r) => r.postingError?.message ?? '—',
            },
          ]}
        />
      </CardContent>
    </Card>
  )
}

export function FinanceGlMappingPage() {
  const { data, isLoading } = useFinanceMappings()
  const { data: periods } = useFinancePeriods()
  const actorUserId = useActorUserId()
  const upsert = useUpsertGlMappingMutation()
  const closePeriod = useCloseFinancialPeriodMutation()
  const [sourceEventType, setSourceEventType] =
    useState<AccountingSourceEventType>('CommercialInvoiceIssued')
  const [role, setRole] = useState<'debit' | 'credit'>('debit')
  const [glCode, setGlCode] = useState('1200')
  const [glName, setGlName] = useState('Accounts Receivable')

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">GL Mapping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 items-end">
            <label className="text-sm space-y-1">
              <span>Source</span>
              <select
                className="block border rounded px-2 py-1 text-sm"
                value={sourceEventType}
                onChange={(e) => setSourceEventType(e.target.value as AccountingSourceEventType)}
              >
                {(
                  [
                    'ProductionComplete',
                    'FinishedGoodsReceipt',
                    'ShipmentDeparted',
                    'CommercialInvoiceIssued',
                    'PurchaseReceipt',
                    'PurchaseInvoice',
                    'InventoryAdjustment',
                    'CostClosing',
                  ] as AccountingSourceEventType[]
                ).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm space-y-1">
              <span>Role</span>
              <select
                className="block border rounded px-2 py-1 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as 'debit' | 'credit')}
              >
                <option value="debit">debit</option>
                <option value="credit">credit</option>
              </select>
            </label>
            <label className="text-sm space-y-1">
              <span>GL code</span>
              <Input value={glCode} onChange={(e) => setGlCode(e.target.value)} />
            </label>
            <label className="text-sm space-y-1">
              <span>GL name</span>
              <Input value={glName} onChange={(e) => setGlName(e.target.value)} />
            </label>
            <Button
              onClick={() =>
                upsert.mutate({
                  actorUserId,
                  sourceEventType,
                  role,
                  glAccountCode: glCode,
                  glAccountName: glName,
                  idempotencyKey: newFinanceIdempotencyKey('glm'),
                })
              }
            >
              Upsert mapping
            </Button>
          </div>
          <DataTable
            rowKey={(r) => r.id}
            data={data ?? []}
            columns={[
              { key: 'src', header: 'Source', render: (r) => r.sourceEventType },
              { key: 'role', header: 'Role', render: (r) => r.role },
              { key: 'gl', header: 'Account', render: (r) => `${r.glAccountCode} ${r.glAccountName}` },
            ]}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Financial Periods</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.code}
            data={periods ?? []}
            columns={[
              { key: 'c', header: 'Code', render: (r) => r.code },
              { key: 'l', header: 'Label', render: (r) => r.label },
              {
                key: 'st',
                header: 'Status',
                render: (r) => <StatusBadge label={r.status} />,
              },
              {
                key: 'act',
                header: '',
                render: (r) =>
                  r.status === 'Open' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        closePeriod.mutate({
                          periodCode: r.code,
                          actorUserId,
                          idempotencyKey: newFinanceIdempotencyKey('close'),
                        })
                      }
                    >
                      Close
                    </Button>
                  ) : (
                    '—'
                  ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
