<template>
  <div class="tab-pane launcher-settings">
    <SettingSection :title="t('settings.languageRegion')">
      <SettingRow :label="t('settings.language')" :description="t('settings.languageDesc')">
        <NSelect
          class="setting-select"
          :value="currentLocale"
          :options="languageOptions"
          @update:value="handleLanguageUpdate"
        />
      </SettingRow>
    </SettingSection>

    <SettingSection :title="t('settings.downloadSettings')">
      <SettingRow :label="t('settings.downloadSource')" :description="t('settings.downloadSourceDesc')">
        <NSelect
          class="setting-select"
          :value="downloadSettings.mirror_source"
          :options="downloadSourceOptions"
          @update:value="handleDownloadSourceChange"
        />
      </SettingRow>
    </SettingSection>

    <SettingSection :title="t('settings.instanceCompatibility')">
      <SettingRow :label="t('settings.qomicexInstanceIndex')" :description="t('settings.qomicexInstanceIndexDesc')">
        <div class="path-selector">
          <NInput
            :value="gameSettings.qomicex_instances_path || ''"
            :placeholder="t('settings.autoDetect')"
            clearable
            @update:value="handleQomicexPathChange"
          />
          <NButton size="small" @click="browseQomicexIndex">{{ t('common.browse') }}</NButton>
        </div>
      </SettingRow>
    </SettingSection>

    <SettingSection :title="t('settings.developer')">
      <SettingRow :label="t('settings.debugMode')" :description="t('settings.debugModeDesc')">
        <NSwitch :value="debugMode" @update:value="handleDebugModeChange" />
      </SettingRow>
      <SettingRow :label="t('settings.disableSslVerify')" :description="t('settings.disableSslVerifyDesc')">
        <NSwitch :value="disableSslVerify" @update:value="handleDisableSslVerifyChange" />
      </SettingRow>
      <SettingRow :label="t('settings.ignoreProxy')" :description="t('settings.ignoreProxyDesc')">
        <NSwitch :value="ignoreProxy" @update:value="handleIgnoreProxyChange" />
      </SettingRow>
    </SettingSection>

    <PluginSlotHost slotId="plugin-slot-settings-download-section-after" class="plugin-slot-container" />
    <PluginSlotHost slotId="plugin-slot-settings-general-section-after" class="plugin-slot-container" />
    <PluginSlotHost slotId="plugin-slot-settings-launcher-section-after" class="plugin-slot-container" />
  </div>
</template>

<script setup lang="ts">
import { NButton, NInput, NSelect, NSwitch } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useDebugMode } from '@/composables/useDebugMode'
import { MIRROR_OPTIONS } from '@/config/version'
import PluginSlotHost from '@/features/plugins/slots/PluginSlotHost.vue'
import SettingRow from '@/features/settings/components/SettingRow.vue'
import SettingSection from '@/features/settings/components/SettingSection.vue'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'
import { setLocale, supportedLocales, type LocaleCode } from '@/i18n'

const { t, locale } = useI18n()
const { run } = useAsyncAction({ showSuccess: false, showError: true, errorMessage: t('common.error') })
const settingsStore = useSettingsStore()
const { game: gameSettings, download: downloadSettings } = storeToRefs(settingsStore)
const { debugMode, setDebugMode } = useDebugMode()

const currentLocale = computed(() => locale.value as LocaleCode)
const disableSslVerify = computed(() => settingsStore.launcher.disable_ssl_verify === true)
const ignoreProxy = computed(() => settingsStore.launcher.ignore_proxy !== false)

const languageOptions = computed(() =>
  supportedLocales.map((language) => ({
    label: `${language.flag}  ${language.name}`,
    value: language.code,
  }))
)

const downloadSourceOptions = computed(() =>
  MIRROR_OPTIONS.map((option) => ({
    value: option.value as 'official' | 'bmclapi',
    label: option.label,
    desc: option.desc,
  }))
)

async function handleLanguageChange(languageCode: LocaleCode): Promise<void> {
  await setLocale(languageCode)
  await run(() => settingsStore.patchUi({ locale: languageCode }))
}

function handleLanguageUpdate(languageCode: string): void {
  void handleLanguageChange(languageCode as LocaleCode)
}

async function handleDownloadSourceChange(value: 'official' | 'bmclapi'): Promise<void> {
  await run(() => settingsStore.patchDownload({ mirror_source: value }))
}

async function handleQomicexPathChange(value: string): Promise<void> {
  await run(() => settingsStore.patchGame({ qomicex_instances_path: value }))
}

async function browseQomicexIndex(): Promise<void> {
  const response = await backend.command('select_file')
  if (!response.success || !response.data?.path) return
  await handleQomicexPathChange(response.data.path)
}

async function handleDebugModeChange(value: boolean): Promise<void> {
  await run(() => setDebugMode(value))
}

async function handleDisableSslVerifyChange(value: boolean): Promise<void> {
  await run(() => settingsStore.patchLauncher({ disable_ssl_verify: value }))
}

async function handleIgnoreProxyChange(value: boolean): Promise<void> {
  await run(() => settingsStore.patchLauncher({ ignore_proxy: value }))
}
</script>

<style scoped src="@/styles/views/settings/LauncherTab.css"></style>
