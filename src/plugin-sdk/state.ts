// 插件可读取的只读全局状态

import { ref, readonly, watch, type DeepReadonly, type Ref } from 'vue'
import backend from '@/api/client'
import type { AccountState, LauncherState, ThemeState } from './types'
import type { AccountListData, LauncherConfig } from '@/types/api'

// ---- 工厂：统一 ref + readonly + watch + refresh 模板 ----

interface StateSlice<T> {
  state: Ref<T>
  getReadonly: () => DeepReadonly<Ref<T>>
  watch: (cb: (state: T) => void) => () => void
  refresh: () => Promise<void>
}

function createStateSlice<T>(
  initial: T,
  refreshFn?: (state: Ref<T>) => Promise<void>,
): StateSlice<T> {
  const state = ref(initial) as unknown as Ref<T>
  return {
    state,
    getReadonly: () => readonly(state) as DeepReadonly<Ref<T>>,
    watch: (cb: (state: T) => void) => watch(() => state.value, cb, { deep: true, immediate: true }),
    refresh: () => (refreshFn ? refreshFn(state) : Promise.resolve()),
  }
}

// ---- 同步函数 ----

interface ThemeConfigPayload {
  mode?: 'light' | 'dark' | 'system'
  primary_color?: string
  background_opacity?: number
}

function syncTheme(state: Ref<ThemeState>, ui: ThemeConfigPayload): void {
  if (ui.mode) state.value.mode = ui.mode
  if (ui.primary_color) state.value.primaryColor = ui.primary_color
  if (typeof ui.background_opacity === 'number') state.value.backgroundOpacity = ui.background_opacity
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  state.value.isDark = ui.mode === 'dark' || (ui.mode === 'system' && prefersDark)
}

function syncLauncher(state: Ref<LauncherState>, launcher: LauncherConfig): void {
  state.value.version = launcher.version || ''
  state.value.versionType = launcher.version_type || 'dev'
  state.value.devMode = launcher.debug === true
}

function syncAccounts(state: Ref<AccountState>, data: AccountListData): void {
  state.value.list = data.accounts || []
  state.value.current = data.current
}

// ---- Slices ----

const themeSlice = createStateSlice<ThemeState>({
  mode: 'system',
  isDark: false,
  primaryColor: '',
  backgroundImage: '',
  backgroundOpacity: 0,
}, (state) => {
  return backend.config.get<ThemeConfigPayload>('ui').then(res => {
    if (res.success && res.data) syncTheme(state, res.data)
  }).catch(() => {})
})

const launcherSlice = createStateSlice<LauncherState>({
  version: '',
  versionType: 'dev',
  devMode: false,
}, (state) => {
  return backend.config.get<LauncherConfig>('launcher').then(res => {
    if (res.success && res.data) syncLauncher(state, res.data)
  }).catch(() => {})
})

const accountSlice = createStateSlice<AccountState>({
  current: null,
  list: [],
}, (state) => {
  return backend.command('accounts_list').then(res => {
    if (res.success && res.data) syncAccounts(state, res.data as AccountListData)
  }).catch(() => {})
})

// ---- 初始化 ----

let initialized = false
const unlistenFns: (() => void)[] = []

export function initPluginState(): () => void {
  if (initialized) return () => {}
  initialized = true

  const unlistenConfig = backend.on('config:init', (payload) => {
    if (payload.launcher) {
      syncLauncher(launcherSlice.state, payload.launcher as LauncherConfig)
    }
    if (payload.ui) {
      syncTheme(themeSlice.state, payload.ui as ThemeConfigPayload)
    }
  })

  const unlistenAccount = backend.on('accounts_changed', (payload) => {
    if (payload && typeof payload === 'object' && 'accounts' in payload) {
      syncAccounts(accountSlice.state, payload as unknown as AccountListData)
    }
  })

  unlistenFns.push(unlistenConfig, unlistenAccount)

  accountSlice.refresh()

  return () => {
    for (const fn of unlistenFns) fn()
    unlistenFns.length = 0
    initialized = false
  }
}

// ---- 对外 API ----

export function getThemeState(): DeepReadonly<Ref<ThemeState>> {
  return themeSlice.getReadonly()
}

export function getLauncherState(): DeepReadonly<Ref<LauncherState>> {
  return launcherSlice.getReadonly()
}

export function getAccountState(): DeepReadonly<Ref<AccountState>> {
  return accountSlice.getReadonly()
}

export function watchTheme(cb: (state: ThemeState) => void): () => void {
  return themeSlice.watch(cb)
}

export function watchLauncher(cb: (state: LauncherState) => void): () => void {
  return launcherSlice.watch(cb)
}

export function watchAccount(cb: (state: AccountState) => void): () => void {
  return accountSlice.watch(cb)
}

export function refreshTheme(): Promise<void> {
  return themeSlice.refresh()
}

export function refreshLauncher(): Promise<void> {
  return launcherSlice.refresh()
}

export function refreshAccounts(): Promise<void> {
  return accountSlice.refresh()
}
