/**
 * Production Calendar — factory working-day model.
 * Pazar günleri çalışma dışıdır; diğer günler iş günüdür. Resmi tatiller
 * ileride master-data'ya taşınabilir; model gün bazında bunu destekler.
 */
import type { CalendarDay } from './planning.types'

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function isoWeekLabel(d: Date): string {
  // ISO 8601 week number
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dayNum = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function isWorkingDate(isoDate: string): boolean {
  const d = new Date(`${isoDate}T00:00:00Z`)
  return d.getUTCDay() !== 0
}

export function buildProductionCalendar(startIsoDate: string, dayCount: number): CalendarDay[] {
  const days: CalendarDay[] = []
  const start = new Date(`${startIsoDate}T00:00:00Z`)
  for (let i = 0; i < dayCount; i += 1) {
    const d = new Date(start)
    d.setUTCDate(start.getUTCDate() + i)
    const weekday = d.getUTCDay()
    days.push({
      date: toIsoDate(d),
      weekday,
      isWorkingDay: weekday !== 0,
      weekLabel: isoWeekLabel(d),
    })
  }
  return days
}

export function workingDaysBetween(startIsoDate: string, endIsoDate: string): string[] {
  if (endIsoDate < startIsoDate) return []
  const out: string[] = []
  const start = new Date(`${startIsoDate}T00:00:00Z`)
  const end = new Date(`${endIsoDate}T00:00:00Z`)
  for (let d = new Date(start); d.getTime() <= end.getTime(); d.setUTCDate(d.getUTCDate() + 1)) {
    if (d.getUTCDay() !== 0) out.push(toIsoDate(d))
  }
  return out
}

export function nextWorkingDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  do {
    d.setUTCDate(d.getUTCDate() + 1)
  } while (d.getUTCDay() === 0)
  return toIsoDate(d)
}
