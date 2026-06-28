<template>
  <div class="tab-pane">
    <!-- 外观 -->
    <div class="settings-section">
      <div class="section-label">{{ t('settings.appearance') }}</div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.theme') }}</div>
          <div class="setting-desc">{{ t('settings.themeDesc') }}</div>
        </div>
        <div class="setting-control">
          <div class="theme-options">
            <div
              v-for="opt in themeOptions"
              :key="opt.value"
              :class="['theme-option', { active: currentSettings.mode === opt.value }]"
              @click="handleThemeChange(opt.value as ThemeMode)"
            >
              <UiIcon :name="opt.icon" :size="18" />
              <span class="theme-option-label">{{ opt.label }}</span>
              <UiIcon v-if="currentSettings.mode === opt.value" name="check" :size="14" class="theme-check" />
            </div>
          </div>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.primaryColor') }}</div>
          <div class="setting-desc">{{ t('settings.primaryColorDesc') }}</div>
        </div>
        <div class="setting-control">
          <div class="color-presets">
            <div
              v-for="color in presetColors"
              :key="color.value"
              :class="['color-dot', { active: currentSettings.primaryColor === color.value }]"
              :style="{ backgroundColor: color.value }"
              :title="color.name"
              @click="handleColorChange(color.value)"
            ></div>
            <div class="custom-color-wrapper">
              <input
                type="color"
                :value="currentSettings.primaryColor"
                @input="handleColorInput"
                class="color-input-native"
              />
              <span class="custom-color-label">+</span>
            </div>
          </div>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.background') }}</div>
          <div class="setting-desc">{{ t('settings.backgroundDesc') }}</div>
        </div>
        <div class="setting-control">
          <div class="bg-input-group">
            <input
              type="text"
              :value="currentSettings.backgroundImage"
              @input="handleBgImageInput"
              :placeholder="t('settings.backgroundPlaceholder')"
              class="text-input"
            />
            <button class="btn-ghost" @click="selectLocalImage">{{ t('common.browse') }}</button>
          </div>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.backgroundBrightness') }}</div>
          <div class="setting-desc">{{ t('settings.backgroundBrightnessDesc') }}</div>
        </div>
        <div class="setting-control">
          <div class="slider-group">
            <input
              type="range"
              :value="bgBrightness"
              min="0"
              max="100"
              step="1"
              @change="handleBrightnessChange"
              class="slider-input"
            />
            <span class="slider-value">{{ bgBrightness }}%</span>
          </div>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.backgroundBlur') }}</div>
          <div class="setting-desc">{{ t('settings.backgroundBlurDesc') }}</div>
        </div>
        <div class="setting-control">
          <div class="slider-group">
            <input
              type="range"
              :value="currentSettings.blurAmount"
              min="0"
              max="20"
              step="1"
              @change="handleBlurChange"
              class="slider-input"
            />
            <span class="slider-value">{{ currentSettings.blurAmount }}px</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 语言与交互 -->
    <div class="settings-section">
      <div class="section-label">{{ t('settings.languageRegion') }}</div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.language') }}</div>
          <div class="setting-desc">{{ t('settings.languageDesc') }}</div>
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
              <UiIcon name="chevron-down" class="select-arrow" :class="{ rotated: isLangOpen }" :size="14" />
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
                  <UiIcon v-if="currentLocale === lang.code" name="check" :size="14" class="check-icon" />
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
          <button
            :class="['toggle-switch', { active: topNavEnabled }]"
            @click="toggleTopNav"
            role="switch"
            :aria-checked="topNavEnabled"
          >
            <span class="toggle-knob"></span>
          </button>
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
import UiIcon from '@/components/ui/Icon.vue'
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
  setBackgroundOpacity,
  backgroundOpacity,
} = useTheme()
const { topNavEnabled, toggleTopNav } = useTopNav()

const currentSettings = computed(() => ({
  mode: props.settings?.mode || 'system',
  primaryColor: props.settings?.primaryColor || '#4A7FD9',
  blurAmount: props.settings?.blurAmount ?? 6,
  backgroundImage: props.settings?.backgroundImage || '',
  downloadSource: props.settings?.downloadSource || 'official',
  downloadThreads: props.settings?.downloadThreads ?? 4
}))

const bgBrightness = ref(Math.round(backgroundOpacity.value * 100))

const themeOptions = computed(() => [
  { value: 'light', icon: 'sun', label: t('settings.themeLight') },
  { value: 'dark', icon: 'moon', label: t('settings.themeDark') },
  { value: 'system', icon: 'settings', label: t('settings.themeSystem') },
])

const isLangOpen = ref(false)
const langSelectRef = ref<HTMLElement | null>(null)

const selectedLanguage = computed(() =>
  supportedLocales.find(l => l.code === currentLocale.value)
)

const updateField = (field: string, value: any) => {
  emit('update:settings', { ...props.settings, [field]: value })
}

const toggleLangOpen = () => {
  isLangOpen.value = !isLangOpen.value
}

const handleThemeChange = async (mode: ThemeMode) => {
  updateField('mode', mode)
  setThemeMode(mode)
  try {
    const uiCfg = (await backend.config.get('ui')).data || {}
    await backend.config.set('ui', {
      ...uiCfg,
      theme: { ...uiCfg.theme, mode, primary_color: currentSettings.value.primaryColor, blur_amount: currentSettings.value.blurAmount }
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
      theme: { ...uiCfg.theme, mode: currentSettings.value.mode, primary_color: color, blur_amount: currentSettings.value.blurAmount }
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
      theme: { ...uiCfg.theme, mode: currentSettings.value.mode, primary_color: currentSettings.value.primaryColor, blur_amount: val }
    })
  } catch (error) {
    message.error(t('common.error'))
  }
}

const handleBrightnessChange = async (e: Event) => {
  const val = parseInt((e.target as HTMLInputElement).value)
  bgBrightness.value = val
  const opacity = val / 100
  setBackgroundOpacity(opacity)
  try {
    const uiCfg = (await backend.config.get('ui')).data || {}
    await backend.config.set('ui', {
      ...uiCfg,
      background: { ...(uiCfg.background || {}), opacity }
    })
  } catch (error) {
    console.error('保存亮度设置失败:', error)
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
const handleBgImageInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  updateField('backgroundImage', val)
  if (bgTimer) clearTimeout(bgTimer)
  bgTimer = setTimeout(async () => {
    if (!val) {
      setBackgroundImage('', '')
      const uiNone = (await backend.config.get('ui')).data || {}
      await backend.config.set('ui', { ...uiNone, background: { type: 'none', path: '' } })
      return
    }
    if (val.startsWith('http')) {
      try {
        message.loading('Loading...')
        const result = await backend.command('image_save_url', { url: val })
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

const handleClickOutside = (e: MouseEvent) => {
  if (langSelectRef.value && !langSelectRef.value.contains(e.target as Node)) {
    isLangOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  if (bgTimer) clearTimeout(bgTimer)
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

/* 主题选择 */
.theme-options {
  display: flex;
  gap: var(--s-sm);
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 16px;
  border-radius: var(--r-xs);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 150ms ease-out;
  position: relative;
  min-width: 64px;
}

.theme-option:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.theme-option.active {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-alpha);
}

.theme-option-label {
  font-size: 11px;
  font-weight: 500;
}

.theme-check {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--text-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 主题色圆点 */
.color-presets {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.color-dot:hover {
  transform: scale(1.1);
}

.color-dot.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-alpha);
}

.custom-color-wrapper {
  position: relative;
  width: 20px;
  height: 20px;
}

.color-input-native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.custom-color-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px dashed var(--border-strong);
  color: var(--text-tertiary);
  font-size: 14px;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.custom-color-label:hover {
  border-color: var(--primary);
  color: var(--primary);
}

/* 输入框 */
.text-input {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  width: 200px;
  transition: border-color 150ms ease-out;
}

.text-input:focus {
  border-color: var(--border-hover);
}

.text-input::placeholder {
  color: var(--text-tertiary);
}

.bg-input-group {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
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
  align-items: center;
  gap: var(--s-sm);
}

.lang-flag {
  font-size: 14px;
}

.lang-name {
  font-size: 13px;
}

.check-icon {
  color: var(--primary);
  flex-shrink: 0;
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