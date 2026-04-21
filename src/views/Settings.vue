<template>
  <div class="settings-container" ref="mainRef">
    <UiTabs v-model="activeTab" :items="tabs" />
    
    <div class="settings-card">
      <div class="settings-content">
  
        <div v-show="activeTab === 'general'" class="tab-wrapper">
          <GeneralTab :settings="settings" @update:settings="handleUpdateSettings" />
        </div>
        <div v-show="activeTab === 'game'" class="tab-wrapper">
          <GameTab :settings="settings" @update:settings="handleUpdateSettings" />
        </div>
        <div v-show="activeTab === 'about'" class="tab-wrapper">
          <AboutTab />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, inject, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'
import UiTabs from '@/components/ui/Tabs.vue'
import GeneralTab from './settings/GeneralTab.vue'
import GameTab from './settings/GameTab.vue'
import AboutTab from './settings/AboutTab.vue'
import { api } from '@/api/client'
import { useTheme } from '@/composables/useTheme'
import type { GamePath } from '@/types/api'

const { t } = useI18n()
const { themeMode, primaryColor, blurAmount, backgroundImagePath, updateTheme } = useTheme()

// 从 App.vue 注入的全局配置（启动时已预加载）
const injectedGameConfig = inject<Readonly<Ref<any>>>('gameConfig', null as any)
const injectedDownloadConfig = inject<Readonly<Ref<any>>>('downloadConfig', null as any)

const mainRef = ref<HTMLElement | null>(null)
const activeTab = ref('general')

const tabs = computed(() => [
  { id: 'general', label: t('settings.general'), icon: 'icon-settings' },
  { id: 'game', label: t('settings.game'), icon: 'icon-game' },
  { id: 'about', label: t('settings.about'), icon: 'icon-info' }
])

// 从全局预加载配置计算初始游戏路径
const getInitialGamePath = () => {
  const paths = injectedGameConfig?.value?.minecraft_paths
  if (!paths?.length) return './.minecraft'
  const first = paths[0]
  return typeof first === 'string' ? first : first?.path ?? './.minecraft'
}

const settings = reactive({
  mode: themeMode.value,
  primaryColor: primaryColor.value,
  blurAmount: blurAmount.value,
  backgroundImage: backgroundImagePath.value,
  javaAutoSelect: injectedGameConfig?.value?.java_auto ?? true,
  javaPath: injectedGameConfig?.value?.java_path ?? '',
  memory: injectedGameConfig?.value?.memory_size ?? 4096,
  gamePath: getInitialGamePath(),
  downloadSource: injectedDownloadConfig?.value?.mirror_source ?? 'official',
  downloadThreads: injectedDownloadConfig?.value?.download_threads ?? 4,
  fullscreen: injectedGameConfig?.value?.fullscreen ?? false,
  windowWidth: 1280,
  windowHeight: 720,
})

const handleUpdateSettings = (updates: any) => {
  Object.assign(settings, updates)
}

// 监听主题相关设置变化
watch([themeMode, primaryColor, blurAmount, backgroundImagePath], ([newMode, newColor, newBlur, newBgPath]) => {
  settings.mode = newMode
  settings.primaryColor = newColor
  settings.blurAmount = newBlur
  settings.backgroundImage = newBgPath
}, { immediate: true })

const initSettings = async () => {
  if (!window.pywebview?.api) return

  try {
    console.log('开始加载后端配置...')

    // 同时请求所有配置
    const [themeRes, backgroundRes, gameRes, downloadRes] = await Promise.all([
      api.getThemeConfig().catch(() => null),
      api.getBackgroundConfig().catch(() => null),
      api.getGameConfig().catch(() => null),
      api.getDownloadConfig().catch(() => null)
    ])

    // 应用主题配置（仅在值发生变化时才更新主题，避免不必要的重绘）
    if (themeRes && themeRes.success && themeRes.data) {
      const data = themeRes.data
      const newMode = data.mode || 'system'
      const newColor = data.primary_color || '#0078d4'
      const newBlur = data.blur_amount ?? 6

      const themeChanged =
        settings.mode !== newMode ||
        settings.primaryColor !== newColor ||
        settings.blurAmount !== newBlur

      settings.mode = newMode
      settings.primaryColor = newColor
      settings.blurAmount = newBlur

      if (themeChanged) {
        themeMode.value = settings.mode as any
        primaryColor.value = settings.primaryColor
        blurAmount.value = settings.blurAmount
        updateTheme()
        console.log('主题配置已更新:', { mode: settings.mode, color: settings.primaryColor, blur: settings.blurAmount })
      }
    }

    // 应用背景配置（仅在值发生变化时才更新）
    if (backgroundRes && backgroundRes.success && backgroundRes.data) {
      const data = backgroundRes.data
      const newPath = data.path || ''

      if (settings.backgroundImage !== newPath) {
        settings.backgroundImage = newPath
        backgroundImagePath.value = newPath
        updateTheme()
        console.log('背景配置已更新:', newPath)
      }
    }

    // 应用游戏配置
    if (gameRes && gameRes.success && gameRes.data) {
      const data = gameRes.data
      settings.javaAutoSelect = data.java_auto ?? true
      settings.javaPath = data.java_path || ''
      settings.memory = data.memory_size ?? 4096
      settings.fullscreen = data.fullscreen ?? false

      // 处理游戏路径配置
      const firstPath = data.minecraft_paths?.[0]
      if (typeof firstPath === 'string') {
        settings.gamePath = firstPath
      } else if (firstPath && typeof firstPath === 'object' && 'path' in firstPath) {
        settings.gamePath = (firstPath as GamePath).path
      } else {
        settings.gamePath = './.minecraft'
      }

      console.log('游戏配置已应用:', { javaAuto: settings.javaAutoSelect, memory: settings.memory })
    }

    // 应用下载配置
    if (downloadRes && downloadRes.success && downloadRes.data) {
      const data = downloadRes.data
      settings.downloadSource = data.mirror_source || 'official'
      settings.downloadThreads = data.download_threads ?? 4

      console.log('下载配置已应用:', { source: settings.downloadSource, threads: settings.downloadThreads })
    }

    console.log('所有配置加载完成')
  } catch (error) {
    console.error('加载配置失败:', error)
  }
}

onMounted(() => {
  gsap.fromTo(mainRef.value,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
  )
  
  initSettings()
})
</script>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 0;
}

.settings-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
  margin-top: 10px;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.tab-wrapper {
  height: 100%;
}
</style>