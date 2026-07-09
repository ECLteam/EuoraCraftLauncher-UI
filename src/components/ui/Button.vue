<template>
  <button
    class="ui-btn"
    :class="[
      `btn-${variant}`,
      `btn-${size}`,
      `btn-${shape}`,
      { 'is-loading': loading, 'is-disabled': disabled, 'is-icon-only': icon && !$slots.default }
    ]"
    :disabled="disabled || loading"
    :title="title"
    :aria-busy="loading"
    @click="handleClick"
  >
    <!-- 涟漪效果 -->
    <span
      v-for="ripple in ripples"
      :key="ripple.id"
      class="ripple"
      :style="{ left: ripple.x + 'px', top: ripple.y + 'px' }"
    />
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
import { ref } from 'vue'
import { useButtonFeedback } from '@/composables/useAnimation'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  shape?: 'default' | 'circle' | 'square'
  icon?: string
  loading?: boolean
  disabled?: boolean
  title?: string
}>(), {
  variant: 'primary',
  size: 'md',
  shape: 'default',
  loading: false,
  disabled: false
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const { onClick } = useButtonFeedback()
const ripples = ref<{ x: number; y: number; id: number }[]>([])

// isIconOnly 通过模板中的 $slots.default 判断

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) return
  
  // 创建涟漪效果
  const button = event.currentTarget as HTMLElement
  const rect = button.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const id = Date.now()
  
  ripples.value.push({ x, y, id })
  
  // 动画结束后移除涟漪
  setTimeout(() => {
    ripples.value = ripples.value.filter(r => r.id !== id)
  }, 600)
  
  onClick(event)
  emit('click', event)
}
</script>

<style scoped src="@/styles/Button.css"></style>