import { queryEnterpriseAiFoundation } from '@/domain/brain/enterprise-ai-foundation'
import {
  queryAuditDashboard,
  queryBootstrapDiagnosticsDashboard,
  queryEnterpriseHardeningDashboard,
  queryEnterpriseHealth,
  queryPerformanceDashboard,
  queryReliabilityAudit,
} from '@/domain/enterprise-hardening/enterprise-hardening-query.service'

export const enterpriseHardeningApplicationService = {
  query: {
    dashboard: queryEnterpriseHardeningDashboard,
    health: queryEnterpriseHealth,
    bootstrap: queryBootstrapDiagnosticsDashboard,
    performance: queryPerformanceDashboard,
    audit: queryAuditDashboard,
    reliability: queryReliabilityAudit,
    ai: queryEnterpriseAiFoundation,
  },
}
