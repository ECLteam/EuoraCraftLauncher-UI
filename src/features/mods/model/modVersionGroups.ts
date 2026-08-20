import type { ModVersion } from '@/types/api'

export type VersionGroupType = 'release' | 'test' | 'april'

export interface ModVersionGroup {
  key: string
  gameVersion: string
  type: VersionGroupType
  loader: string
  /** 排序锚点版本号：愚人节版锚定到下一个正式版，其余与 gameVersion 一致，避免按字符串名错位 */
  sortVersion: string
  files: ModVersion[]
}

/** 把游戏版本解析为分组展示版本、类型与排序锚点，测试版可归并到对应正式版 */
export interface VersionGroupResolver {
  (gameVersion: string): { displayVersion: string; type: VersionGroupType; sortVersion?: string }
}

const TYPE_ORDER: Record<VersionGroupType, number> = { release: 0, test: 1, april: 2 }

const defaultResolver: VersionGroupResolver = (gameVersion) => ({ displayVersion: gameVersion, type: 'release' })

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

/**
 * 像 PCL 一样按单个 Minecraft 版本建立可折叠分组；项目存在多个加载器时，
 * 再将同一版本拆成各自的加载器分组。支持多个版本或加载器的文件会出现在多个组中。
 * resolve 可将测试版映射到对应正式版，实现"1.21.8 测试版"这类归并分组。
 */
export function groupModVersions(
  versions: ModVersion[],
  resolve: VersionGroupResolver = defaultResolver
): ModVersionGroup[] {
  const groups = new Map<string, ModVersionGroup>()
  const projectLoaders = uniqueValues(
    versions.flatMap((version) => version.loaders.map((loader) => loader.toLocaleLowerCase()))
  )
  const separateLoaders = projectLoaders.length > 1

  for (const version of versions) {
    const gameVersions = uniqueValues(version.gameVersions)
    const fileLoaders = uniqueValues(version.loaders.map((loader) => loader.toLocaleLowerCase()))
    const groupLoaders = separateLoaders ? (fileLoaders.length ? fileLoaders : ['']) : [projectLoaders[0] ?? '']

    for (const gameVersion of gameVersions.length ? gameVersions : ['']) {
      const { displayVersion, type, sortVersion } = resolve(gameVersion)
      for (const loader of groupLoaders) {
        const key = JSON.stringify([displayVersion.toLocaleLowerCase(), type, loader])
        const existing = groups.get(key)
        if (existing) {
          existing.files.push(version)
        } else {
          groups.set(key, {
            key,
            gameVersion: displayVersion,
            type,
            loader,
            sortVersion: sortVersion ?? displayVersion,
            files: [version],
          })
        }
      }
    }
  }

  return Array.from(groups.values()).sort((left, right) => {
    const versionOrder = right.sortVersion.localeCompare(left.sortVersion, undefined, {
      numeric: true,
      sensitivity: 'base',
    })
    if (versionOrder !== 0) return versionOrder
    const typeOrder = TYPE_ORDER[left.type] - TYPE_ORDER[right.type]
    if (typeOrder !== 0) return typeOrder
    return left.loader.localeCompare(right.loader)
  })
}

/** 从快照名提取版本族，如 26.3-snapshot-9 -> 26.3；非该命名模式返回 null */
export function snapshotFamily(id: string): string | null {
  const match = id.match(/^(.*?)-snapshot-\d+$/i)
  return match?.[1] ?? null
}

/** 按发布日期把愚人节版锚定到下一个正式版，使其紧跟对应正式版分组，与 HMCL 的定位一致 */
export function aprilFoolsAnchor(
  gameVersion: string,
  releases: Array<{ id: string; releaseTime: string }>,
  aprilFools: Array<{ id: string; releaseTime: string }>
): string {
  const item = aprilFools.find((entry) => entry.id === gameVersion)
  if (!item) return gameVersion
  const next = [...releases]
    .sort((a, b) => a.releaseTime.localeCompare(b.releaseTime))
    .find((entry) => entry.releaseTime > item.releaseTime)
  return next?.id ?? gameVersion
}

export function isModVersionCompatible(version: ModVersion, gameVersion: string, loader: string): boolean {
  const matchesGameVersion =
    version.gameVersions.length === 0 || version.gameVersions.some((value) => value === gameVersion)
  const matchesLoader =
    version.loaders.length === 0 ||
    !loader ||
    version.loaders.some((value) => value.toLocaleLowerCase() === loader.toLocaleLowerCase())
  return matchesGameVersion && matchesLoader
}
