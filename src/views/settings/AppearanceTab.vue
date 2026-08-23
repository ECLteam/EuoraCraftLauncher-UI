<template>
  <div class="tab-pane appearance-settings">
    <SettingSection :title="t('settings.appearanceSectionTheme')">
      <SettingRow :label="t('settings.themeStyle')" :description="t('settings.themeDesc')">
        <NTabs :value="themeId" type="segment" size="small" @update:value="handleThemeIdChange">
          <NTab v-for="option in builtinThemeOptions" :key="option.id" :name="option.id">
            <span class="theme-option-label">
              <UiIcon :name="option.icon" :size="14" />
              {{ option.label }}
            </span>
          </NTab>
        </NTabs>
      </SettingRow>

      <SettingRow label="亮暗模式" description="选择亮暗显示模式（跟随系统时按系统偏好自动切换）">
        <NTabs :value="currentSettings.mode" type="segment" size="small" @update:value="handleThemeChange">
          <NTab v-for="option in themeOptions" :key="option.value" :name="option.value">
            <span class="theme-option-label">
              <UiIcon :name="option.icon" :size="14" />
              {{ option.label }}
            </span>
          </NTab>
        </NTabs>
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

      <SettingRow :label="t('settings.themeFromBackground')" :description="t('settings.themeFromBackgroundDesc')">
        <NSelect
          class="setting-select"
          :value="deriveMode"
          :options="deriveModeOptions"
          @update:value="handleDeriveModeChange"
        />
      </SettingRow>
    </SettingSection>

    <SettingSection :title="t('settings.appearanceSectionLayout')">
      <SettingRow :label="t('settings.topNav')" :description="t('settings.topNavDesc')">
        <NSwitch :value="topNavEnabled" @update:value="toggleTopNav" />
      </SettingRow>
    </SettingSection>

    <SettingSection v-if="themeId === 'folia'" :title="t('settings.appearanceSectionEffects')">
      <SettingRow :label="t('settings.auroraBackground')" :description="t('settings.auroraBackgroundDesc')">
        <NSwitch :value="auroraEnabled" @update:value="handleAuroraEnabledChange" />
      </SettingRow>
      <SettingRow :label="t('settings.backgroundBlurLayer')" :description="t('settings.backgroundBlurLayerDesc')">
        <NSwitch :value="blurLayerEnabled" @update:value="handleBlurLayerEnabledChange" />
      </SettingRow>
    </SettingSection>

    <SettingSection :title="t('settings.appearanceSectionDetails')">
      <SettingRow label="卡片圆角" description="用户级覆盖；未设置时由主题预设决定">
        <div class="slider-control">
          <NSlider
            :value="radiusCard"
            :min="0"
            :max="24"
            :tooltip="false"
            @update:value="handleRadiusChange('radius_card', $event)"
          />
          <span>{{ radiusCard }}px</span>
        </div>
      </SettingRow>
      <SettingRow label="控件圆角" description="按钮、输入框等控件圆角">
        <div class="slider-control">
          <NSlider
            :value="radiusControl"
            :min="0"
            :max="20"
            :tooltip="false"
            @update:value="handleRadiusChange('radius_control', $event)"
          />
          <span>{{ radiusControl }}px</span>
        </div>
      </SettingRow>
      <SettingRow label="对话框圆角" description="弹窗、确认框圆角">
        <div class="slider-control">
          <NSlider
            :value="radiusDialog"
            :min="0"
            :max="28"
            :tooltip="false"
            @update:value="handleRadiusChange('radius_dialog', $event)"
          />
          <span>{{ radiusDialog }}px</span>
        </div>
      </SettingRow>
      <SettingRow :label="t('settings.cardOpacity')" :description="t('settings.cardOpacityDesc')">
        <div class="slider-control">
          <NSlider
            :value="cardOpacity"
            :min="CARD_OPACITY_MIN"
            :max="CARD_OPACITY_MAX"
            :tooltip="false"
            @update:value="handleCardOpacityChange"
          />
          <span>{{ cardOpacity }}%</span>
        </div>
      </SettingRow>
      <SettingRow label="界面字体" description="覆盖界面默认字体（系统默认 / 预设字体栈）">
        <NSelect
          class="wide-control"
          :value="fontFamilyValue"
          :options="fontOptions"
          size="small"
          placeholder="系统默认"
          @update:value="handleFontFamilyChange"
        />
      </SettingRow>
    </SettingSection>

    <SettingSection :title="t('settings.background')">
      <SettingRow :label="t('settings.backgroundMode')" :description="t('settings.backgroundModeDesc')">
        <NTabs :value="bgMode" type="segment" size="small" @update:value="handleBgModeChange">
          <NTab v-for="option in bgModeOptions" :key="option.value" :name="option.value">
            {{ option.label }}
          </NTab>
        </NTabs>
      </SettingRow>

      <SettingRow
        v-if="bgMode === 'single'"
        :label="t('settings.background')"
        :description="t('settings.backgroundDesc')"
      >
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

      <template v-else>
        <SettingRow :label="t('settings.backgroundSource')">
          <div class="folder-source-control">
            <span class="folder-source-path" :title="bgFolderPath">
              {{ bgFolderPath || t('settings.backgroundSourceEmpty') }}
            </span>
            <NButton size="small" @click="selectBackgroundFolder">{{ t('settings.selectFolder') }}</NButton>
          </div>
        </SettingRow>
        <SettingRow :label="t('settings.carouselInterval')" :description="t('settings.carouselIntervalDesc')">
          <div class="slider-control">
            <NSlider :value="bgInterval" :min="5" :max="60" :tooltip="false" @update:value="handleBgIntervalChange" />
            <span>{{ bgInterval }} {{ t('settings.carouselIntervalUnit') }}</span>
          </div>
        </SettingRow>
      </template>

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

    <SettingSection :title="t('settings.appearanceSectionSchedule')">
      <SettingRow label="启用定时切换" description="仅在「跟随系统」模式下生效：按时间窗口强制亮暗，忽略系统偏好">
        <NSwitch :value="scheduleEnabled" @update:value="handleScheduleEnable" />
      </SettingRow>
      <SettingRow v-if="scheduleEnabled" label="深色时段">
        <div class="schedule-row">
          <NTimePicker
            :value="scheduleStart"
            class="schedule-time"
            format="HH:mm"
            size="small"
            @update:value="handleScheduleTime('dark_start', $event)"
          />
          <span class="schedule-sep">至</span>
          <NTimePicker
            :value="scheduleEnd"
            class="schedule-time"
            format="HH:mm"
            size="small"
            @update:value="handleScheduleTime('dark_end', $event)"
          />
        </div>
      </SettingRow>
    </SettingSection>

    <PluginSlotHost slotId="plugin-slot-settings-appearance-section-after" class="plugin-slot-container" />
  </div>
</template>

<script setup lang="ts">
import { NButton, NInput, NInputGroup, NSelect, NSlider, NSwitch, NTab, NTabs, NTimePicker } from 'naive-ui'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { presetColors, useTheme, type ThemeMode } from '@/composables/useTheme'
import { useTopNav } from '@/composables/useTopNav'
import {
  BUILTIN_THEMES,
  CARD_OPACITY_DEFAULT,
  CARD_OPACITY_MAX,
  CARD_OPACITY_MIN,
  DEFAULT_PRIMARY_COLOR,
  FONT_FAMILY_OPTIONS,
  THEME_MODE_OPTIONS,
} from '@/config/theme'
import PluginSlotHost from '@/features/plugins/slots/PluginSlotHost.vue'
import { settingsApi } from '@/features/settings/api/settingsApi'
import SettingRow from '@/features/settings/components/SettingRow.vue'
import SettingSection from '@/features/settings/components/SettingSection.vue'
import type { BackgroundMode } from '@/features/settings/model/backgroundMode'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'
import type { ThemeAppearanceConfig } from '@/types/api'

function debounce<A extends unknown[]>(fn: (...args: A) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: A) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

const { t } = useI18n()
const message = useLauncherMessage()
const { run } = useAsyncAction({
  showSuccess: false,
  showError: true,
  errorMessage: t('common.error'),
})
const settingsStore = useSettingsStore()

const {
  themeId,
  themeMode,
  primaryColor,
  auroraEnabled,
  blurLayerEnabled,
  deriveMode,
  backgroundImagePath,
  bgMode,
  bgFolderPath,
  bgInterval,
  setThemeId,
  setThemeMode,
  setPrimaryColor,
  setBackgroundImage,
  setBlurAmount,
  setBackgroundOpacity,
  setAppearance,
  setSchedule,
  setAuroraEnabled,
  setBlurLayerEnabled,
  setDeriveMode,
  setBgMode,
  setBgInterval,
  applyBackgroundFolder,
  backgroundOpacity,
  blurAmount,
  appearance,
  schedule,
} = useTheme()
const { topNavEnabled, toggleTopNav } = useTopNav()

const deriveModeOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: t('settings.themeDeriveOff'), value: 'off' },
  { label: t('settings.themeDeriveDefault'), value: 'default' },
  { label: t('settings.themeDeriveMonet'), value: 'monet' },
])

const currentSettings = computed(() => ({
  mode: themeMode.value,
  primary_color: primaryColor.value,
  blur_amount: blurAmount.value,
  background_image: backgroundImagePath.value,
}))

const bgBrightness = ref(Math.round(backgroundOpacity.value * 100))
const backgroundInput = ref(backgroundImagePath.value)
const showcaseImageInputRef = ref<HTMLInputElement | null>(null)

const bgModeOptions = computed<Array<{ value: BackgroundMode; label: string }>>(() => [
  { value: 'single', label: t('settings.backgroundModeSingle') },
  { value: 'carousel', label: t('settings.backgroundModeCarousel') },
  { value: 'random', label: t('settings.backgroundModeRandom') },
])

// 从轮播切回单张时，把输入框重置为单张图片路径（避免残留文件夹路径）
watch(bgMode, (mode) => {
  if (mode === 'single') backgroundInput.value = backgroundImagePath.value
})

const themeOptions = computed(() =>
  THEME_MODE_OPTIONS.map((option) => ({
    value: option.value,
    icon: option.icon,
    label: t(`settings.theme${option.value.charAt(0).toUpperCase() + option.value.slice(1)}`),
  }))
)

const builtinThemeOptions = computed(() =>
  BUILTIN_THEMES.map((option) => ({
    id: option.id,
    icon: option.icon,
    label: t(`settings.theme${option.id.charAt(0).toUpperCase() + option.id.slice(1)}`),
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

function handleThemeIdChange(id: string | number) {
  const value = String(id)
  if (value !== 'classic' && value !== 'folia') return
  setThemeId(value, false)
  void run(async () => settingsStore.patchUiTheme({ theme_id: value }))
}

function handleAuroraEnabledChange(value: boolean) {
  setAuroraEnabled(value)
}

function handleBlurLayerEnabledChange(value: boolean) {
  setBlurLayerEnabled(value)
}

async function handleDeriveModeChange(value: string | number) {
  const mode: 'off' | 'default' | 'monet' = value === 'default' || value === 'monet' ? value : 'off'
  await setDeriveMode(mode)
}

const radiusCard = computed(() => appearance.value.radius_card ?? 8)
const radiusControl = computed(() => appearance.value.radius_control ?? 6)
const radiusDialog = computed(() => appearance.value.radius_dialog ?? 10)
const cardOpacity = computed(() => appearance.value.card_opacity ?? CARD_OPACITY_DEFAULT)
const fontFamilyValue = computed(() => appearance.value.font_family ?? '')
const fontOptions = computed(() => [
  ...FONT_FAMILY_OPTIONS.map((option) => ({ label: option.name, value: option.value })),
  ...(fontFamilyValue.value && !FONT_FAMILY_OPTIONS.some((option) => option.value === fontFamilyValue.value)
    ? [{ label: `自定义 (${fontFamilyValue.value})`, value: fontFamilyValue.value }]
    : []),
])

function handleRadiusChange(key: keyof ThemeAppearanceConfig, value: number | null) {
  if (typeof value !== 'number') return
  setAppearance({ [key]: Math.round(value) }, true)
}

function handleCardOpacityChange(value: number | null) {
  if (typeof value !== 'number') return
  setAppearance({ card_opacity: Math.round(value) }, true)
}

function handleFontFamilyChange(value: string) {
  setAppearance({ font_family: value || undefined }, true)
}

function handleBgModeChange(value: string | number) {
  const mode: BackgroundMode = value === 'random' ? 'random' : value === 'carousel' ? 'carousel' : 'single'
  setBgMode(mode)
  void run(async () => {
    if (mode === 'single') {
      await settingsStore.patchUiBackground({ mode, path: backgroundImagePath.value })
    } else {
      await settingsStore.patchUiBackground({ mode })
    }
  })
}

function handleBgIntervalChange(value: number | null) {
  if (typeof value !== 'number') return
  const seconds = Math.round(value)
  setBgInterval(seconds)
  void run(async () => settingsStore.patchUiBackground({ interval: seconds }))
}

async function selectBackgroundFolder() {
  if (settingsApi.isShowcase) {
    message.error(t('settings.carouselShowcaseNotSupported'))
    return
  }
  const path = await settingsApi.selectDirectory()
  if (!path) return
  const files = await settingsApi.listBackgroundImages(path)
  if (!files.length) {
    message.error(t('settings.carouselNoImages'))
    return
  }
  const mode: BackgroundMode = bgMode.value === 'random' ? 'random' : 'carousel'
  await run(async () => {
    await applyBackgroundFolder(path, files, mode)
    await settingsStore.patchUiBackground({ type: 'custom', path, mode, interval: Math.round(bgInterval.value) })
  })
  message.success(t('common.success'))
}

const scheduleEnabled = computed(() => schedule.value.enabled === true)
function handleScheduleEnable(value: boolean) {
  setSchedule({ enabled: value }, true)
}
function minutesStringToTimestamp(value: string | undefined): number | null {
  if (!value) return null
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  return new Date(2000, 0, 1, Number(match[1]), Number(match[2]), 0, 0).getTime()
}
function timeToMinutesString(timestamp: number | null): string | undefined {
  if (timestamp == null) return undefined
  const date = new Date(timestamp)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
const scheduleStart = computed(() => minutesStringToTimestamp(schedule.value.dark_start))
const scheduleEnd = computed(() => minutesStringToTimestamp(schedule.value.dark_end))
function handleScheduleTime(key: 'dark_start' | 'dark_end', timestamp: number | null) {
  setSchedule({ [key]: timeToMinutesString(timestamp) }, true)
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
  if (!result) return
  if (result.imageUrl) {
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

    const loadingMessage = message.loading('Loading...')
    try {
      const result = await run(async () => settingsStore.saveRemoteBackground(value))
      if (!result) return
      if (result.imageUrl) {
        setBackgroundImage(result.imageUrl, result.path, false)
        message.success(t('common.success'))
      } else {
        message.error('加载背景图失败')
      }
    } finally {
      loadingMessage.destroy()
    }
  }, 800)
}

onUnmounted(() => {
  if (backgroundSaveTimer) clearTimeout(backgroundSaveTimer)
})
</script>

<style scoped src="@/styles/views/settings/AppearanceTab.css"></style>
