import { computed, ref } from 'vue'
import type { LauncherPopupEvent, LauncherPopupLevel, LauncherPopupSource } from '@/types/system'

const LEGACY_DISMISSED_POPUPS_STORAGE_KEY = 'euoracraft-dismissed-popups'
export const DISMISSED_POPUPS_STORAGE_KEY = 'euoracraft-dismissed-popups-v2'
const MAX_DISMISSED_POPUPS = 100

/** 插件弹窗可用的最高优先级（含），更高区段保留给启动器。 */
export const PLUGIN_PRIORITY_MAX = 60
/** 启动器保留的优先级区段下限，插件来源的优先级一律不超过该值减一。 */
export const LAUNCHER_PRIORITY_MIN = 70
/** 两个相邻弹窗之间的最小过渡间隔。 */
export const POPUP_TRANSITION_MS = 2000

/** 各来源各等级未显式指定 priority 时的默认值。 */
const DEFAULT_PRIORITY: Record<LauncherPopupSource, Record<LauncherPopupLevel, number>> = {
  launcher: { info: LAUNCHER_PRIORITY_MIN, warning: 75, critical: 90 },
  plugin: { info: 20, warning: 40, critical: 50 },
}

export interface LauncherPopup extends LauncherPopupEvent {
  level: LauncherPopupLevel
  priority: number
  source: LauncherPopupSource
  dismissible: boolean
  cacheable: boolean
  once: boolean
  /** 入队序号，用于同优先级时保持先进先出。 */
  seq: number
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

function normalizePriority(
  payload: LauncherPopupEvent,
  level: LauncherPopupLevel,
  source: LauncherPopupSource
): number {
  const fallback = DEFAULT_PRIORITY[source][level]
  const raw =
    typeof payload.priority === 'number' && Number.isFinite(payload.priority) ? Math.round(payload.priority) : fallback
  // 插件来源优先级钳制在低区段，高区段无条件保留给启动器。
  return source === 'plugin' ? Math.max(0, Math.min(PLUGIN_PRIORITY_MAX, raw)) : Math.max(0, Math.min(100, raw))
}

function normalizePopup(payload: LauncherPopupEvent, seq: number): LauncherPopup | null {
  const id = payload.id?.trim()
  const title = payload.title?.trim()
  const content = payload.content?.trim()
  if (!id || !title || !content) return null

  const level: LauncherPopupLevel = ['info', 'warning', 'critical'].includes(payload.level ?? '')
    ? (payload.level as LauncherPopupLevel)
    : 'info'
  const source: LauncherPopupSource = payload.source === 'plugin' ? 'plugin' : 'launcher'

  return {
    id,
    title,
    content,
    level,
    priority: normalizePriority(payload, level, source),
    source,
    dismissible: payload.dismissible !== false,
    cacheable: payload.cacheable === true || payload.once === true,
    once: payload.once === true,
    errorId: payload.errorId?.trim() || undefined,
    detail: payload.detail?.trim() || undefined,
    kind: payload.kind,
    crash: payload.kind === 'game_crash' ? payload.crash : undefined,
    seq,
  }
}

export function useLauncherPopupQueue(storage: Storage = localStorage) {
  const queue = ref<LauncherPopup[]>([])
  const dismissedPopupIds = readDismissedPopupIds(storage)
  // 过渡期内不显示任何弹窗，避免关闭动画尚未结束就叠出下一个。
  const inTransition = ref(false)
  let transitionTimer: ReturnType<typeof setTimeout> | null = null
  let nextSeq = 0

  const activePopup = computed<LauncherPopup | null>(() => (inTransition.value ? null : (queue.value[0] ?? null)))
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

  function scheduleTransition(): void {
    if (transitionTimer) clearTimeout(transitionTimer)
    if (queue.value.length === 0) {
      inTransition.value = false
      transitionTimer = null
      return
    }
    inTransition.value = true
    transitionTimer = setTimeout(() => {
      transitionTimer = null
      inTransition.value = false
    }, POPUP_TRANSITION_MS)
  }

  function enqueuePopup(payload: LauncherPopupEvent): void {
    const popup = normalizePopup(payload, nextSeq)
    if (!popup) return
    nextSeq += 1
    if (popup.cacheable && dismissedPopupIds.has(popup.id)) return
    if (queue.value.some((item) => item.id === popup.id)) return
    // 优先级高者先展示，同优先级按入队顺序（seq 递增）先进先出。
    const index = queue.value.findIndex((item) => item.priority < popup.priority)
    if (index === -1) queue.value.push(popup)
    else queue.value.splice(index, 0, popup)
  }

  function dismissActivePopup(remember = false): void {
    const popup = queue.value[0]
    if (!popup) return
    if (popup.cacheable && remember) {
      dismissedPopupIds.delete(popup.id)
      dismissedPopupIds.add(popup.id)
      persistDismissedPopupIds()
    }
    queue.value.shift()
    // 队列还有弹窗时进入过渡期，结束后才显示下一个。
    scheduleTransition()
  }

  return {
    activePopup,
    popupVisible,
    enqueuePopup,
    dismissActivePopup,
  }
}

/** 弹窗队列实例类型，供错误呈现层注入隔离实例（测试）。 */
export type LauncherPopupQueue = ReturnType<typeof useLauncherPopupQueue>

/** 全局单例：功能性失败/警告通知统一经由此队列入队展示。 */
export const launcherPopupQueue = useLauncherPopupQueue()

let notifySeq = 0

/**
 * 启动器通知弹窗的便捷入队方法，使用保留区段的高优先级。
 * id 仅需传语义前缀，序列号由内部附加，避免同毫秒入队被去重。
 */
export function notifyLauncherPopup(payload: Omit<LauncherPopupEvent, 'source'>): void {
  launcherPopupQueue.enqueuePopup({
    ...payload,
    id: `${payload.id}-${++notifySeq}`,
    source: 'launcher',
  })
}
