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

describe('instanceInstallApi scan cache', () => {
  beforeEach(() => {
    mocks.command.mockReset()
    instanceInstallApi.invalidateScanCache()
  })

  it('复用扫描结果，并在强制刷新或后端变更事件后重新请求', async () => {
    mocks.command.mockResolvedValue({
      success: true,
      data: [{ versionId: '1.21.1', path: 'D:\\Minecraft' }],
    })
    const changed = vi.fn()
    const stop = instanceInstallApi.onVersionsChanged(changed)

    await instanceInstallApi.scan(['D:\\Minecraft'])
    await instanceInstallApi.scan(['D:\\Minecraft'])
    expect(mocks.command).toHaveBeenCalledTimes(1)

    await instanceInstallApi.scan(['D:\\Minecraft'], { force: true })
    expect(mocks.command).toHaveBeenCalledTimes(2)
    expect(mocks.command).toHaveBeenLastCalledWith('game_scan', {
      paths: ['D:\\Minecraft'],
      force: true,
    })

    mocks.handlers['game:versions_changed']?.({ gamePath: 'D:/Minecraft' })
    expect(changed).toHaveBeenCalledWith({ gamePath: 'D:/Minecraft' })
    await instanceInstallApi.scan(['D:\\Minecraft'])
    expect(mocks.command).toHaveBeenCalledTimes(3)

    stop()
  })
})
