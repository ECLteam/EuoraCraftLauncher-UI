/* eslint-disable vue/one-component-per-file -- 测试挂载用辅助组件 */
import { flushPromises, mount } from '@vue/test-utils'
import { NMessageProvider } from 'naive-ui'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, onMounted } from 'vue'
import { useLauncherMessage } from './useLauncherMessage'

const Harness = defineComponent({
  setup() {
    const message = useLauncherMessage()
    onMounted(async () => {
      message.success('Saved', { title: 'Success' })
      message.info('Information')
      message.warning('Warning')
      message.error('Error')
      const loading = message.loading('Loading')
      await nextTick()
      loading.destroy()
    })
    return () => h('div')
  },
})

const DedupHarness = defineComponent({
  setup() {
    const message = useLauncherMessage()
    onMounted(() => {
      message.warning('Disk almost full')
      message.warning('Disk almost full')
      message.warning('Disk almost full')
    })
    return () => h('div')
  },
})

describe('useLauncherMessage', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('uses Naive UI messages at the configured top offset and destroys loading state', async () => {
    mount(NMessageProvider, {
      attachTo: document.body,
      props: {
        placement: 'top',
        max: 5,
        closable: true,
        keepAliveOnHover: true,
        containerClass: 'launcher-message-container',
        containerStyle: { top: 'calc(var(--titlebar-h) + var(--s-sm))' },
      },
      slots: { default: () => h(Harness) },
    })
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 350))

    const container = document.body.querySelector<HTMLElement>('.launcher-message-container')
    expect(container?.classList.contains('n-message-container--top')).toBe(true)
    expect(container?.style.top).toContain('var(--titlebar-h)')
    expect(document.body.textContent).toContain('Success')
    expect(document.body.textContent).toContain('Saved')
    expect(document.body.textContent).not.toContain('Loading')
    expect(document.body.querySelectorAll('.n-message')).toHaveLength(4)
  })

  it('merges identical simultaneous messages into one with a count suffix', async () => {
    mount(NMessageProvider, {
      attachTo: document.body,
      slots: { default: () => h(DedupHarness) },
    })
    await flushPromises()
    // naive-ui 消息销毁依赖 transitionend，jsdom 不触发，旧节点会残留，
    // 无法在此环境验证「物理只剩一条」；去重语义改由合并后的计数文本验证。
    expect(document.body.textContent).toContain('Disk almost full ×3')
  })
})
