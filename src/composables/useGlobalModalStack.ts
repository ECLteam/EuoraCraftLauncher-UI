import { computed, ref } from 'vue'

export const GLOBAL_MODAL_PRIORITY = {
  automaticUpdate: 60,
  launcherInfo: 70,
  interactive: 80,
  launcherWarning: 75,
  launcherCritical: 90,
  agreement: 95,
  error: 100,
} as const

type GlobalModalKind = 'modal' | 'blocker'

interface GlobalModalEntry {
  id: string
  kind: GlobalModalKind
  priority: number
  sequence: number
  title: string
  isFullscreen: boolean
  lockScroll: boolean
  onRequestClose?: () => void
}

export interface GlobalModalRegistration {
  id: string
  title?: string
  priority?: number
  isFullscreen?: boolean
  lockScroll?: boolean
  onRequestClose?: () => void
}

function normalizePriority(priority: number | undefined): number {
  if (!Number.isFinite(priority)) return GLOBAL_MODAL_PRIORITY.interactive
  return Math.max(0, Math.min(100, Math.round(priority ?? GLOBAL_MODAL_PRIORITY.interactive)))
}

/**
 * 创建应用级模态框栈。
 *
 * 所有基于 Modal 与 FullscreenModal 的阻塞式界面都在此注册；协调器只激活
 * 优先级最高的一个，同级按最后打开者优先。其余调用方仍保留 visible 状态，
 * 因此当前模态框关闭后可自然恢复，无需业务组件彼此感知。
 */
export function createGlobalModalStack() {
  const entries = ref<GlobalModalEntry[]>([])
  let nextSequence = 0

  const activeEntry = computed<GlobalModalEntry | null>(() => {
    if (entries.value.length === 0) return null
    return (
      [...entries.value].sort((left, right) => {
        if (right.priority !== left.priority) return right.priority - left.priority
        return right.sequence - left.sequence
      })[0] ?? null
    )
  })
  const activeModalId = computed(() => (activeEntry.value?.kind === 'modal' ? activeEntry.value.id : null))
  const isScrollLocked = computed(() => activeEntry.value?.kind === 'modal' && activeEntry.value.lockScroll)
  const isFullscreenActive = computed(() => activeEntry.value?.kind === 'modal' && activeEntry.value.isFullscreen)
  const activeTitle = computed(() => (isFullscreenActive.value ? (activeEntry.value?.title ?? '') : ''))

  function register(registration: GlobalModalRegistration): void {
    const existing = entries.value.find((entry) => entry.id === registration.id)
    const entry: GlobalModalEntry = {
      id: registration.id,
      kind: 'modal',
      priority: normalizePriority(registration.priority),
      sequence: existing?.sequence ?? nextSequence++,
      title: registration.title?.trim() ?? '',
      isFullscreen: registration.isFullscreen === true,
      lockScroll: registration.lockScroll !== false,
      onRequestClose: registration.onRequestClose,
    }
    entries.value = [...entries.value.filter((candidate) => candidate.id !== entry.id), entry]
  }

  function unregister(id: string): void {
    entries.value = entries.value.filter((entry) => entry.id !== id)
  }

  function unregisterFullscreen(id: string): void {
    const target = entries.value.find((entry) => entry.id === id && entry.isFullscreen)
    if (!target) return
    const removed = entries.value.filter((entry) => entry.isFullscreen && entry.sequence >= target.sequence)
    entries.value = entries.value.filter((entry) => !removed.includes(entry))
    removed
      .filter((entry) => entry.id !== id)
      .sort((left, right) => right.sequence - left.sequence)
      .forEach((entry) => entry.onRequestClose?.())
  }

  function addBlocker(id: string, priority: number = GLOBAL_MODAL_PRIORITY.interactive): void {
    const existing = entries.value.find((entry) => entry.id === id)
    const entry: GlobalModalEntry = {
      id,
      kind: 'blocker',
      priority: normalizePriority(priority),
      sequence: existing?.sequence ?? nextSequence++,
      title: '',
      isFullscreen: false,
      lockScroll: false,
    }
    entries.value = [...entries.value.filter((candidate) => candidate.id !== id), entry]
  }

  function closeActive(): void {
    const entry = activeEntry.value
    if (!entry || entry.kind !== 'modal') return
    unregister(entry.id)
    entry.onRequestClose?.()
  }

  function reset(): void {
    const closers = entries.value
      .filter((entry) => entry.kind === 'modal')
      .sort((left, right) => right.sequence - left.sequence)
      .map((entry) => entry.onRequestClose)
    entries.value = []
    closers.forEach((close) => close?.())
  }

  function resetFullscreen(): void {
    const removed = entries.value.filter((entry) => entry.isFullscreen)
    entries.value = entries.value.filter((entry) => !entry.isFullscreen)
    removed.sort((left, right) => right.sequence - left.sequence).forEach((entry) => entry.onRequestClose?.())
  }

  return {
    activeModalId,
    activeTitle,
    isScrollLocked,
    isFullscreenActive,
    register,
    unregister,
    unregisterFullscreen,
    addBlocker,
    closeActive,
    reset,
    resetFullscreen,
  }
}

/** 全局单例：所有应用模态框共用同一仲裁状态。 */
export const globalModalStack = createGlobalModalStack()

export function useGlobalModalStack() {
  return globalModalStack
}
