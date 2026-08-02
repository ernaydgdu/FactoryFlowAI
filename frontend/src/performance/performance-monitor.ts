/** Kepler ERP — client-side performance metrics collector */

export type PerformanceMetric = {
  name: string
  durationMs: number
  category: 'page' | 'domain' | 'brain' | 'planning' | 'mrp' | 'cache' | 'render'
  timestamp: string
  metadata?: Record<string, unknown>
}

const metrics: PerformanceMetric[] = []
const MAX_METRICS = 500

export function recordMetric(
  name: string,
  durationMs: number,
  category: PerformanceMetric['category'],
  metadata?: Record<string, unknown>,
): void {
  metrics.push({
    name,
    durationMs,
    category,
    timestamp: new Date().toISOString(),
    metadata,
  })
  if (metrics.length > MAX_METRICS) metrics.shift()
}

export function measureSync<T>(
  name: string,
  category: PerformanceMetric['category'],
  fn: () => T,
  metadata?: Record<string, unknown>,
): T {
  const start = performance.now()
  try {
    return fn()
  } finally {
    recordMetric(name, performance.now() - start, category, metadata)
  }
}

export async function measureAsync<T>(
  name: string,
  category: PerformanceMetric['category'],
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>,
): Promise<T> {
  const start = performance.now()
  try {
    return await fn()
  } finally {
    recordMetric(name, performance.now() - start, category, metadata)
  }
}

export function getPerformanceMetrics(): PerformanceMetric[] {
  return [...metrics]
}

export function getAverageByCategory(category: PerformanceMetric['category']): number {
  const filtered = metrics.filter((m) => m.category === category)
  if (!filtered.length) return 0
  return filtered.reduce((s, m) => s + m.durationMs, 0) / filtered.length
}

export function getSlowestServices(limit = 10): PerformanceMetric[] {
  return [...metrics].sort((a, b) => b.durationMs - a.durationMs).slice(0, limit)
}

export function getCacheHitRatio(): number {
  const cacheMetrics = metrics.filter((m) => m.category === 'cache')
  if (!cacheMetrics.length) return 0
  const hits = cacheMetrics.filter((m) => m.metadata?.hit === true).length
  return Math.round((hits / cacheMetrics.length) * 100)
}

export function resetPerformanceMetrics(): void {
  metrics.length = 0
}

export type PerformanceSummary = {
  averagePageLoad: number
  averageDomainExecution: number
  averageBrainExecution: number
  averagePlanningExecution: number
  averageMrpDuration: number
  cacheHitRatio: number
  totalMetrics: number
  slowestServices: PerformanceMetric[]
  memoryUsageMb?: number
}

export function getPerformanceSummary(): PerformanceSummary {
  const mem = typeof performance !== 'undefined' && 'memory' in performance
    ? (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize
    : undefined

  return {
    averagePageLoad: getAverageByCategory('page'),
    averageDomainExecution: getAverageByCategory('domain'),
    averageBrainExecution: getAverageByCategory('brain'),
    averagePlanningExecution: getAverageByCategory('planning'),
    averageMrpDuration: getAverageByCategory('mrp'),
    cacheHitRatio: getCacheHitRatio(),
    totalMetrics: metrics.length,
    slowestServices: getSlowestServices(5),
    memoryUsageMb: mem ? Math.round(mem / 1024 / 1024) : undefined,
  }
}
