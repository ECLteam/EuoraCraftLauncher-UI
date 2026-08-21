import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { globalCache } from './index'

describe('globalCache persistent cleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    globalCache.stopCleanup()
    globalCache.clear()
  })

  afterEach(() => {
    globalCache.clear()
    globalCache.stopCleanup()
    vi.useRealTimers()
  })

  it('一次清理所有相邻的过期持久化缓存', () => {
    globalCache.set('first', 'a', { persistent: true, ttl: 1 })
    globalCache.set('second', 'b', { persistent: true, ttl: 1 })
    globalCache.startCleanup(1)

    vi.advanceTimersByTime(2)

    expect(localStorage.getItem('euora-cache-first')).toBeNull()
    expect(localStorage.getItem('euora-cache-second')).toBeNull()
  })

  it('移除格式不合法的持久化缓存', () => {
    localStorage.setItem('euora-cache-malformed', '{"timestamp":"invalid"}')

    expect(globalCache.get('malformed')).toBeNull()
    expect(localStorage.getItem('euora-cache-malformed')).toBeNull()
  })
})
