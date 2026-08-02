import { Bot, Download, Play, Settings } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  DataTable,
  ErpToolbar,
  KpiCards,
  PageHeader,
  StatusBadge,
} from '@/components/erp'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  aiSuggestions,
  reportItems,
  settingsSections,
  shipmentRecords,
  shippingKpis,
} from '@/data/mock/misc'
import { ORDER_COSTS } from '@/domain/data/workflows'
import { filterBySearch } from '@/lib/filter'

export function ShippingPage() {
  const [search, setSearch] = useState('')
  const filtered = useMemo(
    () =>
      filterBySearch(shipmentRecords, search, [
        (r) => r.shipmentNo,
        (r) => r.orderNo,
        (r) => r.customer,
      ]),
    [search],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sevkiyat Takibi"
        description="EXF sevkiyatları, taşıyıcı ve teslimat durumu."
        actions={<Button size="sm"><Download className="size-4" /> Sevkiyat Raporu</Button>}
      />
      <KpiCards items={shippingKpis} />
      <ErpToolbar searchPlaceholder="Sevkiyat no, sipariş ara..." searchValue={search} onSearchChange={setSearch} />
      <Card>
        <CardContent className="pt-6">
          <DataTable
            rowKey={(r) => r.id}
            data={filtered}
            columns={[
              { key: 'shipment', header: 'Sevkiyat No', render: (r) => <span className="font-medium">{r.shipmentNo}</span> },
              { key: 'order', header: 'Sipariş', render: (r) => r.orderNo },
              { key: 'customer', header: 'Müşteri', render: (r) => r.customer },
              { key: 'style', header: 'Model', render: (r) => r.style },
              { key: 'qty', header: 'Adet', render: (r) => r.quantity.toLocaleString('tr-TR') },
              { key: 'exf', header: 'EXF', render: (r) => r.exfDate },
              { key: 'carrier', header: 'Taşıyıcı', render: (r) => r.carrier },
              {
                key: 'status',
                header: 'Durum',
                render: (r) => (
                  <StatusBadge
                    label={r.status}
                    tone={
                      r.status === 'Teslim Edildi'
                        ? 'success'
                        : r.status === 'Yolda'
                          ? 'default'
                          : 'warning'
                    }
                  />
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function CostAnalysisPage() {
  const [search, setSearch] = useState('')
  const filtered = useMemo(
    () => filterBySearch(ORDER_COSTS, search, [(r) => r.orderNo]),
    [search],
  )

  const avgMargin =
    ORDER_COSTS.length > 0
      ? Math.round(ORDER_COSTS.reduce((s, r) => s + r.profitMargin, 0) / ORDER_COSTS.length * 10) / 10
      : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maliyet Analizi"
        description="Kumaş, aksesuar, işçilik, nakış, baskı, yıkama, fire, lojistik, CM, FOB ve karlılık."
      />
      <KpiCards
        items={[
          { label: 'Analiz Edilen Sipariş', value: String(ORDER_COSTS.length), hint: 'Maliyet hesaplandı' },
          { label: 'Ort. Kar Marjı', value: `%${avgMargin}`, hint: 'FOB bazlı' },
          { label: 'Toplam FOB', value: `$${ORDER_COSTS.reduce((s, r) => s + r.fob, 0).toLocaleString('tr-TR')}`, hint: 'Satış fiyatı öncesi' },
          { label: 'Toplam Kar', value: `$${ORDER_COSTS.reduce((s, r) => s + r.profit, 0).toLocaleString('tr-TR')}`, hint: 'Brüt' },
        ]}
      />
      <ErpToolbar searchPlaceholder="Sipariş no ara..." searchValue={search} onSearchChange={setSearch} />
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <DataTable
            rowKey={(r) => r.orderId}
            data={filtered}
            columns={[
              { key: 'order', header: 'Sipariş', render: (r) => <span className="font-medium">{r.orderNo}</span> },
              { key: 'fabric', header: 'Kumaş', render: (r) => `$${r.fabric.toLocaleString('tr-TR')}` },
              { key: 'accessory', header: 'Aksesuar', render: (r) => `$${r.accessory.toLocaleString('tr-TR')}` },
              { key: 'labor', header: 'İşçilik', render: (r) => `$${r.labor.toLocaleString('tr-TR')}` },
              { key: 'emb', header: 'Nakış', render: (r) => `$${r.embroidery.toLocaleString('tr-TR')}` },
              { key: 'print', header: 'Baskı', render: (r) => `$${r.print.toLocaleString('tr-TR')}` },
              { key: 'wash', header: 'Yıkama', render: (r) => `$${r.washing.toLocaleString('tr-TR')}` },
              { key: 'waste', header: 'Fire', render: (r) => `$${r.waste.toLocaleString('tr-TR')}` },
              { key: 'log', header: 'Lojistik', render: (r) => `$${r.logistics.toLocaleString('tr-TR')}` },
              { key: 'oh', header: 'G.Gider', render: (r) => `$${r.overhead.toLocaleString('tr-TR')}` },
              { key: 'cm', header: 'CM', render: (r) => `$${r.cm.toLocaleString('tr-TR')}` },
              { key: 'fob', header: 'FOB', render: (r) => `$${r.fob.toLocaleString('tr-TR')}` },
              { key: 'margin', header: 'Kar %', render: (r) => `%${r.profitMargin}` },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function ReportsPage() {
  const [search, setSearch] = useState('')
  const filtered = useMemo(
    () => filterBySearch(reportItems, search, [(r) => r.name, (r) => r.category]),
    [search],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rapor Merkezi"
        description="Planlama, üretim, stok ve maliyet raporları."
        actions={<Button size="sm" variant="outline"><Download className="size-4" /> Zamanlanmış Raporlar</Button>}
      />
      <ErpToolbar searchPlaceholder="Rapor adı ara..." searchValue={search} onSearchChange={setSearch} />
      <Card>
        <CardContent className="pt-6">
          <DataTable
            rowKey={(r) => r.id}
            data={filtered}
            columns={[
              { key: 'name', header: 'Rapor', render: (r) => <span className="font-medium">{r.name}</span> },
              { key: 'category', header: 'Kategori', render: (r) => r.category },
              { key: 'desc', header: 'Açıklama', render: (r) => r.description },
              { key: 'freq', header: 'Sıklık', render: (r) => r.frequency },
              { key: 'last', header: 'Son Çalıştırma', render: (r) => r.lastRun },
              {
                key: 'action',
                header: '',
                render: () => (
                  <Button size="sm" variant="outline">
                    <Play className="size-4" /> Çalıştır
                  </Button>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export function KeplerAiPage() {
  const [prompt, setPrompt] = useState('')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kepler AI"
        description="Üretim planlama, stok ve termin riski için akıllı asistan."
        actions={
          <Button size="sm">
            <Bot className="size-4" /> Yeni Sohbet
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>AI Asistan</CardTitle>
            <CardDescription>Operasyonel sorular sorun, öneri alın.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="min-h-[240px] space-y-3 rounded-lg border border-border bg-muted/20 p-4">
              {aiSuggestions.map((text, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-3 text-sm">
                  <p className="mb-1 text-xs font-medium text-primary">Kepler AI</p>
                  <p className="text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Örn: Termin riski olan siparişleri listele..."
              />
              <Button>Gönder</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hızlı Sorular</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              'Kritik stok kalemlerini göster',
              'Bu hafta EXF olan siparişler',
              'Hat verimliliği özeti',
              'Maliyet sapması analizi',
            ].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setPrompt(q)}
                className="w-full rounded-md border border-border px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
              >
                {q}
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ayarlar"
        description="Şirket, kullanıcı, fabrika ve entegrasyon yapılandırması."
        actions={
          <Button size="sm">
            <Settings className="size-4" /> Değişiklikleri Kaydet
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm">
                Yapılandır
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Genel Tercihler</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm">
            <span className="font-medium">Fabrika Saat Dilimi</span>
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option>Europe/Istanbul (UTC+3)</option>
              <option>Europe/London (UTC+0)</option>
            </select>
          </label>
          <label className="space-y-2 text-sm">
            <span className="font-medium">Varsayılan Dil</span>
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option>Türkçe</option>
              <option>English</option>
            </select>
          </label>
        </CardContent>
      </Card>
    </div>
  )
}
