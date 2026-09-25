import { mount } from '@vue/test-utils'
import { NInput, NPopover, NSelect } from 'naive-ui'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { i18n } from '@/i18n'
import FontFamilySelect from './FontFamilySelect.vue'

describe('FontFamilySelect 自定义编辑', () => {
  it('编辑器弹出而不撑高设置行，输入框只接收一个键盘处理函数', async () => {
    const app = document.createElement('div')
    app.id = 'app'
    document.body.appendChild(app)
    const wrapper = mount(FontFamilySelect, {
      attachTo: app,
      global: { plugins: [i18n] },
      props: {
        modelValue: '',
        defaultLabel: '默认字体',
        defaultFont: 'var(--font-body)',
        fallbackFont: 'var(--font-body)',
      },
    })

    try {
      wrapper.getComponent(NSelect).vm.$emit('update:value', '__ecl_custom_font__;')
      await nextTick()
      await nextTick()

      expect(wrapper.getComponent(NPopover).props('show')).toBe(true)
      expect(wrapper.find('.font-family-control > .font-family-editor').exists()).toBe(false)
      const handleKeydown = wrapper.getComponent(NInput).props('onKeydown') as (event: KeyboardEvent) => void
      expect(typeof handleKeydown).toBe('function')

      handleKeydown(new KeyboardEvent('keydown', { key: 'Escape' }))
      await nextTick()
      expect(wrapper.getComponent(NPopover).props('show')).toBe(false)

      wrapper.getComponent(NSelect).vm.$emit('update:value', '__ecl_custom_font__;')
      await nextTick()
      wrapper.getComponent(NInput).vm.$emit('update:value', 'SimSun')
      await nextTick()
      handleKeydown(new KeyboardEvent('keydown', { key: 'Enter' }))
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['SimSun'])
    } finally {
      wrapper.unmount()
      app.remove()
    }
  })
})
