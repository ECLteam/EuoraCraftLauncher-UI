<template>
  <div class="connect-page">
    <section class="connect-workspace ecl-surface">
      <header class="connect-workspace__header">
        <div class="connect-workspace__identity">
          <div class="connect-workspace__icon">
            <UiIcon name="wifi" :size="20" />
          </div>
          <div>
            <h1>{{ workspaceTitle }}</h1>
            <p>{{ workspaceDescription }}</p>
          </div>
        </div>
        <div class="connect-header-actions">
          <NTag v-if="natType" :type="natTagType" size="small" round>
            {{ t(`connect.nat.${natType.type}`) }}
          </NTag>
          <UiButton
            variant="outline"
            size="sm"
            icon="wifi"
            :loading="natBusy"
            :disabled="availability !== 'available'"
            @click="detectNat"
          >
            {{ t('connect.nat.detect') }}
          </UiButton>
        </div>
      </header>

      <div class="connect-workspace__body">
        <UiCard v-if="availability === 'available' && easyTier && !easyTier.installed" class="connect-service-card">
          <div class="connect-service-row">
            <div class="connect-service-icon">
              <UiIcon name="network" :size="20" />
            </div>
            <div class="connect-service-info">
              <strong>{{ t('connect.easyTier.title') }}</strong>
              <span v-if="easyTier.status === 'failed'" class="connect-error-text">
                {{ easyTier.error || t('connect.easyTier.failed') }}
              </span>
              <span v-else>{{ easyTierPhaseText }}</span>
            </div>
            <span v-if="isEasyTierWorking" class="connect-service-speed">
              {{ Math.round(easyTier.progress) }}% {{ formatSpeed(easyTier.speed) }}
            </span>
            <UiButton
              v-else
              size="sm"
              variant="outline"
              icon="download"
              :loading="easyTierBusy"
              @click="downloadEasyTier"
            >
              {{ easyTier.status === 'failed' ? t('connect.easyTier.retry') : t('connect.easyTier.install') }}
            </UiButton>
          </div>
          <NProgress
            v-if="isEasyTierWorking"
            type="line"
            :percentage="Math.max(2, easyTier.progress)"
            :showIndicator="false"
            :height="6"
            :borderRadius="3"
          />
        </UiCard>

        <div class="connect-scroll-area">
          <template v-if="status.mode === 'idle'">
            <div v-if="!activeTab" class="connect-entry-panel">
              <div class="connect-entry-intro">
                <div class="connect-entry-intro__icon">
                  <UiIcon name="network" :size="24" />
                </div>
                <div>
                  <strong>{{ t('connect.entry.title') }}</strong>
                  <p>{{ t('connect.entry.description') }}</p>
                </div>
              </div>
              <div class="connect-entry-actions">
                <button type="button" class="connect-entry-option is-create" @click="selectTab('create')">
                  <span class="connect-entry-option__icon">
                    <UiIcon name="server" :size="22" />
                  </span>
                  <span class="connect-entry-option__content">
                    <strong>{{ t('connect.create.tab') }}</strong>
                    <small>{{ t('connect.entry.createDescription') }}</small>
                  </span>
                  <span class="connect-entry-option__arrow">
                    <UiIcon name="arrow-right" :size="18" />
                  </span>
                </button>
                <button type="button" class="connect-entry-option is-join" @click="selectTab('join')">
                  <span class="connect-entry-option__icon">
                    <UiIcon name="login" :size="22" />
                  </span>
                  <span class="connect-entry-option__content">
                    <strong>{{ t('connect.join.tab') }}</strong>
                    <small>{{ t('connect.entry.joinDescription') }}</small>
                  </span>
                  <span class="connect-entry-option__arrow">
                    <UiIcon name="arrow-right" :size="18" />
                  </span>
                </button>
              </div>
            </div>

            <div v-else class="connect-idle-layout">
              <div class="connect-idle-primary">
                <button type="button" class="connect-back-link" @click="returnToChoices">
                  <UiIcon name="arrow-left" :size="16" />
                  {{ t('common.back') }}
                </button>
                <UiCard v-if="activeTab === 'create'" class="connect-main-card">
                  <template #header>
                    <div class="connect-card-heading">
                      <UiIcon :name="hostMode === 'instance' ? 'game' : 'server'" :size="18" />
                      <div>
                        <strong>{{
                          hostMode === 'instance' ? t('connect.create.instanceTitle') : t('connect.create.portTitle')
                        }}</strong>
                        <span>{{
                          hostMode === 'instance' ? t('connect.create.instanceHint') : t('connect.create.portHint')
                        }}</span>
                      </div>
                    </div>
                  </template>

                  <div v-if="hostMode === 'instance'" class="connect-form">
                    <label for="connect-instance">{{ t('connect.create.selectInstance') }}</label>
                    <NSelect
                      id="connect-instance"
                      v-model:value="selectedInstanceKey"
                      :options="instanceOptions"
                      :placeholder="t('connect.create.instancePlaceholder')"
                      filterable
                      :disabled="!serviceReady"
                    />
                    <UiButton
                      class="connect-primary-action"
                      icon="play"
                      :loading="busy"
                      :disabled="!serviceReady || !selectedInstanceKey"
                      @click="createFromInstance"
                    >
                      {{ t('connect.create.launchAndCreate') }}
                    </UiButton>
                    <p class="connect-help-text">{{ t('connect.create.lanHint') }}</p>
                    <button
                      class="connect-mode-link"
                      type="button"
                      :disabled="availability !== 'available'"
                      @click="openPortMode"
                    >
                      {{ t('connect.create.alreadyRunning') }}
                    </button>
                  </div>

                  <div v-else class="connect-form">
                    <div class="connect-port-scan">
                      <div v-if="scanning" class="connect-scan-state">
                        <UiIcon name="spinner" :size="18" class="spin" />
                        <span>{{ t('connect.create.scanning') }}</span>
                      </div>
                      <div v-else-if="detectedPort" class="connect-detected-port">
                        <div>
                          <span>{{ t('connect.create.detectedPort') }}</span>
                          <strong>{{ detectedPort }}</strong>
                        </div>
                        <UiButton :loading="busy" :disabled="!serviceReady" @click="createDetectedPort">
                          {{ t('connect.create.createRoom') }}
                        </UiButton>
                      </div>
                      <div v-else class="connect-scan-state">
                        <UiIcon name="info" :size="18" />
                        <span>{{ t('connect.create.noPort') }}</span>
                        <UiButton size="sm" variant="text" @click="startPortScan">{{ t('common.refresh') }}</UiButton>
                      </div>
                    </div>
                    <label for="connect-port">{{ t('connect.create.manualPort') }}</label>
                    <div class="connect-port-input">
                      <UiButton
                        variant="outline"
                        shape="square"
                        icon="minus"
                        :title="t('connect.create.decreasePort')"
                        :disabled="Number(port) <= 1"
                        @click="changePort(-1)"
                      />
                      <UiInput
                        id="connect-port"
                        v-model="port"
                        type="number"
                        placeholder="25565"
                        :aria-label="t('connect.create.manualPort')"
                        :disabled="!serviceReady"
                        @enter="createManualPort"
                      />
                      <UiButton
                        variant="outline"
                        shape="square"
                        icon="plus"
                        :title="t('connect.create.increasePort')"
                        :disabled="Number(port) >= 65535"
                        @click="changePort(1)"
                      />
                      <UiButton :loading="busy" :disabled="!serviceReady" @click="createManualPort">
                        {{ t('connect.create.createRoom') }}
                      </UiButton>
                    </div>
                    <button class="connect-mode-link" type="button" @click="closePortMode">
                      {{ t('common.back') }}
                    </button>
                  </div>
                </UiCard>

                <UiCard v-else class="connect-main-card">
                  <template #header>
                    <div class="connect-card-heading">
                      <UiIcon name="login" :size="18" />
                      <div>
                        <strong>{{ t('connect.join.title') }}</strong>
                        <span>{{ t('connect.join.hint') }}</span>
                      </div>
                    </div>
                  </template>
                  <div class="connect-form">
                    <label for="connect-room-code">{{ t('connect.join.roomCode') }}</label>
                    <UiInput
                      id="connect-room-code"
                      v-model="roomCode"
                      placeholder="U/XXXX-XXXX-XXXX-XXXX"
                      prefixIcon="link"
                      clearable
                      :aria-label="t('connect.join.roomCode')"
                      :disabled="!serviceReady"
                      @enter="joinRoom"
                    />
                    <UiButton
                      class="connect-primary-action"
                      icon="login"
                      :loading="busy"
                      :disabled="!serviceReady || !roomCode.trim()"
                      @click="joinRoom"
                    >
                      {{ t('connect.join.action') }}
                    </UiButton>
                  </div>
                </UiCard>
              </div>
            </div>
          </template>

          <UiCard v-else-if="status.mode === 'starting'" class="connect-main-card connect-state-card">
            <div v-if="status.error" class="connect-state-content connect-state-error">
              <UiIcon name="alert-circle" :size="32" />
              <h2>{{ t('connect.starting.failed') }}</h2>
              <p>{{ status.error }}</p>
              <UiButton @click="leave">{{ t('common.confirm') }}</UiButton>
            </div>
            <div v-else class="connect-state-content">
              <UiIcon name="spinner" :size="32" class="spin connect-state-icon" />
              <h2>{{ t('connect.starting.title') }}</h2>
              <p>{{ t('connect.starting.description') }}</p>
              <NProgress type="line" processing :percentage="35" :showIndicator="false" />
              <UiButton variant="danger" :loading="busy" @click="leave">{{ t('common.cancel') }}</UiButton>
            </div>
          </UiCard>

          <UiCard v-else-if="status.mode === 'host'" class="connect-main-card connect-room-card">
            <template #header>
              <div class="connect-card-heading">
                <UiIcon name="crown" :size="18" />
                <div>
                  <strong>{{ t('connect.host.title') }}</strong>
                  <span>{{ t('connect.host.description') }}</span>
                </div>
              </div>
            </template>
            <div class="connect-room-code-panel">
              <span>{{ t('connect.join.roomCode') }}</span>
              <code>{{ status.roomCode }}</code>
              <UiButton
                variant="ghost"
                shape="square"
                icon="copy"
                :title="t('connect.copy')"
                @click="copyText(status.roomCode || '')"
              />
            </div>
            <PlayerList :players="status.players" :hostControls="true" :busy="busy" @kick="kick" />
            <UiButton class="connect-danger-action" variant="danger" icon="logout" :loading="busy" @click="leave">
              {{ t('connect.host.close') }}
            </UiButton>
          </UiCard>

          <UiCard v-else class="connect-main-card connect-room-card">
            <template #header>
              <div class="connect-card-heading">
                <UiIcon name="users" :size="18" />
                <div>
                  <strong>{{ t('connect.guest.title') }}</strong>
                  <span>{{ t('connect.guest.description') }}</span>
                </div>
              </div>
            </template>
            <div class="connect-room-code-panel">
              <span>{{ t('connect.guest.serverAddress') }}</span>
              <code>{{ serverAddress }}</code>
              <UiButton
                variant="ghost"
                shape="square"
                icon="copy"
                :title="t('connect.copy')"
                @click="copyText(serverAddress)"
              />
            </div>
            <div v-if="status.gameInfo" class="connect-game-info">
              <NTag size="small" type="info">{{ status.gameInfo.gameVersion }}</NTag>
              <NTag v-if="status.gameInfo.loader" size="small">
                {{ status.gameInfo.loader }} {{ status.gameInfo.loaderVersion }}
              </NTag>
            </div>
            <PlayerList :players="status.players" />

            <div class="connect-match-section">
              <div class="connect-section-title">
                <strong>{{ t('connect.match.title') }}</strong>
                <UiButton size="sm" variant="text" icon="refresh" :loading="matching" @click="refreshMatches">
                  {{ t('common.refresh') }}
                </UiButton>
              </div>
              <div v-if="matching && !matchResult" class="connect-inline-loading">
                <UiIcon name="spinner" class="spin" />
                {{ t('connect.match.loading') }}
              </div>
              <template v-else>
                <div class="connect-mod-list">
                  <span class="connect-subtitle">{{
                    t('connect.match.hostMods', { count: matchResult?.mods.length ?? 0 })
                  }}</span>
                  <div v-if="matchResult?.mods.length" class="connect-mod-items">
                    <div v-for="mod in matchResult.mods" :key="`${mod.hash}-${mod.id}`" class="connect-mod-item">
                      <span>{{ mod.name }}</span>
                      <NTag size="tiny" :type="mod.source === 'modrinth' ? 'success' : 'warning'">{{
                        mod.source
                      }}</NTag>
                      <code>{{ mod.hash.slice(0, 8) }}</code>
                    </div>
                  </div>
                  <span v-else class="connect-empty-text">{{ t('connect.match.noMods') }}</span>
                </div>
                <div class="connect-instance-matches">
                  <span class="connect-subtitle">{{ t('connect.match.instances') }}</span>
                  <div v-if="matchResult?.instances.length" class="connect-match-items">
                    <div
                      v-for="instance in matchResult.instances"
                      :key="`${instance.gamePath}-${instance.versionId}`"
                      class="connect-match-item"
                      :class="{ matched: instance.matched }"
                    >
                      <div>
                        <strong>{{ instance.name }}</strong>
                        <span>
                          {{ instance.gameVersion }} · {{ instance.loader || 'Vanilla' }} ·
                          {{
                            t(instance.matched ? 'connect.match.consistent' : 'connect.match.inconsistent', {
                              count: instance.modCount,
                            })
                          }}
                        </span>
                      </div>
                      <UiButton
                        v-if="instance.matched"
                        size="sm"
                        icon="play"
                        :loading="launchingKey === `${instance.gamePath}\u0000${instance.versionId}`"
                        :disabled="Boolean(launchingKey)"
                        @click="quickLaunch(instance)"
                      >
                        {{ t('connect.match.quickLaunch') }}
                      </UiButton>
                    </div>
                  </div>
                  <span v-else class="connect-empty-text">{{ t('connect.match.noInstances') }}</span>
                </div>
              </template>
            </div>

            <UiButton class="connect-danger-action" variant="danger" icon="logout" :loading="busy" @click="leave">
              {{ t('connect.guest.leave') }}
            </UiButton>
          </UiCard>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { NAvatar, NProgress, NSelect, NTag } from 'naive-ui'
import { computed, defineComponent, h, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiButton from '@/components/ui/Button.vue'
import UiCard from '@/components/ui/Card.vue'
import UiIcon from '@/components/ui/Icon.vue'
import UiInput from '@/components/ui/Input.vue'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { useConnector } from '@/features/connect/composables/useConnector'
import { instanceWorkspaceApi } from '@/features/instances/api/instanceWorkspaceApi'
import { useInstanceStore } from '@/features/instances/stores/instanceStore'
import type { ConnectorMatchedInstance, ConnectorPlayer } from '@/types/api'
import { getErrorMessage } from '@/utils/error'

const PlayerList = defineComponent({
  name: 'ConnectorPlayerList',
  props: {
    players: { type: Array as () => ConnectorPlayer[], required: true },
    hostControls: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
  },
  emits: { kick: (_player: ConnectorPlayer) => true },
  setup(props, { emit }) {
    const { t } = useI18n()
    return () =>
      h('section', { class: 'connect-player-section' }, [
        h('div', { class: 'connect-section-title' }, [
          h('strong', t('connect.players.title', { count: props.players.length })),
        ]),
        props.players.length
          ? h(
              'div',
              { class: 'connect-player-list' },
              props.players.map((player) =>
                h('div', { class: 'connect-player-row', key: player.machineId || player.name }, [
                  h(
                    NAvatar,
                    {
                      round: true,
                      size: 34,
                      src: player.iconBase64 ? `data:image/png;base64,${player.iconBase64}` : undefined,
                    },
                    { default: () => player.name.slice(0, 1).toUpperCase() }
                  ),
                  h('div', { class: 'connect-player-identity' }, [
                    h('div', [
                      h('strong', player.name),
                      player.kind === 'host'
                        ? h(NTag, { size: 'tiny', type: 'info' }, { default: () => t('connect.players.host') })
                        : null,
                    ]),
                    h('span', player.vendor),
                  ]),
                  props.hostControls && player.kind !== 'host'
                    ? h(UiButton, {
                        variant: 'ghost',
                        shape: 'square',
                        icon: 'user-x',
                        title: t('connect.players.kick'),
                        disabled: props.busy,
                        onClick: () => emit('kick', player),
                      })
                    : null,
                ])
              )
            )
          : h('span', { class: 'connect-empty-text' }, t('connect.players.empty')),
      ])
  },
})

const { t } = useI18n()
const message = useLauncherMessage()
const instanceStore = useInstanceStore()
const activeTab = ref<'create' | 'join' | null>(null)
const hostMode = ref<'instance' | 'port'>('instance')
const selectedInstanceKey = ref('')
const port = ref('25565')
const roomCode = ref('')
const launchingKey = ref('')

const {
  availability,
  status,
  easyTier,
  natType,
  matchResult,
  busy,
  easyTierBusy,
  natBusy,
  matching,
  scanning,
  detectedPort,
  hostPort,
  hostInstance,
  join,
  leave,
  kick,
  detectNat,
  downloadEasyTier,
  startPortScan,
  stopPortScan,
  refreshMatches,
} = useConnector({ onError: (error) => message.error(error) })

const instanceOptions = computed(() =>
  instanceStore.scannedVersions
    .filter((instance) => !instance.isBroken)
    .map((instance) => ({
      label: instance.displayName || instance.versionId,
      value: `${instance.path}\u0000${instance.versionId}`,
    }))
)

const serviceReady = computed(() => availability.value === 'available' && Boolean(easyTier.value?.installed))
const isEasyTierWorking = computed(() =>
  ['resolving', 'downloading', 'extracting'].includes(easyTier.value?.status ?? '')
)
const easyTierPhaseText = computed(() => t(`connect.easyTier.${easyTier.value?.status ?? 'idle'}`))
const serverAddress = computed(() => `${status.value.mcHost || '127.0.0.1'}:${status.value.mcPort || 25565}`)
const natTagType = computed<'success' | 'error' | 'warning' | 'default'>(() => {
  if (natType.value?.type === 'cone') return 'success'
  if (natType.value?.type === 'symmetric' || natType.value?.type === 'blocked') return 'error'
  return 'default'
})
const workspaceTitle = computed(() => {
  if (status.value.mode === 'starting') return t('connect.starting.title')
  if (status.value.mode === 'host') return t('connect.host.title')
  if (status.value.mode === 'guest') return t('connect.guest.title')
  if (!activeTab.value) return t('connect.title')
  if (activeTab.value === 'join') return t('connect.join.title')
  return t(hostMode.value === 'instance' ? 'connect.create.instanceTitle' : 'connect.create.portTitle')
})
const workspaceDescription = computed(() => {
  if (status.value.mode === 'starting') return t('connect.starting.description')
  if (status.value.mode === 'host') return t('connect.host.description')
  if (status.value.mode === 'guest') return t('connect.guest.description')
  if (!activeTab.value) return t('connect.description')
  if (activeTab.value === 'join') return t('connect.join.hint')
  return t(hostMode.value === 'instance' ? 'connect.create.instanceHint' : 'connect.create.portHint')
})

function selectTab(tab: 'create' | 'join'): void {
  if (status.value.mode === 'idle') activeTab.value = tab
}

function returnToChoices(): void {
  stopPortScan()
  hostMode.value = 'instance'
  activeTab.value = null
}

function selectedTarget(): { game_path: string; version_id: string } | null {
  const separator = selectedInstanceKey.value.indexOf('\u0000')
  if (separator < 0) return null
  return {
    game_path: selectedInstanceKey.value.slice(0, separator),
    version_id: selectedInstanceKey.value.slice(separator + 1),
  }
}

async function createFromInstance(): Promise<void> {
  const target = selectedTarget()
  if (!target) {
    message.warning(t('connect.validation.instance'))
    return
  }
  await hostInstance(target)
}

function validPort(): number | null {
  const parsed = Number.parseInt(port.value, 10)
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    message.warning(t('connect.validation.port'))
    return null
  }
  return parsed
}

async function createManualPort(): Promise<void> {
  const parsed = validPort()
  if (parsed !== null) await hostPort(parsed)
}

async function createDetectedPort(): Promise<void> {
  if (detectedPort.value !== null) await hostPort(detectedPort.value)
}

function changePort(delta: number): void {
  port.value = String(Math.min(65535, Math.max(1, (Number.parseInt(port.value, 10) || 0) + delta)))
}

function openPortMode(): void {
  hostMode.value = 'port'
  startPortScan()
}

function closePortMode(): void {
  hostMode.value = 'instance'
  stopPortScan()
}

async function joinRoom(): Promise<void> {
  const code = roomCode.value.trim()
  if (!code) {
    message.warning(t('connect.validation.roomCode'))
    return
  }
  await join(code)
}

async function copyText(text: string): Promise<void> {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    message.success(t('connect.copied'))
  } catch (error) {
    message.error(getErrorMessage(error))
  }
}

async function quickLaunch(instance: ConnectorMatchedInstance): Promise<void> {
  const key = `${instance.gamePath}\u0000${instance.versionId}`
  launchingKey.value = key
  try {
    await instanceWorkspaceApi.launchServer(
      { game_path: instance.gamePath, version_id: instance.versionId },
      serverAddress.value
    )
    message.success(t('connect.match.launched', { name: instance.name }))
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    launchingKey.value = ''
  }
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond <= 0) return ''
  if (bytesPerSecond >= 1024 * 1024) return `${(bytesPerSecond / 1024 / 1024).toFixed(1)} MB/s`
  return `${Math.round(bytesPerSecond / 1024)} KB/s`
}

onMounted(() => {
  if (instanceStore.scannedVersions.length === 0) {
    void instanceStore.loadAll().catch(() => undefined)
  }
})
</script>

<style scoped src="@/styles/views/Connect.css"></style>

