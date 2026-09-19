import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { globalModalStack } from '@/composables/useGlobalModalStack'
import { i18n } from '@/i18n'
import Modal from './Modal.vue'

describe('Modal', () => {
  afterEach(() => {
    globalModalStack.reset()
    document.body.innerHTML = ''
  })

  it('全局栈会先展示 CurseForge 警告，关闭后才展示低优先级更新提示', async () => {
    const warningVisible = ref(true)
    const updateVisible = ref(true)
    const host = defineComponent({
      components: { Modal },
      setup: () => ({ updateVisible, warningVisible }),
      template: `
        <Modal :visible="warningVisible" :priority="75" title="CurseForge API Key 未配置">Key 缺失</Modal>
        <Modal :visible="updateVisible" :priority="60" title="检测到更新">新版本可用</Modal>
      `,
    })
    const wrapper = mount(host, { attachTo: document.body, global: { plugins: [i18n] } })

    const visibleContent = () =>
      Array.from(document.body.querySelectorAll<HTMLElement>('.modal-overlay'))
        .filter((modal) => modal.style.display !== 'none')
        .map((modal) => modal.textContent)

    expect(visibleContent()).toContain('CurseForge API Key 未配置Key 缺失')

    warningVisible.value = false
    await nextTick()

    expect(visibleContent()).toContain('检测到更新新版本可用')
    wrapper.unmount()
  })
})
