<template>
  <div
    class="ui-progress"
    :class="{ 'ui-progress--processing': processing }"
    :style="{ height: `${height}px` }"
    role="progressbar"
    :aria-valuenow="processing ? undefined : percentage"
    aria-valuemin="0"
    aria-valuemax="100"
  >
    <div class="ui-progress__track">
      <div v-if="!processing" class="ui-progress__bar" :style="{ width: `${clamped}%` }" />
    </div>
    <span v-if="showIndicator && !processing" class="ui-progress__indicator"> {{ clamped }}% </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'UiProgress' })

const props = withDefaults(
  defineProps<{
    percentage?: number
    height?: number
    showIndicator?: boolean
    processing?: boolean
  }>(),
  {
    percentage: 0,
    height: 6,
    showIndicator: false,
    processing: false,
  }
)

const clamped = computed(() => Math.min(100, Math.max(0, Math.round(props.percentage))))
</script>

<style scoped src="@/styles/components/ui/Progress.css"></style>
