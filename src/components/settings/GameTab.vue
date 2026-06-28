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
            :class="['toggle-switch', { active: localSettings.javaAuto }]"
            @click="handleJavaAutoToggle"
            role="switch"
            :aria-checked="localSettings.javaAuto"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>
      </div>

      <div v-if="!localSettings.javaAuto" class="setting-item">
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
                    :class="{ active: localSettings.javaPath === java.path }"
                    @click="selectJava(java)"
                  >
                    <div class="option-content">
                      <span class="option-label">Java {{ java.major_version }} ({{ java.java_type }})</span>
                      <span class="option-desc">{{ java.version }} - {{ java.arch }}</span>
                    </div>
                    <UiIcon v-if="localSettings.javaPath === java.path" name="check" :size="14" class="check-icon" />
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
            :class="['toggle-switch', { active: localSettings.memoryAuto }]"
            @click="handleMemoryAutoToggle"
            role="switch"
            :aria-checked="localSettings.memoryAuto"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>
      </div>

      <div v-if="!localSettings.memoryAuto" class="memory-manual-section">
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">{{ t('settings.memorySize') }}</div>
            <div class="setting-desc">{{ t('settings.memorySizeDesc') }}</div>
          </div>
          <div class="setting-control">
            <span class="memory-value">{{ formatMemory(localSettings.memorySize) }}</span>
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
              v-model.number="localSettings.memorySize"
              min="1024"
              :max="maxMemory"
              step="256"
              @input="onMemoryChange"
              @change="saveConfig"
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
              <span class="stat-value highlight">{{ formatMemory(localSettings.memorySize) }}</span>
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
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlassMessage } from '@/composables/useGlassMessage'
import UiIcon from '@/components/ui/Icon.vue'
import backend from '@/api/client'

interface JavaInfo {
  path: string
  version: string
  major_version: number
  java_type: string
  arch: string
}

interface GameSettings {
  javaAuto: boolean
  javaPath: string
  memoryAuto: boolean
  memorySize: number
  fullscreen: boolean
}

interface SystemMemoryInfo {
  totalMb: number
  usedMb: number
  freeMb: number
  percentUsed: number
}

const props = defineProps<{
  settings: any
}>()

const emit = defineEmits<{
  (e: 'update:settings', value: any): void
}>()

const { t } = useI18n()
const message = useGlassMessage()

const localSettings = ref<GameSettings>({
  javaAuto: true,
  javaPath: '',
  memoryAuto: true,
  memorySize: 4096,
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
      javaAuto: newSettings.javaAuto ?? newSettings.java_auto ?? true,
      javaPath: newSettings.javaPath ?? newSettings.java_path ?? '',
      memoryAuto: newSettings.memoryAuto ?? newSettings.memory_auto ?? true,
      memorySize: newSettings.memorySize ?? newSettings.memory_size ?? 4096,
      fullscreen: newSettings.fullscreen ?? false
    }
  }
}, { immediate: true, deep: true })

const javaAutoDesc = computed(() => {
  return localSettings.value.javaAuto
    ? t('settings.javaSelectionAutoDesc')
    : t('settings.javaSelectionManualDesc')
})

const memoryAutoDesc = computed(() => {
  return localSettings.value.memoryAuto
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
  return (localSettings.value.memorySize / systemMemory.value.totalMb) * 100
})

const remainingMemory = computed(() => {
  return systemMemory.value.totalMb - systemMemory.value.usedMb - localSettings.value.memorySize
})

const selectedJavaLabel = computed(() => {
  if (!localSettings.value.javaPath) return ''
  const java = javaList.value.find(j => j.path === localSettings.value.javaPath)
  if (java) return `Java ${java.major_version} (${java.java_type})`
  return localSettings.value.javaPath
})

const formatMemory = (mb: number): string => {
  if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB'
  return mb + ' MB'
}

const loadJavaList = async () => {
  try {
    const result = await backend.command('java_list')
    if (result.success && result.data) {
      javaList.value = result.data
    }
  } catch (e) {
    console.error('加载Java列表失败:', e)
  }
}

const loadGameConfig = async () => {
  try {
    const result = await backend.config.get('game')
    if (result.success && result.data) {
      const data = result.data
      localSettings.value = {
        javaAuto: data.java_auto ?? true,
        javaPath: data.java_path ?? '',
        memoryAuto: data.memory_auto ?? true,
        memorySize: data.memory_size ?? 4096,
        fullscreen: data.fullscreen ?? false
      }
      emit('update:settings', { ...localSettings.value })
    }
  } catch (e) {
    console.error('加载游戏配置失败:', e)
  }
}

const onMemoryChange = () => {}

const saveConfig = async () => {
  try {
    const config = {
      java_auto: localSettings.value.javaAuto,
      java_path: localSettings.value.javaPath,
      memory_auto: localSettings.value.memoryAuto,
      memory_size: localSettings.value.memorySize,
      fullscreen: localSettings.value.fullscreen
    }
    const result = await backend.config.set('game', config)
    if (result.success) {
      emit('update:settings', { ...localSettings.value })
    } else {
      message.error(result.message || t('common.error'))
    }
  } catch (error) {
    message.error(t('common.error'))
  }
}

const handleJavaAutoToggle = () => {
  localSettings.value.javaAuto = !localSettings.value.javaAuto
  if (localSettings.value.javaAuto) {
    localSettings.value.javaPath = ''
  }
  saveConfig()
}

const handleMemoryAutoToggle = () => {
  localSettings.value.memoryAuto = !localSettings.value.memoryAuto
  if (localSettings.value.memoryAuto) {
    localSettings.value.memorySize = 4096
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
  localSettings.value.javaPath = java.path
  isJavaOpen.value = false
  saveConfig()
}

const browseJava = async () => {
  try {
    const result = await backend.command('select_java')
    if (result.success && result.data?.path) {
      localSettings.value.javaPath = result.data.path
      saveConfig()
      message.success(t('common.success'))
    }
  } catch (error) {
    message.error(t('common.error'))
  }
}

const handleClickOutside = (e: MouseEvent) => {
  if (javaSelectRef.value && !javaSelectRef.value.contains(e.target as Node)) {
    isJavaOpen.value = false
  }
}

onMounted(() => {
  loadJavaList()
  loadGameConfig()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
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

/* 开关 */
.toggle-switch {
  width: 32px;
  height: 18px;
  border-radius: 9px;
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
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: transform 150ms ease-out;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.toggle-switch.active .toggle-knob {
  transform: translateX(14px);
}

/* Java 选择器 */
.java-selector {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
}

.custom-select {
  position: relative;
  width: 220px;
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
  max-height: 200px;
  overflow-y: auto;
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

.btn-ghost {
  padding: 6px 12px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
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
  font-size: 18px;
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
  height: 8px;
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

.memory-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.memory-stat-item {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  font-size: 12px;
}

.stat-dot {
  width: 8px;
  height: 8px;
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