import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { useAuth } from '@/application/platform/iam/auth-context'
import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader } from '@/components/erp'
import { FormField, FormGrid } from '@/components/erp/form-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import {
  createProductionLine,
  deleteProductionLine,
  fetchLineStatus,
  fetchProductionLines,
  updateProductionLine,
  type ApiProductionLine,
  type LineStatus,
} from '@/infrastructure/api/production-lines-api.repository'
import { cn } from '@/lib/utils'

function fillRateTone(fillRate: number): 'idle' | 'low' | 'good' | 'over' {
  if (fillRate <= 0) return 'idle'
  if (fillRate < 50) return 'low'
  if (fillRate <= 90) return 'good'
  return 'over'
}

const FILL_RATE_BAR_CLASS: Record<'idle' | 'low' | 'good' | 'over', string> = {
  idle: 'bg-muted-foreground/30',
  low: 'bg-destructive',
  good: 'bg-emerald-500',
  over: 'bg-amber-500',
}

const FILL_RATE_TEXT_CLASS: Record<'idle' | 'low' | 'good' | 'over', string> = {
  idle: 'text-muted-foreground',
  low: 'text-destructive',
  good: 'text-emerald-600',
  over: 'text-amber-600',
}

function LineCard({
  line,
  lineId,
  canManage,
}: {
  line: LineStatus
  lineId?: number
  canManage: boolean
}) {
  const queryClient = useQueryClient()
  const tone = fillRateTone(line.fillRate)
  const idle = line.todayProduction === 0
  const withinWorkday =
    line.currentHour >= line.workdayStartHour && line.currentHour < line.workdayEndHour
  const showPace = withinWorkday && !idle

  const [isEditing, setIsEditing] = useState(false)
  const [capacity, setCapacity] = useState(String(line.capacity))
  const [error, setError] = useState('')
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const updateMutation = useMutation({
    mutationFn: (newCapacity: number) => {
      if (!lineId) throw new Error('Hat bulunamadı.')
      return updateProductionLine(lineId, { capacity: newCapacity })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.productionLine.all })
      setIsEditing(false)
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Kapasite güncellenemedi.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!lineId) throw new Error('Hat bulunamadı.')
      return deleteProductionLine(lineId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.productionLine.all })
      void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.stockRecord.warehouses() })
      setConfirmDeleteOpen(false)
    },
    onError: (err) => {
      setDeleteError(err instanceof Error ? err.message : 'Hat silinemedi.')
      setConfirmDeleteOpen(false)
    },
  })

  function handleSave() {
    setError('')
    const parsed = Number(capacity)
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError('Geçerli bir kapasite girin.')
      return
    }
    updateMutation.mutate(parsed)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{line.lineName}</CardTitle>
          <div className="flex items-center gap-2">
            {idle ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Boşta
              </span>
            ) : (
              <span className={cn('text-sm font-semibold tabular-nums', FILL_RATE_TEXT_CLASS[tone])}>
                %{line.fillRate.toFixed(1)}
              </span>
            )}
            {canManage && lineId ? (
              <button
                type="button"
                onClick={() => {
                  setCapacity(String(line.capacity))
                  setError('')
                  setIsEditing((prev) => !prev)
                }}
                className="text-muted-foreground hover:text-foreground"
                title="Kapasiteyi düzenle"
              >
                <Pencil className="size-3.5" />
              </button>
            ) : null}
            {canManage && lineId ? (
              <button
                type="button"
                onClick={() => {
                  setDeleteError('')
                  setConfirmDeleteOpen(true)
                }}
                className="text-muted-foreground hover:text-destructive"
                title="Hattı sil"
              >
                <Trash2 className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2 pt-1">
            <Input
              type="number"
              min={0}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              className="h-8 w-28 text-sm"
            />
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={updateMutation.isPending}
            >
              İptal
            </Button>
          </div>
        ) : (
          <CardDescription>
            {line.todayProduction.toLocaleString('tr-TR')} / {line.capacity.toLocaleString('tr-TR')} adet
          </CardDescription>
        )}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {deleteError ? <p className="text-xs text-destructive">{deleteError}</p> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', FILL_RATE_BAR_CLASS[tone])}
            style={{ width: `${Math.min(line.fillRate, 100)}%` }}
          />
        </div>

        {showPace ? (
          line.onPace ? (
            <p className="text-xs font-medium text-emerald-600">✓ Hedefin ilerisinde/hedefte</p>
          ) : (
            <p className="text-xs font-medium text-amber-600">⚠️ {line.paceMessage}</p>
          )
        ) : null}

        {line.activeOrders.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Çalışan Siparişler</p>
            {line.activeOrders.map((order) => (
              <div
                key={order.orderNo}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <p className="font-medium">{order.orderNo}</p>
                <p className="text-xs text-muted-foreground">
                  {order.buyerName} · {order.productName}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Bugün bu hatta üretim girişi yapılmadı.</p>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Hattı sil"
        description={`${line.lineName} hattını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmLabel="Sil"
        destructive
        isConfirming={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </Card>
  )
}

function CreateLineForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [error, setError] = useState('')

  const createMutation = useMutation({
    mutationFn: () =>
      createProductionLine({
        name: name.trim(),
        capacity: capacity ? Number(capacity) : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.productionLine.all })
      void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.stockRecord.warehouses() })
      onClose()
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Hat oluşturulamadı.')
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Hat adı zorunlu.')
      return
    }
    createMutation.mutate()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormGrid cols={2}>
            <FormField label="Hat Adı" id="new-line-name" required hint='örn. "LINE-6"'>
              <Input
                id="new-line-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="LINE-6"
                required
              />
            </FormField>
            <FormField label="Günlük Kapasite (adet)" id="new-line-capacity">
              <Input
                id="new-line-capacity"
                type="number"
                min={0}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                placeholder="400"
              />
            </FormField>
          </FormGrid>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={createMutation.isPending}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Oluşturuluyor...' : 'Hattı Oluştur'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function LineStatusPage() {
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'
  const [showCreateForm, setShowCreateForm] = useState(false)

  const lineStatusQuery = useQuery({
    queryKey: applicationQueryKeys.productionLine.status(),
    queryFn: fetchLineStatus,
  })

  const linesQuery = useQuery({
    queryKey: applicationQueryKeys.productionLine.list(),
    queryFn: fetchProductionLines,
    enabled: canManage,
  })

  const lineIdByName = new Map<string, number>(
    (linesQuery.data ?? []).map((line: ApiProductionLine) => [line.name, line.id]),
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hat Durumu"
        description="Üretim hatlarının bugünkü doluluk oranı ve aktif siparişleri."
        actions={
          canManage ? (
            <Button onClick={() => setShowCreateForm((prev) => !prev)}>
              <Plus className="size-4" />
              {showCreateForm ? 'Vazgeç' : 'Yeni Hat Ekle'}
            </Button>
          ) : undefined
        }
      />

      {showCreateForm ? <CreateLineForm onClose={() => setShowCreateForm(false)} /> : null}

      {lineStatusQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      ) : lineStatusQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Hat durumu yüklenemedi.
        </div>
      ) : lineStatusQuery.data && lineStatusQuery.data.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lineStatusQuery.data.map((line) => (
            <LineCard
              key={line.lineName}
              line={line}
              lineId={lineIdByName.get(line.lineName)}
              canManage={canManage}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Henüz tanımlı üretim hattı yok.</p>
      )}
    </div>
  )
}
