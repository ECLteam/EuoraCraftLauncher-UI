import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BackendMockState } from '@/test/mockBackend'
import { instanceInstallApi } from './instanceInstallApi'

const mock = vi.hoisted<{ state?: BackendMockState }>(() => ({ state: undefined }))
vi.mock('@/api/client', async () => {
  const { createMockBackend } = await import('@/test/mockBackend')
  mock.state = createMockBackend()
  return mock.state.backend
})

const { mocks } = mock.state!

describe('instanceInstallApi validation', () => {
  beforeEach(() => {
    mocks.command.mockReset()
    instanceInstallApi.invalidateScanCache()
  })

  it('loader 版本参数缺失时校验失败，不发起 IPC', async () => {
    mocks.command.mockResolvedValue({ success: true, data: [] })
    await expect(instanceInstallApi.getLoaderVersions('fabric', '')).rejects.toThrow(/游戏版本不能为空/)
    expect(mocks.command).not.toHaveBeenCalled()
  })

  it('安装参数缺少游戏路径时校验失败，不发起 IPC', async () => {
    mocks.command.mockResolvedValue({ success: true, data: {} })
    await expect(
      instanceInstallApi.install({ version_id: '1.21.1', game_path: '' })
    ).rejects.toThrow(/游戏路径不能为空/)
    expect(mocks.command).not.toHaveBeenCalled()
  })

  it('卸载参数缺失时校验失败，不发起 IPC', async () => {
    mocks.command.mockResolvedValue({ success: true })
    await expect(instanceInstallApi.uninstall('', 'D:/Minecraft')).rejects.toThrow(/版本 ID 不能为空/)
    expect(mocks.command).not.toHaveBeenCalled()
  })
})
