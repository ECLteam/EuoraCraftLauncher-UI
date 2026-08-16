import type { Ref } from 'vue'

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || !!target.closest('[contenteditable="true"]')
}

// 打开开发者工具的键盘入口：F12，以及 Ctrl+Shift+I/J/C、Ctrl+U
function isDevToolsShortcut(event: KeyboardEvent): boolean {
  if (event.key === 'F12') return true
  if (!(event.ctrlKey || event.metaKey)) return false
  if (event.key === 'U') return true
  return event.shiftKey && ['I', 'J', 'C'].includes(event.key)
}

export function installDesktopInteractionPolicy(isDevMode: Readonly<Ref<boolean>>): () => void {
  const onContextMenu = (event: MouseEvent) => {
    if (!isDevMode.value) event.preventDefault()
  }
  const onSelectStart = (event: Event) => {
    if (isDevMode.value || isEditable(event.target) || (event as MouseEvent).altKey) return
    event.preventDefault()
  }
  const onCopy = (event: ClipboardEvent) => {
    if (isDevMode.value || isEditable(event.target)) return
    event.preventDefault()
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (!isDevMode.value && isDevToolsShortcut(event)) event.preventDefault()
  }

  document.addEventListener('contextmenu', onContextMenu)
  document.addEventListener('selectstart', onSelectStart)
  document.addEventListener('copy', onCopy)
  document.addEventListener('keydown', onKeyDown)

  return () => {
    document.removeEventListener('contextmenu', onContextMenu)
    document.removeEventListener('selectstart', onSelectStart)
    document.removeEventListener('copy', onCopy)
    document.removeEventListener('keydown', onKeyDown)
  }
}
