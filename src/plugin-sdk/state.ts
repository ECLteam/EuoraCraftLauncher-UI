// 插件可读取的只读全局状态

import { ref, readonly, watch, type DeepReadonly, type Ref } from 'vue'
import backend from '@/api/client'
import type { AccountListData, LauncherConfig, MinecraftAccount, ThemeConfig } from '@/types/api'
import type { AccountState, LauncherState, ThemeState } from './types'

const themeState = ref<ThemeState>({
  mode: 'system',
  isDark: false,
  primaryColor: '#4A7FD9',
  backgroundImage: '',
  backgroundOpacity: 0.2,
})

const launcherState = ref<LauncherState>({
  version: '',
  versionType: 'dev',
  devMode: false,
})

const accountState = ref<AccountState>({
  current: null,
  list: [],
})

let initialized = false
const unlistenFns: (() => void)[] = []

function syncTheme(ui: Partial<ThemeConfig> & { background_opacity?: number }): void {
  themeState.value.mode = ui.mode || 'system'
  themeState.value.primaryColor = ui.primary_color || '#4A7FD9'
  themeState.value.backgroundOpacity = typeof ui.background_opacity === 'number' ? ui.background_opacity : 0.2
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  themeState.value.isDark = ui.mode === 'dark' || (ui.mode === 'system' && prefersDark)
}

function syncAccounts(data: AccountListData): void {
  accountState.value.list = data.accounts || []
  accountState.value.current = data.current
}

export function initPluginState(): () => void {
  if (initialized) return () => {}
  initialized = true

  const unlistenConfig = backend.on('config:init', (payload) => {
    if (payload.launcher) {
      const launcher = payload.launcher as LauncherConfig
      launcherState.value.version = launcher.version || ''
      launcherState.value.versionType = launcher.version_type || 'dev'
      launcherState.value.devMode = launcher.debug === true
    }
    if (payload.ui) {
      syncTheme(payload.ui as Partial<ThemeConfig> & { background_opacity?: number })
    }
  })

  const unlistenAccount = backend.on('accounts_changed', (payload) => {
    if (payload && typeof payload === 'object' && 'accounts' in payload) {
      syncAccounts(payload as AccountListData)
    }
  })

  unlistenFns.push(unlistenConfig, unlistenAccount)

  backend.command('accounts_list').then(res => {
    if (res.success && res.data) syncAccounts(res.data)
  }).catch(() => {})

  return () => {
    for (const fn of unlistenFns) fn()
    unlistenFns.length = 0
    initialized = false
  }
}

function createReadonlyState<T extends object>(source: Ref<T>): DeepReadonly<Ref<T>> {
  return readonly(source) as DeepReadonly<Ref<T>>
}

export function getThemeState(): DeepReadonly<Ref<ThemeState>> {
  return createReadonlyState(themeState)
}

export function getLauncherState(): DeepReadonly<Ref<LauncherState>> {
  return createReadonlyState(launcherState)
}

export function getAccountState(): DeepReadonly<Ref<AccountState>> {
  return createReadonlyState(accountState)
}

export function watchTheme(cb: (state: ThemeState) => void): () => void {
  return watch(themeState, cb, { deep: true, immediate: true })
}

export function watchLauncher(cb: (state: LauncherState) => void): () => void {
  return watch(launcherState, cb, { deep: true, immediate: true })
}

export function watchAccount(cb: (state: AccountState) => void): () => void {
  return watch(accountState, cb, { deep: true, immediate: true })
}

export function refreshAccounts(): Promise<void> {
  return backend.command('accounts_list').then(res => {
    if (res.success && res.data) syncAccounts(res.data)
  }).catch(() => {})
}
