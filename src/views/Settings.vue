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
        <RouterLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          :class="['nav-item', { active: isActive(item.path) }]"
        >
          <span class="nav-indicator" />
          <UiIcon :name="item.icon" :size="18" class="nav-icon" />
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </div>
      <!-- 插件：设置页导航底部插槽 -->
      <div id="plugin-slot-settings-nav-bottom" class="plugin-slot-container" />
    </div>

    <!-- 右侧内容区 -->
    <div class="settings-content">
      <!-- 插件：设置页内容区顶部插槽 -->
      <div id="plugin-slot-settings-content-top" class="plugin-slot-container" />
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
      <!-- 插件：设置页内容区底部插槽 -->
      <div id="plugin-slot-settings-content-bottom" class="plugin-slot-container" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import UiIcon from '@/components/ui/Icon.vue'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'

const route = useRoute()
const { t } = useI18n()
const settingsStore = useSettingsStore()

const navItems = computed(() => [
  { path: '/settings/general', icon: 'brush', label: t('settings.general') },
  { path: '/settings/download', icon: 'download', label: t('settings.download') },
  { path: '/settings/game', icon: 'game', label: t('settings.gameSettings') },
  { path: '/settings/about', icon: 'info', label: t('settings.about') },
])

const isActive = (path: string) => route.path === path

onMounted(() => {
  void settingsStore.load().catch(() => {})
})
</script>

<style scoped src="@/styles/views/Settings.css"></style>
