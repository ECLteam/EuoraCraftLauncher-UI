<template>
  <div class="tab-pane">
    <!-- 外观 -->
    <div class="settings-section">
      <div class="section-label">
        {{ t('settings.appearance') }}
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">
            {{ t('settings.theme') }}
          </div>
          <div class="setting-desc">
            {{ t('settings.themeDesc') }}
          </div>
        </div>
        <div class="setting-control">
          <div class="theme-options">
            <div
              v-for="opt in themeOptions"
              :key="opt.value"
              :class="['theme-option', { active: currentSettings.mode === opt.value }]"
              @click="handleThemeChange(opt.value as ThemeMode)"
            >
              <UiIcon
                :name="opt.icon"
                :size="18"
              />
              <span class="theme-option-label">{{ opt.label }}</span>
              <UiIcon
                v-if="currentSettings.mode === opt.value"
                name="check"
                :size="14"
                class="theme-check"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">
            {{ t('settings.primaryColor') }}
          </div>
          <div class="setting-desc">
            {{ t('settings.primaryColorDesc') }}
          </div>
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
            />
            <div class="custom-color-wrapper">
              <input
                type="color"
                :value="currentSettings.primary_color"
                class="color-input-native"
                @input="handleColorInput"
              >
              <span class="custom-color-label">+</span>
            </div>
          </div>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">
            {{ t('settings.background') }}
          </div>
          <div class="setting-desc">
            {{ t('settings.backgroundDesc') }}
          </div>
        </div>
        <div class="setting-control">
          <div class="bg-input-group">
            <input
              type="text"
              :value="currentSettings.background_image"
              :placeholder="t('settings.backgroundPlaceholder')"
              class="text-input"
              @input="handleBgImageInput"
            >
            <button
              class="btn-ghost"
              @click="selectLocalImage"
            >
              {{ t('common.browse') }}
            </button>
          </div>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">
            {{ t('settings.backgroundBrightness') }}
          </div>
          <div class="setting-desc">
            {{ t('settings.backgroundBrightnessDesc') }}
          </div>
        </div>
        <div class="setting-control">
          <UiSlider
            v-model="bgBrightness"
            :min="0"
            :max="100"
            suffix="%"
            @update:modelValue="handleBrightnessChange"
          />
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">
            {{ t('settings.backgroundBlur') }}
          </div>
          <div class="setting-desc">
            {{ t('settings.backgroundBlurDesc') }}
          </div>
        </div>
        <div class="setting-control">
          <UiSlider
            v-model="blurAmount"
            :min="0"
            :max="20"
            suffix="px"
            @update:modelValue="handleBlurChange"
          />
        </div>
      </div>
    </div>

    <!-- 语言与交互 -->
    <div class="settings-section">
      <div class="section-label">
        {{ t('settings.languageRegion') }}
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">
            {{ t('settings.language') }}
          </div>
          <div class="setting-desc">
            {{ t('settings.languageDesc') }}
          </div>
        </div>
        <div class="setting-control">
          <div
            ref="langSelectRef"
            class="custom-select"
            :class="{ open: isLangOpen }"
          >
            <div
              class="select-trigger"
              @click="toggleLangOpen"
            >
              <span class="selected-text">
                <span class="lang-option">
                  <span class="lang-flag">{{ selectedLanguage?.flag }}</span>
                  <span class="lang-name">{{ selectedLanguage?.name }}</span>
                </span>
              </span>
              <UiIcon
                name="chevron-down"
                class="select-arrow"
                :class="{ rotated: isLangOpen }"
                :size="14"
              />
            </div>
            <Transition name="select-dropdown">
              <div
                v-show="isLangOpen"
                class="select-dropdown"
              >
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
                  <UiIcon
                    v-if="currentLocale === lang.code"
                    name="check"
                    :size="14"
                    class="check-icon"
                  />
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-label">
            {{ t('settings.topNav') }}
          </div>
          <div class="setting-desc">
            {{ t('settings.topNavDesc') }}
          </div>
        </div>
        <div class="setting-control">
          <button
            :class="['toggle-switch', { active: topNavEnabled }]"
            role="switch"
            :aria-checked="topNavEnabled"
            @click="toggleTopNav"
          >
            <span class="toggle-knob" />
          </button>
        </div>
      </div>
    </div>

    <div
      id="plugin-slot-settings-general-section-after"
      class="plugin-slot-container"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import UiIcon from '@/components/ui/Icon.vue'
import UiSlider from '@/components/ui/Slider.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useClickOutside } from '@/composables/useClickOutside'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { useTheme, type ThemeMode, presetColors } from '@/composables/useTheme'
import { useTopNav } from '@/composables/useTopNav'
import { THEME_MODE_OPTIONS } from '@/config/theme'
import { supportedLocales, setLocale, type LocaleCode } from '@/i18n'
import type { UiConfig } from '@/types/api'

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
const { run } = useAsyncAction({ showSuccess: false, showError: true, errorMessage: t('common.error') })
const currentLocale = computed(() => locale.value as LocaleCode)

const {
  setThemeMode,
  setPrimaryColor,
  setBackgroundImage,
  setBlurAmount,
  setBackgroundOpacity,
  backgroundOpacity,
  blurAmount,
} = useTheme()
const { topNavEnabled, toggleTopNav } = useTopNav()

const currentSettings = computed(() => ({
  mode: props.settings?.mode ?? '',
  primary_color: props.settings?.primary_color ?? '',
  blur_amount: props.settings?.blur_amount,
  background_image: props.settings?.background_image ?? '',
}))

const bgBrightness = ref(Math.round(backgroundOpacity.value * 100))

const themeOptions = computed(() =>
  THEME_MODE_OPTIONS.map(opt => ({
    value: opt.value,
    icon: opt.icon,
    label: t(`settings.theme${opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}`),
  }))
)

const isLangOpen = ref(false)
const langSelectRef = ref<HTMLElement | null>(null)

const selectedLanguage = computed(() =>
  supportedLocales.find(l => l.code === currentLocale.value)
)

const updateField = (field: keyof GeneralSettings, value: string | number | boolean) => {
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
  const uiRes = await backend.config.get<UiConfig>('ui')
  if (!uiRes.success) return
  const uiCfg = uiRes.data || {}
  await run(async () => backend.config.set('ui', {
    ...uiCfg,
    theme: {
      ...uiCfg.theme,
      mode: currentSettings.value.mode,
      primary_color: currentSettings.value.primary_color,
      blur_amount: currentSettings.value.blur_amount,
      ...partialTheme,
    }
  }))
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

const handleBlurChange = async (val: number) => {
  updateField('blur_amount', val)
  setBlurAmount(val)
  await updateUiConfig({ blur_amount: val })
}

const handleBrightnessChange = async (val: number) => {
  bgBrightness.value = val
  const opacity = val / 100
  setBackgroundOpacity(opacity)
  const uiRes = await backend.config.get<UiConfig>('ui')
  if (!uiRes.success) return
  const uiCfg = uiRes.data || {}
  await run(async () => backend.config.set('ui', {
    ...uiCfg,
    background: { ...(uiCfg.background || {}), opacity }
  }))
}

const selectLocalImage = async () => {
  const result = await run(async () => backend.command('select_image'))
  if (!result?.success || !result.data?.path) return

  updateField('background_image', result.data.path)
  const uiCfg = (await backend.config.get<UiConfig>('ui')).data || {}
  await backend.config.set('ui', { ...uiCfg, background: { ...(uiCfg.background || {}), type: 'custom', path: result.data.path } })
  const imgData = await backend.command('image_read_file', { path: result.data.path })
  const imageUrl = imgData.data?.base64 || imgData.data?.dataUrl
  if (imgData.success && imageUrl) {
    setBackgroundImage(imageUrl, result.data.path)
  }
  message.success(t('common.success'))
}

let bgTimer: ReturnType<typeof setTimeout> | null = null
const handleBgImageInput = (e: Event) => {
  const val = (e.target as HTMLInputElement).value
  updateField('background_image', val)
  if (bgTimer) clearTimeout(bgTimer)
  bgTimer = setTimeout(async () => {
    if (!val) {
      setBackgroundImage('', '')
      const uiNone = (await backend.config.get<UiConfig>('ui')).data || {}
      await backend.config.set('ui', { ...uiNone, background: { type: 'none', path: '' } })
      return
    }
    if (!val.startsWith('http')) return

    message.loading('Loading...')
    const result = await run(async () => backend.command('image_save_url', { url: val }))
    if (!result?.success || !result.data?.path) return

    const localPath = result.data.path
    const uiCfg2 = (await backend.config.get<UiConfig>('ui')).data || {}
    await backend.config.set('ui', { ...uiCfg2, background: { type: 'custom', path: localPath } })
    updateField('background_image', localPath)
    const imgData = await backend.command('image_read_file', { path: localPath })
    const imageUrl = imgData.data?.base64 || imgData.data?.dataUrl
    if (imgData.success && imageUrl) {
      setBackgroundImage(imageUrl, localPath)
      message.success(t('common.success'))
    } else {
      message.error('加载背景图失败: ' + imgData.message)
    }
  }, 800)
}

const handleLanguageChange = async (langCode: LocaleCode) => {
  isLangOpen.value = false
  await setLocale(langCode)
  const uiRes = await backend.config.get('ui')
  if (!uiRes.success) return
  const uiCfg = uiRes.data || {}
  await run(async () => backend.config.set('ui', { ...uiCfg, locale: langCode }))
}

useClickOutside(langSelectRef, () => { isLangOpen.value = false })

onUnmounted(() => {
  if (bgTimer) clearTimeout(bgTimer)
})
</script>

<style scoped src="@/styles/views/settings/GeneralTab.css"></style>

