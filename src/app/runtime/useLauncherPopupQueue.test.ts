import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearLauncherPopupCache,
  DISMISSED_POPUPS_STORAGE_KEY,
  LAUNCHER_PRIORITY_MIN,
  PLUGIN_PRIORITY_MAX,
  POPUP_TRANSITION_MS,
  useLauncherPopupQueue,
} from './useLauncherPopupQueue'

describe('useLauncherPopupQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('同优先级按顺序展示并忽略相同 id 的重复事件', () => {
    const popups = useLauncherPopupQueue()

    popups.enqueuePopup({
      id: 'first',
      title: '第一条',
      content: '第一条内容',
      priority: 70,
    })
    popups.enqueuePopup({
      id: 'first',
      title: '重复',
      content: '不应该展示',
      priority: 70,
    })
    popups.enqueuePopup({
      id: 'second',
      title: '第二条',
      content: '第二条内容',
      level: 'warning',
      priority: 70,
    })

    expect(popups.activePopup.value?.id).toBe('first')
    popups.dismissActivePopup()
    vi.advanceTimersByTime(POPUP_TRANSITION_MS)
    expect(popups.activePopup.value?.id).toBe('second')
    expect(popups.activePopup.value?.level).toBe('warning')
  })

  it('优先级高的先展示，同优先级按入队顺序', () => {
    const popups = useLauncherPopupQueue()

    popups.enqueuePopup({ id: 'low', title: '低', content: '低优先级', priority: 70 })
    popups.enqueuePopup({ id: 'high', title: '高', content: '高优先级', priority: 90 })
    popups.enqueuePopup({ id: 'mid-a', title: '中A', content: '同优先级A', priority: 80 })
    popups.enqueuePopup({ id: 'mid-b', title: '中B', content: '同优先级B', priority: 80 })

    expect(popups.activePopup.value?.id).toBe('high')
    popups.dismissActivePopup()
    vi.advanceTimersByTime(POPUP_TRANSITION_MS)
    expect(popups.activePopup.value?.id).toBe('mid-a')
    popups.dismissActivePopup()
    vi.advanceTimersByTime(POPUP_TRANSITION_MS)
    expect(popups.activePopup.value?.id).toBe('mid-b')
    popups.dismissActivePopup()
    vi.advanceTimersByTime(POPUP_TRANSITION_MS)
    expect(popups.activePopup.value?.id).toBe('low')
  })

  it('插件来源的优先级被钳制到低区段，无法抢占启动器弹窗', () => {
    const popups = useLauncherPopupQueue()

    popups.enqueuePopup({ id: 'launcher-info', title: '启动器', content: '普通', source: 'launcher' })
    popups.enqueuePopup({ id: 'plugin', title: '插件', content: '插件声明极高优先级', source: 'plugin', priority: 999 })

    expect(popups.activePopup.value?.id).toBe('launcher-info')
    expect(popups.activePopup.value?.priority).toBe(LAUNCHER_PRIORITY_MIN)
    popups.dismissActivePopup()
    vi.advanceTimersByTime(POPUP_TRANSITION_MS)
    expect(popups.activePopup.value?.id).toBe('plugin')
    expect(popups.activePopup.value?.priority).toBe(PLUGIN_PRIORITY_MAX)
  })

  it('插件默认优先级按等级映射且不越过上限', () => {
    const popups = useLauncherPopupQueue()

    popups.enqueuePopup({
      id: 'plugin-critical',
      title: '插件严重',
      content: '内容',
      source: 'plugin',
      level: 'critical',
    })
    popups.enqueuePopup({ id: 'plugin-info', title: '插件信息', content: '内容', source: 'plugin', level: 'info' })

    expect(popups.activePopup.value?.priority).toBeLessThanOrEqual(PLUGIN_PRIORITY_MAX)
    popups.dismissActivePopup()
    vi.advanceTimersByTime(POPUP_TRANSITION_MS)
    expect(popups.activePopup.value?.priority).toBeLessThanOrEqual(PLUGIN_PRIORITY_MAX)
  })

  it('关闭弹窗后进入过渡期，过渡结束才显示下一个', () => {
    const popups = useLauncherPopupQueue()

    popups.enqueuePopup({ id: 'first', title: '第一条', content: '内容' })
    popups.enqueuePopup({ id: 'second', title: '第二条', content: '内容' })

    expect(popups.popupVisible.value).toBe(true)
    popups.dismissActivePopup()
    // 过渡期内不显示任何弹窗
    expect(popups.popupVisible.value).toBe(false)
    vi.advanceTimersByTime(POPUP_TRANSITION_MS - 1)
    expect(popups.popupVisible.value).toBe(false)
    vi.advanceTimersByTime(1)
    expect(popups.activePopup.value?.id).toBe('second')
    expect(popups.popupVisible.value).toBe(true)
  })

  it('关闭队列中最后一条后不残留过渡状态', () => {
    const popups = useLauncherPopupQueue()

    popups.enqueuePopup({ id: 'only', title: '唯一', content: '内容' })
    popups.dismissActivePopup()
    expect(popups.popupVisible.value).toBe(false)
    vi.advanceTimersByTime(POPUP_TRANSITION_MS)
    expect(popups.popupVisible.value).toBe(false)
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
    vi.advanceTimersByTime(POPUP_TRANSITION_MS)

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

  it('保留严重错误事件的扩展字段供错误弹窗渲染', () => {
    const popups = useLauncherPopupQueue()
    const crash = {
      reportId: 'a'.repeat(32),
      versionId: '1.21.8',
      exitCode: 1,
      detectedBy: ['exit_code'],
      reasons: [],
      sourceFiles: ['latest.log'],
      hasOutput: false,
    }

    popups.enqueuePopup({
      id: 'error-1',
      title: '存储失败',
      content: 'Unable to save data',
      priority: 85,
      errorId: 'error-1',
      detail: 'Safe detail',
      kind: 'game_crash',
      crash,
    })

    expect(popups.activePopup.value).toMatchObject({
      errorId: 'error-1',
      detail: 'Safe detail',
      kind: 'game_crash',
      crash,
      level: 'info',
      priority: 85,
    })
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
      priority: LAUNCHER_PRIORITY_MIN,
      source: 'launcher',
      dismissible: true,
      cacheable: false,
      once: false,
    })
  })
})
