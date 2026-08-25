import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { pluginManagementApi } from '@/features/plugins/api/pluginManagementApi'
import type { PluginInfo, PluginSettingsData } from '@/types/plugins'

export const usePluginStore = defineStore('plugins', () => {
  const plugins = ref<PluginInfo[]>([])
  const loading = ref(false)
  const activeOperations = ref<string[]>([])
  const error = ref('')
  const settingsCache = ref<Record<string, PluginSettingsData>>({})
  let unlistenStatus: (() => void) | null = null
  let refreshTimer: ReturnType<typeof setTimeout> | null = null

  const reloadingPlugins = computed(() =>
    activeOperations.value.filter((operation) => operation.startsWith('reload:')).map((operation) => operation.slice(7))
  )

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      plugins.value = await pluginManagementApi.list()
    } catch (reason) {
      plugins.value = []
      error.value = reason instanceof Error ? reason.message : '读取插件失败'
      throw reason
    } finally {
      loading.value = false
    }
  }

  async function runOperation(operation: string, action: () => Promise<void>): Promise<void> {
    if (activeOperations.value.includes(operation)) return
    activeOperations.value = [...activeOperations.value, operation]
    try {
      await action()
      await load()
    } finally {
      activeOperations.value = activeOperations.value.filter((item) => item !== operation)
    }
  }

  function toggle(plugin: PluginInfo): Promise<void> {
    const action = plugin.status === 'enabled' ? pluginManagementApi.disable : pluginManagementApi.enable
    return runOperation(`toggle:${plugin.name}`, () => action(plugin.name))
  }

  function reload(pluginName: string): Promise<void> {
    return runOperation(`reload:${pluginName}`, () => pluginManagementApi.reload(pluginName))
  }

  function unload(pluginName: string): Promise<void> {
    return runOperation(`unload:${pluginName}`, () => pluginManagementApi.unload(pluginName))
  }

  async function install(): Promise<boolean> {
    const installed = await pluginManagementApi.installFromDirectory()
    if (installed) await load()
    return installed
  }

  async function getSettings(pluginName: string): Promise<PluginSettingsData> {
    const data = await pluginManagementApi.getSettings(pluginName)
    settingsCache.value = { ...settingsCache.value, [pluginName]: data }
    return data
  }

  async function updateSetting(pluginName: string, key: string, value: unknown): Promise<void> {
    await pluginManagementApi.updateSetting(pluginName, key, value)
    const cached = settingsCache.value[pluginName]
    if (cached) {
      settingsCache.value = {
        ...settingsCache.value,
        [pluginName]: { ...cached, values: { ...cached.values, [key]: value } },
      }
    }
  }

  function scheduleRefresh(): void {
    if (refreshTimer) clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => {
      void load().catch(() => {})
    }, 150)
  }

  async function start(): Promise<void> {
    if (!unlistenStatus) unlistenStatus = pluginManagementApi.onStatusChanged(scheduleRefresh)
    await load()
  }

  function stop(): void {
    if (refreshTimer) clearTimeout(refreshTimer)
    refreshTimer = null
    unlistenStatus?.()
    unlistenStatus = null
  }

  return {
    plugins,
    loading,
    activeOperations,
    reloadingPlugins,
    error,
    settingsCache,
    load,
    toggle,
    reload,
    unload,
    install,
    getSettings,
    updateSetting,
    start,
    stop,
  }
})
