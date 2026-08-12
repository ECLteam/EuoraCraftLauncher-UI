import { beforeEach, describe, expect, it, vi } from 'vitest'
import { instanceInstallApi } from './instanceInstallApi'

const backendMocks = vi.hoisted(() => ({
  command: vi.fn(),
  on: vi.fn(),
  versionChangedHandler: undefined as ((payload: { gamePath: string }) => void) | undefined,
}))

vi.mock('@/api/client', () => ({
  default: {
    command: backendMocks.command,
    on: (event: string, handler: (payload: { gamePath: string }) => void) => {
      backendMocks.on(event, handler)
      backendMocks.versionChangedHandler = handler
      return () => undefined
    },
  },
}))

describe('instanceInstallApi scan cache', () => {
  beforeEach(() => {
    backendMocks.command.mockReset()
    instanceInstallApi.invalidateScanCache()
  })

  it('复用扫描结果，并在强制刷新或后端变更事件后重新请求', async () => {
    backendMocks.command.mockResolvedValue({
      success: true,
      data: [{ versionId: '1.21.1', path: 'D:\\Minecraft' }],
    })
    const changed = vi.fn()
    const stop = instanceInstallApi.onVersionsChanged(changed)

    await instanceInstallApi.scan(['D:\\Minecraft'])
    await instanceInstallApi.scan(['D:\\Minecraft'])
    expect(backendMocks.command).toHaveBeenCalledTimes(1)

    await instanceInstallApi.scan(['D:\\Minecraft'], { force: true })
    expect(backendMocks.command).toHaveBeenCalledTimes(2)
    expect(backendMocks.command).toHaveBeenLastCalledWith('game_scan', {
      paths: ['D:\\Minecraft'],
      force: true,
    })

    backendMocks.versionChangedHandler?.({ gamePath: 'D:/Minecraft' })
    expect(changed).toHaveBeenCalledWith({ gamePath: 'D:/Minecraft' })
    await instanceInstallApi.scan(['D:\\Minecraft'])
    expect(backendMocks.command).toHaveBeenCalledTimes(3)

    stop()
  })
})
