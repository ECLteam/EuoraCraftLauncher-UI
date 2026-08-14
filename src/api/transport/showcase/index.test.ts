import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import type { ApiResponse } from '@/types/api'
import { SHOWCASE_CONFIG_STORAGE_KEY } from './configPersistence'
import { createShowcaseTransport } from '.'

describe('ShowcaseTransport', () => {
  beforeEach(() => {
    localStorage.removeItem(SHOWCASE_CONFIG_STORAGE_KEY)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('配置写入后可从当前 transport 读取', async () => {
    const transport = createShowcaseTransport()
    const nextUi = { locale: 'en-US', theme: { navigation_mode: 'sidebar' } }

    await transport.invoke('settings_set', { section: 'ui', data: nextUi })
    const result = (await transport.invoke('settings_get', { section: 'ui' })) as ApiResponse<typeof nextUi>

    expect(result.success).toBe(true)
    expect(result.data).toEqual(nextUi)
  })

  it('配置写入可在新的 transport 实例中恢复', async () => {
    const first = createShowcaseTransport()
    const nextGame = { memory_auto: false, memory_size: 6144 }

    await first.invoke('settings_set', { section: 'game', data: nextGame })

    const second = createShowcaseTransport()
    const result = (await second.invoke('settings_get', { section: 'game' })) as ApiResponse<typeof nextGame>

    expect(result.data).toMatchObject(nextGame)
  })

  it('持久化配置会与新增加的默认字段合并', async () => {
    localStorage.setItem(
      SHOWCASE_CONFIG_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        config: {
          ui: { locale: 'en-US' },
        },
      })
    )

    const transport = createShowcaseTransport()
    const result = (await transport.invoke('settings_get', { section: 'ui' })) as ApiResponse<{
      locale: string
      theme: Record<string, unknown>
    }>

    expect(result.data?.locale).toBe('en-US')
    expect(result.data?.theme).toMatchObject({
      sidebar_collapsed: true,
      background_opacity: 1,
    })
    expect(result.data).toMatchObject({
      background: { opacity: 1 },
    })
  })

  it('损坏的浏览器配置不会阻止展示模式启动', async () => {
    localStorage.setItem(SHOWCASE_CONFIG_STORAGE_KEY, '{invalid')

    const transport = createShowcaseTransport()
    const result = (await transport.invoke('settings_get', { section: 'ui' })) as ApiResponse<{
      locale: string
    }>

    expect(result.data?.locale).toBe('zh-CN')
  })

  it('可写入包含嵌套 Vue Proxy 的设置对象', async () => {
    const transport = createShowcaseTransport()
    const nextUi = reactive({
      locale: 'zh-CN',
      theme: { navigation_mode: 'sidebar' },
      background: { type: 'custom', path: 'Showcase/background.png' },
    })

    await expect(transport.invoke('settings_set', { section: 'ui', data: nextUi })).resolves.toMatchObject({
      success: true,
    })
    const result = (await transport.invoke('settings_get', { section: 'ui' })) as ApiResponse<typeof nextUi>

    expect(result.data).toEqual({
      locale: 'zh-CN',
      theme: { navigation_mode: 'sidebar' },
      background: { type: 'custom', path: 'Showcase/background.png' },
    })
  })

  it('不同 transport 实例之间不会共享展示数据', async () => {
    const first = createShowcaseTransport()
    const second = createShowcaseTransport()

    await first.invoke('accounts_add_offline', { username: 'OnlyInFirst' })
    const firstAccounts = (await first.invoke('accounts_list', {})) as ApiResponse<{ accounts: unknown[] }>
    const secondAccounts = (await second.invoke('accounts_list', {})) as ApiResponse<{ accounts: unknown[] }>

    expect(firstAccounts.data?.accounts).toHaveLength((secondAccounts.data?.accounts.length ?? 0) + 1)
  })

  it('展示模式添加离线账户时保留自定义 UUID', async () => {
    const transport = createShowcaseTransport()

    const result = (await transport.invoke('accounts_add_offline', {
      username: 'CustomPlayer',
      uuid: '01234567-89ab-cdef-0123-456789abcdef',
    })) as ApiResponse<{ uuid: string }>

    expect(result.data?.uuid).toBe('01234567-89ab-cdef-0123-456789abcdef')
  })

  it.each(['fabric', 'forge', 'neoforge', 'quilt'])('为 %s 安装流程提供可用加载器版本', async (loader) => {
    const transport = createShowcaseTransport()
    const result = (await transport.invoke('game_loader_versions', {
      loader,
      game_version: '1.21.8',
    })) as ApiResponse<string[]>

    expect(result.success).toBe(true)
    expect(result.data?.length).toBeGreaterThan(0)
  })

  it('supports the idle to starting to host showcase flow and room cleanup', async () => {
    vi.useFakeTimers()
    const transport = createShowcaseTransport()

    const hostRequest = transport.invoke('connector_host_instance', {
      game_path: 'Showcase/.minecraft',
      version_id: 'Showcase-1.21.5-Fabric',
    })
    await vi.advanceTimersByTimeAsync(100)
    await hostRequest

    const startingRequest = transport.invoke('connector_status', {})
    await vi.advanceTimersByTimeAsync(100)
    await expect(startingRequest).resolves.toMatchObject({ data: { mode: 'starting' } })

    await vi.advanceTimersByTimeAsync(900)
    const hostedRequest = transport.invoke('connector_status', {})
    await vi.advanceTimersByTimeAsync(100)
    await expect(hostedRequest).resolves.toMatchObject({ data: { mode: 'host', roomCode: expect.any(String) } })

    const leaveRequest = transport.invoke('connector_leave', {})
    await vi.advanceTimersByTimeAsync(100)
    await leaveRequest
    const idleRequest = transport.invoke('connector_status', {})
    await vi.advanceTimersByTimeAsync(100)
    await expect(idleRequest).resolves.toMatchObject({ data: { mode: 'idle' } })
  })

  it('keeps joined-room state isolated between showcase transports', async () => {
    const first = createShowcaseTransport()
    const second = createShowcaseTransport()

    await first.invoke('connector_join', { code: 'U/ONLY-FIRST' })
    const firstStatus = (await first.invoke('connector_status', {})) as ApiResponse<{ mode: string }>
    const secondStatus = (await second.invoke('connector_status', {})) as ApiResponse<{ mode: string }>

    expect(firstStatus.data?.mode).toBe('guest')
    expect(secondStatus.data?.mode).toBe('idle')
  })
})
