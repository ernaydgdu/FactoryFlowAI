/**
 * Localization demo — çoklu kullanıcı dil senaryosu.
 * Planlamacı (TR), Genel Müdür (EN), Buyer (EN) aynı veriyi kendi dillerinde görür.
 */
import { demoMultiUserLocalization } from '../../localization/services/localization-engine'
import { KEPLER_COMPANY_ID } from '../../localization/data/localization-demo'

export const LOCALIZATION_DEMO_SCENARIOS = demoMultiUserLocalization()

export const LOCALIZATION_DEMO_COMPANY_ID = KEPLER_COMPANY_ID
