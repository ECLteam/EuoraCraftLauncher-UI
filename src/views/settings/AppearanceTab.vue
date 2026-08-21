<template>
  <div class="tab-pane appearance-settings">
    <SettingSection :title="t('settings.appearance')">
      <SettingRow :label="t('settings.theme')" :description="t('settings.themeDesc')">
        <NTabs
          v-if="isFolia"
          :value="currentSettings.mode"
          type="segment"
          size="small"
          @update:value="handleThemeChange"
        >
          <NTab v-for="option in themeOptions" :key="option.value" :name="option.value">
            <span class="theme-option-label">
              <UiIcon :name="option.icon" :size="14" />
              {{ option.label }}
            </span>
          </NTab>
        </NTabs>
        <NRadioGroup v-else :value="currentSettings.mode" size="small" @update:value="handleThemeChange">
          <NRadioButton v-for="option in themeOptions" :key="option.value" :value="option.value">
            <span class="theme-option-label">
              <UiIcon :name="option.icon" :size="14" />
              {{ option.label }}
            </span>
          </NRadioButton>
        </NRadioGroup>
      </SettingRow>

      <SettingRow
        v-if="currentSettings.mode === 'custom'"
        label="配色方案"
        description="从当前主题声明的额外配色中选择（自定义模式）"
      >
        <NSelect
          class="wide-control"
          :value="themeScheme"
          :options="schemeOptions"
          size="small"
          @update:value="handleSchemeChange"
        />
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

      <SettingRow label="可视化主题设计" description="在独立控制台中点选卡片、节点和插件插槽并实时调整外观">
        <NButton type="primary" :loading="themeDesigner.busy" @click="openThemeDesigner"> 打开主题设计控制台 </NButton>
      </SettingRow>

      <SettingRow class="theme-library-setting" label="主题预设库" description="应用、导入或导出多个版本化主题预设">
        <ThemePresetLibrary />
      </SettingRow>
    </SettingSection>

    <SettingSection title="外观细节">
      <SettingRow label="卡片圆角" description="用户级覆盖；未设置时由主题预设决定">
        <div class="slider-control">
          <NSlider :value="radiusCard" :min="0" :max="24" :tooltip="false" @update:value="handleRadiusChange('radius_card', $event)" />
          <span>{{ radiusCard }}px</span>
        </div>
      </SettingRow>
      <SettingRow label="控件圆角" description="按钮、输入框等控件圆角">
        <div class="slider-control">
          <NSlider :value="radiusControl" :min="0" :max="20" :tooltip="false" @update:value="handleRadiusChange('radius_control', $event)" />
          <span>{{ radiusControl }}px</span>
        </div>
      </SettingRow>
      <SettingRow label="对话框圆角" description="弹窗、确认框圆角">
        <div class="slider-control">
          <NSlider :value="radiusDialog" :min="0" :max="28" :tooltip="false" @update:value="handleRadiusChange('radius_dialog', $event)" />
          <span>{{ radiusDialog }}px</span>
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
      <SettingRow label="语义色" description="覆盖主题的成功 / 警告 / 错误 / 信息强调色">
        <div class="semantic-colors">
          <label v-for="field in semanticColorFields" :key="field.key" class="semantic-color-item" :title="field.label">
            <span class="semantic-color-label">{{ field.label }}</span>
            <input type="color" :value="field.value" @input="handleSemanticColorInput(field.key, $event)" />
          </label>
        </div>
      </SettingRow>
      <SettingRow label="减少动效" description="全局压制动画与过渡（系统减少动效偏好也始终生效）">
        <NSwitch :value="reduceMotion" @update:value="handleReduceMotion" />
      </SettingRow>
      <SettingRow label="紧凑密度" description="缩小按钮与输入框高度，提高信息密度">
        <NSwitch :value="compactDensity" @update:value="handleCompactDensity" />
      </SettingRow>
      <SettingRow
        label="自定义 CSS"
        :description="customCssEnabled ? '已启用：注入任意 CSS，可能导致界面异常，请谨慎使用' : '注入自定义 CSS（危险功能，默认关闭）'"
      >
        <NSwitch :value="customCssEnabled" @update:value="handleCustomCssToggle" />
      </SettingRow>
      <SettingRow v-if="customCssEnabled" label="CSS 内容">
        <NInput
          type="textarea"
          :value="customCss"
          placeholder="/* 例如 */&#10;.sidebar { background: hotpink !important; }"
          :autosize="{ minRows: 4, maxRows: 10 }"
          @update:value="handleCustomCssInput"
        />
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

    <SettingSection title="定时自动切换">
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
import { NButton, NInput, NInputGroup, NRadioButton, NRadioGroup, NSelect, NSlider, NSwitch, NTab, NTabs, NTimePicker } from 'naive-ui'
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { presetColors, useTheme, type ThemeMode } from '@/composables/useTheme'
import { useTopNav } from '@/composables/useTopNav'
import { useUiSkin } from '@/composables/useUiSkin'
import { DEFAULT_PRIMARY_COLOR, FONT_FAMILY_OPTIONS, THEME_MODE_OPTIONS } from '@/config/theme'
import PluginSlotHost from '@/features/plugins/slots/PluginSlotHost.vue'
import { settingsApi } from '@/features/settings/api/settingsApi'
import SettingRow from '@/features/settings/components/SettingRow.vue'
import SettingSection from '@/features/settings/components/SettingSection.vue'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'
import ThemePresetLibrary from '@/features/themes/components/ThemePresetLibrary.vue'
import { useThemeDesignerStore } from '@/features/themes/stores/themeDesignerStore'
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
const themeDesigner = useThemeDesignerStore()

const {
  themeMode,
  primaryColor,
  backgroundImagePath,
  setThemeMode,
  setPrimaryColor,
  setBackgroundImage,
  setBlurAmount,
  setBackgroundOpacity,
  setAppearance,
  setSchedule,
  backgroundOpacity,
  blurAmount,
  scheme: themeScheme,
  appearance,
  schedule,
  colors,
} = useTheme()
const { topNavEnabled, toggleTopNav } = useTopNav()
const { isFolia } = useUiSkin()

const currentSettings = computed(() => ({
  mode: themeMode.value,
  primary_color: primaryColor.value,
  blur_amount: blurAmount.value,
  background_image: backgroundImagePath.value,
}))

const bgBrightness = ref(Math.round(backgroundOpacity.value * 100))
const backgroundInput = ref(backgroundImagePath.value)
const showcaseImageInputRef = ref<HTMLInputElement | null>(null)

const customSchemes = computed(() => {
  const preset = themeDesigner.activePreset
  if (!preset) return []
  return Object.keys(preset.schemes)
    .filter((name) => name !== 'light' && name !== 'dark')
    .map((name) => ({ name, label: preset.schemeMeta?.[name]?.label || name }))
})

const themeOptions = computed(() => {
  const options = THEME_MODE_OPTIONS.map((option) => ({
    value: option.value,
    icon: option.icon,
    label: t(`settings.theme${option.value.charAt(0).toUpperCase() + option.value.slice(1)}`),
  }))
  if (customSchemes.value.length) options.push({ value: 'custom', icon: 'palette', label: '自定义' })
  return options
})

const schemeOptions = computed(() => customSchemes.value.map((item) => ({ label: item.label, value: item.name })))

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
  if (mode === 'custom') {
    const first = customSchemes.value[0]
    if (first) themeDesigner.setActiveScheme(first.name)
    return
  }
  setThemeMode(mode, false)
  await updateUiConfig({ mode })
}

function handleSchemeChange(name: string) {
  themeDesigner.setActiveScheme(name)
}

const radiusCard = computed(() => appearance.value.radius_card ?? 8)
const radiusControl = computed(() => appearance.value.radius_control ?? 6)
const radiusDialog = computed(() => appearance.value.radius_dialog ?? 10)
const fontFamilyValue = computed(() => appearance.value.font_family ?? '')
const reduceMotion = computed(() => appearance.value.reduce_motion === true)
const compactDensity = computed(() => appearance.value.compact_density === true)
const customCssEnabled = computed(() => appearance.value.custom_css_enabled === true)
const customCss = computed(() => appearance.value.custom_css ?? '')
const fontOptions = computed(() => [
  ...FONT_FAMILY_OPTIONS.map((option) => ({ label: option.name, value: option.value })),
  ...(fontFamilyValue.value && !FONT_FAMILY_OPTIONS.some((option) => option.value === fontFamilyValue.value)
    ? [{ label: `自定义 (${fontFamilyValue.value})`, value: fontFamilyValue.value }]
    : []),
])
const semanticColorFields = computed(() => [
  { key: 'success_color', label: '成功', value: appearance.value.success_color ?? colors.value.success },
  { key: 'warning_color', label: '警告', value: appearance.value.warning_color ?? colors.value.warning },
  { key: 'error_color', label: '错误', value: appearance.value.error_color ?? colors.value.error },
  { key: 'info_color', label: '信息', value: appearance.value.info_color ?? colors.value.info },
])

function handleRadiusChange(key: keyof ThemeAppearanceConfig, value: number | null) {
  if (typeof value !== 'number') return
  setAppearance({ [key]: Math.round(value) }, true)
}

function handleFontFamilyChange(value: string) {
  setAppearance({ font_family: value || undefined }, true)
}

function handleSemanticColorInput(key: string, event: Event) {
  setAppearance({ [key]: (event.target as HTMLInputElement).value } as Partial<ThemeAppearanceConfig>, true)
}

function handleReduceMotion(value: boolean) {
  setAppearance({ reduce_motion: value }, true)
}

function handleCompactDensity(value: boolean) {
  setAppearance({ compact_density: value }, true)
}

function handleCustomCssToggle(value: boolean) {
  setAppearance({ custom_css_enabled: value }, true)
}

function handleCustomCssInput(value: string) {
  setAppearance({ custom_css: value }, true)
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

async function openThemeDesigner() {
  await run(() => themeDesigner.start())
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
