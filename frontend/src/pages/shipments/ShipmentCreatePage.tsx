import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader } from '@/components/erp'
import { FormField, FormGrid, selectClass } from '@/components/erp/form-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  fetchColorSizes,
  fetchOrders,
  type ApiOrderColorSize,
} from '@/infrastructure/api/orders-api.repository'
import { createShipment } from '@/infrastructure/api/shipments-api.repository'
import { computeCartonBreakdown } from '@/lib/carton'

type PendingLine = {
  key: string
  orderId: number
  orderNo: string
  buyerName: string
  productName: string
  color: string
  size: string
  quantity: number
  unitsPerCarton: number | null
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

let keySeq = 0
function nextKey(): string {
  keySeq += 1
  return `line-${keySeq}`
}

export function ShipmentCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [shipmentDate, setShipmentDate] = useState(todayIso())
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<PendingLine[]>([])
  const [showAddOrder, setShowAddOrder] = useState(false)
  const [saveError, setSaveError] = useState('')

  const ordersQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.list(),
    queryFn: fetchOrders,
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      createShipment({
        shipmentDate,
        notes: notes.trim() || undefined,
        lines: lines.map((l) => ({
          orderId: l.orderId,
          color: l.color,
          size: l.size,
          quantity: l.quantity,
          unitsPerCarton: l.unitsPerCarton,
        })),
      }),
    onSuccess: (shipment) => {
      void queryClient.invalidateQueries({ queryKey: applicationQueryKeys.shipmentRecord.all })
      navigate(`/shipments/${shipment.id}`)
    },
    onError: (err) => {
      setSaveError(err instanceof Error ? err.message : 'Sevkiyat kaydedilemedi.')
    },
  })

  function addLines(newLines: PendingLine[]) {
    setLines((prev) => [...prev, ...newLines])
    setShowAddOrder(false)
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key))
  }

  function handleSave() {
    setSaveError('')
    if (lines.length === 0) {
      setSaveError('En az bir satır eklemelisiniz.')
      return
    }
    saveMutation.mutate()
  }

  const breakdowns = lines.map((l) => ({ line: l, breakdown: computeCartonBreakdown(l.quantity, l.unitsPerCarton) }))
  const grandTotal = breakdowns.reduce(
    (acc, { breakdown }) => ({
      totalQty: acc.totalQty + breakdown.totalQty,
      fullCartons: acc.fullCartons + (breakdown.fullCartons ?? 0),
      lottedQty: acc.lottedQty + (breakdown.lottedQty ?? 0),
      looseQty: acc.looseQty + breakdown.looseQty,
      totalCartons: acc.totalCartons + (breakdown.totalCartons ?? 0),
    }),
    { totalQty: 0, fullCartons: 0, lottedQty: 0, looseQty: 0, totalCartons: 0 },
  )

  return (
    <div className="space-y-6">
      <PageHeader title="Yeni Sevkiyat" description="Birden fazla siparişten satırları tek bir sevkiyata toplayın." />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <FormGrid cols={2}>
            <FormField label="Sevkiyat Tarihi" id="shipmentDate">
              <Input
                id="shipmentDate"
                type="date"
                value={shipmentDate}
                onChange={(e) => setShipmentDate(e.target.value)}
              />
            </FormField>
            <FormField label="Notlar (Opsiyonel)" id="shipmentNotes">
              <Input id="shipmentNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </FormField>
          </FormGrid>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Sevkiyat Satırları</p>
        <Button variant="outline" size="sm" onClick={() => setShowAddOrder((v) => !v)}>
          <Plus className="size-4" /> {showAddOrder ? 'Vazgeç' : 'Sipariş Ekle'}
        </Button>
      </div>

      {showAddOrder ? (
        <AddOrderPanel orders={ordersQuery.data ?? []} onAdd={addLines} />
      ) : null}

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2">Sipariş</th>
                  <th className="px-3 py-2">Renk</th>
                  <th className="px-3 py-2">Beden</th>
                  <th className="px-3 py-2 text-right">Toplam Adet</th>
                  <th className="px-3 py-2 text-right">Koli Başına Adet</th>
                  <th className="px-3 py-2 text-right">Tam Koli</th>
                  <th className="px-3 py-2 text-right">Lotlu Adet</th>
                  <th className="px-3 py-2 text-right">Açık Adet</th>
                  <th className="px-3 py-2 text-right">Toplam Koli</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {breakdowns.length > 0 ? (
                  <>
                    {breakdowns.map(({ line, breakdown }) => (
                      <tr key={line.key} className="border-b border-border/60">
                        <td className="px-3 py-2">
                          <div className="font-medium">{line.orderNo}</div>
                          <div className="text-xs text-muted-foreground">
                            {line.buyerName} · {line.productName}
                          </div>
                        </td>
                        <td className="px-3 py-2">{line.color}</td>
                        <td className="px-3 py-2">{line.size}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {breakdown.totalQty.toLocaleString('tr-TR')}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {breakdown.unitsPerCarton?.toLocaleString('tr-TR') ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {breakdown.fullCartons?.toLocaleString('tr-TR') ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {breakdown.lottedQty?.toLocaleString('tr-TR') ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {breakdown.looseQty.toLocaleString('tr-TR')}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {breakdown.totalCartons?.toLocaleString('tr-TR') ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeLine(line.key)}
                            title="Kaldır"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                      <td className="px-3 py-2" colSpan={3}>
                        GENEL TOPLAM
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {grandTotal.totalQty.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">—</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {grandTotal.fullCartons.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {grandTotal.lottedQty.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {grandTotal.looseQty.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {grandTotal.totalCartons.toLocaleString('tr-TR')}
                      </td>
                      <td className="px-3 py-2" />
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-muted-foreground">
                      Henüz satır eklenmedi. "Sipariş Ekle" ile başlayın.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {saveError ? <p className="text-sm text-destructive">{saveError}</p> : null}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate('/shipments')} disabled={saveMutation.isPending}>
          Vazgeç
        </Button>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Kaydediliyor...' : 'Sevkiyatı Kaydet'}
        </Button>
      </div>
    </div>
  )
}

type OrderOption = { id: string; orderNo: string; customer: string; model: string; totalQuantity: number }

function AddOrderPanel({
  orders,
  onAdd,
}: {
  orders: OrderOption[]
  onAdd: (lines: PendingLine[]) => void
}) {
  const [selectedOrderId, setSelectedOrderId] = useState('')

  const colorSizesQuery = useQuery({
    queryKey: applicationQueryKeys.orderRecord.colorSizes(selectedOrderId),
    queryFn: () => fetchColorSizes(selectedOrderId),
    enabled: !!selectedOrderId,
  })

  const selectedOrder = orders.find((o) => o.id === selectedOrderId)

  const [autoRows, setAutoRows] = useState<
    Array<{ cs: ApiOrderColorSize; checked: boolean; quantity: string; unitsPerCarton: string }>
  >([])
  const [manualRows, setManualRows] = useState<
    Array<{ color: string; size: string; quantity: string; unitsPerCarton: string }>
  >([])
  const [manualForm, setManualForm] = useState({ color: '', size: '', quantity: '', unitsPerCarton: '' })
  const [error, setError] = useState('')

  function handleSelectOrder(orderId: string) {
    setSelectedOrderId(orderId)
    setAutoRows([])
    setManualRows([])
    setError('')
  }

  const rows = colorSizesQuery.data ?? []

  // Renk/beden verisi geldiğinde satırları otomatik doldur (bir kez, seçili sipariş için).
  useEffect(() => {
    if (rows.length > 0) {
      setAutoRows(
        rows.map((cs) => ({
          cs,
          checked: true,
          quantity: String(cs.quantity),
          unitsPerCarton: cs.unitsPerCarton != null ? String(cs.unitsPerCarton) : '',
        })),
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrderId, rows.length])

  function updateAutoRow(index: number, patch: Partial<{ checked: boolean; quantity: string; unitsPerCarton: string }>) {
    setAutoRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function handleAddManualRow(e: FormEvent) {
    e.preventDefault()
    setError('')
    const quantity = Number(manualForm.quantity)
    if (!manualForm.color.trim() || !manualForm.size.trim()) {
      setError('Renk ve beden zorunludur.')
      return
    }
    if (!manualForm.quantity || Number.isNaN(quantity) || quantity <= 0) {
      setError('Geçerli bir miktar girin.')
      return
    }
    setManualRows((prev) => [
      ...prev,
      {
        color: manualForm.color.trim(),
        size: manualForm.size.trim(),
        quantity: manualForm.quantity,
        unitsPerCarton: manualForm.unitsPerCarton,
      },
    ])
    setManualForm({ color: '', size: '', quantity: '', unitsPerCarton: '' })
  }

  function removeManualRow(index: number) {
    setManualRows((prev) => prev.filter((_, i) => i !== index))
  }

  function handleConfirmAdd() {
    setError('')
    if (!selectedOrder) {
      setError('Bir sipariş seçin.')
      return
    }

    const newLines: PendingLine[] = []

    for (const row of autoRows) {
      if (!row.checked) continue
      const quantity = Number(row.quantity)
      if (!row.quantity || Number.isNaN(quantity) || quantity <= 0) {
        setError(`${row.cs.color} / ${row.cs.size} için geçerli bir miktar girin.`)
        return
      }
      if (quantity > row.cs.quantity) {
        setError(
          `${row.cs.color} / ${row.cs.size} için miktar sipariş miktarından (${row.cs.quantity}) fazla olamaz.`,
        )
        return
      }
      const unitsPerCarton = row.unitsPerCarton.trim() ? Number(row.unitsPerCarton) : null
      if (unitsPerCarton != null && (Number.isNaN(unitsPerCarton) || unitsPerCarton <= 0)) {
        setError(`${row.cs.color} / ${row.cs.size} için geçerli bir koli başına adet girin.`)
        return
      }
      newLines.push({
        key: nextKey(),
        orderId: Number(selectedOrder.id),
        orderNo: selectedOrder.orderNo,
        buyerName: selectedOrder.customer,
        productName: selectedOrder.model,
        color: row.cs.color,
        size: row.cs.size,
        quantity,
        unitsPerCarton,
      })
    }

    for (const row of manualRows) {
      const quantity = Number(row.quantity)
      const unitsPerCarton = row.unitsPerCarton.trim() ? Number(row.unitsPerCarton) : null
      newLines.push({
        key: nextKey(),
        orderId: Number(selectedOrder.id),
        orderNo: selectedOrder.orderNo,
        buyerName: selectedOrder.customer,
        productName: selectedOrder.model,
        color: row.color,
        size: row.size,
        quantity,
        unitsPerCarton,
      })
    }

    if (newLines.length === 0) {
      setError('En az bir satır seçmeli veya eklemelisiniz.')
      return
    }

    onAdd(newLines)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Siparişten Satır Ekle</CardTitle>
        <CardDescription>
          Bir sipariş seçin — varsa mevcut Renk/Beden satırları otomatik gelecektir, yoksa elle
          ekleyebilirsiniz.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-1.5 sm:max-w-sm">
          <Label htmlFor="orderPicker">Sipariş</Label>
          <select
            id="orderPicker"
            className={selectClass}
            value={selectedOrderId}
            onChange={(e) => handleSelectOrder(e.target.value)}
          >
            <option value="">Sipariş seçin...</option>
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNo} — {o.customer} — {o.model}
              </option>
            ))}
          </select>
        </div>

        {selectedOrderId ? (
          colorSizesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Renk/beden bilgisi yükleniyor...</p>
          ) : rows.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2" />
                    <th className="px-3 py-2">Renk</th>
                    <th className="px-3 py-2">Beden</th>
                    <th className="px-3 py-2">Sipariş Miktarı</th>
                    <th className="px-3 py-2">Sevk Miktarı</th>
                    <th className="px-3 py-2">Koli Başına Adet</th>
                  </tr>
                </thead>
                <tbody>
                  {autoRows.map((row, index) => (
                    <tr key={row.cs.id} className="border-b border-border/60 last:border-b-0">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={row.checked}
                          onChange={(e) => updateAutoRow(index, { checked: e.target.checked })}
                        />
                      </td>
                      <td className="px-3 py-2">{row.cs.color}</td>
                      <td className="px-3 py-2">{row.cs.size}</td>
                      <td className="px-3 py-2 tabular-nums">{row.cs.quantity.toLocaleString('tr-TR')}</td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min="0"
                          max={row.cs.quantity}
                          value={row.quantity}
                          onChange={(e) => updateAutoRow(index, { quantity: e.target.value })}
                          disabled={!row.checked}
                          className="h-8 w-24"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min="1"
                          value={row.unitsPerCarton}
                          onChange={(e) => updateAutoRow(index, { unitsPerCarton: e.target.value })}
                          disabled={!row.checked}
                          placeholder="Opsiyonel"
                          className="h-8 w-24"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3 rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">
                Bu siparişte Renk/Beden verisi yok. Elle satır ekleyebilirsiniz.
              </p>
              <form onSubmit={handleAddManualRow} className="grid gap-3 sm:grid-cols-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="manualColor">Renk</Label>
                  <Input
                    id="manualColor"
                    value={manualForm.color}
                    onChange={(e) => setManualForm((p) => ({ ...p, color: e.target.value }))}
                    placeholder="Lacivert"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="manualSize">Beden</Label>
                  <Input
                    id="manualSize"
                    value={manualForm.size}
                    onChange={(e) => setManualForm((p) => ({ ...p, size: e.target.value }))}
                    placeholder="M"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="manualQuantity">Miktar</Label>
                  <Input
                    id="manualQuantity"
                    type="number"
                    min="0"
                    value={manualForm.quantity}
                    onChange={(e) => setManualForm((p) => ({ ...p, quantity: e.target.value }))}
                    placeholder="100"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="manualUnitsPerCarton">Koli Başına Adet</Label>
                  <Input
                    id="manualUnitsPerCarton"
                    type="number"
                    min="1"
                    value={manualForm.unitsPerCarton}
                    onChange={(e) => setManualForm((p) => ({ ...p, unitsPerCarton: e.target.value }))}
                    placeholder="Opsiyonel"
                  />
                </div>
                <div className="sm:col-span-4">
                  <Button type="submit" size="sm" variant="outline">
                    <Plus className="size-4" /> Satır Ekle
                  </Button>
                </div>
              </form>

              {manualRows.length > 0 ? (
                <div className="space-y-1">
                  {manualRows.map((row, index) => (
                    <div
                      key={`${row.color}-${row.size}-${index}`}
                      className="flex items-center justify-between rounded-md border border-border/60 px-3 py-1.5 text-sm"
                    >
                      <span>
                        {row.color} / {row.size} — {row.quantity} adet
                        {row.unitsPerCarton ? ` (koli: ${row.unitsPerCarton})` : ''}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => removeManualRow(index)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {selectedOrderId ? (
          <div className="flex justify-end">
            <Button size="sm" onClick={handleConfirmAdd}>
              Bu Siparişi Sevkiyata Ekle
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
