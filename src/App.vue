<template>
  <n-config-provider 
    :theme="naiveTheme" 
    :theme-overrides="themeOverrides"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
  >
    <n-dialog-provider>
      <n-message-provider>
        <n-notification-provider>
          <div id="app">
            <!-- 背景层 -->
            <div class="app-background"></div>
            
            <!-- 鼠标点击效果 -->
            <MouseEffect 
              :enabled="mouseEffectEnabled" 
              :color="mouseEffectColor"
              :scale="mouseEffectScale"
              :opacity="mouseEffectOpacity"
              :speed="mouseEffectSpeed"
            />
            <a href="#main-content" class="skip-link">跳到主要内容</a>
            <!-- 主布局 -->
            <div class="app-layout">
              <!-- 顶部栏 - 始终可交互 -->
              <TitleBar 
                class="app-titlebar" 
                :class="{ 'titlebar-disabled': !isAgreementAccepted && !agreementLoading }"
              />
              
              <!-- 主体区域：侧边栏 + 内容区 -->
              <div 
                class="app-body"
                :class="{ 'app-body-disabled': !isAgreementAccepted && !agreementLoading }"
              >
                <SideBar />
                
                <!-- 内容区 - 全屏弹窗仅覆盖此区域 -->
                <main 
                  class="main-content"
                  :class="{ 'content-disabled': !isAgreementAccepted && !agreementLoading }"
                  id="main-content" tabindex="-1"
                >
                  <div class="page-container" v-if="isAgreementAccepted">
                    <router-view v-slot="{ Component, route: currentRoute }">
                      <Transition :name="'page'" mode="out-in">
                        <component :is="Component" :key="currentRoute.path" />
                      </Transition>
                    </router-view>
                  </div>
                  
                  <!-- 未同意协议时的占位提示 
                  <div v-else class="agreement-placeholder">
                    <UiIcon name="info" />
                    <p>{{ t('agreement.pleaseAccept') }}</p>
                  </div-->
                  
                  <!-- 全局消息组件 -->
                  <GlassMessage ref="messageRef" />
                  
                  <!-- 退出确认弹窗 -->
                  <ContentModal
                    v-model:visible="showQuitConfirmModal"
                    type="confirm"
                    :title="t('common.confirm')"
                    :content="t('agreement.quitConfirm')"
                    danger
                    show-backdrop
                    @confirm="handleQuitConfirm"
                  />

                  <!-- 用户协议弹窗 -->
                  <ContentModal
                    :visible="showAgreementModal"
                    type="agreement"
                    :title="t('agreement.title')"
                    :closable="false"
                    :show-close-btn="false"
                    :show-footer="true"
                    body-class="agreement-modal-body"
                    @confirm="handleAgreementAccept"
                    @cancel="handleAgreementReject"
                  >
                    <div class="agreement-content agreement-simple">
                      <div class="agreement-icon">
                        <UiIcon name="file-text" />
                      </div>
                      <h2>{{ t('agreement.pleaseRead') }}</h2>
                      <p class="agreement-desc">{{ t('agreement.description') }}</p>
                      <a :href="agreementUrl" target="_blank" class="agreement-link-btn">
                        <UiIcon name="external-link" />
                        {{ t('agreement.viewFull') }}
                      </a>
                    </div>
                  </ContentModal>
                </main>
              </div>
            </div>
          </div>
        </n-notification-provider>
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, provide, readonly } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  NNotificationProvider,
  zhCN,
  dateZhCN,
  enUS,
  dateEnUS
} from 'naive-ui'
import TitleBar from '@/components/layout/TitleBar.vue'
import SideBar from '@/components/layout/SideBar.vue'
import GlassMessage from '@/components/ui/GlassMessage.vue'
import ContentModal from '@/components/modals/ContentModal.vue'
import MouseEffect from '@/components/animation/MouseEffect.vue'
import { useTheme } from '@/composables/useTheme'
//import { usePageTransition } from '@/composables/useAnimation'
import { setMessageRef } from '@/composables/useGlassMessage'
import { checkUserAgreement, acceptUserAgreement, useUserAgreement } from '@/composables/useUserAgreement'
import { useFullscreenModal } from '@/composables/useFullscreenModal'
import backend from '@/api/client'
import { i18n, supportedLocales } from '@/i18n'

import { useAppInit } from '@/composables/useAppInit'
import { useMouseEffect } from '@/composables/useMouseEffect'

const { naiveTheme, themeOverrides, initTheme } = useTheme()
const { isDevMode, globalGameConfig, globalDownloadConfig, init: initApp } = useAppInit()
const { enabled: mouseEffectEnabled, color: mouseEffectColor, scale: mouseEffectScale, opacity: mouseEffectOpacity, speed: mouseEffectSpeed, init: initMouseEffect, dispose: disposeMouseEffect } = useMouseEffect()

const { locale, t } = useI18n()
const { isAccepted: isAgreementAccepted, isLoading: agreementLoading, agreementUrl } = useUserAgreement()
const fullscreenModal = useFullscreenModal()

const messageRef = ref<InstanceType<typeof GlassMessage> | null>(null)
const showAgreementModal = ref(false)
const showQuitConfirmModal = ref(false)

provide('agreementAccepted', readonly(isAgreementAccepted))

// 根据当前语言选择 Naive UI 的 locale
const naiveLocale = computed(() => {
  return locale.value === 'zh-CN' ? zhCN : enUS
})

const naiveDateLocale = computed(() => {
  return locale.value === 'zh-CN' ? dateZhCN : dateEnUS
})

const checkAgreement = async () => {
  const accepted = await checkUserAgreement()
  if (!accepted) {
    showAgreementModal.value = true
  }
}

const handleAgreementAccept = async () => {
  const success = await acceptUserAgreement()
  if (success) {
    showAgreementModal.value = false
    fullscreenModal.reset()
  }
}

const handleAgreementReject = () => {
  showQuitConfirmModal.value = true
}

const handleQuitConfirm = async () => {
  showQuitConfirmModal.value = false
  const w = (window as any).__TAURI__?.window?.getCurrentWindow?.()
  if (w) await w.close()
}

let cleanupContextMenuListeners: (() => void) | null = null

function setupContextMenuListeners() {
  const isEditable = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false
    const el = target as HTMLElement
    const tag = el.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true
    if (el.closest('[contenteditable="true"]')) return true
    return false
  }

  const onContextMenu = (e: MouseEvent) => {
    if (!isDevMode.value) {
      e.preventDefault()
    }
  }

  const onSelectStart = (e: Event) => {
    if (isDevMode.value) return
    if (isEditable(e.target)) return
    if ((e as MouseEvent).altKey) return
    e.preventDefault()
  }

  const onCopy = (e: ClipboardEvent) => {
    if (isDevMode.value) return
    if (isEditable(e.target)) return
    e.preventDefault()
  }

  document.addEventListener('contextmenu', onContextMenu)
  document.addEventListener('selectstart', onSelectStart)
  document.addEventListener('copy', onCopy)

  return () => {
    document.removeEventListener('contextmenu', onContextMenu)
    document.removeEventListener('selectstart', onSelectStart)
    document.removeEventListener('copy', onCopy)
  }
}

onMounted(async () => {
  if (messageRef.value) setMessageRef(messageRef.value)

  initMouseEffect()
  cleanupContextMenuListeners = setupContextMenuListeners()

  await checkAgreement()

  if ((window as any).__TAURI__?.pytauri) {
    console.log('[App] PyTauri API 已可用，开始初始化')
    fullscreenModal.reset()

    const { mouseEffectRes } = await initApp()
    if (mouseEffectRes?.success && mouseEffectRes.data) {
      useMouseEffect().applyConfig(mouseEffectRes.data)
    }

    console.log('[App] 配置初始化完成')
  } else {
    console.warn('[App] PyTauri API 不可用，尝试使用本地配置')
    initTheme()
  }
})

onUnmounted(() => {
  disposeMouseEffect()
  cleanupContextMenuListeners?.()
})
</script>

<style src="@/styles/app.css"></style>