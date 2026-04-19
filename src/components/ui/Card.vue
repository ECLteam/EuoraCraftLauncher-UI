<template>
  <div 
    class="ui-card" 
    :class="{ 'hoverable': hoverable, 'interactive': isInteractive }"
    :role="isInteractive ? 'button' : undefined"
    :tabindex="isInteractive ? 0 : undefined"
    @keydown="handleKeydown"
  >
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <div class="header-content">
          <i v-if="icon" :class="['icon', icon]" />
          <span class="title-text">{{ title }}</span>
        </div>
        <div v-if="$slots.actions" class="header-actions">
          <slot name="actions" />
        </div>
      </slot>
    </div>
    
    <div class="card-body" :class="bodyClass">
      <slot />
    </div>
    
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

const props = defineProps<{
  title?: string
  icon?: string
  hoverable?: boolean
  bodyClass?: string
}>()

const attrs = useAttrs()
const isInteractive = computed(() => typeof attrs.onClick === 'function')

const handleKeydown = (event: KeyboardEvent) => {
  if (!isInteractive.value) return
  
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (typeof attrs.onClick === 'function') {
      attrs.onClick(event)
    }
  }
}
</script>

<style scoped>
.ui-card {
  background-color: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: var(--transition-normal);
}

.ui-card.hoverable:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-light);
}

.ui-card.interactive {
  cursor: pointer;
}

.ui-card.interactive:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--divider-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.title-text {
  line-height: 1.2;
}

.card-body {
  padding: 20px;
  flex: 1;
}

.card-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--divider-color);
  background-color: var(--bg-surface-hover);
}
</style>