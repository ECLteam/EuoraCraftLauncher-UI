/**
 * plugin-sdk UI 工具函数
 * 提供创建 UI 元素、消息提示、对话框、模态框、通知、右键菜单等快捷方法。
 */

import { createElement, $ } from './dom'

export { createElement, $ }

// ── 消息提示 ──

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

// ── 模态框 ──

export interface ModalOptions {
  title?: string
  content: string | HTMLElement
  width?: string
  height?: string
  closable?: boolean
  footer?: HTMLElement
  onClose?: () => void
  className?: string
}

export function showModal(options: ModalOptions): { close: () => void; el: HTMLElement } {
  const overlay = createElement('div', {
    class: `plugin-modal-overlay ${options.className || ''}`,
    style: {
      position: 'fixed',
      inset: '0',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '99997',
    },
  })

  const modal = createElement('div', {
    class: 'plugin-modal',
    style: {
      background: 'var(--bg-elevated, #1e1e2e)',
      borderRadius: '12px',
      width: options.width || '480px',
      maxWidth: '90vw',
      maxHeight: options.height || '80vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      border: '1px solid var(--border, rgba(255,255,255,0.1))',
      overflow: 'hidden',
    },
  })

  const header = createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px',
      borderBottom: '1px solid var(--divider, rgba(255,255,255,0.06))',
    },
    children: [
      createElement('span', {
        style: { fontSize: '16px', fontWeight: '600', color: 'var(--text-primary, #e0e0e0)' },
        text: options.title || '',
      }),
    ],
  })

  if (options.closable !== false) {
    const closeBtn = createElement('button', {
      text: '✕',
      style: {
        background: 'none',
        border: 'none',
        color: 'var(--text-secondary, #a0a0a0)',
        cursor: 'pointer',
        fontSize: '16px',
        padding: '4px 8px',
        borderRadius: '4px',
      },
      events: {
        click: () => close(),
        mouseenter: (e) => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)' },
        mouseleave: (e) => { (e.target as HTMLElement).style.background = 'none' },
      },
    })
    header.appendChild(closeBtn)
  }

  const body = createElement('div', {
    style: {
      padding: '20px',
      overflow: 'auto',
      flex: '1',
      color: 'var(--text-primary, #e0e0e0)',
      fontSize: '14px',
      lineHeight: '1.6',
    },
  })

  if (typeof options.content === 'string') {
    body.innerHTML = options.content
  } else {
    body.appendChild(options.content)
  }

  modal.appendChild(header)
  modal.appendChild(body)

  if (options.footer) {
    const footer = createElement('div', {
      style: {
        padding: '12px 20px',
        borderTop: '1px solid var(--divider, rgba(255,255,255,0.06))',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '8px',
      },
    })
    footer.appendChild(options.footer)
    modal.appendChild(footer)
  }

  overlay.appendChild(modal)

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay && options.closable !== false) {
      close()
    }
  })

  document.body.appendChild(overlay)

  function close() {
    options.onClose?.()
    overlay.remove()
  }

  return { close, el: modal }
}

// ── 通知 ──

export interface NotificationOptions {
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  onClick?: () => void
}

export function showNotification(options: NotificationOptions): () => void {
  const colors: Record<string, { bg: string; border: string }> = {
    info: { bg: 'rgba(59,130,246,0.1)', border: '#3b82f6' },
    success: { bg: 'rgba(34,197,94,0.1)', border: '#22c55e' },
    warning: { bg: 'rgba(245,158,11,0.1)', border: '#f59e0b' },
    error: { bg: 'rgba(239,68,68,0.1)', border: '#ef4444' },
  }
  const c = colors[options.type || 'info'] ?? colors.info!

  const notification = createElement('div', {
    class: 'plugin-notification',
    style: {
      position: 'fixed',
      top: '48px',
      right: '20px',
      padding: '14px 18px',
      borderRadius: '10px',
      background: c.bg,
      borderLeft: `3px solid ${c.border}`,
      color: 'var(--text-primary, #e0e0e0)',
      fontSize: '13px',
      zIndex: '99996',
      minWidth: '280px',
      maxWidth: '400px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      cursor: options.onClick ? 'pointer' : 'default',
      transition: 'opacity 200ms, transform 200ms',
      opacity: '0',
      transform: 'translateX(20px)',
    },
    children: [
      createElement('div', {
        style: { fontWeight: '600', marginBottom: '4px', fontSize: '14px' },
        text: options.title,
      }),
      createElement('div', {
        style: { color: 'var(--text-secondary, #a0a0a0)', fontSize: '12px', lineHeight: '1.4' },
        text: options.message,
      }),
    ],
    events: options.onClick ? { click: options.onClick } : {},
  })

  document.body.appendChild(notification)
  requestAnimationFrame(() => {
    notification.style.opacity = '1'
    notification.style.transform = 'translateX(0)'
  })

  if (options.duration && options.duration > 0) {
    const timer = setTimeout(() => dismiss(), options.duration)
    const dismiss = () => {
      clearTimeout(timer)
      notification.style.opacity = '0'
      notification.style.transform = 'translateX(20px)'
      setTimeout(() => notification.remove(), 200)
    }
    return dismiss
  }

  return () => {
    notification.style.opacity = '0'
    notification.style.transform = 'translateX(20px)'
    setTimeout(() => notification.remove(), 200)
  }
}

// ── 右键菜单 ──

export interface ContextMenuItem {
  label: string
  icon?: string
  disabled?: boolean
  danger?: boolean
  divider?: boolean
  onClick?: () => void
  children?: ContextMenuItem[]
}

export function showContextMenu(
  x: number,
  y: number,
  items: ContextMenuItem[]
): { close: () => void } {
  const existing = document.querySelector('.plugin-context-menu')
  if (existing) existing.remove()

  const menu = createElement('div', {
    class: 'plugin-context-menu',
    style: {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      background: 'var(--bg-elevated, #1e1e2e)',
      borderRadius: '8px',
      border: '1px solid var(--border, rgba(255,255,255,0.1))',
      boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
      padding: '4px',
      zIndex: '99999',
      minWidth: '160px',
      fontSize: '13px',
    },
  })

  function buildItems(list: ContextMenuItem[]): HTMLElement[] {
    const els: HTMLElement[] = []
    for (const item of list) {
      if (item.divider) {
        els.push(createElement('div', {
          style: {
            height: '1px',
            background: 'var(--divider, rgba(255,255,255,0.06))',
            margin: '4px 8px',
          },
        }))
        continue
      }

      const itemEl = createElement('div', {
        class: 'plugin-context-menu-item',
        style: {
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: item.disabled ? 'not-allowed' : 'pointer',
          color: item.danger
            ? 'var(--danger, #ef4444)'
            : item.disabled
              ? 'var(--text-tertiary, #666)'
              : 'var(--text-primary, #e0e0e0)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: item.disabled ? '0.5' : '1',
        },
        children: [
          item.icon ? createElement('span', { text: item.icon, style: { fontSize: '14px' } }) : null,
          createElement('span', { text: item.label }),
        ].filter(Boolean) as HTMLElement[],
        events: item.disabled ? {} : {
          click: () => {
            item.onClick?.()
            close()
          },
          mouseenter: (e) => {
            if (!item.disabled) (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
          },
          mouseleave: (e) => {
            (e.target as HTMLElement).style.background = 'transparent'
          },
        },
      })

      els.push(itemEl)
    }
    return els
  }

  const children = buildItems(items)
  for (const child of children) {
    menu.appendChild(child)
  }

  document.body.appendChild(menu)

  const rect = menu.getBoundingClientRect()
  if (rect.right > window.innerWidth) {
    menu.style.left = `${x - rect.width}px`
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = `${y - rect.height}px`
  }

  function close() {
    menu.remove()
    document.removeEventListener('click', close, true)
  }

  setTimeout(() => {
    document.addEventListener('click', close, true)
  }, 0)

  return { close }
}

// ── 加载指示器 ──

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

export function getSlot(id: string): HTMLElement | null {
  return document.getElementById(`plugin-slot-${id}`)
}

export function clearSlot(id: string): void {
  const el = getSlot(id)
  if (el) el.innerHTML = ''
}

// ── iframe 桥接 ──

export interface IframeBridgeOptions {
  selector: string
  onConfigUpdate?: (iframe: HTMLIFrameElement, config: Record<string, unknown>) => void
  mouseEvents?: string[]
  autoConfig?: boolean
}

export interface IframeBridge {
  cleanup: () => void
  destroy: () => void
  updateConfig: (config: Record<string, unknown>) => void
}

export function createIframeBridge(options: IframeBridgeOptions): IframeBridge {
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

  function updateConfig(config: Record<string, unknown>) {
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
  handleMutations()

  const cleanup = () => {
    destroyed = true
    cleanupFns.forEach(fn => fn())
    cleanupFns.length = 0
    observer?.disconnect()
    observer = null
  }

  return {
    cleanup,
    destroy: cleanup,
    updateConfig,
  }
}

// ── 工具提示 ──

export function createTooltip(
  target: HTMLElement,
  content: string,
  position: 'top' | 'bottom' | 'left' | 'right' = 'top'
): () => void {
  let tooltip: HTMLElement | null = null

  function show() {
    if (tooltip) return
    tooltip = createElement('div', {
      class: 'plugin-tooltip',
      style: {
        position: 'fixed',
        padding: '6px 10px',
        borderRadius: '6px',
        background: 'var(--bg-elevated, #1e1e2e)',
        color: 'var(--text-primary, #e0e0e0)',
        fontSize: '12px',
        zIndex: '99999',
        border: '1px solid var(--border, rgba(255,255,255,0.1))',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        opacity: '0',
        transition: 'opacity 150ms',
      },
      text: content,
    })

    document.body.appendChild(tooltip)
    const rect = target.getBoundingClientRect()
    const ttRect = tooltip.getBoundingClientRect()

    const posMap = {
      top: { left: rect.left + rect.width / 2 - ttRect.width / 2, top: rect.top - ttRect.height - 8 },
      bottom: { left: rect.left + rect.width / 2 - ttRect.width / 2, top: rect.bottom + 8 },
      left: { left: rect.left - ttRect.width - 8, top: rect.top + rect.height / 2 - ttRect.height / 2 },
      right: { left: rect.right + 8, top: rect.top + rect.height / 2 - ttRect.height / 2 },
    }
    const pos = posMap[position]
    tooltip.style.left = `${pos.left}px`
    tooltip.style.top = `${pos.top}px`

    requestAnimationFrame(() => { if (tooltip) tooltip.style.opacity = '1' })
  }

  function hide() {
    if (tooltip) {
      tooltip.style.opacity = '0'
      setTimeout(() => { tooltip?.remove(); tooltip = null }, 150)
    }
  }

  target.addEventListener('mouseenter', show)
  target.addEventListener('mouseleave', hide)
  target.addEventListener('focus', show)
  target.addEventListener('blur', hide)

  return () => {
    target.removeEventListener('mouseenter', show)
    target.removeEventListener('mouseleave', hide)
    target.removeEventListener('focus', show)
    target.removeEventListener('blur', hide)
    hide()
  }
}
