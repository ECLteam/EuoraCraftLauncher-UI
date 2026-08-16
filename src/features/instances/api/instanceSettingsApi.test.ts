import { beforeEach, describe, expect, it, vi } from 'vitest'
import { instanceSettingsApi } from './instanceSettingsApi'

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

describe('instanceSettingsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    backendMocks.get.mockResolvedValue({ success: true, data: {} })
    backendMocks.set.mockResolvedValue({ success: true })
    backendMocks.command.mockResolvedValue({ success: true, data: {} })
  })

  it('将独立设置保存到版本自己的设置文件', async () => {
    await instanceSettingsApi.save(
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

    expect(backendMocks.command).toHaveBeenCalledWith('game_version_settings_set', {
      game_path: 'D:\\Games\\.minecraft',
      version_id: '1.21.5',
      data: expect.objectContaining({
        isolated: true,
        memory: 6144,
        jvmArgs: '-XX:+UseG1GC',
      }),
    })
  })

  it('从版本自己的设置文件读取该版本独立设置', async () => {
    backendMocks.command.mockResolvedValue({
      success: true,
      data: {
        isolated: true,
        customMemory: true,
        memory: 6144,
        customJava: false,
        javaPath: '',
        jvmArgs: '',
        gameArgs: '',
      },
    })

    const result = await instanceSettingsApi.get({ versionId: '1.21.5', path: 'D:\\Games\\.minecraft' })

    expect(backendMocks.command).toHaveBeenCalledWith('game_version_settings_get', {
      game_path: 'D:\\Games\\.minecraft',
      version_id: '1.21.5',
    })
    expect(result).toMatchObject({ isolated: true, customMemory: true, memory: 6144 })
  })

  it('版本设置文件为空时回退读取旧版 setting.json 配置', async () => {
    backendMocks.get.mockResolvedValue({
      success: true,
      data: {
        'd:/games/.minecraft::1.20.1': {
          isolated: true,
          customMemory: false,
          memory: 8192,
          customJava: false,
          javaPath: '',
          jvmArgs: '',
          gameArgs: '',
        },
      },
    })

    const result = await instanceSettingsApi.get({ versionId: '1.20.1', path: 'D:\\Games\\.minecraft' })

    expect(result).toMatchObject({ isolated: true, memory: 8192 })
  })

  it('读取不存在的版本设置时返回默认值', async () => {
    const result = await instanceSettingsApi.get({ versionId: '1.20.1', path: 'Showcase/.minecraft' })

    expect(result).toMatchObject({
      isolated: false,
      customMemory: false,
      memory: 4096,
      customJava: false,
    })
  })

  it('保存后清除 setting.json 中的旧版该版本配置', async () => {
    backendMocks.get.mockResolvedValue({
      success: true,
      data: {
        'd:/games/.minecraft::1.20.1': {
          isolated: false,
          customMemory: false,
          memory: 4096,
          customJava: false,
          javaPath: '',
          jvmArgs: '',
          gameArgs: '',
        },
      },
    })

    await instanceSettingsApi.save(
      { versionId: '1.20.1', path: 'D:\\Games\\.minecraft' },
      {
        isolated: true,
        customMemory: true,
        memory: 8192,
        customJava: false,
        javaPath: '',
        jvmArgs: '',
        gameArgs: '',
      }
    )

    expect(backendMocks.set).toHaveBeenCalledWith('version_settings', {})
  })
})
