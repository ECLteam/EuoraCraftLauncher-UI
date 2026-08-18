<template>
  <Teleport to="body">
    <Transition :name="transitionName" @afterEnter="onAfterEnter" @afterLeave="onAfterLeave">
      <div
        v-show="visible"
        class="modal-overlay"
        role="dialog"
        :aria-modal="true"
        :aria-labelledby="titleId"
        @click.self="handleOverlayClick"
      >
        <div
          ref="modalRef"
          class="modal-container"
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
            <div id="plugin-slot-modal-footer-extra" class="plugin-slot-container"></div>
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
import { ref, computed, watch, nextTick, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { pinia } from '@/app/stores'
import { useLayoutStore } from '@/app/stores/layoutStore'
import UiIcon from '@/components/ui/Icon.vue'

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

const showHeader = computed(() => props.title || props.closable || slots.header)

const keydownHandler = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.visible && props.closable) {
    close()
  }
}

const close = () => {
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
  () => props.visible,
  (val) => {
    if (val) {
      nextTick(() => {
        modalRef.value?.focus()
      })
      document.addEventListener('keydown', keydownHandler)
      if (props.lockScroll) {
        layoutStore.setMainContentScrollLocked(true)
      }
    } else {
      document.removeEventListener('keydown', keydownHandler)
      if (props.lockScroll) {
        layoutStore.setMainContentScrollLocked(false)
      }
    }
  },
  { immediate: true }
)

defineExpose({ close, open })
</script>

<style scoped src="@/styles/components/modals/Modal.css"></style>
