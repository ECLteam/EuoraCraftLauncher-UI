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
                <SideBar 
                  :class="['app-sidebar', { 'sidebar-disabled': !isAgreementAccepted && !agreementLoading }]"
                />
                
                <!-- 内容区 - 全屏弹窗仅覆盖此区域 -->
                <main 
                  class="main-content"
                  :class="{ 'content-disabled': !isAgreementAccepted && !agreementLoading }"
                  id="main-content" tabindex="-1"
                >
                  <div class="page-container" v-if="isAgreementAccepted">
                    <router-view />
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
import { ref, onMounted, computed, provide, readonly, type Ref } from 'vue'
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
import MouseEffect from '@/components/effects/MouseEffect.vue'
import { useTheme } from '@/composables/useTheme'
//import { usePageTransition } from '@/composables/useAnimation'
import { setMessageRef } from '@/composables/useGlassMessage'
import { checkUserAgreement, acceptUserAgreement, useUserAgreement } from '@/composables/useUserAgreement'
import { useFullscreenModal } from '@/composables/useFullscreenModal'
import { api } from '@/utils/api'
import { i18n, supportedLocales, setLocalStoredLocale } from '@/i18n'

const { naiveTheme, themeOverrides, initTheme } = useTheme()
//const { beforeEnter, enter, leave } = usePageTransition()
const { locale, t } = useI18n()
const { isAccepted: isAgreementAccepted, isLoading: agreementLoading, agreementUrl } = useUserAgreement()
const fullscreenModal = useFullscreenModal()

// 调试模式 - 从后端 launcher 配置读取
const isDevMode = ref(false)
provide('devMode', readonly(isDevMode))

// 全局配置缓存 - 在启动时加载，供子组件使用
const globalGameConfig = ref<any>(null)
provide('gameConfig', readonly(globalGameConfig) as Readonly<Ref<any>>)
const globalDownloadConfig = ref<any>(null)
provide('downloadConfig', readonly(globalDownloadConfig) as Readonly<Ref<any>>)

// 鼠标点击效果配置
const mouseEffectEnabled = ref(false)
const mouseEffectColor = ref('45,175,255')
const mouseEffectScale = ref(1.5)
const mouseEffectOpacity = ref(1.0)
const mouseEffectSpeed = ref(1.0)

// 从后端加载鼠标效果配置
const applyMouseEffectConfig = (config: any) => {
  mouseEffectEnabled.value = config.enabled ?? false
  mouseEffectColor.value = config.color ?? '45,175,255'
  mouseEffectScale.value = config.scale ?? 1.5
  mouseEffectOpacity.value = config.opacity ?? 1.0
  mouseEffectSpeed.value = config.speed ?? 1.0
}

const loadMouseEffectConfig = async () => {
  try {
    const result = await api.getMouseEffectConfig()
    if (result.success && result.data) {
      applyMouseEffectConfig(result.data)
    }
  } catch (e) {
    console.error('加载鼠标效果配置失败:', e)
  }
}

// 监听设置页面的事件
const setupMouseEffectListeners = () => {
  window.addEventListener('mouseEffectChange', async (event: any) => {
    mouseEffectEnabled.value = event.detail.enabled
    await loadMouseEffectConfig()
  })
  window.addEventListener('mouseEffectUpdate', async (_event: any) => {
    await loadMouseEffectConfig()
  })
}

// 根据当前语言选择 Naive UI 的 locale
const naiveLocale = computed(() => {
  return locale.value === 'zh-CN' ? zhCN : enUS
})

const naiveDateLocale = computed(() => {
  return locale.value === 'zh-CN' ? dateZhCN : dateEnUS
})

const messageRef = ref<InstanceType<typeof GlassMessage> | null>(null)
const showAgreementModal = ref(false)
const showQuitConfirmModal = ref(false)

// 提供协议状态给子组件
provide('agreementAccepted', readonly(isAgreementAccepted))

// 检查用户协议
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

const handleQuitConfirm = () => {
  showQuitConfirmModal.value = false
  ;(window.pywebview?.api as any)?.close_window?.()
}

onMounted(async () => {
  if (messageRef.value) setMessageRef(messageRef.value)

  setupMouseEffectListeners()

  const init = async () => {
    console.log('[App] 开始初始化主题配置...')
    fullscreenModal.reset()

    // 加载所有配置（内部会调用 initTheme 并传入预加载配置）
    await loadAllConfigs()
    await checkAgreement()

    console.log('[App] 配置初始化完成')
  }

  // 检查 pywebview API 是否可用
  if (window.pywebview?.api) {
    console.log('[App] pywebview API 已可用，开始初始化')
    await init()
  } else {
    console.log('[App] 等待 pywebviewready 事件...')
    window.addEventListener('pywebviewready', () => {
      console.log('[App] pywebviewready 事件触发，开始初始化')
      init()
    })

    // 添加超时检查，防止 pywebviewready 事件未触发
    setTimeout(() => {
      if (window.pywebview?.api) {
        console.log('[App] 超时检查：pywebview API 已可用，开始初始化')
        init()
      } else {
        console.warn('[App] 超时检查：pywebview API 仍未可用，尝试使用本地配置')
        initTheme()
      }
    }, 3000)
  }
})

// 加载所有配置
const loadAllConfigs = async () => {
  if (!window.pywebview?.api) return

  try {
    console.log('[App] 开始加载后端配置...')

    // 同时请求所有配置
    const [launcherRes, gameRes, downloadRes, localeRes, themeRes, backgroundRes, mouseEffectRes] = await Promise.all([
      api.getLauncherConfig().catch(() => ({ success: false, data: null })),
      api.getGameConfig().catch(() => ({ success: false, data: null })),
      api.getDownloadConfig().catch(() => ({ success: false, data: null })),
      api.getLocaleConfig().catch(() => ({ success: false, data: null })),
      api.getThemeConfig().catch(() => ({ success: false, data: null })),
      api.getBackgroundConfig().catch(() => ({ success: false, data: null })),
      api.getMouseEffectConfig().catch(() => ({ success: false, data: null }))
    ])

    // 应用启动器配置（debug 模式等）
    if (launcherRes.success && launcherRes.data) {
      isDevMode.value = launcherRes.data.debug === true
      console.log('[App] 启动器配置加载成功:', launcherRes.data)
    }

    // 缓存游戏配置供子组件使用
    if (gameRes.success && gameRes.data) {
      globalGameConfig.value = gameRes.data
      console.log('[App] 游戏配置加载成功:', gameRes.data)
    }

    // 缓存下载配置供子组件使用
    if (downloadRes.success && downloadRes.data) {
      globalDownloadConfig.value = downloadRes.data
      console.log('[App] 下载配置加载成功:', downloadRes.data)
    }

    // 应用语言配置
    if (localeRes.success && localeRes.data?.locale) {
      const locale = localeRes.data.locale
      if (supportedLocales.some(l => l.code === locale)) {
        i18n.global.locale.value = locale as any
        setLocalStoredLocale(locale)
        document.documentElement.setAttribute('lang', locale)
        console.log('[App] 语言配置加载成功:', locale)
      }
    }

    // 应用鼠标效果配置
    if (mouseEffectRes.success && mouseEffectRes.data) {
      applyMouseEffectConfig(mouseEffectRes.data)
      console.log('[App] 鼠标效果配置加载成功:', mouseEffectRes.data)
    }

    // 将预加载的主题/背景配置传给 initTheme，避免重复请求
    await initTheme(themeRes, backgroundRes)

    console.log('[App] 所有配置加载完成')
  } catch (error) {
    console.error('[App] 配置加载失败:', error)
    // 即使预加载失败，仍尝试初始化主题（会使用本地存储回退）
    await initTheme()
  }
}
</script>

<style>
/* 跳过链接样式 */
.skip-link {
  position: absolute;
  top: -48px;
  left: 12px;
  background: var(--color-primary);
  color: white;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  text-decoration: none;
  font-size: 14px;
  z-index: 10000;
  transition: top 0.2s ease;
}

.skip-link:focus {
  top: 12px;
}

/* 应用根容器 */
#app {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* 背景层 */
.app-background {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-app);
  background-image: var(--bg-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(var(--bg-blur));
  transform: scale(1.1);
  z-index: 0;
  transition: background-image 0.5s ease, filter 0.5s ease, background-color 0.5s ease;
}

.app-background::after {
  content: "";
  position: absolute;
  inset: 0;
  background-color: transparent;
  transition: background-color 0.3s ease;
}

[data-theme="dark"] .app-background {
  background-color: var(--bg-app);
}

[data-theme="dark"] .app-background::after {
  background-color: rgba(0, 0, 0, 0.4);
}

/* 主布局 */
.app-layout {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: transparent; /* 透明以显示背景图片 */
  color: var(--text-primary);
}

/* 顶部栏 */
.app-titlebar {
  flex-shrink: 0;
  height: 42px;
  width: 100%;
  z-index: 1000;
}

/* 主体区域 */
.app-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0; /* 重要：允许 flex 子项收缩 */
}

/* 侧边栏 */
.app-sidebar {
  flex-shrink: 0;
  height: 100%;
  z-index: 100;
  transition: opacity 0.3s ease;
}

.sidebar-disabled {
  pointer-events: none;
}

/* 协议未同意时的禁用状态 */
.app-body-disabled {
  pointer-events: none;
}

.app-body-disabled .app-sidebar {
  pointer-events: none;
}

.app-body-disabled .main-content {
  pointer-events: none;
}

/* 全屏弹窗需要重新启用交互 */
.app-body-disabled .main-content .content-modal {
  pointer-events: auto;
}



/* 内容区 */
.main-content {
  flex: 1;
  min-width: 0; /* 重要：允许 flex 子项收缩 */
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  position: relative; /* 关键：作为全屏弹窗的定位上下文 */
  background-color: transparent;
}

.content-disabled {
  opacity: 0.5;
}

/* 协议占位提示 */
.agreement-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-secondary);
}

.agreement-placeholder .icon {
  font-size: 48px;
  opacity: 0.5;
}

.agreement-placeholder p {
  font-size: 16px;
  margin: 0;
}

/* 页面切换动画 */
.main-content {
  position: relative;
}
.skip-link {
  position: absolute;
  left: 16px;
  top: -48px;
  z-index: 2000;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: var(--bg-surface-active);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
}
.skip-link:focus {
  top: 12px;
}

/* 页面容器 */
.page-container {
  width: 100%;
  height: 100%;
}

/* 用户协议弹窗 */
.agreement-modal-body {
  max-height: calc(100vh - 200px); /* 减去顶部栏和边距 */
  overflow-y: auto;
  padding: 0;
}

/* 用户协议内容 */
.agreement-content {
  width: 100%;
  height: 100%;
  padding: 32px;
  background: transparent;
}

.agreement-simple {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
}

.agreement-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-primary-alpha, rgba(24, 144, 255, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
}

.agreement-icon .icon {
  font-size: 32px;
  color: var(--color-primary);
}

.agreement-simple h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.agreement-desc {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  max-width: 360px;
}

/* 协议内容动画 */
.agreement-simple {
  animation: agreement-fade-in var(--duration-normal) var(--ease-standard);
}

@keyframes agreement-fade-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 图标动画 */
.agreement-icon {
  animation: agreement-icon-scale var(--duration-slow) var(--ease-spring);
}

@keyframes agreement-icon-scale {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 标题动画 */
.agreement-simple h2 {
  animation: agreement-slide-up var(--duration-normal) var(--ease-standard) 0.1s both;
}

/* 描述动画 */
.agreement-desc {
  animation: agreement-slide-up var(--duration-normal) var(--ease-standard) 0.15s both;
}

@keyframes agreement-slide-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 跳转阅读按钮 */
.agreement-link-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 10px 24px;
  background: var(--color-primary);
  color: #fff !important;
  text-decoration: none !important;
  font-weight: 500;
  border-radius: 8px;
  transition: 
    transform var(--duration-normal) var(--ease-standard),
    box-shadow var(--duration-normal) var(--ease-standard);
  will-change: transform;
  animation: agreement-slide-up var(--duration-normal) var(--ease-standard) 0.2s both;
  transform: translateY(0);
}

.agreement-link-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 120, 212, 0.3);
  color: #fff !important;
}

.agreement-link-btn:hover .icon {
  transform: scale(1.05);
}

.agreement-link-btn:active {
  transform: translateY(0) scale(0.98);
}

.agreement-link-btn .icon {
  font-size: 14px;
  transition: transform var(--duration-fast) var(--ease-spring);
}

/* 暗色主题适配 */
[data-theme="dark"] .agreement-link-btn:hover {
  box-shadow: 0 4px 12px rgba(0, 120, 212, 0.45);
}
</style>