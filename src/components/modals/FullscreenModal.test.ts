import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import { useFullscreenModal } from '@/composables/useFullscreenModal'
import FullscreenModal from './FullscreenModal.vue'

describe('FullscreenModal', () => {
  afterEach(() => {
    useFullscreenModal().reset()
    document.body.innerHTML = ''
  })

  it('打开任务列表时关闭已经显示的账户管理弹窗', async () => {
    const accountVisible = ref(true)
    const taskVisible = ref(false)
    const host = defineComponent({
      components: { FullscreenModal },
      setup: () => ({ accountVisible, taskVisible }),
      template: `
        <FullscreenModal v-model:visible="accountVisible" title="账户管理">
          <div>账户内容</div>
        </FullscreenModal>
        <FullscreenModal v-model:visible="taskVisible" title="任务列表">
          <div>任务内容</div>
        </FullscreenModal>
      `,
    })
    const wrapper = mount(host, { attachTo: document.body })
    await nextTick()

    taskVisible.value = true
    await nextTick()

    expect(accountVisible.value).toBe(false)
    expect(taskVisible.value).toBe(true)
    expect(useFullscreenModal().title.value).toBe('任务列表')

    const visibleModals = Array.from(document.body.querySelectorAll<HTMLElement>('.fullscreen-modal')).filter(
      (modal) => modal.style.display !== 'none'
    )
    expect(visibleModals).toHaveLength(1)
    expect(visibleModals[0]?.textContent).toContain('任务内容')

    wrapper.unmount()
  })
})
