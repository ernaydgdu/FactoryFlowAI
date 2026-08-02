/**
 * Playbook Engine — şirket prosedürlerine göre öneri sıralama.
 */
import type { Playbook, PlaybookRecommendation, PlaybookTrigger } from '../types'

export const COMPANY_PLAYBOOKS: Playbook[] = [
  {
    id: 'pb-fabric-delay',
    companyId: 'company-kepler-001',
    name: 'Kumaş Gecikme Prosedürü',
    trigger: 'FABRIC_DELAY',
    active: true,
    steps: [
      { order: 1, action: 'Alternatif tedarikçi değerlendir', description: 'Onaylı alternatif tedarikçi listesinden seç', requiresApproval: true },
      { order: 2, action: 'Ek vardiya planla', description: 'Termin telafisi için mesai', requiresApproval: true },
      { order: 3, action: 'Buyer ile termin görüşmesi', description: 'EXF revizyonu için merchandising', requiresApproval: true },
    ],
  },
  {
    id: 'pb-termin-risk',
    companyId: 'company-kepler-001',
    name: 'Termin Risk Prosedürü',
    trigger: 'TERMIN_RISK',
    active: true,
    steps: [
      { order: 1, action: 'Blocker analizi yap', description: 'Root cause tree incele', requiresApproval: false },
      { order: 2, action: 'Kapasite yeniden tahsis et', description: 'Alternatif atölye', requiresApproval: true },
      { order: 3, action: 'Kısmi sevkiyat değerlendir', description: 'Buyer onayı ile', requiresApproval: true },
    ],
  },
  {
    id: 'pb-capacity',
    companyId: 'company-kepler-001',
    name: 'Kapasite Aşımı Prosedürü',
    trigger: 'CAPACITY_OVERLOAD',
    active: true,
    steps: [
      { order: 1, action: 'Sipariş önceliklendir', description: 'EXF bazlı sıralama', requiresApproval: false },
      { order: 2, action: 'Fason atölye B devreye al', description: 'Yük transferi', requiresApproval: true },
    ],
  },
]

export function getPlaybooksForCompany(companyId: string): Playbook[] {
  return COMPANY_PLAYBOOKS.filter((p) => p.companyId === companyId && p.active)
}

export function matchPlaybook(
  companyId: string,
  trigger: PlaybookTrigger,
): PlaybookRecommendation | undefined {
  const playbook = getPlaybooksForCompany(companyId).find((p) => p.trigger === trigger)
  if (!playbook) return undefined

  return {
    playbookId: playbook.id,
    playbookName: playbook.name,
    trigger: playbook.trigger,
    rankedSteps: [...playbook.steps].sort((a, b) => a.order - b.order),
    matchScore: 100,
  }
}

export function rankRecommendationsByPlaybook(
  companyId: string,
  trigger: PlaybookTrigger,
  suggestedActions: string[],
): string[] {
  const playbook = matchPlaybook(companyId, trigger)
  if (!playbook) return suggestedActions

  const playbookActions = playbook.rankedSteps.map((s) => s.action)
  const matched = suggestedActions.filter((a) =>
    playbookActions.some((pa) => a.toLowerCase().includes(pa.toLowerCase().slice(0, 10))),
  )
  const unmatched = suggestedActions.filter((a) => !matched.includes(a))
  return [...matched, ...unmatched]
}
