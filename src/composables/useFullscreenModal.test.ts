import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFullscreenModal } from './useFullscreenModal'

describe('useFullscreenModal', () => {
  beforeEach(() => {
    useFullscreenModal().reset()
  })

  it('打开新弹窗时关闭旧弹窗且只保留新弹窗', () => {
    const accountClose = vi.fn()
    const taskClose = vi.fn()
    const modal = useFullscreenModal()

    modal.open('account', '账户管理', accountClose)
    modal.open('tasks', '任务列表', taskClose)

    expect(accountClose).toHaveBeenCalledOnce()
    expect(modal.isVisible.value).toBe(true)
    expect(modal.currentId.value).toBe('tasks')
    expect(modal.title.value).toBe('任务列表')

    modal.unregister('account')
    expect(modal.currentId.value).toBe('tasks')

    modal.close()
    expect(taskClose).toHaveBeenCalledOnce()
    expect(modal.isVisible.value).toBe(false)
  })

  it('重复登记同一个弹窗时只更新内容', () => {
    const firstClose = vi.fn()
    const nextClose = vi.fn()
    const modal = useFullscreenModal()

    modal.open('account', '账户管理', firstClose)
    modal.open('account', '账户', nextClose)

    expect(firstClose).not.toHaveBeenCalled()
    expect(modal.title.value).toBe('账户')

    modal.close()
    expect(nextClose).toHaveBeenCalledOnce()
  })
})
