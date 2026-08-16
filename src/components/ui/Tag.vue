<template>
  <span class="ui-tag" :class="[`ui-tag--${tone}`, `ui-tag--${size}`, { 'ui-tag--round': round }]">
    <slot />
  </span>
</template>

<script setup lang="ts">
defineOptions({ name: 'UiTag' })

withDefaults(
  defineProps<{
    tone?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
    size?: 'tiny' | 'small' | 'medium'
    round?: boolean
  }>(),
  {
    tone: 'default',
    size: 'small',
    round: false,
  }
)
</script>

<style scoped src="@/styles/components/ui/Tag.css"></style>
