import { Package, Save } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageHeader } from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { BomTab } from '../components/create/BomTab'
import { ColorsTab } from '../components/create/ColorsTab'
import { DocumentsTab } from '../components/create/DocumentsTab'
import { GeneralTab } from '../components/create/GeneralTab'
import { OperationsTab } from '../components/create/OperationsTab'
import { ProductTab } from '../components/create/ProductTab'
import { SizesMatrixTab } from '../components/create/SizesMatrixTab'
import { TerminTab } from '../components/create/TerminTab'
import { useOrderCreate } from '../hooks/use-order-create'

export function OrderCreatePage() {
  const navigate = useNavigate()
  const form = useOrderCreate()
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleSave() {
    setError(null)
    const result = form.save()
    if (!result.success) {
      setError(result.message)
      return
    }
    setSaving(true)
    window.alert(result.message)
    setTimeout(() => navigate('/orders'), 600)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yeni Sipariş & Ürün Kartı"
        description="PO oluşturma, ürün kartı tanımı, BOM ve renk-beden matrisi — tek ekranda profesyonel sipariş girişi."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate('/orders')}>
              İptal
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="size-4" />
              {saving ? 'Kaydediliyor...' : 'Siparişi Kaydet'}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <Package className="size-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Toplam Sipariş Adedi</p>
            <p className="text-lg font-bold tabular-nums text-primary">
              {form.totals.grandTotal.toLocaleString('tr-TR')}
            </p>
          </div>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-xs text-muted-foreground">BOM Kalemi</p>
          <p className="text-lg font-bold tabular-nums">
            {form.form.bom.filter((b) => b.stockCardId).length}
          </p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-xs text-muted-foreground">Aktif Renk</p>
          <p className="text-lg font-bold tabular-nums">
            {form.form.colors.filter((c) => c.active).length}
          </p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div>
          <p className="text-xs text-muted-foreground">Beden</p>
          <p className="text-lg font-bold tabular-nums">
            {form.form.sizes.length}
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Sipariş & Ürün Kartı Girişi</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList className="mb-2">
              <TabsTrigger value="general">Genel</TabsTrigger>
              <TabsTrigger value="product">Ürün</TabsTrigger>
              <TabsTrigger value="colors">Renkler</TabsTrigger>
              <TabsTrigger value="sizes">Bedenler</TabsTrigger>
              <TabsTrigger value="bom">BOM</TabsTrigger>
              <TabsTrigger value="operations">Operasyonlar</TabsTrigger>
              <TabsTrigger value="termin">Termin</TabsTrigger>
              <TabsTrigger value="documents">Dökümanlar</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <GeneralTab form={form} />
            </TabsContent>
            <TabsContent value="product">
              <ProductTab form={form} />
            </TabsContent>
            <TabsContent value="colors">
              <ColorsTab form={form} />
            </TabsContent>
            <TabsContent value="sizes">
              <SizesMatrixTab form={form} />
            </TabsContent>
            <TabsContent value="bom">
              <BomTab form={form} />
            </TabsContent>
            <TabsContent value="operations">
              <OperationsTab form={form} />
            </TabsContent>
            <TabsContent value="termin">
              <TerminTab form={form} />
            </TabsContent>
            <TabsContent value="documents">
              <DocumentsTab form={form} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/orders')}>
          İptal
        </Button>
        <Button size="lg" onClick={handleSave} disabled={saving}>
          <Save className="size-4" />
          Siparişi Kaydet & Malzeme İhtiyacı Oluştur
        </Button>
      </div>
    </div>
  )
}
