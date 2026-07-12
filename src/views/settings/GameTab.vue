<template>
  <div class="tab-pane">
    <!-- Java 运行时 -->
    <div class="settings-section">
      <div class="section-label">{{ t('settings.javaSettings') }}</div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.javaAuto') }}</div>
          <div class="setting-desc">{{ javaAutoDesc }}</div>
        </div>
        <div class="setting-control">
          <button
            :class="['toggle-switch', { active: localSettings.java_auto }]"
            @click="handleJavaAutoToggle"
            role="switch"
            :aria-checked="localSettings.java_auto"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>
      </div>

      <div v-if="!localSettings.java_auto" class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.javaPath') }}</div>
          <div class="setting-desc">{{ t('settings.javaPathDesc') }}</div>
        </div>
        <div class="setting-control">
          <div class="java-selector">
            <div class="custom-select" :class="{ open: isJavaOpen }" ref="javaSelectRef">
              <div class="select-trigger" @click="toggleJavaOpen">
                <span class="selected-text">{{ selectedJavaLabel || t('settings.javaPathPlaceholder') }}</span>
                <UiIcon name="chevron-down" class="select-arrow" :class="{ rotated: isJavaOpen }" :size="14" />
              </div>
              <transition name="select-dropdown">
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
              </transition>
            </div>
            <button class="btn-ghost" @click="browseJava">{{ t('common.browse') }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 内存分配 -->
    <div class="settings-section">
      <div class="section-label">{{ t('settings.memory') }}</div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.memoryAuto') }}</div>
          <div class="setting-desc">{{ memoryAutoDesc }}</div>
        </div>
        <div class="setting-control">
          <button
            :class="['toggle-switch', { active: localSettings.memory_auto }]"
            @click="handleMemoryAutoToggle"
            role="switch"
            :aria-checked="localSettings.memory_auto"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>
      </div>

      <div v-if="!localSettings.memory_auto" class="memory-manual-section">
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">{{ t('settings.memorySize') }}</div>
            <div class="setting-desc">{{ t('settings.memorySizeDesc') }}</div>
          </div>
          <div class="setting-control">
            <span class="memory-value">{{ formatMemory(localSettings.memory_size) }}</span>
          </div>
        </div>

        <div class="memory-visualization">
          <div class="memory-bar-container">
            <div class="memory-bar">
              <div class="memory-segment memory-used" :style="{ width: usedPercent + '%' }"></div>
              <div class="memory-segment memory-game" :style="{ width: gamePercent + '%' }"></div>
            </div>
            <div class="memory-labels">
              <span>0 MB</span>
              <span>{{ formatMemory(systemMemory.totalMb / 2) }}</span>
              <span>{{ formatMemory(systemMemory.totalMb) }}</span>
            </div>
          </div>

          <div class="slider-wrapper">
            <input
              type="range"
              v-model.number="localSettings.memory_size"
              min="1024"
              :max="maxMemory"
              step="256"
              @change="debouncedSaveConfig"
              class="slider-input"
            />
          </div>

          <div class="memory-stats">
            <div class="memory-stat-item">
              <span class="stat-dot memory-used-dot"></span>
              <span class="stat-label">{{ t('settings.memoryUsed') }}:</span>
              <span class="stat-value">{{ formatMemory(systemMemory.usedMb) }} ({{ systemMemory.percentUsed }}%)</span>
            </div>
            <div class="memory-stat-item">
              <span class="stat-dot memory-game-dot"></span>
              <span class="stat-label">{{ t('settings.memoryAllocated') }}:</span>
              <span class="stat-value highlight">{{ formatMemory(localSettings.memory_size) }}</span>
            </div>
            <div class="memory-stat-item">
              <span class="stat-dot memory-remaining-dot"></span>
              <span class="stat-label">{{ t('settings.memoryRemaining') }}:</span>
              <span class="stat-value">{{ formatMemory(remainingMemory) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 启动选项 -->
    <div class="settings-section">
      <div class="section-label">{{ t('settings.runtime') }}</div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.fullscreen') }}</div>
          <div class="setting-desc">{{ t('settings.fullscreenDesc') }}</div>
        </div>
        <div class="setting-control">
          <button
            :class="['toggle-switch', { active: localSettings.fullscreen }]"
            @click="handleFullscreenToggle"
            role="switch"
            :aria-checked="localSettings.fullscreen"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { useClickOutside } from '@/composables/useClickOutside'
import UiIcon from '@/components/ui/Icon.vue'
import backend from '@/api/client'

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

const localSettings = ref<GameSettings>({
  java_auto: true,
  java_path: '',
  memory_auto: true,
  memory_size: 4096,
  fullscreen: false
})

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
      java_auto: newSettings.java_auto ?? true,
      java_path: newSettings.java_path ?? '',
      memory_auto: newSettings.memory_auto ?? true,
      memory_size: newSettings.memory_size ?? 4096,
      fullscreen: newSettings.fullscreen ?? false
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
    java_auto: data.java_auto ?? true,
    java_path: data.java_path ?? '',
    memory_auto: data.memory_auto ?? true,
    memory_size: data.memory_size ?? 4096,
    fullscreen: data.fullscreen ?? false
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

<style scoped>
.tab-pane {
  max-width: 540px;
}

.settings-section {
  margin-bottom: var(--s-2xl);
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 12px;
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
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.setting-desc {
  font-size: 11px;
  color: var(--text-tertiary);
  line-height: 1.5;
}

.setting-control {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* 开关 */
.toggle-switch {
  width: 29px;
  height: 16px;
  border-radius: 8px;
  border: none;
  background: var(--bg-base-alt);
  cursor: pointer;
  position: relative;
  transition: background 150ms ease-out;
  padding: 0;
}

.toggle-switch.active {
  background: var(--primary);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: #fff;
  transition: transform 150ms ease-out;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.toggle-switch.active .toggle-knob {
  transform: translateX(13px);
}

/* Java 选择器 */
.java-selector {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
}

.custom-select {
  position: relative;
  width: 198px;
}

.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 29px;
  padding: 0 9px;
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
  font-size: 12px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-arrow {
  color: var(--text-tertiary);
  transition: transform 150ms ease-out;
  flex-shrink: 0;
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
  max-height: 180px;
  overflow-y: auto;
}

.select-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 11px;
  cursor: pointer;
  font-size: 12px;
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
  font-size: 12px;
  font-weight: 500;
}

.option-desc {
  font-size: 10px;
  color: var(--text-tertiary);
}

.check-icon {
  color: var(--primary);
  flex-shrink: 0;
}

.btn-ghost {
  padding: 5px 11px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 150ms ease-out;
}

.btn-ghost:hover {
  border-color: var(--primary);
  color: var(--primary);
}

/* 内存值 */
.memory-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary);
  font-family: var(--font-mono);
}

/* 内存可视化 */
.memory-manual-section {
  margin-top: var(--s-md);
}

.memory-visualization {
  margin-top: var(--s-md);
  padding: var(--s-lg);
  background: var(--bg-base);
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
}

.memory-bar-container {
  margin-bottom: var(--s-md);
}

.memory-bar {
  height: 7px;
  background: var(--bg-base-alt);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  margin-bottom: 4px;
}

.memory-segment {
  height: 100%;
  transition: width 300ms ease-out;
}

.memory-used {
  background: var(--text-tertiary);
}

.memory-game {
  background: var(--primary);
}

.memory-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--text-tertiary);
}

.slider-wrapper {
  margin: var(--s-md) 0;
}

.slider-input {
  width: 100%;
}

.memory-stats {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.memory-stat-item {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  font-size: 11px;
}

.stat-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.memory-used-dot { background: var(--text-tertiary); }
.memory-game-dot { background: var(--primary); }
.memory-remaining-dot { background: var(--bg-base-alt); }

.stat-label {
  color: var(--text-secondary);
}

.stat-value {
  color: var(--text-primary);
  font-weight: 500;
}

.stat-value.highlight {
  color: var(--primary);
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
