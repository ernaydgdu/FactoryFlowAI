/**
 * Master Data Bootstrap — uygulama açılışında yalnızca bir kez yüklenir.
 */
import { recordMetric } from './performance-monitor'
import { keplerLogger } from './logger'

let bootstrapped = false
let bootstrapAt: string | null = null

export function ensureMasterDataBootstrapped(): void {
  if (bootstrapped) {
    recordMetric('master-data-bootstrap', 0, 'cache', { hit: true })
    return
  }

  const start = performance.now()
  keplerLogger.info('Master Data bootstrap başlatılıyor')

  void import('@/domain/master-data/repositories').then(() => {
    bootstrapped = true
    bootstrapAt = new Date().toISOString()
    recordMetric('master-data-bootstrap', performance.now() - start, 'domain', { hit: false })
    keplerLogger.info('Master Data bootstrap tamamlandı', { bootstrapAt })
  })
}

export function isMasterDataBootstrapped(): boolean {
  return bootstrapped
}

export function getMasterDataBootstrapTime(): string | null {
  return bootstrapAt
}
