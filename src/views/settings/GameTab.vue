<template>
  <div class="tab-pane">
    <!-- Java 运行时 -->
    <div class="settings-section">
      <div class="section-label">
        {{ t('settings.javaSettings') }}
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">
            {{ t('settings.javaAuto') }}
          </div>
          <div class="setting-desc">
            {{ javaAutoDesc }}
          </div>
        </div>
        <div class="setting-control">
          <button
            :class="['toggle-switch', { active: localSettings.java_auto }]"
            role="switch"
            :aria-checked="localSettings.java_auto"
            @click="handleJavaAutoToggle"
          >
            <span class="toggle-knob" />
          </button>
        </div>
      </div>

      <div
        v-if="!localSettings.java_auto"
        class="setting-item"
      >
        <div class="setting-info">
          <div class="setting-label">
            {{ t('settings.javaPath') }}
          </div>
          <div class="setting-desc">
            {{ t('settings.javaPathDesc') }}
          </div>
        </div>
        <div class="setting-control">
          <div class="java-selector">
            <div
              ref="javaSelectRef"
              class="custom-select"
              :class="{ open: isJavaOpen }"
            >
              <div
                class="select-trigger"
                @click="toggleJavaOpen"
              >
                <span class="selected-text">{{ selectedJavaLabel || t('settings.javaPathPlaceholder') }}</span>
                <UiIcon
                  name="chevron-down"
                  class="select-arrow"
                  :class="{ rotated: isJavaOpen }"
                  :size="14"
                />
              </div>
              <Transition name="select-dropdown">
                <div
                  v-show="isJavaOpen"
                  class="select-dropdown"
                >
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
                    <UiIcon
                      v-if="localSettings.java_path === java.path"
                      name="check"
                      :size="14"
                      class="check-icon"
                    />
                  </div>
                </div>
              </Transition>
            </div>
            <button
              class="btn-ghost"
              @click="browseJava"
            >
              {{ t('common.browse') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 内存分配 -->
    <div class="settings-section">
      <div class="section-label">
        {{ t('settings.memory') }}
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">
            {{ t('settings.memoryAuto') }}
          </div>
          <div class="setting-desc">
            {{ memoryAutoDesc }}
          </div>
        </div>
        <div class="setting-control">
          <button
            :class="['toggle-switch', { active: localSettings.memory_auto }]"
            role="switch"
            :aria-checked="localSettings.memory_auto"
            @click="handleMemoryAutoToggle"
          >
            <span class="toggle-knob" />
          </button>
        </div>
      </div>

      <div
        v-if="!localSettings.memory_auto"
        class="memory-manual-section"
      >
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">
              {{ t('settings.memorySize') }}
            </div>
            <div class="setting-desc">
              {{ t('settings.memorySizeDesc') }}
            </div>
          </div>
          <div class="setting-control">
            <span class="memory-value">{{ formatMemory(localSettings.memory_size) }}</span>
          </div>
        </div>

        <div class="memory-visualization">
          <div class="memory-bar-container">
            <div class="memory-bar">
              <div
                class="memory-segment memory-used"
                :style="{ width: usedPercent + '%' }"
              />
              <div
                class="memory-segment memory-game"
                :style="{ width: gamePercent + '%' }"
              />
            </div>
            <div class="memory-labels">
              <span>0 MB</span>
              <span>{{ formatMemory(systemMemory.totalMb / 2) }}</span>
              <span>{{ formatMemory(systemMemory.totalMb) }}</span>
            </div>
          </div>

          <div class="slider-wrapper">
            <input
              v-model.number="localSettings.memory_size"
              type="range"
              min="1024"
              :max="maxMemory"
              step="256"
              class="slider-input"
              @change="debouncedSaveConfig"
            >
          </div>

          <div class="memory-stats">
            <div class="memory-stat-item">
              <span class="stat-dot memory-used-dot" />
              <span class="stat-label">{{ t('settings.memoryUsed') }}:</span>
              <span class="stat-value">{{ formatMemory(systemMemory.usedMb) }} ({{ systemMemory.percentUsed }}%)</span>
            </div>
            <div class="memory-stat-item">
              <span class="stat-dot memory-game-dot" />
              <span class="stat-label">{{ t('settings.memoryAllocated') }}:</span>
              <span class="stat-value highlight">{{ formatMemory(localSettings.memory_size) }}</span>
            </div>
            <div class="memory-stat-item">
              <span class="stat-dot memory-remaining-dot" />
              <span class="stat-label">{{ t('settings.memoryRemaining') }}:</span>
              <span class="stat-value">{{ formatMemory(remainingMemory) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 启动选项 -->
    <div class="settings-section">
      <div class="section-label">
        {{ t('settings.runtime') }}
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">
            {{ t('settings.fullscreen') }}
          </div>
          <div class="setting-desc">
            {{ t('settings.fullscreenDesc') }}
          </div>
        </div>
        <div class="setting-control">
          <button
            :class="['toggle-switch', { active: localSettings.fullscreen }]"
            role="switch"
            :aria-checked="localSettings.fullscreen"
            @click="handleFullscreenToggle"
          >
            <span class="toggle-knob" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import UiIcon from '@/components/ui/Icon.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useClickOutside } from '@/composables/useClickOutside'
import { useGlassMessage } from '@/composables/useGlassMessage'

interface JavaInfo {
  path: string
  version: string
  major_version: number
  java_type: string
  arch: string
}

interface SystemMemoryInfo {
  totalMb: number
  usedMb: number
  freeMb: number
  percentUsed: number
}

interface GameSettings {
  java_auto?: boolean
  java_path?: string
  memory_auto?: boolean
  memory_size?: number
  fullscreen?: boolean
}

const props = defineProps<{
  settings: GameSettings
}>()

const emit = defineEmits<{
  (e: 'update:settings', value: GameSettings): void
}>()

const { t } = useI18n()
const message = useGlassMessage()
const { run } = useAsyncAction({ showSuccess: false, showError: true, errorMessage: t('common.error') })

const localSettings = ref<GameSettings>({})

const systemMemory = ref<SystemMemoryInfo>({
  totalMb: 16384,
  usedMb: 4096,
  freeMb: 12288,
  percentUsed: 25
})

const javaList = ref<JavaInfo[]>([])
const isJavaOpen = ref(false)
const javaSelectRef = ref<HTMLElement | null>(null)

watch(() => props.settings, (newSettings) => {
  if (newSettings) {
    localSettings.value = {
      java_auto: newSettings.java_auto,
      java_path: newSettings.java_path ?? '',
      memory_auto: newSettings.memory_auto,
      memory_size: newSettings.memory_size,
      fullscreen: newSettings.fullscreen
    }
  }
}, { immediate: true, deep: true })

const javaAutoDesc = computed(() => {
  return localSettings.value.java_auto
    ? t('settings.javaSelectionAutoDesc')
    : t('settings.javaSelectionManualDesc')
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

const usedPercent = computed(() => {
  return (systemMemory.value.usedMb / systemMemory.value.totalMb) * 100
})

const gamePercent = computed(() => {
  return (localSettings.value.memory_size / systemMemory.value.totalMb) * 100
})

const remainingMemory = computed(() => {
  return systemMemory.value.totalMb - systemMemory.value.usedMb - localSettings.value.memory_size
})

const selectedJavaLabel = computed(() => {
  if (!localSettings.value.java_path) return ''
  const java = javaList.value.find(j => j.path === localSettings.value.java_path)
  if (!java) return localSettings.value.java_path
  return `Java ${java.major_version} (${java.java_type})`
})

const formatMemory = (mb: number): string => {
  if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB'
  return mb + ' MB'
}

const loadJavaList = async () => {
  const result = await run(async () => backend.command('java_list'))
  if (result?.success && result.data) {
    javaList.value = result.data
  }
}

const loadGameConfig = async () => {
  const result = await run(async () => backend.config.get('game'))
  if (!result?.success || !result.data) return
  const data = result.data
  localSettings.value = {
    java_auto: data.java_auto,
    java_path: data.java_path ?? '',
    memory_auto: data.memory_auto,
    memory_size: data.memory_size,
    fullscreen: data.fullscreen
  }
  emit('update:settings', { ...localSettings.value })
}

const saveConfig = async () => {
  const config = {
    java_auto: localSettings.value.java_auto,
    java_path: localSettings.value.java_path,
    memory_auto: localSettings.value.memory_auto,
    memory_size: localSettings.value.memory_size,
    fullscreen: localSettings.value.fullscreen
  }
  const result = await run(async () => backend.config.set('game', config))
  if (result?.success) {
    emit('update:settings', { ...localSettings.value })
  }
}

/** 防抖保存：拖动滑块时延迟保存，避免高频请求 */
let saveTimer: ReturnType<typeof setTimeout> | null = null

function debouncedSaveConfig(delay = 300) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveConfig()
  }, delay)
}

const handleJavaAutoToggle = () => {
  localSettings.value.java_auto = !localSettings.value.java_auto
  if (localSettings.value.java_auto) {
    localSettings.value.java_path = ''
  }
  saveConfig()
}

const handleMemoryAutoToggle = () => {
  localSettings.value.memory_auto = !localSettings.value.memory_auto
  if (localSettings.value.memory_auto) {
    localSettings.value.memory_size = 4096
  }
  saveConfig()
}

const handleFullscreenToggle = () => {
  localSettings.value.fullscreen = !localSettings.value.fullscreen
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
  const result = await run(async () => backend.command('select_java'))
  if (!result?.success || !result.data?.path) return
  localSettings.value.java_path = result.data.path
  await saveConfig()
  message.success(t('common.success'))
}

useClickOutside(javaSelectRef, () => { isJavaOpen.value = false })

onMounted(() => {
  loadJavaList()
  loadGameConfig()
})

onUnmounted(() => {
  if (saveTimer) clearTimeout(saveTimer)
})
</script>

<style scoped src="@/styles/GameTab.css"></style>

