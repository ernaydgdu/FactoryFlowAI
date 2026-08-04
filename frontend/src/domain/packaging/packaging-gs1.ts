/**
 * GS1 company prefix — resolved from Master Data company attributes (not hardcoded).
 */
import { DEFAULT_FACTORY_ID } from '@/domain/platform/iam/types'
import { resolveAttributeMap } from '@/domain/master-data/enterprise/attribute-service'

export const GS1_COMPANY_PREFIX_ATTR = 'GS1_COMPANY_PREFIX'
export const GS1_COMPANY_ENTITY_TYPE = 'company'

/** Fallback only when Master Data attribute is missing (legacy tenants). */
const FALLBACK_GS1_COMPANY_PREFIX = '0860123456'

export function getGs1CompanyPrefix(companyEntityId: string = DEFAULT_FACTORY_ID): string {
  const map = resolveAttributeMap(GS1_COMPANY_ENTITY_TYPE, companyEntityId)
  const raw = map[GS1_COMPANY_PREFIX_ATTR]
  if (typeof raw === 'string' && /^\d{6,12}$/.test(raw.trim())) return raw.trim()
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const s = String(Math.trunc(raw))
    if (/^\d{6,12}$/.test(s)) return s
  }
  return FALLBACK_GS1_COMPANY_PREFIX
}
