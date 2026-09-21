import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UiProgress from './Progress.vue'

describe('UiProgress', () => {
  it('在未知进度时使用共享的不确定进度状态', async () => {
    const wrapper = mount(UiProgress, { props: { processing: true } })

    expect(wrapper.attributes('aria-valuenow')).toBeUndefined()
    expect(wrapper.get('.ui-progress__bar').classes()).toContain('ui-progress__bar--processing')

    await wrapper.setProps({ processing: false, percentage: 42 })
    expect(wrapper.attributes('aria-valuenow')).toBe('42')
    expect(wrapper.get('.ui-progress__bar').attributes('style')).toContain('width: 42%')
  })
})
