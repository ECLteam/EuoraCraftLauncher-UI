<template>
  <FullscreenModal
    v-model:visible="visible"
    :title="title"
    :showFooter="true"
    wrapperClass="version-detail-modal"
    bodyClass="version-detail-body"
  >
    <div class="vdm-container">
      <!-- 左侧导航 -->
      <div class="vdm-nav">
        <div class="vdm-nav-header">
          <div class="vdm-version-badge">
            <UiIcon :name="getLoaderIcon(version?.primaryLoader || 'vanilla')" :size="20" />
            <span class="vdm-version-name">{{ version?.versionId || '...' }}</span>
          </div>
        </div>
        <div class="vdm-nav-list">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['vdm-nav-item', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <span class="nav-indicator" />
            <UiIcon :name="tab.icon" :size="17" />
            <span class="vdm-nav-label">{{ tab.label }}</span>
          </button>
        </div>
        <div id="plugin-slot-version-detail-tab" class="plugin-slot-container" />
      </div>

      <!-- 右侧内容 -->
      <div class="vdm-content">
        <!-- 总览 -->
        <div v-if="activeTab === 'overview'" class="vdm-tab">
          <div class="settings-section">
            <div class="section-label">{{ t('versions.detail.versionInfo') }}</div>
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
              <div class="info-item">
                <span class="info-label">{{ t('versions.detail.status') }}</span>
                <span :class="['badge', version?.isBroken ? 'badge-error' : 'badge-success']">
                  {{ version?.isBroken ? t('versions.detail.broken') : t('versions.detail.available') }}
                </span>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-label">{{ t('versions.detail.quickActions') }}</div>
            <div class="quick-actions">
              <button class="btn-action-card" @click="handleLaunch">
                <UiIcon name="play" :size="20" />
                <span>{{ t('versions.detail.launch') }}</span>
              </button>
              <button class="btn-action-card" @click="handleOpenFolder">
                <UiIcon name="folder" :size="20" />
                <span>{{ t('versions.detail.openFolder') }}</span>
              </button>
              <button class="btn-action-card" @click="handleDelete">
                <UiIcon name="trash" :size="20" />
                <span>{{ t('versions.detail.delete') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Mod 管理 -->
        <div v-if="activeTab === 'mods'" class="vdm-tab">
          <div class="settings-section">
            <div class="section-label">{{ t('versions.detail.mods') }}</div>
            <p class="placeholder-text">{{ t('versions.detail.placeholder') }}</p>
          </div>
        </div>

        <!-- 版本设置 -->
        <div v-if="activeTab === 'settings'" class="vdm-tab settings-tab">
          <div v-if="settingsLoading" class="settings-loading-state">
            <span class="settings-loading-spinner" />
            <span>{{ t('versions.detail.loadingSettings') }}</span>
          </div>
          <template v-else>
            <div class="settings-summary">
              <div class="settings-summary-copy">
                <strong>{{ t('versions.detail.settings') }}</strong>
                <span class="settings-summary-status">{{
                  isCustomized ? t('versions.detail.customizedSettings') : t('versions.detail.usingGlobalSettings')
                }}</span>
              </div>
              <button class="btn-reset-settings" :disabled="settingsSaving || !isCustomized" @click="resetSettings">
                {{ t('versions.detail.inheritGlobal') }}
              </button>
            </div>

            <div class="settings-section">
              <div class="section-label">{{ t('versions.detail.launchOptions') }}</div>
              <div class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">{{ t('versions.detail.isolated') }}</div>
                  <div class="setting-desc">{{ t('versions.detail.isolatedDesc') }}</div>
                </div>
                <div class="setting-control">
                  <button
                    :class="['toggle-switch', { active: versionSettings.isolated }]"
                    role="switch"
                    :aria-checked="versionSettings.isolated"
                    @click="versionSettings.isolated = !versionSettings.isolated"
                  >
                    <span class="toggle-knob" />
                  </button>
                </div>
              </div>
            </div>

            <div class="settings-section">
              <div class="section-label">{{ t('versions.detail.memoryAllocation') }}</div>
              <div class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">{{ t('versions.detail.customMemory') }}</div>
                  <div class="setting-desc">{{ t('versions.detail.customMemoryDesc') }}</div>
                </div>
                <div class="setting-control">
                  <button
                    :class="['toggle-switch', { active: versionSettings.customMemory }]"
                    role="switch"
                    :aria-checked="versionSettings.customMemory"
                    @click="versionSettings.customMemory = !versionSettings.customMemory"
                  >
                    <span class="toggle-knob" />
                  </button>
                </div>
              </div>
              <div v-if="versionSettings.customMemory" class="setting-item setting-detail">
                <div class="setting-info">
                  <div class="setting-label">{{ t('versions.detail.memorySize') }}</div>
                </div>
                <div class="setting-control">
                  <div class="number-input-wrap">
                    <input
                      v-model.number="versionSettings.memory"
                      type="number"
                      min="512"
                      max="65536"
                      step="256"
                      class="text-input memory-input"
                    />
                    <span class="input-suffix">MB</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="settings-section">
              <div class="section-label">{{ t('versions.detail.javaRuntime') }}</div>
              <div class="setting-item">
                <div class="setting-info">
                  <div class="setting-label">{{ t('versions.detail.customJava') }}</div>
                  <div class="setting-desc">{{ t('versions.detail.customJavaDesc') }}</div>
                </div>
                <div class="setting-control">
                  <button
                    :class="['toggle-switch', { active: versionSettings.customJava }]"
                    role="switch"
                    :aria-checked="versionSettings.customJava"
                    @click="versionSettings.customJava = !versionSettings.customJava"
                  >
                    <span class="toggle-knob" />
                  </button>
                </div>
              </div>
              <div v-if="versionSettings.customJava" class="setting-item setting-detail">
                <div class="setting-info">
                  <div class="setting-label">{{ t('versions.detail.javaPath') }}</div>
                </div>
                <div class="setting-control setting-control-wide">
                  <input
                    v-model="versionSettings.javaPath"
                    type="text"
                    class="text-input java-path-input"
                    :placeholder="t('versions.detail.javaPathPlaceholder')"
                  />
                  <button class="btn-ghost java-browse-btn" :disabled="javaSelecting" @click="selectJava">
                    {{ t('common.browse') }}
                  </button>
                </div>
              </div>
            </div>

            <div class="settings-section">
              <div class="section-label">{{ t('versions.detail.jvmArgs') }}</div>
              <div class="setting-item setting-item-copy">
                <div class="setting-info">
                  <div class="setting-label">{{ t('versions.detail.customJvmArgs') }}</div>
                  <div class="setting-desc">{{ t('versions.detail.customJvmArgsDesc') }}</div>
                </div>
              </div>
              <textarea
                v-model="versionSettings.jvmArgs"
                class="text-input args-textarea"
                :placeholder="t('versions.detail.jvmArgsPlaceholder')"
              />
            </div>

            <div class="settings-section">
              <div class="section-label">{{ t('versions.detail.gameArgs') }}</div>
              <div class="setting-item setting-item-copy">
                <div class="setting-info">
                  <div class="setting-label">{{ t('versions.detail.customGameArgs') }}</div>
                  <div class="setting-desc">{{ t('versions.detail.customGameArgsDesc') }}</div>
                </div>
              </div>
              <textarea
                v-model="versionSettings.gameArgs"
                class="text-input args-textarea"
                :placeholder="t('versions.detail.gameArgsPlaceholder')"
              />
            </div>
          </template>
        </div>

        <!-- 存档管理 -->
        <div v-if="activeTab === 'saves'" class="vdm-tab">
          <div class="settings-section">
            <div class="section-label">{{ t('versions.detail.saves') }}</div>
            <p class="placeholder-text">{{ t('versions.detail.placeholder') }}</p>
          </div>
        </div>
      </div>
    </div>

    <div id="plugin-slot-version-detail-footer" class="plugin-slot-container" />

    <template #footer>
      <div class="vdm-footer-status">
        <span v-if="activeTab === 'settings' && settingsDirty">{{ t('versions.detail.unsavedChanges') }}</span>
      </div>
      <UiButton variant="secondary" :disabled="settingsSaving" @click="visible = false">
        {{ t('common.close') }}
      </UiButton>
      <UiButton
        v-if="activeTab === 'settings'"
        variant="primary"
        :loading="settingsSaving"
        :disabled="settingsLoading || !settingsDirty"
        @click="saveSettings"
      >
        {{ t('versions.detail.saveSettings') }}
      </UiButton>
    </template>
  </FullscreenModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import UiButton from '@/components/ui/Button.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { versionInstallApi } from '@/features/versions/api/versionInstallApi'
import { versionSettingsApi } from '@/features/versions/api/versionSettingsApi'
import { createDefaultVersionSettings, type VersionSettingsTarget } from '@/features/versions/model/versionSettings'
import type { ScannedVersion } from '@/types/api'
import { getLoaderIcon, getLoaderName } from '@/utils/loader'

interface Props {
  visible: boolean
  version: ScannedVersion | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'launch', version: ScannedVersion): void
  (e: 'delete', version: ScannedVersion): void
}>()

const { t } = useI18n()
const message = useGlassMessage()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const title = computed(() => props.version?.versionId || '版本设置')

const activeTab = ref<'overview' | 'mods' | 'settings' | 'saves'>('overview')

const tabs = computed(() => [
  { id: 'overview' as const, icon: 'info', label: t('versions.detail.overview') },
  { id: 'mods' as const, icon: 'puzzle', label: t('versions.detail.mods') },
  { id: 'settings' as const, icon: 'settings', label: t('versions.detail.settings') },
  { id: 'saves' as const, icon: 'folder', label: t('versions.detail.saves') },
])

const versionSettings = reactive(createDefaultVersionSettings())
const settingsLoading = ref(false)
const settingsSaving = ref(false)
const javaSelecting = ref(false)
const savedSettingsSnapshot = ref(JSON.stringify(createDefaultVersionSettings()))
const settingsDirty = computed(() => JSON.stringify(versionSettings) !== savedSettingsSnapshot.value)
const isCustomized = computed(() => JSON.stringify(versionSettings) !== JSON.stringify(createDefaultVersionSettings()))

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
  const defaults = createDefaultVersionSettings()
  Object.assign(versionSettings, defaults)
  savedSettingsSnapshot.value = JSON.stringify(defaults)
  settingsLoading.value = true
  try {
    const settings = await versionSettingsApi.get(target)
    Object.assign(versionSettings, settings)
    savedSettingsSnapshot.value = JSON.stringify(settings)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.detail.loadSettingsFailed'))
  } finally {
    settingsLoading.value = false
  }
}

// 重置 activeTab 当弹窗打开时
watch(
  () => props.visible,
  (val) => {
    if (val) {
      activeTab.value = 'overview'
      void loadSettings()
    }
  }
)

async function saveSettings() {
  const target = getSettingsTarget()
  if (!target) return
  if (versionSettings.customMemory && (versionSettings.memory < 512 || versionSettings.memory > 65536)) {
    message.warning(t('versions.detail.invalidMemory'))
    return
  }
  if (versionSettings.customJava && !versionSettings.javaPath.trim()) {
    message.warning(t('versions.detail.javaPathRequired'))
    return
  }

  settingsSaving.value = true
  try {
    await versionSettingsApi.save(target, { ...versionSettings })
    savedSettingsSnapshot.value = JSON.stringify(versionSettings)
    message.success(t('versions.detail.settingsSaved'))
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.detail.saveSettingsFailed'))
  } finally {
    settingsSaving.value = false
  }
}

async function resetSettings() {
  const target = getSettingsTarget()
  if (!target) return
  settingsSaving.value = true
  try {
    await versionSettingsApi.reset(target)
    const defaults = createDefaultVersionSettings()
    Object.assign(versionSettings, defaults)
    savedSettingsSnapshot.value = JSON.stringify(defaults)
    message.success(t('versions.detail.settingsReset'))
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.detail.saveSettingsFailed'))
  } finally {
    settingsSaving.value = false
  }
}

async function selectJava() {
  javaSelecting.value = true
  try {
    const path = await versionSettingsApi.selectJava()
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
    void versionInstallApi.openFolder(props.version.path)
  }
}

function handleDelete() {
  if (props.version) {
    emit('delete', props.version)
    visible.value = false
  }
}
</script>

<style scoped src="@/styles/views/versions/VersionDetailModal.css"></style>
