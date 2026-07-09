import { ref } from 'vue'
import type GlassMessage from '@/components/ui/GlassMessage.vue'
import type { MessageOptions } from '@/components/ui/GlassMessage.vue'

// 全局存储组件实例
const messageRef = ref<InstanceType<typeof GlassMessage> | null>(null)

// 设置组件引用（在 App.vue 的 onMounted 中调用）
export function setMessageRef(ref: InstanceType<typeof GlassMessage> | null) {
  messageRef.value = ref
}

// 在组件中使用
export function useGlassMessage() {
  return {
    add: (options: MessageOptions) => {
      if (!messageRef.value && import.meta.env.DEV) console.warn('[useGlassMessage] 组件未挂载，消息无法显示')
      return messageRef.value?.add(options)
    },
    remove: (id: string) => messageRef.value?.remove(id),
    success: (content: string, duration?: number) => {
      if (!messageRef.value && import.meta.env.DEV) console.warn('[useGlassMessage] 组件未挂载')
      return messageRef.value?.success(content, duration)
    },
    error: (content: string, duration?: number) => {
      if (!messageRef.value && import.meta.env.DEV) console.warn('[useGlassMessage] 组件未挂载')
      return messageRef.value?.error(content, duration)
    },
    warning: (content: string, duration?: number) => {
      if (!messageRef.value && import.meta.env.DEV) console.warn('[useGlassMessage] 组件未挂载')
      return messageRef.value?.warning(content, duration)
    },
    info: (content: string, duration?: number) => {
      if (!messageRef.value && import.meta.env.DEV) console.warn('[useGlassMessage] 组件未挂载')
      return messageRef.value?.info(content, duration)
    },
    loading: (content: string, duration?: number) => {
      if (!messageRef.value && import.meta.env.DEV) console.warn('[useGlassMessage] 组件未挂载')
      return messageRef.value?.loading(content, duration)
    },
    clear: () => messageRef.value?.clear()
  }
}