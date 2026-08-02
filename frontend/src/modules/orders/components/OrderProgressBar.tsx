import { cn } from '@/lib/utils'

type OrderProgressBarProps = {
  value: number
  className?: string
}

export function OrderProgressBar({ value, className }: OrderProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const tone =
    clamped >= 100
      ? 'bg-emerald-500'
      : clamped >= 60
        ? 'bg-primary'
        : clamped >= 30
          ? 'bg-amber-500'
          : 'bg-muted-foreground/40'

  return (
    <div className={cn('flex min-w-[88px] items-center gap-2', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', tone)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
        {clamped}%
      </span>
    </div>
  )
}
