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

    </SettingSection>

    <div id="plugin-slot-settings-download-section-after" class="plugin-slot-container"></div>
  </div>
</template>

<script setup lang="ts">
import { NSelect } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
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
</script>

<style scoped src="@/styles/views/settings/DownloadTab.css"></style>
