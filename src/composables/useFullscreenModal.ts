import { computed, ref } from 'vue'

interface FullscreenModalState {
  id: string
  title: string
  onClose?: () => void
}

// 全屏弹窗是互斥页面：新弹窗打开时关闭当前弹窗，避免多个 Teleport 层叠。
const activeModal = ref<FullscreenModalState | null>(null)

export function useFullscreenModal() {
  const isVisible = computed(() => activeModal.value !== null)
  const title = computed(() => activeModal.value?.title || '')
  const currentId = computed(() => activeModal.value?.id || null)

  const open = (id: string, title: string, onClose?: () => void) => {
    const previousModal = activeModal.value

    if (previousModal?.id === id) {
      activeModal.value = { id, title, onClose }
      return
    }

    // 先登记新弹窗，再通知旧弹窗关闭。旧弹窗随后注销自己时不会误关新弹窗。
    activeModal.value = { id, title, onClose }
    const previousOnClose = previousModal?.onClose
    if (previousModal) previousModal.onClose = undefined
    previousOnClose?.()
  }

  const unregister = (id: string) => {
    if (activeModal.value?.id === id) {
      activeModal.value = null
    }
  }

  const close = () => {
    const modal = activeModal.value
    if (!modal) return

    activeModal.value = null
    const onClose = modal.onClose
    modal.onClose = undefined
    onClose?.()
  }

  const reset = () => {
    close()
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
