import { queryEnterpriseAiFoundation } from '@/domain/brain/enterprise-ai-foundation'
import {
  queryAuditDashboard,
  queryBootstrapDiagnosticsDashboard,
  queryEnterpriseHardeningDashboard,
  queryEnterpriseHealth,
  queryPerformanceDashboard,
  queryReliabilityAudit,
} from './enterprise-hardening-observability.query'

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
