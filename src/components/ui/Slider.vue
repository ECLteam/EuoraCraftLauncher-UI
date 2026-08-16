<template>
  <div class="ui-slider" :class="{ 'ui-slider--disabled': disabled }">
    <input
      type="range"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      class="ui-slider-input"
      :disabled="disabled"
      @input="handleInput"
    />
    <span class="ui-slider-value">{{ modelValue }}{{ suffix }}</span>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'UiSlider' })

withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    suffix?: string
    disabled?: boolean
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    suffix: '',
    disabled: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function handleInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)
  emit('update:modelValue', val)
}
</script>

<style scoped src="@/styles/components/ui/Slider.css"></style>
