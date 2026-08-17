import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTerminal } from '@/features/terminal/composables/useTerminal'
import { i18n } from '@/i18n'
import FloatingTerminal from './FloatingTerminal.vue'

const mocks = vi.hoisted(() => ({
  on: vi.fn(),
  off: vi.fn(),
  getLogHistory: vi.fn(),
  getProcessInstances: vi.fn(),
  success: vi.fn(),
}))

// 满足 vi.mock 解析顺序：backend 导出为具名 ''，经 default 访问
vi.mock('@/api/client', () => ({
  default: { on: mocks.on, off: mocks.off },
}))

vi.mock('@/features/terminal/api/terminalApi', () => ({
  terminalApi: { getLogHistory: mocks.getLogHistory, getProcessInstances: mocks.getProcessInstances },
}))

vi.mock('@/composables/useLauncherMessage', () => ({
  useLauncherMessage: () => ({ success: mocks.success, info: vi.fn(), warning: vi.fn(), error: vi.fn() }),
}))

function mountTerminal() {
  return mount(FloatingTerminal, {
    attachTo: document.body,
    global: {
      plugins: [i18n],
      stubs: { UiIcon: true },
    },
  })
}

function resetState() {
  const terminal = useTerminal()
  terminal.minimize()
  terminal.clearLogs()
}

describe('FloatingTerminal 悬浮终端', () => {
  beforeEach(() => {
    mocks.on.mockReturnValue(mocks.off)
    mocks.getLogHistory.mockResolvedValue([])
    mocks.getProcessInstances.mockResolvedValue([])
    resetState()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    mocks.on.mockReset()
    mocks.getLogHistory.mockReset()
    mocks.getProcessInstances.mockReset()
  })

  it('挂载时订阅 launcher:log，卸载时取消订阅', async () => {
    const wrapper = mountTerminal()
    mocks.getLogHistory.mockResolvedValue([])
    await flushPromises()
    expect(mocks.on).toHaveBeenCalledWith('launcher:log', expect.any(Function))

    wrapper.unmount()
    expect(mocks.off).toHaveBeenCalled()
  })

  it('点击圆形按钮展开为浮动窗口', async () => {
    const wrapper = mountTerminal()
    await flushPromises()
    const dot = document.body.querySelector<HTMLElement>('.ft-dot')
    expect(dot).toBeTruthy()

    dot?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()

    const panel = document.body.querySelector<HTMLElement>('.ft-panel')
    expect(panel).toBeTruthy()
    expect(panel?.classList.contains('ft-panel--max')).toBe(false)
    expect(document.body.querySelector('.ft-dot')).toBeNull()
    wrapper.unmount()
  })

  it('最小化按钮折叠回圆形按钮', async () => {
    const wrapper = mountTerminal()
    await flushPromises()
    document.body.querySelector<HTMLElement>('.ft-dot')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()

    const minimizeBtn = document.querySelectorAll<HTMLElement>('.ft-controls .ft-btn')[0]
    minimizeBtn?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()

    expect(document.body.querySelector('.ft-dot')).toBeTruthy()
    expect(document.body.querySelector('.ft-panel')).toBeNull()
    wrapper.unmount()
  })

  it('最大化进入全屏形态，还原按钮返回浮动', async () => {
    const wrapper = mountTerminal()
    await flushPromises()
    document.body.querySelector<HTMLElement>('.ft-dot')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()

    const controls = () => document.querySelectorAll<HTMLElement>('.ft-controls .ft-btn')
    const term = useTerminal()

    // 浮动态第二个按钮为最大化
    controls()[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(term.terminalMode.value).toBe('maximized')
    expect(document.querySelector<HTMLElement>('.ft-panel')?.classList.contains('ft-panel--max')).toBe(true)

    // 最大化态第二个按钮为还原
    controls()[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()
    expect(term.terminalMode.value).toBe('floating')
    wrapper.unmount()
  })
})
