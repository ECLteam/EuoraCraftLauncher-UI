<template>
  <div class="tab-pane general-settings">
    <SettingSection :title="t('settings.languageRegion')">
      <SettingRow :label="t('settings.language')" :description="t('settings.languageDesc')">
        <NSelect
          class="setting-select"
          :value="currentLocale"
          :options="languageOptions"
          @update:value="handleLanguageUpdate"
        />
      </SettingRow>
    </SettingSection>

    <SettingSection :title="t('settings.appearance')">
      <SettingRow :label="t('settings.theme')" :description="t('settings.themeDesc')">
        <NRadioGroup :value="currentSettings.mode" size="small" @update:value="handleThemeChange">
          <NRadioButton v-for="option in themeOptions" :key="option.value" :value="option.value">
            <span class="theme-option-label">
              <UiIcon :name="option.icon" :size="14" />
              {{ option.label }}
            </span>
          </NRadioButton>
        </NRadioGroup>
      </SettingRow>

      <SettingRow :label="t('settings.primaryColor')" :description="t('settings.primaryColorDesc')">
        <div class="color-presets">
          <button
            v-for="color in presetColors"
            :key="color.value"
            :class="['color-dot', { active: currentSettings.primary_color === color.value }]"
            :style="{ backgroundColor: color.value }"
            :title="color.name"
            type="button"
            @click="handleColorChange(color.value)"
          ></button>
          <label class="custom-color-wrapper" :title="t('settings.primaryColor')">
            <input
              type="color"
              :value="currentSettings.primary_color || DEFAULT_PRIMARY_COLOR"
              class="color-input-native"
              @input="handleColorInput"
            />
            <span class="custom-color-label">+</span>
          </label>
        </div>
      </SettingRow>

      <SettingRow :label="t('settings.topNav')" :description="t('settings.topNavDesc')">
        <NSwitch :value="topNavEnabled" @update:value="toggleTopNav" />
      </SettingRow>
    </SettingSection>

    <SettingSection :title="t('settings.background')">
      <SettingRow :label="t('settings.background')" :description="t('settings.backgroundDesc')">
        <NInputGroup class="background-input-group">
          <NInput
            :value="backgroundInput"
            :placeholder="t('settings.backgroundPlaceholder')"
            clearable
            @update:value="handleBgImageInput"
          />
          <NButton @click="selectLocalImage">{{ t('common.browse') }}</NButton>
        </NInputGroup>
        <input
          ref="showcaseImageInputRef"
          class="visually-hidden-file-input"
          type="file"
          accept="image/*"
          tabindex="-1"
          @change="handleShowcaseImageSelected"
        />
      </SettingRow>

      <SettingRow :label="t('settings.backgroundBrightness')" :description="t('settings.backgroundBrightnessDesc')">
        <div class="slider-control">
          <NSlider :value="bgBrightness" :min="0" :max="100" :tooltip="false" @update:value="handleBrightnessChange" />
          <span>{{ bgBrightness }}%</span>
        </div>
      </SettingRow>

      <SettingRow :label="t('settings.backgroundBlur')" :description="t('settings.backgroundBlurDesc')">
        <div class="slider-control">
          <NSlider :value="blurAmount" :min="0" :max="20" :tooltip="false" @update:value="handleBlurChange" />
          <span>{{ blurAmount }}px</span>
        </div>
      </SettingRow>
    </SettingSection>

    <div id="plugin-slot-settings-general-section-after" class="plugin-slot-container"></div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NInput, NInputGroup, NRadioButton, NRadioGroup, NSelect, NSlider, NSwitch } from 'naive-ui'
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { presetColors, useTheme, type ThemeMode } from '@/composables/useTheme'
import { useTopNav } from '@/composables/useTopNav'
import { DEFAULT_PRIMARY_COLOR, THEME_MODE_OPTIONS } from '@/config/theme'
import { settingsApi } from '@/features/settings/api/settingsApi'
import SettingRow from '@/features/settings/components/SettingRow.vue'
import SettingSection from '@/features/settings/components/SettingSection.vue'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'
import { setLocale, supportedLocales, type LocaleCode } from '@/i18n'

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

const { t, locale } = useI18n()
const message = useGlassMessage()
const { run } = useAsyncAction({
  showSuccess: false,
  showError: true,
  errorMessage: t('common.error'),
})
const settingsStore = useSettingsStore()
const currentLocale = computed(() => locale.value as LocaleCode)

const {
  themeMode,
  primaryColor,
  backgroundImagePath,
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
  mode: themeMode.value,
  primary_color: primaryColor.value,
  blur_amount: blurAmount.value,
  background_image: backgroundImagePath.value,
}))

const bgBrightness = ref(Math.round(backgroundOpacity.value * 100))
const backgroundInput = ref(backgroundImagePath.value)
const showcaseImageInputRef = ref<HTMLInputElement | null>(null)

const themeOptions = computed(() =>
  THEME_MODE_OPTIONS.map((option) => ({
    value: option.value,
    icon: option.icon,
    label: t(`settings.theme${option.value.charAt(0).toUpperCase() + option.value.slice(1)}`),
  }))
)

const languageOptions = computed(() =>
  supportedLocales.map((language) => ({
    label: `${language.flag}  ${language.name}`,
    value: language.code,
  }))
)

async function updateUiConfig(partialTheme: Partial<{ mode: ThemeMode; primary_color: string; blur_amount: number }>) {
  await run(async () =>
    settingsStore.patchUiTheme({
      mode: currentSettings.value.mode,
      primary_color: currentSettings.value.primary_color,
      blur_amount: currentSettings.value.blur_amount,
      ...partialTheme,
    })
  )
}

async function handleThemeChange(mode: ThemeMode) {
  setThemeMode(mode, false)
  await updateUiConfig({ mode })
}

async function handleColorChange(color: string) {
  setPrimaryColor(color, false)
  await updateUiConfig({ primary_color: color })
}

function handleColorInput(event: Event) {
  void handleColorChange((event.target as HTMLInputElement).value)
}

const saveBlur = debounce(async (value: number) => {
  await updateUiConfig({ blur_amount: value })
}, 300)

function handleBlurChange(value: number) {
  setBlurAmount(value, false)
  saveBlur(value)
}

const saveBrightness = debounce(async (value: number) => {
  const opacity = value / 100
  await run(async () => settingsStore.patchUiBackground({ opacity }))
}, 300)

function handleBrightnessChange(value: number) {
  bgBrightness.value = value
  const opacity = value / 100
  setBackgroundOpacity(opacity, false)
  saveBrightness(value)
}

async function selectLocalImage() {
  if (settingsApi.isShowcase) {
    showcaseImageInputRef.value?.click()
    return
  }

  const result = await run(async () => settingsStore.chooseBackgroundImage())
  console.log('[selectLocalImage] choose result:', result)
  if (!result) return
  if (result.imageUrl) {
    console.log('[selectLocalImage] setting background, url length:', result.imageUrl.length)
    setBackgroundImage(result.imageUrl, result.path, false)
    backgroundInput.value = result.path
    message.success(t('common.success'))
  } else {
    console.error('[selectLocalImage] 未获取到图片 URL, path:', result.path)
    message.error('加载背景图失败')
  }
}

function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('读取背景图片失败'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('读取背景图片失败'))
    reader.readAsDataURL(file)
  })
}

async function handleShowcaseImageSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const result = await run(async () => {
    if (!file.type.startsWith('image/')) throw new Error('请选择图片文件')
    const imageUrl = await readImageFile(file)
    const path = `Showcase/${file.name}`
    await settingsStore.patchUiBackground({ type: 'custom', path, image_base64: imageUrl })
    return { imageUrl, path }
  })

  input.value = ''
  if (!result) return
  setBackgroundImage(result.imageUrl, result.path, false)
  backgroundInput.value = result.path
  message.success(t('common.success'))
}

let backgroundSaveTimer: ReturnType<typeof setTimeout> | null = null
function handleBgImageInput(value: string) {
  backgroundInput.value = value
  if (backgroundSaveTimer) clearTimeout(backgroundSaveTimer)
  backgroundSaveTimer = setTimeout(async () => {
    if (!value) {
      setBackgroundImage('', '', false)
      await run(async () => settingsStore.patchUiBackground({ type: 'none', path: '', image_base64: '' }))
      return
    }
    if (!value.startsWith('http')) return

    if (settingsApi.isShowcase) {
      const saved = await run(async () => {
        await settingsStore.patchUiBackground({ type: 'custom', path: value, image_base64: '' })
        return true
      })
      if (!saved) return
      setBackgroundImage(value, value, false)
      message.success(t('common.success'))
      return
    }

    message.loading('Loading...')
    const result = await run(async () => settingsStore.saveRemoteBackground(value))
    if (!result) return
    if (result.imageUrl) {
      setBackgroundImage(result.imageUrl, result.path, false)
      message.success(t('common.success'))
    } else {
      message.error('加载背景图失败')
    }
  }, 800)
}

async function handleLanguageChange(languageCode: LocaleCode) {
  await setLocale(languageCode)
  await run(async () => settingsStore.patchUi({ locale: languageCode }))
}

function handleLanguageUpdate(languageCode: string) {
  void handleLanguageChange(languageCode as LocaleCode)
}

onUnmounted(() => {
  if (backgroundSaveTimer) clearTimeout(backgroundSaveTimer)
})
</script>

<style scoped src="@/styles/views/settings/GeneralTab.css"></style>
