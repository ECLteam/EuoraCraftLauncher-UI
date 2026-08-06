<template>
  <FullscreenModal
    v-model:visible="visible"
    :title="title"
    :showFooter="true"
    wrapperClass="version-detail-modal"
    bodyClass="version-detail-body"
  >
    <div class="vdm-shell">
      <header class="vdm-header ecl-surface">
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
          <SettingSection :title="t('versions.detail.versionInfo')">
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
          </SettingSection>

          <SettingSection :title="t('versions.detail.quickActions')">
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
          </SettingSection>
        </div>

        <div v-if="activeTab === 'mods'" class="vdm-page empty-page">
          <NEmpty :description="t('versions.detail.placeholder')" />
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

            <SettingSection :title="t('versions.detail.launchOptions')">
              <SettingRow :label="t('versions.detail.isolated')" :description="t('versions.detail.isolatedDesc')">
                <NSwitch v-model:value="versionSettings.isolated" />
              </SettingRow>
            </SettingSection>

            <SettingSection :title="t('versions.detail.memoryAllocation')">
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
            </SettingSection>

            <SettingSection :title="t('versions.detail.javaRuntime')">
              <SettingRow
                :label="t('versions.detail.customJava')"
                :description="t('versions.detail.customJavaDesc')"
              >
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
            </SettingSection>

            <SettingSection :title="t('versions.detail.jvmArgs')">
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
            </SettingSection>

            <SettingSection :title="t('versions.detail.gameArgs')">
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
            </SettingSection>
          </template>
        </div>

        <div v-if="activeTab === 'saves'" class="vdm-page empty-page">
          <NEmpty :description="t('versions.detail.placeholder')" />
        </div>
      </div>

      <div id="plugin-slot-version-detail-footer" class="plugin-slot-container"></div>
    </div>

    <template #footer>
      <div class="vdm-footer-status">
        <span v-if="activeTab === 'settings' && settingsDirty">{{ t('versions.detail.unsavedChanges') }}</span>
      </div>
      <NButton :disabled="settingsSaving" @click="visible = false">
        {{ t('common.close') }}
      </NButton>
      <NButton
        v-if="activeTab === 'settings'"
        type="primary"
        :loading="settingsSaving"
        :disabled="settingsLoading || !settingsDirty"
        @click="saveSettings"
      >
        {{ t('versions.detail.saveSettings') }}
      </NButton>
    </template>
  </FullscreenModal>
</template>

<script setup lang="ts">
import { NButton, NEmpty, NInput, NInputGroup, NInputNumber, NSpin, NSwitch } from 'naive-ui'
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { getVersionImage } from '@/config/version'
import SettingRow from '@/features/settings/components/SettingRow.vue'
import SettingSection from '@/features/settings/components/SettingSection.vue'
import { versionInstallApi } from '@/features/versions/api/versionInstallApi'
import { versionSettingsApi } from '@/features/versions/api/versionSettingsApi'
import { createDefaultVersionSettings, type VersionSettingsTarget } from '@/features/versions/model/versionSettings'
import type { ScannedVersion } from '@/types/api'
import { getLoaderIcon, getLoaderImage, getLoaderName } from '@/utils/loader'

interface Props {
  visible: boolean
  version: ScannedVersion | null
  initialTab?: DetailTab
}

type DetailTab = 'overview' | 'mods' | 'settings' | 'saves'

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
      activeTab.value = props.initialTab
      void loadSettings()
    }
  },
  { immediate: true }
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
