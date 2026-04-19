<template>
  <Teleport to=".main-content">
    <Transition name="modal" @after-enter="onAfterEnter" @after-leave="onAfterLeave">
      <div 
        v-if="visible" 
        class="modal-overlay" 
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? 'modal-title' : undefined"
        @click="handleOverlayClick"
        @keydown="handleKeydown"
      >
        <div class="modal-container" @click.stop ref="modalRef">
          <div class="modal-header" v-if="$slots.header || title">
            <slot name="header">
              <h3 class="modal-title" id="modal-title">{{ title }}</h3>
            </slot>
            <UiButton 
              v-if="closable" 
              variant="ghost"
              shape="circle"
              size="sm"
              icon="icon-close"
              class="modal-close"
              :aria-label="t('modal.close') || '关闭'"
              @click="close"
            />
          </div>
          
          <div class="modal-body">
            <slot></slot>
          </div>
          
          <div class="modal-footer" v-if="$slots.footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import UiButton from '@/components/ui/Button.vue'

interface Props {
  visible: boolean
  title?: string
  closable?: boolean
  maskClosable?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  closable: true,
  maskClosable: false
})

const emit = defineEmits<Emits>()
const { t } = useI18n()
const modalRef = ref<HTMLElement | null>(null)
let lastFocusedElement: HTMLElement | null = null

const close = () => {
  emit('update:visible', false)
  emit('close')
}

const handleOverlayClick = () => {
  if (props.maskClosable) {
    close()
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.closable) {
    event.preventDefault()
    close()
  }
  
  // Tab 键陷阱：保持焦点在模态框内
  if (event.key === 'Tab' && modalRef.value) {
    const focusableElements = modalRef.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length === 0) return
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    if (event.shiftKey && event.target === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && event.target === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }
}

const onAfterEnter = () => {
  lastFocusedElement = document.activeElement as HTMLElement
  
  nextTick(() => {
    if (modalRef.value) {
      // 查找第一个可聚焦元素
      const focusableElements = modalRef.value.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      } else {
        modalRef.value.focus()
      }
    }
  })
}

const onAfterLeave = () => {
  if (lastFocusedElement) {
    lastFocusedElement.focus()
  }
}

watch(() => props.visible, (visible) => {
  if (visible) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  /* 禁止点击穿透 */
  pointer-events: auto;
  outline: none;
}

.modal-container {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  min-width: 400px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.modal-close:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.modal-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

/* 模态框动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all var(--duration-normal) var(--ease-standard);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: translateY(-20px);
}
</style>