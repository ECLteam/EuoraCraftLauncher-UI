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
            <a href="#main-content" class="skip-link">跳到主要内容</a>
            <div class="app-layout">
              <!-- 顶部栏 - 始终可交互 -->
              <TitleBar
                class="app-titlebar"
                :class="{ 'titlebar-disabled': !isAgreementAccepted && !agreementLoading }"
              />

              <!-- 主体区域：侧边栏 + 内容区 -->
              <div class="app-body" :class="{ 'app-body-disabled': !isAgreementAccepted && !agreementLoading }">
                <SideBar />

                <!-- 插件：侧栏扩展插槽 -->
                <div id="plugin-slot-sidebar-extra" class="plugin-slot-container plugin-sidebar-slot" />

                <!-- 内容区 - 全屏弹窗仅覆盖此区域 -->
                <main
                  id="main-content"
                  class="main-content"
                  :class="{ 'content-disabled': !isAgreementAccepted && !agreementLoading }"
                  tabindex="-1"
                >
                  <!-- 插件：内容区顶部插槽 -->
                  <div id="plugin-slot-content-top" class="plugin-slot-container" />
                  <div v-if="isAgreementAccepted" class="page-container">
                    <RouterView v-slot="{ Component, route: currentRoute }">
                      <Transition name="page" mode="out-in">
                        <component :is="Component" :key="currentRoute.matched[0]?.path || currentRoute.path" />
                      </Transition>
                    </RouterView>
                    <!-- 插件：页面底部插槽 -->
                    <div id="plugin-slot-page-bottom" class="plugin-slot-container" />
                  </div>

                  <!-- 未同意协议时的占位提示 
                  <div v-else class="agreement-placeholder">
                    <UiIcon name="info" />
                    <p>{{ t('agreement.pleaseAccept') }}</p>
                  </div-->

                  <!-- 全局消息组件 -->
                  <GlassMessage ref="messageRef" />

                  <!-- 插件：内容区底部插槽 -->
                  <div id="plugin-slot-content-bottom" class="plugin-slot-container" />

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

                  <!-- 全局错误弹窗 -->
                  <ErrorModal
                    v-model:visible="showErrorModal"
                    :title="errorTitle"
                    :message="errorMessage"
                    :detail="errorDetail"
                    :errorId="errorId"
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
                      <a :href="agreementUrl" target="_blank" class="agreement-link-btn">
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
  dateEnUS,
  dateZhCN,
  enUS,
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  NNotificationProvider,
  zhCN,
} from 'naive-ui'
import { computed, onMounted, onUnmounted, provide, readonly, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { desktopWindow } from '@/app/runtime/desktopWindow'
import { useAppRuntime } from '@/app/runtime/useAppRuntime'
import SideBar from '@/components/layout/SideBar.vue'
import TitleBar from '@/components/layout/TitleBar.vue'
import ErrorModal from '@/components/modals/ErrorModal.vue'
import Modal from '@/components/modals/Modal.vue'
import TaskQueuePanel from '@/components/panels/TaskQueuePanel.vue'
import GlassMessage from '@/components/ui/GlassMessage.vue'
import { useFullscreenModal } from '@/composables/useFullscreenModal'
import { setMessageRef, useGlassMessage } from '@/composables/useGlassMessage'
import { useTheme } from '@/composables/useTheme'
import { useUserAgreement } from '@/composables/useUserAgreement'

const router = useRouter()
const { naiveTheme, themeOverrides } = useTheme()

const { locale, t } = useI18n()
const {
  isAccepted: isAgreementAccepted,
  isLoading: agreementLoading,
  agreementUrl,
  markNotAccepted,
  acceptUserAgreement,
} = useUserAgreement()
const fullscreenModal = useFullscreenModal()
const message = useGlassMessage()

const messageRef = ref<InstanceType<typeof GlassMessage> | null>(null)
const showAgreementModal = ref(false)
const showQuitConfirmModal = ref(false)

const appRuntime = useAppRuntime({
  router,
  t: (key) => t(key),
  message,
  markAgreementNotAccepted: markNotAccepted,
  showAgreementModal,
})

const { showErrorModal, errorTitle, errorMessage, errorDetail, errorId } = appRuntime

provide('devMode', appRuntime.isDevMode)
provide('launcherVersion', appRuntime.launcherVersion)
provide('launcherVersionType', appRuntime.launcherVersionType)
provide('gameConfig', appRuntime.gameConfig)
provide('downloadConfig', appRuntime.downloadConfig)
provide('runtimeMode', appRuntime.runtimeMode)

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
  await desktopWindow.close()
}

onMounted(async () => {
  if (messageRef.value) setMessageRef(messageRef.value)
  fullscreenModal.reset()
  try {
    await appRuntime.start()
  } catch (error) {
    console.error('[App] 应用运行层初始化失败:', error)
  }
})

onUnmounted(() => {
  appRuntime.stop()
})
</script>

<style src="@/styles/app.css"></style>
<style scoped src="@/styles/AppScoped.css"></style>
