<template>
  <div class="tab-pane">
    <!-- Java 运行时 -->
    <div class="settings-group">
      <div class="group-header">
        <UiIcon name="game" class="group-icon" />
        <span class="group-title">{{ t('settings.javaSettings') }}</span>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.javaAuto') }}</div>
          <div class="setting-desc">{{ javaAutoDesc }}</div>
        </div>
        <div class="setting-control">
          <UiSwitch v-model="localSettings.javaAuto" @change="handleJavaAutoChange" />
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
                <UiIcon name="arrow-right" class="select-arrow" :class="{ rotated: isJavaOpen }" />
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
                    <UiIcon v-if="localSettings.javaPath === java.path" name="check" class="check-icon" />
                  </div>
                </div>
              </transition>
            </div>
            <UiButton variant="secondary" size="sm" @click="browseJava">{{ t('common.browse') }}</UiButton>
          </div>
        </div>
      </div>
    </div>

    <!-- 内存分配 -->
    <div class="settings-group">
      <div class="group-header">
        <UiIcon name="info" class="group-icon" />
        <span class="group-title">{{ t('settings.memory') }}</span>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.memoryAuto') }}</div>
          <div class="setting-desc">{{ memoryAutoDesc }}</div>
        </div>
        <div class="setting-control">
          <UiSwitch v-model="localSettings.memoryAuto" @change="handleMemoryAutoChange" />
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
              class="memory-slider"
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
    <div class="settings-group">
      <div class="group-header">
        <UiIcon name="settings" class="group-icon" />
        <span class="group-title">{{ t('settings.runtime') }}</span>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.fullscreen') }}</div>
          <div class="setting-desc">{{ t('settings.fullscreenDesc') }}</div>
        </div>
        <div class="setting-control">
          <UiSwitch v-model="localSettings.fullscreen" @change="saveConfig" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import UiButton from '@/components/ui/Button.vue'
import UiSwitch from '@/components/ui/Switch.vue'
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
const message = useMessage()

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
  if (java) {
    return `Java ${java.major_version} (${java.java_type})`
  }
  return localSettings.value.javaPath
})

const formatMemory = (mb: number): string => {
  if (mb >= 1024) {
    return (mb / 1024).toFixed(1) + ' GB'
  }
  return mb + ' MB'
}

const loadJavaList = async () => {
  const result = await backend.command('java_list')
  if (result.success && result.data) {
    javaList.value = result.data
  }
}

const loadGameConfig = async () => {
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

const handleJavaAutoChange = () => {
  if (localSettings.value.javaAuto) {
    localSettings.value.javaPath = ''
  }
  saveConfig()
}

const handleMemoryAutoChange = () => {
  if (localSettings.value.memoryAuto) {
    localSettings.value.memorySize = 4096
  }
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

<style scoped src="@/styles/GameTab.css"></style>