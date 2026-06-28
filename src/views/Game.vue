<template>
  <div class="game-page">
    <!-- 左侧：快捷启动/最近游玩 -->
    <div class="game-left">
      <!--<div class="quick-launch-card">
        <div class="card-header">
          <h2 class="card-title">
            <UiIcon name="game" :size="20" />
            {{ t('game.quickLaunch') }}
          </h2>
        </div>

        <div v-if="recentPlays.length > 0" class="recent-list">
          <div
            v-for="item in recentPlays"
            :key="item.id"
            class="recent-item"
            @click="version.selectVersion(item.id); version.launchGame(account.currentAccount)"
          >
            <div class="recent-icon">
              <UiIcon name="cube" :size="24" />
            </div>
            <div class="recent-info">
              <span class="recent-name">{{ item.id }}</span>
              <span class="recent-type">{{ item.type }}</span>
            </div>
            <div class="recent-action">
              <UiIcon name="play" :size="16" />
            </div>
          </div>
        </div>

        <div v-else class="quick-launch-empty">
          <UiIcon name="game" :size="48" class="empty-icon" />
          <p class="empty-text">{{ t('game.noRecentPlay') }}</p>
          <p class="empty-hint">{{ t('game.selectVersionToStart') }}</p>
        </div>
      </div>-->
    </div>
    

    <!-- 右侧 -->
    <div class="game-right">
      <Transition name="slide-out" mode="out-in">
        <!-- 账户卡片 -->
        <div v-if="!launchProgress.visible" key="cards" class="game-right-cards">
          <div class="account-card">
            <div class="account-info">
              <SkinRenderer
                v-if="account.currentAccount"
                class="account-avatar"
                :uuid="account.currentAccount?.uuid"
                :username="account.currentAccount?.alias"
                :type-name="account.currentAccount?.type"
                :size="40"
              />
              <div v-else class="account-avatar-placeholder">
                <UiIcon name="user" :size="20" />
              </div>
              <div class="account-details">
                <div class="account-name">{{ account.currentAccount?.alias || t('game.noAccount') }}</div>
                <div class="account-type">{{ account.currentAccount ? account.accountTypeLabel : t('game.clickManageToAdd') }}</div>
              </div>
              <button class="account-manage-btn" @click="account.openAccountModal">
                {{ t('game.manage') }}
              </button>
            </div>
          </div>
        </div>

        <!-- 启动进度（内嵌，替代弹窗） -->
        <div v-else key="progress" class="launch-progress-card">
          <div class="lp-header">
            <div class="lp-icon-wrap">
              <UiIcon name="game-controller" :size="22" />
            </div>
            <div class="lp-title-area">
              <h3 class="lp-title">{{ lpState.title }}</h3>
              <p class="lp-version">{{ lpState.versionName }}</p>
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
            <span v-if="lpState.displayPercent >= 0" class="lp-bar-percent">{{ Math.round(lpState.displayPercent) }}%</span>
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
    </div>

    <!-- 账户管理弹窗 -->
    <ContentModal
      v-model:visible="account.showAccountModal"
      :title="t('game.accountManagement')"
      fullscreen
    >
      <div class="account-manager">
        <div class="account-list-section">
          <h3 class="section-title">
            <UiIcon name="folder" :size="16" />
            {{ t('game.savedAccounts') }}
          </h3>
          <div class="account-list-card">
            <div v-if="account.accountsLoading" class="flex-center" style="padding: 40px;">
              <span class="text-secondary">{{ t('app.loading') }}</span>
            </div>

            <div v-else-if="account.accounts.length === 0" class="empty-state">
              <UiIcon name="user-x" :size="16" />
              <p class="empty-state-text">{{ t('game.noAccounts') }}</p>
              <p class="text-secondary" style="font-size: 12px;">{{ t('game.noAccountsDesc') }}</p>
            </div>

            <div v-else class="account-items">
              <div
                v-for="acc in account.accounts"
                :key="acc.id"
                role="button"
                tabindex="0"
                :class="['account-item', { active: acc.isCurrent }]"
                @click="account.switchAccount(acc.id)"
                @keydown.enter="account.switchAccount(acc.id)"
              >
                <SkinRenderer
                  class="acc-avatar"
                  :uuid="acc.uuid"
                  :username="acc.alias"
                  :type-name="acc.type"
                  :size="40"
                />
                <div class="acc-info">
                  <div class="acc-name">{{ acc.alias }}</div>
                  <div class="acc-type">
                    <span :class="['type-badge', acc.type]">
                      {{ acc.type === 'microsoft' ? t('game.accountTypeMicrosoft') : t('game.accountTypeOffline') }}
                    </span>
                    <span v-if="acc.type === 'microsoft' && acc.email" class="acc-email">{{ acc.email }}</span>
                  </div>
                </div>
                <div class="acc-actions">
                  <span v-if="acc.isCurrent" class="acc-status">{{ t('game.current') }}</span>
                  <UiButton
                    v-else
                    variant="secondary"
                    size="sm"
                    @click="account.switchAccount(acc.id)"
                  >
                    {{ t('game.switch') }}
                  </UiButton>
                  <UiButton
                    variant="ghost"
                    size="sm"
                    icon="delete"
                    @click="account.removeAccount(acc.id, acc.alias)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="account-add-section">
          <h3 class="section-title">
            <UiIcon name="add" :size="16" />
            {{ t('game.addOfflineAccount') }}
          </h3>
          <div class="add-account-card">
            <div class="add-form">
              <div class="form-group">
                <label class="form-label">{{ t('game.username') }}</label>
                <UiInput
                  v-model="account.newOfflineUsername"
                  :placeholder="t('game.enterUsername')"
                  @keyup.enter="account.addOfflineAccount"
                />
                <span class="form-hint">{{ t('game.offlineNoPassword') }}</span>
              </div>
              <UiButton
                variant="primary"
                icon="icon-add"
                :loading="account.addingOffline"
                :disabled="!account.newOfflineUsername.trim()"
                @click="account.addOfflineAccount"
              >
                {{ t('game.addOfflineAccount') }}
              </UiButton>
            </div>
          </div>

          <h3 class="section-title" style="margin-top: 20px;">
            <UiIcon name="microsoft" :size="16" />
            {{ t('game.addMicrosoftAccount') }}
          </h3>
          <div class="add-account-card">
            <div class="add-form">
              <p class="form-hint" style="margin-bottom: 12px;">
                {{ t('game.login.step1') }}
              </p>
              <UiButton
                variant="primary"
                icon="log-in"
                :loading="account.startingMicrosoftLogin"
                @click="account.startMicrosoftLogin"
              >
                {{ t('game.addMicrosoftAccount') }}
              </UiButton>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <UiButton variant="secondary" @click="account.showAccountModal = false">{{ t('game.close') }}</UiButton>
      </template>
    </ContentModal>

    <!-- Microsoft 登录弹窗 -->
    <ContentModal
      v-model:visible="account.showMicrosoftLoginModal"
      :title="t('game.login.title')"
      :closable="false"
    >
      <div class="microsoft-login-content">
        <div v-if="account.microsoftLoginStatus === 'pending'" class="login-pending">
          <div class="login-step">
            <p class="step-label">{{ t('game.login.browserOpened') }}</p>
            <a :href="account.microsoftLoginData.verificationUri" target="_blank" class="login-link">
              {{ account.microsoftLoginData.verificationUri }}
            </a>
          </div>
          <div class="login-step">
            <p class="step-label">{{ t('game.login.enterCode') }}</p>
            <div class="user-code-box">
              <code class="user-code">{{ account.microsoftLoginData.userCode }}</code>
              <UiButton
                variant="secondary"
                size="sm"
                @click="account.copyUserCode"
              >
                {{ account.copiedUserCode ? t('game.login.copied') : t('game.login.copyCode') }}
              </UiButton>
            </div>
          </div>
          <p class="login-waiting">{{ t('game.login.autoDetecting') }}</p>
        </div>

        <div v-else-if="account.microsoftLoginStatus === 'loading'" class="login-loading">
          <span class="text-secondary">{{ t('game.login.waiting') }}</span>
        </div>

        <div v-else-if="account.microsoftLoginStatus === 'error'" class="login-error">
          <p class="text-error">{{ account.microsoftLoginError }}</p>
        </div>
      </div>

      <template #footer>
        <UiButton variant="secondary" @click="account.cancelMicrosoftLogin">{{ t('common.cancel') }}</UiButton>
        <UiButton
          v-if="account.microsoftLoginStatus === 'pending'"
          variant="primary"
          @click="account.completeMicrosoftLogin"
        >
          {{ t('game.login.complete') }}
        </UiButton>
        <UiButton
          v-else
          variant="primary"
          :loading="account.completingMicrosoftLogin"
          @click="account.completeMicrosoftLogin"
        >
          {{ t('game.login.complete') }}
        </UiButton>
      </template>
    </ContentModal>

    <!-- 删除确认弹窗 -->
    <ContentModal
      v-model:visible="account.showDeleteConfirmModal"
      type="confirm"
      :title="t('common.confirm')"
      show-backdrop
    >
      <p>{{ account.deleteConfirmMessage }}</p>

      <template #footer>
        <UiButton variant="secondary" @click="account.showDeleteConfirmModal = false">
          {{ t('common.cancel') }}
        </UiButton>
        <UiButton variant="danger" :loading="account.deletingAccount" @click="account.confirmRemoveAccount">
          {{ t('common.delete') }}
        </UiButton>
      </template>
    </ContentModal>

    <!-- 右下角固定启动按钮 -->
    <div v-if="!launchProgress.visible && hasGamePath && version.versions.length > 0" class="fab-launch-bar">
      <button
        class="fab-launch-btn"
        :disabled="version.launching || !version.selectedVersion || !account.currentAccount"
        @click="version.launchGame(account.currentAccount)"
      >
        <UiIcon name="play" :size="16" />
        <span class="fab-launch-label">{{ version.launching ? t('game.launching') : t('game.launch') }}</span>
        <span class="fab-launch-version">{{ version.selectedVersion }}</span>
      </button>
      <button
        class="fab-manage-btn"
        title="版本管理"
        @click="goToInstallVersion"
      >
        <UiIcon name="grid" :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import UiCard from '@/components/ui/Card.vue'
import UiButton from '@/components/ui/Button.vue'
import UiIcon from '@/components/ui/Icon.vue'
import UiInput from '@/components/ui/Input.vue'
import ContentModal from '@/components/modals/ContentModal.vue'
import SkinRenderer from '@/components/SkinRenderer.vue'
import { useAccountManager } from '@/composables/useAccountManager'
import { useVersionManager } from '@/composables/useVersionManager'
import { globalLaunchProgress } from '@/composables/useLaunchProgress'
import backend from '@/api/client'

const { t } = useI18n()
const router = useRouter()

const account = useAccountManager(t)
const version = useVersionManager(t)
const { progress: launchProgress, hide: hideLaunchProgress } = globalLaunchProgress

const clampedPercent = computed(() => Math.max(0, Math.min(100, Math.round(launchProgress.value.percent))))

// 启动进度缓动状态（参考 PCL-CE 的平滑进度算法）
const lpDisplayPercent = ref(0)
let lpRafId: number | null = null

const lpState = computed(() => {
  const stage = launchProgress.value.stage
  let title = '正在启动游戏'
  if (stage.includes('启动成功') || stage.includes('completed') || stage.includes('success')) {
    title = '已启动游戏'
  }
  return {
    title,
    versionName: version.selectedVersion || '',
    displayPercent: lpDisplayPercent.value,
  }
})

// 缓动动画：每帧将 displayPercent 向 target 靠拢
function animateProgress() {
  if (!launchProgress.value.visible) {
    lpRafId = null
    return
  }

  const target = launchProgress.value.percent
  const current = lpDisplayPercent.value

  if (target < 0) {
    // 不确定进度模式：不做数值插值
    lpDisplayPercent.value = -1
  } else {
    // 缓动靠拢：showProgress += (actual - show) * 0.15 + 0.3
    const diff = target - current
    if (Math.abs(diff) < 0.5) {
      lpDisplayPercent.value = target
    } else {
      lpDisplayPercent.value = current + diff * 0.15 + (diff > 0 ? 0.3 : -0.3)
    }
    lpDisplayPercent.value = Math.max(0, Math.min(100, lpDisplayPercent.value))
  }

  lpRafId = requestAnimationFrame(animateProgress)
}

// 当进度可见时启动动画循环，不可见时停止
watch(() => launchProgress.value.visible, (visible) => {
  if (visible) {
    lpDisplayPercent.value = 0
    lpRafId = requestAnimationFrame(animateProgress)
  } else {
    if (lpRafId !== null) {
      cancelAnimationFrame(lpRafId)
      lpRafId = null
    }
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (lpRafId !== null) cancelAnimationFrame(lpRafId)
})

const hasGamePath = ref(false)

const recentPlays = computed(() => {
  return version.versions.slice(0, 5)
})

const handleLaunchProgressCancel = async () => {
  globalLaunchProgress.cancel()
  try {
    await backend.command('cancel_launch')
  } catch (e) {
    // 忽略取消失败
  }
}

const openGameSettings = () => {
  router.push('/settings/game')
}

const goToInstallVersion = () => {
  router.push({ name: 'versions-manage' })
}

onMounted(() => {
  version.loadVersions()
  backend.command('accounts_current').then(res => {
    if (res.success && res.data) {
      account.currentAccount = res.data
    }
  })

  // 检测是否设置了游戏目录
  backend.config.get('game').then(res => {
    if (res.success && res.data) {
      const paths = res.data.minecraft_paths
      hasGamePath.value = paths && paths.length > 0
    }
  })
})

onBeforeUnmount(() => {
  account.reset()
})
</script>

<style scoped>
.game-page {
  display: flex;
  gap: var(--s-xl);
  height: 100%;
}

/* 左侧：60% */
.game-left {
  flex: 6;
  min-width: 0;
}

/* 右侧：40% */
.game-right {
  flex: 4;
  min-width: 300px;
  display: flex;
  flex-direction: column;
}

.game-right-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

/* 快捷启动卡片 */
.quick-launch-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: var(--s-xl);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  margin-bottom: var(--s-lg);
}

.card-title {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* 最近游玩列表 */
.recent-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: var(--s-md);
  padding: 12px;
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: background 150ms ease-out;
}

.recent-item:hover {
  background: var(--bg-hover);
}

.recent-icon {
  width: 40px;
  height: 40px;
  background: var(--primary-alpha);
  border-radius: var(--r-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  flex-shrink: 0;
}

.recent-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.recent-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.recent-type {
  font-size: 12px;
  color: var(--text-tertiary);
}

.recent-action {
  color: var(--text-tertiary);
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.recent-item:hover .recent-action {
  opacity: 1;
  color: var(--primary);
}

/* 快捷启动空状态 */
.quick-launch-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-sm);
}

.empty-icon {
  color: var(--text-tertiary);
  margin-bottom: var(--s-sm);
}

.empty-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.empty-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
}

/* 账户卡片 */
.account-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 16px 20px;
}

.account-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.account-avatar {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  flex-shrink: 0;
}

.account-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--bg-base-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.account-details {
  flex: 1;
  min-width: 0;
}

.account-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.account-type {
  font-size: 12px;
  color: #8A8A8A;
  margin-top: 2px;
}

.account-manage-btn {
  padding: 6px 16px;
  border-radius: var(--r-sm);
  border: 1px solid var(--primary);
  background: var(--bg-elevated);
  color: var(--primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 150ms ease-out;
}

.account-manage-btn:hover {
  background: var(--primary-alpha);
}

.account-manage-btn:active {
  transform: translateY(1px);
}

/* 主按钮 */
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--s-sm);
  padding: 10px 20px;
  border-radius: var(--r-sm);
  border: none;
  background: var(--primary);
  color: var(--text-on-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-primary:active {
  transform: translateY(1px);
}

/* 状态消息 */
.status-msg {
  margin-top: var(--s-sm);
  font-size: 12px;
  text-align: center;
}

.text-success { color: var(--success); }
.text-error { color: var(--error); }
.text-warning { color: var(--warning); }
.text-secondary { color: var(--text-secondary); }
.text-info { color: var(--info); }

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ================================================================
   账户管理弹窗
   ================================================================ */
.account-manager {
  display: flex;
  gap: var(--s-xl);
  min-height: 400px;
}

.account-list-section {
  flex: 1;
  min-width: 0;
}

.account-add-section {
  width: 280px;
  flex-shrink: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--s-md);
}

.account-list-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: var(--s-lg);
  min-height: 200px;
}

.add-account-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: var(--s-lg);
}

/* 账户列表项 */
.account-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.account-item {
  display: flex;
  align-items: center;
  gap: var(--s-md);
  padding: 12px;
  border-radius: var(--r-sm);
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 150ms ease-out;
}

.account-item:hover {
  background: var(--bg-hover);
}

.account-item.active {
  background: var(--primary-alpha);
  border-color: var(--border-active);
}

.acc-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--r-sm);
  flex-shrink: 0;
}

.acc-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.acc-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.acc-type {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  font-size: 12px;
  color: var(--text-tertiary);
}

.type-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: var(--r-xs);
  font-size: 11px;
  font-weight: 500;
  background: var(--bg-base-alt);
  color: var(--text-secondary);
}

.type-badge.microsoft {
  background: var(--info-alpha);
  color: var(--info);
}

.type-badge.offline {
  background: var(--bg-base-alt);
  color: var(--text-secondary);
}

.acc-email {
  font-size: 11px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.acc-actions {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  flex-shrink: 0;
}

.acc-status {
  font-size: 12px;
  color: var(--primary);
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: var(--s-sm);
  color: var(--text-tertiary);
}

.empty-state-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

/* 添加账户表单 */
.add-form {
  display: flex;
  flex-direction: column;
  gap: var(--s-md);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--s-xs);
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
}

/* Microsoft 登录弹窗 */
.microsoft-login-content {
  min-width: 380px;
}

.login-pending {
  display: flex;
  flex-direction: column;
  gap: var(--s-lg);
}

.login-step {
  display: flex;
  flex-direction: column;
  gap: var(--s-sm);
}

.step-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.login-link {
  font-size: 14px;
  color: var(--text-link);
  word-break: break-all;
}

.user-code-box {
  display: flex;
  align-items: center;
  gap: var(--s-md);
}

.user-code {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--primary);
  background: var(--primary-alpha);
  padding: 8px 20px;
  border-radius: var(--r-sm);
}

.login-waiting {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
}

.login-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-error {
  padding: 20px;
  text-align: center;
}

/* ══════════════════════════════════════════════════════
   过渡动画（out-in 模式）
   ══════════════════════════════════════════════════════ */
.slide-out-leave-active {
  transition: all 200ms ease-out;
}
.slide-out-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

.slide-out-enter-active {
  transition: all 250ms ease-out;
}
.slide-out-enter-from {
  opacity: 0;
  transform: translateX(16px);
}

/* ══════════════════════════════════════════════════════
   启动进度卡片（仿 PCL-CE 风格）
   ══════════════════════════════════════════════════════ */
.launch-progress-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  padding: 32px 28px 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

/* 头部：图标 + 标题 */
.lp-header {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
}

.lp-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--primary-alpha);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  flex-shrink: 0;
}

.lp-title-area {
  flex: 1;
  min-width: 0;
}

.lp-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
}

.lp-version {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 2px 0 0;
}

/* 进度条 */
.lp-bar-wrapper {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
}

.lp-bar-track {
  flex: 1;
  height: 4px;
  background: var(--bg-base-alt);
  border-radius: 2px;
  overflow: hidden;
}

.lp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--primary-hover));
  border-radius: 2px;
  transition: none; /* 由 JS rAF 控制 */
  min-width: 0;
}

.lp-bar-fill.indeterminate {
  width: 30% !important;
  animation: lp-indeterminate 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes lp-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(450%); }
}

.lp-bar-percent {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* 信息面板 */
.lp-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  background: var(--bg-base);
  border-radius: var(--r-sm);
}

.lp-info-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.lp-info-label {
  font-size: 12px;
  color: var(--text-quaternary, var(--text-tertiary));
  flex-shrink: 0;
}

.lp-info-value {
  font-size: 13px;
  color: var(--text-primary);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.lp-info-detail {
  font-size: 12px;
  color: var(--text-secondary);
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 取消按钮 */
.lp-cancel-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 28px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-tertiary);
  font-size: 13px;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.lp-cancel-btn:hover {
  border-color: var(--error);
  color: var(--error);
  background: rgba(232, 93, 93, 0.06);
}

/* ══════════════════════════════════════════════════════
   右下角固定启动按钮（FAB）
   ══════════════════════════════════════════════════════ */
.fab-launch-bar {
    position: fixed;
    right: 80px;
    bottom: 48px;
    display: flex;
    align-items: center;
    gap: 12px;
    z-index: 50;
}

.fab-launch-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
  height: 48px;
  padding: 0 24px;
  border-radius: 6px;
  border: 1px solid #4A7FD9;
  background: #FFFFFF;
  cursor: pointer;
  transition: all 150ms ease-out;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  white-space: nowrap;
}

.fab-launch-btn:hover {
  background: #EBF1FA;
  border-color: #3D6EC2;
  box-shadow: 0 4px 12px rgba(74, 127, 217, 0.15);
}

.fab-launch-btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.fab-launch-btn:disabled {
  border-color: #C0C0C0;
  background: #F5F5F5;
  cursor: not-allowed;
  box-shadow: none;
}

.fab-launch-btn:disabled:active {
  transform: none;
}

.fab-launch-label {
  font-size: 14px;
  font-weight: 600;
  color: #4A7FD9;
}

.fab-launch-btn:hover .fab-launch-label {
  color: #3D6EC2;
}

.fab-launch-btn:disabled .fab-launch-label {
  color: #AAAAAA;
}

.fab-launch-version {
  margin-left: auto;
  font-size: 13px;
  font-weight: 400;
  color: #8A8A8A;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.fab-launch-btn:disabled .fab-launch-version {
  color: #BBBBBB;
}

.fab-manage-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 6px;
  border: 1px solid #4A7FD9;
  background: #FFFFFF;
  color: #4A7FD9;
  cursor: pointer;
  transition: all 150ms ease-out;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.fab-manage-btn:hover {
  background: #EBF1FA;
  border-color: #3D6EC2;
  color: #3D6EC2;
  box-shadow: 0 4px 12px rgba(74, 127, 217, 0.15);
}

.fab-manage-btn:active {
  transform: translateY(1px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}
</style>