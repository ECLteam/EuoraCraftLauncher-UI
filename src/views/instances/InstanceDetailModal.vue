<template>
  <FullscreenModal
    v-model:visible="visible"
    :title="title"
    :showFooter="false"
    wrapperClass="version-detail-modal"
    bodyClass="version-detail-body"
  >
    <div class="vdm-shell">
      <header class="vdm-header">
        <div class="vdm-version-identity">
          <div class="vdm-version-icon" :class="{ 'has-image': Boolean(versionImage) }">
            <img v-if="versionImage" :src="versionImage" alt="" class="vdm-version-icon-img" />
            <UiIcon v-else :name="getLoaderIcon(version?.primaryLoader || 'vanilla')" :size="22" />
          </div>
          <div class="vdm-version-copy">
            <strong>{{ version?.versionId || '...' }}</strong>
            <span>{{ getLoaderName(version?.primaryLoader || 'vanilla') }}</span>
          </div>
        </div>

        <nav class="vdm-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['vdm-tab-button', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <UiIcon :name="tab.icon" :size="15" />
            <span>{{ tab.label }}</span>
          </button>
        </nav>
        <div id="plugin-slot-version-detail-tab" class="plugin-slot-container"></div>
      </header>

      <div class="vdm-content">
        <div v-if="activeTab === 'overview'" class="vdm-page overview-page">
          <div class="info-card">
            <div class="info-card__header">{{ t('versions.detail.versionInfo') }}</div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">{{ t('versions.detail.versionId') }}</span>
                <span class="info-value">{{ version?.versionId || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ t('versions.detail.loader') }}</span>
                <span class="info-value">{{ getLoaderName(version?.primaryLoader || 'vanilla') }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ t('versions.detail.vanillaVersion') }}</span>
                <span class="info-value">{{ version?.vanillaName || '-' }}</span>
              </div>
            </div>
          </div>

          <div class="info-card">
            <div class="info-card__header">{{ t('versions.detail.runStats') }}</div>
            <div v-if="statsLoading" class="settings-loading-state">
              <NSpin size="small" />
              <span>{{ t('versions.detail.loadingStats') }}</span>
            </div>
            <div v-else class="info-grid">
              <div class="info-item">
                <span class="info-label">{{ t('versions.detail.launchCount') }}</span>
                <span class="info-value">{{
                  t('versions.detail.launchCountValue', { count: runStats.launchCount })
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ t('versions.detail.lastRunDuration') }}</span>
                <span class="info-value">{{ formatRunDuration(runStats.lastRunDurationSeconds) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ t('versions.detail.totalRunDuration') }}</span>
                <span class="info-value">{{ formatRunDuration(runStats.totalRunDurationSeconds) }}</span>
              </div>
            </div>
          </div>

          <div class="actions-card">
            <div class="actions-card__header">{{ t('versions.detail.quickActions') }}</div>
            <div class="overview-actions">
              <NButton type="primary" secondary @click="handleLaunch">
                <template #icon><UiIcon name="play" :size="15" /></template>
                {{ t('versions.detail.launch') }}
              </NButton>
              <NButton secondary @click="handleOpenFolder">
                <template #icon><UiIcon name="folder" :size="15" /></template>
                {{ t('versions.detail.openFolder') }}
              </NButton>
              <NButton type="error" secondary @click="handleDelete">
                <template #icon><UiIcon name="trash" :size="15" /></template>
                {{ t('versions.detail.delete') }}
              </NButton>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'mods'" class="vdm-page mods-page">
          <div class="mods-panel">
            <div class="mods-panel-header">
              <div class="mods-panel-header-left">
                <div class="search-box">
                  <UiIcon name="search" :size="15" class="search-icon" />
                  <input
                    v-model="modSearchQuery"
                    type="text"
                    class="search-input"
                    :placeholder="t('versions.mods.searchPlaceholder')"
                  />
                  <button v-if="modSearchQuery" class="search-clear" type="button" @click="modSearchQuery = ''">
                    <UiIcon name="close" :size="14" />
                  </button>
                </div>
                <div class="mods-filter-tabs">
                  <button
                    v-for="f in modFilterOptions"
                    :key="f.value"
                    :class="['mods-filter-btn', { active: modFilter === f.value }]"
                    @click="modFilter = f.value"
                  >
                    {{ f.label }}
                  </button>
                </div>
              </div>
              <div class="mods-panel-header-right">
                <span v-if="filteredMods.length" class="mods-count">{{
                  t('versions.mods.count', { count: filteredMods.length })
                }}</span>
                <NButton size="tiny" secondary @click="handleOnlineSearch">
                  <template #icon><UiIcon name="search" :size="14" /></template>
                  {{ t('versions.mods.onlineSearch') }}
                </NButton>
                <NButton size="tiny" secondary @click="handleAddMod">
                  <template #icon><UiIcon name="add" :size="14" /></template>
                  {{ t('versions.mods.addMod') }}
                </NButton>
                <NButton size="tiny" secondary @click="handleOpenModsFolder">
                  <template #icon><UiIcon name="folder" :size="14" /></template>
                  {{ t('versions.mods.openFolder') }}
                </NButton>
              </div>
            </div>

            <div class="mods-panel-content">
              <NSpin :show="modsLoading" class="mods-spin">
                <template v-if="filteredMods.length">
                  <div class="mods-table">
                    <div class="table-header">
                      <span class="mcol-name">{{ t('versions.mods.modName') }}</span>
                      <span class="mcol-loader">{{ t('versions.mods.loader') }}</span>
                      <span class="mcol-version">{{ t('versions.mods.modVersion') }}</span>
                      <span class="mcol-author">{{ t('versions.mods.author') }}</span>
                      <span class="mcol-status">{{ t('versions.mods.enabled') }}</span>
                      <span class="mcol-actions" />
                    </div>
                    <div class="mods-table-body">
                      <div v-for="mod in filteredMods" :key="mod.filename" class="table-row">
                        <span class="mcol-name">
                          <span class="mod-name">{{ mod.name || mod.filename.replace(/\.(jar|disabled)$/, '') }}</span>
                          <span class="mod-filename">{{ mod.filename }}</span>
                        </span>
                        <span class="mcol-loader">
                          <span v-if="mod.loader_type" class="badge" :class="'badge-' + mod.loader_type.toLowerCase()">
                            {{ getLoaderName(mod.loader_type) }}
                          </span>
                          <span v-else class="badge badge-vanilla">{{ t('versions.manage.vanilla') }}</span>
                        </span>
                        <span class="mcol-version">
                          <span class="mod-version-text">{{ mod.version || '-' }}</span>
                        </span>
                        <span class="mcol-author">
                          <span class="mod-author-text">{{ mod.author || '-' }}</span>
                        </span>
                        <span class="mcol-status">
                          <NSwitch :value="mod.enabled" size="small" @update:value="handleToggleMod(mod)" />
                        </span>
                        <span class="mcol-actions">
                          <button
                            class="btn-action btn-delete"
                            :title="t('common.delete')"
                            @click="handleDeleteMod(mod)"
                          >
                            <UiIcon name="trash" :size="13" />
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>
                </template>
                <div v-else-if="!modsLoading" class="mods-empty empty-state">
                  <UiIcon name="puzzle" :size="36" class="empty-icon" />
                  <p class="empty-text">{{ t('versions.mods.noMods') }}</p>
                  <div class="empty-actions" style="display: flex; gap: 8px; margin-top: 4px">
                    <NButton size="small" secondary @click="handleAddMod">
                      <template #icon><UiIcon name="add" :size="14" /></template>
                      {{ t('versions.mods.addMod') }}
                    </NButton>
                    <NButton size="small" secondary @click="handleOnlineSearch">
                      <template #icon><UiIcon name="search" :size="14" /></template>
                      {{ t('versions.mods.onlineSearch') }}
                    </NButton>
                  </div>
                </div>
              </NSpin>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'online-mods'" class="vdm-page online-mods-page">
          <OnlineModSearch :instance="version" @installed="loadMods" />
        </div>

        <div v-if="activeTab === 'settings'" class="vdm-page version-settings-page">
          <div v-if="settingsLoading" class="settings-loading-state">
            <NSpin size="small" />
            <span>{{ t('versions.detail.loadingSettings') }}</span>
          </div>
          <template v-else>
            <div class="settings-summary">
              <div class="settings-summary-copy">
                <strong>{{
                  isCustomized ? t('versions.detail.customizedSettings') : t('versions.detail.usingGlobalSettings')
                }}</strong>
                <span>{{ t('versions.detail.settings') }} · {{ version?.versionId || '-' }}</span>
              </div>
              <NButton
                size="small"
                secondary
                :disabled="settingsSaving || !isCustomized"
                :loading="settingsSaving"
                @click="resetSettings"
              >
                {{ t('versions.detail.inheritGlobal') }}
              </NButton>
            </div>

            <SettingSection :title="t('versions.detail.launchConfig')">
              <div class="settings-subgroup">
                <div class="settings-subgroup__title">{{ t('versions.detail.launchOptions') }}</div>
                <SettingRow :label="t('versions.detail.isolated')" :description="t('versions.detail.isolatedDesc')">
                  <NSwitch v-model:value="versionSettings.isolated" />
                </SettingRow>
              </div>

              <div class="settings-subgroup">
                <div class="settings-subgroup__title">{{ t('versions.detail.memoryAllocation') }}</div>
                <SettingRow
                  :label="t('versions.detail.customMemory')"
                  :description="t('versions.detail.customMemoryDesc')"
                >
                  <NSwitch v-model:value="versionSettings.customMemory" />
                </SettingRow>
                <SettingRow v-if="versionSettings.customMemory" :label="t('versions.detail.memorySize')">
                  <NInputNumber
                    v-model:value="versionSettings.memory"
                    class="memory-number-input"
                    :min="512"
                    :max="65536"
                    :step="256"
                    :showButton="false"
                  >
                    <template #suffix>MB</template>
                  </NInputNumber>
                </SettingRow>
              </div>

              <div class="settings-subgroup">
                <div class="settings-subgroup__title">{{ t('versions.detail.javaRuntime') }}</div>
                <SettingRow :label="t('versions.detail.customJava')" :description="t('versions.detail.customJavaDesc')">
                  <NSwitch v-model:value="versionSettings.customJava" />
                </SettingRow>
                <SettingRow v-if="versionSettings.customJava" :label="t('versions.detail.javaPath')">
                  <NInputGroup class="java-path-control">
                    <NInput
                      v-model:value="versionSettings.javaPath"
                      :placeholder="t('versions.detail.javaPathPlaceholder')"
                    />
                    <NButton :loading="javaSelecting" @click="selectJava">
                      {{ t('common.browse') }}
                    </NButton>
                  </NInputGroup>
                </SettingRow>
              </div>

              <div class="settings-subgroup">
                <div class="settings-subgroup__title">{{ t('versions.detail.jvmArgs') }}</div>
                <SettingRow
                  :label="t('versions.detail.customJvmArgs')"
                  :description="t('versions.detail.customJvmArgsDesc')"
                >
                  <NInput
                    v-model:value="versionSettings.jvmArgs"
                    class="argument-input"
                    type="textarea"
                    :autosize="{ minRows: 2, maxRows: 5 }"
                    :placeholder="t('versions.detail.jvmArgsPlaceholder')"
                  />
                </SettingRow>
              </div>

              <div class="settings-subgroup">
                <div class="settings-subgroup__title">{{ t('versions.detail.gameArgs') }}</div>
                <SettingRow
                  :label="t('versions.detail.customGameArgs')"
                  :description="t('versions.detail.customGameArgsDesc')"
                >
                  <NInput
                    v-model:value="versionSettings.gameArgs"
                    class="argument-input"
                    type="textarea"
                    :autosize="{ minRows: 2, maxRows: 5 }"
                    :placeholder="t('versions.detail.gameArgsPlaceholder')"
                  />
                </SettingRow>
              </div>
            </SettingSection>
          </template>
        </div>

        <div v-if="activeTab === 'saves'" class="vdm-page empty-page">
          <NEmpty :description="t('versions.detail.placeholder')" />
        </div>
      </div>

      <div id="plugin-slot-version-detail-footer" class="plugin-slot-container"></div>
    </div>
  </FullscreenModal>
</template>

<script setup lang="ts">
import { NButton, NEmpty, NInput, NInputGroup, NInputNumber, NSpin, NSwitch, useDialog } from 'naive-ui'
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import OnlineModSearch from '@/components/mods/OnlineModSearch.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { getVersionImage } from '@/config/version'
import { instanceInstallApi } from '@/features/instances/api/instanceInstallApi'
import { instanceRuntimeApi } from '@/features/instances/api/instanceRuntimeApi'
import { instanceSettingsApi } from '@/features/instances/api/instanceSettingsApi'
import { localModsApi } from '@/features/instances/api/localModsApi'
import { createDefaultVersionSettings, type VersionSettingsTarget } from '@/features/instances/model/instanceSettings'
import { formatRunDuration } from '@/features/instances/model/versionStats'
import SettingRow from '@/features/settings/components/SettingRow.vue'
import SettingSection from '@/features/settings/components/SettingSection.vue'
import type { ModItem, ScannedVersion, VersionRunStats } from '@/types/api'
import { getLoaderIcon, getLoaderImage, getLoaderName } from '@/utils/loader'

interface Props {
  visible: boolean
  version: ScannedVersion | null
  initialTab?: DetailTab
}

type DetailTab = 'overview' | 'mods' | 'online-mods' | 'settings' | 'saves'

const props = withDefaults(defineProps<Props>(), {
  initialTab: 'overview',
})
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'launch', version: ScannedVersion): void
  (e: 'delete', version: ScannedVersion): void
}>()

const { t } = useI18n()
const message = useGlassMessage()
const dialog = useDialog()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const title = computed(() => props.version?.versionId || t('versions.detail.settings'))

const versionImage = computed(() => {
  const version = props.version
  if (!version) return ''
  if (version.hasOptiFine) return getLoaderImage('optifine')
  return getLoaderImage(version.primaryLoader) || getVersionImage(version.versionType)
})

const activeTab = ref<DetailTab>('overview')
const runStats = reactive<VersionRunStats>({
  launchCount: 0,
  lastRunDurationSeconds: 0,
  totalRunDurationSeconds: 0,
})
const statsLoading = ref(false)
let statsRequestId = 0

const tabs = computed(() => [
  { id: 'overview' as const, icon: 'info', label: t('versions.detail.overview') },
  { id: 'mods' as const, icon: 'puzzle', label: t('versions.detail.mods') },
  { id: 'online-mods' as const, icon: 'cloud-download', label: t('versions.detail.onlineMods') },
  { id: 'settings' as const, icon: 'settings', label: t('versions.detail.settings') },
  { id: 'saves' as const, icon: 'folder', label: t('versions.detail.saves') },
])

// ======================== 模组管理 ========================

const mods = ref<ModItem[]>([])
const modsLoading = ref(false)
const modSearchQuery = ref('')
const modFilter = ref<'all' | 'enabled' | 'disabled'>('all')

const modFilterOptions = computed(() => [
  { label: t('versions.mods.filterAll'), value: 'all' as const },
  { label: t('versions.mods.filterEnabled'), value: 'enabled' as const },
  { label: t('versions.mods.filterDisabled'), value: 'disabled' as const },
])

const filteredMods = computed(() => {
  let list = mods.value
  // 筛选
  if (modFilter.value === 'enabled') list = list.filter((m) => m.enabled)
  else if (modFilter.value === 'disabled') list = list.filter((m) => !m.enabled)
  // 搜索
  const q = modSearchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((m) => m.filename.toLowerCase().includes(q) || (m.name && m.name.toLowerCase().includes(q)))
  }
  return list
})

function getGamePath(): string | null {
  return props.version?.path || props.version?.jsonPath || null
}

async function loadRunStats() {
  const version = props.version
  const gamePath = getGamePath()
  if (!version || !gamePath) return
  const requestId = ++statsRequestId
  statsLoading.value = true
  try {
    const stats = await instanceRuntimeApi.getStats(gamePath, version.versionId || version.id)
    if (requestId === statsRequestId) Object.assign(runStats, stats)
  } catch (error) {
    if (requestId === statsRequestId) {
      Object.assign(runStats, { launchCount: 0, lastRunDurationSeconds: 0, totalRunDurationSeconds: 0 })
      message.error(error instanceof Error ? error.message : t('versions.detail.loadStatsFailed'))
    }
  } finally {
    if (requestId === statsRequestId) statsLoading.value = false
  }
}

async function loadMods() {
  const gamePath = getGamePath()
  if (!gamePath) return
  modsLoading.value = true
  try {
    mods.value = await localModsApi.list(gamePath)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.modAddFailed'))
  } finally {
    modsLoading.value = false
  }
}

async function handleToggleMod(mod: ModItem) {
  const gamePath = getGamePath()
  if (!gamePath) return
  try {
    const result = await localModsApi.toggle(gamePath, mod.filename)
    mod.enabled = result.enabled
    const actionText = result.enabled ? t('versions.mods.toggleEnabled') : t('versions.mods.toggleDisabled')
    message.success(t('versions.mods.modToggled', { name: mod.name || mod.filename, action: actionText }))
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.modToggleFailed'))
  }
}

function handleDeleteMod(mod: ModItem) {
  const d = dialog.warning({
    title: t('common.delete'),
    content: t('versions.mods.deleteConfirm', { name: mod.name || mod.filename }),
    positiveText: t('common.confirm'),
    negativeText: t('common.cancel'),
    onPositiveClick: async () => {
      d.loading = true
      const gamePath = getGamePath()
      if (!gamePath) return
      try {
        await localModsApi.remove(gamePath, mod.filename)
        mods.value = mods.value.filter((m) => m.filename !== mod.filename)
        message.success(t('versions.mods.modDeleted'))
      } catch (error) {
        message.error(error instanceof Error ? error.message : t('versions.mods.modDeleteFailed'))
      }
    },
  })
}

async function handleAddMod() {
  const gamePath = getGamePath()
  if (!gamePath) return
  try {
    const result = await backend.command('select_file')
    if (!result.success || !result.data?.path) return
    await localModsApi.add(gamePath, result.data.path)
    message.success(t('versions.mods.modAdded'))
    await loadMods()
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.modAddFailed'))
  }
}

async function handleOpenModsFolder() {
  const gamePath = getGamePath()
  if (!gamePath) return
  try {
    await localModsApi.openFolder(gamePath)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.modAddFailed'))
  }
}

function handleOnlineSearch() {
  activeTab.value = 'online-mods'
}

// ======================== 版本设置 ========================

const versionSettings = reactive(createDefaultVersionSettings())
const settingsLoading = ref(false)
const settingsSaving = ref(false)
const javaSelecting = ref(false)
const savedSettingsSnapshot = ref(JSON.stringify(createDefaultVersionSettings()))
const settingsDirty = computed(() => JSON.stringify(versionSettings) !== savedSettingsSnapshot.value)
const isCustomized = computed(() => JSON.stringify(versionSettings) !== JSON.stringify(createDefaultVersionSettings()))

/** 加载/重置阶段跳过自动保存 watch */
let skipSettingsWatch = false
/** 300ms 防抖定时器（参考 GameTab.vue 的 debouncedSaveConfig） */
let settingsSaveTimer: ReturnType<typeof setTimeout> | null = null
/** 保存串行化：保存中再有新变更则排队重存，避免 API 读-改-写竞态 */
let resaveQueued = false

function getSettingsTarget(): VersionSettingsTarget | null {
  if (!props.version) return null
  return {
    versionId: props.version.versionId || props.version.id,
    path: props.version.path || props.version.jsonPath || '',
  }
}

async function loadSettings() {
  const target = getSettingsTarget()
  if (!target) return
  skipSettingsWatch = true
  const defaults = createDefaultVersionSettings()
  Object.assign(versionSettings, defaults)
  savedSettingsSnapshot.value = JSON.stringify(defaults)
  settingsLoading.value = true
  try {
    const settings = await instanceSettingsApi.get(target)
    Object.assign(versionSettings, settings)
    savedSettingsSnapshot.value = JSON.stringify(settings)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.detail.loadSettingsFailed'))
  } finally {
    settingsLoading.value = false
    await nextTick()
    skipSettingsWatch = false
  }
}

// 重置 activeTab 当弹窗打开时；关闭时 flush 挂起中的自动保存
watch(
  () => props.visible,
  (val) => {
    if (val) {
      activeTab.value = props.initialTab
      void loadSettings()
      void loadMods()
      void loadRunStats()
    } else {
      flushSettingsSave()
    }
  },
  { immediate: true }
)

const stopStatsListening = instanceRuntimeApi.onChanged((payload) => {
  const version = props.version
  if (
    props.visible &&
    version &&
    payload.versionId === (version.versionId || version.id) &&
    payload.gamePath === getGamePath()
  ) {
    void loadRunStats()
  }
})

onBeforeUnmount(() => {
  statsRequestId += 1
  stopStatsListening()
  if (settingsSaveTimer) clearTimeout(settingsSaveTimer)
})

function validateSettings(): string | null {
  if (versionSettings.customMemory && (versionSettings.memory < 512 || versionSettings.memory > 65536)) {
    return t('versions.detail.invalidMemory')
  }
  if (versionSettings.customJava && !versionSettings.javaPath.trim()) {
    return t('versions.detail.javaPathRequired')
  }
  return null
}

async function persistSettings() {
  if (settingsSaving.value) {
    resaveQueued = true
    return
  }
  const target = getSettingsTarget()
  if (!target) return
  const invalid = validateSettings()
  if (invalid) {
    message.warning(invalid)
    return
  }
  settingsSaving.value = true
  try {
    await instanceSettingsApi.save(target, { ...versionSettings })
    savedSettingsSnapshot.value = JSON.stringify(versionSettings)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.detail.saveSettingsFailed'))
  } finally {
    settingsSaving.value = false
    if (resaveQueued) {
      resaveQueued = false
      void persistSettings()
    }
  }
}

/** 修改即自动保存：300ms 防抖（参考 GameTab.vue） */
function scheduleSettingsSave(delay = 300) {
  if (settingsSaveTimer) clearTimeout(settingsSaveTimer)
  settingsSaveTimer = setTimeout(() => {
    settingsSaveTimer = null
    void persistSettings()
  }, delay)
}

/** 关闭弹窗时立即落盘（flush），丢弃未决定时器 */
function flushSettingsSave() {
  if (settingsSaveTimer) {
    clearTimeout(settingsSaveTimer)
    settingsSaveTimer = null
  }
  if (settingsDirty.value) void persistSettings()
}

// deep watch：用户修改自动触发保存；加载/重置阶段用 skipSettingsWatch 跳过
watch(
  versionSettings,
  () => {
    if (skipSettingsWatch) return
    scheduleSettingsSave()
  },
  { deep: true }
)

async function resetSettings() {
  const target = getSettingsTarget()
  if (!target) return
  settingsSaving.value = true
  try {
    await instanceSettingsApi.reset(target)
    skipSettingsWatch = true
    const defaults = createDefaultVersionSettings()
    Object.assign(versionSettings, defaults)
    savedSettingsSnapshot.value = JSON.stringify(defaults)
    message.success(t('versions.detail.settingsReset'))
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.detail.saveSettingsFailed'))
  } finally {
    settingsSaving.value = false
    await nextTick()
    skipSettingsWatch = false
  }
}

async function selectJava() {
  javaSelecting.value = true
  try {
    const path = await instanceSettingsApi.selectJava()
    if (path) versionSettings.javaPath = path
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.detail.javaSelectFailed'))
  } finally {
    javaSelecting.value = false
  }
}

function handleLaunch() {
  if (props.version) {
    emit('launch', props.version)
    visible.value = false
  }
}

function handleOpenFolder() {
  if (props.version?.path) {
    void instanceInstallApi.openFolder(props.version.path)
  }
}

function handleDelete() {
  if (props.version) {
    emit('delete', props.version)
    visible.value = false
  }
}
</script>

<style scoped src="@/styles/views/instances/InstanceDetailModal.css"></style>
