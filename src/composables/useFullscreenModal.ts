import { ref, computed } from 'vue'

interface FullscreenModalState {
  visible: boolean
  title: string
  onClose?: () => void
}

// 使用栈来管理多个全屏弹窗状态
const modalStack = ref<FullscreenModalState[]>([])

export function useFullscreenModal() {
  // 当前顶层全屏弹窗状态
  const currentModal = computed(() => modalStack.value.length > 0 ? modalStack.value[modalStack.value.length - 1] : null)
  const isVisible = computed(() => modalStack.value.length > 0)
  const title = computed(() => currentModal.value?.title || '')

  const open = (title: string, onClose?: () => void) => {
    const newState: FullscreenModalState = {
      visible: true,
      title,
      onClose
    }
    modalStack.value.push(newState)
  }

  const close = () => {
    if (modalStack.value.length === 0) return

    const topModal = modalStack.value.pop()!
    const onClose = topModal.onClose
    topModal.onClose = undefined
    topModal.visible = false
    topModal.title = ''
    onClose?.()
  }
  
  const reset = () => {
    while (modalStack.value.length > 0) {
      const modal = modalStack.value.pop()!
      modal.onClose?.()
    }
  }

  return {
    isVisible,
    title,
    open,
    close,
    reset
  }
}