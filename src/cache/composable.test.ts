import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useAutoRefreshCache } from './composable'
import { globalCache } from './index'

describe('useAutoRefreshCache 启动预取', () => {
  afterEach(() => globalCache.clear())

  it('组件创建后才写入的共享缓存仍能在首次加载时命中，手动刷新重新请求', async () => {
    const fetch = vi.fn().mockResolvedValue('network')
    const scope = effectScope()
    const cache = scope.run(() => useAutoRefreshCache('prefetch-race', fetch, { autoRefresh: false }))!
    try {
      globalCache.set('prefetch-race', 'warm')
      expect(await cache.fetchData()).toBe('warm')
      expect(cache.data.value).toBe('warm')
      expect(fetch).not.toHaveBeenCalled()
      expect(await cache.fetchData(true)).toBe('network')
      expect(fetch).toHaveBeenCalledTimes(1)
    } finally {
      scope.stop()
    }
  })
})
