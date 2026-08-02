/**
 * Plugin Architecture — çekirdek Brain plugin'lere bağımlı değildir.
 */
import type {
  BrainPlugin,
  BrainPluginContext,
  BrainPluginId,
  BrainPluginResult,
} from '../types/knowledge-reasoning'

const pluginRegistry = new Map<BrainPluginId, BrainPlugin>()

/** Kayıtlı ama disabled plugin'ler — çekirdek bunlar olmadan çalışır */
const BUILTIN_PLUGINS: BrainPlugin[] = [
  {
    id: 'FORECAST',
    name: 'Forecast Plugin',
    version: '0.0.0-stub',
    status: 'REGISTERED',
    description: 'Talep tahmini — gelecek faz',
    optional: true,
  },
  {
    id: 'CARBON',
    name: 'Carbon Plugin',
    version: '0.0.0-stub',
    status: 'REGISTERED',
    description: 'Karbon ayak izi analizi — gelecek faz',
    optional: true,
  },
  {
    id: 'ESG',
    name: 'ESG Plugin',
    version: '0.0.0-stub',
    status: 'REGISTERED',
    description: 'ESG raporlama — gelecek faz',
    optional: true,
  },
  {
    id: 'VISION',
    name: 'Vision Plugin',
    version: '0.0.0-stub',
    status: 'REGISTERED',
    description: 'Görüntü analizi — gelecek faz',
    optional: true,
  },
  {
    id: 'OCR',
    name: 'OCR Plugin',
    version: '0.0.0-stub',
    status: 'REGISTERED',
    description: 'Belge OCR — gelecek faz',
    optional: true,
  },
  {
    id: 'IOT',
    name: 'IoT Plugin',
    version: '0.0.0-stub',
    status: 'REGISTERED',
    description: 'IoT sensör entegrasyonu — gelecek faz',
    optional: true,
  },
]

for (const plugin of BUILTIN_PLUGINS) {
  pluginRegistry.set(plugin.id, plugin)
}

export function registerBrainPlugin(plugin: BrainPlugin): void {
  pluginRegistry.set(plugin.id, plugin)
}

export function getBrainPlugin(id: BrainPluginId): BrainPlugin | undefined {
  return pluginRegistry.get(id)
}

export function getAllBrainPlugins(): BrainPlugin[] {
  return [...pluginRegistry.values()]
}

export function getEnabledPlugins(): BrainPlugin[] {
  return getAllBrainPlugins().filter((p) => p.status === 'ENABLED')
}

export function runEnabledPlugins(ctx: BrainPluginContext): BrainPluginResult[] {
  const results: BrainPluginResult[] = []
  for (const plugin of getEnabledPlugins()) {
    if (plugin.analyze) {
      const result = plugin.analyze(ctx)
      if (result) results.push(result)
    }
  }
  return results
}

export function enablePlugin(id: BrainPluginId): boolean {
  const plugin = pluginRegistry.get(id)
  if (!plugin) return false
  pluginRegistry.set(id, { ...plugin, status: 'ENABLED' })
  return true
}

export function disablePlugin(id: BrainPluginId): boolean {
  const plugin = pluginRegistry.get(id)
  if (!plugin) return false
  pluginRegistry.set(id, { ...plugin, status: 'DISABLED' })
  return true
}
