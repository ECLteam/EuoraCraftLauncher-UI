<template>
  <div class="tab-pane">
    <SettingSection :title="t('settings.downloadSettings')">
      <SettingRow :label="t('settings.downloadSource')" :description="t('settings.downloadSourceDesc')">
        <template #default>
          <div ref="selectRef" class="custom-select" :class="{ open: isOpen }">
            <div class="select-trigger" @click="toggleOpen">
              <span class="selected-text">{{ selectedDownloadSource?.label || t('common.select') }}</span>
              <UiIcon name="chevron-down" class="select-arrow" :class="{ rotated: isOpen }" :size="14" />
            </div>
            <Transition name="select-dropdown">
              <div v-show="isOpen" class="select-dropdown">
                <div
                  v-for="option in downloadOptions"
                  :key="option.value"
                  class="select-option"
                  :class="{ active: localSettings.mirror_source === option.value }"
                  @click="handleDownloadSourceChange(option.value)"
                >
                  <div class="option-content">
                    <span class="option-label">{{ option.label }}</span>
                    <span class="option-desc">{{ option.desc }}</span>
                  </div>
                  <UiIcon
                    v-if="localSettings.mirror_source === option.value"
                    name="check"
                    :size="14"
                    class="check-icon"
                  />
                </div>
              </div>
            </Transition>
          </div>
        </template>
      </SettingRow>

      <SettingRow :label="t('settings.downloadThreads')" :description="t('settings.downloadThreadsDesc')">
        <template #default>
          <UiSlider
            v-model="localSettings.download_threads"
            :min="1"
            :max="16"
            :suffix="' ' + t('settings.threads')"
            @update:modelValue="handleThreadsChange"
          />
        </template>
      </SettingRow>
    </SettingSection>

    <div id="plugin-slot-settings-download-section-after" class="plugin-slot-container" />
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import UiSlider from '@/components/ui/Slider.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useClickOutside } from '@/composables/useClickOutside'
import { MIRROR_OPTIONS } from '@/config/version'
import SettingRow from '@/features/settings/components/SettingRow.vue'
import SettingSection from '@/features/settings/components/SettingSection.vue'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'

const { t } = useI18n()
const { run } = useAsyncAction({ showSuccess: false, showError: true, errorMessage: t('common.error') })
const settingsStore = useSettingsStore()
const { download: localSettings } = storeToRefs(settingsStore)

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)

const downloadOptions = computed(() =>
  MIRROR_OPTIONS.map((opt) => ({
    value: opt.value as 'official' | 'bmclapi',
    label: opt.label,
    desc: opt.desc,
  }))
)

const selectedDownloadSource = computed(() =>
  downloadOptions.value.find((o) => o.value === localSettings.value.mirror_source)
)

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}

const handleDownloadSourceChange = async (value: 'official' | 'bmclapi') => {
  isOpen.value = false
  await run(async () => settingsStore.patchDownload({ mirror_source: value }))
}

const handleThreadsChange = async (val: number) => {
  await run(async () => settingsStore.patchDownload({ download_threads: val }))
}

useClickOutside(selectRef, () => {
  isOpen.value = false
})
</script>

<style scoped src="@/styles/views/settings/DownloadTab.css"></style>
