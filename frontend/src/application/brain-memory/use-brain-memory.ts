import { useQuery } from '@tanstack/react-query'

import { applicationQueryKeys } from '@/application/core/query-keys'
import type { MemoryIndexKey, MemoryQueryPreset } from '@/domain/brain/manufacturing-memory'
import { brainMemoryApplicationService } from './brain-memory.application-service'

export function useManufacturingMemoryRun() {
  return useQuery({
    queryKey: applicationQueryKeys.brainMemory.run(),
    queryFn: () => brainMemoryApplicationService.query.run(),
  })
}

export function useManufacturingMemoryCoverage() {
  return useQuery({
    queryKey: applicationQueryKeys.brainMemory.coverage(),
    queryFn: () => brainMemoryApplicationService.query.coverage(),
  })
}

export function useMemoryRecords() {
  return useQuery({
    queryKey: applicationQueryKeys.brainMemory.records(),
    queryFn: () => brainMemoryApplicationService.query.records(),
  })
}

export function useMemoryIndexes() {
  return useQuery({
    queryKey: applicationQueryKeys.brainMemory.indexes(),
    queryFn: () => brainMemoryApplicationService.query.indexes(),
  })
}

export function useMemoryPreset(preset: MemoryQueryPreset, styleCode?: string) {
  return useQuery({
    queryKey: applicationQueryKeys.brainMemory.preset(preset, styleCode ?? ''),
    queryFn: () => brainMemoryApplicationService.query.preset(preset, styleCode),
  })
}

export function useMemoryByIndex(index: MemoryIndexKey, key?: string) {
  return useQuery({
    queryKey: applicationQueryKeys.brainMemory.byIndex(index, key ?? ''),
    queryFn: () => brainMemoryApplicationService.query.byIndex(index, key),
  })
}

export function useProductionOrderMemoryReplay(productionOrderNo: string) {
  return useQuery({
    queryKey: applicationQueryKeys.brainMemory.replay(productionOrderNo),
    queryFn: () =>
      brainMemoryApplicationService.query.replayProductionOrder(productionOrderNo),
    enabled: productionOrderNo.trim().length > 0,
  })
}
