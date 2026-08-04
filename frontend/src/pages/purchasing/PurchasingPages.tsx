import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { purchaseOrderLifecycleBadge } from '@/application/purchasing/purchasing.dto'
import {
  PurchaseOrderDomainError,
  useApprovePurchaseOrderMutation,
  useArchivePurchaseOrderMutation,
  useCancelPurchaseOrderMutation,
  useClosePurchaseOrderMutation,
  useCreatePurchaseOrderMutation,
  useCreatePurchaseOrderRevisionMutation,
  useCreateRfqMutation,
  usePurchaseOrderDetail,
  usePurchaseOrderList,
  usePurchaseRequestList,
  usePurchasingKpis,
  useQuotationCompare,
  useRfqList,
  useSelectQuotationMutation,
} from '@/application/purchasing/use-purchasing'
import { DataTable, ErpModuleShell, ErpToolbar, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supplierRepository } from '@/domain/master-data'
import { useDataList } from '@/hooks/use-data-list'

const ACTOR = 'pilot-user'

export function PurchasingPage() {
  const { data: kpis } = usePurchasingKpis()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Satın Alma</h2>
        <p className="text-muted-foreground">
          MRP → SAT → RFQ → Teklif → PO → Mal Kabul zinciri
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">SAT</p><p className="text-2xl font-semibold">{kpis?.totalPr ?? '—'}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Açık SAT</p><p className="text-2xl font-semibold">{kpis?.openPr ?? '—'}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">PO</p><p className="text-2xl font-semibold">{kpis?.totalPo ?? '—'}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Açık PO</p><p className="text-2xl font-semibold">{kpis?.openPo ?? '—'}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">RFQ</p><p className="text-2xl font-semibold">{kpis?.totalRfq ?? '—'}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="pr">
        <TabsList>
          <TabsTrigger value="pr">Satın Alma Talepleri</TabsTrigger>
          <TabsTrigger value="rfq">RFQ</TabsTrigger>
          <TabsTrigger value="compare">Teklif Karşılaştır</TabsTrigger>
          <TabsTrigger value="po">Satın Alma Siparişleri</TabsTrigger>
        </TabsList>
        <TabsContent value="pr" className="mt-4"><PurchaseRequisitionList /></TabsContent>
        <TabsContent value="rfq" className="mt-4"><RfqPanel /></TabsContent>
        <TabsContent value="compare" className="mt-4"><QuotationComparePanel /></TabsContent>
        <TabsContent value="po" className="mt-4"><PurchaseOrderList /></TabsContent>
      </Tabs>
    </div>
  )
}

function PurchaseRequisitionList() {
  const { data: rows = [], isLoading } = usePurchaseRequestList()
  const createRfq = useCreateRfqMutation()
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const list = useDataList({
    data: rows,
    searchFields: [(r) => r.prNo, (r) => r.sourceOrderNo, (r) => r.materialCode, (r) => r.suggestedSupplier],
    initialSort: { key: 'prNo', direction: 'desc' },
  })

  async function issueRfq() {
    if (selected.length === 0) return
    setError(null)
    const suppliers = supplierRepository.getActive().slice(0, 2).map((s) => s.code)
    try {
      await createRfq.mutateAsync({
        purchaseRequestIds: selected,
        supplierCodes: suppliers,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        actorUserId: ACTOR,
      })
      setSelected([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'RFQ oluşturulamadı')
    }
  }

  return (
    <ErpModuleShell
      title="Satın Alma Talepleri"
      description="MRP serbest bırakma sonrası oluşan talepler."
      kpis={[]}
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <ErpToolbar searchPlaceholder="PR no, sipariş, malzeme..." searchValue={list.search} onSearchChange={list.setSearch} />
          <Button size="sm" disabled={selected.length === 0 || createRfq.isPending} onClick={() => void issueRfq()}>
            RFQ Oluştur ({selected.length})
          </Button>
        </div>
      }
      pagination={{
        page: list.page,
        totalPages: list.totalPages,
        pageSize: list.pageSize,
        totalCount: list.totalCount,
        onPageChange: list.setPage,
        onPageSizeChange: list.setPageSize,
      }}
    >
      {error && <p className="px-4 text-sm text-destructive">{error}</p>}
      <div className="overflow-x-auto p-4 pt-6">
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor...</p>
        ) : (
          <DataTable
            rowKey={(r) => r.id}
            data={list.paginated}
            columns={[
              {
                key: 'sel',
                header: '',
                render: (r) =>
                  r.status.label === 'Submitted' ? (
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id),
                        )
                      }
                    />
                  ) : null,
              },
              { key: 'pr', header: 'PR No', render: (r) => <span className="font-medium">{r.prNo}</span> },
              { key: 'order', header: 'Sipariş', render: (r) => r.sourceOrderNo },
              { key: 'mat', header: 'Malzeme', render: (r) => `${r.materialCode} — ${r.materialName}` },
              { key: 'qty', header: 'Miktar', render: (r) => `${r.quantity.toLocaleString('tr-TR')} ${r.unit}` },
              { key: 'supplier', header: 'Önerilen Tedarikçi', render: (r) => r.suggestedSupplier },
              { key: 'date', header: 'Termin', render: (r) => r.requiredDate },
              { key: 'status', header: 'Durum', render: (r) => <StatusBadge {...r.status} /> },
            ]}
          />
        )}
      </div>
    </ErpModuleShell>
  )
}

function RfqPanel() {
  const { data: rows = [] } = useRfqList()
  const list = useDataList({
    data: rows,
    searchFields: [(r) => r.rfqNo],
    initialSort: { key: 'rfqNo', direction: 'desc' },
  })

  return (
    <ErpModuleShell title="RFQ" description="Tedarikçilere gönderilen fiyat talepleri." kpis={[]}>
      <div className="overflow-x-auto p-4">
        <DataTable
          rowKey={(r) => r.id}
          data={list.paginated}
          columns={[
            { key: 'rfq', header: 'RFQ No', render: (r) => <span className="font-medium">{r.rfqNo}</span> },
            { key: 'pr', header: 'SAT Sayısı', render: (r) => r.purchaseRequestCount },
            { key: 'sup', header: 'Tedarikçi', render: (r) => r.supplierCount },
            { key: 'due', header: 'Son Tarih', render: (r) => r.dueDate },
            { key: 'status', header: 'Durum', render: (r) => <StatusBadge {...r.status} /> },
            {
              key: 'action',
              header: '',
              render: (r) => (
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/purchasing?tab=compare&rfq=${r.id}`}>Teklifleri Karşılaştır</Link>
                </Button>
              ),
            },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

function QuotationComparePanel() {
  const params = new URLSearchParams(window.location.search)
  const rfqId = params.get('rfq') ?? ''
  const { data: rfqs = [] } = useRfqList()
  const [activeRfq, setActiveRfq] = useState(rfqId || rfqs[0]?.id || '')
  const { data: compare } = useQuotationCompare(activeRfq)
  const selectMutation = useSelectQuotationMutation()
  const createPo = useCreatePurchaseOrderMutation()
  const [error, setError] = useState<string | null>(null)

  async function selectAndCreatePo(quotationId: string, supplierCode: string) {
    if (!compare?.purchaseRequestIds[0]) return
    setError(null)
    try {
      await selectMutation.mutateAsync({ quotationId, actorUserId: ACTOR })
      await createPo.mutateAsync({
        purchaseRequestId: compare.purchaseRequestIds[0],
        quotationId,
        supplierCode,
        termin: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        deliveryWarehouse: 'HMD-01',
        actorUserId: ACTOR,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız')
    }
  }

  return (
    <ErpModuleShell title="Teklif Karşılaştırma" description="RFQ tekliflerini karşılaştırın ve PO oluşturun." kpis={[]}>
      <div className="flex flex-wrap gap-2 p-4 pb-0">
        {rfqs.map((r) => (
          <Button key={r.id} size="sm" variant={activeRfq === r.id ? 'default' : 'outline'} onClick={() => setActiveRfq(r.id)}>
            {r.rfqNo}
          </Button>
        ))}
      </div>
      {error && <p className="px-4 text-sm text-destructive">{error}</p>}
      <div className="overflow-x-auto p-4">
        {compare?.quotations.map((q) => (
          <Card key={q.id} className="mb-3">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{q.supplierName} — {q.quotationNo}</CardTitle>
                <StatusBadge {...q.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">Toplam: {q.totalAmount.toLocaleString('tr-TR')} {q.currency}</p>
              <Button
                size="sm"
                disabled={selectMutation.isPending || createPo.isPending}
                onClick={() => void selectAndCreatePo(q.id, q.supplierCode)}
              >
                Seç ve PO Oluştur
              </Button>
            </CardContent>
          </Card>
        )) ?? <p className="text-muted-foreground">RFQ seçin veya önce RFQ oluşturun.</p>}
      </div>
    </ErpModuleShell>
  )
}

function PurchaseOrderList() {
  const { data: rows = [] } = usePurchaseOrderList()
  const list = useDataList({
    data: rows,
    searchFields: [(r) => r.poNo, (r) => r.sourceOrderNo, (r) => r.supplier],
    initialSort: { key: 'poNo', direction: 'desc' },
  })

  return (
    <ErpModuleShell title="Satın Alma Siparişleri" description="Onay, revizyon ve yaşam döngüsü yönetimi." kpis={[]}>
      <div className="overflow-x-auto p-4 pt-6">
        <DataTable
          rowKey={(r) => r.id}
          data={list.paginated}
          columns={[
            {
              key: 'po',
              header: 'PO No',
              render: (r) => (
                <Link to={`/purchasing/orders/${r.id}`} className="font-medium text-primary hover:underline">
                  {r.poNo}
                </Link>
              ),
            },
            { key: 'order', header: 'Sipariş', render: (r) => r.sourceOrderNo },
            { key: 'supplier', header: 'Tedarikçi', render: (r) => r.supplier },
            { key: 'termin', header: 'Termin', render: (r) => r.termin },
            { key: 'amount', header: 'Tutar', render: (r) => `${r.totalAmount.toLocaleString('tr-TR')} ${r.currency}` },
            { key: 'status', header: 'Durum', render: (r) => <StatusBadge {...r.status} /> },
          ]}
        />
      </div>
    </ErpModuleShell>
  )
}

function PurchaseOrderLifecyclePanel({
  poId,
  version,
  lifecycleStatus,
  revisionNo,
}: {
  poId: string
  version: number
  lifecycleStatus: string
  revisionNo: number
}) {
  const [comment, setComment] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const approve = useApprovePurchaseOrderMutation(poId)
  const cancel = useCancelPurchaseOrderMutation(poId)
  const close = useClosePurchaseOrderMutation(poId)
  const archive = useArchivePurchaseOrderMutation(poId)
  const revision = useCreatePurchaseOrderRevisionMutation(poId)

  const cmd = { expectedVersion: version, actorUserId: ACTOR, comment: comment.trim() || undefined }

  async function run(action: () => Promise<unknown>) {
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof PurchaseOrderDomainError ? err.message : 'İşlem başarısız')
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Onay & Yaşam Döngüsü</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge {...purchaseOrderLifecycleBadge(lifecycleStatus as never)} />
          <span className="text-sm text-muted-foreground">Rev. {revisionNo}</span>
        </div>
        <Input placeholder="İşlem notu" value={comment} onChange={(e) => setComment(e.target.value)} />
        {(lifecycleStatus === 'Draft' || lifecycleStatus === 'Under Review') && (
          <Button size="sm" variant="outline" disabled={approve.isPending} onClick={() => run(() => approve.mutateAsync(cmd))}>
            Onayla
          </Button>
        )}
        {lifecycleStatus !== 'Cancelled' && lifecycleStatus !== 'Archived' && lifecycleStatus !== 'Closed' && (
          <Button size="sm" variant="outline" disabled={cancel.isPending} onClick={() => run(() => cancel.mutateAsync(cmd))}>
            İptal
          </Button>
        )}
        {(lifecycleStatus === 'Open' || lifecycleStatus === 'Partially Received' || lifecycleStatus === 'Completed') && (
          <Button size="sm" variant="outline" disabled={close.isPending} onClick={() => run(() => close.mutateAsync(cmd))}>
            Kapat
          </Button>
        )}
        {lifecycleStatus === 'Closed' && (
          <Button size="sm" variant="destructive" disabled={archive.isPending} onClick={() => run(() => archive.mutateAsync(cmd))}>
            Arşivle
          </Button>
        )}
        {(lifecycleStatus === 'Open' || lifecycleStatus === 'Closed') && (
          <div className="flex gap-2">
            <Input placeholder="Revizyon nedeni" value={reason} onChange={(e) => setReason(e.target.value)} />
            <Button
              size="sm"
              variant="secondary"
              disabled={!reason.trim() || revision.isPending}
              onClick={() => run(() => revision.mutateAsync({ ...cmd, reason: reason.trim() }))}
            >
              Revizyon
            </Button>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}

export function PurchaseOrderDetailPage({ poId }: { poId: string }) {
  const { data: po, isLoading } = usePurchaseOrderDetail(poId)
  if (isLoading) return <p>Yükleniyor...</p>
  if (!po) return <p>PO bulunamadı</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{po.poNo}</h2>
          <p className="text-muted-foreground">{po.supplier} · {po.sourceOrderNo} · Termin {po.termin}</p>
        </div>
        <Button variant="outline" asChild><Link to="/purchasing">← Satın Alma</Link></Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Depo</p><p className="font-medium">{po.deliveryWarehouse}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Para Birimi</p><p className="font-medium">{po.currency}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Toplam</p><p className="font-medium">{po.totalAmount.toLocaleString('tr-TR')} {po.currency}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Durum</p><StatusBadge {...po.status} /></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">PO Satırları</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2">Malzeme</th>
                    <th className="px-3 py-2">Miktar</th>
                    <th className="px-3 py-2">Birim Fiyat</th>
                    <th className="px-3 py-2">Teslim</th>
                    <th className="px-3 py-2">Kalan</th>
                  </tr>
                </thead>
                <tbody>
                  {po.lines.map((line) => (
                    <tr key={line.id} className="border-b border-border/60">
                      <td className="px-3 py-2">{line.materialCode} — {line.materialName}</td>
                      <td className="px-3 py-2 tabular-nums">{line.quantity} {line.unit}</td>
                      <td className="px-3 py-2 tabular-nums">{line.unitPrice.toFixed(2)}</td>
                      <td className="px-3 py-2 tabular-nums text-emerald-700">{line.deliveredQty}</td>
                      <td className="px-3 py-2 tabular-nums text-amber-700">{line.remainingQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Revizyon Geçmişi (immutable)</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {po.revisionHistory.map((r) => (
                  <li key={r.revisionNo}>R{r.revisionNo} — {r.status} — {r.changeNote} ({r.changedAt.slice(0, 10)})</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <PurchaseOrderLifecyclePanel
          poId={po.id}
          version={po.version}
          lifecycleStatus={po.lifecycleStatus}
          revisionNo={po.revisionNo}
        />
      </div>
    </div>
  )
}

export function PurchaseOrderDetailRoute() {
  const { poId } = useParams<{ poId: string }>()
  if (!poId) return null
  return <PurchaseOrderDetailPage poId={poId} />
}
