<template>
  <div class="settings-container" ref="mainRef">
    <div class="settings-card">
      <div class="settings-content">
        <router-view v-slot="{ Component }">
          <Transition name="tab-fade" mode="out-in">
            <component :is="Component" :settings="settings" @update:settings="handleUpdateSettings" />
          </Transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, inject, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'
import backend from '@/api/client'
import { useTheme } from '@/composables/useTheme'
import type { GamePath } from '@/types/api'

const { t } = useI18n()
const { themeMode, primaryColor, blurAmount, backgroundImagePath, updateTheme } = useTheme()

// 从 App.vue 注入的全局配置（启动时已预加载）
const injectedGameConfig = inject<Readonly<Ref<any>>>('gameConfig', null as any)
const injectedDownloadConfig = inject<Readonly<Ref<any>>>('downloadConfig', null as any)

const mainRef = ref<HTMLElement | null>(null)

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
  if (!(window as any).__TAURI__?.pytauri) return

  try {
    console.log('开始加载后端配置...')

    // 同时请求所有配置
    const [uiRes, gameRes, downloadRes] = await Promise.all([
      backend.config.get('ui').catch(() => null),
      backend.config.get('game').catch(() => null),
      backend.config.get('download').catch(() => null)
    ])

    // 应用主题配置（仅在值发生变化时才更新主题，避免不必要的重绘）
    if (uiRes && uiRes.success && uiRes.data?.theme) {
      const data = uiRes.data.theme
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
    if (uiRes && uiRes.success && uiRes.data?.background) {
      const data = uiRes.data.background
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

<style scoped src="@/styles/Settings.css"></style>