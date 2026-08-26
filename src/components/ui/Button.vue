<template>
  <button
    class="ui-btn"
    :class="[
      `btn-${variant}`,
      `btn-${size}`,
      `btn-${shape}`,
      { 'is-loading': loading, 'is-disabled': disabled, 'is-icon-only': icon && !$slots.default },
    ]"
    :disabled="disabled || loading"
    :title="title"
    :aria-busy="loading"
    @click="handleClick"
  >
    <span v-if="loading" class="loading-spinner">
      <UiIcon name="spinner" :size="16" class="spin" />
    </span>
    <span v-else-if="icon" class="btn-icon">
      <UiIcon :name="icon.replace('icon-', '')" :size="16" />
    </span>
    <span v-if="$slots.default" class="btn-content">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">

defineOptions({ name: 'UiButton' })

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    shape?: 'default' | 'circle' | 'square'
    icon?: string
    loading?: boolean
    disabled?: boolean
    title?: string
  }>(),
  {
    variant: 'primary',
    size: 'md',
    shape: 'default',
    icon: '',
    loading: false,
    disabled: false,
    title: '',
  }
)

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) return
  emit('click', event)
}
</script>

<style scoped src="@/styles/components/ui/Button.css"></style>
