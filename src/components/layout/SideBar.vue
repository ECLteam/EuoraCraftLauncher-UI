<template>
  <aside
    class="sidebar"
    :class="{
      collapsed: isCollapsed,
      expanded: isExpanded,
      'modal-hidden': isFullscreenModalVisible || !agreementAccepted || topNavEnabled
    }"
  >
    <!-- 折叠切换按钮 -->
    <button
      class="sidebar-toggle"
      :title="isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')"
      @click="toggleCollapse"
    >
      <UiIcon :name="isCollapsed ? 'chevron-down' : 'menu'" :size="18" />
    </button>

    <!-- 导航区域 -->
    <nav class="sidebar-nav" @mouseleave="handleMouseLeave">
      <div v-if="!isCollapsed" class="sidebar-active-bg" ref="activeBgRef"></div>
      <div v-if="!isCollapsed" class="sidebar-active-indicator" ref="indicatorRef"></div>

      <template v-for="(item, index) in menuItems" :key="item.path">
        <button
          class="sidebar-item"
          :class="{
            active: route.path === item.path
              || (item.path !== '/' && route.path.startsWith(item.path))
          }"
          :title="isCollapsed ? item.label : undefined"
          @mouseenter="!isCollapsed && handleMouseEnter(index)"
          @click.prevent="handleItemClick(item)"
        >
          <span class="sidebar-item-icon">
            <UiIcon :name="item.iconName" :size="20" />
          </span>
          <span class="sidebar-item-text">{{ item.label }}</span>
          <span
            v-if="!isCollapsed && itemHasSubItems(item.path)"
            class="sidebar-item-chevron"
            :class="{ expanded: isMenuExpanded(item.path) }"
            @click.stop="toggleMenu(item.path)"
          >
            <UiIcon name="chevron-down" :size="14" />
          </span>
        </button>

        <!-- 子菜单项 -->
        <div
          v-if="!isCollapsed && itemHasSubItems(item.path)"
          class="sidebar-sub-items"
          :class="{ expanded: isMenuExpanded(item.path) }"
        >
          <button
            v-for="sub in getSubItems(item.path)"
            :key="sub.path"
            class="sidebar-item sidebar-sub-item"
            :class="{ active: route.path === sub.path }"
            @click.prevent="handleSubItemClick(sub.path)"
          >
            <span class="sidebar-item-icon">
              <UiIcon :name="sub.iconName" :size="16" />
            </span>
            <span class="sidebar-item-text">{{ sub.label }}</span>
          </button>
        </div>
      </template>
    </nav>

    <!-- 底部 -->
    <div class="sidebar-footer">
      <button
        v-if="isDevMode"
        class="sidebar-item"
        :class="{ active: route.path === '/dev' }"
        :title="isCollapsed ? t('sidebar.debug') : t('sidebar.debugTitle')"
        @click.prevent="handleItemClick({ path: '/dev' })"
      >
        <span class="sidebar-item-icon">
          <UiIcon name="bug" :size="20" />
        </span>
        <span class="sidebar-item-text">{{ t('sidebar.debug') }}</span>
      </button>
      <button
        class="sidebar-item"
        :title="isCollapsed ? t('sidebar.help') : undefined"
        @click.prevent="openHelp"
      >
        <span class="sidebar-item-icon">
          <UiIcon name="help" :size="20" />
        </span>
        <span class="sidebar-item-text">{{ t('sidebar.help') }}</span>
      </button>
    </div>
  </aside>

  <!-- 移动端遮罩 -->
  <div class="sidebar-overlay" @click="isExpanded = false"></div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed, inject, readonly, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { useI18n } from 'vue-i18n'
import { useFullscreenModal } from '@/composables/useFullscreenModal'
import { useTopNav } from '@/composables/useTopNav'
import { useTheme } from '@/composables/useTheme'
import UiIcon from '@/components/ui/Icon.vue'
import '@/styles/SideBar.css'

defineOptions({ inheritAttrs: false })

const { sidebarCollapsed, setSidebarCollapsed } = useTheme()
const isCollapsed = computed({
  get: () => sidebarCollapsed.value,
  set: (val) => setSidebarCollapsed(val),
})
const isExpanded = ref(false)
const route = useRoute()
const router = useRouter()
const message = useGlassMessage()
const { t } = useI18n()
const fullscreenModal = useFullscreenModal()
const { topNavEnabled } = useTopNav()
const isFullscreenModalVisible = computed(() => fullscreenModal.isVisible.value)

const indicatorRef = ref<HTMLElement | null>(null)
const activeBgRef = ref<HTMLElement | null>(null)

const agreementAccepted = inject('agreementAccepted', computed(() => true))
const injectedDevMode = inject<Readonly<Ref<boolean>>>('devMode')
const isDevMode = computed(() => injectedDevMode?.value ?? false)

const menuItems = computed(() => [
  { path: '/', label: t('sidebar.game'), iconName: 'game' },
  { path: '/versions', label: t('sidebar.versions'), iconName: 'cube' },
  { path: '/instances', label: t('sidebar.instances'), iconName: 'folder' },
  { path: '/settings', label: t('sidebar.settings'), iconName: 'settings' }
])

// 子菜单定义
const settingsSubItems = computed(() => [
  { path: '/settings/general', label: t('settings.general'), iconName: 'settings' },
  { path: '/settings/game', label: t('settings.game'), iconName: 'game' },
  { path: '/settings/about', label: t('settings.about'), iconName: 'info' },
])

const versionsSubItems = computed(() => [
  { path: '/versions/manage', label: t('versions.manageTab'), iconName: 'settings' },
  { path: '/versions/versions', label: t('versions.versions'), iconName: 'cube' },
  { path: '/versions/mods', label: t('versions.modsTab'), iconName: 'cube' },
])

const subItemsMap = computed(() => ({
  '/settings': settingsSubItems.value,
  '/versions': versionsSubItems.value,
}))

const itemHasSubItems = (path: string) => {
  return path in subItemsMap.value
}

const getSubItems = (path: string) => {
  return subItemsMap.value[path] || []
}

// 展开/折叠状态
const expandedMenus = ref<Set<string>>(new Set())

const isMenuExpanded = (path: string) => {
  return expandedMenus.value.has(path)
}

const toggleMenu = (path: string) => {
  const newSet = new Set(expandedMenus.value)
  if (newSet.has(path)) {
    newSet.delete(path)
  } else {
    newSet.add(path)
  }
  expandedMenus.value = newSet
}

const handleItemClick = (item: { path: string }) => {
  if (!canNavigate()) return
  if (itemHasSubItems(item.path)) {
    toggleMenu(item.path)
  }
  router.push(item.path)
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// 移动端展开
const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value
}

watch(isExpanded, (val) => {
  if (val) {
    document.body.classList.add('sidebar-expanded')
  } else {
    document.body.classList.remove('sidebar-expanded')
  }
}, { immediate: true })

const canNavigate = () => {
  if (!agreementAccepted.value) {
    message.warning(t('agreement.acceptRequired'))
    return false
  }
  return true
}

const handleSubItemClick = (path: string) => {
  if (!canNavigate()) return
  router.push(path)
}

const openHelp = () => {
  if (!canNavigate()) return
  message.info(t('sidebar.helpMessage'))
}

const ITEM_HEIGHT = 42

const updateIndicator = (index: number) => {
  if (isCollapsed.value) return
  const top = 2 + index * (ITEM_HEIGHT + 2)
  if (indicatorRef.value) {
    indicatorRef.value.style.top = `${top + 10}px`
    indicatorRef.value.style.height = `${ITEM_HEIGHT - 20}px`
    indicatorRef.value.style.opacity = '1'
  }
}

const updateActiveBg = (index: number) => {
  if (isCollapsed.value) return
  const top = 2 + index * (ITEM_HEIGHT + 2)
  if (activeBgRef.value) {
    activeBgRef.value.style.top = `${top}px`
    activeBgRef.value.style.height = `${ITEM_HEIGHT}px`
    activeBgRef.value.style.opacity = '1'
  }
}

const getActiveIndex = (path: string): number => {
  let index = menuItems.value.findIndex(item => item.path === path)
  if (index !== -1) return index

  if (path !== '/') {
    index = menuItems.value.findIndex(
      item => item.path !== '/' && path.startsWith(item.path)
    )
    if (index !== -1) return index
  }
  return -1
}

const handleMouseEnter = (index: number) => {
  updateIndicator(index)
}

const handleMouseLeave = () => {
  const index = getActiveIndex(route.path)
  if (index !== -1) {
    updateIndicator(index)
  } else {
    if (indicatorRef.value) indicatorRef.value.style.opacity = '0'
  }
}

watch(
  () => route.path,
  (newPath) => {
    const index = getActiveIndex(newPath)
    nextTick(() => {
      if (index !== -1) {
        updateIndicator(index)
        updateActiveBg(index)
      } else {
        if (indicatorRef.value) indicatorRef.value.style.opacity = '0'
        if (activeBgRef.value) activeBgRef.value.style.opacity = '0'
      }
      // 自动展开当前子路由对应的父菜单
      for (const parentPath of Object.keys(subItemsMap.value)) {
        if (newPath.startsWith(parentPath)) {
          const newSet = new Set(expandedMenus.value)
          newSet.add(parentPath)
          expandedMenus.value = newSet
          break
        }
      }
    })
  },
  { immediate: true }
)

onMounted(() => {
  const index = getActiveIndex(route.path)
  if (index !== -1) {
    setTimeout(() => {
      updateIndicator(index)
      updateActiveBg(index)
    }, 100)
  }
})
</script>

