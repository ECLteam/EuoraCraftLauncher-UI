/**
 * 鼠标特效插件桥接层
 * 监听插件注入的 mouse-effect-iframe，自动设置鼠标事件转发和配置更新
 */
import backend from '@/api/client'

let observer: MutationObserver | null = null
let cleanupFns: (() => void)[] = []
let unlistenSettings: (() => void) | null = null

function setupIframeForwarding(iframe: HTMLIFrameElement) {
  const forwardEvent = (e: MouseEvent, type: string) => {
    const rect = iframe.getBoundingClientRect()
    iframe.contentWindow?.postMessage({
      type: 'mouse',
      eventType: type,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }, '*')
  }

  const onMouseDown = (e: MouseEvent) => forwardEvent(e, 'mousedown')
  const onMouseMove = (e: MouseEvent) => forwardEvent(e, 'mousemove')
  const onMouseUp = (e: MouseEvent) => forwardEvent(e, 'mouseup')

  window.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)

  cleanupFns.push(() => {
    window.removeEventListener('mousedown', onMouseDown)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  })
}

async function updateIframeConfig(iframe: HTMLIFrameElement) {
  try {
    const res = await backend.command('plugin_get_settings', { plugin_name: 'mouse_effect' })
    if (!res?.success || !res.data?.values) return

    const v = res.data.values
    const win = iframe.contentWindow as any
    if (win?.updateColor && v.color) {
      win.updateColor(v.color)
    }
    if (win?.updateEffectSettings) {
      win.updateEffectSettings(v.scale ?? 1.5, v.opacity ?? 1.0, v.speed ?? 1.0)
    }
  } catch {
    // 忽略配置读取失败
  }
}

function handleIframeAdded(iframe: HTMLIFrameElement) {
  setupIframeForwarding(iframe)

  // 等待 iframe 加载完成后更新配置
  iframe.addEventListener('load', () => updateIframeConfig(iframe), { once: true })
}

function handleSettingsChanged(payload: any) {
  if (payload?.plugin !== 'mouse_effect') return
  // 设置变更后，插件会重新注入 iframe，MutationObserver 会自动处理
  // 这里延迟一下等待 DOM 更新
  setTimeout(() => {
    const el = document.querySelector('.mouse-effect-iframe') as HTMLIFrameElement | null
    if (el && el.contentWindow) {
      updateIframeConfig(el)
    }
  }, 100)
}

export function initMouseEffectBridge() {
  // 监听插件设置变更事件
  unlistenSettings = backend.on('plugin:settings_changed', handleSettingsChanged)

  // 监听 DOM 中 mouse-effect-iframe 的增删
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // 检查是否有 node 被移除（可能是 iframe 被清理）
      for (const node of mutation.removedNodes) {
        if (node instanceof HTMLElement && (node.classList.contains('mouse-effect-iframe') || node.querySelector('.mouse-effect-iframe'))) {
          console.log('[MouseEffectBridge] iframe 已移除，清理鼠标事件监听')
          cleanupFns.forEach(fn => fn())
          cleanupFns = []
        }
      }
    }
    // 检查新增的 iframe
    const iframes = document.querySelectorAll('.mouse-effect-iframe')
    for (const el of iframes) {
      const iframe = el as HTMLIFrameElement
      if (!iframe.dataset.bridgeAttached) {
        iframe.dataset.bridgeAttached = '1'
        handleIframeAdded(iframe)
      }
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })

  // 检查是否已有 iframe（页面加载时插件已启用的情况）
  const existing = document.querySelector('.mouse-effect-iframe') as HTMLIFrameElement | null
  if (existing && !existing.dataset.bridgeAttached) {
    existing.dataset.bridgeAttached = '1'
    handleIframeAdded(existing)
  }
}

export function destroyMouseEffectBridge() {
  cleanupFns.forEach(fn => fn())
  cleanupFns = []
  observer?.disconnect()
  observer = null
  if (unlistenSettings) {
    unlistenSettings()
    unlistenSettings = null
  }
}