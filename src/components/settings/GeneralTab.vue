<template>
  <div class="tab-pane">
    <!-- 外观 -->
    <div class="settings-group">
      <div class="group-header">
        <UiIcon name="brush" class="group-icon" />
        <span class="group-title">{{ t('settings.appearance') }}</span>
      </div>

      <div class="setting-item theme-setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.theme') }}</div>
          <div class="setting-desc">{{ t('settings.theme') }}</div>
        </div>
        <div class="setting-control">
          <div class="theme-options">
            <div
              class="theme-card"
              :class="{ active: currentSettings.mode === 'light' }"
              @click="handleThemeChange('light')"
            >
              <UiIcon name="sun" class="theme-icon" />
              <span class="theme-label">{{ t('settings.themeLight') }}</span>
            </div>
            <div
              class="theme-card"
              :class="{ active: currentSettings.mode === 'dark' }"
              @click="handleThemeChange('dark')"
            >
              <UiIcon name="moon" class="theme-icon" />
              <span class="theme-label">{{ t('settings.themeDark') }}</span>
            </div>
            <div
              class="theme-card"
              :class="{ active: currentSettings.mode === 'system' }"
              @click="handleThemeChange('system')"
            >
              <UiIcon name="settings" class="theme-icon" />
              <span class="theme-label">{{ t('settings.themeSystem') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.primaryColor') }}</div>
          <div class="setting-desc">{{ t('settings.primaryColor') }}</div>
        </div>
        <div class="setting-control">
          <div class="color-presets">
            <div
              v-for="color in presetColors"
              :key="color.value"
              class="color-preset-item"
              :style="{ backgroundColor: color.value }"
              :class="{ active: currentSettings.primaryColor === color.value }"
              :title="color.name"
              @click="handleColorChange(color.value)"
            >
              <i v-if="currentSettings.primaryColor === color.value" class="icon icon-check" />
            </div>
            <div class="custom-color-picker">
              <input
                type="color"
                :value="currentSettings.primaryColor"
                @input="handleColorInput"
                class="color-input"
                title="自定义颜色"
              />
              <span class="custom-color-label">Custom</span>
            </div>
          </div>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.background') }}</div>
          <div class="setting-desc">{{ t('settings.background') }}</div>
        </div>
        <div class="setting-control">
          <div class="input-group">
            <UiInput 
              :model-value="currentSettings.backgroundImage"
              @update:model-value="handleBgImageInput"
              :placeholder="t('settings.background') + ' URL'"
            />
            <UiButton variant="secondary" size="sm" @click="selectLocalImage">{{ t('common.browse') }}</UiButton>
          </div>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.backgroundBlur') }}</div>
          <div class="setting-desc">{{ t('settings.backgroundBlur') }} (0-20px)</div>
        </div>
        <div class="setting-control">
          <div class="slider-container">
            <input 
              type="range" 
              :value="currentSettings.blurAmount"
              min="0" 
              max="20" 
              step="1"
              @change="handleBlurChange"
            />
            <span class="slider-value">{{ currentSettings.blurAmount }} px</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 语言与交互 -->
    <div class="settings-group">
      <div class="group-header">
        <UiIcon name="globe" class="group-icon" />
        <span class="group-title">{{ t('settings.language') }}</span>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.language') }}</div>
          <div class="setting-desc">Language / 语言</div>
        </div>
        <div class="setting-control">
          <div class="custom-select" :class="{ open: isLangOpen }" ref="langSelectRef">
            <div class="select-trigger" @click="toggleLangOpen">
              <span class="selected-text">
                <span class="lang-option">
                  <span class="lang-flag">{{ selectedLanguage?.flag }}</span>
                  <span class="lang-name">{{ selectedLanguage?.name }}</span>
                </span>
              </span>
              <UiIcon name="arrow-right" class="select-arrow" :class="{ rotated: isLangOpen }" />
            </div>
            <transition name="select-dropdown">
              <div v-show="isLangOpen" class="select-dropdown">
                <div
                  v-for="lang in supportedLocales"
                  :key="lang.code"
                  class="select-option"
                  :class="{ active: currentLocale === lang.code }"
                  @click="handleLanguageChange(lang.code)"
                >
                  <div class="option-content">
                    <span class="lang-flag">{{ lang.flag }}</span>
                    <span class="lang-name">{{ lang.name }}</span>
                  </div>
                  <UiIcon v-if="currentLocale === lang.code" name="check" class="check-icon" />
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.topNav') }}</div>
          <div class="setting-desc">{{ t('settings.topNavDesc') }}</div>
        </div>
        <div class="setting-control">
          <label class="switch">
            <input type="checkbox" v-model="topNavEnabled" />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">鼠标点击效果</div>
          <div class="setting-desc">启用鼠标拖尾火花特效</div>
        </div>
        <div class="setting-control">
          <label class="switch">
            <input 
              type="checkbox" 
              :checked="mouseEffectEnabled"
              @change="toggleMouseEffect"
            />
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <template v-if="mouseEffectEnabled">
        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">效果颜色</div>
            <div class="setting-desc">RGB 颜色值 (例如: 45,175,255)</div>
          </div>
          <div class="setting-control">
            <UiInput 
              v-model="mouseEffectColor"
              @update:model-value="updateMouseEffectColor"
              placeholder="45,175,255"
              style="width: 140px"
            />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">效果大小</div>
            <div class="setting-desc">调整火花大小</div>
          </div>
          <div class="setting-control">
            <div class="slider-container">
              <input 
                type="range" 
                v-model.number="mouseEffectScale"
                min="0.5" 
                max="3" 
                step="0.1"
                @change="updateMouseEffectSettings"
              />
              <span class="slider-value">{{ mouseEffectScale.toFixed(1) }}</span>
            </div>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <div class="setting-label">不透明度</div>
            <div class="setting-desc">调整效果透明度</div>
          </div>
          <div class="setting-control">
            <div class="slider-container">
              <input 
                type="range" 
                v-model.number="mouseEffectOpacity"
                min="0.1" 
                max="1" 
                step="0.1"
                @change="updateMouseEffectSettings"
              />
              <span class="slider-value">{{ Math.round(mouseEffectOpacity * 100) }}%</span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 下载 -->
    <div class="settings-group">
      <div class="group-header">
        <UiIcon name="download" class="group-icon" />
        <span class="group-title">{{ t('settings.download') }}</span>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.downloadSource') }}</div>
          <div class="setting-desc">{{ t('settings.downloadSource') }}</div>
        </div>
        <div class="setting-control">
          <div class="custom-select" :class="{ open: isOpen }" ref="selectRef">
            <div class="select-trigger" @click="toggleOpen">
              <span class="selected-text">{{ selectedDownloadSource?.label || '请选择' }}</span>
              <UiIcon name="arrow-right" class="select-arrow" :class="{ rotated: isOpen }" />
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
                  <i v-if="currentSettings.downloadSource === option.value" class="icon icon-check check-icon" />
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.downloadThreads') }}</div>
        </div>
        <div class="setting-control">
          <div class="slider-container">
            <input 
              type="range" 
              :value="currentSettings.downloadThreads"
              min="1" 
              max="16" 
              step="1"
              @change="handleThreadsChange"
            />
            <span class="slider-value">{{ currentSettings.downloadThreads }} {{ t('settings.threads') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { supportedLocales, setLocale, type LocaleCode } from '@/i18n'
import { useTheme, type ThemeMode, presetColors } from '@/composables/useTheme'
import { useTopNav } from '@/composables/useTopNav'
import UiButton from '@/components/ui/Button.vue'
import UiInput from '@/components/ui/Input.vue'
import backend from '@/api/client'

const props = defineProps<{
  settings: any
}>()

const emit = defineEmits<{
  (e: 'update:settings', value: any): void
}>()

const { t, locale } = useI18n()
const message = useGlassMessage()
const currentLocale = computed(() => locale.value as LocaleCode)
const {
  setThemeMode,
  setPrimaryColor,
  setBackgroundImage,
  setBlurAmount,
} = useTheme()

const { topNavEnabled, toggleTopNav } = useTopNav()

const currentSettings = computed(() => ({
  mode: props.settings?.mode || 'system',
  primaryColor: props.settings?.primaryColor || '#0078d4',
  blurAmount: props.settings?.blurAmount ?? 6,
  backgroundImage: props.settings?.backgroundImage || '',
  downloadSource: props.settings?.downloadSource || 'official',
  downloadThreads: props.settings?.downloadThreads ?? 4
}))

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)

const isLangOpen = ref(false)
const langSelectRef = ref<HTMLElement | null>(null)

const downloadOptions = computed(() => [
  { value: 'official' as const, label: t('settings.sourceOfficial'), desc: 'Minecraft Official' },
  { value: 'bmclapi' as const, label: 'BMCLAPI', desc: t('settings.sourceBmclapiDesc') }
])

const selectedDownloadSource = computed(() => 
  downloadOptions.value.find(o => o.value === currentSettings.value.downloadSource)
)

const selectedLanguage = computed(() =>
  supportedLocales.find(l => l.code === currentLocale.value)
)

// 鼠标点击效果配置
const mouseEffectEnabled = ref(false)
const mouseEffectColor = ref('45,175,255')
const mouseEffectScale = ref(1.5)
const mouseEffectOpacity = ref(1.0)
const mouseEffectSpeed = ref(1.0)

const loadMouseEffectConfig = async () => {
  try {
    const result = await backend.config.get('ui')
    if (result.success && result.data?.mouse_effect) {
      const config = result.data.mouse_effect
      mouseEffectEnabled.value = config.enabled ?? false
      mouseEffectColor.value = config.color ?? '45,175,255'
      mouseEffectScale.value = config.scale ?? 1.5
      mouseEffectOpacity.value = config.opacity ?? 1.0
      mouseEffectSpeed.value = config.speed ?? 1.0
    }
  } catch (e) {
    console.error('加载鼠标效果配置失败:', e)
  }
}

const saveMouseEffectConfig = async () => {
  try {
    const uiRes = await backend.config.get('ui')
    const ui = uiRes.data || {}
    const config = {
      enabled: mouseEffectEnabled.value,
      color: mouseEffectColor.value,
      scale: mouseEffectScale.value,
      opacity: mouseEffectOpacity.value,
      speed: mouseEffectSpeed.value
    }
    const result = await backend.config.set('ui', {
      ...ui,
      mouse_effect: config
    })
    if (!result.success) {
      console.error('保存鼠标效果配置失败:', result.message)
    }
  } catch (e) {
    console.error('保存鼠标效果配置失败:', e)
  }
}

const toggleMouseEffect = async () => {
  mouseEffectEnabled.value = !mouseEffectEnabled.value
  await saveMouseEffectConfig()
  window.dispatchEvent(new CustomEvent('mouseEffectChange', { detail: { enabled: mouseEffectEnabled.value } }))
}

const updateMouseEffectColor = async (value: string | number) => {
  mouseEffectColor.value = value.toString()
  await saveMouseEffectConfig()
  window.dispatchEvent(new CustomEvent('mouseEffectUpdate', { detail: { color: value.toString() } }))
}

const updateMouseEffectSettings = async () => {
  await saveMouseEffectConfig()
  window.dispatchEvent(new CustomEvent('mouseEffectUpdate', { 
    detail: { 
      scale: mouseEffectScale.value,
      opacity: mouseEffectOpacity.value,
      speed: mouseEffectSpeed.value
    } 
  }))
}

const toggleOpen = () => {
  isOpen.value = !isOpen.value
}

const toggleLangOpen = () => {
  isLangOpen.value = !isLangOpen.value
}

const updateField = (field: string, value: any) => {
  emit('update:settings', { ...props.settings, [field]: value })
}

const handleThemeChange = async (mode: ThemeMode) => {
  updateField('mode', mode)
  setThemeMode(mode)
  try {
    const uiCfg = (await backend.config.get('ui')).data || {}
    await backend.config.set('ui', {
      ...uiCfg,
      theme: {
        ...uiCfg.theme,
        mode,
        primary_color: currentSettings.value.primaryColor,
        blur_amount: currentSettings.value.blurAmount
      }
    })
  } catch (error) {
    message.error(t('common.error'))
  }
}

const handleColorChange = async (color: string) => {
  updateField('primaryColor', color)
  setPrimaryColor(color)
  try {
    const uiCfg = (await backend.config.get('ui')).data || {}
    await backend.config.set('ui', {
      ...uiCfg,
      theme: {
        ...uiCfg.theme,
        mode: currentSettings.value.mode,
        primary_color: color,
        blur_amount: currentSettings.value.blurAmount
      }
    })
  } catch (error) {
    message.error(t('common.error'))
  }
}

const handleColorInput = (e: Event) => {
  handleColorChange((e.target as HTMLInputElement).value)
}

const handleBlurChange = async (e: Event) => {
  const val = parseInt((e.target as HTMLInputElement).value)
  updateField('blurAmount', val)
  setBlurAmount(val)
  try {
    const uiCfg = (await backend.config.get('ui')).data || {}
    await backend.config.set('ui', {
      ...uiCfg,
      theme: {
        ...uiCfg.theme,
        mode: currentSettings.value.mode,
        primary_color: currentSettings.value.primaryColor,
        blur_amount: val
      }
    })
  } catch (error) {
    message.error(t('common.error'))
  }
}

const selectLocalImage = async () => {
  try {
    const result = await backend.command('select_image')
    if (result.success && result.data?.path) {
      updateField('backgroundImage', result.data.path)
      const uiCfg = (await backend.config.get('ui')).data || {}
      await backend.config.set('ui', { ...uiCfg, background: { ...(uiCfg.background || {}), type: 'custom', path: result.data.path } })
      
      const imgData = await backend.command('image_read_file', { path: result.data.path })
      if (imgData.success && imgData.data?.base64) {
        setBackgroundImage(imgData.data.base64, result.data.path)
      }
      message.success(t('common.success'))
    } else {
      message.error(result.message || t('common.error'))
    }
  } catch (error: any) {
    message.error(error.message || t('common.error'))
  }
}

let bgTimer: any = null
const handleBgImageInput = (val: string | number) => {
  const strVal = String(val)
  updateField('backgroundImage', strVal)
  
  if (bgTimer) clearTimeout(bgTimer)
  bgTimer = setTimeout(async () => {
    if (!strVal) {
      setBackgroundImage('', '')
      const uiNone = (await backend.config.get('ui')).data || {}
      await backend.config.set('ui', { ...uiNone, background: { type: 'none', path: '' } })
      return
    }
    
    if (strVal.startsWith('http')) {
      try {
        message.loading('Loading...')
        const result = await backend.command('image_save_url', {url: strVal})
        if (result.success && result.data?.path) {
          const localPath = result.data.path
          const uiCfg2 = (await backend.config.get('ui')).data || {}
          await backend.config.set('ui', { ...uiCfg2, background: { type: 'custom', path: localPath } })
          updateField('backgroundImage', localPath)
          const imgData = await backend.command('image_read_file', { path: localPath })

          if (imgData.success && imgData.data?.base64) {
            setBackgroundImage(imgData.data.base64, localPath)
            message.success(t('common.success'))
          } else {
            message.error('加载背景图失败: ' + imgData.message)
          }
        } else {
          message.error(result.message || t('common.error'))
        }
      } catch (error: any) {
        message.error(t('common.error'))
      }
    }
  }, 800)
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

const handleClickOutside = (e: MouseEvent) => {
  if (selectRef.value && !selectRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
  if (langSelectRef.value && !langSelectRef.value.contains(e.target as Node)) {
    isLangOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadMouseEffectConfig()
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (bgTimer) clearTimeout(bgTimer)
})

const handleLanguageChange = async (langCode: LocaleCode) => {
  isLangOpen.value = false
  await setLocale(langCode)
  try {
    const uiCfg = (await backend.config.get('ui')).data || {}
    await backend.config.set('ui', { ...uiCfg, locale: langCode })
  } catch (e) {
    console.error('保存语言配置失败:', e)
  }
}
</script>

<style scoped src="@/styles/GeneralTab.css"></style>