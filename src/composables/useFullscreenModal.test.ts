import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFullscreenModal } from './useFullscreenModal'

describe('useFullscreenModal', () => {
  beforeEach(() => {
    useFullscreenModal().reset()
  })

  it('关闭子弹窗后恢复父弹窗而不丢失其状态', () => {
    const detailClose = vi.fn()
    const schematicClose = vi.fn()
    const modal = useFullscreenModal()

    modal.open('detail', '实例设置', detailClose)
    modal.open('schematic', '原理图预览', schematicClose)

    expect(detailClose).not.toHaveBeenCalled()
    expect(modal.isVisible.value).toBe(true)
    expect(modal.currentId.value).toBe('schematic')
    expect(modal.title.value).toBe('原理图预览')

    modal.unregister('schematic')
    expect(schematicClose).not.toHaveBeenCalled()
    expect(modal.currentId.value).toBe('detail')
    expect(modal.title.value).toBe('实例设置')

    modal.close()
    expect(detailClose).toHaveBeenCalledOnce()
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

  it('外部关闭父弹窗时级联关闭其子弹窗', () => {
    const detailClose = vi.fn()
    const schematicClose = vi.fn()
    const modal = useFullscreenModal()

    modal.open('detail', '实例设置', detailClose)
    modal.open('schematic', '原理图预览', schematicClose)
    modal.unregister('detail')

    expect(schematicClose).toHaveBeenCalledOnce()
    expect(detailClose).not.toHaveBeenCalled()
    expect(modal.isVisible.value).toBe(false)
  })
})
