<template>
  <Teleport to="body">
    <Transition name="fullscreen-modal" @afterEnter="onAfterEnter" @afterLeave="onAfterLeave">
      <div
        v-show="visible && isActive"
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
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useId, watch } from 'vue'
import { pinia } from '@/app/stores'
import { useLayoutStore } from '@/app/stores/layoutStore'
import { useFullscreenModal } from '@/composables/useFullscreenModal'

defineOptions({ name: 'FullscreenModal' })

const props = withDefaults(defineProps<Props>(), {
  title: '',
  showFooter: true,
  bodyClass: '',
  wrapperClass: '',
  lockScroll: true,
  closable: true,
})

const emit = defineEmits<Emits>()

interface Props {
  visible: boolean
  title?: string
  showFooter?: boolean
  bodyClass?: string
  wrapperClass?: string
  lockScroll?: boolean
  closable?: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'open'): void
  (e: 'opened'): void
  (e: 'closed'): void
}

const fullscreenModal = useFullscreenModal()
const layoutStore = useLayoutStore(pinia)
const modalRef = ref<HTMLElement | null>(null)
const instanceId = useId()
const modalId = `fullscreen-modal-${instanceId}`
const titleId = `fullscreen-modal-title-${instanceId}`
const isActive = computed(() => fullscreenModal.currentId.value === modalId)

const keydownHandler = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.visible && isActive.value && props.closable) {
    close()
  }
}

const requestClose = () => {
  emit('update:visible', false)
  emit('close')
}

const close = () => {
  fullscreenModal.unregister(modalId)
  requestClose()
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
  layoutStore.setModalPageSlideOut(isOpen)
}

const toggleScrollLock = (isOpen: boolean) => {
  layoutStore.setMainContentScrollLocked(isOpen && props.lockScroll)
}

const releasePageLockIfUnused = () => {
  if (fullscreenModal.isVisible.value) return
  toggleScrollLock(false)
  togglePageContent(false)
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      nextTick(() => {
        modalRef.value?.focus()
      })
      document.addEventListener('keydown', keydownHandler)
      toggleScrollLock(true)
      togglePageContent(true)
      fullscreenModal.open(modalId, props.title, requestClose)
    } else {
      document.removeEventListener('keydown', keydownHandler)
      fullscreenModal.unregister(modalId)
      releasePageLockIfUnused()
    }
  },
  { immediate: true }
)

watch(
  () => props.title,
  (title) => {
    if (props.visible && isActive.value) {
      fullscreenModal.open(modalId, title, requestClose)
    }
  }
)

onUnmounted(() => {
  document.removeEventListener('keydown', keydownHandler)
  fullscreenModal.unregister(modalId)
  releasePageLockIfUnused()
})

defineExpose({ close, open })
</script>

<style scoped src="@/styles/components/modals/FullscreenModal.css"></style>
