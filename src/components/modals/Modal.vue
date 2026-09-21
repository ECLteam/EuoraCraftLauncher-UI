<template>
  <Teleport to="body">
    <Transition :name="transitionName" @afterEnter="onAfterEnter" @afterLeave="onAfterLeave">
      <div
        v-show="isVisible"
        class="modal-overlay"
        role="dialog"
        :aria-modal="isVisible"
        :aria-labelledby="titleId"
        @click.self="handleOverlayClick"
      >
        <div
          ref="modalRef"
          class="modal-container"
          data-theme-component="dialog"
          :data-theme-node="`dialog.${type}`"
          :class="[props.wrapperClass, { [`type-${type}`]: true }]"
          :style="props.width ? { width: props.width, maxWidth: props.width } : undefined"
          @click.stop
        >
          <header v-if="showHeader" class="modal-header">
            <div class="header-content">
              <slot name="header">
                <div class="header-title">
                  <UiIcon v-if="iconType" :name="iconType" :size="18" />
                  <h3 :id="titleId" class="modal-title">
                    {{ title }}
                  </h3>
                </div>
              </slot>
            </div>
            <NButton
              v-if="closable && showCloseBtn"
              quaternary
              circle
              size="small"
              class="close-btn"
              :title="t('common.close')"
              @click="close"
            >
              <template #icon><UiIcon name="close" :size="15" /></template>
            </NButton>
          </header>

          <main class="modal-body" :class="bodyClass">
            <slot />
            <slot name="content">
              <p v-if="content" class="modal-content-text">
                {{ content }}
              </p>
            </slot>
          </main>

          <footer v-if="showFooter" class="modal-footer">
            <PluginSlotHost slotId="plugin-slot-modal-footer-extra" class="plugin-slot-container" />
            <slot name="footer">
              <template v-if="type === 'agreement'">
                <NButton @click="handleCancel">
                  {{ cancelText || t('modal.disagree') }}
                </NButton>
                <NButton type="primary" @click="handleConfirm">
                  {{ confirmText || t('modal.agree') }}
                </NButton>
              </template>

              <template v-else-if="type === 'confirm'">
                <NButton @click="handleCancel">
                  {{ cancelText || t('modal.cancel') }}
                </NButton>
                <NButton :type="danger ? 'error' : 'primary'" @click="handleConfirm">
                  {{ confirmText || t('modal.confirm') }}
                </NButton>
              </template>

              <template v-else-if="type === 'alert' || type === 'warning'">
                <NButton :type="type === 'warning' ? 'error' : 'primary'" @click="handleConfirm">
                  {{ confirmText || t('modal.ok') }}
                </NButton>
              </template>
            </slot>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'
import { ref, computed, watch, nextTick, onUnmounted, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { pinia } from '@/app/stores'
import { useLayoutStore } from '@/app/stores/layoutStore'
import UiIcon from '@/components/ui/Icon.vue'
import { GLOBAL_MODAL_PRIORITY, useGlobalModalStack } from '@/composables/useGlobalModalStack'
import PluginSlotHost from '@/features/plugins/slots/PluginSlotHost.vue'

defineOptions({ name: 'Modal' })

const props = withDefaults(defineProps<Props>(), {
  type: 'content',
  title: '',
  content: '',
  confirmText: '',
  cancelText: '',
  closable: true,
  showCloseBtn: true,
  showFooter: true,
  maskClosable: false,
  bodyClass: '',
  wrapperClass: '',
  lockScroll: true,
  danger: false,
  width: '',
  transitionName: 'modal',
  icon: '',
  priority: GLOBAL_MODAL_PRIORITY.interactive,
})

const emit = defineEmits<Emits>()

const slots = defineSlots<{
  default?: () => unknown
  header?: () => unknown
  footer?: () => unknown
  content?: () => unknown
}>()

const { t } = useI18n()
const layoutStore = useLayoutStore(pinia)
const globalModalStack = useGlobalModalStack()

export type ModalType = 'content' | 'agreement' | 'confirm' | 'alert' | 'warning'

interface Props {
  visible: boolean
  type?: ModalType
  title?: string
  content?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  closable?: boolean
  showCloseBtn?: boolean
  showFooter?: boolean
  maskClosable?: boolean
  bodyClass?: string
  wrapperClass?: string
  lockScroll?: boolean
  width?: string
  transitionName?: string
  icon?: string
  /** 由全局模态框栈仲裁；数值越大越优先。 */
  priority?: number
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'open'): void
  (e: 'opened'): void
  (e: 'closed'): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const iconType = computed(() => {
  if (props.icon) return props.icon
  switch (props.type) {
    case 'confirm':
      return 'help'
    case 'alert':
      return 'info'
    case 'warning':
      return 'warning'
    case 'agreement':
      return 'file-text'
    default:
      return ''
  }
})

const modalRef = ref<HTMLElement | null>(null)
const titleId = computed(() => `modal-title-${useId()}`)
const modalId = `modal-${useId()}`
const isVisible = computed(() => props.visible && globalModalStack.activeModalId.value === modalId)

const showHeader = computed(() => props.title || props.closable || slots.header)

const keydownHandler = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isVisible.value && props.closable) {
    close()
  }
}

const close = () => {
  globalModalStack.unregister(modalId)
  emit('update:visible', false)
  emit('close')
}

const open = () => {
  emit('update:visible', true)
  emit('open')
}

const handleConfirm = () => {
  emit('confirm')
  if (props.type !== 'agreement') {
    close()
  }
}

const handleCancel = () => {
  emit('cancel')
  if (props.type !== 'agreement') {
    close()
  }
}

const handleOverlayClick = () => {
  if (props.maskClosable && props.closable) {
    close()
  }
}

const onAfterEnter = () => {
  emit('opened')
}

const onAfterLeave = () => {
  emit('closed')
}

watch(
  [() => props.visible, () => props.priority, () => props.title],
  ([visible, priority, title]) => {
    if (visible) {
      globalModalStack.register({
        id: modalId,
        title,
        priority,
        lockScroll: props.lockScroll,
      })
    } else {
      globalModalStack.unregister(modalId)
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
    layoutStore.setMainContentScrollLocked(locked)
  },
  { immediate: true }
)

onUnmounted(() => {
  document.removeEventListener('keydown', keydownHandler)
  globalModalStack.unregister(modalId)
})

defineExpose({ close, open })
</script>

<style scoped src="@/styles/components/modals/Modal.css"></style>
