<template>
  <div class="font-family-control">
    <NSelect
      :value="modelValue"
      :options="options"
      :renderLabel="renderLabel"
      :menuProps="{ style: { maxWidth: 'calc(100vw - 32px)', maxHeight: 'calc(100vh - 32px)' } }"
      to="#app"
      size="small"
      @update:value="handleSelect"
    />
    <div v-if="editing" class="font-family-editor">
      <NInput
        v-model:value="draft"
        size="small"
        :maxlength="80"
        :placeholder="t('settings.fontCustomPlaceholder')"
        @keydown.enter="applyCustom"
        @keydown.esc="cancelCustom"
      />
      <div class="font-family-actions">
        <NButton size="tiny" type="primary" @click="applyCustom">{{ t('settings.fontApply') }}</NButton>
        <NButton size="tiny" @click="cancelCustom">{{ t('settings.fontCancel') }}</NButton>
      </div>
      <span v-if="invalid" class="font-family-error">{{ t('settings.fontCustomInvalid') }}</span>
      <span class="font-family-sample" :style="{ fontFamily: previewFont }">{{ t('settings.fontPreview') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NInput, NSelect, type SelectOption } from 'naive-ui'
import { computed, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { FONT_FAMILY_OPTIONS } from '@/config/theme'
import { normalizeSystemFontName, resolveFontFamily } from '@/utils/fontFamily'

const props = defineProps<{
  modelValue: string
  defaultLabel: string
  defaultFont: string
  fallbackFont: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const customAction = '__ecl_custom_font__;'
const { t } = useI18n()
const editing = ref(false)
const draft = ref('')
const invalid = ref(false)

const options = computed<SelectOption[]>(() => {
  const presets = FONT_FAMILY_OPTIONS.filter((option) => option.value).map((option) => ({
    label: option.name === '等宽字体' ? t('settings.fontPresetMono') : option.name,
    value: option.value,
  }))
  const hasCustomValue = props.modelValue && !FONT_FAMILY_OPTIONS.some((option) => option.value === props.modelValue)
  return [
    { label: props.defaultLabel, value: '' },
    ...presets,
    ...(hasCustomValue ? [{ label: props.modelValue, value: props.modelValue }] : []),
    { label: t('settings.fontCustomAction'), value: customAction },
  ]
})

const previewFont = computed(() => {
  const name = normalizeSystemFontName(draft.value)
  return name ? resolveFontFamily(name, props.fallbackFont) : props.defaultFont
})

function renderLabel(option: SelectOption) {
  const value = String(option.value ?? '')
  const family = value === customAction ? props.defaultFont : resolveFontFamily(value, props.defaultFont)
  return h(
    'span',
    {
      title: String(option.label),
      style: {
        fontFamily: family,
        display: 'block',
        maxWidth: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    },
    String(option.label)
  )
}

function handleSelect(value: string | number) {
  if (value === customAction) {
    draft.value = normalizeSystemFontName(props.modelValue) ?? ''
    invalid.value = false
    editing.value = true
    return
  }
  editing.value = false
  emit('update:modelValue', String(value))
}

function applyCustom() {
  const name = normalizeSystemFontName(draft.value)
  if (!name) {
    invalid.value = true
    return
  }
  emit('update:modelValue', name)
  editing.value = false
  invalid.value = false
}

function cancelCustom() {
  editing.value = false
  invalid.value = false
}
</script>

<style scoped>
.font-family-control {
  width: 100%;
  min-width: 0;
}

.font-family-control :deep(.n-base-selection-label),
.font-family-control :deep(.n-base-selection-input) {
  min-width: 0;
  overflow: hidden;
}

.font-family-editor {
  display: grid;
  min-width: 0;
  gap: 8px;
  padding-top: 8px;
}

.font-family-actions {
  display: flex;
  gap: 8px;
}

.font-family-error {
  color: var(--ecl-error, #d03050);
  font-size: 11px;
}

.font-family-sample {
  overflow: hidden;
  color: var(--ecl-text-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
