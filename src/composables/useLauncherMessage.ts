import { useMessage, type MessageOptions, type MessageReactive } from 'naive-ui'
import { h } from 'vue'
import { launcherErrorQueue } from '@/app/runtime/errorPresentation'

type LauncherMessageType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface LauncherMessageOptions {
  title?: string
  duration?: number
  closable?: boolean
  onClose?: () => void
}

export type LauncherMessageArgument = number | LauncherMessageOptions

function normalizeOptions(options?: LauncherMessageArgument): LauncherMessageOptions {
  return typeof options === 'number' ? { duration: options } : (options ?? {})
}

function renderContent(content: string, title?: string) {
  if (!title?.trim()) return content
  return () =>
    h('div', { class: 'launcher-message-content' }, [
      h('strong', { class: 'launcher-message-title' }, title),
      h('span', { class: 'launcher-message-text' }, content),
    ])
}

/**
 * 使用 Naive UI Message 提供启动器统一的瞬时反馈样式与调用约定。
 */
export function useLauncherMessage() {
  let message: ReturnType<typeof useMessage> | null = null
  try {
    message = useMessage()
  } catch {
    if (import.meta.env.DEV) console.warn('[useLauncherMessage] NMessageProvider 尚未挂载')
  }

  function show(type: LauncherMessageType, content: string, argument?: LauncherMessageArgument): MessageReactive {
    if (type === 'error' && launcherErrorQueue.consumeSuppressedMessage(content)) {
      return { type: 'error', destroy: () => undefined } as MessageReactive
    }
    if (!message) return { type, destroy: () => undefined } as MessageReactive
    const options = normalizeOptions(argument)
    const nativeOptions: MessageOptions = {
      duration: type === 'loading' ? (options.duration ?? 0) : options.duration,
      closable: options.closable,
      onClose: options.onClose,
    }
    return message[type](renderContent(content, options.title), nativeOptions)
  }

  return {
    success: (content: string, options?: LauncherMessageArgument) => show('success', content, options),
    error: (content: string, options?: LauncherMessageArgument) => show('error', content, options),
    warning: (content: string, options?: LauncherMessageArgument) => show('warning', content, options),
    info: (content: string, options?: LauncherMessageArgument) => show('info', content, options),
    loading: (content: string, options?: LauncherMessageArgument) => show('loading', content, options),
    clear: () => message?.destroyAll(),
  }
}
