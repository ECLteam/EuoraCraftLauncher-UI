import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { globalProcessInstances } from '../composables/useProcessInstances'
import InstanceTerminalOverlay from './InstanceTerminalOverlay.vue'

vi.mock('../composables/useProcessInstances', () => ({
  globalProcessInstances: { init: vi.fn(), dispose: vi.fn() },
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

async function mountOverlay(visible: boolean) {
  const wrapper = mount(InstanceTerminalOverlay, {
    props: { visible },
    global: {
      stubs: { UiIcon: true, ProcessInstanceView: true },
    },
    attachTo: document.body,
  })
  await nextTick()
  return wrapper
}

describe('InstanceTerminalOverlay 实例终端全屏面板', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('visible 为 false 时隐藏，为 true 时渲染并初始化子进程订阅', async () => {
    const hidden = await mountOverlay(false)
    expect(document.querySelector('.instance-terminal-overlay')).toBeNull()

    await hidden.setProps({ visible: true })
    expect(document.querySelector('.instance-terminal-overlay')).not.toBeNull()
    expect(globalProcessInstances.init).toHaveBeenCalled()
    hidden.unmount()
  })

  it('关闭时释放子进程订阅', async () => {
    const wrapper = await mountOverlay(true)
    await wrapper.setProps({ visible: false })
    expect(globalProcessInstances.dispose).toHaveBeenCalled()
    wrapper.unmount()
  })

  it('点击关闭按钮发出 update:visible=false', async () => {
    const wrapper = await mountOverlay(true)
    const closeButton = document.querySelector<HTMLButtonElement>('.instance-terminal-close')
    expect(closeButton).not.toBeNull()
    closeButton!.click()
    await nextTick()
    expect(wrapper.emitted('update:visible')).toEqual([[false]])
    wrapper.unmount()
  })

  it('捕获阶段拦截 Esc，阻止下层全屏弹窗冒泡并关闭本面板', async () => {
    const wrapper = await mountOverlay(true)
    let bubbleFired = false
    const bubbleListener = () => {
      bubbleFired = true
    }
    document.addEventListener('keydown', bubbleListener)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()

    expect(bubbleFired).toBe(false)
    expect(wrapper.emitted('update:visible')).toEqual([[false]])
    document.removeEventListener('keydown', bubbleListener)
    wrapper.unmount()
  })
})
