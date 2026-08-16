<template>
  <span
    class="ui-avatar"
    :class="{ 'ui-avatar--fallback': !src }"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.42)}px` }"
  >
    <img v-if="src" :src="src" :alt="alt" class="ui-avatar__img" />
    <span v-else class="ui-avatar__initial">{{ initial }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'UiAvatar' })

const props = withDefaults(
  defineProps<{
    src?: string
    name?: string
    size?: number
  }>(),
  {
    src: '',
    name: '',
    size: 34,
  }
)

const initial = computed(() => (props.name || '?').slice(0, 1).toUpperCase())
</script>

<style scoped src="@/styles/components/ui/Avatar.css"></style>