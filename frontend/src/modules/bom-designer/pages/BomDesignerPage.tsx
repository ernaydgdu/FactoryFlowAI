import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'

import { useAuth } from '@/application/platform/iam/auth-context'
import type { BomDesignerLineDto, BomLineCommandInput } from '@/application/bom-designer/bom-designer.dto'
import { bomStatusBadge } from '@/application/bom-designer/bom-designer.dto'
import {
  BomDomainError,
  useActivateBomRevisionMutation,
  useArchiveBomMutation,
  useBomDesigner,
  useSubmitBomForReviewMutation,
  useUpdateBomMutation,
} from '@/application/bom-designer/use-bom-designer'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { BomApprovalDialog } from '../components/BomApprovalDialog'
import { BomLineDialog } from '../components/BomLineDialog'
import { BomRevisionCompare } from '../components/BomRevisionCompare'
import { BomRevisionDialog } from '../components/BomRevisionDialog'

type TabId = 'lines' | 'history' | 'compare'

function toCommandLines(lines: BomDesignerLineDto[]): BomLineCommandInput[] {
  return lines.map((l) => ({
    id: l.id,
    stockCardId: l.stockCardId,
    consumption: l.consumption,
    wastePercent: l.wastePercent,
    alternativeStockCardId: l.alternativeStockCardId,
    notes: l.notes,
    requirement: l.requirement,
  }))
}

export function BomDesignerPage() {
  const { productId = '' } = useParams<{ productId: string }>()
  const { user } = useAuth()
  const actorUserId = user?.id ?? 'system'
  const { data: bom, isLoading, isError, refetch } = useBomDesigner(productId)

  const [tab, setTab] = useState<TabId>('lines')
  const [draftLines, setDraftLines] = useState<BomDesignerLineDto[] | null>(null)
  const [lineDialogOpen, setLineDialogOpen] = useState(false)
  const [editingLine, setEditingLine] = useState<BomDesignerLineDto | null>(null)
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [compareRevisionId, setCompareRevisionId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateMutation = useUpdateBomMutation(productId)
  const submitMutation = useSubmitBomForReviewMutation(productId)
  const activateMutation = useActivateBomRevisionMutation(productId)
  const archiveMutation = useArchiveBomMutation(productId)

  const workingLines = draftLines ?? bom?.lines ?? []
  const isDirty = draftLines !== null
  const editable = bom?.editable ?? false

  const commandLines = useMemo(() => toCommandLines(workingLines), [workingLines])

  async function saveLines() {
    if (!bom) return
    setError(null)
    try {
      await updateMutation.mutateAsync({
        expectedVersion: bom.productVersion,
        actorUserId,
        lines: commandLines,
      })
      setDraftLines(null)
      setMessage('BOM kaydedildi.')
      void refetch()
    } catch (err) {
      setError(err instanceof BomDomainError ? err.message : 'Kayıt başarısız.')
    }
  }

  function openAddLine() {
    setEditingLine(null)
    setLineDialogOpen(true)
  }

  function openEditLine(line: BomDesignerLineDto) {
    setEditingLine(line)
    setLineDialogOpen(true)
  }

  function handleLineSave(input: BomLineCommandInput) {
    if (!bom) return
    const base = draftLines ?? bom.lines
    if (input.id) {
      setDraftLines(
        base.map((l) =>
          l.id === input.id
            ? {
                ...l,
                stockCardId: input.stockCardId,
                consumption: input.consumption,
                wastePercent: input.wastePercent,
                alternativeStockCardId: input.alternativeStockCardId,
                notes: input.notes,
                requirement: input.requirement ?? 'Zorunlu',
              }
            : l,
        ),
      )
    } else {
      const id = `bom-line-${Date.now()}`
      setDraftLines([
        ...base,
        {
          id,
          stockCardId: input.stockCardId,
          materialCode: input.stockCardId,
          materialName: input.stockCardId,
          category: '—',
          unit: '—',
          consumption: input.consumption,
          wastePercent: input.wastePercent,
          actualConsumption: input.consumption,
          grossRequired: 0,
          netRequired: 0,
          warehouseCode: '—',
          alternativeStockCardId: input.alternativeStockCardId,
          notes: input.notes,
          requirement: input.requirement ?? 'Zorunlu',
          valid: { label: input.requirement ?? 'Zorunlu', tone: 'default' },
        },
      ])
    }
  }

  function removeLine(lineId: string) {
    const base = draftLines ?? bom?.lines ?? []
    setDraftLines(base.filter((l) => l.id !== lineId))
  }

  async function runLifecycle(
    action: () => Promise<unknown>,
    success: string,
  ) {
    setError(null)
    try {
      await action()
      setDraftLines(null)
      setMessage(success)
      void refetch()
    } catch (err) {
      setError(err instanceof BomDomainError ? err.message : 'İşlem başarısız.')
    }
  }

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (isError || !bom) return <p className="p-8">BOM bulunamadı</p>

  return (
    <>
      <ErpModuleShell
        title="BOM Designer"
        description={`${bom.productCode} — ${bom.productName}`}
        headerActions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge {...bomStatusBadge(bom.lifecycleStatus)} />
            <Button variant="outline" asChild>
              <Link to={`/products/${productId}`}>← Ürün Kartı</Link>
            </Button>
          </div>
        }
        kpis={[
          { label: 'BOM Satırı', value: String(workingLines.length), hint: 'Malzeme' },
          { label: 'Revizyon', value: String(bom.revisionNo), hint: bomStatusBadge(bom.lifecycleStatus).label },
          { label: 'Sipariş Adet', value: bom.orderQty.toLocaleString('tr-TR'), hint: 'Hesaplama baz' },
          {
            label: 'Validasyon',
            value: bom.isValid ? 'Geçerli' : 'Hatalı',
            hint: bom.validationErrors[0] ?? 'OK',
          },
        ]}
      >
        <div className="space-y-4 p-4 pt-6">
          <div className="flex flex-wrap gap-2 border-b pb-3">
            {(['lines', 'history', 'compare'] as TabId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  tab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {id === 'lines' ? 'Satırlar' : id === 'history' ? 'Versiyon Geçmişi' : 'Revizyon Compare'}
              </button>
            ))}
          </div>

          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {tab === 'lines' && (
            <>
              <div className="flex flex-wrap gap-2">
                {editable && (
                  <>
                    <Button size="sm" onClick={openAddLine}>
                      <Plus className="size-4" /> Satır Ekle
                    </Button>
                    {isDirty && (
                      <Button size="sm" onClick={saveLines} disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
                      </Button>
                    )}
                    {isDirty && (
                      <Button size="sm" variant="outline" onClick={() => setDraftLines(null)}>
                        İptal
                      </Button>
                    )}
                  </>
                )}
                {bom.lifecycleStatus === 'Draft' && !isDirty && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={submitMutation.isPending}
                    onClick={() =>
                      runLifecycle(
                        () =>
                          submitMutation.mutateAsync({
                            expectedVersion: bom.productVersion,
                            actorUserId,
                          }),
                        'İncelemeye gönderildi',
                      )
                    }
                  >
                    İncelemeye Gönder
                  </Button>
                )}
                {(bom.lifecycleStatus === 'Draft' || bom.lifecycleStatus === 'Under Review') && (
                  <Button size="sm" onClick={() => setApprovalOpen(true)}>
                    Onay…
                  </Button>
                )}
                {bom.lifecycleStatus === 'Approved' && (
                  <Button
                    size="sm"
                    disabled={activateMutation.isPending}
                    onClick={() =>
                      runLifecycle(
                        () =>
                          activateMutation.mutateAsync({
                            expectedVersion: bom.productVersion,
                            actorUserId,
                            revisionRecordId: bom.activeRevisionRecordId,
                          }),
                        'Revizyon aktive edildi',
                      )
                    }
                  >
                    Revizyonu Aktive Et
                  </Button>
                )}
                {(bom.lifecycleStatus === 'Active' || bom.lifecycleStatus === 'Approved') && (
                  <Button size="sm" variant="secondary" onClick={() => setRevisionOpen(true)}>
                    Yeni Revizyon…
                  </Button>
                )}
                {bom.lifecycleStatus === 'Active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={archiveMutation.isPending}
                    onClick={() =>
                      runLifecycle(
                        () =>
                          archiveMutation.mutateAsync({
                            expectedVersion: bom.productVersion,
                            actorUserId,
                          }),
                        'BOM arşivlendi',
                      )
                    }
                  >
                    Arşivle
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto">
                <DataTable
                  rowKey={(l) => l.id}
                  data={workingLines}
                  columns={[
                    { key: 'code', header: 'Kod', render: (l) => l.materialCode },
                    { key: 'name', header: 'Malzeme', render: (l) => l.materialName },
                    { key: 'cat', header: 'Kategori', render: (l) => l.category },
                    { key: 'cons', header: 'Tüketim', render: (l) => `${l.consumption} ${l.unit}` },
                    { key: 'waste', header: 'Fire %', render: (l) => `${l.wastePercent}%` },
                    { key: 'alt', header: 'Alternatif', render: (l) => l.alternativeMaterialCode ?? '—' },
                    { key: 'note', header: 'Not', render: (l) => l.notes ?? '—' },
                    { key: 'req', header: 'Zorunluluk', render: (l) => <StatusBadge {...l.valid} /> },
                    {
                      key: 'actions',
                      header: '',
                      render: (l) =>
                        editable ? (
                          <div className="flex gap-1">
                            <Button type="button" size="sm" variant="ghost" onClick={() => openEditLine(l)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => removeLine(l.id)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ) : null,
                    },
                  ]}
                />
              </div>
            </>
          )}

          {tab === 'history' && (
            <Card>
              <CardHeader><CardTitle className="text-base">BOM Versiyon Geçmişi</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <DataTable
                  rowKey={(r) => `${r.revisionNo}-${r.changedAt}`}
                  data={bom.revisionHistory}
                  columns={[
                    { key: 'rev', header: 'Rev.', render: (r) => String(r.revisionNo) },
                    { key: 'status', header: 'Durum', render: (r) => r.status },
                    { key: 'at', header: 'Tarih', render: (r) => new Date(r.changedAt).toLocaleString('tr-TR') },
                    { key: 'by', header: 'Kullanıcı', render: (r) => r.changedBy },
                    { key: 'lines', header: 'Satır', render: (r) => String(r.lineCount) },
                    { key: 'note', header: 'Not', render: (r) => r.changeNote },
                  ]}
                />
                {bom.entityRevisions.length > 0 && (
                  <div className="mt-6">
                    <h4 className="mb-2 text-sm font-medium">Entity Revision Kayıtları</h4>
                    <DataTable
                      rowKey={(r) => r.id}
                      data={bom.entityRevisions}
                      columns={[
                        { key: 'rev', header: 'Rev.', render: (r) => String(r.revisionNo) },
                        { key: 'ver', header: 'Versiyon', render: (r) => r.version },
                        { key: 'status', header: 'Durum', render: (r) => r.status },
                        { key: 'reason', header: 'Neden', render: (r) => r.reasonOfChange },
                        {
                          key: 'cmp',
                          header: '',
                          render: (r) => (
                            <Button
                              type="button"
                              size="sm"
                              variant="link"
                              onClick={() => {
                                setCompareRevisionId(r.id)
                                setTab('compare')
                              }}
                            >
                              Compare
                            </Button>
                          ),
                        },
                      ]}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {tab === 'compare' && (
            <Card>
              <CardHeader><CardTitle className="text-base">Revizyon Compare</CardTitle></CardHeader>
              <CardContent>
                <label className="mb-4 block text-sm">
                  <span className="font-medium">Entity Revizyon</span>
                  <select
                    className="mt-1 flex h-9 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
                    value={compareRevisionId ?? ''}
                    onChange={(e) => setCompareRevisionId(e.target.value || null)}
                  >
                    <option value="">Seçin…</option>
                    {bom.entityRevisions.map((r) => (
                      <option key={r.id} value={r.id}>
                        R{r.revisionNo} — {r.reasonOfChange}
                      </option>
                    ))}
                  </select>
                </label>
                <BomRevisionCompare productId={productId} revisionRecordId={compareRevisionId} />
              </CardContent>
            </Card>
          )}
        </div>
      </ErpModuleShell>

      <BomLineDialog
        open={lineDialogOpen}
        line={editingLine}
        onClose={() => setLineDialogOpen(false)}
        onSave={handleLineSave}
      />
      <BomApprovalDialog
        bom={bom}
        actorUserId={actorUserId}
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        onSuccess={setMessage}
      />
      <BomRevisionDialog
        bom={bom}
        lines={commandLines}
        actorUserId={actorUserId}
        open={revisionOpen}
        onClose={() => setRevisionOpen(false)}
        onSuccess={setMessage}
      />
    </>
  )
}
