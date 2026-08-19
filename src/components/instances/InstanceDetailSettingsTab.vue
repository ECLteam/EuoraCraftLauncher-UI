<template>
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
        <SettingRow :label="t('versions.detail.customMemory')" :description="t('versions.detail.customMemoryDesc')">
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
            <NInput v-model:value="versionSettings.javaPath" :placeholder="t('versions.detail.javaPathPlaceholder')" />
            <NButton :loading="javaSelecting" @click="selectJava">
              {{ t('common.browse') }}
            </NButton>
          </NInputGroup>
        </SettingRow>
      </div>

      <div class="settings-subgroup">
        <div class="settings-subgroup__title">{{ t('versions.detail.jvmArgs') }}</div>
        <SettingRow :label="t('versions.detail.customJvmArgs')" :description="t('versions.detail.customJvmArgsDesc')">
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
        <SettingRow :label="t('versions.detail.customGameArgs')" :description="t('versions.detail.customGameArgsDesc')">
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
</template>

<script setup lang="ts">
import { NButton, NInput, NInputGroup, NInputNumber, NSpin, NSwitch } from 'naive-ui'
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { instanceSettingsApi } from '@/features/instances/api/instanceSettingsApi'
import { createDefaultVersionSettings, type VersionSettingsTarget } from '@/features/instances/model/instanceSettings'
import SettingRow from '@/features/settings/components/SettingRow.vue'
import SettingSection from '@/features/settings/components/SettingSection.vue'
import type { ScannedVersion } from '@/types/api'

defineOptions({ name: 'InstanceDetailSettingsTab' })

const props = defineProps<{
  version: ScannedVersion | null
  visible: boolean
}>()

const { t } = useI18n()
const message = useLauncherMessage()

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

// 打开时加载；关闭时 flush 挂起中的自动保存（复刻原父组件行为）
watch(
  () => props.visible,
  (val) => {
    if (val) void loadSettings()
    else flushSettingsSave()
  },
  { immediate: true }
)

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

// 切换到其他 tab / 组件卸载时，同样 flush 挂起中的自动保存
onBeforeUnmount(() => {
  if (settingsSaveTimer) clearTimeout(settingsSaveTimer)
  if (settingsDirty.value) void persistSettings()
})
</script>

<style scoped src="@/styles/views/instances/InstanceDetailModal.css"></style>
