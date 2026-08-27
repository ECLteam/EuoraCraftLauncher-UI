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
          <NSelect
            class="java-path-select"
            :value="localSettings.java_path"
            :options="javaOptions"
            :placeholder="t('settings.javaPathPlaceholder')"
            filterable
            @update:value="handleJavaPathChange"
          />
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
          <output
            class="memory-current-value"
            :class="{ 'is-auto': localSettings.memory_auto, 'is-over-recommended': isOverRecommended }"
          >
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
            <span>
              {{ formatMemory(maxMemory) }}
              <span class="memory-total-hint">({{ t('settings.systemMemory') }})</span>
            </span>
          </div>
          <div v-if="!localSettings.memory_auto" class="memory-recommended-hint">
            {{ t('settings.memoryRecommendedMax') }}: {{ formatMemory(recommendedMaxMemory) }}
            <span v-if="isOverRecommended" class="memory-over-recommended-text">
              — {{ t('settings.memoryOverRecommended') }}
            </span>
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
          <div v-if="systemMemoryError" class="memory-error-hint">
            无法读取真实内存信息，当前为默认占位值。请重启后端或检查控制台日志。
          </div>
        </div>
      </div>
    </SettingSection>

    <SettingSection :title="t('settings.runtime')">
      <SettingRow :label="t('settings.fullscreen')" :description="t('settings.fullscreenDesc')">
        <NSwitch :value="localSettings.fullscreen" @update:value="handleFullscreenToggle" />
      </SettingRow>
    </SettingSection>

    <PluginSlotHost slotId="plugin-slot-settings-game-section-after" class="plugin-slot-container" />
  </div>
</template>

<script setup lang="ts">
import { NButton, NSelect, NSwitch } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import PluginSlotHost from '@/features/plugins/slots/PluginSlotHost.vue'
import { settingsApi } from '@/features/settings/api/settingsApi'
import SettingRow from '@/features/settings/components/SettingRow.vue'
import SettingSection from '@/features/settings/components/SettingSection.vue'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'
import type { SystemMemoryInfo } from '@/types/config'
import type { JavaInstallation } from '@/types/instances'

type JavaInfo = JavaInstallation

const { t } = useI18n()
const message = useLauncherMessage()
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
const systemMemoryError = ref(false)

const javaAutoDesc = computed(() => {
  return localSettings.value.java_auto ? t('settings.javaSelectionAutoDesc') : t('settings.javaSelectionManualDesc')
})

const memoryAutoDesc = computed(() => {
  return localSettings.value.memory_auto
    ? t('settings.memoryAllocationAutoDesc')
    : t('settings.memoryAllocationManualDesc')
})

const maxMemory = computed(() => {
  return Math.max(systemMemory.value.totalMb, 2048)
})

const recommendedMaxMemory = computed(() => {
  const maxAlloc = Math.floor(systemMemory.value.totalMb * 0.8)
  return Math.max(maxAlloc, 2048)
})

const isOverRecommended = computed(() => {
  return safeMemorySize.value > recommendedMaxMemory.value
})

const autoMemorySize = computed(() => {
  const step = 256
  const raw = Math.round((systemMemory.value.totalMb * 0.25) / step) * step
  return Math.min(Math.max(raw, 2048), 8192)
})

const clampMemorySize = (value: number): number => {
  const min = 1024
  const max = maxMemory.value
  return Math.min(Math.max(value, min), max)
}

const sliderValuePosition = computed(() => {
  const min = 1024
  const max = maxMemory.value
  const range = max - min
  if (range <= 0) return 0
  const percent = ((safeMemorySize.value - min) / range) * 100
  return Math.min(Math.max(percent, 0), 100)
})

const safeMemorySize = computed({
  get: () => clampMemorySize(localSettings.value.memory_size ?? 1024),
  set: (value: number) => {
    localSettings.value.memory_size = clampMemorySize(value)
  },
})

const remainingMemory = computed(() => {
  return Math.max(0, systemMemory.value.totalMb - systemMemory.value.usedMb - safeMemorySize.value)
})

const memoryBarSegments = computed(() => {
  const total = systemMemory.value.totalMb || 1
  const usedPct = (systemMemory.value.usedMb / total) * 100
  const allocatedPct = (safeMemorySize.value / total) * 100
  const remainingPct = Math.max(0, 100 - usedPct - allocatedPct)
  if (usedPct + allocatedPct <= 100) {
    return {
      systemUsedPct: Math.round(usedPct),
      gameAllocatedPct: Math.round(allocatedPct),
      remainingPct: Math.round(remainingPct),
    }
  }
  // 分配值超过当前可用空间时按比例归一化，避免进度条溢出容器
  const scale = 100 / (usedPct + allocatedPct)
  return {
    systemUsedPct: Math.round(usedPct * scale),
    gameAllocatedPct: Math.round(allocatedPct * scale),
    remainingPct: 0,
  }
})

const javaOptions = computed(() => {
  const options = javaList.value.map((java) => ({
    value: java.path,
    label: `Java ${java.major_version} (${java.java_type}) · ${java.version} · ${java.arch}`,
  }))
  const selectedPath = localSettings.value.java_path
  if (selectedPath && !options.some((option) => option.value === selectedPath)) {
    options.unshift({ value: selectedPath, label: selectedPath })
  }
  return options
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

const loadSystemMemory = async () => {
  systemMemoryError.value = false
  const result = await run(async () => settingsApi.getSystemMemory())
  if (!result) {
    systemMemoryError.value = true
    console.error('[GameTab] 读取系统内存失败，将使用默认占位数据')
    return
  }
  systemMemory.value = result
  if (localSettings.value.memory_auto) {
    localSettings.value.memory_size = autoMemorySize.value
    saveConfig()
  } else if ((localSettings.value.memory_size ?? 1024) > maxMemory.value) {
    localSettings.value.memory_size = maxMemory.value
    saveConfig()
  }
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
    localSettings.value.memory_size = autoMemorySize.value
  }
  saveConfig()
}

const handleFullscreenToggle = (value: boolean) => {
  localSettings.value.fullscreen = value
  saveConfig()
}

const handleJavaPathChange = (path: string) => {
  localSettings.value.java_path = path
  saveConfig()
}

const browseJava = async () => {
  const path = await run(async () => settingsApi.selectJava())
  if (!path) return
  localSettings.value.java_path = path
  await saveConfig()
  message.success(t('common.success'))
}

onMounted(() => {
  loadJavaList()
  loadGameConfig().then(() => loadSystemMemory())
})

onUnmounted(() => {
  if (saveTimer) clearTimeout(saveTimer)
})
</script>

<style scoped src="@/styles/views/settings/GameTab.css"></style>
