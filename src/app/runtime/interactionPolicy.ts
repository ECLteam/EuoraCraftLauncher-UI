import type { Ref } from 'vue'

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || !!target.closest('[contenteditable="true"]')
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

  document.addEventListener('contextmenu', onContextMenu)
  document.addEventListener('selectstart', onSelectStart)
  document.addEventListener('copy', onCopy)

  return () => {
    document.removeEventListener('contextmenu', onContextMenu)
    document.removeEventListener('selectstart', onSelectStart)
    document.removeEventListener('copy', onCopy)
  }
}
