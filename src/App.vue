<template>
  <NConfigProvider 
    :theme="naiveTheme" 
    :themeOverrides="themeOverrides"
    :locale="naiveLocale"
    :dateLocale="naiveDateLocale"
  >
    <NDialogProvider>
      <NMessageProvider>
        <NNotificationProvider>
          <div id="app">
            <!-- 背景层 -->
            <div class="app-background" />
            <div class="app-background-overlay" />
            
            <!-- 主布局 -->
            <a
              href="#main-content"
              class="skip-link"
            >跳到主要内容</a>
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

                <!-- 插件：侧栏扩展插槽 -->
                <div
                  id="plugin-slot-sidebar-extra"
                  class="plugin-slot-container plugin-sidebar-slot"
                />
                
                <!-- 内容区 - 全屏弹窗仅覆盖此区域 -->
                <main 
                  id="main-content"
                  class="main-content"
                  :class="{ 'content-disabled': !isAgreementAccepted && !agreementLoading }"
                  tabindex="-1"
                >
                  <div
                    v-if="isAgreementAccepted"
                    class="page-container"
                  >
                    <RouterView v-slot="{ Component, route: currentRoute }">
                      <Transition
                        name="page"
                        mode="out-in"
                      >
                        <component
                          :is="Component"
                          :key="currentRoute.matched[0]?.path || currentRoute.path"
                        />
                      </Transition>
                    </RouterView>
                    <!-- 插件：页面底部插槽 -->
                    <div
                      id="plugin-slot-page-bottom"
                      class="plugin-slot-container"
                    />
                  </div>
                  
                  <!-- 未同意协议时的占位提示 
                  <div v-else class="agreement-placeholder">
                    <UiIcon name="info" />
                    <p>{{ t('agreement.pleaseAccept') }}</p>
                  </div-->
                  
                  <!-- 全局消息组件 -->
                  <GlassMessage ref="messageRef" />
                  
                  <!-- 任务队列全屏面板 -->
                  <TaskQueuePanel />

                  <!-- 退出确认弹窗 -->
                  <Modal
                    v-model:visible="showQuitConfirmModal"
                    type="confirm"
                    :title="t('common.confirm')"
                    :content="t('agreement.quitConfirm')"
                    danger
                    @confirm="handleQuitConfirm"
                  />

                  <!-- 用户协议弹窗 -->
                  <Modal
                    :visible="showAgreementModal"
                    type="agreement"
                    :title="t('agreement.title')"
                    :closable="false"
                    :showCloseBtn="false"
                    :showFooter="true"
                    bodyClass="agreement-modal-body"
                    @confirm="handleAgreementAccept"
                    @cancel="handleAgreementReject"
                  >
                    <div class="agreement-content agreement-simple">
                      <div class="agreement-icon">
                        <UiIcon name="file-text" />
                      </div>
                      <h2>{{ t('agreement.pleaseRead') }}</h2>
                      <p class="agreement-desc">
                        {{ t('agreement.description') }}
                      </p>
                      <a
                        :href="agreementUrl"
                        target="_blank"
                        class="agreement-link-btn"
                      >
                        <UiIcon name="external-link" />
                        {{ t('agreement.viewFull') }}
                      </a>
                    </div>
                  </Modal>
                </main>
              </div>
            </div>
          </div>
        </NNotificationProvider>
      </NMessageProvider>
    </NDialogProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
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
import { ref, onMounted, onUnmounted, computed, provide, readonly, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import backend from '@/api/client'
import SideBar from '@/components/layout/SideBar.vue'
import TitleBar from '@/components/layout/TitleBar.vue'
import Modal from '@/components/modals/Modal.vue'
import TaskQueuePanel from '@/components/TaskQueuePanel.vue'
import GlassMessage from '@/components/ui/GlassMessage.vue'
import { useFullscreenModal } from '@/composables/useFullscreenModal'
import { setMessageRef, useGlassMessage } from '@/composables/useGlassMessage'
import { initPluginBridge, destroyPluginBridge } from '@/composables/usePluginBridge'
import { globalTaskQueue } from '@/composables/useTaskQueue'
import { initTheme, useTheme } from '@/composables/useTheme'
import { useUserAgreement } from '@/composables/useUserAgreement'
import { i18n, supportedLocales } from '@/i18n'
import type { BackendEvents, DownloadConfig, GameConfig, InstallProgress } from '@/types/api'

const router = useRouter()
const { naiveTheme, themeOverrides } = useTheme()

const { locale, t } = useI18n()
const { isAccepted: isAgreementAccepted, isLoading: agreementLoading, agreementUrl, markNotAccepted, acceptUserAgreement } = useUserAgreement()
const fullscreenModal = useFullscreenModal()
const message = useGlassMessage()

const messageRef = ref<InstanceType<typeof GlassMessage> | null>(null)
const showAgreementModal = ref(false)
const showQuitConfirmModal = ref(false)

const isDevMode = ref(false)
const globalGameConfig = ref<GameConfig | null>(null)
const globalDownloadConfig = ref<DownloadConfig | null>(null)
provide('devMode', readonly(isDevMode))
provide('gameConfig', readonly(globalGameConfig) as Readonly<Ref<GameConfig | null>>)
provide('downloadConfig', readonly(globalDownloadConfig) as Readonly<Ref<DownloadConfig | null>>)

provide('agreementAccepted', readonly(isAgreementAccepted))

// 根据当前语言选择 Naive UI 的 locale
const naiveLocale = computed(() => {
  return locale.value === 'zh-CN' ? zhCN : enUS
})

const naiveDateLocale = computed(() => {
  return locale.value === 'zh-CN' ? dateZhCN : dateEnUS
})

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

interface TauriGlobal {
  __TAURI__?: {
    pytauri?: unknown
    window?: {
      getCurrentWindow?: () => { close: () => Promise<void> }
    }
  }
}

const handleQuitConfirm = async () => {
  showQuitConfirmModal.value = false
  const w = (window as unknown as TauriGlobal).__TAURI__?.window?.getCurrentWindow?.()
  if (w) await w.close()
}

let cleanupContextMenuListeners: (() => void) | null = null
const unlistenNotify = backend.on('launcher:notify', (payload) => {
  if (payload.type === 'warning') {
    message.warning(payload.message, 8000)
  } else if (payload.type === 'info') {
    message.info(payload.message, 8000)
  }
})
const unlistenAgreement = backend.on('launcher:agreement_required', () => {
  markNotAccepted()
  showAgreementModal.value = true
})
function applyConfigPayload(payload: BackendEvents['config:init']) {
  const launcher = payload.launcher
  if (launcher) {
    isDevMode.value = launcher.is_dev === true
  }

  const game = payload.game
  if (game) {
    globalGameConfig.value = game
  }

  const download = payload.download
  if (download) {
    globalDownloadConfig.value = download
  }

  const ui = payload.ui
  if (ui) {
    if (ui.locale) {
      const loc = ui.locale
      if (supportedLocales.some(l => l.code === loc)) {
        i18n.global.locale.value = loc
        document.documentElement.setAttribute('lang', loc)
      }
    }
    initTheme(ui)
  }
}

// 后端推送完整配置，前端仅做渲染
const unlistenConfigInit = backend.on('config:init', (payload) => {
  if (!payload) return
  applyConfigPayload(payload)
})

// 插件 CSS 注入：创建或更新 <style> 标签
const unlistenCssInject = backend.on('plugin:css_injected', (payload) => {
  const pluginName = payload?.plugin || 'unknown'
  const css = payload?.css || ''
  const id = `plugin-css-${pluginName}`
  let styleEl = document.getElementById(id) as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = id
    styleEl.setAttribute('data-plugin', pluginName)
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = css
})

// 全局安装进度 → 任务队列
const unlistenInstallProgress = backend.on('game:install_progress', (payload: InstallProgress) => {
  const taskId = payload?.task_id
  if (!taskId) return

  const phase = payload?.phase || ''
  const msg = payload?.message || ''
  const done = payload?.done ?? 0
  const total = payload?.total ?? 1
  const subtask = payload?.subtask || ''

  if (phase === 'done') {
    globalTaskQueue.updateTask(taskId, {
      status: 'completed',
      progress: 100,
      message: msg || '安装完成',
    })
    if (subtask) {
      globalTaskQueue.addSubtask(taskId, { id: subtask, name: getSubtaskLabel(subtask), status: 'completed', message: msg })
    }
  } else if (phase === 'error') {
    globalTaskQueue.updateTask(taskId, {
      status: 'error',
      message: msg || '安装失败',
    })
    if (subtask) {
      globalTaskQueue.addSubtask(taskId, { id: subtask, name: getSubtaskLabel(subtask), status: 'error', message: msg })
    }
  } else if (phase === 'download') {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    globalTaskQueue.updateTask(taskId, {
      status: 'running',
      progress: Math.max(5, pct),
      message: msg,
    })
    if (subtask) {
      globalTaskQueue.addSubtask(taskId, { id: subtask, name: getSubtaskLabel(subtask), status: 'running', message: msg })
    }
  } else if (phase === 'install') {
    globalTaskQueue.updateTask(taskId, {
      status: 'running',
      progress: 3,
      message: msg,
    })
    if (subtask) {
      globalTaskQueue.addSubtask(taskId, { id: subtask, name: getSubtaskLabel(subtask), status: 'running', message: msg })
    }
  }
})

function getSubtaskLabel(subtask: string): string {
  const labels: Record<string, string> = {
    download_json: t('task.subtask.downloadJson'),
    download_assets: t('task.subtask.downloadAssets'),
    check_files: t('task.subtask.checkFiles'),
  }
  return labels[subtask] || subtask
}

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

  cleanupContextMenuListeners = setupContextMenuListeners()

  if ((window as unknown as TauriGlobal).__TAURI__?.pytauri) {
    fullscreenModal.reset()

    // 通知后端就绪，后端推送 config:init / agreement 等事件
    backend.command('frontend_ready').catch(() => { /* 忽略就绪通知错误 */ })

    // 主动拉取初始配置，前端不再自己生成默认配置
    loadInitialConfig()

    // 初始化插件桥接（监听路由注册、HTML注入、脚本注入）
    initPluginBridge(router)
  } else {
    console.warn('[App] PyTauri API 不可用，配置无法从后端加载')
  }
})

async function loadInitialConfig() {
  try {
    const result = await backend.config.getMany(['launcher', 'game', 'download', 'ui'])
    if (result.success && result.data) {
      applyConfigPayload(result.data as BackendEvents['config:init'])
    }
  } catch (error) {
    console.warn('[App] 主动拉取初始配置失败:', error)
  }
}

onUnmounted(() => {
  cleanupContextMenuListeners?.()
  unlistenNotify()
  unlistenAgreement()
  unlistenConfigInit()
  unlistenCssInject()
  unlistenInstallProgress()
  destroyPluginBridge()
})
</script>

<style src="@/styles/app.css"></style>
<style scoped src="@/styles/AppScoped.css"></style>
