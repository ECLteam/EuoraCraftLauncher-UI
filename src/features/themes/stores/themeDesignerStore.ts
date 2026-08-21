import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import backend from '@/api/client'
import { useTheme } from '@/composables/useTheme'
import { windowApi } from '@/features/windows/api/windowApi'
import type {
  ApiResponse,
  ThemeDesignSessionSnapshot,
  ThemePatchOperation,
  ThemePresetV1,
  ThemeSelection,
  ThemeSlotHostSnapshot,
} from '@/types/api'
import { themeApi } from '../api/themeApi'
import { applyThemePreset, clearThemePreview, registerThemeExtensions } from '../runtime/themeRuntime'

function applyPrimary(preset: ThemePresetV1): void {
  const primary = preset.tokens.primary
  if (typeof primary === 'string' && /^#[0-9a-f]{6}$/i.test(primary)) useTheme().setPrimaryColor(primary)
}

async function applyResources(preset: ThemePresetV1): Promise<void> {
  const backgroundAsset = typeof preset.background.asset === 'string' ? preset.background.asset : null
  if (backgroundAsset) {
    const descriptor = preset.assets[backgroundAsset]
    if (descriptor?.path) {
      try {
        const resource = await themeApi.asset(preset.id, descriptor.path)
        document.documentElement.style.setProperty('--bg-image', `url("${resource.dataUrl}")`)
      } catch {
        document.documentElement.style.removeProperty('--bg-image')
      }
    }
  }
  const fontAsset = typeof preset.tokens.fontAsset === 'string' ? preset.tokens.fontAsset : null
  if (fontAsset) {
    const descriptor = preset.assets[fontAsset]
    if (descriptor?.path?.endsWith('.woff2')) {
      try {
        const resource = await themeApi.asset(preset.id, descriptor.path)
        let style = document.getElementById('ecl-theme-font') as HTMLStyleElement | null
        if (!style) {
          style = document.createElement('style')
          style.id = 'ecl-theme-font'
          document.head.appendChild(style)
        }
        style.textContent = `@font-face{font-family:"ECL Theme Font";src:url("${resource.dataUrl}") format("woff2");font-display:swap}`
        document.documentElement.style.setProperty('--ecl-font-body', '"ECL Theme Font"')
      } catch {
        /* 缺失资源时保持系统字体 */
      }
    }
  }
}

export const useThemeDesignerStore = defineStore('theme-designer', () => {
  const session = ref<ThemeDesignSessionSnapshot | null>(null)
  const activePreset = ref<ThemePresetV1 | null>(null)
  const isDesigning = ref(false)
  const isPicking = ref(false)
  const studioEmbedded = ref(false)
  const showSlots = ref(false)
  const busy = ref(false)
  const error = ref('')
  let listening = false
  let themeObserver: MutationObserver | null = null
  const cleanups: Array<() => void> = []
  const ignoredWindowClosures = new Set<string>()

  const selected = computed(() => session.value?.selection ?? null)
  const dirty = computed(() => session.value?.dirty === true)

  function acceptSnapshot(snapshot: ThemeDesignSessionSnapshot): void {
    if (session.value?.sessionId === snapshot.sessionId && snapshot.revision < session.value.revision) return
    session.value = snapshot
    isDesigning.value = true
    showSlots.value = snapshot.showSlots === true
    applyThemePreset(snapshot.draft)
    applyPrimary(snapshot.draft)
    void applyResources(snapshot.draft)
  }

  function listen(): void {
    if (listening || !backend.runtime.isAvailable) return
    listening = true
    for (const event of [
      'theme:design_changed',
      'theme:selection_changed',
      'theme:overlay_changed',
      'theme:preview_changed',
      'theme:design_committed',
    ] as const) {
      cleanups.push(backend.on(event, acceptSnapshot))
    }
    cleanups.push(
      backend.on('theme:activated', ({ preset }) => {
        activePreset.value = preset
        if (!isDesigning.value) {
          applyThemePreset(preset)
          applyPrimary(preset)
          void applyResources(preset)
        }
      }),
      backend.on('theme:design_discarded', ({ sessionId }) => {
        if (session.value?.sessionId !== sessionId) return
        session.value = null
        isDesigning.value = false
        isPicking.value = false
        studioEmbedded.value = false
        if (activePreset.value) {
          applyThemePreset(activePreset.value)
          void applyResources(activePreset.value)
        } else clearThemePreview()
      }),
      backend.on('window:closed', (metadata) => {
        if (metadata.label && ignoredWindowClosures.delete(metadata.label)) return
        const current = session.value
        if (!current || metadata.windowType !== 'theme-studio' || metadata.sessionId !== current.sessionId) return
        const id = current.sessionId
        isDesigning.value = false
        isPicking.value = false
        studioEmbedded.value = false
        void themeApi.discard(id, true).catch(() => {})
        session.value = null
      }),
      backend.on('plugin:status_changed', () => {
        void loadExtensions()
      })
    )
  }

  async function initialize(): Promise<void> {
    listen()
    await loadExtensions()
    if (!themeObserver) {
      themeObserver = new MutationObserver(() => {
        const preset = session.value?.draft ?? activePreset.value
        if (preset) applyThemePreset(preset)
      })
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    }
    if (!backend.runtime.isAvailable) return
    try {
      activePreset.value = await themeApi.active()
      if (!isDesigning.value) {
        applyThemePreset(activePreset.value)
        applyPrimary(activePreset.value)
        void applyResources(activePreset.value)
      }
    } catch {
      // 展示模式或旧后端没有主题协议时继续使用兼容主题。
    }
  }

  async function loadExtensions(): Promise<void> {
    try {
      const response = await backend.command('theme_extensions')
      if (response.success && response.data) {
        registerThemeExtensions(response.data.effects)
        const preset = session.value?.draft ?? activePreset.value
        if (preset) applyThemePreset(preset)
      }
    } catch {
      registerThemeExtensions([])
    }
  }

  async function start(presetId?: string): Promise<void> {
    busy.value = true
    error.value = ''
    try {
      listen()
      ignoredWindowClosures.clear()
      acceptSnapshot(await themeApi.start(presetId, true))
      const sessionId = session.value!.sessionId
      let openedLabel: string | null = null
      try {
        const opened = await windowApi.open('theme-studio', session.value?.sessionId)
        openedLabel = opened.label
        await waitForWindowReady(opened.label)
        await windowApi.focus(opened.label)
        studioEmbedded.value = false
      } catch (reason) {
        if (openedLabel) {
          ignoredWindowClosures.add(openedLabel)
          await windowApi.close(openedLabel).catch(() => ignoredWindowClosures.delete(openedLabel!))
          acceptSnapshot(await themeApi.get(sessionId))
        }
        if (backend.runtime.isShowcase) {
          // Showcase/Web 环境没有原生窗口，继续复用相同会话协议进行演示。
          studioEmbedded.value = true
          isPicking.value = true
          return
        }
        await themeApi.discard(sessionId, true).catch(() => {})
        session.value = null
        isDesigning.value = false
        isPicking.value = false
        studioEmbedded.value = false
        if (activePreset.value) applyThemePreset(activePreset.value)
        throw new Error(reason instanceof Error ? `无法打开独立主题设计控制台：${reason.message}` : String(reason))
      }
      isPicking.value = true
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : String(reason)
      throw reason
    } finally {
      busy.value = false
    }
  }

  async function waitForWindowReady(label: string, timeout = 15000): Promise<void> {
    let resolveReady: (() => void) | undefined
    const event = new Promise<void>((resolve) => {
      resolveReady = resolve
    })
    const stop = backend.on('window:ready', (metadata) => {
      if (metadata.label === label) resolveReady?.()
    })
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const windows = await windowApi.list()
      if (windows.some((item) => item.label === label && item.ready)) return
      await Promise.race([
        event,
        new Promise<never>((_, reject) => {
          timer = globalThis.setTimeout(() => reject(new Error('等待设计控制台加载超时')), timeout)
        }),
      ])
    } finally {
      stop()
      if (timer) globalThis.clearTimeout(timer)
    }
  }

  async function attach(sessionId: string): Promise<void> {
    listen()
    acceptSnapshot(await themeApi.get(sessionId))
  }

  async function select(selection: ThemeSelection): Promise<void> {
    if (!session.value) return
    acceptSnapshot(await themeApi.select(session.value.sessionId, selection))
  }

  async function resolveRevisionResponse(
    response: ApiResponse<ThemeDesignSessionSnapshot>,
    retry?: () => Promise<ApiResponse<ThemeDesignSessionSnapshot>>
  ): Promise<void> {
    if (response.success && response.data) {
      acceptSnapshot(response.data)
      return
    }
    if (response.errorCode === 'THEME_REVISION_CONFLICT' && response.data) {
      acceptSnapshot(response.data)
      if (retry) {
        const next = await retry()
        if (next.success && next.data) {
          acceptSnapshot(next.data)
          return
        }
      }
    }
    throw new Error(response.message || '主题设计操作失败')
  }

  async function patch(operations: ThemePatchOperation[]): Promise<void> {
    if (!session.value || operations.length === 0) return
    const sessionId = session.value.sessionId
    const response = await themeApi.patch(sessionId, session.value.revision, operations)
    await resolveRevisionResponse(response, () => themeApi.patch(sessionId, session.value!.revision, operations))
  }

  async function undo(): Promise<void> {
    if (!session.value?.canUndo) return
    const id = session.value.sessionId
    await resolveRevisionResponse(await themeApi.undo(id, session.value.revision), () =>
      themeApi.undo(id, session.value!.revision)
    )
  }

  async function redo(): Promise<void> {
    if (!session.value?.canRedo) return
    const id = session.value.sessionId
    await resolveRevisionResponse(await themeApi.redo(id, session.value.revision), () =>
      themeApi.redo(id, session.value!.revision)
    )
  }

  async function commit(): Promise<void> {
    if (!session.value) return
    const snapshot = await themeApi.commit(session.value.sessionId)
    acceptSnapshot(snapshot)
    activePreset.value = snapshot.draft
  }

  async function saveAs(name: string): Promise<void> {
    if (!session.value) return
    const snapshot = await themeApi.saveAs(session.value.sessionId, name)
    acceptSnapshot(snapshot)
    activePreset.value = snapshot.draft
  }

  async function discard(keepRecovery = false): Promise<void> {
    if (!session.value) return
    await themeApi.discard(session.value.sessionId, keepRecovery)
    session.value = null
    isDesigning.value = false
    isPicking.value = false
    studioEmbedded.value = false
    if (activePreset.value) {
      applyThemePreset(activePreset.value)
      void applyResources(activePreset.value)
    }
  }

  function setScope(scope: ThemeSelection['scope']): void {
    if (selected.value) void select({ ...selected.value, scope })
  }

  function setPicking(value: boolean): void {
    isPicking.value = isDesigning.value && value
  }

  async function setShowSlots(value: boolean): Promise<void> {
    if (!session.value) return
    showSlots.value = value
    try {
      acceptSnapshot(await themeApi.setOverlay(session.value.sessionId, value))
    } catch (reason) {
      showSlots.value = !value
      error.value = reason instanceof Error ? reason.message : String(reason)
    }
  }

  async function syncSlotHosts(slotHosts: ThemeSlotHostSnapshot[]): Promise<void> {
    if (!session.value) return
    try {
      acceptSnapshot(await themeApi.setOverlay(session.value.sessionId, showSlots.value, slotHosts))
    } catch (reason) {
      error.value = reason instanceof Error ? reason.message : String(reason)
    }
  }

  function dispose(): void {
    cleanups.splice(0).forEach((cleanup) => cleanup())
    listening = false
    themeObserver?.disconnect()
    themeObserver = null
  }

  return {
    session,
    activePreset,
    isDesigning,
    isPicking,
    studioEmbedded,
    showSlots,
    busy,
    error,
    selected,
    dirty,
    initialize,
    start,
    attach,
    select,
    patch,
    undo,
    redo,
    commit,
    saveAs,
    discard,
    setScope,
    setPicking,
    setShowSlots,
    syncSlotHosts,
    dispose,
  }
})
