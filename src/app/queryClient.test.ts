import { describe, expect, it, vi } from 'vitest'
import { createQueryClient } from './queryClient'

describe('queryClient', () => {
  it('为 IPC 请求配置不自动重试和显式缓存策略', () => {
    const client = createQueryClient()
    const defaults = client.getDefaultOptions().queries!

    expect(defaults.retry).toBe(false)
    expect(defaults.staleTime).toBe(60_000)
    expect(defaults.gcTime).toBe(30 * 60_000)
    expect(defaults.refetchOnWindowFocus).toBe(false)
    expect(defaults.refetchOnReconnect).toBe(false)
    client.clear()
  })

  it('对相同 query key 的并发请求去重，并在失效后重新读取', async () => {
    const client = createQueryClient()
    const queryFn = vi.fn().mockResolvedValueOnce('first').mockResolvedValueOnce('second')
    const options = { queryKey: ['test', 'versions'], queryFn }

    const [first, second] = await Promise.all([client.fetchQuery(options), client.fetchQuery(options)])
    expect(first).toBe('first')
    expect(second).toBe('first')
    expect(queryFn).toHaveBeenCalledTimes(1)

    await client.invalidateQueries({ queryKey: options.queryKey })
    expect(await client.fetchQuery(options)).toBe('second')
    expect(queryFn).toHaveBeenCalledTimes(2)
    client.clear()
  })
})
