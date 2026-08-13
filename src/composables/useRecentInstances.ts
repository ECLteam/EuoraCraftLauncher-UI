import { ref } from 'vue'

const STORAGE_KEY = 'euoracraft_recent_instances'
const MAX_ITEMS = 5

export interface RecentInstance {
  versionId: string
  versionName: string
  gamePath: string
  timestamp: number
}

function loadFromStorage(): RecentInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item: unknown) =>
        item &&
        typeof item === 'object' &&
        typeof (item as RecentInstance).versionId === 'string' &&
        typeof (item as RecentInstance).versionName === 'string' &&
        typeof (item as RecentInstance).gamePath === 'string'
    )
  } catch {
    return []
  }
}

function saveToStorage(list: RecentInstance[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // 忽略存储失败
  }
}

/** 从完整路径中提取最后一段作为可读的路径名 */
export function getPathDisplayName(gamePath: string): string {
  const parts = gamePath.replace(/[\\/]+$/, '').split(/[\\/]/)
  return parts[parts.length - 1] || gamePath
}

const recentList = ref<RecentInstance[]>(loadFromStorage())

export function useRecentInstances() {
  function recordLaunch(versionId: string, versionName: string, gamePath: string) {
    // 用 (versionId, gamePath) 作为唯一键，不同路径的同名版本算不同条目
    const filtered = recentList.value.filter((item) => !(item.versionId === versionId && item.gamePath === gamePath))
    filtered.unshift({
      versionId,
      versionName,
      gamePath,
      timestamp: Date.now(),
    })
    recentList.value = filtered.slice(0, MAX_ITEMS)
    saveToStorage(recentList.value)
  }

  function getRecentInstances(): RecentInstance[] {
    return recentList.value
  }

  return {
    recentList,
    recordLaunch,
    getRecentInstances,
  }
}
