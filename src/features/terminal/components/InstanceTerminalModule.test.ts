import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '@/i18n'
import { globalProcessInstances } from '../composables/useProcessInstances'
import InstanceTerminalModule from './InstanceTerminalModule.vue'

const mocks = vi.hoisted(() => ({
  on: vi.fn(),
  getProcessInstances: vi.fn(),
}))

vi.mock('@/api/client', () => ({
  default: { on: mocks.on },
}))

vi.mock('../api/terminalApi', () => ({
  terminalApi: { getProcessInstances: mocks.getProcessInstances },
}))

describe('InstanceTerminalModule', () => {
  let initSpy: ReturnType<typeof vi.spyOn>
  let disposeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.on.mockImplementation(() => vi.fn())
    mocks.getProcessInstances.mockResolvedValue([])
    initSpy = vi.spyOn(globalProcessInstances, 'init')
    disposeSpy = vi.spyOn(globalProcessInstances, 'dispose')
  })

  afterEach(() => {
    initSpy.mockRestore()
    disposeSpy.mockRestore()
  })

  function mountModule() {
    return mount(InstanceTerminalModule, { global: { plugins: [i18n] } })
  }

  it('挂载时订阅实例事件并拉取快照，卸载时解除订阅', async () => {
    const wrapper = mountModule()
    await Promise.resolve()
    expect(initSpy).toHaveBeenCalledTimes(1)
    expect(mocks.on).toHaveBeenCalledWith('process:instance_log', expect.any(Function))
    expect(mocks.on).toHaveBeenCalledWith('process:instances_changed', expect.any(Function))
    expect(mocks.getProcessInstances).toHaveBeenCalled()

    wrapper.unmount()
    expect(disposeSpy).toHaveBeenCalledTimes(1)
  })

  it('点击返回按钮触发 back 事件', async () => {
    const wrapper = mountModule()
    const backButton = wrapper.get('.itm-back')
    await backButton.trigger('click')
    expect(wrapper.emitted('back')).toHaveLength(1)
  })
})
