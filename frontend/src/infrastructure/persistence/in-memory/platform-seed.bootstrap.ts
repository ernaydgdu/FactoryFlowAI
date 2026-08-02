/**
 * Platform seed bootstrap — enterprise timeline, brain decision memory, vb.
 * Domain servisleri seed array'lere erişmez.
 */
import type { DecisionMemoryEntry } from '@/domain/brain/twin/types'
import { ENTERPRISE_TIMELINE_SEED } from '@/domain/enterprise/enterprise-seed'
import { DEFAULT_TENANT_ID, requireUnitOfWork } from '@/domain/ports/persistence/persistence-registry'
import { PERSISTENCE_CURSOR_MAX_LIMIT } from '@/domain/ports/persistence/persistence.types'

const SEED_DECISIONS: Omit<DecisionMemoryEntry, 'id' | 'recordedAt'>[] = [
  {
    companyId: 'company-kepler-001',
    userId: 'user-planner-001',
    decisionType: 'TERMIN_MITIGATION',
    context: 'SIP-2026-0138 termin riski',
    actionTaken: 'Ek vardiya açıldı',
    outcome: 'SUCCESS',
    outcomeNotes: 'Termin kurtuldu — EXF tarihine yetişildi',
    relatedOrderId: '2',
    tenantScoped: true,
  },
  {
    companyId: 'company-kepler-001',
    userId: 'user-ceo-001',
    decisionType: 'CAPACITY_REALLOCATION',
    context: 'Kapasite darboğazı — Hat 4',
    actionTaken: 'Fason Atölye B\'ye yük kaydırıldı',
    outcome: 'PARTIAL',
    outcomeNotes: 'Termin kurtuldu ancak maliyet %8 arttı',
    tenantScoped: true,
  },
]

let seeded = false

export function ensurePlatformSeeded(): void {
  if (seeded) return

  const uow = requireUnitOfWork()
  const tenantId = DEFAULT_TENANT_ID

  if (uow.enterpriseTimeline.findAll(tenantId).length === 0) {
    uow.enterpriseTimeline.seedFromLegacy(tenantId, ENTERPRISE_TIMELINE_SEED)
  }

  const decisions = uow.brainDecisionMemory.cursor(tenantId, {}, { limit: PERSISTENCE_CURSOR_MAX_LIMIT })
  if (decisions.items.length === 0) {
    const entries: DecisionMemoryEntry[] = SEED_DECISIONS.map((seed, i) => ({
      ...seed,
      id: `dmem-${i + 1}`,
      recordedAt: '2026-07-15T10:00:00Z',
    }))
    uow.brainDecisionMemory.seedFromLegacy(tenantId, entries)
  }

  seeded = true
}

export function resetPlatformSeedForTests(): void {
  seeded = false
}
