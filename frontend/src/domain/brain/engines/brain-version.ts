import { BRAIN_ALGORITHM_VERSION, BRAIN_VERSION } from '../constants'
import type { BrainAlgorithmVersion, VersionedAnalysisMetadata } from '../types/knowledge-reasoning'
import type { BrainPersonaId } from '../types/knowledge-reasoning'

export function getCurrentBrainVersion(): string {
  return BRAIN_VERSION
}

export function getAlgorithmVersion(): BrainAlgorithmVersion {
  return { ...BRAIN_ALGORITHM_VERSION }
}

export function createVersionedMetadata(
  personaId: BrainPersonaId,
  pluginIds: string[] = [],
): VersionedAnalysisMetadata {
  return {
    brainVersion: BRAIN_VERSION,
    algorithmVersion: getAlgorithmVersion(),
    personaId,
    pluginIds,
  }
}

export function formatVersionLabel(version: BrainAlgorithmVersion): string {
  return `Kepler Brain v${version.major}.${version.minor}.${version.patch} (${version.chapter})`
}
