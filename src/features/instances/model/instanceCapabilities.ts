import type { ScannedVersion } from '@/types/instances'

const MOD_LOADERS = new Set(['forge', 'neoforge', 'fabric', 'quilt'])

export function hasModLoader(version: ScannedVersion | null | undefined): boolean {
  if (!version) return false
  return (
    version.hasForge ||
    version.hasNeoForge ||
    version.hasFabric ||
    version.hasQuilt ||
    MOD_LOADERS.has(String(version.primaryLoader || '').toLowerCase())
  )
}
