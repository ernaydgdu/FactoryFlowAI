/**
 * Phase 6 Module 2 — Commercial & Export Documents UI.
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { useAuth } from '@/application/platform/iam/auth-context'
import {
  newCommercialDocumentsIdempotencyKey,
  useCommercialDocumentsAiValidation,
  useCommercialDocumentsDashboard,
  useCommercialInvoices,
  useCreateExportDocumentSetMutation,
  useExportDocumentSetDetail,
  useReviseDocumentSetMutation,
  useTransitionDocumentSetMutation,
  useValidateDocumentSetMutation,
} from '@/application/commercial-documents/use-commercial-documents'
import type { DocumentLifecycleStatus } from '@/domain/commercial-documents/commercial-documents.types'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function useActorUserId(): string {
  const { user } = useAuth()
  return user?.id ?? 'system'
}

export function CommercialInvoiceListPage() {
  const { data: dash, isLoading: dLoad } = useCommercialDocumentsDashboard()
  const { data: invoices, isLoading } = useCommercialInvoices()
  if (dLoad || isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>

  return (
    <ErpModuleShell
      title="Commercial Invoices"
      description="Export commercial invoice portfolio"
      kpis={dash?.kpis ?? []}
    >
      <div className="p-4 pt-6 space-y-4">
        <Button asChild>
          <Link to="/commercial-documents/issue">Issue Wizard</Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              rowKey={(r) => r.id}
              data={invoices ?? []}
              columns={[
                {
                  key: 'no',
                  header: 'Invoice',
                  render: (r) => (
                    <Link
                      className="text-primary underline"
                      to={`/commercial-documents/sets/${r.documentSetId}`}
                    >
                      {r.invoiceNo}
                    </Link>
                  ),
                },
                { key: 'set', header: 'Set', render: (r) => r.documentSetNo },
                { key: 'so', header: 'SO', render: (r) => r.salesOrderNo },
                { key: 'sh', header: 'Shipment', render: (r) => r.shipmentNo },
                { key: 'st', header: 'Status', render: (r) => <StatusBadge label={r.status} /> },
                { key: 'qty', header: 'Qty', render: (r) => r.totalQty },
                {
                  key: 'amt',
                  header: 'Amount',
                  render: (r) => `${r.totalAmount} ${r.currency}`,
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </ErpModuleShell>
  )
}

export function ExportDocumentSetListPage() {
  const { data } = useCommercialDocumentsDashboard()
  const sets = data?.invoices ?? []

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Document Sets</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.documentSetId}
            data={sets}
            columns={[
              {
                key: 'set',
                header: 'Set',
                render: (r) => (
                  <Link
                    className="text-primary underline"
                    to={`/commercial-documents/sets/${r.documentSetId}`}
                  >
                    {r.documentSetNo}
                  </Link>
                ),
              },
              { key: 'inv', header: 'Invoice', render: (r) => r.invoiceNo },
              { key: 'st', header: 'Status', render: (r) => <StatusBadge label={r.status} /> },
              { key: 'sh', header: 'Shipment', render: (r) => r.shipmentNo },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function ExportDocumentSetDetailPage() {
  const actorUserId = useActorUserId()
  const { documentSetId = '' } = useParams()
  const { data, isLoading } = useExportDocumentSetDetail(documentSetId)
  const { data: ai } = useCommercialDocumentsAiValidation(documentSetId)
  const transition = useTransitionDocumentSetMutation()
  const revise = useReviseDocumentSetMutation()
  const validate = useValidateDocumentSetMutation()
  const [err, setErr] = useState('')

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (!data) return <div className="p-8">Document set bulunamadı.</div>

  const flow: DocumentLifecycleStatus[] = ['UnderReview', 'Approved', 'Issued', 'Archived']

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {data.documentSetNo} · {data.commercialInvoice.invoiceNo}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.status} · {data.shipmentNo} · PL {data.packingListReference.packingListNo} ·{' '}
            {data.commercialInvoice.totalQty} qty · {data.commercialInvoice.volumeCbm} CBM
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={validate.isPending}
            onClick={() =>
              void validate
                .mutateAsync({ documentSetId: data.id, actorUserId })
                .catch((e: Error) => setErr(e.message))
            }
          >
            Validate
          </Button>
          {flow.map((to) => (
            <Button
              key={to}
              size="sm"
              variant="outline"
              disabled={transition.isPending || data.status === to}
              onClick={() =>
                void transition
                  .mutateAsync({
                    documentSetId: data.id,
                    toStatus: to,
                    idempotencyKey: newCommercialDocumentsIdempotencyKey(`tr-${to}`),
                    actorUserId,
                  })
                  .catch((e: Error) => setErr(e.message))
              }
            >
              → {to}
            </Button>
          ))}
          <Button
            size="sm"
            variant="secondary"
            disabled={revise.isPending}
            onClick={() =>
              void revise
                .mutateAsync({
                  documentSetId: data.id,
                  reason: 'Manual revise',
                  idempotencyKey: newCommercialDocumentsIdempotencyKey('rev'),
                  actorUserId,
                })
                .catch((e: Error) => setErr(e.message))
            }
          >
            Revise
          </Button>
        </CardContent>
      </Card>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Commercial Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={data.commercialInvoice.lines}
            columns={[
              { key: 'c', header: 'Color', render: (r) => r.color },
              { key: 's', header: 'Size', render: (r) => r.size },
              { key: 'q', header: 'Qty', render: (r) => r.quantity },
              { key: 'p', header: 'Unit', render: (r) => r.unitPrice },
              { key: 'a', header: 'Amount', render: (r) => r.lineAmount },
            ]}
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Total {data.commercialInvoice.totalAmount} {data.commercialInvoice.currency} · Net{' '}
            {data.commercialInvoice.netWeightKg} kg · Gross {data.commercialInvoice.grossWeightKg} kg
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Documents</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <div>COO: {data.certificateOfOrigin.certificateNo ?? '—'} ({data.certificateOfOrigin.status})</div>
          <div>
            Inspection: {data.inspectionCertificate.certificateNo ?? '—'} (
            {data.inspectionCertificate.status})
          </div>
          <div>B/L: {data.billOfLadingReference.blNo ?? '—'} ({data.billOfLadingReference.status})</div>
          <div>
            Export Decl: {data.exportDeclaration.declarationNo ?? '—'} (
            {data.exportDeclaration.status})
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
            data={data.approvals}
            columns={[
              { key: 'a', header: 'Action', render: (r) => r.action },
              { key: 'by', header: 'Actor', render: (r) => r.actorUserId },
              { key: 'at', header: 'At', render: (r) => r.occurredAt },
              { key: 'n', header: 'Note', render: (r) => r.note ?? '—' },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revision History</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            rowKey={(r) => r.id}
            data={data.revisions}
            columns={[
              { key: 'r', header: 'Rev', render: (r) => r.revision },
              { key: 'st', header: 'Status', render: (r) => r.status },
              { key: 'by', header: 'By', render: (r) => r.createdBy },
              { key: 'at', header: 'At', render: (r) => r.createdAt },
              { key: 'reason', header: 'Reason', render: (r) => r.reason ?? '—' },
            ]}
          />
        </CardContent>
      </Card>

      {ai ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Document Validation Surface</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-sm">{ai.ok ? 'PASS' : 'FAIL'}</p>
            <ul className="list-disc pl-5 text-sm">
              {ai.checks.map((c) => (
                <li key={c.code}>
                  {c.passed ? '✓' : '✗'} {c.code}: {c.detail}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

export function CommercialDocumentsIssueWizardPage() {
  const actorUserId = useActorUserId()
  const create = useCreateExportDocumentSetMutation()
  const transition = useTransitionDocumentSetMutation()
  const [shipmentId, setShipmentId] = useState('')
  const [unitPrice, setUnitPrice] = useState('12.5')
  const [activeId, setActiveId] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Issue Wizard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Requires Approved (Booked+) Shipment with Packing List. Qty/weight/CBM reconcile automatically.
          </p>
          <input
            className="h-9 w-full rounded-md border px-2 text-sm"
            value={shipmentId}
            onChange={(e) => setShipmentId(e.target.value)}
            placeholder="Shipment Id"
          />
          <input
            className="h-9 w-full rounded-md border px-2 text-sm"
            type="number"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            placeholder="Unit price"
          />
          <Button
            disabled={create.isPending || !shipmentId}
            onClick={() =>
              void create
                .mutateAsync({
                  shipmentId,
                  unitPrice: Number(unitPrice),
                  currency: 'USD',
                  idempotencyKey: newCommercialDocumentsIdempotencyKey('eds'),
                  actorUserId,
                })
                .then((s) => {
                  setActiveId(s.id)
                  setMsg(`Created ${s.documentSetNo} / ${s.commercialInvoice.invoiceNo}`)
                  setErr('')
                })
                .catch((e: Error) => setErr(e.message))
            }
          >
            1. Create from Shipment
          </Button>
          <Button
            variant="secondary"
            disabled={transition.isPending || !activeId}
            onClick={() =>
              void transition
                .mutateAsync({
                  documentSetId: activeId,
                  toStatus: 'UnderReview',
                  idempotencyKey: newCommercialDocumentsIdempotencyKey('sub'),
                  actorUserId,
                })
                .then(() =>
                  transition.mutateAsync({
                    documentSetId: activeId,
                    toStatus: 'Approved',
                    idempotencyKey: newCommercialDocumentsIdempotencyKey('appr'),
                    actorUserId,
                  }),
                )
                .then(() =>
                  transition.mutateAsync({
                    documentSetId: activeId,
                    toStatus: 'Issued',
                    idempotencyKey: newCommercialDocumentsIdempotencyKey('iss'),
                    actorUserId,
                  }),
                )
                .then((s) => {
                  setMsg(`Issued ${s.commercialInvoice.invoiceNo}`)
                  setErr('')
                })
                .catch((e: Error) => setErr(e.message))
            }
          >
            2. Submit → Approve → Issue
          </Button>
          {activeId ? (
            <Button variant="link" asChild>
              <Link to={`/commercial-documents/sets/${activeId}`}>Open detail</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
    </div>
  )
}
