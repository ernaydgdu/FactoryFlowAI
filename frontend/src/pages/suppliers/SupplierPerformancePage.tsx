import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader, StatusBadge } from '@/components/erp'
import { Card, CardContent } from '@/components/ui/card'
import { fetchSupplierPerformance } from '@/infrastructure/api/dashboard-api.repository'
import { getReliabilityTone } from '@/lib/reliability-rate'

export function SupplierPerformancePage() {
  const performanceQuery = useQuery({
    queryKey: applicationQueryKeys.dashboardSummary.supplierPerformance(),
    queryFn: fetchSupplierPerformance,
  })

  const suppliers = performanceQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tedarikçi Performansı"
        description="Tedarikçilerin zamanında teslimat oranına göre güvenilirlik karşılaştırması."
      />

      {performanceQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Tedarikçi performans verileri yüklenemedi.
        </div>
      ) : null}

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2">Tedarikçi Adı</th>
                <th className="px-3 py-2">Toplam Sipariş</th>
                <th className="px-3 py-2">Zamanında</th>
                <th className="px-3 py-2">Geç</th>
                <th className="px-3 py-2">Bekleyen</th>
                <th className="px-3 py-2">Ort. Gecikme (gün)</th>
                <th className="px-3 py-2">Güvenilirlik Skoru</th>
              </tr>
            </thead>
            <tbody>
              {performanceQuery.isLoading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    Yükleniyor...
                  </td>
                </tr>
              ) : suppliers.length > 0 ? (
                suppliers.map((supplier) => (
                  <tr key={supplier.supplierName} className="border-b border-border/60">
                    <td className="px-3 py-2 font-medium">{supplier.supplierName}</td>
                    <td className="px-3 py-2 tabular-nums">{supplier.totalOrders}</td>
                    <td className="px-3 py-2 tabular-nums">{supplier.onTimeCount}</td>
                    <td className="px-3 py-2 tabular-nums">{supplier.lateCount}</td>
                    <td className="px-3 py-2 tabular-nums">{supplier.pendingCount}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {supplier.avgDelayDays.toFixed(1)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        label={`%${supplier.reliabilityScore.toFixed(1)}`}
                        tone={getReliabilityTone(supplier.reliabilityScore)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    Henüz malzeme kaydı bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
