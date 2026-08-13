import { describe, expect, it } from 'vitest'
import { clearLauncherPopupCache, DISMISSED_POPUPS_STORAGE_KEY, useLauncherPopupQueue } from './useLauncherPopupQueue'

describe('useLauncherPopupQueue', () => {
  it('按顺序展示弹窗并忽略相同 id 的重复事件', () => {
    const popups = useLauncherPopupQueue()

    popups.enqueuePopup({
      id: 'first',
      title: '第一条',
      content: '第一条内容',
    })
    popups.enqueuePopup({
      id: 'first',
      title: '重复',
      content: '不应该展示',
    })
    popups.enqueuePopup({
      id: 'second',
      title: '第二条',
      content: '第二条内容',
      level: 'warning',
    })

    expect(popups.activePopup.value?.id).toBe('first')
    popups.dismissActivePopup()
    expect(popups.activePopup.value?.id).toBe('second')
    expect(popups.activePopup.value?.level).toBe('warning')
  })

  it('普通关闭可缓存弹窗时不会记录已读', () => {
    const firstQueue = useLauncherPopupQueue()
    firstQueue.enqueuePopup({
      id: 'cacheable-popup',
      title: '允许缓存',
      content: '内容',
      cacheable: true,
    })

    firstQueue.dismissActivePopup()

    const nextQueue = useLauncherPopupQueue()
    nextQueue.enqueuePopup({
      id: 'cacheable-popup',
      title: '允许缓存',
      content: '内容',
      cacheable: true,
    })

    expect(nextQueue.popupVisible.value).toBe(true)
  })

  it('仅在用户选择不再显示后持久忽略相同 id', () => {
    const firstQueue = useLauncherPopupQueue()
    firstQueue.enqueuePopup({
      id: 'cacheable-popup',
      title: '允许缓存',
      content: '内容',
      cacheable: true,
    })

    firstQueue.dismissActivePopup(true)

    const nextQueue = useLauncherPopupQueue()
    nextQueue.enqueuePopup({
      id: 'cacheable-popup',
      title: '允许缓存',
      content: '内容',
      cacheable: true,
    })

    expect(nextQueue.popupVisible.value).toBe(false)
  })

  it('兼容 once 字段并允许清理弹窗阅读缓存', () => {
    const firstQueue = useLauncherPopupQueue()
    firstQueue.enqueuePopup({
      id: 'legacy-once-popup',
      title: '旧格式弹窗',
      content: '内容',
      once: true,
    })
    expect(firstQueue.activePopup.value?.cacheable).toBe(true)
    firstQueue.dismissActivePopup(true)
    expect(localStorage.getItem(DISMISSED_POPUPS_STORAGE_KEY)).toContain('legacy-once-popup')
    localStorage.setItem('euoracraft-dismissed-popups', JSON.stringify(['old-auto-dismissed-popup']))

    clearLauncherPopupCache()

    expect(localStorage.getItem('euoracraft-dismissed-popups')).toBeNull()
    const nextQueue = useLauncherPopupQueue()
    nextQueue.enqueuePopup({
      id: 'legacy-once-popup',
      title: '旧格式弹窗',
      content: '内容',
      once: true,
    })
    expect(nextQueue.popupVisible.value).toBe(true)
  })

  it('丢弃缺少必要内容的事件并为可选字段提供默认值', () => {
    const popups = useLauncherPopupQueue()

    popups.enqueuePopup({
      id: 'invalid',
      title: '   ',
      content: '内容',
    })
    expect(popups.popupVisible.value).toBe(false)

    popups.enqueuePopup({
      id: 'valid',
      title: '普通弹窗',
      content: '内容',
    })
    expect(popups.activePopup.value).toMatchObject({
      level: 'info',
      dismissible: true,
      cacheable: false,
      once: false,
    })
  })
})
