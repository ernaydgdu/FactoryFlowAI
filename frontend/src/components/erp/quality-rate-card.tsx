import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getQualityRateTone, QUALITY_RATE_TONE_CLASS } from '@/lib/quality-rate'
import { cn } from '@/lib/utils'

type QualityRateCardProps = {
  label: string
  percent: number
  hint?: string
}

export function QualityRateCard({ label, percent, hint }: QualityRateCardProps) {
  const tone = getQualityRateTone(percent)

  return (
    <Card className={cn(QUALITY_RATE_TONE_CLASS[tone])}>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl font-bold tabular-nums">%{percent.toFixed(1)}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent>
          <p className="text-xs opacity-70">{hint}</p>
        </CardContent>
      ) : null}
    </Card>
  )
}
