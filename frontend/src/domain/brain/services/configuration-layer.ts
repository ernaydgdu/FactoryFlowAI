import {
  getCompanyConfiguration,
  isOperationAllowed,
  isSourceEnabled,
  updateCompanyConfiguration,
} from '../data/brain-config'
import type { ConfigurationLayerContract } from '../contracts'

export const configurationLayer: ConfigurationLayerContract = {
  getCompanyConfiguration,
  isSourceEnabled,
  isOperationAllowed,
}

export {
  getCompanyConfiguration,
  isSourceEnabled,
  isOperationAllowed,
  updateCompanyConfiguration,
}
