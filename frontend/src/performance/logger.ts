/** Kepler ERP — structured logging (Production: Debug kapalı) */

export type LogLevel = 'Debug' | 'Info' | 'Warning' | 'Error' | 'Fatal'

const LEVEL_ORDER: Record<LogLevel, number> = {
  Debug: 0,
  Info: 1,
  Warning: 2,
  Error: 3,
  Fatal: 4,
}

const MIN_LEVEL: LogLevel = import.meta.env.PROD ? 'Info' : 'Debug'

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[MIN_LEVEL]
}

function emit(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  if (!shouldLog(level)) return
  const payload = context ? `${message} ${JSON.stringify(context)}` : message
  if (level === 'Error' || level === 'Fatal') {
    console.error(`[${level}] ${payload}`)
  } else if (level === 'Warning') {
    console.warn(`[${level}] ${payload}`)
  } else {
    console.info(`[${level}] ${payload}`)
  }
}

export const keplerLogger = {
  debug: (message: string, context?: Record<string, unknown>) => emit('Debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => emit('Info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => emit('Warning', message, context),
  error: (message: string, context?: Record<string, unknown>) => emit('Error', message, context),
  fatal: (message: string, context?: Record<string, unknown>) => emit('Fatal', message, context),
}
