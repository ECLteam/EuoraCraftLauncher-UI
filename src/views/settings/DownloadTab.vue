<template>
  <div class="tab-pane">
    <SettingSection :title="t('settings.downloadSettings')">
      <SettingRow :label="t('settings.downloadSource')" :description="t('settings.downloadSourceDesc')">
        <template #default>
          <NSelect
            class="download-source-select"
            :value="localSettings.mirror_source"
            :options="downloadOptions"
            @update:value="handleDownloadSourceChange"
          />
        </template>
      </SettingRow>

      <SettingRow :label="t('settings.downloadThreads')" :description="t('settings.downloadThreadsDesc')">
        <template #default>
          <div class="threads-control">
            <NSlider
              :value="localSettings.download_threads"
              :min="1"
              :max="16"
              :tooltip="false"
              @update:value="handleThreadsChange"
            />
            <span>{{ localSettings.download_threads }} {{ t('settings.threads') }}</span>
          </div>
        </template>
      </SettingRow>
    </SettingSection>

    <div id="plugin-slot-settings-download-section-after" class="plugin-slot-container"></div>
  </div>
</template>

<script setup lang="ts">
import { NSelect, NSlider } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { MIRROR_OPTIONS } from '@/config/version'
import SettingRow from '@/features/settings/components/SettingRow.vue'
import SettingSection from '@/features/settings/components/SettingSection.vue'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'

const { t } = useI18n()
const { run } = useAsyncAction({ showSuccess: false, showError: true, errorMessage: t('common.error') })
const settingsStore = useSettingsStore()
const { download: localSettings } = storeToRefs(settingsStore)

const downloadOptions = computed(() =>
  MIRROR_OPTIONS.map((opt) => ({
    value: opt.value as 'official' | 'bmclapi',
    label: opt.label,
    desc: opt.desc,
  }))
)

const handleDownloadSourceChange = async (value: 'official' | 'bmclapi') => {
  await run(async () => settingsStore.patchDownload({ mirror_source: value }))
}

let threadsSaveTimer: ReturnType<typeof setTimeout> | null = null
const handleThreadsChange = (val: number) => {
  localSettings.value.download_threads = val
  if (threadsSaveTimer) clearTimeout(threadsSaveTimer)
  threadsSaveTimer = setTimeout(() => {
    void run(async () => settingsStore.patchDownload({ download_threads: val }))
  }, 400)
}

onUnmounted(() => {
  if (threadsSaveTimer) clearTimeout(threadsSaveTimer)
})
</script>

<style scoped src="@/styles/views/settings/DownloadTab.css"></style>
