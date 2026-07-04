<template>
  <div class="game-page" ref="gamePageRef">
    <!-- 左侧：内容区 -->
    <div class="game-left"></div>

    <!-- 右侧：固定 320px 卡片组 -->
    <div class="game-right">
      <Transition name="slide-out" mode="out-in">
        <!-- 账户卡片 + 你知道吗 -->
        <div v-if="!launchProgress.visible" key="cards" class="game-right-cards">
          <!-- 账户卡片 -->
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

          <!-- 信息卡片 / 公告栏 -->
          <div class="info-card">
            <!-- 右上角切换按钮 -->
            <button class="info-toggle-btn" @click="infoCardMode = infoCardMode === 'tip' ? 'announce' : 'tip'" :title="infoCardMode === 'tip' ? '查看公告' : '查看小贴士'">
              <UiIcon :name="infoCardMode === 'tip' ? 'bell' : 'lightbulb'" :size="14" />
            </button>

            <!-- 你知道吗 / 欢迎 -->
            <Transition name="info-fade" mode="out-in">
              <div v-if="infoCardMode === 'tip'" key="tip" class="info-tip">
                <div class="info-header">
                  <UiIcon name="lightbulb" :size="16" />
                  <span class="info-title">{{ isWelcome ? '欢迎使用 EuoraCraft Launcher' : '你知道吗' }}</span>
                </div>
                <p class="info-content">{{ isWelcome ? '感谢使用 EuoraCraft Launcher！你可以在右侧管理账户、选择版本并启动游戏。' : currentTip }}</p>
              </div>

              <!-- 公告栏 -->
              <div v-else key="announce" class="info-announce">
                <div class="info-header">
                  <UiIcon name="bell" :size="16" />
                  <span class="info-title">公告</span>
                </div>
                <div class="announce-list">
                  <div v-if="announcements.length === 0" class="announce-empty">
                    暂无公告
                  </div>
                  <div v-for="(item, idx) in announcements" :key="idx" class="announce-item">
                    <div class="announce-item-header">
                      <span class="announce-item-title">{{ item.title }}</span>
                      <span class="announce-item-date">{{ item.date }}</span>
                    </div>
                    <p class="announce-item-desc">{{ item.content }}</p>
                  </div>
                </div>
              </div>
            </Transition>
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

    <!-- 右下角固定 FAB 按钮组 -->
    <div v-if="!launchProgress.visible && hasGamePath && version.versions.length > 0" class="fab-launch-bar">
        <!-- 第一行：启动按钮 + 版本管理按钮 -->
        <div class="fab-row-top">
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
        <!-- 第二行：版本设置按钮（与第一行等宽） -->
        <button
          class="fab-settings-btn"
          title="版本设置"
          @click="openGameSettings"
        >
          <UiIcon name="settings" :size="16" />
          <span class="fab-settings-label">版本设置</span>
        </button>
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

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import gsap from 'gsap'
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
const gamePageRef = ref<HTMLElement | null>(null)

const account = useAccountManager(t)
const version = useVersionManager(t)
const { progress: launchProgress } = globalLaunchProgress

// 启动进度缓动状态（参考 PCL-CE 的平滑进度算法）
const lpDisplayPercent = ref(0)
let lpRafId: number | null = null

// 小贴士列表
const tips = [
  '按 F11 可以切换全屏模式',
  '在设置中可以调整游戏内存分配',
  '使用版本隔离可以避免不同版本之间的冲突',
  '定期备份存档是个好习惯',
  '可以在设置中更改游戏启动器主题',
  '离线账户不需要网络连接即可启动游戏',
  'Microsoft 账户可以访问正版服务器',
  'Forge 和 Fabric 是两种流行的模组加载器',
]
const currentTip = ref(tips[Math.floor(Math.random() * tips.length)])

// 信息卡片模式
const infoCardMode = ref<'tip' | 'announce'>('tip')
const isWelcome = ref(true)

// 公告数据（示例）
const announcements = ref([
  {
    title: 'EuoraCraft Launcher v1.0 正式发布',
    date: '2026-06-28',
    content: '经过长时间的开发和测试，EuoraCraft Launcher 终于迎来了 1.0 正式版！新增了全新的主题系统、版本管理、模组管理等功能。',
  },
])

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

  // 欢迎状态：首次打开显示欢迎，之后切页面不再显示
  const welcomeShown = localStorage.getItem('euora-welcome-shown')
  if (welcomeShown === 'true') {
    isWelcome.value = false
  } else {
    isWelcome.value = true
    setTimeout(() => {
      isWelcome.value = false
      localStorage.setItem('euora-welcome-shown', 'true')
    }, 5000)
  }

  playEnterAnimation()
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

/* 左侧：弹性填充 */
.game-left {
  flex: 1;
  min-width: 0;
}

/* 右侧：固定 320px 卡片组 */
.game-right {
  width: 320px;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  padding-right: var(--s-lg);
  padding-top: 32px;
}

.game-right-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-info {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.account-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--r-sm);
  flex-shrink: 0;
}

.account-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: var(--r-sm);
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
  color: var(--text-tertiary);
  margin-top: 2px;
}

.account-manage-btn {
  padding: 6px 16px;
  border-radius: var(--r-sm);
  border: 1px solid var(--primary);
  background: transparent;
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

/* 账户卡片 */
.account-card {
  background: var(--card-bg);
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  border-radius: var(--r-sm);
  padding: 16px 20px;
  height: 72px;
  display: flex;
  align-items: center;
}

/* 信息卡片（你知道吗 / 公告栏） */
.info-card {
  position: relative;
  background: var(--card-bg);
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  border-radius: var(--r-sm);
  overflow: hidden;
}

/* 右上角切换按钮 */
.info-toggle-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: var(--r-xs);
  background: var(--bg-hover);
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms ease-out;
  z-index: 1;
}

.info-toggle-btn:hover {
  background: var(--bg-active);
  color: var(--text-secondary);
}

/* 共用头部 */
.info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px 0 16px;
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
}

.info-title {
  color: var(--text-primary);
}

.info-content {
  margin: 0;
  padding: 8px 16px 12px 16px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* 公告栏 */
.info-announce {
  padding-bottom: 4px;
}

.announce-list {
  padding: 8px 16px 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 200px;
}

.announce-empty {
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
  padding: 8px 0;
}

.announce-item {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--divider);
}

.announce-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.announce-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.announce-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.announce-item-date {
  font-size: 11px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.announce-item-desc {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* 切换动画 */
.info-fade-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.info-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.info-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.info-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ══════════════════════════════════════════════════════
   右下角固定 FAB 按钮组
   ══════════════════════════════════════════════════════ */
.fab-launch-bar {
  position: fixed;
  right: calc(var(--s-lg) + var(--s-lg));
  bottom: 64px;
  width: calc(320px - var(--s-lg));
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 50;
}

/* 第一行：启动按钮 + 版本管理按钮横向排列 */
.fab-row-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fab-launch-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
  height: 48px;
  padding: 0 20px;
  border-radius: var(--r-sm);
  border: none;
  background: var(--primary);
  color: #FFFFFF;
  cursor: pointer;
  transition: all 150ms ease-out;
  white-space: nowrap;
  flex: 1;
}

.fab-launch-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.fab-launch-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.fab-launch-btn:disabled {
  background: var(--bg-hover);
  color: var(--text-disabled);
  cursor: not-allowed;
}

.fab-launch-label {
  font-size: 14px;
  font-weight: 600;
}

.fab-launch-version {
  margin-left: auto;
  font-size: 13px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.75);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.fab-launch-btn:disabled .fab-launch-version {
  color: var(--text-disabled);
}

/* FAB 幽灵按钮：版本管理 */
.fab-manage-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--card-bg);
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 150ms ease-out;
  flex-shrink: 0;
}

.fab-manage-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
}

.fab-manage-btn:active {
  transform: translateY(1px);
}

/* 第二行：版本设置按钮（与第一行等宽） */
.fab-settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--card-bg);
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 150ms ease-out;
  font-size: 14px;
  font-weight: 500;
}

.fab-settings-btn:hover {
  background: var(--bg-hover);
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.fab-settings-btn:active {
  transform: translateY(1px);
}

.fab-settings-label {
  font-size: 14px;
  font-weight: 500;
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
  background: var(--card-bg);
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  border-radius: var(--r-sm);
  padding: var(--s-lg);
  min-height: 200px;
}

.add-account-card {
  background: var(--card-bg);
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  border-radius: var(--r-sm);
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
  background: var(--card-bg);
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  border-radius: var(--r-sm);
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
  border-radius: var(--r-sm);
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
  transition: none;
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
  color: var(--text-tertiary);
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
</style>