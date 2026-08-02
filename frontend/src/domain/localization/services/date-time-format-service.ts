import type { DateFormatPattern, FormatDateOptions, RegionSettings, TimeFormatPattern } from '../types'

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function formatWithPattern(date: Date, pattern: DateFormatPattern): string {
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)
  const year = date.getFullYear().toString()

  switch (pattern) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`
  }
}

function formatTimePart(date: Date, timeFormat: TimeFormatPattern): string {
  const hours24 = date.getHours()
  const minutes = pad(date.getMinutes())

  if (timeFormat === 'H12') {
    const period = hours24 >= 12 ? 'PM' : 'AM'
    const hours12 = hours24 % 12 || 12
    return `${pad(hours12)}:${minutes} ${period}`
  }

  return `${pad(hours24)}:${minutes}`
}

export function formatDate(
  date: Date | string,
  region: RegionSettings,
  options?: FormatDateOptions,
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const pattern = options?.pattern ?? region.dateFormat
  const datePart = formatWithPattern(d, pattern)

  if (options?.includeTime) {
    return `${datePart} ${formatTimePart(d, region.timeFormat)}`
  }

  return datePart
}

export function formatTime(date: Date | string, region: RegionSettings): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatTimePart(d, region.timeFormat)
}

export function formatDateTime(date: Date | string, region: RegionSettings): string {
  return formatDate(date, region, { includeTime: true })
}

export function parseDateString(value: string, pattern: DateFormatPattern): Date | null {
  const parts = value.split(/[/\-.]/).map(Number)
  if (parts.length !== 3 || parts.some(Number.isNaN)) return null

  let day: number
  let month: number
  let year: number

  switch (pattern) {
    case 'MM/DD/YYYY':
      ;[month, day, year] = parts
      break
    case 'YYYY-MM-DD':
      ;[year, month, day] = parts
      break
    case 'DD/MM/YYYY':
    default:
      ;[day, month, year] = parts
      break
  }

  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatRelativeDayOffset(days: number, _region: RegionSettings): string {
  if (days === 0) return '0'
  return days > 0 ? `+${days}` : String(days)
}
