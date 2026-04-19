<template>
  <div class="home-container" ref="homeMainRef">
    <div class="home-left" ref="homeLeftRef"></div>

    <div class="home-right" ref="homeRightRef">
      <UiCard class="account-card" body-class="account-card-body">
        <div class="account-info">
          <SkinRenderer
            v-if="account.currentAccount"
            class="avatar"
            :uuid="account.currentAccount?.uuid"
            :username="account.currentAccount?.alias"
            :type-name="account.currentAccount?.type"
            :size="36"
          />
          <div v-else class="avatar-placeholder"></div>
          <div class="user-details">
            <div class="name">{{ account.currentAccount?.alias || t('game.noAccount') }}</div>
            <div class="type">{{ account.currentAccount ? account.accountTypeLabel : t('game.clickManageToAdd') }}</div>
          </div>
          <UiButton variant="text" size="sm" icon="settings" @click="account.openAccountModal">
            {{ t('game.manage') }}
          </UiButton>
        </div>
      </UiCard>

      <UiCard class="version-card" :title="t('game.gameVersion')" icon="cube" body-class="version-card-body">
        <div class="version-list" ref="versionListRef">
          <div v-if="version.loading" class="flex-center" style="padding: 20px;">
            <span class="text-secondary">{{ t('app.loading') }}</span>
          </div>

          <div v-else-if="version.versions.length === 0" class="flex-center" style="padding: 20px;">
            <span class="text-secondary">{{ t('game.noVersions') }}</span>
          </div>

          <div
            v-else
            v-for="ver in version.versions"
            :key="ver.id"
            role="button"
            tabindex="0"
            @click="version.selectVersion(ver.id)"
            @keydown.enter="version.selectVersion(ver.id)"
            @keydown.space="version.selectVersion(ver.id)"
            :class="['version-item', { active: version.selectedVersion === ver.id }]"
            :aria-selected="version.selectedVersion === ver.id"
          >
            <span class="version-name">{{ ver.id }}</span>
            <span class="version-tag">{{ ver.type }}</span>
          </div>
        </div>

        <div class="launch-section">
          <UiButton
            class="launch-btn"
            @click="version.launchGame(account.currentAccount)"
            :disabled="version.launching || !version.selectedVersion || !account.currentAccount"
            :loading="version.launching"
            size="lg"
            icon="game"
          >
            {{ version.launching ? t('game.launching') : t('game.launch') }}
          </UiButton>
        </div>

        <div 
          v-if="version.statusMsg" 
          :class="['status-msg', `text-${version.statusType}`]"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {{ version.statusMsg }}
        </div>
      </UiCard>
    </div>

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
                @keydown.space="account.switchAccount(acc.id)"
                :aria-selected="acc.isCurrent"
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

    <LaunchProgressModal
      :visible="launchProgress.visible"
      :stage="launchProgress.stage"
      :percent="launchProgress.percent"
      :message="launchProgress.message"
      :cancelable="launchProgress.cancelable"
      :closable="true"
      @cancel="handleLaunchProgressCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'
import '@/styles/views/Game.css'
import UiCard from '@/components/ui/Card.vue'
import UiButton from '@/components/ui/Button.vue'
import UiIcon from '@/components/ui/Icon.vue'
import UiInput from '@/components/ui/Input.vue'
import ContentModal from '@/components/modals/ContentModal.vue'
import LaunchProgressModal from '@/components/modals/LaunchProgressModal.vue'
import SkinRenderer from '@/components/SkinRenderer.vue'
import { useAccountManager } from '@/composables/useAccountManager'
import { useVersionManager } from '@/composables/useVersionManager'
import { globalLaunchProgress } from '@/composables/useLaunchProgress'
import { api } from '@/utils/api'

const { t } = useI18n()

const account = useAccountManager(t)
const version = useVersionManager(t)
const { progress: launchProgress, hide: hideLaunchProgress } = globalLaunchProgress

const handleLaunchProgressCancel = () => {
  hideLaunchProgress()
}

const homeLeftRef = ref<HTMLElement | null>(null)
const homeRightRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const tl = gsap.timeline({ delay: 0.1 })

  tl.fromTo(homeLeftRef.value,
    { x: -30, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
  )
  .fromTo(homeRightRef.value,
    { x: 30, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
    '-=0.25'
  )

  version.loadVersions()
  api.getCurrentAccount().then(res => {
    if (res.success && res.data) {
      account.currentAccount = res.data
    }
  })
})

onBeforeUnmount(() => {
  account.reset()
})
</script>

<style scoped src="@/styles/views/Game.css"></style>