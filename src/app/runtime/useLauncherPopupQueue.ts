import { computed, ref } from 'vue'
import type { LauncherPopupEvent, LauncherPopupLevel } from '@/types/api'

const LEGACY_DISMISSED_POPUPS_STORAGE_KEY = 'euoracraft-dismissed-popups'
export const DISMISSED_POPUPS_STORAGE_KEY = 'euoracraft-dismissed-popups-v2'
const MAX_DISMISSED_POPUPS = 100

export interface LauncherPopup extends LauncherPopupEvent {
  level: LauncherPopupLevel
  dismissible: boolean
  cacheable: boolean
  once: boolean
}

export function clearLauncherPopupCache(storage: Storage = localStorage): void {
  try {
    storage.removeItem(DISMISSED_POPUPS_STORAGE_KEY)
    storage.removeItem(LEGACY_DISMISSED_POPUPS_STORAGE_KEY)
  } catch {
    // Local storage may be unavailable; resetting backend data should still succeed.
  }
}

function readDismissedPopupIds(storage: Storage): Set<string> {
  try {
    const value = JSON.parse(storage.getItem(DISMISSED_POPUPS_STORAGE_KEY) ?? '[]')
    if (!Array.isArray(value)) return new Set()
    return new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))
  } catch {
    return new Set()
  }
}

function normalizePopup(payload: LauncherPopupEvent): LauncherPopup | null {
  const id = payload.id?.trim()
  const title = payload.title?.trim()
  const content = payload.content?.trim()
  if (!id || !title || !content) return null

  const level: LauncherPopupLevel = ['info', 'warning', 'critical'].includes(payload.level ?? '')
    ? (payload.level as LauncherPopupLevel)
    : 'info'

  return {
    id,
    title,
    content,
    level,
    dismissible: payload.dismissible !== false,
    cacheable: payload.cacheable === true || payload.once === true,
    once: payload.once === true,
  }
}

export function useLauncherPopupQueue(storage: Storage = localStorage) {
  const queue = ref<LauncherPopup[]>([])
  const dismissedPopupIds = readDismissedPopupIds(storage)

  const activePopup = computed<LauncherPopup | null>(() => queue.value[0] ?? null)
  const popupVisible = computed(() => activePopup.value !== null)

  function persistDismissedPopupIds(): void {
    try {
      storage.setItem(
        DISMISSED_POPUPS_STORAGE_KEY,
        JSON.stringify(Array.from(dismissedPopupIds).slice(-MAX_DISMISSED_POPUPS))
      )
    } catch {
      // Local storage may be unavailable; the popup can still be shown for this session.
    }
  }

  function enqueuePopup(payload: LauncherPopupEvent): void {
    const popup = normalizePopup(payload)
    if (!popup) return
    if (popup.cacheable && dismissedPopupIds.has(popup.id)) return
    if (queue.value.some((item) => item.id === popup.id)) return
    queue.value.push(popup)
  }

  function dismissActivePopup(remember = false): void {
    const popup = activePopup.value
    if (!popup) return
    if (popup.cacheable && remember) {
      dismissedPopupIds.delete(popup.id)
      dismissedPopupIds.add(popup.id)
      persistDismissedPopupIds()
    }
    queue.value.shift()
  }

  return {
    activePopup,
    popupVisible,
    enqueuePopup,
    dismissActivePopup,
  }
}
