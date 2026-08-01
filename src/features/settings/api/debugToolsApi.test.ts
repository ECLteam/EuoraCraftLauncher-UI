import { beforeEach, describe, expect, it, vi } from 'vitest'
import backend from '@/api/client'
import { DISMISSED_POPUPS_STORAGE_KEY } from '@/app/runtime/useLauncherPopupQueue'
import { debugToolsApi } from './debugToolsApi'

vi.mock('@/api/client', () => ({
  default: {
    command: vi.fn(),
  },
}))

describe('debugToolsApi', () => {
  beforeEach(() => {
    vi.mocked(backend.command).mockReset()
  })

  it('成功安排还原启动器数据后清理弹窗阅读缓存', async () => {
    localStorage.setItem(DISMISSED_POPUPS_STORAGE_KEY, JSON.stringify(['cached-popup']))
    vi.mocked(backend.command).mockResolvedValue({
      success: true,
      data: {
        action: 'reset_launcher_data',
        restart_required: true,
        targets: ['setting.json'],
        backup_root: 'ECL_data/backups',
      },
    })

    await debugToolsApi.resetLauncherData()

    expect(localStorage.getItem(DISMISSED_POPUPS_STORAGE_KEY)).toBeNull()
  })

  it('安排还原失败时保留弹窗阅读缓存', async () => {
    localStorage.setItem(DISMISSED_POPUPS_STORAGE_KEY, JSON.stringify(['cached-popup']))
    vi.mocked(backend.command).mockResolvedValue({
      success: false,
      message: '安排失败',
    })

    await expect(debugToolsApi.resetLauncherData()).rejects.toThrow('安排失败')

    expect(localStorage.getItem(DISMISSED_POPUPS_STORAGE_KEY)).toContain('cached-popup')
  })
})
