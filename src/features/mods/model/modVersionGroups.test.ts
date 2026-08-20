import { describe, expect, it } from 'vitest'
import type { ModVersion } from '@/types/api'
import {
  aprilFoolsAnchor,
  groupModVersions,
  isModVersionCompatible,
  snapshotFamily,
  type VersionGroupResolver,
} from './modVersionGroups'

function version(overrides: Partial<ModVersion>): ModVersion {
  return {
    id: overrides.id ?? 'file',
    projectId: 'project',
    name: overrides.name ?? 'Fabric API',
    versionNumber: overrides.versionNumber ?? '1.0.0',
    gameVersions: overrides.gameVersions ?? ['1.21.1'],
    loaders: overrides.loaders ?? ['fabric'],
    filename: overrides.filename ?? 'fabric-api.jar',
    datePublished: overrides.datePublished,
    downloads: 0,
    releaseType: 'release',
  }
}

describe('groupModVersions', () => {
  it('puts a file that supports multiple Minecraft versions into each version group', () => {
    const newest = version({ id: 'newest', versionNumber: '2.0.0', gameVersions: ['1.21', '1.21.1'] })
    const older = version({ id: 'older', versionNumber: '1.9.0', gameVersions: ['1.21.1', '1.21'] })

    const groups = groupModVersions([newest, older])

    expect(groups).toHaveLength(2)
    expect(groups.map((group) => group.gameVersion)).toEqual(['1.21.1', '1.21'])
    expect(groups[0]?.files.map((file) => file.id)).toEqual(['newest', 'older'])
  })

  it('separates loaders only when the project has more than one loader', () => {
    const groups = groupModVersions([
      version({ id: 'fabric', loaders: ['fabric'] }),
      version({ id: 'forge', loaders: ['forge'] }),
    ])

    expect(groups).toHaveLength(2)
    expect(groups.map((group) => group.loader)).toEqual(['fabric', 'forge'])
  })

  it('keeps a single-loader project grouped only by Minecraft version', () => {
    const groups = groupModVersions([
      version({ id: 'newest', loaders: ['fabric'] }),
      version({ id: 'older', loaders: ['Fabric'] }),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.files.map((file) => file.id)).toEqual(['newest', 'older'])
  })

  it('merges test versions into their corresponding release group via resolver', () => {
    // 26w29a 与 26w28b 都归到 1.21.8 测试版，与 1.21.8 正式版分开
    const resolve: VersionGroupResolver = (gameVersion) => {
      if (gameVersion === '1.21.8') return { displayVersion: gameVersion, type: 'release' }
      if (gameVersion === '26w29a' || gameVersion === '26w28b') return { displayVersion: '1.21.8', type: 'test' }
      return { displayVersion: gameVersion, type: 'release' }
    }
    const groups = groupModVersions(
      [
        version({ id: 'release-file', gameVersions: ['1.21.8'] }),
        version({ id: 'snap-a', gameVersions: ['26w29a'] }),
        version({ id: 'snap-b', gameVersions: ['26w28b'] }),
      ],
      resolve
    )

    expect(groups).toHaveLength(2)
    expect(groups.map((group) => [group.gameVersion, group.type])).toEqual([
      ['1.21.8', 'release'],
      ['1.21.8', 'test'],
    ])
    expect(groups[1]?.files.map((file) => file.id)).toEqual(['snap-a', 'snap-b'])
  })

  it('positions April Fools groups after their anchored release via sortVersion', () => {
    // 25w14craftmine 锚定到 1.21.6，排序应紧跟 1.21.6 之后、1.21.5 之前
    const resolve: VersionGroupResolver = (gameVersion) => {
      if (gameVersion === '1.21.6') return { displayVersion: gameVersion, type: 'release', sortVersion: gameVersion }
      if (gameVersion === '25w14craftmine') return { displayVersion: gameVersion, type: 'april', sortVersion: '1.21.6' }
      if (gameVersion === '1.21.5') return { displayVersion: gameVersion, type: 'release', sortVersion: gameVersion }
      return { displayVersion: gameVersion, type: 'release' }
    }
    const groups = groupModVersions(
      [
        version({ id: 'r165', gameVersions: ['1.21.6'] }),
        version({ id: 'af', gameVersions: ['25w14craftmine'] }),
        version({ id: 'r155', gameVersions: ['1.21.5'] }),
      ],
      resolve
    )

    expect(groups.map((group) => [group.gameVersion, group.type])).toEqual([
      ['1.21.6', 'release'],
      ['25w14craftmine', 'april'],
      ['1.21.5', 'release'],
    ])
  })
})

describe('snapshotFamily', () => {
  it('extracts the family version from a -snapshot-N name', () => {
    expect(snapshotFamily('26.3-snapshot-9')).toBe('26.3')
    expect(snapshotFamily('26.3-snapshot-10')).toBe('26.3')
  })

  it('returns null for names without the snapshot suffix', () => {
    expect(snapshotFamily('26w29a')).toBeNull()
    expect(snapshotFamily('1.21.8')).toBeNull()
  })
})

describe('aprilFoolsAnchor', () => {
  const releases = [
    { id: '1.21.5', releaseTime: '2025-03-25T10:00:00Z' },
    { id: '1.21.6', releaseTime: '2025-06-17T10:00:00Z' },
    { id: '1.21.7', releaseTime: '2025-09-30T10:00:00Z' },
  ]
  const aprilFools = [{ id: '25w14craftmine', releaseTime: '2025-04-01T10:00:00Z' }]

  it('anchors an April Fools version to the next release by date', () => {
    expect(aprilFoolsAnchor('25w14craftmine', releases, aprilFools)).toBe('1.21.6')
  })

  it('returns the version itself when it is not an April Fools version', () => {
    expect(aprilFoolsAnchor('1.21.6', releases, aprilFools)).toBe('1.21.6')
  })

  it('returns the version itself when no later release exists', () => {
    const latest = [{ id: '25w14craftmine', releaseTime: '2026-12-01T10:00:00Z' }]
    expect(aprilFoolsAnchor('25w14craftmine', releases, latest)).toBe('25w14craftmine')
  })
})

describe('isModVersionCompatible', () => {
  it('matches both the Minecraft version and loader case-insensitively', () => {
    const file = version({ gameVersions: ['1.21.1'], loaders: ['fabric'] })

    expect(isModVersionCompatible(file, '1.21.1', 'Fabric')).toBe(true)
    expect(isModVersionCompatible(file, '1.21', 'fabric')).toBe(false)
    expect(isModVersionCompatible(file, '1.21.1', 'forge')).toBe(false)
  })

  it('treats an empty compatibility dimension as unrestricted', () => {
    const file = version({ gameVersions: [], loaders: [] })
    expect(isModVersionCompatible(file, '1.20.1', 'forge')).toBe(true)
  })
})
