<template>
  <div class="pywebview-drag-region">
  <header class="title-bar">
    <div class="title-bar-left">
      <!-- 全屏弹窗模式：显示关闭按钮和弹窗标题 -->
      <template v-if="isFullscreenModalVisible">
        <UiButton 
          variant="ghost"
          shape="circle"
          size="sm"
          icon="icon-left"
          :title="t('common.back')"
          @click="handleClose"
          class="modal-close-btn"
        />
        <span class="modal-title">{{ fullscreenModalTitle }}</span>
      </template>
      <!-- 普通模式：显示 Logo 和 App 名称 -->
      <template v-else>
        <img src="/favicon.ico" alt="Logo" class="app-logo" />
        <span class="app-name">EuoraCraft Launcher</span>
      </template>
    </div>
    
    <div class="title-bar-right">
      <UiButton 
        variant="ghost"
        shape="circle"
        size="sm"
        :icon="isDark ? 'icon-moon' : 'icon-sun'"
        :title="isDark ? t('settings.themeLight') : t('settings.themeDark')"
        @click="toggleTheme"
        class="theme-toggle-btn"
      />
      
      <UiButton 
        variant="ghost"
        shape="circle"
        size="sm"
        icon="icon-minimize"
        :title="t('common.minimize')"
        @click="minimize"
        class="control-btn"
      />
      <UiButton 
        variant="ghost"
        shape="circle"
        size="sm"
        icon="icon-close"
        :title="t('common.close')"
        @click="close"
        class="control-btn close-btn"
      />
    </div>
  </header>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useTheme } from '@/composables/useTheme'
import { useFullscreenModal } from '@/composables/useFullscreenModal'
import UiButton from '@/components/ui/Button.vue'
import '@/styles/components/TitleBar.css'
import { 
  //watch, 
  computed } from 'vue'

const { t } = useI18n()
const { isDark, toggleTheme } = useTheme()
const fullscreenModal = useFullscreenModal()
// 使用计算属性包装，确保模板中正确解包
const isFullscreenModalVisible = computed(() => fullscreenModal.isVisible.value)
const fullscreenModalTitle = computed(() => fullscreenModal.title.value)

// 监听 fullscreenModal 变化
/*
watch(() => fullscreenModal.isVisible.value, (val) => {
  console.log('[TitleBar] fullscreenModal.isVisible 变化:', val)
}, 
{ immediate: true })*/

const minimize = () => (window.pywebview?.api as any)?.minimize_window?.()
const close = () => (window.pywebview?.api as any)?.close_window?.()
const handleClose = () => fullscreenModal.close()
</script>