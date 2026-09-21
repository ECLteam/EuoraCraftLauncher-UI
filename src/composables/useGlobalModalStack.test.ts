import { describe, expect, it, vi } from 'vitest'
import { createGlobalModalStack, GLOBAL_MODAL_PRIORITY } from './useGlobalModalStack'

describe('useGlobalModalStack', () => {
  it('仅激活优先级最高的模态框，关闭后恢复等待项', () => {
    const stack = createGlobalModalStack()

    stack.register({ id: 'startup-update', title: '发现更新', priority: GLOBAL_MODAL_PRIORITY.automaticUpdate })
    stack.register({
      id: 'curseforge-key',
      title: 'CurseForge API Key 未配置',
      priority: GLOBAL_MODAL_PRIORITY.launcherWarning,
    })

    expect(stack.activeModalId.value).toBe('curseforge-key')

    stack.unregister('curseforge-key')

    expect(stack.activeModalId.value).toBe('startup-update')
  })

  it('启动器弹窗的关闭过渡会阻止低优先级更新提示抢占', () => {
    const stack = createGlobalModalStack()

    stack.register({ id: 'startup-update', title: '发现更新', priority: GLOBAL_MODAL_PRIORITY.automaticUpdate })
    stack.addBlocker('launcher-popup-leave', GLOBAL_MODAL_PRIORITY.launcherWarning)

    expect(stack.activeModalId.value).toBeNull()

    stack.unregister('launcher-popup-leave')

    expect(stack.activeModalId.value).toBe('startup-update')
  })

  it('严重错误可抢占其他类型，关闭后恢复原有全屏模态框', () => {
    const stack = createGlobalModalStack()
    const closeError = vi.fn()

    stack.register({ id: 'instance-detail', title: '实例详情', isFullscreen: true })
    stack.register({
      id: 'fatal-error',
      title: '启动器错误',
      priority: GLOBAL_MODAL_PRIORITY.error,
      onRequestClose: closeError,
    })

    expect(stack.activeModalId.value).toBe('fatal-error')
    expect(stack.isFullscreenActive.value).toBe(false)

    stack.closeActive()

    expect(closeError).toHaveBeenCalledOnce()
    expect(stack.activeModalId.value).toBe('instance-detail')
    expect(stack.isFullscreenActive.value).toBe(true)
  })
})
