import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader } from '@/components/erp'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  consumeStockLot,
  createStockLot,
  fetchFifoSuggestion,
  fetchStockLots,
  type ApiStockLot,
  type ConsumeStockLotInput,
  type CreateStockLotInput,
  type FifoSuggestion,
} from '@/infrastructure/api/stock-api.repository'
import { cn } from '@/lib/utils'

const MATERIAL_TYPE_OPTIONS = ['KUMAŞ', 'AKSESUAR']

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatValue(value: number): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function StockPage() {
  const queryClient = useQueryClient()

  const lotsQuery = useQuery({
    queryKey: applicationQueryKeys.stockRecord.lots(),
    queryFn: () => fetchStockLots(),
  })

  function invalidateLots() {
    return queryClient.invalidateQueries({
      queryKey: applicationQueryKeys.stockRecord.lots(),
      refetchType: 'all',
    })
  }

  const lots = lotsQuery.data ?? []

  const fabricValue = lots
    .filter(
      (lot) =>
        lot.materialType.toLocaleUpperCase('tr-TR') === 'KUMAŞ' && lot.unitPrice != null,
    )
    .reduce((sum, lot) => sum + lot.remainingQty * (lot.unitPrice ?? 0), 0)

  const accessoryValue = lots
    .filter(
      (lot) =>
        lot.materialType.toLocaleUpperCase('tr-TR') === 'AKSESUAR' &&
        lot.unitPrice != null,
    )
    .reduce((sum, lot) => sum + lot.remainingQty * (lot.unitPrice ?? 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stok Yönetimi"
        description="Kumaş ve aksesuar stok lotları, hareketleri ve FIFO önerileri."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam Kumaş Stok Değeri</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {formatValue(fabricValue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Girilen birim fiyatlara göre yaklaşık değer (farklı para birimleri karışık olabilir)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam Aksesuar Stok Değeri</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {formatValue(accessoryValue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Girilen birim fiyatlara göre yaklaşık değer (farklı para birimleri karışık olabilir)
            </p>
          </CardContent>
        </Card>
      </div>

      <FifoSuggestionCard />

      <Card>
        <CardContent className="pt-6">
          <StockLotsPanel
            lots={lots}
            isLoading={lotsQuery.isLoading}
            onChanged={invalidateLots}
          />
        </CardContent>
      </Card>
    </div>
  )
}

type StockFormState = {
  materialName: string
  materialType: string
  supplierName: string
  lotNo: string
  receivedQty: string
  unitPrice: string
  currency: string
  receivedDate: string
}

function initialStockForm(): StockFormState {
  return {
    materialName: '',
    materialType: 'KUMAŞ',
    supplierName: '',
    lotNo: '',
    receivedQty: '',
    unitPrice: '',
    currency: 'USD',
    receivedDate: todayIso(),
  }
}

function StockLotsPanel({
  lots,
  isLoading,
  onChanged,
}: {
  lots: ApiStockLot[]
  isLoading: boolean
  onChanged: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<StockFormState>(initialStockForm)
  const [error, setError] = useState<string | null>(null)
  const [consumingLotId, setConsumingLotId] = useState<number | null>(null)

  const addMutation = useMutation({
    mutationFn: (input: CreateStockLotInput) => createStockLot(input),
    onSuccess: onChanged,
  })

  function updateField(field: keyof StockFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleAddLot(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const receivedQty = Number(form.receivedQty)
    if (!form.materialName.trim() || !form.materialType.trim() || !form.supplierName.trim()) {
      setError('Malzeme adı, tipi ve tedarikçi zorunludur.')
      return
    }
    if (!form.receivedQty || Number.isNaN(receivedQty) || receivedQty <= 0) {
      setError('Gelen miktar geçerli bir sayı olmalıdır.')
      return
    }

    try {
      await addMutation.mutateAsync({
        materialName: form.materialName.trim(),
        materialType: form.materialType.trim(),
        supplierName: form.supplierName.trim(),
        lotNo: form.lotNo.trim() || undefined,
        receivedQty,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : undefined,
        currency: form.currency.trim() || undefined,
        receivedDate: form.receivedDate || undefined,
      })
      setForm(initialStockForm())
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stok girişi eklenemedi.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Kumaş/aksesuar stok lotları</p>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-4" /> Yeni Stok Girişi
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={handleAddLot}
          className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="materialName">Malzeme Adı</Label>
            <Input
              id="materialName"
              value={form.materialName}
              onChange={(e) => updateField('materialName', e.target.value)}
              placeholder="Pamuklu Kumaş"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="materialType">Tip</Label>
            <select
              id="materialType"
              value={form.materialType}
              onChange={(e) => updateField('materialType', e.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {MATERIAL_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="supplierName">Tedarikçi</Label>
            <Input
              id="supplierName"
              value={form.supplierName}
              onChange={(e) => updateField('supplierName', e.target.value)}
              placeholder="Acme Tekstil"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="lotNo">Lot No</Label>
            <Input
              id="lotNo"
              value={form.lotNo}
              onChange={(e) => updateField('lotNo', e.target.value)}
              placeholder="LOT-001"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="receivedQty">Gelen Miktar</Label>
            <Input
              id="receivedQty"
              type="number"
              min="0"
              step="0.01"
              value={form.receivedQty}
              onChange={(e) => updateField('receivedQty', e.target.value)}
              placeholder="500"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="unitPrice">Birim Fiyat</Label>
            <Input
              id="unitPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.unitPrice}
              onChange={(e) => updateField('unitPrice', e.target.value)}
              placeholder="4.20"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="currency">Para Birimi</Label>
            <Input
              id="currency"
              value={form.currency}
              onChange={(e) => updateField('currency', e.target.value)}
              placeholder="USD"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="receivedDate">Geliş Tarihi</Label>
            <Input
              id="receivedDate"
              type="date"
              value={form.receivedDate}
              onChange={(e) => updateField('receivedDate', e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-4">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              İptal
            </Button>
            <Button type="submit" size="sm" disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2">Malzeme Adı</th>
              <th className="px-3 py-2">Tip</th>
              <th className="px-3 py-2">Tedarikçi</th>
              <th className="px-3 py-2">Lot No</th>
              <th className="px-3 py-2">Gelen Miktar</th>
              <th className="px-3 py-2">Kalan Miktar</th>
              <th className="px-3 py-2">Birim Fiyat</th>
              <th className="px-3 py-2">Geliş Tarihi</th>
              <th className="px-3 py-2">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                  Yükleniyor...
                </td>
              </tr>
            ) : lots.length > 0 ? (
              lots.map((lot) => (
                <StockLotRow
                  key={lot.id}
                  lot={lot}
                  isConsuming={consumingLotId === lot.id}
                  onToggleConsume={() =>
                    setConsumingLotId((id) => (id === lot.id ? null : lot.id))
                  }
                  onConsumed={() => {
                    setConsumingLotId(null)
                    onChanged()
                  }}
                />
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                  Henüz stok girişi yapılmadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StockLotRow({
  lot,
  isConsuming,
  onToggleConsume,
  onConsumed,
}: {
  lot: ApiStockLot
  isConsuming: boolean
  onToggleConsume: () => void
  onConsumed: () => void
}) {
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const consumeMutation = useMutation({
    mutationFn: (input: ConsumeStockLotInput) => consumeStockLot(lot.id, input),
    onSuccess: () => {
      setQuantity('')
      setReason('')
      setError(null)
      onConsumed()
    },
  })

  async function handleConsume(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const qty = Number(quantity)
    if (!quantity || Number.isNaN(qty) || qty <= 0) {
      setError('Miktar geçerli bir sayı olmalıdır.')
      return
    }

    try {
      await consumeMutation.mutateAsync({
        quantity: qty,
        reason: reason.trim() || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tüketim kaydedilemedi.')
    }
  }

  const isOut = lot.remainingQty <= 0

  return (
    <>
      <tr className={cn('border-b border-border/60', isOut && 'text-muted-foreground')}>
        <td className="px-3 py-2 font-medium">{lot.materialName}</td>
        <td className="px-3 py-2">{lot.materialType}</td>
        <td className="px-3 py-2">{lot.supplierName}</td>
        <td className="px-3 py-2">{lot.lotNo ?? '—'}</td>
        <td className="px-3 py-2 tabular-nums">{lot.receivedQty.toLocaleString('tr-TR')}</td>
        <td className="px-3 py-2 tabular-nums">{lot.remainingQty.toLocaleString('tr-TR')}</td>
        <td className="px-3 py-2 tabular-nums">
          {lot.unitPrice != null ? `${lot.unitPrice.toLocaleString('tr-TR')} ${lot.currency}` : '—'}
        </td>
        <td className="px-3 py-2">{formatDate(lot.receivedDate)}</td>
        <td className="px-3 py-2">
          <Button size="sm" variant="outline" disabled={isOut} onClick={onToggleConsume}>
            Tüket
          </Button>
        </td>
      </tr>
      {isConsuming ? (
        <tr className="border-b border-border/60 bg-muted/20">
          <td colSpan={9} className="px-3 py-3">
            <form onSubmit={handleConsume} className="flex flex-wrap items-end gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor={`consumeQty-${lot.id}`}>Miktar</Label>
                <Input
                  id={`consumeQty-${lot.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  max={lot.remainingQty}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={`Maks. ${lot.remainingQty}`}
                  className="w-32"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor={`consumeReason-${lot.id}`}>Sebep</Label>
                <Input
                  id={`consumeReason-${lot.id}`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="örn: 1040 nolu sipariş kesim için tüketim"
                  className="w-72"
                />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={onToggleConsume}>
                İptal
              </Button>
              <Button type="submit" size="sm" disabled={consumeMutation.isPending}>
                {consumeMutation.isPending ? 'Kaydediliyor...' : 'Onayla'}
              </Button>
              {error ? <p className="w-full text-sm text-destructive">{error}</p> : null}
            </form>
          </td>
        </tr>
      ) : null}
    </>
  )
}

function FifoSuggestionCard() {
  const [materialName, setMaterialName] = useState('')
  const [neededQty, setNeededQty] = useState('')
  const [submitted, setSubmitted] = useState<{ materialName: string; neededQty: number } | null>(
    null,
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  const fifoQuery = useQuery({
    queryKey: applicationQueryKeys.stockRecord.fifoSuggestion(
      submitted?.materialName ?? '',
      submitted?.neededQty ?? 0,
    ),
    queryFn: () => fetchFifoSuggestion(submitted!.materialName, submitted!.neededQty),
    enabled: !!submitted,
  })

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    setValidationError(null)

    const qty = Number(neededQty)
    if (!materialName.trim()) {
      setValidationError('Malzeme adı gereklidir.')
      return
    }
    if (!neededQty || Number.isNaN(qty) || qty <= 0) {
      setValidationError('Gereken miktar geçerli bir sayı olmalıdır.')
      return
    }

    setSubmitted({ materialName: materialName.trim(), neededQty: qty })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">FIFO Önerisi</CardTitle>
        <CardDescription>
          Malzeme adı ve gereken miktarı girin, hangi lotlardan ne kadar kullanılması gerektiğini
          görün.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="fifoMaterialName">Malzeme Adı</Label>
            <Input
              id="fifoMaterialName"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              placeholder="Pamuklu Kumaş"
              className="w-56"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fifoNeededQty">Gereken Miktar</Label>
            <Input
              id="fifoNeededQty"
              type="number"
              min="0"
              step="0.01"
              value={neededQty}
              onChange={(e) => setNeededQty(e.target.value)}
              placeholder="350"
              className="w-32"
            />
          </div>
          <Button type="submit" size="sm" disabled={fifoQuery.isFetching}>
            <Search className="size-4" /> Öner
          </Button>
        </form>

        {validationError ? <p className="text-sm text-destructive">{validationError}</p> : null}

        {fifoQuery.isFetching ? (
          <p className="text-sm text-muted-foreground">Hesaplanıyor...</p>
        ) : fifoQuery.isError ? (
          <p className="text-sm text-destructive">
            {fifoQuery.error instanceof Error ? fifoQuery.error.message : 'Öneri alınamadı.'}
          </p>
        ) : fifoQuery.data ? (
          <FifoSuggestionResult suggestion={fifoQuery.data} />
        ) : null}
      </CardContent>
    </Card>
  )
}

function FifoSuggestionResult({ suggestion }: { suggestion: FifoSuggestion }) {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          'rounded-lg border px-3 py-2 text-sm font-medium',
          suggestion.fulfilled
            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            : 'border-destructive/40 bg-destructive/10 text-destructive',
        )}
      >
        {suggestion.fulfilled
          ? `✓ ${suggestion.neededQty.toLocaleString('tr-TR')} birim tamamen karşılanabilir (toplam mevcut: ${suggestion.totalAvailable.toLocaleString('tr-TR')}).`
          : `⚠️ Yetersiz stok: ${suggestion.shortfall.toLocaleString('tr-TR')} birim eksik (toplam mevcut: ${suggestion.totalAvailable.toLocaleString('tr-TR')}, istenen: ${suggestion.neededQty.toLocaleString('tr-TR')}).`}
      </div>

      {suggestion.suggestions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2">Lot No</th>
                <th className="px-3 py-2">Tedarikçi</th>
                <th className="px-3 py-2">Geliş Tarihi</th>
                <th className="px-3 py-2">Kullanılacak Miktar</th>
                <th className="px-3 py-2">Lotta Kalan</th>
              </tr>
            </thead>
            <tbody>
              {suggestion.suggestions.map((line) => (
                <tr key={line.lotId} className="border-b border-border/60">
                  <td className="px-3 py-2 font-medium">{line.lotNo ?? `#${line.lotId}`}</td>
                  <td className="px-3 py-2">{line.supplierName}</td>
                  <td className="px-3 py-2">{formatDate(line.receivedDate)}</td>
                  <td className="px-3 py-2 tabular-nums">{line.useQty.toLocaleString('tr-TR')}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {line.remainingAfter.toLocaleString('tr-TR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  )
}
