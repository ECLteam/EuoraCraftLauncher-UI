<template>
  <div class="tab-pane">
    <div class="settings-section">
      <div class="section-label">{{ t('settings.downloadSettings') }}</div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.downloadSource') }}</div>
          <div class="setting-desc">{{ t('settings.downloadSourceDesc') }}</div>
        </div>
        <div class="setting-control">
          <div class="custom-select" :class="{ open: isOpen }" ref="selectRef">
            <div class="select-trigger" @click="toggleOpen">
              <span class="selected-text">{{ selectedDownloadSource?.label || t('common.select') }}</span>
              <UiIcon name="chevron-down" class="select-arrow" :class="{ rotated: isOpen }" :size="14" />
            </div>
            <transition name="select-dropdown">
              <div v-show="isOpen" class="select-dropdown">
                <div
                  v-for="option in downloadOptions"
                  :key="option.value"
                  class="select-option"
                  :class="{ active: currentSettings.downloadSource === option.value }"
                  @click="handleDownloadSourceChange(option.value)"
                >
                  <div class="option-content">
                    <span class="option-label">{{ option.label }}</span>
                    <span class="option-desc">{{ option.desc }}</span>
                  </div>
                  <UiIcon v-if="currentSettings.downloadSource === option.value" name="check" :size="14" class="check-icon" />
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.downloadThreads') }}</div>
          <div class="setting-desc">{{ t('settings.downloadThreadsDesc') }}</div>
        </div>
        <div class="setting-control">
          <div class="slider-group">
            <input
              type="range"
              :value="currentSettings.downloadThreads"
              min="1"
              max="16"
              step="1"
              @change="handleThreadsChange"
              class="slider-input"
            />
            <span class="slider-value">{{ currentSettings.downloadThreads }} {{ t('settings.threads') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { useClickOutside } from '@/composables/useClickOutside'
import UiIcon from '@/components/ui/Icon.vue'
import backend from '@/api/client'

const props = defineProps<{
  settings: any
}>()

const emit = defineEmits<{
  (e: 'update:settings', value: any): void
}>()

const { t } = useI18n()
const message = useGlassMessage()

const currentSettings = computed(() => ({
  downloadSource: props.settings?.downloadSource || 'official',
  downloadThreads: props.settings?.downloadThreads ?? 4
}))

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)

const downloadOptions = computed(() => [
  { value: 'official' as const, label: t('settings.sourceOfficial'), desc: 'Minecraft Official' },
  { value: 'bmclapi' as const, label: 'BMCLAPI', desc: t('settings.sourceBmclapiDesc') },
])

const selectedDownloadSource = computed(() =>
  downloadOptions.value.find(o => o.value === currentSettings.value.downloadSource)
)

const updateField = (field: string, value: any) => {
  emit('update:settings', { ...props.settings, [field]: value })
}

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}

const handleDownloadSourceChange = async (value: 'official' | 'bmclapi') => {
  updateField('downloadSource', value)
  isOpen.value = false
  try {
    await backend.config.set('download', {
      mirror_source: value,
      download_threads: currentSettings.value.downloadThreads
    })
  } catch (error) {
    message.error(t('common.error'))
  }
}

const handleThreadsChange = async (e: Event) => {
  const val = parseInt((e.target as HTMLInputElement).value)
  updateField('downloadThreads', val)
  try {
    await backend.config.set('download', {
      mirror_source: currentSettings.value.downloadSource,
      download_threads: val
    })
  } catch (error) {
    message.error(t('common.error'))
  }
}

useClickOutside(selectRef, () => { isOpen.value = false })
</script>

<style scoped>
.tab-pane {
  max-width: 600px;
}

.settings-section {
  margin-bottom: var(--s-2xl);
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--s-lg);
  padding-bottom: var(--s-sm);
  border-bottom: 1px solid var(--divider);
}

.setting-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--s-xl);
  margin-bottom: var(--s-xl);
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.setting-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.5;
}

.setting-control {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* 下拉选择 */
.custom-select {
  position: relative;
  width: 180px;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg-elevated);
  cursor: pointer;
  transition: border-color 150ms ease-out;
}

.select-trigger:hover {
  border-color: var(--border-hover);
}

.selected-text {
  font-size: 13px;
  color: var(--text-primary);
}

.select-arrow {
  color: var(--text-tertiary);
  transition: transform 150ms ease-out;
}

.select-arrow.rotated {
  transform: rotate(180deg);
}

.select-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  overflow: hidden;
  z-index: 100;
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  transition: background 150ms ease-out;
}

.select-option:hover {
  background: var(--bg-hover);
}

.select-option.active {
  color: var(--primary);
}

.option-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-label {
  font-size: 13px;
  font-weight: 500;
}

.option-desc {
  font-size: 11px;
  color: var(--text-tertiary);
}

.check-icon {
  color: var(--primary);
  flex-shrink: 0;
}

/* 滑块 */
.slider-group {
  display: flex;
  align-items: center;
  gap: var(--s-md);
}

.slider-input {
  width: 160px;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-base-alt);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid var(--bg-elevated);
  cursor: pointer;
  transition: transform 150ms ease-out;
}

.slider-input::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.slider-value {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  min-width: 40px;
  text-align: right;
}

.select-dropdown-enter-active,
.select-dropdown-leave-active {
  transition: all 150ms ease-out;
}

.select-dropdown-enter-from,
.select-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>