/**
 * plugin-sdk UI 工具函数
 * 提供创建 UI 元素、消息提示、对话框等快捷方法。
 * 插件开发者无需直接操作 DOM 即可构建前端界面。
 */

// ── 元素创建 ──

interface ElementOptions {
  class?: string | string[]
  id?: string
  style?: Partial<CSSStyleDeclaration>
  attrs?: Record<string, string>
  text?: string
  html?: string
  children?: (HTMLElement | string)[]
  events?: Record<string, (e: Event) => void>
}

/**
 * 创建 HTML 元素并设置属性。
 * 链式调用风格，简化 DOM 操作。
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions = {}
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)

  if (options.class) {
    const classes = Array.isArray(options.class) ? options.class : options.class.split(/\s+/)
    el.classList.add(...classes.filter(Boolean))
  }
  if (options.id) el.id = options.id
  if (options.text) el.textContent = options.text
  if (options.html) el.innerHTML = options.html
  if (options.style) {
    for (const [key, value] of Object.entries(options.style)) {
      if (value !== undefined) {
        (el.style as any)[key] = value
      }
    }
  }
  if (options.attrs) {
    for (const [key, value] of Object.entries(options.attrs)) {
      el.setAttribute(key, value)
    }
  }
  if (options.children) {
    for (const child of options.children) {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child))
      } else {
        el.appendChild(child)
      }
    }
  }
  if (options.events) {
    for (const [event, handler] of Object.entries(options.events)) {
      el.addEventListener(event, handler)
    }
  }

  return el
}

/**
 * 创建元素快捷方法集合
 */
export const $ = {
  div: (opts?: ElementOptions) => createElement('div', opts),
  span: (opts?: ElementOptions) => createElement('span', opts),
  button: (opts?: ElementOptions) => createElement('button', opts),
  input: (opts?: ElementOptions) => createElement('input', opts),
  a: (opts?: ElementOptions) => createElement('a', opts),
  p: (opts?: ElementOptions) => createElement('p', opts),
  h2: (opts?: ElementOptions) => createElement('h2', opts),
  h3: (opts?: ElementOptions) => createElement('h3', opts),
  img: (opts?: ElementOptions) => createElement('img', opts),
  label: (opts?: ElementOptions) => createElement('label', opts),
  select: (opts?: ElementOptions) => createElement('select', opts),
  option: (opts?: ElementOptions) => createElement('option', opts),
  textarea: (opts?: ElementOptions) => createElement('textarea', opts),
  section: (opts?: ElementOptions) => createElement('section', opts),
  pre: (opts?: ElementOptions) => createElement('pre', opts),
  code: (opts?: ElementOptions) => createElement('code', opts),
}

// ── 消息提示 ──

/**
 * 简单的消息提示系统。
 * 插件开发者可用此显示通知，无需依赖启动器的消息组件。
 */
export function showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration = 3000): void {
  const colors: Record<string, string> = {
    info: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  }

  const toast = createElement('div', {
    class: 'plugin-toast',
    style: {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '10px 20px',
      borderRadius: '8px',
      background: colors[type] || colors.info,
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '99999',
      opacity: '0',
      transition: 'opacity 200ms ease-out',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    },
    text: message,
  })

  document.body.appendChild(toast)
  requestAnimationFrame(() => {
    toast.style.opacity = '1'
  })

  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 200)
  }, duration)
}

// ── 确认对话框 ──

/**
 * 显示确认对话框。
 * 返回 Promise，用户确认后 resolve(true)，取消后 resolve(false)。
 */
export function showConfirm(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = createElement('div', {
      class: 'plugin-confirm-overlay',
      style: {
        position: 'fixed',
        inset: '0',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '99998',
      },
    })

    const dialog = createElement('div', {
      class: 'plugin-confirm-dialog',
      style: {
        background: 'var(--bg-elevated, #1e1e2e)',
        borderRadius: '12px',
        padding: '24px',
        minWidth: '320px',
        maxWidth: '420px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: '1px solid var(--border, rgba(255,255,255,0.1))',
      },
      children: [
        createElement('h3', {
          style: { margin: '0 0 12px', fontSize: '16px', color: 'var(--text-primary, #e0e0e0)' },
          text: title,
        }),
        createElement('p', {
          style: { margin: '0 0 20px', fontSize: '14px', color: 'var(--text-secondary, #a0a0a0)', lineHeight: '1.5' },
          text: message,
        }),
        createElement('div', {
          style: { display: 'flex', justifyContent: 'flex-end', gap: '8px' },
          children: [
            createElement('button', {
              text: '取消',
              style: {
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--border, rgba(255,255,255,0.1))',
                background: 'transparent',
                color: 'var(--text-secondary, #a0a0a0)',
                cursor: 'pointer',
                fontSize: '13px',
              },
              events: {
                click: () => { overlay.remove(); resolve(false) },
              },
            }),
            createElement('button', {
              text: '确认',
              style: {
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--primary, #3b82f6)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
              },
              events: {
                click: () => { overlay.remove(); resolve(true) },
              },
            }),
          ],
        }),
      ],
    })

    overlay.appendChild(dialog)
    document.body.appendChild(overlay)
  })
}

// ── 加载指示器 ──

/**
 * 创建加载指示器，返回 remove 函数。
 */
export function showLoading(container: HTMLElement, text = '加载中...'): () => void {
  const spinner = createElement('div', {
    class: 'plugin-loading',
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px',
      gap: '12px',
      color: 'var(--text-secondary, #a0a0a0)',
      fontSize: '14px',
    },
    children: [
      createElement('div', {
        style: {
          width: '28px',
          height: '28px',
          border: '3px solid var(--border, rgba(255,255,255,0.1))',
          borderTopColor: 'var(--primary, #3b82f6)',
          borderRadius: '50%',
          animation: 'plugin-spin 0.8s linear infinite',
        },
      }),
      createElement('span', { text }),
    ],
  })

  // 注入旋转动画
  if (!document.getElementById('plugin-spin-keyframes')) {
    const style = document.createElement('style')
    style.id = 'plugin-spin-keyframes'
    style.textContent = '@keyframes plugin-spin { to { transform: rotate(360deg) } }'
    document.head.appendChild(style)
  }

  container.appendChild(spinner)
  return () => spinner.remove()
}

// ── 空状态 ──

/**
 * 创建空状态占位。
 */
export function showEmpty(container: HTMLElement, text = '暂无数据', icon = '📦'): void {
  const empty = createElement('div', {
    class: 'plugin-empty',
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      gap: '12px',
      color: 'var(--text-tertiary, #666)',
    },
    children: [
      createElement('div', { style: { fontSize: '40px' }, text: icon }),
      createElement('p', { style: { margin: '0', fontSize: '14px' }, text }),
    ],
  })
  container.appendChild(empty)
}

// ── 插槽渲染 ──

/**
 * 获取插槽容器元素。
 * 插槽名对应后端 inject_html 的 slot 参数。
 */
export function getSlot(id: string): HTMLElement | null {
  return document.getElementById(`plugin-slot-${id}`)
}

/**
 * 清空插槽内容。
 */
export function clearSlot(id: string): void {
  const el = getSlot(id)
  if (el) el.innerHTML = ''
}

// ── iframe 桥接 ──

interface IframeBridgeOptions {
  /** iframe 的选择器，如 '.mouse-effect-iframe' */
  selector: string
  /** 配置更新回调，接收 iframe 和新配置值 */
  onConfigUpdate?: (iframe: HTMLIFrameElement, config: Record<string, any>) => void
  /** 鼠标事件类型，默认转发 mousedown/mousemove/mouseup */
  mouseEvents?: string[]
  /** 是否在 iframe 加载完成后自动调用 onConfigUpdate */
  autoConfig?: boolean
}

/**
 * 创建通用的 iframe 桥接。
 * 自动监听 DOM 中指定 iframe 的增删，转发鼠标事件，处理配置更新。
 * 返回 destroy 函数用于清理。
 *
 * 使用示例:
 *   const bridge = createIframeBridge({
 *     selector: '.my-effect-iframe',
 *     onConfigUpdate: (iframe, config) => {
 *       iframe.contentWindow?.postMessage({ type: 'config', ...config }, '*')
 *     }
 *   })
 *   // 插件卸载时: bridge.destroy()
 */
export function createIframeBridge(options: IframeBridgeOptions): { destroy: () => void } {
  const selector = options.selector
  const mouseEvents = options.mouseEvents || ['mousedown', 'mousemove', 'mouseup']
  const cleanupFns: (() => void)[] = []
  let observer: MutationObserver | null = null
  let destroyed = false

  function forwardEvent(iframe: HTMLIFrameElement, e: MouseEvent, type: string) {
    const rect = iframe.getBoundingClientRect()
    const targetOrigin = iframe.src ? new URL(iframe.src).origin : window.location.origin
    iframe.contentWindow?.postMessage({
      type: 'mouse',
      eventType: type,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }, targetOrigin)
  }

  function setupIframe(iframe: HTMLIFrameElement) {
    if (iframe.dataset.bridgeAttached === '1') return
    iframe.dataset.bridgeAttached = '1'

    const handlers: { event: string; fn: (e: Event) => void }[] = []
    for (const eventType of mouseEvents) {
      const fn = (e: Event) => forwardEvent(iframe, e as MouseEvent, eventType)
      window.addEventListener(eventType, fn)
      handlers.push({ event: eventType, fn })
    }

    cleanupFns.push(() => {
      for (const { event, fn } of handlers) {
        window.removeEventListener(event, fn)
      }
    })

    if (options.onConfigUpdate) {
      iframe.addEventListener('load', () => {
        if (destroyed) return
        options.onConfigUpdate?.(iframe, {})
      }, { once: true })
    }
  }

  function updateConfig(config: Record<string, any>) {
    if (!options.onConfigUpdate) return
    const iframes = document.querySelectorAll(selector)
    for (const el of iframes) {
      options.onConfigUpdate(el as HTMLIFrameElement, config)
    }
  }

  function handleMutations() {
    if (destroyed) return
    const iframes = document.querySelectorAll(selector)
    for (const el of iframes) {
      setupIframe(el as HTMLIFrameElement)
    }
  }

  // 监听 DOM 变化
  observer = new MutationObserver((mutations) => {
    if (destroyed) return
    for (const mutation of mutations) {
      for (const node of mutation.removedNodes) {
        if (node instanceof HTMLElement && (node.matches(selector) || node.querySelector(selector))) {
          cleanupFns.forEach(fn => fn())
          cleanupFns.length = 0
        }
      }
    }
    handleMutations()
  })

  observer.observe(document.body, { childList: true, subtree: true })

  // 检查已有 iframe
  handleMutations()

  return {
    destroy() {
      destroyed = true
      cleanupFns.forEach(fn => fn())
      cleanupFns.length = 0
      observer?.disconnect()
      observer = null
    },
    // 内部暴露供事件系统调用
    _updateConfig: updateConfig,
  }
}