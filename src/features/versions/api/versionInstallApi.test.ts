import { beforeEach, describe, expect, it, vi } from 'vitest'
import { versionInstallApi } from './versionInstallApi'

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

describe('versionInstallApi scan cache', () => {
  beforeEach(() => {
    backendMocks.command.mockReset()
    versionInstallApi.invalidateScanCache()
  })

  it('复用扫描结果，并在强制刷新或后端变更事件后重新请求', async () => {
    backendMocks.command.mockResolvedValue({
      success: true,
      data: [{ versionId: '1.21.1', path: 'D:\\Minecraft' }],
    })
    const changed = vi.fn()
    const stop = versionInstallApi.onVersionsChanged(changed)

    await versionInstallApi.scan(['D:\\Minecraft'])
    await versionInstallApi.scan(['D:\\Minecraft'])
    expect(backendMocks.command).toHaveBeenCalledTimes(1)

    await versionInstallApi.scan(['D:\\Minecraft'], { force: true })
    expect(backendMocks.command).toHaveBeenCalledTimes(2)
    expect(backendMocks.command).toHaveBeenLastCalledWith('scan_versions', {
      path: ['D:\\Minecraft'],
      force: true,
    })

    backendMocks.versionChangedHandler?.({ gamePath: 'D:/Minecraft' })
    expect(changed).toHaveBeenCalledWith({ gamePath: 'D:/Minecraft' })
    await versionInstallApi.scan(['D:\\Minecraft'])
    expect(backendMocks.command).toHaveBeenCalledTimes(3)

    stop()
  })
})
