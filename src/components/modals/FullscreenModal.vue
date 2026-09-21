<template>
  <Teleport to="body">
    <Transition name="fullscreen-modal" @afterEnter="onAfterEnter" @afterLeave="onAfterLeave">
      <div v-show="isVisible" class="fullscreen-modal" role="dialog" :aria-modal="isVisible" :aria-labelledby="titleId">
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
import { useGlobalModalStack } from '@/composables/useGlobalModalStack'

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
const globalModalStack = useGlobalModalStack()
const layoutStore = useLayoutStore(pinia)
const modalRef = ref<HTMLElement | null>(null)
const instanceId = useId()
const modalId = `fullscreen-modal-${instanceId}`
const titleId = `fullscreen-modal-title-${instanceId}`
const isActive = computed(() => fullscreenModal.currentId.value === modalId)
const isVisible = computed(() => props.visible && isActive.value)

const keydownHandler = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isVisible.value && props.closable) {
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
      fullscreenModal.open(modalId, props.title, requestClose)
    } else {
      fullscreenModal.unregister(modalId)
    }
  },
  { immediate: true }
)

watch(
  isVisible,
  (visible) => {
    if (visible) {
      nextTick(() => {
        modalRef.value?.focus()
      })
      document.addEventListener('keydown', keydownHandler)
    } else {
      document.removeEventListener('keydown', keydownHandler)
    }
  },
  { immediate: true }
)

watch(
  globalModalStack.isScrollLocked,
  (locked) => {
    toggleScrollLock(locked)
  },
  { immediate: true }
)

watch(
  globalModalStack.isFullscreenActive,
  (visible) => {
    togglePageContent(visible)
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
