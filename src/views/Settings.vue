<template>
  <div class="settings-page">
    <!-- 左侧导航 - 固定200px -->
    <div class="settings-nav">
      <div class="nav-header">
        <h2 class="nav-title">
          <UiIcon name="settings" :size="18" />
          {{ t('settings.title') }}
        </h2>
      </div>
      <div class="nav-list">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { active: isActive(item.path) }]"
        >
          <span class="nav-indicator"></span>
          <UiIcon :name="item.icon" :size="18" class="nav-icon" />
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </div>
    </div>

    <!-- 右侧内容区 -->
    <div class="settings-content">
      <router-view v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :settings="settings" @update:settings="handleUpdateSettings" />
        </Transition>
      </router-view>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, inject, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import UiIcon from '@/components/ui/Icon.vue'
import backend from '@/api/client'

const route = useRoute()
const { t } = useI18n()
const { themeMode, primaryColor, blurAmount, backgroundImagePath } = useTheme()

const injectedGameConfig = inject<Readonly<Ref<any>>>('gameConfig', null as any)
const injectedDownloadConfig = inject<Readonly<Ref<any>>>('downloadConfig', null as any)

const navItems = computed(() => [
  { path: '/settings/general', icon: 'brush', label: t('settings.general') },
  { path: '/settings/download', icon: 'download', label: t('settings.download') },
  { path: '/settings/game', icon: 'game', label: t('settings.gameSettings') },
  { path: '/settings/plugins', icon: 'plugin', label: t('settings.pluginSettings') },
  { path: '/settings/about', icon: 'info', label: t('settings.about') },
])

const isActive = (path: string) => route.path === path

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
</script>

<style scoped>
:root { --settings-nav-w: 200px; }

.settings-page {
  display: flex;
  height: 100%;
  gap: 0;
}

/* 左侧导航 200px */
.settings-nav {
  width: 200px;
  min-width: 200px;
  background: var(--card-bg);
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  border-radius: var(--r-sm);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-right: var(--s-lg);
}

.nav-header {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 40px;
  flex-shrink: 0;
}

.nav-title {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.nav-list {
  flex: 1;
  padding: var(--s-sm) 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 16px;
  gap: var(--s-sm);
  position: relative;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: var(--r-sm);
  margin: 0 8px;
  transition: color 150ms ease-out, background 150ms ease-out;
}

.nav-item:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

/* 浅色：选中态品牌色文字 + 左 3px 色条 */
.nav-item.active {
  color: var(--primary);
  background: transparent;
  font-weight: 600;
}

/* 深色：选中态 #6B9EFF（品牌色提亮） */
[data-theme="dark"] .nav-item.active {
  color: #6B9EFF;
}

.nav-indicator {
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: var(--primary);
  opacity: 0;
  transition: opacity 150ms ease-out;
}

[data-theme="dark"] .nav-indicator {
  background: #6B9EFF;
}

.nav-item.active .nav-indicator {
  opacity: 1;
}

.nav-icon {
  flex-shrink: 0;
}

.nav-label {
  white-space: nowrap;
}

/* 右侧内容区 */
.settings-content {
  flex: 1;
  min-width: 0;
  background: var(--card-bg);
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  border-radius: var(--r-sm);
  padding: var(--s-xl);
  overflow-y: auto;
}


</style>