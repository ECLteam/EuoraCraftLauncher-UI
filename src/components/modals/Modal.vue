<template>
  <Teleport to="body">
    <Transition
      name="modal"
      @afterEnter="onAfterEnter"
      @afterLeave="onAfterLeave"
    >
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
          <header
            v-if="showHeader"
            class="modal-header"
          >
            <div class="header-content">
              <slot name="header">
                <div class="header-title">
                  <i
                    v-if="iconType"
                    :class="['icon', iconType]"
                  />
                  <h3
                    :id="titleId"
                    class="modal-title"
                  >
                    {{ title }}
                  </h3>
                </div>
              </slot>
            </div>
            <UiButton
              v-if="closable && showCloseBtn"
              variant="ghost"
              shape="circle"
              size="sm"
              icon="icon-close"
              class="close-btn"
              :title="t('common.close')"
              @click="close"
            />
          </header>

          <main
            class="modal-body"
            :class="bodyClass"
          >
            <slot />
            <slot name="content">
              <p
                v-if="content"
                class="modal-content-text"
              >
                {{ content }}
              </p>
            </slot>
          </main>

          <footer
            v-if="showFooter"
            class="modal-footer"
          >
            <slot name="footer">
              <template v-if="type === 'agreement'">
                <UiButton
                  variant="secondary"
                  @click="handleCancel"
                >
                  {{ cancelText || t('modal.disagree') }}
                </UiButton>
                <UiButton
                  variant="primary"
                  @click="handleConfirm"
                >
                  {{ confirmText || t('modal.agree') }}
                </UiButton>
              </template>

              <template v-else-if="type === 'confirm'">
                <UiButton
                  variant="secondary"
                  @click="handleCancel"
                >
                  {{ cancelText || t('modal.cancel') }}
                </UiButton>
                <UiButton
                  :variant="danger ? 'danger' : 'primary'"
                  @click="handleConfirm"
                >
                  {{ confirmText || t('modal.confirm') }}
                </UiButton>
              </template>

              <template v-else-if="type === 'alert' || type === 'warning'">
                <UiButton
                  :variant="type === 'warning' ? 'danger' : 'primary'"
                  @click="handleConfirm"
                >
                  {{ confirmText || t('modal.ok') }}
                </UiButton>
              </template>
            </slot>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import UiButton from '@/components/ui/Button.vue'

const { t } = useI18n()

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
}

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
})

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'open'): void
  (e: 'opened'): void
  (e: 'closed'): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

const iconType = computed(() => {
  switch (props.type) {
    case 'confirm': return 'icon-help-circle'
    case 'alert': return 'icon-info'
    case 'warning': return 'icon-alert-triangle'
    case 'agreement': return 'icon-file-text'
    default: return ''
  }
})

const modalRef = ref<HTMLElement | null>(null)
const titleId = computed(() => `modal-title-${useId()}`)

const slots = defineSlots<{
  default?: () => unknown
  header?: () => unknown
  footer?: () => unknown
  content?: () => unknown
}>()

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
  } else {
    document.removeEventListener('keydown', keydownHandler)
    if (props.lockScroll) {
      const mainContent = document.querySelector('.main-content') as HTMLElement | null
      if (mainContent) {
        mainContent.style.overflow = ''
      }
    }
  }
}, { immediate: true })

defineExpose({ close, open })
</script>

<style scoped src="@/styles/Modal.css"></style>
