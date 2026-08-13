import { beforeEach, describe, expect, it, vi } from 'vitest'
import { instancePathConfigApi } from './instancePathConfigApi'

const mocks = vi.hoisted(() => ({ command: vi.fn() }))

vi.mock('@/api/client', () => ({ default: { command: mocks.command } }))

describe('instancePathConfigApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.command.mockResolvedValue({ success: true, data: { activeVersion: '26.2-Forge' } })
  })

  it('coalesces duplicate active version writes for the same normalized path', async () => {
    let resolveWrite: ((value: unknown) => void) | undefined
    mocks.command.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveWrite = resolve
        })
    )

    const first = instancePathConfigApi.setActiveVersion('D:\\mc\\HMCL\\.minecraft', '26.2-Forge')
    const second = instancePathConfigApi.setActiveVersion('d:/mc/HMCL/.minecraft/', '26.2-Forge')
    await Promise.resolve()

    expect(mocks.command).toHaveBeenCalledTimes(1)
    resolveWrite?.({ success: true, data: { activeVersion: '26.2-Forge' } })
    await Promise.all([first, second])
  })

  it('skips a write when the backend read already confirmed the same version', async () => {
    await instancePathConfigApi.getActiveVersion('D:/mc/Other/.minecraft')
    await instancePathConfigApi.setActiveVersion('D:/mc/Other/.minecraft', '26.2-Forge')

    expect(mocks.command).toHaveBeenCalledTimes(1)
    expect(mocks.command).toHaveBeenCalledWith('game_config_get', { game_path: 'D:/mc/Other/.minecraft' })
  })
})
