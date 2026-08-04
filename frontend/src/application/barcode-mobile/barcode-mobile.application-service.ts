import { mapBarcodeDashboard } from './barcode-mobile.mapper'
import {
  executeFlushOfflineQueue,
  executeScanBundle,
  executeScanFinishedGoods,
  executeScanMaterial,
  executeScanOperation,
  executeScanProduction,
  queryBundleLabel,
  queryFinishedGoodsLabel,
  queryPalletLabel,
} from './barcode-mobile-command.mapper'
import { listOfflineQueue } from '@/domain/barcode-mobile/offline-queue.service'

export const barcodeMobileApplicationService = {
  query: {
    dashboard: mapBarcodeDashboard,
    offlineQueue: listOfflineQueue,
    bundleLabel: queryBundleLabel,
    palletLabel: queryPalletLabel,
    finishedGoodsLabel: queryFinishedGoodsLabel,
  },
  command: {
    executeScanOperation,
    executeScanBundle,
    executeScanMaterial,
    executeScanFinishedGoods,
    executeScanProduction,
    flushOfflineQueue: executeFlushOfflineQueue,
  },
}
