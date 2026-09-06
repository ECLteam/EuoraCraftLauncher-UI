import { useMessage, type MessageOptions, type MessageReactive } from 'naive-ui'
import { h } from 'vue'
import { launcherErrorQueue } from '@/app/runtime/errorPresentation'

type LauncherMessageType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface LauncherMessageOptions {
  title?: string
  duration?: number
  closable?: boolean
  /** 点击通知内容时触发的回调（启用后通知区域显示可点击样式）。 */
  onClick?: () => void
  onClose?: () => void
}

export type LauncherMessageArgument = number | LauncherMessageOptions

interface ActiveMessage {
  key: string
  reactive: MessageReactive
  count: number
  timer: ReturnType<typeof setTimeout> | null
}

function normalizeOptions(options?: LauncherMessageArgument): LauncherMessageOptions {
  return typeof options === 'number' ? { duration: options } : (options ?? {})
}

function renderContent(content: string, title?: string, onClick?: () => void) {
  const clickable = onClick ? { onClick } : undefined
  const className = ['launcher-message-content', onClick ? 'is-clickable' : ''].join(' ').trim()
  if (!title?.trim()) return content
  return () => h('div', { class: className, ...(clickable ?? {}) }, [
    h('strong', { class: 'launcher-message-title' }, title),
    h('span', { class: 'launcher-message-text' }, content),
  ])
}

/**
 * 使用 Naive UI Message 提供启动器统一的瞬时反馈样式与调用约定。
 * 同一时刻若已存在相同类型与内容的通知，则合并计数到原通知上，避免刷屏。
 */
export function useLauncherMessage() {
  let message: ReturnType<typeof useMessage> | null = null
  try {
    message = useMessage()
  } catch {
    if (import.meta.env.DEV) console.warn('[useLauncherMessage] NMessageProvider 尚未挂载')
  }

  const activeMessages = new Map<string, ActiveMessage>()

  function removeEntry(key: string): void {
    const entry = activeMessages.get(key)
    if (!entry) return
    if (entry.timer) clearTimeout(entry.timer)
    activeMessages.delete(key)
  }

  // naive-ui 仅手动关闭时触发 onClose，自动消失需靠时长兜底清理，
  // 否则映射里残留已消失的通知，会让后续相同通知被静默吞掉。
  function resetTimer(entry: ActiveMessage, duration: number | undefined): void {
    if (entry.timer) clearTimeout(entry.timer)
    entry.timer = null
    if (duration && duration > 0) entry.timer = setTimeout(() => removeEntry(entry.key), duration + 100)
  }

  function show(
    type: LauncherMessageType,
    content: string,
    argument?: LauncherMessageArgument,
    bypassSuppression = false
  ): MessageReactive {
    // 绕过抑制用于 unwrapResponse 的兜底通知：该通知本身是首次呈现，不应被已记录的抑制吞掉
    if (!bypassSuppression && type === 'error' && launcherErrorQueue.consumeSuppressedMessage(content)) {
      return { type: 'error', destroy: () => undefined } as MessageReactive
    }
    if (!message) return { type, destroy: () => undefined } as MessageReactive
    const options = normalizeOptions(argument)
    const key = `${type}\u0000${content}`
    // 未显式指定时长时，loading 默认常驻，其余类型沿用 NMessageProvider 的默认 4000ms
    const effectiveDuration = type === 'loading' ? (options.duration ?? 0) : (options.duration ?? 4000)

    const existing = activeMessages.get(key)
    if (existing) {
      existing.count += 1
      // 销毁旧消息并重建，让 naive-ui 的自动消失计时从最后一次追加重新开始
      existing.reactive.destroy()
      removeEntry(key)
      return createMessage(key, type, `${content} ×${existing.count}`, options, effectiveDuration, existing.count)
    }
    return createMessage(key, type, content, options, effectiveDuration)
  }

  function createMessage(
    key: string,
    type: LauncherMessageType,
    content: string,
    options: LauncherMessageOptions,
    effectiveDuration: number,
    count = 1
  ): MessageReactive {
    const nativeOptions: MessageOptions = {
      duration: effectiveDuration,
      closable: options.closable,
      onClose: () => {
        removeEntry(key)
        options.onClose?.()
      },
    }
    // show() 已对 !message 提前 return，此处 message 必非空
    const reactive = message![type](renderContent(content, options.title, options.onClick), nativeOptions)
    const entry: ActiveMessage = { key, reactive, count, timer: null }
    resetTimer(entry, effectiveDuration)
    activeMessages.set(key, entry)
    return new Proxy(reactive, {
      get(target, prop, receiver) {
        if (prop === 'destroy')
          return () => {
            removeEntry(key)
            target.destroy()
          }
        return Reflect.get(target, prop, receiver)
      },
    })
  }

  return {
    success: (content: string, options?: LauncherMessageArgument) => show('success', content, options),
    error: (content: string, options?: LauncherMessageArgument) => show('error', content, options),
    warning: (content: string, options?: LauncherMessageArgument) => show('warning', content, options),
    info: (content: string, options?: LauncherMessageArgument) => show('info', content, options),
    loading: (content: string, options?: LauncherMessageArgument) => show('loading', content, options),
    // 绕过抑制检查直接显示，供 unwrapResponse 的兜底通知使用
    errorRaw: (content: string, options?: LauncherMessageArgument) => show('error', content, options, true),
    clear: () => {
      activeMessages.forEach((entry) => {
        if (entry.timer) clearTimeout(entry.timer)
      })
      activeMessages.clear()
      message?.destroyAll()
    },
  }
}
