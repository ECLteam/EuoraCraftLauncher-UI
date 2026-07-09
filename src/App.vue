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
            
            <!-- 主布局 -->
            <a href="#main-content" class="skip-link">跳到主要内容</a>
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
                <div id="plugin-slot-sidebar-extra" class="plugin-slot-container plugin-sidebar-slot"></div>
                
                <!-- 内容区 - 全屏弹窗仅覆盖此区域 -->
                <main 
                  class="main-content"
                  :class="{ 'content-disabled': !isAgreementAccepted && !agreementLoading }"
                  id="main-content" tabindex="-1"
                >
                  <div class="page-container" v-if="isAgreementAccepted">
                    <router-view v-slot="{ Component, route: currentRoute }">
                      <component :is="Component" :key="currentRoute.matched[0]?.path || currentRoute.path" />
                    </router-view>
                    <!-- 插件：页面底部插槽 -->
                    <div id="plugin-slot-page-bottom" class="plugin-slot-container"></div>
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

                  <!-- 主密码设置弹窗 -->
                  <n-modal
                    v-model:show="showPasswordModal"
                    :mask-closable="false"
                    preset="card"
                    title="设置主密码"
                    class="password-modal"
                    style="width: 420px"
                  >
                    <n-form-item label="主密码">
                      <n-input
                        v-model:value="passwordInput"
                        type="password"
                        placeholder="请输入至少8位密码"
                        @keydown.enter="handleSetPassword"
                      />
                    </n-form-item>
                    <n-form-item label="确认密码">
                      <n-input
                        v-model:value="passwordConfirm"
                        type="password"
                        placeholder="请再次输入密码"
                        @keydown.enter="handleSetPassword"
                      />
                    </n-form-item>
                    <template #footer>
                      <n-button type="primary" @click="handleSetPassword">确认</n-button>
                    </template>
                  </n-modal>
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
  NModal,
  NFormItem,
  NInput,
  NButton,
  zhCN,
  dateZhCN,
  enUS,
  dateEnUS
} from 'naive-ui'
import TitleBar from '@/components/layout/TitleBar.vue'
import SideBar from '@/components/layout/SideBar.vue'
import GlassMessage from '@/components/ui/GlassMessage.vue'
import ContentModal from '@/components/modals/ContentModal.vue'
import TaskQueuePanel from '@/components/TaskQueuePanel.vue'
import { globalTaskQueue } from '@/composables/useTaskQueue'
import { initTheme, useTheme } from '@/composables/useTheme'
import { setMessageRef, useGlassMessage } from '@/composables/useGlassMessage'
import { acceptUserAgreement, useUserAgreement } from '@/composables/useUserAgreement'
import { useFullscreenModal } from '@/composables/useFullscreenModal'
import { initPluginBridge, destroyPluginBridge } from '@/composables/usePluginBridge'
import backend from '@/api/client'
import { i18n, supportedLocales } from '@/i18n'
import { useRouter } from 'vue-router'

const router = useRouter()
const { naiveTheme, themeOverrides } = useTheme()

const { locale, t } = useI18n()
const { isAccepted: isAgreementAccepted, isLoading: agreementLoading, agreementUrl, markNotAccepted } = useUserAgreement()
const fullscreenModal = useFullscreenModal()
const message = useGlassMessage()

const messageRef = ref<InstanceType<typeof GlassMessage> | null>(null)
const showAgreementModal = ref(false)
const showQuitConfirmModal = ref(false)
const showPasswordModal = ref(false)
const passwordInput = ref('')
const passwordConfirm = ref('')

const isDevMode = ref(false)
const globalGameConfig = ref<any>(null)
const globalDownloadConfig = ref<any>(null)
provide('devMode', readonly(isDevMode))
provide('gameConfig', readonly(globalGameConfig) as Readonly<Ref<any>>)
provide('downloadConfig', readonly(globalDownloadConfig) as Readonly<Ref<any>>)

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

const handleQuitConfirm = async () => {
  showQuitConfirmModal.value = false
  const w = (window as any).__TAURI__?.window?.getCurrentWindow?.()
  if (w) await w.close()
}

const handleSetPassword = async () => {
  if (passwordInput.value.length < 8) {
    message.warning(t('password.minLength'))
    return
  }
  if (passwordInput.value !== passwordConfirm.value) {
    message.warning(t('password.mismatch'))
    return
  }
  const result = await backend.command('set_master_password', { password: passwordInput.value })
  if (result.success) {
    message.success(t('password.success'))
    showPasswordModal.value = false
    passwordInput.value = ''
    passwordConfirm.value = ''
  } else {
    message.warning(result.message || t('password.failed'))
  }
}

let cleanupContextMenuListeners: (() => void) | null = null
const unlistenNotify = backend.on('launcher:notify', (payload: any) => {
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
const unlistenPassword = backend.on('keyring:password_required', () => {
  showPasswordModal.value = true
})

// 后端推送完整配置，前端仅做渲染
const unlistenConfigInit = backend.on('config:init', (payload: any) => {
  if (!payload) return

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
      if (supportedLocales.some((l: any) => l.code === loc)) {
        i18n.global.locale.value = loc as any
        document.documentElement.setAttribute('lang', loc)
      }
    }
    initTheme(ui)
  }
})

// 插件 CSS 注入：创建或更新 <style> 标签
const unlistenCssInject = backend.on('plugin:css_injected', (payload: any) => {
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
const unlistenInstallProgress = backend.on('game:install_progress', (payload: any) => {
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

  if ((window as any).__TAURI__?.pytauri) {
    console.log('[App] PyTauri API 已可用，开始初始化')
    fullscreenModal.reset()

    // 通知后端就绪，后端推送 config:init / agreement / keyring 等事件
    backend.command('frontend_ready').catch(() => {})

    // 初始化插件桥接（监听路由注册、HTML注入、脚本注入）
    initPluginBridge({} as any, router)

    console.log('[App] 初始化完成')
  } else {
    console.warn('[App] PyTauri API 不可用，尝试使用本地配置')
    initTheme({})
  }
})

onUnmounted(() => {
  cleanupContextMenuListeners?.()
  unlistenNotify()
  unlistenAgreement()
  unlistenPassword()
  unlistenConfigInit()
  unlistenCssInject()
  unlistenInstallProgress()
  destroyPluginBridge()
})
</script>

<style src="@/styles/app.css"></style>

<style scoped>
.plugin-slot-container {
  width: 100%;
}

.plugin-slot-container:empty {
  display: none;
}

.plugin-sidebar-slot {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 200px;
  z-index: 5;
  pointer-events: none;
}

.plugin-sidebar-slot .plugin-slot-item {
  pointer-events: auto;
}
</style>