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

<style scoped src="@/styles/Modal.css"></style>