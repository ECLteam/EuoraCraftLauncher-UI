import { ref, readonly, provide, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import backend from '@/api/client'
import { i18n, supportedLocales } from '@/i18n'

// 前端配置分区默认值
const FRONTEND_CONFIG_DEFAULTS: Record<string, Record<string, any>> = {
  download: {
    mirror_source: 'official',
    download_threads: 4,
  },
  ui: {
    locale: 'zh-CN',
    background: { type: 'default', path: '', opacity: 0.2, blur: 0 },
    theme: {
      mode: 'system',
      primary_color: '#7aa8f0',
      blur_amount: 6,
      sidebar_collapsed: true,
      titlebar_hidden: true,
    },
    mouse_effect: {
      enabled: false,
      color: '45,175,255',
      scale: 1.5,
      opacity: 1.0,
      speed: 1.0,
    },
  },
}

// 确保前端配置分区完整
async function ensureFrontendConfig(data: Record<string, any>): Promise<void> {
  const updates: Record<string, Record<string, any>> = {}

  for (const [section, defaults] of Object.entries(FRONTEND_CONFIG_DEFAULTS)) {
    const existing = data[section]
    if (!existing || typeof existing !== 'object') {
      updates[section] = { ...defaults }
      continue
    }
    let changed = false
    const merged = { ...existing }
    for (const [key, val] of Object.entries(defaults)) {
      if (!(key in merged)) {
        merged[key] = val
        changed = true
      }
    }
    if (changed) {
      updates[section] = merged
    }
  }

  const entries = Object.entries(updates)
  if (entries.length === 0) return
  await Promise.all(entries.map(([section, value]) => backend.config.set(section, value).catch(() => {})))
  for (const [section, value] of entries) {
    data[section] = value
  }
  console.log('[AppInit] 前端配置已自动补全:', Object.keys(updates).join(', '))
}

export function useAppInit() {
  const { initTheme } = useTheme()
  const { locale } = useI18n()

  // 调试模式
  const isDevMode = ref(false)
  provide('devMode', readonly(isDevMode))

  // 全局配置缓存
  const globalGameConfig = ref<any>(null)
  provide('gameConfig', readonly(globalGameConfig) as Readonly<Ref<any>>)
  const globalDownloadConfig = ref<any>(null)
  provide('downloadConfig', readonly(globalDownloadConfig) as Readonly<Ref<any>>)

  const loadAllConfigs = async () => {
    if (!(window as any).__TAURI__?.pytauri) return

    try {
      console.log('[AppInit] 开始加载后端配置...')

      const allRes = await backend.config.getAll().catch(() => ({ success: false, data: null }))
      const data = allRes.success ? allRes.data ?? {} : {}

      await ensureFrontendConfig(data)

      const launcherRes = { success: true, data: data.launcher ?? null }
      const gameRes = { success: true, data: data.game ?? null }
      const downloadRes = { success: true, data: data.download ?? null }
      const uiRes = { success: true, data: data.ui ?? null }
      const mouseEffectRes = { success: true, data: data.ui?.mouse_effect ?? null }

      if (launcherRes.success && launcherRes.data) {
        isDevMode.value = launcherRes.data.debug === true
        console.log('[AppInit] 启动器配置加载成功:', launcherRes.data)
      }

      if (gameRes.success && gameRes.data) {
        globalGameConfig.value = gameRes.data
        console.log('[AppInit] 游戏配置加载成功:', gameRes.data)
      }

      if (downloadRes.success && downloadRes.data) {
        globalDownloadConfig.value = downloadRes.data
        console.log('[AppInit] 下载配置加载成功:', downloadRes.data)
      }

      if (uiRes.success && uiRes.data?.locale) {
        const loc = uiRes.data.locale
        if (supportedLocales.some(l => l.code === loc)) {
          i18n.global.locale.value = loc as any
          document.documentElement.setAttribute('lang', loc)
          console.log('[AppInit] 语言配置加载成功:', loc)
        }
      }

      console.log('[AppInit] 所有配置加载完成')

      return { uiRes, mouseEffectRes }
    } catch (error) {
      console.error('[AppInit] 配置加载失败:', error)
      return { uiRes: { success: false, data: null }, mouseEffectRes: { success: false, data: null } }
    }
  }

  const init = async () => {
    if ((window as any).__TAURI__?.pytauri) {
      const { uiRes, mouseEffectRes } = await loadAllConfigs()
      await initTheme(uiRes)
      return { uiRes, mouseEffectRes }
    } else {
      console.warn('[AppInit] PyTauri API 不可用，尝试使用本地配置')
      await initTheme()
      return { uiRes: { success: false, data: null }, mouseEffectRes: { success: false, data: null } }
    }
  }

  return {
    isDevMode,
    globalGameConfig,
    globalDownloadConfig,
    loadAllConfigs,
    init,
  }
}
