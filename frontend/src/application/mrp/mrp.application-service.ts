import {
  executeApproveMrp,
  executeRegenerateMrp,
  executeReleaseProductionSuggestions,
  executeReleasePurchaseSuggestions,
  executeRunMrp,
  type MrpCommandResult,
  type MrpLifecycleCommand,
  type MrpReleaseCommand,
  type RunMrpCommand,
} from './mrp-command.mapper'
import { mapMrpDashboard, mapMrpKpis, mapMrpList, mapMrpShortages } from './mrp.mapper'

export const mrpApplicationService = {
  query: {
    dashboard: mapMrpDashboard,
    list: mapMrpList,
    kpis: mapMrpKpis,
    shortages: mapMrpShortages,
  },
  command: {
    run: (command: RunMrpCommand): MrpCommandResult => executeRunMrp(command),
    regenerate: (command: MrpLifecycleCommand): MrpCommandResult => executeRegenerateMrp(command),
    approve: (command: MrpLifecycleCommand): MrpCommandResult => executeApproveMrp(command),
    releasePurchase: (command: MrpReleaseCommand): MrpCommandResult =>
      executeReleasePurchaseSuggestions(command),
    releaseProduction: (command: MrpReleaseCommand): MrpCommandResult =>
      executeReleaseProductionSuggestions(command),
  },
}
