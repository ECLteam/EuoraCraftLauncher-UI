import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import InstancePathSidebar from './InstancePathSidebar.vue'

describe('InstancePathSidebar', () => {
  it('将路径选择和编辑操作交给页面组合层', async () => {
    const wrapper = mount(InstancePathSidebar, {
      global: {
        plugins: [i18n],
      },
      props: {
        paths: [{ name: '主目录', path: 'C:\\Games\\.minecraft' }],
        selectedIndex: 0,
        versionCounts: { 'C:\\Games\\.minecraft': 2 },
      },
    })

    expect(wrapper.text()).toContain('2 个实例')
    await wrapper.get('.path-item').trigger('click')
    await wrapper.findAll('.path-action-btn')[1]!.trigger('click')

    expect(wrapper.emitted('select')).toEqual([[0]])
    expect(wrapper.emitted('edit')).toEqual([[0]])
  })
})
