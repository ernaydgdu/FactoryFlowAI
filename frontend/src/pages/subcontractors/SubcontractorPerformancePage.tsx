import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import { PageHeader, StatusBadge } from '@/components/erp'
import { Card, CardContent } from '@/components/ui/card'
import { fetchSubcontractorPerformance } from '@/infrastructure/api/dashboard-api.repository'
import { getReliabilityTone } from '@/lib/reliability-rate'

export function SubcontractorPerformancePage() {
  const performanceQuery = useQuery({
    queryKey: applicationQueryKeys.dashboardSummary.subcontractorPerformance(),
    queryFn: fetchSubcontractorPerformance,
  })

  const subcontractors = performanceQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fason Atölye Performansı"
        description="Fason atölyelerin zamanında teslimat ve fire oranına göre güvenilirlik karşılaştırması."
      />

      {performanceQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Fason atölye performans verileri yüklenemedi.
        </div>
      ) : null}

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2">Atölye Adı</th>
                <th className="px-3 py-2">Toplam Gönderim</th>
                <th className="px-3 py-2">Zamanında</th>
                <th className="px-3 py-2">Geç</th>
                <th className="px-3 py-2">Bekleyen</th>
                <th className="px-3 py-2">Ort. Gecikme (gün)</th>
                <th className="px-3 py-2">Ort. Fire Oranı</th>
                <th className="px-3 py-2">Güvenilirlik Skoru</th>
              </tr>
            </thead>
            <tbody>
              {performanceQuery.isLoading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                    Yükleniyor...
                  </td>
                </tr>
              ) : subcontractors.length > 0 ? (
                subcontractors.map((sub) => (
                  <tr key={sub.subcontractorName} className="border-b border-border/60">
                    <td className="px-3 py-2 font-medium">{sub.subcontractorName}</td>
                    <td className="px-3 py-2 tabular-nums">{sub.totalShipments}</td>
                    <td className="px-3 py-2 tabular-nums">{sub.onTimeCount}</td>
                    <td className="px-3 py-2 tabular-nums">{sub.lateCount}</td>
                    <td className="px-3 py-2 tabular-nums">{sub.pendingCount}</td>
                    <td className="px-3 py-2 tabular-nums">{sub.avgDelayDays.toFixed(1)}</td>
                    <td className="px-3 py-2 tabular-nums">%{sub.avgFireRate.toFixed(1)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        label={`%${sub.reliabilityScore.toFixed(1)}`}
                        tone={getReliabilityTone(sub.reliabilityScore)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                    Henüz fason gönderimi bulunmuyor.
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
