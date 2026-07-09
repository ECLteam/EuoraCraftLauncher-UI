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
              :class="['color-dot', { active: currentSettings.primary_color === color.value }]"
              :style="{ backgroundColor: color.value }"
              :title="color.name"
              @click="handleColorChange(color.value)"
            ></div>
            <div class="custom-color-wrapper">
              <input
                type="color"
                :value="currentSettings.primary_color"
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
              :value="currentSettings.background_image"
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
              :value="currentSettings.blur_amount"
              min="0"
              max="20"
              step="1"
              @change="handleBlurChange"
              class="slider-input"
            />
            <span class="slider-value">{{ currentSettings.blur_amount }}px</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 密钥环管理 -->
    <div class="settings-section">
      <div class="section-label">Keyring</div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">{{ t('settings.keyringStatus') }}</div>
          <div class="setting-desc" v-if="keyringInfo">
            Backend: {{ keyringInfo.type }} &middot; Secure: {{ keyringInfo.secure ? 'Yes' : 'No' }}
          </div>
          <div class="setting-desc text-muted" v-else>
            Keyring not initialized
          </div>
        </div>
        <div class="setting-control">
          <button class="danger-btn" @click="handleClearKeyring" :disabled="clearing">
            {{ clearing ? 'Clearing...' : t('settings.clearKeyring') }}
          </button>
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
import { ref, computed, onUnmounted, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { useClickOutside } from '@/composables/useClickOutside'
import { supportedLocales, setLocale, type LocaleCode } from '@/i18n'
import { useTheme, type ThemeMode, presetColors } from '@/composables/useTheme'
import { useTopNav } from '@/composables/useTopNav'
import UiIcon from '@/components/ui/Icon.vue'
import backend from '@/api/client'

interface GeneralSettings {
  mode?: string
  primary_color?: string
  blur_amount?: number
  background_image?: string
  topNavEnabled?: boolean
}

const props = defineProps<{
  settings: GeneralSettings
}>()

const emit = defineEmits<{
  (e: 'update:settings', value: GeneralSettings): void
}>()

const { t, locale } = useI18n()
const message = useGlassMessage()
const currentLocale = computed(() => locale.value as LocaleCode)

// Keyring
const keyringInfo = ref<{ type: string; secure: boolean } | null>(null)
const clearing = ref(false)

const loadKeyringInfo = async () => {
  try {
    const result = await backend.command('get_keyring_info')
    if (result.success && result.data?.initialized) {
      keyringInfo.value = result.data
    }
  } catch {
    // ignore
  }
}

const handleClearKeyring = async () => {
  clearing.value = true
  try {
    const result = await backend.command('clear_keyring')
    if (result.success) {
      message.success('Keyring cleared')
      keyringInfo.value = null
    } else {
      message.warning(result.message || 'Failed')
    }
  } catch {
    message.warning('Failed to clear keyring')
  } finally {
    clearing.value = false
  }
}

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
  primary_color: props.settings?.primary_color || '#4A7FD9',
  blur_amount: props.settings?.blur_amount ?? 6,
  background_image: props.settings?.background_image || '',
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

/**
 * 通用 UI 配置更新函数
 * 统一处理 theme 配置的读取、合并与保存
 */
async function updateUiConfig(partialTheme: Partial<{
  mode: string
  primary_color: string
  blur_amount: number
}>) {
  try {
    const uiCfg = (await backend.config.get('ui')).data || {}
    await backend.config.set('ui', {
      ...uiCfg,
      theme: {
        ...uiCfg.theme,
        mode: currentSettings.value.mode,
        primary_color: currentSettings.value.primary_color,
        blur_amount: currentSettings.value.blur_amount,
        ...partialTheme,
      }
    })
  } catch (error) {
    message.error(t('common.error'))
  }
}

const toggleLangOpen = () => {
  isLangOpen.value = !isLangOpen.value
}

const handleThemeChange = async (mode: ThemeMode) => {
  updateField('mode', mode)
  setThemeMode(mode)
  await updateUiConfig({ mode })
}

const handleColorChange = async (color: string) => {
  updateField('primary_color', color)
  setPrimaryColor(color)
  await updateUiConfig({ primary_color: color })
}

const handleColorInput = (e: Event) => {
  handleColorChange((e.target as HTMLInputElement).value)
}

const handleBlurChange = async (e: Event) => {
  const val = parseInt((e.target as HTMLInputElement).value)
  updateField('blur_amount', val)
  setBlurAmount(val)
  await updateUiConfig({ blur_amount: val })
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
      updateField('background_image', result.data.path)
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
  updateField('background_image', val)
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
          updateField('background_image', localPath)
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

useClickOutside(langSelectRef, () => { isLangOpen.value = false })

onMounted(() => {
  loadKeyringInfo()
})

onUnmounted(() => {
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
  gap: var(--s-md);
}

/* 主题选择：60px × 36px 圆角 4px */
.theme-option {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 60px;
  height: 36px;
  border-radius: var(--r-xs);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 150ms ease-out;
  position: relative;
}

.theme-option:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}

/* 浅色选中：边框 + 勾选图标 */
.theme-option.active {
  border-color: var(--primary);
  color: var(--primary);
  background: transparent;
}

/* 深色选中：边框 rgba(255,255,255,0.3) */
[data-theme="dark"] .theme-option.active {
  border-color: rgba(255, 255, 255, 0.3);
}

.theme-option-label {
  font-size: 11px;
  font-weight: 500;
}

.theme-check {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--text-on-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 主题色圆点：20px，间距 12px */
.color-presets {
  display: flex;
  align-items: center;
  gap: 12px;
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
  font-size: 12px;
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
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

/* 浅色：轨道 #E0E0E0 */
.slider-input {
  background: #E0E0E0;
}

/* 深色：轨道 #4A4D55 */
[data-theme="dark"] .slider-input {
  background: #4A4D55;
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

/* 深色：滑块 #6B9EFF */
[data-theme="dark"] .slider-input::-webkit-slider-thumb {
  background: #6B9EFF;
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

/* 开关：非 iOS 风格，32px 宽 20px 高 */
.toggle-switch {
  width: 32px;
  height: 20px;
  border-radius: 16px;
  border: none;
  background: #D0D0D0;
  cursor: pointer;
  position: relative;
  transition: background 150ms ease-out;
  padding: 0;
  flex-shrink: 0;
}

/* 深色模式关闭态 */
[data-theme="dark"] .toggle-switch {
  background: #4A4D55;
}

.toggle-switch.active {
  background: var(--primary);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #FFFFFF;
  transition: transform 150ms ease-out;
}

/* 深色模式关闭态圆球 */
[data-theme="dark"] .toggle-switch:not(.active) .toggle-knob {
  background: rgba(255, 255, 255, 0.3);
}

.toggle-switch.active .toggle-knob {
  transform: translateX(12px);
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

/* 密钥环 */
.text-muted {
  color: var(--text-tertiary);
}

.danger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 20px;
  border-radius: 6px;
  border: 1px solid var(--color-error);
  background: transparent;
  color: var(--color-error);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease-out;
  white-space: nowrap;
}

.danger-btn:hover:not(:disabled) {
  background: var(--color-error);
  color: #fff;
}

.danger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>