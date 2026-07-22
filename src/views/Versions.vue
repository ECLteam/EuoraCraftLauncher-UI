<template>
  <div class="versions-page">
    <!-- 左侧导航 - 固定200px -->
    <div class="versions-nav">
      <div class="nav-header">
        <h2 class="nav-title">
          <UiIcon
            name="cube"
            :size="18"
          />
          {{ t('sidebar.versions') }}
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
      <!-- 插件：版本页导航底部插槽 -->
      <div
        id="plugin-slot-versions-nav-bottom"
        class="plugin-slot-container"
      />
    </div>

    <!-- 右侧内容区 -->
    <div
      ref="contentRef"
      class="versions-content"
    >
      <!-- 插件：版本页内容区顶部插槽 -->
      <div
        id="plugin-slot-versions-content-top"
        class="plugin-slot-container"
      />
      <RouterView v-slot="{ Component }">
        <Transition
          name="page"
          mode="out-in"
        >
          <component :is="Component" />
        </Transition>
      </RouterView>
    </div>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import UiIcon from '@/components/ui/Icon.vue'

const { t } = useI18n()
const route = useRoute()

const navItems = computed(() => [
  { path: '/versions/manage', icon: 'settings', label: t('versions.manageTab') },
  { path: '/versions/versions', icon: 'cube', label: t('versions.versions') },
])

const isActive = (path: string) => route.path === path

const contentRef = ref<HTMLElement | null>(null)

// 页面加载动画
const playEnterAnimation = () => {
  if (contentRef.value) {
    gsap.fromTo(contentRef.value,
      { opacity: 0, y: 20, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
    )
  }
}

onMounted(() => {
  playEnterAnimation()
})
</script>

<style scoped src="@/styles/views/Versions.css"></style>

