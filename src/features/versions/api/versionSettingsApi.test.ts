import { beforeEach, describe, expect, it, vi } from 'vitest'
import { versionSettingsApi } from './versionSettingsApi'

const backendMocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  command: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  default: {
    config: {
      get: backendMocks.get,
      set: backendMocks.set,
    },
    command: backendMocks.command,
  },
}))

describe('versionSettingsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    backendMocks.get.mockResolvedValue({ success: true, data: {} })
    backendMocks.set.mockResolvedValue({ success: true })
  })

  it('按游戏路径和版本 ID 保存独立设置', async () => {
    await versionSettingsApi.save(
      { versionId: '1.21.5', path: 'D:\\Games\\.minecraft' },
      {
        isolated: true,
        customMemory: true,
        memory: 6144,
        customJava: false,
        javaPath: '',
        jvmArgs: '-XX:+UseG1GC',
        gameArgs: '',
      }
    )

    expect(backendMocks.set).toHaveBeenCalledWith('version_settings', {
      'd:/games/.minecraft::1.21.5': expect.objectContaining({
        isolated: true,
        memory: 6144,
      }),
    })
  })

  it('读取不存在的版本设置时返回默认值', async () => {
    const result = await versionSettingsApi.get({ versionId: '1.20.1', path: 'Showcase/.minecraft' })

    expect(result).toMatchObject({
      isolated: false,
      customMemory: false,
      memory: 4096,
      customJava: false,
    })
  })
})
