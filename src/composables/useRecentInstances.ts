import { defineStore, storeToRefs } from 'pinia'
import { ref } from 'vue'
import { pinia } from '@/app/stores'

const STORAGE_KEY = 'euoracraft_recent_instances'
/** 未固定条目的保留数量，超出后按启动时间淘汰 */
const MAX_RECENT_ITEMS = 5
/** 最多固定条目数 */
export const MAX_PINNED_ITEMS = 10

export interface RecentInstance {
  versionId: string
  versionName: string
  gamePath: string
  timestamp: number
  /** 固定条目不受未固定上限淘汰，始终排在列表最前 */
  pinned?: boolean
}

function loadFromStorage(): RecentInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    const items = parsed
      .filter(
        (item: unknown) =>
          item &&
          typeof item === 'object' &&
          typeof (item as RecentInstance).versionId === 'string' &&
          typeof (item as RecentInstance).versionName === 'string' &&
          typeof (item as RecentInstance).gamePath === 'string'
      )
      .map((item: RecentInstance) => ({ ...item, pinned: item.pinned === true }))
    // 固定块始终排在最前（保持相对顺序），兼容历史数据与手工改动
    return [...items.filter((item) => item.pinned), ...items.filter((item) => !item.pinned)]
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

function indexOfItem(list: RecentInstance[], versionId: string, gamePath: string): number {
  return list.findIndex((item) => item.versionId === versionId && item.gamePath === gamePath)
}

/** 从完整路径中提取最后一段作为可读的路径名 */
export function getPathDisplayName(gamePath: string): string {
  const parts = gamePath.replace(/[\\/]+$/, '').split(/[\\/]/)
  return parts[parts.length - 1] || gamePath
}

/**
 * 最近启动实例全局状态（Pinia）。
 * 由 useRecentInstances() 包装暴露，保持原有 ref 语义（recentList.value 等）。
 * 列表顺序约定：固定块在前（新固定者更靠前），未固定块按启动时间倒序。
 */
export const useRecentInstancesStore = defineStore('recentInstances', () => {
  const recentList = ref<RecentInstance[]>(loadFromStorage())

  function recordLaunch(versionId: string, versionName: string, gamePath: string) {
    // 用 (versionId, gamePath) 作为唯一键，不同路径的同名版本算不同条目
    const existing = recentList.value.find((item) => item.versionId === versionId && item.gamePath === gamePath)
    const entry: RecentInstance = {
      versionId,
      versionName,
      gamePath,
      timestamp: Date.now(),
      pinned: existing?.pinned === true,
    }
    const rest = recentList.value.filter((item) => !(item.versionId === versionId && item.gamePath === gamePath))
    if (entry.pinned) {
      // 已固定的实例再次启动：回到固定块顶部
      recentList.value = [entry, ...rest]
    } else {
      const pinned = rest.filter((item) => item.pinned)
      const unpinned = rest.filter((item) => !item.pinned).slice(0, MAX_RECENT_ITEMS - 1)
      recentList.value = [...pinned, entry, ...unpinned]
    }
    saveToStorage(recentList.value)
  }

  /** 固定 / 取消固定；固定数达到上限时返回 false */
  function togglePin(versionId: string, gamePath: string): boolean {
    const index = indexOfItem(recentList.value, versionId, gamePath)
    if (index === -1) return false
    const list = [...recentList.value]
    const [entry] = list.splice(index, 1)
    // index 已校验非 -1，splice 必返回元素，此处仅为收窄类型
    if (!entry) return false
    const pinnedCount = list.filter((item) => item.pinned).length
    if (entry.pinned) {
      entry.pinned = false
      // 回到未固定块顶部
      list.splice(pinnedCount, 0, entry)
    } else {
      if (pinnedCount >= MAX_PINNED_ITEMS) return false
      entry.pinned = true
      list.unshift(entry)
    }
    recentList.value = list
    saveToStorage(list)
    return true
  }

  function removeRecent(versionId: string, gamePath: string) {
    const next = recentList.value.filter((item) => !(item.versionId === versionId && item.gamePath === gamePath))
    if (next.length === recentList.value.length) return
    recentList.value = next
    saveToStorage(next)
  }

  function getRecentInstances(): RecentInstance[] {
    return recentList.value
  }

  return {
    recentList,
    recordLaunch,
    togglePin,
    removeRecent,
    getRecentInstances,
  }
})

/** 最近启动实例组合式 API（保持原有返回形状） */
export function useRecentInstances() {
  const store = useRecentInstancesStore(pinia)
  const { recentList } = storeToRefs(store)
  return {
    recentList,
    recordLaunch: store.recordLaunch,
    togglePin: store.togglePin,
    removeRecent: store.removeRecent,
    getRecentInstances: store.getRecentInstances,
  }
}
