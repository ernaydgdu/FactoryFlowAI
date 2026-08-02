import { masterDataEnterpriseConfig } from '../master-data-port-access'
import type { ProductTemplate } from './types'
import { resolveDefaultsForProductGroup } from './default-resolver-service'

function configRepo() {
  return masterDataEnterpriseConfig()
}

export function getProductTemplate(code: string): ProductTemplate | undefined {
  return configRepo().getProductTemplates().find((t) => t.code === code)
}

export function getProductTemplateById(id: string): ProductTemplate | undefined {
  return configRepo().getProductTemplates().find((t) => t.id === id)
}

export function getActiveProductTemplates(): ProductTemplate[] {
  return configRepo().getProductTemplates().filter((t) => t.status === 'Active')
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
  const templates = configRepo().getProductTemplates()
  return {
    templates: templates.length,
    active: templates.filter((t) => t.status === 'Active').length,
  }
}
