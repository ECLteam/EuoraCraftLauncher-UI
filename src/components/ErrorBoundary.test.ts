/* eslint-disable vue/one-component-per-file -- 测试挂载用辅助组件 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { i18n } from '@/i18n'
import ErrorBoundary from './ErrorBoundary.vue'

const ThrowingChild = defineComponent({
  props: { shouldThrow: { type: Boolean, default: false } },
  setup(props) {
    return () => {
      if (props.shouldThrow) throw new Error('boom')
      return h('div', 'normal content')
    }
  },
})

async function mountBoundary(shouldThrow: boolean) {
  const flag = ref(shouldThrow)
  const wrapper = mount(
    defineComponent({
      setup() {
        return () =>
          h(ErrorBoundary, null, {
            default: () => h(ThrowingChild, { shouldThrow: flag.value }),
          })
      },
    }),
    {
      global: {
        plugins: [i18n],
        stubs: { UiIcon: true },
      },
    }
  )
  await nextTick()
  return { wrapper, flag }
}

describe('ErrorBoundary', () => {
  it('子组件正常渲染时显示默认内容', async () => {
    const { wrapper } = await mountBoundary(false)
    expect(wrapper.find('.error-boundary-fallback').exists()).toBe(false)
    expect(wrapper.text()).toContain('normal content')
    wrapper.unmount()
  })

  it('捕获子组件渲染错误并显示降级提示', async () => {
    const { wrapper } = await mountBoundary(true)
    expect(wrapper.find('.error-boundary-fallback').exists()).toBe(true)
    expect(wrapper.text()).toContain('页面加载出现问题')
    expect(wrapper.text()).toContain('重新加载')
    wrapper.unmount()
  })

  it('点击重新加载后恢复子组件渲染', async () => {
    const { wrapper, flag } = await mountBoundary(true)
    expect(wrapper.find('.error-boundary-fallback').exists()).toBe(true)

    flag.value = false
    await wrapper.find('button').trigger('click')

    expect(wrapper.find('.error-boundary-fallback').exists()).toBe(false)
    expect(wrapper.text()).toContain('normal content')
    wrapper.unmount()
  })
})
