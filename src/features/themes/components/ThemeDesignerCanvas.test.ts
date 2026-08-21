import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { registerPluginSlotHost, unregisterPluginSlotHost } from '@/features/plugins/slots/slotRegistry'
import { useThemeDesignerStore } from '../stores/themeDesignerStore'
import ThemeDesignerCanvas from './ThemeDesignerCanvas.vue'

describe('ThemeDesignerCanvas', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('允许暂停点选并恢复页面交互', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    })
    await router.push('/')
    await router.isReady()
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useThemeDesignerStore()
    store.isDesigning = true
    store.isPicking = true
    const wrapper = mount(ThemeDesignerCanvas, { global: { plugins: [pinia, router] } })

    await wrapper.get('.theme-canvas-toolbar button').trigger('click')
    expect(store.isPicking).toBe(false)

    store.showSlots = true
    await wrapper.vm.$nextTick()
    expect(document.documentElement.classList.contains('theme-slot-visualization')).toBe(true)

    const target = document.createElement('button')
    target.dataset.themeNode = 'test.button'
    const handler = vi.fn()
    target.addEventListener('click', handler)
    document.body.appendChild(target)
    target.click()
    expect(handler).toHaveBeenCalledOnce()
    target.remove()

    wrapper.unmount()
    expect(document.documentElement.classList.contains('theme-slot-visualization')).toBe(false)
  })

  it('选中框持续跟随滚动、动画或布局变化后的组件位置', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    })
    await router.push('/')
    await router.isReady()
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useThemeDesignerStore()
    store.isDesigning = true
    store.isPicking = true
    const wrapper = mount(ThemeDesignerCanvas, { global: { plugins: [pinia, router] } })
    const rect = { top: 12, left: 24, width: 120, height: 48 }
    const canvas = document.createElement('main')
    canvas.id = 'main-content'
    canvas.getBoundingClientRect = () => ({
      top: 49,
      left: 0,
      width: 900,
      height: 551,
      right: 900,
      bottom: 600,
      x: 0,
      y: 49,
      toJSON: () => ({}),
    })
    const target = document.createElement('button')
    target.dataset.themeNode = 'moving.button'
    target.getBoundingClientRect = () => ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({}),
    })
    canvas.appendChild(target)
    document.body.appendChild(canvas)
    target.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.get('.theme-node-highlight').attributes('style')).toContain('top: 49px')

    rect.top = 86
    rect.left = 42
    await vi.waitFor(() => {
      expect(wrapper.get('.theme-node-highlight').attributes('style')).toContain('top: 86px')
      expect(wrapper.get('.theme-node-highlight').attributes('style')).toContain('left: 42px')
    })

    canvas.remove()
    wrapper.unmount()
  })

  it('用独立叠层标记空插槽且不改变宿主尺寸', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div />' } }],
    })
    await router.push('/')
    await router.isReady()
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useThemeDesignerStore()
    store.isDesigning = true
    const wrapper = mount(ThemeDesignerCanvas, { global: { plugins: [pinia, router] } })
    const host = document.createElement('div')
    host.getBoundingClientRect = () => ({
      top: 120,
      left: 240,
      width: 0,
      height: 0,
      right: 240,
      bottom: 120,
      x: 240,
      y: 120,
      toJSON: () => ({}),
    })
    document.body.appendChild(host)
    registerPluginSlotHost({ key: 'test-slot', slotId: 'plugin-slot-content-top', element: host })

    store.showSlots = true
    await vi.waitFor(() => expect(wrapper.get('.theme-slot-marker').text()).toContain('plugin-slot-content-top'))
    expect(wrapper.get('.theme-slot-marker').attributes('style')).toContain('left: 240px')
    expect(host.getBoundingClientRect().width).toBe(0)

    unregisterPluginSlotHost('test-slot')
    host.remove()
    wrapper.unmount()
  })
})
