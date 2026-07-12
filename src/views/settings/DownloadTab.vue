<template>
  <div class="tab-pane">
    <div class="settings-section">
      <div class="section-label">
        {{ t('settings.downloadSettings') }}
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">
            {{ t('settings.downloadSource') }}
          </div>
          <div class="setting-desc">
            {{ t('settings.downloadSourceDesc') }}
          </div>
        </div>
        <div class="setting-control">
          <div
            ref="selectRef"
            class="custom-select"
            :class="{ open: isOpen }"
          >
            <div
              class="select-trigger"
              @click="toggleOpen"
            >
              <span class="selected-text">{{ selectedDownloadSource?.label || t('common.select') }}</span>
              <UiIcon
                name="chevron-down"
                class="select-arrow"
                :class="{ rotated: isOpen }"
                :size="14"
              />
            </div>
            <Transition name="select-dropdown">
              <div
                v-show="isOpen"
                class="select-dropdown"
              >
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
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">
            {{ t('settings.downloadThreads') }}
          </div>
          <div class="setting-desc">
            {{ t('settings.downloadThreadsDesc') }}
          </div>
        </div>
        <div class="setting-control">
          <div class="slider-group">
            <input
              type="range"
              :value="localSettings.download_threads"
              min="1"
              max="16"
              step="1"
              class="slider-input"
              @change="handleThreadsChange"
            >
            <span class="slider-value">{{ localSettings.download_threads }} {{ t('settings.threads') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import UiIcon from '@/components/ui/Icon.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useClickOutside } from '@/composables/useClickOutside'

interface DownloadSettings {
  mirror_source?: string
  download_threads?: number
}

const props = defineProps<{
  settings: DownloadSettings
}>()

const emit = defineEmits<{
  (e: 'update:settings', value: DownloadSettings): void
}>()

const { t } = useI18n()
const { run } = useAsyncAction({ showSuccess: false, showError: true, errorMessage: t('common.error') })

const localSettings = reactive<DownloadSettings>({
  mirror_source: props.settings.mirror_source ?? '',
  download_threads: props.settings.download_threads,
})

// 监听外部 props 变化，同步到 localSettings
watch(() => props.settings, (newSettings) => {
  if (newSettings) {
    localSettings.mirror_source = newSettings.mirror_source ?? ''
    localSettings.download_threads = newSettings.download_threads
  }
}, { deep: true })

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)

const downloadOptions = computed(() => [
  { value: 'official' as const, label: t('settings.sourceOfficial'), desc: 'Minecraft Official' },
  { value: 'bmclapi' as const, label: 'BMCLAPI', desc: t('settings.sourceBmclapiDesc') },
])

const selectedDownloadSource = computed(() =>
  downloadOptions.value.find(o => o.value === localSettings.mirror_source)
)

const updateField = (field: keyof DownloadSettings, value: string | number) => {
  emit('update:settings', { ...props.settings, [field]: value })
}

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}

const handleDownloadSourceChange = async (value: 'official' | 'bmclapi') => {
  localSettings.mirror_source = value
  updateField('mirror_source', value)
  isOpen.value = false
  await run(async () => backend.config.set('download', {
    mirror_source: value,
    download_threads: localSettings.download_threads
  }))
}

const handleThreadsChange = async (e: Event) => {
  const val = parseInt((e.target as HTMLInputElement).value)
  localSettings.download_threads = val
  updateField('download_threads', val)
  await run(async () => backend.config.set('download', {
    mirror_source: localSettings.mirror_source,
    download_threads: val
  }))
}

useClickOutside(selectRef, () => { isOpen.value = false })
</script>

<style scoped src="@/styles/DownloadTab.css"></style>

