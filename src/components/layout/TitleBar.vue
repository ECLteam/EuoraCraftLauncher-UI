<template>
  <header class="titlebar" data-tauri-drag-region>
    <!-- 左侧 -->
    <div class="titlebar-left">
      <template v-if="isFullscreenModalVisible">
        <button
          class="titlebar-back-btn"
          @click="handleClose"
          :title="t('common.back')"
        >
          <UiIcon name="arrow-left" :size="18" />
        </button>
        <span class="titlebar-modal-title">{{ fullscreenModalTitle }}</span>
      </template>
      <template v-else>
        <div class="titlebar-brand">
          <img src="/favicon.ico" alt="Logo" class="titlebar-logo" />
          <span class="titlebar-app-name">{{ topNavEnabled ? 'ECL' : 'EuoraCraft Launcher' }}</span>
        </div>
      </template>
    </div>

    <!-- 中间拖拽区 -->
    <div class="titlebar-center"></div>

    <!-- 顶部导航菜单（横向标题栏模式，绝对定位居中） -->
    <nav
      v-if="topNavEnabled && !isFullscreenModalVisible"
      class="titlebar-nav"
    >
      <button
        v-for="item in menuItems"
        :key="item.path"
        class="titlebar-nav-item"
        :class="{
          active: route.path === item.path
            || (item.path !== '/' && route.path.startsWith(item.path))
        }"
        @click="handleNavClick(item)"
      >
        <UiIcon :name="item.iconName" :size="16" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <!-- 右侧窗口控制 -->
    <div class="titlebar-right">
      <button
        class="titlebar-btn"
        @click="toggleTheme"
        :title="isDark ? t('settings.themeLight') : t('settings.themeDark')"
      >
        <UiIcon :name="isDark ? 'moon' : 'sun'" :size="16" />
      </button>
      <button
        class="titlebar-btn"
        @click="minimize"
        :title="t('common.minimize')"
      >
        <UiIcon name="minimize" :size="16" />
      </button>
      <button
        class="titlebar-btn titlebar-btn-close"
        @click="close"
        :title="t('common.close')"
      >
        <UiIcon name="close" :size="16" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useTopNav } from '@/composables/useTopNav'
import { useFullscreenModal } from '@/composables/useFullscreenModal'
import UiIcon from '@/components/ui/Icon.vue'
import '@/styles/TitleBar.css'

const { t } = useI18n()
const { isDark, toggleTheme, titlebarHidden } = useTheme()
const { topNavEnabled } = useTopNav()
const fullscreenModal = useFullscreenModal()
const route = useRoute()
const router = useRouter()

const isFullscreenModalVisible = computed(() => fullscreenModal.isVisible.value)
const fullscreenModalTitle = computed(() => fullscreenModal.title.value)

const menuItems = computed(() => [
  { path: '/', label: t('sidebar.game'), iconName: 'game' },
  { path: '/versions', label: t('sidebar.versions'), iconName: 'cube' },
  { path: '/instances', label: t('sidebar.instances'), iconName: 'folder' },
  { path: '/settings', label: t('sidebar.settings'), iconName: 'settings' }
])

const handleNavClick = (item: { path: string }) => {
  router.push(item.path)
}

const minimize = async () => {
  const w = (window as any).__TAURI__?.window?.getCurrentWindow?.()
  if (w) await w.minimize()
}
const close = async () => {
  const w = (window as any).__TAURI__?.window?.getCurrentWindow?.()
  if (w) await w.close()
}
const handleClose = () => fullscreenModal.close()
</script>

