import { cn } from '@/lib/utils'

const toneStyles = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  danger: 'bg-destructive/10 text-destructive',
  critical: 'bg-critical/15 text-critical',
  muted: 'bg-muted text-muted-foreground',
} as const

type StatusBadgeProps = {
  label: string
  tone?: keyof typeof toneStyles
}

export function StatusBadge({ label, tone = 'default' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        toneStyles[tone],
      )}
    >
      {label}
    </span>
  )
}
