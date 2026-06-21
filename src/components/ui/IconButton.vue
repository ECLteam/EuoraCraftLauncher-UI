<template>
  <button
    class="icon-btn"
    :class="[
      `icon-btn--${variant}`,
      `icon-btn--${size}`,
      { 'is-loading': loading },
      { 'has-bg': background }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <!-- 水波纹效果 -->
    <span
      v-for="ripple in ripples"
      :key="ripple.id"
      class="ripple"
      :style="{
        left: ripple.x + 'px',
        top: ripple.y + 'px'
      }"
    />
    
    <!-- 加载状态 -->
    <span v-if="loading" class="icon-btn__loader">
      <UiIcon name="loading" :size="16" />
    </span>
    
    <!-- 图标 -->
    <span v-else-if="props.icon" class="icon-btn__icon">
      <UiIcon :name="iconName" :size="16" :class="iconClasses" />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  /** 图标名称或类名 */
  icon?: string
  /** 按钮变体 */
  variant?: 'default' | 'primary' | 'danger' | 'ghost'
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 是否显示背景 */
  background?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 是否加载中 */
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  icon: '',
  variant: 'default',
  size: 'md',
  background: false,
  disabled: false,
  loading: false
})

const iconName = computed(() => {
  return props.icon.split(' ')[0].replace(/^icon-/, '')
})

const iconClasses = computed(() => {
  return props.icon.split(' ').slice(1)
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

// 水波纹效果
const ripples = ref<Array<{ x: number; y: number; id: number }>>([])

const handleClick = (event: MouseEvent) => {
  if (props.disabled || props.loading) return
  
  // 创建水波纹
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const id = Date.now()
  
  ripples.value.push({ x, y, id })
  
  // 移除水波纹
  setTimeout(() => {
    ripples.value = ripples.value.filter(r => r.id !== id)
  }, 600)
  
  emit('click', event)
}
</script>

<style scoped src="@/styles/IconButton.css"></style>
