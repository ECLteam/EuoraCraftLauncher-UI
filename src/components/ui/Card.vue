<template>
  <div 
    class="ui-card" 
    :class="{ 'hoverable': hoverable, 'interactive': isInteractive }"
    :role="isInteractive ? 'button' : undefined"
    :tabindex="isInteractive ? 0 : undefined"
    @keydown="handleKeydown"
  >
    <div
      v-if="$slots.header || title"
      class="card-header"
    >
      <slot name="header">
        <div class="header-content">
          <i
            v-if="icon"
            :class="['icon', icon]"
          />
          <span class="title-text">{{ title }}</span>
        </div>
        <div
          v-if="$slots.actions"
          class="header-actions"
        >
          <slot name="actions" />
        </div>
      </slot>
    </div>
    
    <div
      class="card-body"
      :class="bodyClass"
    >
      <slot />
    </div>
    
    <div
      v-if="$slots.footer"
      class="card-footer"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'UiCard' })

const props = defineProps<{
  title?: string
  icon?: string
  hoverable?: boolean
  interactive?: boolean
  bodyClass?: string
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const isInteractive = computed(() => props.interactive || false)

const handleKeydown = (event: KeyboardEvent) => {
  if (!isInteractive.value) return
  
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    emit('click', event as unknown as MouseEvent)
  }
}
</script>

<style scoped src="@/styles/components/ui/Card.css"></style>