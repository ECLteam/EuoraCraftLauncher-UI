import type { MinecraftPathEntry } from '@/types/api'

export type GamePath = Exclude<MinecraftPathEntry, string>
