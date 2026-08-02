import type { ProductTemplate } from './types'
import { PRODUCT_TEMPLATES } from './enterprise-seed'
import { resolveDefaultsForProductGroup } from './default-resolver-service'

export function getProductTemplate(code: string): ProductTemplate | undefined {
  return PRODUCT_TEMPLATES.find((t) => t.code === code)
}

export function getProductTemplateById(id: string): ProductTemplate | undefined {
  return PRODUCT_TEMPLATES.find((t) => t.id === id)
}

export function getActiveProductTemplates(): ProductTemplate[] {
  return PRODUCT_TEMPLATES.filter((t) => t.status === 'Active')
}

export function deriveProductFromTemplate(templateCode: string) {
  const template = getProductTemplate(templateCode)
  if (!template) throw new Error(`Product template bulunamadı: ${templateCode}`)
  const defaults = resolveDefaultsForProductGroup(template.productGroupId)
  return {
    templateId: template.id,
    templateCode: template.code,
    templateName: template.name,
    productGroupId: template.productGroupId,
    sizeSetId: template.sizeSetId,
    defaultProfileId: template.defaultProfileId,
    defaults,
    version: template.version,
  }
}

export function countTemplateCoverage(): { templates: number; active: number } {
  return {
    templates: PRODUCT_TEMPLATES.length,
    active: PRODUCT_TEMPLATES.filter((t) => t.status === 'Active').length,
  }
}
