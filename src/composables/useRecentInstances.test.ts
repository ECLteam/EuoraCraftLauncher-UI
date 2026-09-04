import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_PINNED_ITEMS, useRecentInstancesStore, type RecentInstance } from './useRecentInstances'

const STORAGE_KEY = 'euoracraft_recent_instances'

function makeEntry(id: number): { versionId: string; versionName: string; gamePath: string } {
  return { versionId: `v${id}`, versionName: `版本${id}`, gamePath: `C:/games/path${id}` }
}

function recordRange(store: ReturnType<typeof useRecentInstancesStore>, start: number, count: number): void {
  for (let offset = 0; offset < count; offset += 1) {
    const entry = makeEntry(start + offset)
    store.recordLaunch(entry.versionId, entry.versionName, entry.gamePath)
  }
}

describe('useRecentInstancesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('记录启动置顶展示，未固定条目最多保留 5 条', () => {
    const store = useRecentInstancesStore()
    recordRange(store, 0, 7)

    expect(store.recentList.map((item) => item.versionId)).toEqual(['v6', 'v5', 'v4', 'v3', 'v2'])
    expect(store.recentList.every((item) => !item.pinned)).toBe(true)
  })

  it('固定条目排在最前，且不占用未固定条目的保留名额', () => {
    const store = useRecentInstancesStore()
    recordRange(store, 0, 5)
    expect(store.togglePin('v2', 'C:/games/path2')).toBe(true)
    expect(store.recentList.map((item) => item.versionId)).toEqual(['v2', 'v4', 'v3', 'v1', 'v0'])

    recordRange(store, 5, 2)
    expect(store.recentList.map((item) => item.versionId)).toEqual([
      'v2',
      'v6',
      'v5',
      'v4',
      'v3',
      'v1',
    ])
    expect(store.recentList.filter((item) => item.pinned)).toHaveLength(1)
  })

  it('已固定实例再次启动回到固定块顶部并保持固定', () => {
    const store = useRecentInstancesStore()
    recordRange(store, 0, 3)
    store.togglePin('v0', 'C:/games/path0')
    expect(store.recentList.map((item) => item.versionId)).toEqual(['v0', 'v2', 'v1'])

    store.recordLaunch('v0', '版本0', 'C:/games/path0')
    expect(store.recentList.map((item) => item.versionId)).toEqual(['v0', 'v2', 'v1'])
    expect(store.recentList[0]?.pinned).toBe(true)
  })

  it('固定数量达到上限后无法继续固定', () => {
    const store = useRecentInstancesStore()
    for (let batch = 0; batch < MAX_PINNED_ITEMS / 5; batch += 1) {
      recordRange(store, batch * 5, 5)
      for (let offset = 0; offset < 5; offset += 1) {
        expect(store.togglePin(`v${batch * 5 + offset}`, `C:/games/path${batch * 5 + offset}`)).toBe(true)
      }
    }
    expect(store.recentList).toHaveLength(MAX_PINNED_ITEMS)
    expect(store.recentList.every((item) => item.pinned)).toBe(true)

    recordRange(store, MAX_PINNED_ITEMS, 1)
    expect(store.togglePin(`v${MAX_PINNED_ITEMS}`, `C:/games/path${MAX_PINNED_ITEMS}`)).toBe(false)
    expect(store.recentList.filter((item) => item.pinned)).toHaveLength(MAX_PINNED_ITEMS)
    expect(store.recentList[store.recentList.length - 1]?.pinned).toBe(false)
  })

  it('取消固定回到未固定块顶部', () => {
    const store = useRecentInstancesStore()
    recordRange(store, 0, 3)
    store.togglePin('v0', 'C:/games/path0')
    store.togglePin('v2', 'C:/games/path2')
    expect(store.recentList.map((item) => item.versionId)).toEqual(['v2', 'v0', 'v1'])

    expect(store.togglePin('v2', 'C:/games/path2')).toBe(true)
    expect(store.recentList.map((item) => item.versionId)).toEqual(['v0', 'v2', 'v1'])
    expect(store.recentList.map((item) => item.pinned)).toEqual([true, false, false])
  })

  it('删除固定与未固定条目', () => {
    const store = useRecentInstancesStore()
    recordRange(store, 0, 3)
    store.togglePin('v1', 'C:/games/path1')

    store.removeRecent('v1', 'C:/games/path1')
    expect(store.recentList.map((item) => item.versionId)).toEqual(['v2', 'v0'])

    store.removeRecent('v2', 'C:/games/path2')
    expect(store.recentList.map((item) => item.versionId)).toEqual(['v0'])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(1)
  })

  it('删除不存在的条目不改变列表', () => {
    const store = useRecentInstancesStore()
    recordRange(store, 0, 2)
    store.removeRecent('v9', 'C:/games/path9')
    expect(store.recentList).toHaveLength(2)
  })

  it('重建 store 后固定状态与顺序持久化', () => {
    const store = useRecentInstancesStore()
    recordRange(store, 0, 3)
    store.togglePin('v1', 'C:/games/path1')

    setActivePinia(createPinia())
    const restored = useRecentInstancesStore()
    expect(restored.recentList.map((item) => item.versionId)).toEqual(['v1', 'v2', 'v0'])
    expect(restored.recentList.map((item) => item.pinned)).toEqual([true, false, false])
  })

  it('兼容无 pinned 字段的历史数据', () => {
    const legacy: RecentInstance[] = [
      { versionId: 'a', versionName: 'A', gamePath: 'C:/games/a', timestamp: 1 },
      { versionId: 'b', versionName: 'B', gamePath: 'C:/games/b', timestamp: 2 },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy))

    const store = useRecentInstancesStore()
    expect(store.recentList.map((item) => item.versionId)).toEqual(['a', 'b'])
    expect(store.recentList.every((item) => item.pinned === false)).toBe(true)
  })
})
