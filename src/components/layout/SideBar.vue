<template>
  <aside class="sidebar" :class="[attrs.class, { expanded: isExpanded, 'modal-hidden': isFullscreenModalVisible || !agreementAccepted }]">
    <UiButton 
      variant="ghost"
      shape="circle"
      size="md"
      icon="menu"
      :title="t('sidebar.toggle')"
      @click="toggleSidebar"
      class="toggle-btn"
    />
    
    <nav class="sidebar-nav" @mouseleave="handleMouseLeave">
      <div class="active-background" ref="backgroundRef"></div>
      <div class="active-indicator" ref="indicatorRef"></div>
      
      <a
        v-for="(item, index) in menuItems" 
        :key="item.path"
        class="menu-item"
        :class="{ active: route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path)) }"
        @mouseenter="handleMouseEnter(index)"
        @click.prevent="handleItemClick(item)"
      >
        <UiIcon :name="item.iconName" :size="20" />
        <span class="text">{{ item.label }}</span>
      </a>
    </nav>
    
    <div class="sidebar-footer">
      <a
        v-if="isDevMode"
        class="menu-item"
        :class="{ active: route.path === '/dev' }"
        :title="t('sidebar.debugTitle')"
        @click.prevent="handleItemClick({ path: '/dev' })"
      >
        <UiIcon name="bug" :size="20" />
        <span class="text">{{ t('sidebar.debug') }}</span>
      </a>
      <a
        class="menu-item"
        :title="t('sidebar.help')"
        @click.prevent="openHelp"
      >
        <UiIcon name="help" :size="20" />
        <span class="text">{{ t('sidebar.help') }}</span>
      </a>
    </div>
  </aside>
  
  <div class="sidebar-overlay" @click="isExpanded = false"></div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed, inject, useAttrs, readonly, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { useI18n } from 'vue-i18n'
import { useFullscreenModal } from '@/composables/useFullscreenModal'
import UiButton from '@/components/ui/Button.vue'
import { api } from '@/utils/api'
import '@/styles/components/SideBar.css'

// 禁用自动属性继承，因为组件有多个根元素
defineOptions({
  inheritAttrs: false
})

const attrs = useAttrs()

const isExpanded = ref(false)
const route = useRoute()
const router = useRouter()
const message = useGlassMessage()
const { t } = useI18n()
const fullscreenModal = useFullscreenModal()
// 使用计算属性包装，确保模板中正确解包
const isFullscreenModalVisible = computed(() => fullscreenModal.isVisible.value)

// 调试：监听 fullscreenModal 变化（必须在 fullscreenModal 初始化之后）
watch(() => fullscreenModal.isVisible.value, (val) => {
  console.log('[SideBar] fullscreenModal.isVisible 变化:', val)
}, { immediate: true })
const indicatorRef = ref<HTMLElement | null>(null)
const backgroundRef = ref<HTMLElement | null>(null)

// 注入用户协议状态
const agreementAccepted = inject('agreementAccepted', computed(() => true))

// 调试模式：由 App.vue 从后端加载并提供
const injectedDevMode = inject<Readonly<Ref<boolean>>>('devMode')
const isDevMode = computed(() => injectedDevMode?.value ?? false)

const menuItems = computed(() => [
  { path: '/', label: t('sidebar.game'), iconName: 'game' },
  { path: '/versions', label: t('sidebar.versions'), iconName: 'cube' },
   { path: '/instances', label: t('sidebar.instances'), iconName: 'folder' },
  { path: '/settings', label: t('sidebar.settings'), iconName: 'settings' }
])

const toggleSidebar = () => {
  isExpanded.value = !isExpanded.value
}

// 同步侧边栏展开状态到 body，供全局消息组件使用
watch(isExpanded, (val) => {
  if (val) {
    document.body.classList.add('sidebar-expanded')
  } else {
    document.body.classList.remove('sidebar-expanded')
  }
}, { immediate: true })

// 检查是否可以导航
const canNavigate = () => {
  if (!agreementAccepted.value) {
    message.warning(t('agreement.acceptRequired'))
    return false
  }
  return true
}

const handleItemClick = (item: { path: string }) => {
  if (!canNavigate()) {
    return
  }
  // 允许导航
  router.push(item.path)
}


const openHelp = () => {
  if (!canNavigate()) {
    return
  }
  message.info(t('sidebar.helpMessage'))
}

const updateIndicator = (index: number) => {
  const top = index * 44
  if (indicatorRef.value) {
    indicatorRef.value.style.top = `${top + 8}px`
    indicatorRef.value.style.opacity = '1'
  }
}

const updateBackground = (index: number) => {
  const top = index * 44
  if (backgroundRef.value) {
    backgroundRef.value.style.top = `${top}px`
    backgroundRef.value.style.opacity = '1'
  }
}

const getActiveIndex = (path: string) => {
  let index = menuItems.value.findIndex(item => item.path === path)
  if (index !== -1) return index
  
  if (path !== '/') {
    index = menuItems.value.findIndex(item => item.path !== '/' && path.startsWith(item.path))
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
    if (index !== -1) {
      nextTick(() => {
        updateIndicator(index)
        updateBackground(index)
      })
    } else {
      if (indicatorRef.value) indicatorRef.value.style.opacity = '0'
      if (backgroundRef.value) backgroundRef.value.style.opacity = '0'
    }
  },
  { immediate: true }
)

onMounted(() => {
  const index = getActiveIndex(route.path)
  if (index !== -1) {
    setTimeout(() => {
      updateIndicator(index)
      updateBackground(index)
    }, 100)
  }
})
</script>