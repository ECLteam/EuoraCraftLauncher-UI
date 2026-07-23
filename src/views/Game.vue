<template>
  <div ref="gamePageRef" class="game-page">
    <!-- 左侧：内容区 -->
    <div class="game-left">
      <!-- 插件：游戏页左侧插槽 -->
      <div id="plugin-slot-game-left" class="plugin-slot-container" />
    </div>

    <!-- 右侧：固定 320px 卡片组 -->
    <div class="game-right">
      <!-- 插件：游戏页右侧顶部插槽 -->
      <div id="plugin-slot-game-right-top" class="plugin-slot-container" />
      <Transition name="slide-out" mode="out-in">
        <!-- 账户卡片 + 你知道吗 -->
        <div v-if="!launchProgress.visible" key="cards" class="game-right-cards">
          <!-- 账户卡片 -->
          <div class="account-card">
            <div class="account-info">
              <AvatarRenderer
                v-if="account.currentAccount"
                class="account-avatar"
                :uuid="account.currentAccount?.uuid"
                :username="account.currentAccount?.alias"
                :typeName="account.currentAccount?.type"
                :skinUrl="account.currentAccount?.skinUrl"
                :size="40"
              />
              <div v-else class="account-avatar-placeholder">
                <UiIcon name="user" :size="20" />
              </div>
              <div class="account-details">
                <div class="account-name">
                  {{ account.currentAccount?.alias || t('game.noAccount') }}
                </div>
                <div class="account-type">
                  {{ account.currentAccount ? account.accountTypeLabel : t('game.clickManageToAdd') }}
                </div>
              </div>
              <button class="account-manage-btn" @click="account.openAccountModal">
                {{ t('game.manage') }}
              </button>
            </div>
          </div>

          <!-- 信息卡片 / 公告栏 -->
          <div class="info-card">
            <!-- 右上角切换按钮 -->
            <button
              v-if="canToggleInfoCard"
              class="info-toggle-btn"
              :title="infoCardMode === 'tip' ? '查看公告' : '查看小贴士'"
              @click="toggleInfoCard"
            >
              <UiIcon :name="infoCardMode === 'tip' ? 'bell' : 'lightbulb'" :size="14" />
            </button>

            <!-- 你知道吗 / 欢迎 -->
            <Transition name="info-fade" mode="out-in">
              <div v-if="infoCardMode === 'tip'" key="tip" class="info-tip">
                <div class="info-header">
                  <UiIcon name="lightbulb" :size="16" />
                  <span class="info-title">{{
                    isWelcome ? welcomeInfo?.title || t('game.welcomeTitle') : t('game.didYouKnow')
                  }}</span>
                </div>
                <p class="info-content">
                  {{ isWelcome ? welcomeInfo?.content || t('game.welcomeContent') : currentTip }}
                </p>
              </div>

              <!-- 公告栏 -->
              <div v-else key="announce" class="info-announce">
                <div class="info-header">
                  <UiIcon name="bell" :size="16" />
                  <span class="info-title">{{ t('game.announcement') }}</span>
                </div>
                <div class="announce-list">
                  <div v-if="!hasAnnouncements" class="announce-empty">
                    {{ t('game.noAnnouncements') }}
                  </div>
                  <template v-else-if="infoCardData.mode === 'rotate'">
                    <div v-if="currentAnnouncement" class="announce-item">
                      <div class="announce-item-header">
                        <span class="announce-item-title">{{ currentAnnouncement.title }}</span>
                        <span class="announce-item-date">{{ currentAnnouncement.date }}</span>
                      </div>
                      <p class="announce-item-desc">
                        {{ currentAnnouncement.content }}
                      </p>
                    </div>
                  </template>
                  <template v-else>
                    <div v-for="(item, idx) in infoCardData.announcements" :key="idx" class="announce-item">
                      <div class="announce-item-header">
                        <span class="announce-item-title">{{ item.title }}</span>
                        <span class="announce-item-date">{{ item.date }}</span>
                      </div>
                      <p class="announce-item-desc">
                        {{ item.content }}
                      </p>
                    </div>
                  </template>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- 启动进度（内嵌，替代弹窗） -->
        <div v-else key="progress" class="launch-progress-card">
          <div class="lp-header">
            <div class="lp-icon-wrap" :class="{ 'has-item-image': launchVersionVisual.image }">
              <img
                v-if="launchVersionVisual.image"
                :src="launchVersionVisual.image"
                alt=""
                class="lp-version-icon-img"
              />
              <UiIcon v-else :name="launchVersionVisual.icon" :size="22" />
            </div>
            <div class="lp-title-area">
              <h3 class="lp-title">
                {{ lpState.title }}
              </h3>
              <p class="lp-version">
                {{ lpState.versionName }}
              </p>
            </div>
          </div>

          <!-- 进度条 -->
          <div class="lp-bar-wrapper">
            <div class="lp-bar-track">
              <div
                class="lp-bar-fill"
                :class="{ indeterminate: lpState.displayPercent < 0 }"
                :style="{ width: lpState.displayPercent >= 0 ? lpState.displayPercent + '%' : undefined }"
              />
            </div>
            <span class="lp-bar-percent">{{
              lpState.displayPercent >= 0 ? Math.round(lpState.displayPercent) + '%' : '...'
            }}</span>
          </div>

          <!-- 信息面板 -->
          <div class="lp-info">
            <div class="lp-info-row">
              <span class="lp-info-label">当前步骤</span>
              <span class="lp-info-value">{{ launchProgress.stage }}</span>
            </div>
            <div v-if="launchProgress.message" class="lp-info-row">
              <span class="lp-info-label">详细信息</span>
              <span class="lp-info-value lp-info-detail">{{ launchProgress.message }}</span>
            </div>
          </div>

          <!-- 取消按钮 -->
          <button class="lp-cancel-btn" @click="handleLaunchProgressCancel">
            <UiIcon name="close" :size="14" />
            {{ t('common.cancel') }}
          </button>
        </div>
      </Transition>

      <!-- 启动 / 版本设置按钮组 -->
      <div
        v-if="!launchProgress.visible && hasGamePath"
        class="fab-launch-bar"
        :class="{ 'no-version-bar': version.versions.length === 0 }"
      >
        <!-- 插件：游戏页启动栏上方插槽 -->
        <div id="plugin-slot-game-launch-before" class="plugin-slot-container" />
        <!-- 第一行：启动按钮 + 版本管理按钮 -->
        <div class="fab-row-top">
          <button
            v-if="version.versions.length > 0"
            class="fab-launch-btn"
            :disabled="version.launching || !version.selectedVersion || !account.currentAccount"
            @click="version.launchGame(account.currentAccount)"
          >
            <UiIcon name="play" :size="16" />
            <span class="fab-launch-label">{{ version.launching ? t('game.launching') : t('game.launch') }}</span>
            <span class="fab-launch-version">{{ version.selectedVersion }}</span>
          </button>
          <button v-else class="fab-launch-btn no-version" @click="goToInstallVersion">
            <UiIcon name="download" :size="16" />
            <span class="fab-launch-label">{{ t('game.noVersionInstall') }}</span>
          </button>
          <button class="fab-manage-btn" title="版本管理" @click="goToInstallVersion">
            <UiIcon name="grid" :size="16" />
          </button>
        </div>
        <!-- 第二行：版本设置按钮（与第一行等宽） -->
        <button v-if="version.versions.length > 0" class="fab-settings-btn" title="版本设置" @click="openGameSettings">
          <UiIcon name="settings" :size="16" />
          <span class="fab-settings-label">版本设置</span>
        </button>
      </div>
    </div>

    <!-- 账户管理弹窗 -->
    <FullscreenModal
      v-model:visible="account.showAccountModal"
      :title="t('game.accountManagement')"
      :showFooter="false"
      bodyClass="account-modal-body"
    >
      <div class="account-container">
        <!-- 左侧：账户列表 -->
        <div class="account-list-panel">
          <div class="account-panel-header">
            <div class="account-panel-title">
              <UiIcon name="users" :size="14" />
              <span>{{ t('game.savedAccounts') }}</span>
            </div>
            <span v-if="account.accounts.length" class="account-count">{{ account.accounts.length }}</span>
          </div>

          <div class="account-list-body">
            <div v-if="account.accountsLoading" class="account-list-loading">
              <span>{{ t('app.loading') }}</span>
            </div>

            <div v-else-if="account.accounts.length === 0" class="account-list-empty">
              <UiIcon name="user-x" :size="36" />
              <span class="empty-title">{{ t('game.noAccounts') }}</span>
              <span class="empty-desc">{{ t('game.noAccountsDesc') }}</span>
            </div>

            <div v-else class="account-list">
              <div
                v-for="acc in account.accounts"
                :key="acc.id"
                :class="['account-list-item', { active: acc.isCurrent }]"
              >
                <AvatarRenderer
                  class="al-avatar"
                  :uuid="acc.uuid"
                  :username="acc.alias"
                  :typeName="acc.type"
                  :skinUrl="acc.skinUrl"
                  :size="32"
                />
                <div class="al-info">
                  <span class="al-name">{{ acc.alias }}</span>
                  <span class="al-meta">
                    <span :class="['al-badge', acc.type]">
                      {{
                        acc.type === 'microsoft'
                          ? t('game.accountTypeMicrosoft')
                          : acc.type === 'authlib'
                            ? t('game.accountTypeAuthlib')
                            : t('game.accountTypeOffline')
                      }}
                    </span>
                    <span v-if="acc.type === 'microsoft' && acc.email" class="al-email">{{ acc.email }}</span>
                    <span v-if="acc.type === 'authlib' && acc.auth_server" class="al-server">{{
                      acc.auth_server
                    }}</span>
                  </span>
                </div>
                <div class="al-actions">
                  <span v-if="acc.isCurrent" class="al-current">{{ t('game.current') }}</span>
                  <button v-else class="al-switch-btn" @click="account.switchAccount(acc.id)">
                    {{ t('game.switch') }}
                  </button>
                  <button
                    class="al-delete-btn"
                    :title="t('app.delete')"
                    @click="account.removeAccount(acc.id, acc.alias)"
                  >
                    <UiIcon name="delete" :size="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：添加账户面板 -->
        <div class="account-add-panel">
          <div class="account-panel-header">
            <div class="account-panel-title">
              <UiIcon name="plus" :size="14" />
              <span>{{ t('game.addAccount') }}</span>
            </div>
          </div>

          <div class="account-add-body">
            <div class="account-type-picker">
              <label class="add-form-label">{{ t('game.accountType') }}</label>
              <UiSelect
                v-model="selectedAccountType"
                class="account-type-select"
                :options="accountTypeOptions"
                :placeholder="t('game.selectAccountType')"
                @change="handleAccountTypeChange"
              />
            </div>

            <div :class="['account-type-intro', selectedAccountType]">
              <div class="account-type-icon">
                <UiIcon :name="selectedAccountMeta.icon" :size="18" />
              </div>
              <div class="account-type-copy">
                <strong>{{ selectedAccountMeta.label }}</strong>
                <p>{{ selectedAccountMeta.description }}</p>
              </div>
            </div>

            <!-- Microsoft 账户 -->
            <div v-if="selectedAccountType === 'microsoft'" class="add-account-form microsoft-account-form">
              <div class="microsoft-login-notice">
                <UiIcon name="shield" :size="15" />
                <span>{{ t('game.microsoftLoginHint') }}</span>
              </div>
              <UiButton
                class="account-submit-button"
                variant="primary"
                :loading="account.startingMicrosoftLogin"
                @click="account.startMicrosoftLogin"
              >
                <UiIcon name="microsoft" :size="15" />
                {{ t('game.continueMicrosoftLogin') }}
              </UiButton>
            </div>

            <!-- 离线账户表单 -->
            <div v-else-if="selectedAccountType === 'offline'" class="add-account-form">
              <div class="add-form-field">
                <label class="add-form-label">{{ t('game.username') }}</label>
                <div class="add-form-row">
                  <UiInput
                    v-model="account.newOfflineUsername"
                    :placeholder="t('game.enterUsername')"
                    @keyup.enter="account.addOfflineAccount"
                  />
                </div>
                <p class="add-form-help">{{ t('game.offlineNoPassword') }}</p>
              </div>
              <div class="add-form-actions">
                <UiButton
                  class="account-submit-button"
                  variant="primary"
                  size="sm"
                  :loading="account.addingOffline"
                  :disabled="!account.newOfflineUsername.trim()"
                  @click="account.addOfflineAccount"
                >
                  {{ t('game.addOfflineAccount') }}
                </UiButton>
              </div>
            </div>

            <!-- 外置登录表单 -->
            <div v-else class="add-account-form">
              <div v-if="account.authlibServersLoading" class="preset-servers-loading">
                {{ t('app.loading') }}
              </div>
              <div v-else class="add-form-field">
                <label class="add-form-label">{{ t('auth.savedServers') }}</label>
                <UiSelect
                  v-model="account.authlibServerUrl"
                  class="saved-server-select"
                  :options="account.authlibServerOptions"
                  :placeholder="t('auth.selectSavedServer')"
                  :searchPlaceholder="t('auth.searchSavedServer')"
                  :emptyText="t('auth.noSavedServers')"
                  searchable
                />
              </div>
              <div class="add-form-field">
                <label class="add-form-label">{{ t('auth.serverUrl') }}</label>
                <UiInput v-model="account.authlibServerUrl" :placeholder="t('auth.serverUrlPlaceholder')" />
                <p class="add-form-help">{{ t('auth.serverUrlHint') }}</p>
              </div>
              <div class="add-form-field">
                <label class="add-form-label">{{ t('auth.email') }}</label>
                <UiInput v-model="account.authlibEmail" :placeholder="t('auth.emailPlaceholder')" />
              </div>
              <div class="add-form-field">
                <label class="add-form-label">{{ t('auth.password') }}</label>
                <UiInput
                  v-model="account.authlibPassword"
                  type="password"
                  :placeholder="t('auth.passwordPlaceholder')"
                  @keyup.enter="account.addAuthlibAccount"
                />
              </div>
              <div class="add-form-actions">
                <UiButton
                  class="account-submit-button"
                  variant="primary"
                  size="sm"
                  :loading="account.addingAuthlib"
                  :disabled="
                    !account.authlibServerUrl.trim() || !account.authlibEmail.trim() || !account.authlibPassword
                  "
                  @click="account.addAuthlibAccount"
                >
                  {{ t('auth.addAuthlibAccount') }}
                </UiButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FullscreenModal>

    <!-- Microsoft 登录弹窗 -->
    <Modal
      v-model:visible="account.showMicrosoftLoginModal"
      :title="t('game.login.title')"
      :closable="false"
      bodyClass="ms-login-body"
    >
      <div class="ms-login-content">
        <div v-if="account.microsoftLoginStatus === 'pending'" class="ms-login-pending">
          <div class="ms-login-header">
            <div class="ms-login-brand">
              <div class="ms-login-icon">
                <UiIcon name="microsoft" :size="24" />
              </div>
              <div class="ms-login-brand-text">
                <h3 class="ms-login-brand-title">Microsoft 账户</h3>
                <p class="ms-login-brand-desc">通过浏览器完成安全验证</p>
              </div>
            </div>
          </div>

          <div class="ms-login-steps">
            <div class="ms-login-step">
              <div class="ms-step-indicator">
                <span class="ms-step-num">1</span>
              </div>
              <div class="ms-step-body">
                <p class="ms-step-label">
                  {{ t('game.login.browserOpened') }}
                </p>
                <a :href="account.microsoftLoginData.verificationUri" target="_blank" class="ms-login-link">
                  <UiIcon name="external-link" :size="14" />
                  {{ account.microsoftLoginData.verificationUri }}
                </a>
              </div>
            </div>

            <div class="ms-login-step">
              <div class="ms-step-indicator">
                <span class="ms-step-num">2</span>
              </div>
              <div class="ms-step-body">
                <p class="ms-step-label">
                  {{ t('game.login.enterCode') }}
                </p>
                <div class="ms-code-row">
                  <code class="ms-code">{{ account.microsoftLoginData.userCode }}</code>
                  <button class="ms-code-copy-btn" @click="account.copyUserCode">
                    <UiIcon :name="account.copiedUserCode ? 'check' : 'copy'" :size="14" />
                    {{ account.copiedUserCode ? t('game.login.copied') : t('game.login.copyCode') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="ms-login-status">
            <div class="ms-login-spinner" />
            <span class="ms-login-status-text">{{ t('game.login.autoDetecting') }}</span>
          </div>
        </div>

        <div v-else-if="account.microsoftLoginStatus === 'loading'" class="ms-login-loading">
          <div class="ms-login-spinner" />
          <span class="ms-login-loading-text">{{ t('game.login.waiting') }}</span>
        </div>

        <div v-else-if="account.microsoftLoginStatus === 'error'" class="ms-login-error">
          <div class="ms-login-error-icon">
            <UiIcon name="alert-circle" :size="28" />
          </div>
          <p class="ms-login-error-text">
            {{ account.microsoftLoginError }}
          </p>
        </div>
      </div>

      <template #footer>
        <UiButton variant="secondary" @click="account.cancelMicrosoftLogin">
          {{ t('common.cancel') }}
        </UiButton>
        <UiButton
          variant="primary"
          :loading="account.microsoftLoginStatus === 'loading' || account.completingMicrosoftLogin"
          :disabled="account.microsoftLoginStatus === 'error'"
          @click="account.completeMicrosoftLogin"
        >
          {{ t('game.login.complete') }}
        </UiButton>
      </template>
    </Modal>

    <!-- 客户端 ID 配置提示弹窗 -->
    <Modal v-model:visible="account.showClientIdModal" :title="t('game.clientId.title')" :closable="false">
      <div class="client-id-content">
        <p class="client-id-desc">
          {{ t('game.clientId.description') }}
        </p>
        <p class="client-id-file">
          {{ t('game.clientId.fileHint') }}
        </p>
        <pre class="client-id-example">MICROSOFT_CLIENT_ID=your_client_id_here</pre>
      </div>
      <template #footer>
        <UiButton variant="primary" @click="account.cancelClientId">
          {{ t('common.confirm') }}
        </UiButton>
      </template>
    </Modal>

    <!-- 删除确认弹窗 -->
    <Modal v-model:visible="account.showDeleteConfirmModal" type="confirm" :title="t('common.confirm')">
      <p>{{ account.deleteConfirmMessage }}</p>

      <template #footer>
        <UiButton variant="secondary" @click="account.showDeleteConfirmModal = false">
          {{ t('common.cancel') }}
        </UiButton>
        <UiButton variant="danger" :loading="account.deletingAccount" @click="account.confirmRemoveAccount">
          {{ t('common.delete') }}
        </UiButton>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import gsap from 'gsap'
import { storeToRefs } from 'pinia'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AvatarRenderer from '@/components/game/AvatarRenderer.vue'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import Modal from '@/components/modals/Modal.vue'
import UiButton from '@/components/ui/Button.vue'
import UiIcon from '@/components/ui/Icon.vue'
import UiInput from '@/components/ui/Input.vue'
import UiSelect from '@/components/ui/Select.vue'
import { useAccountManager } from '@/composables/useAccountManager'
import { globalLaunchProgress } from '@/composables/useLaunchProgress'
import { useVersionManager } from '@/composables/useVersionManager'
import { getVersionImage } from '@/config/version'
import { useGameInfoCard } from '@/features/game-home/composables/useGameInfoCard'
import { useGameHomeStore } from '@/features/game-home/stores/gameHomeStore'
import { getLoaderIcon, getLoaderImage } from '@/utils/loader'

const { t } = useI18n()
const router = useRouter()
const gamePageRef = ref<HTMLElement | null>(null)

const account = useAccountManager(t)
const version = useVersionManager(t)
const { progress: launchProgress, smoothPercent } = globalLaunchProgress
const gameHomeStore = useGameHomeStore()
const { hasGamePath } = storeToRefs(gameHomeStore)
const {
  infoCardData,
  infoCardMode,
  isWelcome,
  hasAnnouncements,
  currentTip,
  currentAnnouncement,
  welcomeInfo,
  canToggleInfoCard,
  start: startInfoCard,
  stop: stopInfoCard,
  toggle: toggleInfoCard,
} = useGameInfoCard()

type AccountType = 'microsoft' | 'offline' | 'authlib'

const selectedAccountType = ref<AccountType>('microsoft')
const accountTypeOptions = computed(() => [
  {
    value: 'microsoft',
    label: t('game.microsoftAccount'),
    desc: t('game.microsoftAccountDesc'),
  },
  {
    value: 'offline',
    label: t('game.offlineAccount'),
    desc: t('game.offlineAccountDesc'),
  },
  {
    value: 'authlib',
    label: t('game.authlibAccount'),
    desc: t('game.authlibAccountDesc'),
  },
])
const selectedAccountMeta = computed(() => {
  const option = accountTypeOptions.value.find(({ value }) => value === selectedAccountType.value)
  const icons: Record<AccountType, string> = {
    microsoft: 'microsoft',
    offline: 'user',
    authlib: 'shield',
  }

  return {
    icon: icons[selectedAccountType.value],
    label: option?.label || '',
    description: option?.desc || '',
  }
})

function handleAccountTypeChange(value: string) {
  if (value === 'authlib' && account.authlibServers.length === 0 && !account.authlibServersLoading) {
    account.loadAuthlibServers()
  }
}

const lpState = computed(() => {
  const stage = launchProgress.value.stage
  let title = '正在启动游戏'
  if (stage.includes('启动成功') || stage.includes('completed') || stage.includes('success')) {
    title = '已启动游戏'
  }
  return {
    title,
    versionName: version.selectedVersion || '',
    displayPercent: smoothPercent.value,
  }
})

const launchVersionVisual = computed(() => {
  const selected = version.versions.find((item) => item.id === version.selectedVersion)
  const loaderImage = getLoaderImage(selected?.type)
  if (loaderImage) {
    return { image: loaderImage, icon: '' }
  }
  const versionTypeImage = getVersionImage(selected?.versionType)
  if (versionTypeImage) {
    return { image: versionTypeImage, icon: '' }
  }

  return { image: '', icon: getLoaderIcon(selected?.type) }
})

// 定时器清理
const launchCancelTimer = ref<ReturnType<typeof setTimeout> | null>(null)

const playEnterAnimation = () => {
  if (gamePageRef.value) {
    gsap.fromTo(
      gamePageRef.value,
      { opacity: 0, y: 18, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out' }
    )
  }
}

const handleLaunchProgressCancel = async () => {
  globalLaunchProgress.cancel()
  try {
    await gameHomeStore.cancelLaunch()
  } catch (e) {
    console.warn('[LaunchCancel] 取消请求异常:', e)
  }
  // 如果后端线程仍在运行，5 秒后强制重置前端状态，避免按钮长期禁用
  launchCancelTimer.value = setTimeout(() => {
    if (version.launching) {
      version.launching = false
      console.warn('[LaunchCancel] 后端未响应，强制重置启动状态')
    }
    launchCancelTimer.value = null
  }, 5000)
}

const openGameSettings = () => {
  router.push('/settings/game')
}

const goToInstallVersion = () => {
  router.push({ name: 'versions-manage' })
}

onMounted(() => {
  version.loadVersions()
  account.loadCurrentAccount()

  startInfoCard().catch((error) => {
    console.warn('[GameHome] 加载首页数据失败:', error)
  })

  playEnterAnimation()
})

onBeforeUnmount(() => {
  account.reset()
  stopInfoCard()
  if (launchCancelTimer.value) {
    clearTimeout(launchCancelTimer.value)
    launchCancelTimer.value = null
  }
})
</script>

<style scoped src="@/styles/views/Game.css"></style>
