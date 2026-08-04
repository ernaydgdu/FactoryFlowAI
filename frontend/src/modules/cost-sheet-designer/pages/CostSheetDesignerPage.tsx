import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RefreshCw } from 'lucide-react'

import { useAuth } from '@/application/platform/iam/auth-context'
import type {
  CostSheetLineCommandInput,
  CostSheetLineDto,
  CostSheetRevisionHistoryDto,
} from '@/application/cost-sheet-designer/cost-sheet-designer.dto'
import { costSheetStatusBadge } from '@/application/cost-sheet-designer/cost-sheet-designer.dto'
import {
  CostSheetDomainError,
  useActivateCostSheetRevisionMutation,
  useArchiveCostSheetMutation,
  useCostSheetDesigner,
  useRecalculatePlannedCostMutation,
  useSubmitCostSheetForReviewMutation,
  useUpdateCostSheetMutation,
} from '@/application/cost-sheet-designer/use-cost-sheet-designer'
import { DataTable, ErpModuleShell, StatusBadge } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { CostSheetApprovalDialog } from '../components/CostSheetApprovalDialog'
import { CostSheetRevisionDialog } from '../components/CostSheetRevisionDialog'
import { CostSheetVariancePreview } from '../components/CostSheetVariancePreview'

type TabId = 'planned' | 'breakdown' | 'history' | 'variance'

function toCommandLines(lines: CostSheetLineDto[]): CostSheetLineCommandInput[] {
  return lines.map((l) => ({
    key: l.key,
    amount: l.amount,
    isManualOverride: l.isManualOverride || !l.bomDerived,
    notes: l.notes,
  }))
}

export function CostSheetDesignerPage() {
  const { productId = '' } = useParams<{ productId: string }>()
  const { user } = useAuth()
  const actorUserId = user?.id ?? 'system'
  const { data: costSheet, isLoading, isError, refetch } = useCostSheetDesigner(productId)

  const [tab, setTab] = useState<TabId>('planned')
  const [draftLines, setDraftLines] = useState<CostSheetLineDto[] | null>(null)
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const updateMutation = useUpdateCostSheetMutation(productId)
  const submitMutation = useSubmitCostSheetForReviewMutation(productId)
  const activateMutation = useActivateCostSheetRevisionMutation(productId)
  const archiveMutation = useArchiveCostSheetMutation(productId)
  const recalcMutation = useRecalculatePlannedCostMutation(productId)

  const workingLines = draftLines ?? costSheet?.lines ?? []
  const isDirty = draftLines !== null
  const editable = costSheet?.editable ?? false
  const commandLines = useMemo(() => toCommandLines(workingLines), [workingLines])

  function updateLineAmount(key: string, amount: number) {
    const base = draftLines ?? costSheet?.lines ?? []
    setDraftLines(
      base.map((l) =>
        l.key === key
          ? { ...l, amount, isManualOverride: l.bomDerived ? true : l.isManualOverride }
          : l,
      ),
    )
  }

  async function saveLines() {
    if (!costSheet) return
    setError(null)
    try {
      await updateMutation.mutateAsync({
        expectedVersion: costSheet.productVersion,
        actorUserId,
        lines: commandLines,
      })
      setDraftLines(null)
      setMessage('Maliyet çizelgesi kaydedildi.')
      void refetch()
    } catch (err) {
      setError(err instanceof CostSheetDomainError ? err.message : 'Kayıt başarısız.')
    }
  }

  async function runLifecycle(action: () => Promise<unknown>, success: string) {
    setError(null)
    try {
      await action()
      setDraftLines(null)
      setMessage(success)
      void refetch()
    } catch (err) {
      setError(err instanceof CostSheetDomainError ? err.message : 'İşlem başarısız.')
    }
  }

  if (isLoading) return <div className="p-8 text-muted-foreground">Yükleniyor…</div>
  if (isError || !costSheet) return <p className="p-8">Maliyet çizelgesi bulunamadı</p>

  const totalDraft = workingLines.reduce((s, l) => s + l.amount, 0)
  const previousTotal =
    costSheet.revisionHistory.length >= 2
      ? costSheet.revisionHistory[costSheet.revisionHistory.length - 2]?.totalPlannedCost ?? 0
      : costSheet.totalPlannedCost * 0.95

  return (
    <>
      <ErpModuleShell
        title="Planned Cost Sheet"
        description={`${costSheet.productCode} — ${costSheet.productName}`}
        headerActions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge {...costSheetStatusBadge(costSheet.lifecycleStatus)} />
            <Button variant="outline" asChild>
              <Link to={`/products/${productId}/bom`}>BOM →</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/products/${productId}`}>← Ürün Kartı</Link>
            </Button>
          </div>
        }
        kpis={[
          { label: 'Toplam Maliyet', value: `${costSheet.totalPlannedCost.toFixed(2)} USD`, hint: 'FOB baz' },
          { label: 'Birim Maliyet', value: `${costSheet.unitPlannedCost.toFixed(2)} USD`, hint: 'Adet başına' },
          { label: 'CM', value: `${costSheet.cm.toFixed(2)} USD`, hint: 'Cut-Make' },
          { label: 'Kar Marjı', value: `${costSheet.profitMarginPercent}%`, hint: 'Planlanan' },
        ]}
      >
        <div className="space-y-4 p-4 pt-6">
          <div className="flex flex-wrap gap-2 border-b pb-3">
            {([
              ['planned', 'Planned Cost'],
              ['breakdown', 'Maliyet Kırılımı'],
              ['history', 'Versiyon Geçmişi'],
              ['variance', 'Variance Preview'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  tab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {message && <p className="text-sm text-green-600">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap gap-2">
            {editable && (
              <>
                <Button onClick={saveLines} disabled={!isDirty || updateMutation.isPending}>
                  {updateMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
                </Button>
                {isDirty && (
                  <Button variant="outline" onClick={() => setDraftLines(null)}>Değişiklikleri İptal</Button>
                )}
                <Button
                  variant="outline"
                  onClick={() =>
                    runLifecycle(
                      () =>
                        recalcMutation.mutateAsync({
                          expectedVersion: costSheet.productVersion,
                          actorUserId,
                        }),
                      'BOM\'dan yeniden hesaplandı.',
                    )
                  }
                  disabled={recalcMutation.isPending}
                >
                  <RefreshCw className="mr-1 h-4 w-4" />
                  BOM'dan Hesapla
                </Button>
                {costSheet.lifecycleStatus === 'Draft' && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      runLifecycle(
                        () =>
                          submitMutation.mutateAsync({
                            expectedVersion: costSheet.productVersion,
                            actorUserId,
                          }),
                        'İncelemeye gönderildi.',
                      )
                    }
                  >
                    İncelemeye Gönder
                  </Button>
                )}
              </>
            )}
            {(costSheet.lifecycleStatus === 'Under Review' || costSheet.lifecycleStatus === 'Draft') && (
              <Button variant="outline" onClick={() => setApprovalOpen(true)}>Onayla</Button>
            )}
            {(costSheet.lifecycleStatus === 'Approved' || costSheet.lifecycleStatus === 'Active') && (
              <Button variant="outline" onClick={() => setRevisionOpen(true)}>Revizyon Oluştur</Button>
            )}
            {costSheet.lifecycleStatus === 'Approved' && (
              <Button
                onClick={() =>
                  runLifecycle(
                    () =>
                      activateMutation.mutateAsync({
                        expectedVersion: costSheet.productVersion,
                        actorUserId,
                      }),
                    'Revizyon aktive edildi.',
                  )
                }
              >
                Revizyonu Aktive Et
              </Button>
            )}
            {costSheet.lifecycleStatus === 'Active' && (
              <Button
                variant="destructive"
                onClick={() =>
                  runLifecycle(
                    () =>
                      archiveMutation.mutateAsync({
                        expectedVersion: costSheet.productVersion,
                        actorUserId,
                      }),
                    'Arşivlendi.',
                  )
                }
              >
                Arşivle
              </Button>
            )}
          </div>

          {tab === 'planned' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Planlanan Maliyet Kalemleri</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable<CostSheetLineDto>
                  columns={[
                    { key: 'label', header: 'Kalem', render: (line) => line.label },
                    {
                      key: 'amount',
                      header: 'Tutar (USD)',
                      render: (line) =>
                        editable ? (
                          <Input
                            type="number"
                            step="0.01"
                            className="h-8 w-28"
                            value={line.amount}
                            onChange={(e) => updateLineAmount(line.key, Number(e.target.value))}
                          />
                        ) : (
                          line.amount.toFixed(2)
                        ),
                    },
                    { key: 'unitAmount', header: 'Birim', render: (l) => l.unitAmount.toFixed(2) },
                    { key: 'percent', header: '%', render: (l) => `${l.percent}%` },
                    {
                      key: 'source',
                      header: 'Kaynak',
                      render: (l) => (
                        <span className="text-xs text-muted-foreground">
                          {l.bomDerived ? (l.isManualOverride ? 'BOM (manuel)' : 'BOM') : 'Manuel'}
                        </span>
                      ),
                    },
                  ]}
                  data={workingLines}
                  rowKey={(l) => l.key}
                />
                <p className="mt-3 text-sm text-muted-foreground">
                  Taslak toplam: <strong>{totalDraft.toFixed(2)} USD</strong>
                  {costSheet.bomRevisionNo != null && ` · BOM Rev. ${costSheet.bomRevisionNo}`}
                </p>
              </CardContent>
            </Card>
          )}

          {tab === 'breakdown' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Malzeme</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {workingLines.filter((l) => ['fabric', 'accessory', 'thread', 'packaging', 'waste'].includes(l.key)).map((l) => (
                    <div key={l.key} className="flex justify-between">
                      <span>{l.label}</span>
                      <span className="tabular-nums">{l.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Proses & Gider</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {workingLines.filter((l) => !['fabric', 'accessory', 'thread', 'packaging', 'waste', 'profitMargin'].includes(l.key)).map((l) => (
                    <div key={l.key} className="flex justify-between">
                      <span>{l.label}</span>
                      <span className="tabular-nums">{l.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {tab === 'history' && (
            <DataTable<CostSheetRevisionHistoryDto>
              columns={[
                { key: 'revisionNo', header: 'Rev.', render: (r) => r.revisionNo },
                { key: 'status', header: 'Durum', render: (r) => r.status },
                { key: 'totalPlannedCost', header: 'Toplam', render: (r) => r.totalPlannedCost.toFixed(2) },
                { key: 'changedAt', header: 'Tarih', render: (r) => new Date(r.changedAt).toLocaleString('tr-TR') },
                { key: 'changedBy', header: 'Kullanıcı', render: (r) => r.changedBy },
                { key: 'changeNote', header: 'Not', render: (r) => r.changeNote },
              ]}
              data={costSheet.revisionHistory}
              rowKey={(r) => `${r.revisionNo}-${r.changedAt}`}
            />
          )}

          {tab === 'variance' && (
            <CostSheetVariancePreview
              variance={costSheet.variancePreview}
              totalCurrent={costSheet.totalPlannedCost}
              totalPrevious={previousTotal}
            />
          )}
        </div>
      </ErpModuleShell>

      <CostSheetApprovalDialog
        costSheet={costSheet}
        actorUserId={actorUserId}
        open={approvalOpen}
        onClose={() => setApprovalOpen(false)}
        onSuccess={(msg) => setMessage(msg)}
      />
      <CostSheetRevisionDialog
        costSheet={costSheet}
        lines={commandLines}
        actorUserId={actorUserId}
        open={revisionOpen}
        onClose={() => setRevisionOpen(false)}
        onSuccess={(msg) => setMessage(msg)}
      />
    </>
  )
}
