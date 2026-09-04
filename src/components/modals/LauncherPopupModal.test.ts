import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { i18n } from '@/i18n'
import LauncherPopupModal from './LauncherPopupModal.vue'
import Modal from './Modal.vue'

describe('LauncherPopupModal', () => {
  it('渲染 Markdown 内容并在确认后发出 dismiss', async () => {
    const wrapper = mount(LauncherPopupModal, {
      attachTo: document.body,
      global: {
        plugins: [i18n],
      },
      props: {
        visible: true,
        popup: {
          id: 'notice',
          title: '维护公告',
          content: '服务器将在 **22:00** 维护。',
          level: 'warning',
          priority: 75,
          source: 'launcher',
          dismissible: true,
          cacheable: false,
          once: false,
          seq: 0,
        },
      },
    })

    expect(document.body.textContent).toContain('维护公告')
    expect(document.body.querySelector('strong')?.textContent).toBe('22:00')
    expect(wrapper.findComponent(Modal).props('transitionName')).toBe('launcher-popup')

    const confirmButton = document.body.querySelector('.modal-footer button')
    await confirmButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(wrapper.emitted('dismiss')).toHaveLength(1)
    wrapper.unmount()
  })

  it('不可随意关闭的弹窗不显示关闭按钮', () => {
    const wrapper = mount(LauncherPopupModal, {
      attachTo: document.body,
      global: {
        plugins: [i18n],
      },
      props: {
        visible: true,
        popup: {
          id: 'critical',
          title: '重要公告',
          content: '请确认后继续。',
          level: 'critical',
          priority: 90,
          source: 'launcher',
          dismissible: false,
          cacheable: false,
          once: false,
          seq: 1,
        },
      },
    })

    expect(document.body.querySelector('.close-btn')).toBeNull()
    wrapper.unmount()
  })

  it('只有可缓存弹窗选择不再显示后才发出记忆标记', async () => {
    const wrapper = mount(LauncherPopupModal, {
      attachTo: document.body,
      global: {
        plugins: [i18n],
      },
      props: {
        visible: true,
        popup: {
          id: 'cacheable',
          title: '可缓存公告',
          content: '公告内容',
          level: 'info',
          priority: 70,
          source: 'launcher',
          dismissible: true,
          cacheable: true,
          once: false,
          seq: 2,
        },
      },
    })

    const checkbox = document.body.querySelector('.n-checkbox')
    checkbox?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    const confirmButton = document.body.querySelector('.launcher-popup-footer button')
    confirmButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(wrapper.emitted('dismiss')).toEqual([[true]])
    wrapper.unmount()
  })
})
