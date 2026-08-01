<template>
  <div class="tab-pane game-settings">
    <SettingSection :title="t('settings.javaSettings')">
      <SettingRow :label="t('settings.javaAuto')" :description="javaAutoDesc">
        <NSwitch :value="localSettings.java_auto" @update:value="handleJavaAutoToggle" />
      </SettingRow>

      <SettingRow
        v-if="!localSettings.java_auto"
        :label="t('settings.javaPath')"
        :description="t('settings.javaPathDesc')"
      >
        <div class="java-selector">
          <div ref="javaSelectRef" class="custom-select" :class="{ open: isJavaOpen }">
            <div class="select-trigger" @click="toggleJavaOpen">
              <span class="selected-text">{{ selectedJavaLabel || t('settings.javaPathPlaceholder') }}</span>
              <UiIcon name="chevron-down" class="select-arrow" :class="{ rotated: isJavaOpen }" :size="14" />
            </div>
            <Transition name="select-dropdown">
              <div v-show="isJavaOpen" class="select-dropdown">
                <div
                  v-for="java in javaList"
                  :key="java.path"
                  class="select-option"
                  :class="{ active: localSettings.java_path === java.path }"
                  @click="selectJava(java)"
                >
                  <div class="option-content">
                    <span class="option-label">Java {{ java.major_version }} ({{ java.java_type }})</span>
                    <span class="option-desc">{{ java.version }} - {{ java.arch }}</span>
                  </div>
                  <UiIcon v-if="localSettings.java_path === java.path" name="check" :size="14" class="check-icon" />
                </div>
              </div>
            </Transition>
          </div>
          <NButton size="small" @click="browseJava">
            {{ t('common.browse') }}
          </NButton>
        </div>
      </SettingRow>
    </SettingSection>

    <SettingSection :title="t('settings.memory')">
      <SettingRow :label="t('settings.memoryAuto')" :description="memoryAutoDesc">
        <NSwitch :value="localSettings.memory_auto" @update:value="handleMemoryAutoToggle" />
      </SettingRow>

      <div
        class="memory-manual-section"
        :class="{ 'is-auto': localSettings.memory_auto }"
        :style="{ '--memory-slider-progress': localSettings.memory_auto ? '0%' : sliderValuePosition + '%' }"
      >
        <div class="memory-header">
          <div class="memory-header-copy">
            <div class="memory-header-label">
              {{ t('settings.memorySize') }}
              <span v-if="localSettings.memory_auto" class="auto-badge">{{ t('settings.memoryAuto') }}</span>
            </div>
            <div class="memory-header-desc">
              {{ t('settings.memorySizeDesc') }}
            </div>
          </div>
          <output class="memory-current-value" :class="{ 'is-auto': localSettings.memory_auto }">
            {{ formatMemory(safeMemorySize) }}
          </output>
        </div>

        <div class="memory-slider-block">
          <input
            v-model.number="safeMemorySize"
            type="range"
            :disabled="localSettings.memory_auto"
            min="1024"
            :max="maxMemory"
            step="256"
            class="memory-slider-input"
            :aria-label="t('settings.memorySize')"
            :aria-valuetext="formatMemory(safeMemorySize)"
            @input="debouncedSaveConfig()"
          />
          <div class="memory-slider-scale">
            <span>1 GB</span>
            <span>{{ formatMemory(maxMemory) }}</span>
          </div>
        </div>

        <div class="memory-bar-wrapper">
          <div class="memory-bar-track">
            <div
              class="memory-bar-segment system-used"
              :style="{ width: memoryBarSegments.systemUsedPct + '%' }"
              :title="t('settings.memoryUsed') + ': ' + formatMemory(systemMemory.usedMb)"
            />
            <div
              class="memory-bar-segment game-allocated"
              :style="{ width: memoryBarSegments.gameAllocatedPct + '%' }"
              :title="t('settings.memoryAllocated') + ': ' + formatMemory(safeMemorySize)"
            />
            <div
              class="memory-bar-segment remaining"
              :style="{ width: memoryBarSegments.remainingPct + '%' }"
              :title="t('settings.memoryRemaining') + ': ' + formatMemory(remainingMemory)"
            />
          </div>
          <div class="memory-bar-legend">
            <span class="legend-item">
              <i class="system-used" />
              {{ t('settings.memoryUsed') }} {{ formatMemory(systemMemory.usedMb) }}
            </span>
            <span class="legend-item">
              <i class="game-allocated" />
              {{ t('settings.memoryAllocated') }} {{ formatMemory(safeMemorySize) }}
            </span>
            <span class="legend-item">
              <i class="remaining" />
              {{ t('settings.memoryRemaining') }} {{ formatMemory(remainingMemory) }}
            </span>
          </div>
        </div>
      </div>
    </SettingSection>

    <SettingSection :title="t('settings.runtime')">
      <SettingRow :label="t('settings.fullscreen')" :description="t('settings.fullscreenDesc')">
        <NSwitch :value="localSettings.fullscreen" @update:value="handleFullscreenToggle" />
      </SettingRow>
    </SettingSection>

    <div id="plugin-slot-settings-game-section-after" class="plugin-slot-container"></div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NSwitch } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useClickOutside } from '@/composables/useClickOutside'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { settingsApi } from '@/features/settings/api/settingsApi'
import SettingRow from '@/features/settings/components/SettingRow.vue'
import SettingSection from '@/features/settings/components/SettingSection.vue'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'
import type { JavaInstallation } from '@/types/api'

type JavaInfo = JavaInstallation

interface SystemMemoryInfo {
  totalMb: number
  usedMb: number
  freeMb: number
  percentUsed: number
}

const { t } = useI18n()
const message = useGlassMessage()
const { run } = useAsyncAction({ showSuccess: false, showError: true, errorMessage: t('common.error') })
const settingsStore = useSettingsStore()
const { game: localSettings } = storeToRefs(settingsStore)

const systemMemory = ref<SystemMemoryInfo>({
  totalMb: 16384,
  usedMb: 4096,
  freeMb: 12288,
  percentUsed: 25,
})

const javaList = ref<JavaInfo[]>([])
const isJavaOpen = ref(false)
const javaSelectRef = ref<HTMLElement | null>(null)

const javaAutoDesc = computed(() => {
  return localSettings.value.java_auto ? t('settings.javaSelectionAutoDesc') : t('settings.javaSelectionManualDesc')
})

const memoryAutoDesc = computed(() => {
  return localSettings.value.memory_auto
    ? t('settings.memoryAllocationAutoDesc')
    : t('settings.memoryAllocationManualDesc')
})

const maxMemory = computed(() => {
  const maxAlloc = Math.floor(systemMemory.value.totalMb * 0.8)
  return Math.max(maxAlloc, 2048)
})

const sliderValuePosition = computed(() => {
  const min = 1024
  const max = maxMemory.value
  const range = max - min
  if (range <= 0) return 0
  const percent = ((safeMemorySize.value - min) / range) * 100
  return Math.min(Math.max(percent, 0), 100)
})

const safeMemorySize = computed({
  get: () => localSettings.value.memory_size ?? 1024,
  set: (value: number) => {
    localSettings.value.memory_size = value
  },
})

const remainingMemory = computed(() => {
  return Math.max(0, systemMemory.value.totalMb - systemMemory.value.usedMb - safeMemorySize.value)
})

const memoryBarSegments = computed(() => {
  const total = systemMemory.value.totalMb || 1
  const usedPct = Math.round((systemMemory.value.usedMb / total) * 100)
  const allocatedPct = Math.round((safeMemorySize.value / total) * 100)
  const remainingPct = Math.max(0, 100 - usedPct - allocatedPct)
  return { systemUsedPct: usedPct, gameAllocatedPct: allocatedPct, remainingPct }
})

const selectedJavaLabel = computed(() => {
  if (!localSettings.value.java_path) return ''
  const java = javaList.value.find((j) => j.path === localSettings.value.java_path)
  if (!java) return localSettings.value.java_path
  return `Java ${java.major_version} (${java.java_type})`
})

const formatMemory = (mb: number): string => {
  if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB'
  return mb + ' MB'
}

const loadJavaList = async () => {
  const result = await run(async () => settingsApi.listJava())
  if (result) javaList.value = result
}

const loadGameConfig = async () => {
  await run(async () => settingsStore.load())
}

const saveConfig = async () => {
  const config = {
    java_auto: localSettings.value.java_auto,
    java_path: localSettings.value.java_path,
    memory_auto: localSettings.value.memory_auto,
    memory_size: localSettings.value.memory_size,
    fullscreen: localSettings.value.fullscreen,
  }
  await run(async () => settingsStore.patchGame(config))
}

/** 防抖保存：拖动滑块时延迟保存，避免高频请求 */
let saveTimer: ReturnType<typeof setTimeout> | null = null

function debouncedSaveConfig(delay = 300) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveConfig()
  }, delay)
}

const handleJavaAutoToggle = (value: boolean) => {
  localSettings.value.java_auto = value
  if (value) {
    localSettings.value.java_path = ''
  }
  saveConfig()
}

const handleMemoryAutoToggle = (value: boolean) => {
  localSettings.value.memory_auto = value
  if (value) {
    localSettings.value.memory_size = 4096
  }
  saveConfig()
}

const handleFullscreenToggle = (value: boolean) => {
  localSettings.value.fullscreen = value
  saveConfig()
}

const toggleJavaOpen = () => {
  isJavaOpen.value = !isJavaOpen.value
}

const selectJava = (java: JavaInfo) => {
  localSettings.value.java_path = java.path
  isJavaOpen.value = false
  saveConfig()
}

const browseJava = async () => {
  const path = await run(async () => settingsApi.selectJava())
  if (!path) return
  localSettings.value.java_path = path
  await saveConfig()
  message.success(t('common.success'))
}

useClickOutside(javaSelectRef, () => {
  isJavaOpen.value = false
})

onMounted(() => {
  loadJavaList()
  loadGameConfig()
})

onUnmounted(() => {
  if (saveTimer) clearTimeout(saveTimer)
})
</script>

<style scoped src="@/styles/views/settings/GameTab.css"></style>
