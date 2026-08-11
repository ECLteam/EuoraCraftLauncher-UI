import { ref } from 'vue'

const STORAGE_KEY = 'euoracraft_recent_instances'
const MAX_ITEMS = 5

export interface RecentInstance {
  versionId: string
  versionName: string
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
        typeof (item as RecentInstance).versionName === 'string'
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

const recentList = ref<RecentInstance[]>(loadFromStorage())

export function useRecentInstances() {
  function recordLaunch(versionId: string, versionName: string) {
    const filtered = recentList.value.filter((item) => item.versionId !== versionId)
    filtered.unshift({
      versionId,
      versionName,
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