import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pluginManagementApi } from '@/features/plugins/api/pluginManagementApi'
import { usePluginStore } from './pluginStore'

vi.mock('@/features/plugins/api/pluginManagementApi', () => ({
  pluginManagementApi: {
    list: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    reload: vi.fn(),
    unload: vi.fn(),
    installFromDirectory: vi.fn(),
    onStatusChanged: vi.fn(() => vi.fn()),
  },
}))

const plugin = {
  name: 'demo',
  title: 'Demo',
  version: '1.0.0',
  description: '',
  author: '',
  icon: '',
  status: 'enabled',
  error: null,
  dependencies: {},
  events: {},
  services: [],
  is_system: false,
}

describe('pluginStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(pluginManagementApi.list).mockResolvedValue([plugin])
  })

  it('按当前状态选择启用或禁用动作', async () => {
    const store = usePluginStore()
    await store.toggle(plugin)

    expect(pluginManagementApi.disable).toHaveBeenCalledWith('demo')
    expect(pluginManagementApi.list).toHaveBeenCalledOnce()
  })

  it('重载期间暴露插件级操作状态并在结束后清理', async () => {
    let finishReload: (() => void) | undefined
    vi.mocked(pluginManagementApi.reload).mockImplementation(
      () => new Promise<void>((resolve) => (finishReload = resolve))
    )
    const store = usePluginStore()
    const pending = store.reload('demo')

    expect(store.reloadingPlugins).toEqual(['demo'])
    finishReload?.()
    await pending
    expect(store.reloadingPlugins).toEqual([])
  })
})
