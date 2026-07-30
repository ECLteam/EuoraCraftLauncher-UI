<template>
  <div class="game-page">
    <div class="game-left">
      <div id="plugin-slot-game-left" class="plugin-slot-container"></div>
      <NCard class="game-hero" contentStyle="padding: 28px;">
        <span class="game-hero__kicker">EUORACRAFT LAUNCHER</span>
        <h1>{{ t('game.quickLaunch') }}</h1>
        <p>{{ t('game.welcomeContent') }}</p>
        <NSpace>
          <NTag :bordered="false" type="info">
            {{ account.currentAccount?.alias || t('game.noAccount') }}
          </NTag>
          <NTag :bordered="false">
            {{ version.selectedVersion || t('game.noVersions') }}
          </NTag>
        </NSpace>
      </NCard>
    </div>

    <div class="game-right">
      <div id="plugin-slot-game-right-top" class="plugin-slot-container"></div>
      <Transition name="slide-out" mode="out-in">
        <div v-if="!launchProgress.visible" key="cards" class="game-right-cards">
          <GameAccountCard
            :account="account.currentAccount"
            :accountTypeLabel="account.accountTypeLabel"
            @manage="account.openAccountModal"
          />
          <GameInfoCard
            :data="infoCardData"
            :view="infoCardMode"
            :isWelcome="isWelcome"
            :currentTip="currentTip"
            :currentAnnouncement="currentAnnouncement"
            :hasAnnouncements="hasAnnouncements"
            :canToggle="canToggleInfoCard"
            @toggle="toggleInfoCard"
          />
        </div>
        <LaunchProgressCard
          v-else
          key="progress"
          :title="lpState.title"
          :versionName="lpState.versionName"
          :displayPercent="lpState.displayPercent"
          :stage="launchProgress.stage"
          :message="launchProgress.message"
          :visual="launchVersionVisual"
          @cancel="handleLaunchProgressCancel"
        />
      </Transition>

      <GameLaunchBar
        v-if="!launchProgress.visible && hasGamePath"
        :versionsCount="version.versions.length"
        :launching="version.launching"
        :selectedVersion="version.selectedVersion"
        :hasAccount="Boolean(account.currentAccount)"
        @launch="version.launchGame(account.currentAccount)"
        @manageVersions="goToInstallVersion"
        @settings="openGameSettings"
      />
    </div>

    <Modal
      v-model:visible="account.showAccountModal"
      :title="t('game.accountManagement')"
      :showFooter="false"
      bodyClass="account-modal-body"
      wrapperClass="account-management-modal"
      width="820px"
    >
      <div class="account-container">
        <section class="account-list-panel ecl-surface">
          <div class="account-panel-header">
            <span>{{ t('game.savedAccounts') }}</span>
            <NTag v-if="account.accounts.length" size="small" :bordered="false">
              {{ account.accounts.length }}
            </NTag>
          </div>
          <NSpin :show="account.accountsLoading" class="account-list-spin">
            <NList v-if="account.accounts.length" hoverable>
              <NListItem v-for="savedAccount in account.accounts" :key="savedAccount.id">
                <template #prefix>
                  <AvatarRenderer
                    :uuid="savedAccount.uuid"
                    :username="savedAccount.alias"
                    :typeName="savedAccount.type"
                    :skinUrl="savedAccount.skinUrl"
                    :size="34"
                  />
                </template>
                <NThing :title="savedAccount.alias">
                  <template #description>
                    <NSpace :size="6">
                      <NTag size="small" :bordered="false">
                        {{ accountTypeName(savedAccount.type) }}
                      </NTag>
                      <span class="account-secondary">
                        {{ savedAccount.email || savedAccount.auth_server || '' }}
                      </span>
                    </NSpace>
                  </template>
                </NThing>
                <template #suffix>
                  <NSpace :size="6">
                    <NTag v-if="savedAccount.isCurrent" size="small" type="success">
                      {{ t('game.current') }}
                    </NTag>
                    <NButton v-else quaternary size="small" @click="account.switchAccount(savedAccount.id)">
                      {{ t('game.switch') }}
                    </NButton>
                    <NButton
                      quaternary
                      size="small"
                      type="error"
                      :title="t('app.delete')"
                      @click="account.removeAccount(savedAccount.id, savedAccount.alias)"
                    >
                      <template #icon><UiIcon name="delete" :size="14" /></template>
                    </NButton>
                  </NSpace>
                </template>
              </NListItem>
            </NList>
            <NEmpty v-else class="account-empty" :description="t('game.noAccounts')" />
          </NSpin>
        </section>

        <section class="account-add-panel ecl-surface">
          <div class="account-panel-header">{{ t('game.addAccount') }}</div>
          <div class="account-add-body">
            <NSelect
              v-model:value="selectedAccountType"
              :options="accountTypeOptions"
              :placeholder="t('game.selectAccountType')"
              @update:value="handleAccountTypeChange"
            />

            <div class="account-type-intro">
              <div class="account-type-icon">
                <UiIcon :name="selectedAccountMeta.icon" :size="18" />
              </div>
              <div>
                <strong>{{ selectedAccountMeta.label }}</strong>
                <p>{{ selectedAccountMeta.description }}</p>
              </div>
            </div>

            <div v-if="selectedAccountType === 'microsoft'" class="account-form">
              <NAlert type="info" :showIcon="true">
                {{ t('game.microsoftLoginHint') }}
              </NAlert>
              <NButton
                type="primary"
                block
                :loading="account.startingMicrosoftLogin"
                @click="account.startMicrosoftLogin"
              >
                <template #icon><UiIcon name="microsoft" :size="15" /></template>
                {{ t('game.continueMicrosoftLogin') }}
              </NButton>
            </div>

            <div v-else-if="selectedAccountType === 'offline'" class="account-form">
              <NInput
                v-model:value="account.newOfflineUsername"
                :placeholder="t('game.enterUsername')"
                @keyup.enter="account.addOfflineAccount"
              />
              <NAlert type="default" :showIcon="false">{{ t('game.offlineNoPassword') }}</NAlert>
              <NButton
                type="primary"
                block
                :loading="account.addingOffline"
                :disabled="!account.newOfflineUsername.trim()"
                @click="account.addOfflineAccount"
              >
                {{ t('game.addOfflineAccount') }}
              </NButton>
            </div>

            <NAlert v-else type="warning" title="Authlib"> 外置登录暂未开发，后续版本开放。 </NAlert>
          </div>
        </section>
      </div>
    </Modal>

    <Modal
      v-model:visible="account.showMicrosoftLoginModal"
      :title="t('game.login.title')"
      :closable="false"
      bodyClass="ms-login-body"
      width="420px"
    >
      <div class="ms-login-content">
        <div v-if="account.microsoftLoginStatus === 'pending'" class="ms-login-pending">
          <NAlert type="info">{{ t('game.microsoftLoginHint') }}</NAlert>
          <NButton block @click="account.openMicrosoftLoginPage">
            <span class="ms-login-url">{{ account.microsoftLoginData.verificationUri }}</span>
            <template #icon><UiIcon name="external-link" :size="14" /></template>
          </NButton>
          <NInput class="ms-code" readonly :value="account.microsoftLoginData.userCode" />
          <NButton block @click="account.copyUserCode">
            <template #icon>
              <UiIcon :name="account.copiedUserCode ? 'check' : 'copy'" :size="14" />
            </template>
            {{ account.copiedUserCode ? t('game.login.copied') : t('game.login.copyCode') }}
          </NButton>
          <div class="ms-login-status">
            <NSpin size="small" />
            <span>{{ t('game.login.autoDetecting') }}</span>
          </div>
        </div>
        <div v-else-if="account.microsoftLoginStatus === 'loading'" class="ms-login-loading">
          <NSpin />
          <span>{{ t('game.login.waiting') }}</span>
        </div>
        <NAlert v-else-if="account.microsoftLoginStatus === 'error'" type="error">
          {{ account.microsoftLoginError }}
        </NAlert>
      </div>
      <template #footer>
        <NButton @click="account.cancelMicrosoftLogin">{{ t('common.cancel') }}</NButton>
      </template>
    </Modal>

    <Modal v-model:visible="account.showClientIdModal" :title="t('game.clientId.title')" :closable="false">
      <div class="client-id-content">
        <p>{{ t('game.clientId.description') }}</p>
        <p>{{ t('game.clientId.fileHint') }}</p>
        <pre>MICROSOFT_CLIENT_ID=your_client_id_here</pre>
      </div>
      <template #footer>
        <NButton type="primary" @click="account.cancelClientId">
          {{ t('common.confirm') }}
        </NButton>
      </template>
    </Modal>

    <ConfirmDialog
      v-model:visible="account.showDeleteConfirmModal"
      :title="t('common.confirm')"
      :content="account.deleteConfirmMessage"
      :confirmText="t('common.delete')"
      :loading="account.deletingAccount"
      :closeOnConfirm="false"
      danger
      @confirm="account.confirmRemoveAccount"
    />
  </div>
</template>

<script setup lang="ts">
import {
  NAlert,
  NButton,
  NCard,
  NEmpty,
  NInput,
  NList,
  NListItem,
  NSelect,
  NSpace,
  NSpin,
  NTag,
  NThing,
} from 'naive-ui'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AvatarRenderer from '@/components/game/AvatarRenderer.vue'
import GameAccountCard from '@/components/game/GameAccountCard.vue'
import GameInfoCard from '@/components/game/GameInfoCard.vue'
import GameLaunchBar from '@/components/game/GameLaunchBar.vue'
import LaunchProgressCard from '@/components/game/LaunchProgressCard.vue'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import Modal from '@/components/modals/Modal.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { useAccountManager } from '@/composables/useAccountManager'
import { globalLaunchProgress } from '@/composables/useLaunchProgress'
import { useVersionManager } from '@/composables/useVersionManager'
import { getVersionImage } from '@/config/version'
import { useGameInfoCard } from '@/features/game-home/composables/useGameInfoCard'
import { useGameHomeStore } from '@/features/game-home/stores/gameHomeStore'
import { getLoaderIcon, getLoaderImage } from '@/utils/loader'

const { t } = useI18n()
const router = useRouter()
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
  canToggleInfoCard,
  start: startInfoCard,
  stop: stopInfoCard,
  toggle: toggleInfoCard,
} = useGameInfoCard()

type AccountType = 'microsoft' | 'offline' | 'authlib'

const selectedAccountType = ref<AccountType>('microsoft')
const accountTypeOptions = computed(() => [
  { value: 'microsoft', label: t('game.microsoftAccount') },
  { value: 'offline', label: t('game.offlineAccount') },
  { value: 'authlib', label: t('game.authlibAccount') },
])
const selectedAccountMeta = computed(() => {
  const descriptions: Record<AccountType, string> = {
    microsoft: t('game.microsoftAccountDesc'),
    offline: t('game.offlineAccountDesc'),
    authlib: t('game.authlibAccountDesc'),
  }
  const icons: Record<AccountType, string> = {
    microsoft: 'microsoft',
    offline: 'user',
    authlib: 'shield',
  }
  const option = accountTypeOptions.value.find((item) => item.value === selectedAccountType.value)
  return {
    icon: icons[selectedAccountType.value],
    label: option?.label || '',
    description: descriptions[selectedAccountType.value],
  }
})

function handleAccountTypeChange(value: AccountType) {
  selectedAccountType.value = value
}

function accountTypeName(type: string): string {
  if (type === 'microsoft') return t('game.accountTypeMicrosoft')
  if (type === 'authlib') return t('game.accountTypeAuthlib')
  return t('game.accountTypeOffline')
}

const lpState = computed(() => {
  const stage = launchProgress.value.stage
  const completed = stage.includes('启动成功') || stage.includes('completed') || stage.includes('success')
  return {
    title: completed ? '已启动游戏' : '正在启动游戏',
    versionName: version.selectedVersion || '',
    displayPercent: smoothPercent.value,
  }
})

const launchVersionVisual = computed(() => {
  const selected = version.versions.find((item) => item.id === version.selectedVersion)
  const loaderImage = getLoaderImage(selected?.type)
  if (loaderImage) return { image: loaderImage, icon: '' }
  const versionTypeImage = getVersionImage(selected?.versionType)
  if (versionTypeImage) return { image: versionTypeImage, icon: '' }
  return { image: '', icon: getLoaderIcon(selected?.type) }
})

const launchCancelTimer = ref<ReturnType<typeof setTimeout> | null>(null)

async function handleLaunchProgressCancel() {
  globalLaunchProgress.cancel()
  try {
    await gameHomeStore.cancelLaunch()
  } catch (error) {
    console.warn('[LaunchCancel] 取消请求异常:', error)
  }
  launchCancelTimer.value = setTimeout(() => {
    if (version.launching) version.launching = false
    launchCancelTimer.value = null
  }, 5000)
}

function openGameSettings() {
  void router.push('/settings/game')
}

function goToInstallVersion() {
  void router.push({ name: 'versions-manage' })
}

onMounted(() => {
  version.loadVersions()
  account.loadCurrentAccount()
  startInfoCard().catch((error) => {
    console.warn('[GameHome] 加载首页数据失败:', error)
  })
})

onBeforeUnmount(() => {
  account.reset()
  stopInfoCard()
  if (launchCancelTimer.value) clearTimeout(launchCancelTimer.value)
})
</script>

<style scoped src="@/styles/views/Game.css"></style>
