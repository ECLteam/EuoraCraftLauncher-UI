<template>
  <div class="connect-page">
    <section class="connect-workspace">
      <div class="connect-workspace__body">
        <div v-if="flowDebug" class="connect-debug-bar">
          <span class="connect-debug-bar__label">
            <UiIcon name="bug" :size="13" />
            {{ t('connect.debug.label') }}
          </span>
          <div class="connect-debug-bar__nav">
            <UiButton
              size="sm"
              variant="outline"
              icon="arrow-left"
              :disabled="debugStageIndex <= 0"
              @click="prevDebugStage"
            >
              {{ t('connect.debug.prev') }}
            </UiButton>
            <div class="connect-debug-chips">
              <button
                v-for="(stage, index) in debugStages"
                :key="stage.key"
                type="button"
                class="connect-debug-chip"
                :class="{ active: debugStageIndex === index }"
                @click="applyDebugStage(index)"
              >
                {{ stage.label }}
              </button>
            </div>
            <UiButton
              size="sm"
              variant="outline"
              icon="arrow-right"
              :disabled="debugStageIndex >= debugStages.length - 1"
              @click="nextDebugStage"
            >
              {{ t('connect.debug.next') }}
            </UiButton>
          </div>
          <UiButton v-if="stageOverride" size="sm" variant="text" @click="resetLiveStage">
            {{ t('connect.debug.live') }}
          </UiButton>
        </div>

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
          <UiProgress v-if="isEasyTierWorking" :percentage="Math.max(2, easyTier.progress)" :height="6" />
        </UiCard>

        <div class="connect-scroll-area">
          <template v-if="displayStatus.mode === 'idle'">
            <div class="connect-idle-layout">
              <div class="connect-idle-primary">
                <UiCard v-if="displayHostStep !== 2" class="connect-main-card">
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
                    <div class="connect-room-input-row">
                      <UiInput
                        id="connect-room-code"
                        v-model="roomCode"
                        placeholder="U/XXXX-XXXX-XXXX-XXXX"
                        prefixIcon="link"
                        :aria-label="t('connect.join.roomCode')"
                        :disabled="!serviceReady"
                        @enter="joinRoom"
                      />
                      <UiButton
                        variant="outline"
                        icon="close"
                        :disabled="!serviceReady || !roomCode"
                        @click="clearRoomCode"
                      >
                        {{ t('common.clear') }}
                      </UiButton>
                      <UiButton
                        variant="outline"
                        icon="clipboard"
                        :title="t('connect.join.paste')"
                        :disabled="!serviceReady"
                        @click="pasteRoomCode"
                      >
                        {{ t('connect.join.paste') }}
                      </UiButton>
                      <UiButton
                        icon="login"
                        :loading="busy"
                        :disabled="!serviceReady || !roomCode.trim()"
                        @click="joinRoom"
                      >
                        {{ t('connect.join.action') }}
                      </UiButton>
                    </div>
                  </div>
                </UiCard>

                <UiCard class="connect-main-card">
                  <template #header>
                    <div class="connect-card-heading">
                      <UiIcon name="server" :size="18" />
                      <div>
                        <strong>{{ t('connect.create.title') }}</strong>
                        <span>{{ t('connect.create.hint') }}</span>
                      </div>
                      <UiButton
                        class="connect-header-nat"
                        variant="outline"
                        size="sm"
                        icon="wifi"
                        :loading="natBusy"
                        :disabled="availability !== 'available'"
                        @click="detectNatWithNotify"
                      >
                        {{ t('connect.nat.detect') }}
                      </UiButton>
                    </div>
                  </template>

                  <div v-if="displayHostStep === 1" class="connect-form">
                    <label for="connect-instance">{{ t('connect.create.selectInstance') }}</label>
                    <div class="connect-room-input-row">
                      <UiSelect
                        id="connect-instance"
                        v-model="selectedInstanceKey"
                        :options="runningInstanceOptions"
                        :placeholder="t('connect.create.instancePlaceholder')"
                        searchable
                        :disabled="!serviceReady"
                      />
                      <UiButton variant="outline" icon="edit" :disabled="!serviceReady" @click="goToManualPort">
                        {{ t('connect.create.manualPortEntry') }}
                      </UiButton>
                      <UiButton
                        icon="arrow-right"
                        :disabled="!serviceReady || !selectedInstanceKey"
                        @click="goToPortStep"
                      >
                        {{ t('connect.create.next') }}
                      </UiButton>
                    </div>
                    <p v-if="!runningInstances.length && serviceReady" class="connect-help-text">
                      {{ t('connect.create.noRunningInstance') }}
                    </p>
                    <div v-else-if="runningInstances.length" class="connect-running-games">
                      <span class="connect-running-games__hint">{{ t('connect.create.runningGameHint') }}</span>
                      <ul class="connect-running-games__list">
                        <li v-for="instance in runningInstances" :key="instance.id" class="connect-running-game">
                          <span class="connect-running-game__name">
                            <UiIcon name="game" :size="14" />
                            {{ instance.name || instance.versionId }}
                          </span>
                          <UiButton size="sm" variant="outline" @click="quickCreate(instance)">
                            {{ t('connect.create.createRoom') }}
                          </UiButton>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div v-else class="connect-form">
                    <p class="connect-help-text">{{ t('connect.create.lanHint') }}</p>
                    <div class="connect-port-scan">
                      <div v-if="displayScanning" class="connect-scan-state">
                        <UiIcon name="spinner" :size="18" class="spin" />
                        <span>{{
                          scanPhase === 'detecting' ? t('connect.create.detecting') : t('connect.create.searching')
                        }}</span>
                      </div>
                      <div v-else-if="displayDetectedPort" class="connect-detected-port">
                        <div>
                          <span>{{ t('connect.create.detectedPort') }}</span>
                          <strong>{{ displayDetectedPort }}</strong>
                          <span v-if="selectedInstance" class="connect-detected-game">
                            {{ t('connect.create.runningGame', { name: selectedInstance.name }) }}
                          </span>
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
                      <UiInput
                        id="connect-port"
                        v-model="port"
                        type="number"
                        placeholder="25565"
                        :aria-label="t('connect.create.manualPort')"
                        :disabled="!serviceReady"
                        @enter="createManualPort"
                      />
                      <UiButton :loading="busy" :disabled="!serviceReady" @click="createManualPort">
                        {{ t('connect.create.createRoom') }}
                      </UiButton>
                    </div>
                    <button class="connect-mode-link" type="button" @click="goBackToInstanceStep">
                      <UiIcon name="arrow-left" :size="16" />
                      <span>{{ t('connect.create.back') }}</span>
                    </button>
                  </div>
                </UiCard>
              </div>
            </div>
          </template>

          <UiCard v-else-if="displayStatus.mode === 'starting'" class="connect-main-card connect-state-card">
            <div v-if="displayStatus.error" class="connect-state-content connect-state-error">
              <UiIcon name="alert-circle" :size="32" />
              <h2>{{ t('connect.starting.failed') }}</h2>
              <p>{{ displayStatus.error }}</p>
              <UiButton @click="leave">{{ t('common.confirm') }}</UiButton>
            </div>
            <div v-else class="connect-state-content">
              <UiIcon name="spinner" :size="32" class="spin connect-state-icon" />
              <h2>{{ t('connect.starting.title') }}</h2>
              <p>{{ t('connect.starting.description') }}</p>
              <UiProgress processing :height="6" />
              <UiButton variant="danger" :loading="busy" @click="leave">{{ t('common.cancel') }}</UiButton>
            </div>
          </UiCard>

          <div v-else-if="displayStatus.mode === 'host'" class="connect-room-layout">
            <UiCard class="connect-main-card connect-room-card connect-room-main">
              <template #header>
                <div class="connect-card-heading">
                  <UiIcon name="users" :size="18" />
                  <div>
                    <strong>{{ t('connect.players.title', { count: displayStatus.players.length }) }}</strong>
                    <span>{{ t('connect.host.description') }}</span>
                  </div>
                </div>
              </template>
              <PlayerList :players="displayStatus.players" :hostControls="true" :busy="busy" @kick="kick" />
              <div class="connect-room-actions">
                <UiButton variant="outline" icon="refresh" :loading="busy" @click="() => refreshStatus()">
                  {{ t('connect.players.refresh') }}
                </UiButton>
                <UiButton variant="danger" icon="logout" :loading="busy" @click="leave">
                  {{ t('connect.host.close') }}
                </UiButton>
              </div>
            </UiCard>
            <aside class="connect-side-panel">
              <UiCard class="connect-side-card">
                <template #header>
                  <div class="connect-card-heading">
                    <UiIcon name="info" :size="18" />
                    <div>
                      <strong>{{ t('connect.roomInfo.title') }}</strong>
                      <span>{{ t('connect.roomInfo.hint') }}</span>
                    </div>
                  </div>
                </template>
                <div class="connect-side-status">
                  <div class="connect-side-status-row">
                    <span>{{ t('connect.join.roomCode') }}</span>
                    <code>{{ displayStatus.roomCode }}</code>
                  </div>
                  <div class="connect-side-status-row">
                    <span>{{ t('connect.roomInfo.creator') }}</span>
                    <code>{{ hostName || t('connect.host.title') }}</code>
                  </div>
                  <div v-if="displayStatus.gameInfo" class="connect-side-status-row">
                    <span>{{ t('connect.roomInfo.game') }}</span>
                    <code>{{ displayStatus.gameInfo.gameVersion }}</code>
                  </div>
                </div>
              </UiCard>
              <UiCard class="connect-side-card">
                <template #header>
                  <div class="connect-card-heading">
                    <UiIcon name="activity" :size="18" />
                    <div>
                      <strong>{{ t('connect.side.title') }}</strong>
                      <span>{{ t('connect.side.hint') }}</span>
                    </div>
                  </div>
                </template>
                <div class="connect-side-status">
                  <div class="connect-side-status-row">
                    <span>{{ t('connect.side.service') }}</span>
                    <UiTag :tone="easyTierTone" size="small">{{ easyTierPhaseText }}</UiTag>
                  </div>
                  <div class="connect-side-status-row">
                    <span>{{ t('connect.side.availability') }}</span>
                    <UiTag :tone="availabilityTone" size="small">{{ availabilityText }}</UiTag>
                  </div>
                </div>
              </UiCard>
            </aside>
          </div>

          <div v-else class="connect-room-layout">
            <UiCard class="connect-main-card connect-room-card connect-room-main">
              <template #header>
                <div class="connect-card-heading">
                  <UiIcon name="users" :size="18" />
                  <div>
                    <strong>{{ t('connect.players.title', { count: displayStatus.players.length }) }}</strong>
                    <span>{{ t('connect.guest.description') }}</span>
                  </div>
                </div>
              </template>
              <PlayerList :players="displayStatus.players" />

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
                        <UiTag :tone="mod.source === 'modrinth' ? 'success' : 'warning'" size="tiny">{{
                          mod.source
                        }}</UiTag>
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

              <div class="connect-room-actions">
                <UiButton variant="outline" icon="refresh" :loading="busy" @click="() => refreshStatus()">
                  {{ t('connect.players.refresh') }}
                </UiButton>
                <UiButton variant="danger" icon="logout" :loading="busy" @click="leave">
                  {{ t('connect.guest.leave') }}
                </UiButton>
              </div>
            </UiCard>
            <aside class="connect-side-panel">
              <UiCard class="connect-side-card">
                <template #header>
                  <div class="connect-card-heading">
                    <UiIcon name="info" :size="18" />
                    <div>
                      <strong>{{ t('connect.roomInfo.title') }}</strong>
                      <span>{{ t('connect.roomInfo.hint') }}</span>
                    </div>
                  </div>
                </template>
                <div class="connect-side-status">
                  <div class="connect-side-status-row">
                    <span>{{ t('connect.join.roomCode') }}</span>
                    <code>{{ displayStatus.roomCode }}</code>
                  </div>
                  <div class="connect-side-status-row">
                    <span>{{ t('connect.roomInfo.creator') }}</span>
                    <code>{{ hostName || t('connect.host.title') }}</code>
                  </div>
                  <div v-if="displayStatus.gameInfo" class="connect-side-status-row">
                    <span>{{ t('connect.roomInfo.game') }}</span>
                    <code>{{ displayStatus.gameInfo.gameVersion }}</code>
                  </div>
                  <div class="connect-side-status-row">
                    <span>{{ t('connect.guest.serverAddress') }}</span>
                    <code>{{ serverAddress }}</code>
                  </div>
                </div>
              </UiCard>
              <UiCard class="connect-side-card">
                <template #header>
                  <div class="connect-card-heading">
                    <UiIcon name="activity" :size="18" />
                    <div>
                      <strong>{{ t('connect.side.title') }}</strong>
                      <span>{{ t('connect.side.hint') }}</span>
                    </div>
                  </div>
                </template>
                <div class="connect-side-status">
                  <div class="connect-side-status-row">
                    <span>{{ t('connect.side.service') }}</span>
                    <UiTag :tone="easyTierTone" size="small">{{ easyTierPhaseText }}</UiTag>
                  </div>
                  <div class="connect-side-status-row">
                    <span>{{ t('connect.side.availability') }}</span>
                    <UiTag :tone="availabilityTone" size="small">{{ availabilityText }}</UiTag>
                  </div>
                </div>
              </UiCard>
            </aside>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PlayerList from '@/components/connect/PlayerList.vue'
import UiButton from '@/components/ui/Button.vue'
import UiCard from '@/components/ui/Card.vue'
import UiIcon from '@/components/ui/Icon.vue'
import UiInput from '@/components/ui/Input.vue'
import UiProgress from '@/components/ui/Progress.vue'
import UiSelect from '@/components/ui/Select.vue'
import UiTag from '@/components/ui/Tag.vue'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { useConnectFlowDebug } from '@/features/connect/composables/useConnectFlowDebug'
import { useConnector } from '@/features/connect/composables/useConnector'
import { instanceRuntimeApi } from '@/features/instances/api/instanceRuntimeApi'
import { instanceWorkspaceApi } from '@/features/instances/api/instanceWorkspaceApi'
import type { ConnectorMatchedInstance, GameInstance } from '@/types/api'
import { getErrorMessage } from '@/utils/error'

const { t } = useI18n()
type UiTagTone = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
const message = useLauncherMessage()
const hostStep = ref<1 | 2>(1)
const selectedInstanceKey = ref('')
const port = ref('25565')
const roomCode = ref('')
const launchingKey = ref('')
const runningInstances = ref<GameInstance[]>([])
let unsubscribeRunning: (() => void) | null = null

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
  scanPhase,
  detectedPort,
  hostPort,
  join,
  leave,
  kick,
  detectNat,
  downloadEasyTier,
  startPortScan,
  stopPortScan,
  refreshStatus,
  refreshMatches,
} = useConnector({ onError: (error) => message.error(error) })

const {
  flowDebug,
  debugStageIndex,
  stageOverride,
  debugStages,
  displayStatus,
  displayHostStep,
  displayDetectedPort,
  displayScanning,
  applyDebugStage,
  prevDebugStage,
  nextDebugStage,
  resetLiveStage,
  updateDebugStageIndexFromStatus,
  stageIndex,
} = useConnectFlowDebug({ status, hostStep, detectedPort, scanning })

const runningInstanceOptions = computed(() =>
  runningInstances.value.map((instance) => ({
    label: instance.name || instance.versionId,
    value: instance.id,
  }))
)

const selectedInstance = computed(
  () => runningInstances.value.find((instance) => instance.id === selectedInstanceKey.value) ?? null
)

async function loadRunningInstances(): Promise<void> {
  try {
    const all = await instanceRuntimeApi.list()
    runningInstances.value = all.filter((instance) => instance.isRunning)
  } catch {
    runningInstances.value = []
  }
}

const serviceReady = computed(() => availability.value === 'available' && Boolean(easyTier.value?.installed))
const isEasyTierWorking = computed(() =>
  ['resolving', 'downloading', 'extracting'].includes(easyTier.value?.status ?? '')
)
const easyTierPhaseText = computed(() => t(`connect.easyTier.${easyTier.value?.status ?? 'idle'}`))
const easyTierTone = computed<UiTagTone>(() => {
  const s = easyTier.value?.status
  if (!s || s === 'idle') return 'default'
  if (s === 'failed') return 'error'
  if (s === 'installed') return 'success'
  return 'info'
})
const availabilityTone = computed<UiTagTone>(() =>
  availability.value === 'available' ? 'success' : availability.value === 'checking' ? 'info' : 'error'
)
const availabilityText = computed(() =>
  availability.value === 'available'
    ? t('connect.nav.available')
    : availability.value === 'checking'
      ? t('connect.nav.checking')
      : t('connect.nav.unavailable')
)
const serverAddress = computed(
  () => `${displayStatus.value.mcHost || '127.0.0.1'}:${displayStatus.value.mcPort || 25565}`
)
const hostName = computed(() => displayStatus.value.players.find((p) => p.kind === 'host')?.name ?? '')

async function detectNatWithNotify(): Promise<void> {
  await detectNat()
  const result = natType.value
  if (!result) return
  const label = t(`connect.nat.${result.type}`)
  const address = result.publicIp ? `${result.publicIp}${result.publicPort ? `:${result.publicPort}` : ''}` : ''
  const content = address ? `${label} · ${address}` : label
  if (result.type === 'cone') message.success(content, { title: t('connect.nat.resultTitle') })
  else if (result.type === 'symmetric' || result.type === 'blocked')
    message.warning(content, { title: t('connect.nat.resultTitle') })
  else message.info(content, { title: t('connect.nat.resultTitle') })
}

function goToPortStep(): void {
  if (flowDebug.value) {
    applyDebugStage(stageIndex('create-port'))
    startPortScan()
    return
  }
  if (!selectedInstanceKey.value) {
    message.warning(t('connect.validation.instance'))
    return
  }
  hostStep.value = 2
  // 等待端口界面渲染完成后再开始嗅探，避免扫描状态先于界面显示
  void nextTick(() => startPortScan())
}

function quickCreate(instance: GameInstance): void {
  selectedInstanceKey.value = instance.id
  goToPortStep()
}

function goBackToInstanceStep(): void {
  if (flowDebug.value) {
    applyDebugStage(stageIndex('create-instance'))
    stopPortScan()
    return
  }
  hostStep.value = 1
  stopPortScan()
}

function goToManualPort(): void {
  if (flowDebug.value) {
    applyDebugStage(stageIndex('create-port'))
    stopPortScan()
    return
  }
  hostStep.value = 2
  // 进入端口界面后自动开始探测，避免直接显示「未检测到」的结论状态
  void nextTick(() => startPortScan())
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

async function joinRoom(): Promise<void> {
  const code = roomCode.value.trim()
  if (!code) {
    message.warning(t('connect.validation.roomCode'))
    return
  }
  await join(code)
}

async function pasteRoomCode(): Promise<void> {
  try {
    const text = await navigator.clipboard.readText()
    if (text) roomCode.value = text.trim()
  } catch {
    message.error(t('connect.validation.pasteFailed'))
  }
}

function clearRoomCode(): void {
  roomCode.value = ''
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

watch(
  () => status.value.mode,
  (mode) => {
    if (mode === 'idle') {
      hostStep.value = 1
      stopPortScan()
    }
    if (flowDebug.value) updateDebugStageIndexFromStatus()
  }
)

watch(
  () => flowDebug.value,
  (enabled) => {
    if (enabled) updateDebugStageIndexFromStatus()
    else {
      stageOverride.value = null
      debugStageIndex.value = 0
    }
  }
)

onMounted(() => {
  void loadRunningInstances()
  unsubscribeRunning = instanceRuntimeApi.onChanged(() => void loadRunningInstances())
})

onUnmounted(() => {
  unsubscribeRunning?.()
})
</script>

<style scoped src="@/styles/views/Connect.css"></style>
