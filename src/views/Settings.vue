<template>
  <div class="settings-page">
    <!-- 左侧导航 - 固定200px -->
    <div class="settings-nav">
      <div class="nav-header">
        <h2 class="nav-title">
          <UiIcon
            name="settings"
            :size="18"
          />
          {{ t('settings.title') }}
        </h2>
      </div>
      <div class="nav-list">
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { active: isActive(item.path) }]"
        >
          <span class="nav-indicator" />
          <UiIcon
            :name="item.icon"
            :size="18"
            class="nav-icon"
          />
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </div>
      <!-- 插件：设置页导航底部插槽 -->
      <div
        id="plugin-slot-settings-nav-bottom"
        class="plugin-slot-container"
      />
    </div>

    <!-- 右侧内容区 -->
    <div class="settings-content">
      <!-- 插件：设置页内容区顶部插槽 -->
      <div
        id="plugin-slot-settings-content-top"
        class="plugin-slot-container"
      />
      <RouterView v-slot="{ Component }">
        <Transition
          name="page"
          mode="out-in"
        >
          <component
            :is="Component"
            :settings="settings"
            @update:settings="handleUpdateSettings"
          />
        </Transition>
      </RouterView>
      <!-- 插件：设置页内容区底部插槽 -->
      <div
        id="plugin-slot-settings-content-bottom"
        class="plugin-slot-container"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, inject, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import UiIcon from '@/components/ui/Icon.vue'
import { useTheme } from '@/composables/useTheme'
import type { DownloadConfig, GameConfig } from '@/types/api'

const route = useRoute()
const { t } = useI18n()
const { themeMode, primaryColor, blurAmount, backgroundImagePath } = useTheme()

const injectedGameConfig = inject<Readonly<Ref<GameConfig | null>>>('gameConfig')
const injectedDownloadConfig = inject<Readonly<Ref<DownloadConfig | null>>>('downloadConfig')

const navItems = computed(() => [
  { path: '/settings/general', icon: 'brush', label: t('settings.general') },
  { path: '/settings/download', icon: 'download', label: t('settings.download') },
  { path: '/settings/game', icon: 'game', label: t('settings.gameSettings') },
  { path: '/settings/about', icon: 'info', label: t('settings.about') },
])

const isActive = (path: string) => route.path === path

const getInitialGamePath = () => {
  const paths = injectedGameConfig?.value?.minecraft_paths
  if (!paths?.length) return ''
  const first = paths[0]
  return typeof first === 'string' ? first : first?.path ?? ''
}

const settings = reactive({
  mode: themeMode.value,
  primary_color: primaryColor.value,
  blur_amount: blurAmount.value,
  background_image: backgroundImagePath.value,
  java_auto: injectedGameConfig?.value?.java_auto,
  java_path: injectedGameConfig?.value?.java_path ?? '',
  memory_size: injectedGameConfig?.value?.memory_size,
  game_path: getInitialGamePath(),
  mirror_source: injectedDownloadConfig?.value?.mirror_source ?? '',
  download_threads: injectedDownloadConfig?.value?.download_threads,
  fullscreen: injectedGameConfig?.value?.fullscreen,
})

const handleUpdateSettings = (updates: Partial<typeof settings>) => {
  Object.assign(settings, updates)
}

// 主题/背景配置变化时同步给子标签页
watch([themeMode, primaryColor, blurAmount, backgroundImagePath], ([mode, color, blur, bg]) => {
  Object.assign(settings, {
    mode,
    primary_color: color,
    blur_amount: blur,
    background_image: bg,
  })
})

// 后端配置到达后同步到 settings
watch([
  () => injectedGameConfig?.value,
  () => injectedDownloadConfig?.value,
], ([game, download]) => {
  if (game) {
    Object.assign(settings, {
      java_auto: game.java_auto,
      java_path: game.java_path ?? '',
      memory_size: game.memory_size,
      fullscreen: game.fullscreen,
      game_path: getInitialGamePath(),
    })
  }
  if (download) {
    Object.assign(settings, {
      mirror_source: download.mirror_source ?? '',
      download_threads: download.download_threads,
    })
  }
}, { immediate: true })
</script>

<style scoped src="@/styles/views/Settings.css"></style>
