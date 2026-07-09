// 提供响应式缓存管理，方便Vue组件使用

import { ref, onScopeDispose, type Ref } from 'vue'
import { globalCache, type CacheOptions, CACHE_KEYS, CACHE_GROUPS } from '@/cache'

/**
 * 缓存钩子返回值接口
 */
interface CacheHookReturn<T> {
  /** 缓存数据（响应式） */
  data: Ref<T | null>
  /** 是否正在加载 */
  loading: Ref<boolean>
  /** 是否有错误 */
  error: Ref<boolean>
  /** 设置缓存 */
  setCache: (value: T, options?: CacheOptions) => void
  /** 删除缓存 */
  deleteCache: () => void
  /** 刷新缓存（删除并重新加载） */
  refresh: () => void
  /** 缓存是否有效（存在且未过期） */
  isValid: Ref<boolean>
}

/**
 * 使用全局缓存
 */
export function useGlobalCache<T = any>(
  key: string,
  defaultValue: T | null = null,
  options: CacheOptions = {}
): CacheHookReturn<T> {
  const data = ref<T | null>(defaultValue) as Ref<T | null>
  const loading = ref(false)
  const error = ref(false)
  const isValid = ref(false)

  // 初始化时加载缓存
  const loadFromCache = () => {
    try {
      const cached = globalCache.get<T>(key)
      if (cached !== null) {
        data.value = cached
        isValid.value = true
        error.value = false
      } else {
        data.value = defaultValue
        isValid.value = false
      }
    } catch (e) {
      console.error(`加载缓存失败 [${key}]:`, e)
      error.value = true
      data.value = defaultValue
      isValid.value = false
    }
  }

  // 设置缓存
  const setCache = (value: T, setOptions: CacheOptions = {}) => {
    try {
      const mergedOptions = { ...options, ...setOptions }
      globalCache.set(key, value, mergedOptions)
      data.value = value
      isValid.value = true
      error.value = false
    } catch (e) {
      console.error(`设置缓存失败 [${key}]:`, e)
      error.value = true
    }
  }

  // 删除缓存
  const deleteCache = () => {
    try {
      globalCache.delete(key)
      data.value = defaultValue
      isValid.value = false
      error.value = false
    } catch (e) {
      console.error(`删除缓存失败 [${key}]:`, e)
      error.value = true
    }
  }

  // 刷新缓存
  const refresh = () => {
    deleteCache()
    loadFromCache()
  }

  // 注意：globalCache 基于 Map，非响应式，无法通过 watch 监听其变化。
  // 跨组件缓存同步需依赖 setCache/deleteCache 方法手动更新 data ref。

  // 初始化加载
  loadFromCache()

  return {
    data,
    loading,
    error,
    setCache,
    deleteCache,
    refresh,
    isValid
  }
}

/**
 * 使用带自动刷新的缓存
 */
export function useAutoRefreshCache<T = any>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions & { autoRefresh?: boolean } = {}
) {
  const { autoRefresh = true, ...cacheOptions } = options
  const cache = useGlobalCache<T>(key, null, cacheOptions)
  const { data, loading, error, setCache, isValid } = cache

  // 自动获取数据
  const fetchData = async (forceRefresh = false): Promise<T | null> => {
    if (!forceRefresh && isValid.value) {
      return data.value
    }

    loading.value = true
    error.value = false

    try {
      const result = await fetchFn()
      setCache(result, cacheOptions)
      return result
    } catch (e) {
      console.error(`获取数据失败 [${key}]:`, e)
      error.value = true
      return null
    } finally {
      loading.value = false
    }
  }

  // 自动刷新逻辑
  let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

  if (autoRefresh && cacheOptions.ttl) {
    const refreshInterval = Math.min(cacheOptions.ttl, 5 * 60 * 1000) // 最多5分钟刷新一次

    autoRefreshTimer = setInterval(() => {
      if (isValid.value) {
        fetchData(true).catch(console.error)
      }
    }, refreshInterval)
  }

  const stopAutoRefresh = () => {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer)
      autoRefreshTimer = null
    }
  }

  // 组件作用域销毁时自动清理定时器
  onScopeDispose(() => stopAutoRefresh())

  return {
    data: cache.data,
    loading: cache.loading,
    error: cache.error,
    setCache: cache.setCache,
    deleteCache: cache.deleteCache,
    refresh: cache.refresh,
    isValid: cache.isValid,
    fetchData,
    stopAutoRefresh
  }
}

/**
 * 缓存工具函数
 */
export const cacheUtils = {
  /** 清空所有缓存 */
  clearAll: () => globalCache.clear(),
  
  /** 清空指定分组缓存 */
  clearGroup: (group: string) => globalCache.clearGroup(group),
  
  /** 获取缓存统计 */
  getStats: () => globalCache.getStats(),
  
  /** 检查缓存是否存在 */
  has: (key: string) => globalCache.has(key),
  
  /** 批量设置缓存 */
  batchSet: <T>(items: Array<{ key: string; value: T; options?: CacheOptions }>) => {
    items.forEach(({ key, value, options }) => {
      globalCache.set(key, value, options)
    })
  },
  
  /** 批量获取缓存 */
  batchGet: <T>(keys: string[]): Record<string, T | null> => {
    const result: Record<string, T | null> = {}
    keys.forEach(key => {
      result[key] = globalCache.get<T>(key)
    })
    return result
  }
}

// 导出常量
export { CACHE_KEYS, CACHE_GROUPS }