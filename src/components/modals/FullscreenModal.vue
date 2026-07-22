<template>
  <Teleport to="body">
    <Transition
      name="fullscreen-modal"
      @afterEnter="onAfterEnter"
      @afterLeave="onAfterLeave"
    >
      <div
        v-show="visible"
        class="fullscreen-modal"
        role="dialog"
        :aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div
          ref="modalRef"
          class="fullscreen-modal-wrapper"
          :class="[props.wrapperClass, props.bodyClass]"
          tabindex="-1"
          @click.stop
        >
          <main class="fullscreen-modal-body">
            <slot />
          </main>

          <footer
            v-if="showFooter"
            class="fullscreen-modal-footer"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, useId, onUnmounted } from 'vue'
import { useFullscreenModal } from '@/composables/useFullscreenModal'

defineOptions({ name: 'FullscreenModal' })

interface Props {
  visible: boolean
  title?: string
  showFooter?: boolean
  bodyClass?: string
  wrapperClass?: string
  lockScroll?: boolean
  closable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showFooter: true,
  bodyClass: '',
  wrapperClass: '',
  lockScroll: true,
  closable: true,
})

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'open'): void
  (e: 'opened'): void
  (e: 'closed'): void
}

const emit = defineEmits<Emits>()

const fullscreenModal = useFullscreenModal()
const modalRef = ref<HTMLElement | null>(null)
const titleId = computed(() => `fullscreen-modal-title-${useId()}`)

const keydownHandler = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.visible && props.closable) {
    close()
  }
}

const close = () => {
  fullscreenModal.close()
  emit('update:visible', false)
  emit('close')
}

const open = () => {
  emit('update:visible', true)
  emit('open')
}

const onAfterEnter = () => {
  emit('opened')
}

const onAfterLeave = () => {
  emit('closed')
}

const togglePageContent = (isOpen: boolean) => {
  const pageContent = document.querySelector('.page-container') as HTMLElement | null
  if (!pageContent) return
  if (isOpen) {
    pageContent.classList.add('modal-page-slide-out')
  } else {
    pageContent.classList.remove('modal-page-slide-out')
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => {
      modalRef.value?.focus()
    })
    document.addEventListener('keydown', keydownHandler)
    if (props.lockScroll) {
      const mainContent = document.querySelector('.main-content') as HTMLElement | null
      if (mainContent) {
        mainContent.style.overflow = 'hidden'
      }
    }
    togglePageContent(true)
    if (props.title) {
      fullscreenModal.open(props.title, close)
    }
  } else {
    document.removeEventListener('keydown', keydownHandler)
    if (props.lockScroll) {
      const mainContent = document.querySelector('.main-content') as HTMLElement | null
      if (mainContent) {
        mainContent.style.overflow = ''
      }
    }
    togglePageContent(false)
    fullscreenModal.reset()
  }
}, { immediate: true })

onUnmounted(() => {
  document.removeEventListener('keydown', keydownHandler)
  if (props.lockScroll) {
    const mainContent = document.querySelector('.main-content') as HTMLElement | null
    if (mainContent) {
      mainContent.style.overflow = ''
    }
  }
  togglePageContent(false)
  fullscreenModal.reset()
})

defineExpose({ close, open })
</script>

<style scoped src="@/styles/components/modals/FullscreenModal.css"></style>