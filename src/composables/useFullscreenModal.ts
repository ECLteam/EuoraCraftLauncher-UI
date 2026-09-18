import { computed, ref } from 'vue'

interface FullscreenModalState {
  id: string
  title: string
  onClose?: () => void
}

// 全屏弹窗按栈管理：子弹窗覆盖父弹窗，关闭后恢复原页面状态。
const modalStack = ref<FullscreenModalState[]>([])

export function useFullscreenModal() {
  const activeModal = computed(() => modalStack.value.at(-1) ?? null)
  const isVisible = computed(() => activeModal.value !== null)
  const title = computed(() => activeModal.value?.title || '')
  const currentId = computed(() => activeModal.value?.id || null)

  const open = (id: string, title: string, onClose?: () => void) => {
    const nextModal = { id, title, onClose }
    modalStack.value = [...modalStack.value.filter((modal) => modal.id !== id), nextModal]
  }

  const unregister = (id: string) => {
    const modalIndex = modalStack.value.findIndex((modal) => modal.id === id)
    if (modalIndex < 0) return
    const removed = modalStack.value.slice(modalIndex)
    modalStack.value = modalStack.value.slice(0, modalIndex)
    for (const modal of removed.reverse()) {
      if (modal.id !== id) {
        const onClose = modal.onClose
        modal.onClose = undefined
        onClose?.()
      }
    }
  }

  const close = () => {
    const modal = activeModal.value
    if (!modal) return

    modalStack.value = modalStack.value.slice(0, -1)
    const onClose = modal.onClose
    modal.onClose = undefined
    onClose?.()
  }

  const reset = () => {
    const modals = [...modalStack.value].reverse()
    modalStack.value = []
    for (const modal of modals) {
      const onClose = modal.onClose
      modal.onClose = undefined
      onClose?.()
    }
  }

  return {
    isVisible,
    title,
    currentId,
    open,
    unregister,
    close,
    reset,
  }
}
