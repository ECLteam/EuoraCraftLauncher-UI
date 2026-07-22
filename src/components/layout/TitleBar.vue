<template>
  <header
    class="titlebar"
    data-tauri-drag-region
  >
    <!-- 左侧 -->
    <div class="titlebar-left">
      <template v-if="isFullscreenModalVisible">
        <button
          class="titlebar-back-btn"
          :title="t('common.back')"
          @click="handleClose"
        >
          <UiIcon
            name="arrow-left"
            :size="18"
          />
        </button>
        <span class="titlebar-modal-title">{{ fullscreenModalTitle }}</span>
      </template>
      <template v-else>
        <div class="titlebar-brand">
          <img
            src="/favicon.ico"
            alt="Logo"
            class="titlebar-logo"
          >
          <span class="titlebar-app-name">{{ topNavEnabled ? 'ECL' : 'EuoraCraft Launcher' }}</span>
        </div>
        <div
          id="plugin-slot-titlebar-left"
          class="plugin-slot-container"
        />
      </template>
    </div>

    <!-- 中间拖拽区 -->
    <div class="titlebar-center" />

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
        <UiIcon
          :name="item.iconName"
          :size="16"
        />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <!-- 右侧窗口控制 -->
    <div class="titlebar-right">
      <div
        id="plugin-slot-titlebar-right"
        class="plugin-slot-container"
      />
      <button
        v-if="hasActiveTasks"
        class="titlebar-btn titlebar-btn-task"
        :title="t('task.title')"
        @click="toggleTaskPanel"
      >
        <UiIcon
          name="download"
          :size="16"
        />
        <span
          v-if="activeTaskCount > 0"
          class="task-badge"
        >{{ activeTaskCount }}</span>
      </button>
      <button
        class="titlebar-btn"
        :title="isDark ? t('settings.themeLight') : t('settings.themeDark')"
        @click="toggleTheme"
      >
        <UiIcon
          :name="isDark ? 'moon' : 'sun'"
          :size="16"
        />
      </button>
      <button
        class="titlebar-btn"
        :title="t('common.minimize')"
        @click="minimize"
      >
        <UiIcon
          name="minimize"
          :size="16"
        />
      </button>
      <button
        class="titlebar-btn titlebar-btn-close"
        :title="t('common.close')"
        @click="close"
      >
        <UiIcon
          name="close"
          :size="16"
        />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import UiIcon from '@/components/ui/Icon.vue'
import { useFullscreenModal } from '@/composables/useFullscreenModal'
import { globalTaskQueue } from '@/composables/useTaskQueue'
import { useTheme } from '@/composables/useTheme'
import { useTopNav } from '@/composables/useTopNav'
import { MENU_ITEMS } from '@/constants/menu'

defineOptions({ name: 'TitleBar' })

interface TauriGlobal {
  __TAURI__?: {
    window?: {
      getCurrentWindow?: () => { minimize: () => Promise<void>; close: () => Promise<void> }
    }
  }
}

const { t } = useI18n()
const { isDark, toggleTheme } = useTheme()
const { topNavEnabled } = useTopNav()
const fullscreenModal = useFullscreenModal()
const route = useRoute()
const router = useRouter()

const { hasActiveTasks, activeCount: activeTaskCount, togglePanel: toggleTaskPanel } = globalTaskQueue

const isFullscreenModalVisible = computed(() => fullscreenModal.isVisible.value)
const fullscreenModalTitle = computed(() => fullscreenModal.title.value)

const menuItems = computed(() => MENU_ITEMS.map(item => ({
  path: item.path,
  label: t(item.labelKey),
  iconName: item.iconName,
})))

const handleNavClick = (item: { path: string }) => {
  router.push(item.path)
}

const minimize = async () => {
  const w = (window as unknown as TauriGlobal).__TAURI__?.window?.getCurrentWindow?.()
  if (w) await w.minimize()
}
const close = async () => {
  const w = (window as unknown as TauriGlobal).__TAURI__?.window?.getCurrentWindow?.()
  if (w) await w.close()
}
const handleClose = () => fullscreenModal.close()
</script>

<style scoped src="@/styles/components/layout/TitleBar.css"></style>
