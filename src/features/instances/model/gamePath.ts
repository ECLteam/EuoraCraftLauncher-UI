import type { MinecraftPathEntry } from '@/types/config'

export type GamePath = Exclude<MinecraftPathEntry, string>

export function findGamePathIndex(paths: GamePath[], ...candidates: Array<string | null | undefined>): number {
  for (const candidate of candidates) {
    if (!candidate) continue
    const index = paths.findIndex((gamePath) => gamePath.path === candidate)
    if (index >= 0) return index
  }
  return paths.length > 0 ? 0 : -1
}
