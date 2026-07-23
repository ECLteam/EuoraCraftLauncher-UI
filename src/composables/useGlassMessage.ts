import { ref } from 'vue'
import type GlassMessage from '@/components/ui/GlassMessage.vue'
import type { MessageOptions } from '@/components/ui/GlassMessage.vue'

type MessageInstance = InstanceType<typeof GlassMessage>

const messageRef = ref<MessageInstance | null>(null)

export function setMessageRef(instance: MessageInstance | null) {
  messageRef.value = instance
}

function getMessageInstance(): MessageInstance | null {
  if (!messageRef.value && import.meta.env.DEV) {
    console.warn('[useGlassMessage] 通知组件尚未挂载')
  }
  return messageRef.value
}

export function useGlassMessage() {
  return {
    add: (options: MessageOptions) => getMessageInstance()?.add(options),
    remove: (id: string) => getMessageInstance()?.remove(id),
    success: (content: string, duration?: number) => getMessageInstance()?.success(content, duration),
    error: (content: string, duration?: number) => getMessageInstance()?.error(content, duration),
    warning: (content: string, duration?: number) => getMessageInstance()?.warning(content, duration),
    info: (content: string, duration?: number) => getMessageInstance()?.info(content, duration),
    loading: (content: string, duration?: number) => getMessageInstance()?.loading(content, duration),
    clear: () => getMessageInstance()?.clear(),
  }
}
