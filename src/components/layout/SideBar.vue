<template>
  <aside
    class="sidebar"
    :class="{
      collapsed: isCollapsed,
      expanded: isExpanded,
      'modal-hidden': !agreementAccepted || topNavEnabled
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
          :data-path="item.path"
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
          :data-parent="item.path" class="sidebar-sub-items"
          :class="{ expanded: isMenuExpanded(item.path) }"
        >
          <button
            v-for="sub in getSubItems(item.path)"
            :key="sub.path"
            class="sidebar-item sidebar-sub-item"
            :data-path="sub.path"
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

      <!-- 插件注册的导航项 -->
      <template v-if="!isCollapsed">
        <div v-for="pRoute in pluginRoutesList" :key="pRoute.path" class="sidebar-plugin-divider"></div>
        <button
          v-for="pRoute in pluginRoutesList"
          :key="'btn-' + pRoute.path"
          class="sidebar-item"
          :data-path="`/plugin/${pRoute.plugin}${pRoute.path}`"
          :class="{ active: route.path === `/plugin/${pRoute.plugin}${pRoute.path}` }"
          @click.prevent="handleSubItemClick(`/plugin/${pRoute.plugin}${pRoute.path}`)"
        >
          <span class="sidebar-item-icon">
            <UiIcon :name="pRoute.icon || 'plugin'" :size="16" />
          </span>
          <span class="sidebar-item-text">{{ pRoute.title }}</span>
        </button>
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
import gsap from 'gsap'
import { useI18n } from 'vue-i18n'
import { useTopNav } from '@/composables/useTopNav'
import { useTheme } from '@/composables/useTheme'
import UiIcon from '@/components/ui/Icon.vue'
import { pluginRoutes } from '@/composables/usePluginBridge'
import { MENU_ITEMS } from '@/constants/menu'

defineOptions({ inheritAttrs: false })

const { sidebarCollapsed, setSidebarCollapsed } = useTheme()
const isCollapsed = computed({
  get: () => sidebarCollapsed.value,
  set: (val) => setSidebarCollapsed(val),
})
const isExpanded = ref(false)
const pluginRoutesList = computed(() => pluginRoutes.value)
const route = useRoute()
const router = useRouter()
const message = useGlassMessage()
const { t } = useI18n()
const { topNavEnabled } = useTopNav()

const indicatorRef = ref<HTMLElement | null>(null)
const activeBgRef = ref<HTMLElement | null>(null)

const agreementAccepted = inject('agreementAccepted', computed(() => true))
const injectedDevMode = inject<Readonly<Ref<boolean>>>('devMode')
const isDevMode = computed(() => injectedDevMode?.value ?? false)

const menuItems = computed(() => MENU_ITEMS.map(item => ({
  path: item.path,
  label: t(item.labelKey),
  iconName: item.iconName,
})))

// 子菜单定义
const settingsSubItems = computed(() => [
  { path: '/settings/general', label: t('settings.general'), iconName: 'settings' },
  { path: '/settings/game', label: t('settings.game'), iconName: 'game' },
  { path: '/settings/about', label: t('settings.about'), iconName: 'info' },
])

const versionsSubItems = computed(() => [
  { path: '/versions/manage', label: t('versions.manageTab'), iconName: 'settings' },
  { path: '/versions/versions', label: t('versions.versions'), iconName: 'cube' },
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
  router.push(item.path).catch(() => {})
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
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

/** 通过实际 DOM 测量获取目标菜单项位置并更新指示器 */
const updateActivePosition = (targetPath: string) => {
  if (isCollapsed.value) return
  nextTick(() => {
    const navEl = indicatorRef.value?.parentElement
    const targetEl = navEl?.querySelector(`.sidebar-item[data-path="${targetPath}"]`) as HTMLElement | null
    if (!targetEl || !indicatorRef.value || !activeBgRef.value) return
    const top = targetEl.offsetTop
    const height = targetEl.offsetHeight
    indicatorRef.value.style.top = `${top + 9}px`
    indicatorRef.value.style.height = `${height - 18}px`
    indicatorRef.value.style.opacity = '1'
    activeBgRef.value.style.top = `${top}px`
    activeBgRef.value.style.height = `${height}px`
    activeBgRef.value.style.opacity = '1'
  })
}

const updateIndicator = (targetPath: string) => updateActivePosition(targetPath)
const updateActiveBg = (targetPath: string) => updateActivePosition(targetPath)

const getActivePath = (): string => {
  const path = route.path
  // 先精确匹配子菜单项
  for (const parentPath of Object.keys(subItemsMap.value)) {
    const sub = subItemsMap.value[parentPath].find(s => s.path === path)
    if (sub) return sub.path
  }
  // 精确匹配父菜单项
  const exact = menuItems.value.find(item => item.path === path)
  if (exact) return exact.path
  // 前缀匹配父菜单项
  if (path !== '/') {
    const prefix = menuItems.value.find(
      item => item.path !== '/' && path.startsWith(item.path)
    )
    if (prefix) return prefix.path
  }
  return ''
}

const handleMouseEnter = (index: number) => {
  if (index < menuItems.value.length) {
    updateIndicator(menuItems.value[index].path)
  }
}

const handleMouseLeave = () => {
  const activePath = getActivePath()
  if (activePath) {
    updateIndicator(activePath)
  } else {
    if (indicatorRef.value) indicatorRef.value.style.opacity = '0'
  }
}

watch(
  () => route.path,
  (newPath) => {
    nextTick(() => {
      const activePath = getActivePath()
      if (activePath) {
        updateIndicator(activePath)
        updateActiveBg(activePath)
      } else {
        if (indicatorRef.value) indicatorRef.value.style.opacity = '0'
        if (activeBgRef.value) activeBgRef.value.style.opacity = '0'
      }
    })
  },
  { immediate: true }
)

// 子菜单展开/折叠时重新计算指示器位置
watch(
  () => [...expandedMenus.value],
  () => {
    nextTick(() => {
      const activePath = getActivePath()
      if (activePath) {
        updateIndicator(activePath)
        updateActiveBg(activePath)
      }
    })
  },
  { deep: true }
)

onMounted(() => {
  const activePath = getActivePath()
  if (activePath) {
    setTimeout(() => {
      updateIndicator(activePath)
      updateActiveBg(activePath)
    }, 100)
  }
})
</script>

<style scoped src="@/styles/SideBar.css"></style>

