<template>
  <Teleport to="body">
    <Transition
      name="modal"
      @after-enter="onAfterEnter"
      @after-leave="onAfterLeave"
    >
      <div
        v-show="visible"
        :class="['content-modal', { 'is-fullscreen': fullscreen, [`is-${type}`]: true, 'has-backdrop': showBackdrop }]"
        role="dialog"
        :aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div
          ref="modalRef"
          class="modal-wrapper"
          :class="{ 'no-title': !showHeader, [`type-${type}`]: true }"
          @click.stop
        >
          <!-- 头部 - 全屏模式下隐藏（标题显示在 TitleBar） -->
          <header v-if="showHeader && !fullscreen" class="modal-header">
            <div class="header-content">
              <slot name="header">
                <div class="header-title">
                  <i v-if="iconType" :class="['icon', iconType]" class="type-icon" />
                  <h3 :id="titleId" class="modal-title">{{ title }}</h3>
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

          <!-- 内容 -->
          <main class="modal-body" :class="bodyClass">
            <slot />
            <!-- 默认内容插槽（用于简单文本内容） -->
            <slot name="content">
              <p v-if="content" class="modal-content-text">{{ content }}</p>
            </slot>
          </main>

          <!-- 底部按钮区域 - 根据类型自动显示（协议类型在全屏模式下也显示） -->
          <footer v-if="showFooter && (!fullscreen || type === 'agreement')" class="modal-footer">
            <slot name="footer">
              <!-- 协议类型：同意/不同意 -->
              <template v-if="type === 'agreement'">
                <UiButton variant="secondary" @click="handleCancel">
                  {{ cancelText || t('modal.disagree') }}
                </UiButton>
                <UiButton variant="primary" @click="handleConfirm">
                  {{ confirmText || t('modal.agree') }}
                </UiButton>
              </template>
              
              <!-- 确认类型：取消/确认 -->
              <template v-else-if="type === 'confirm'">
                <UiButton variant="secondary" @click="handleCancel">
                  {{ cancelText || t('modal.cancel') }}
                </UiButton>
                <UiButton :variant="danger ? 'danger' : 'primary'" @click="handleConfirm">
                  {{ confirmText || t('modal.confirm') }}
                </UiButton>
              </template>
              
              <!-- 警告/提示类型：确定 -->
              <template v-else-if="type === 'alert' || type === 'warning'">
                <UiButton :variant="type === 'warning' ? 'danger' : 'primary'" @click="handleConfirm">
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
import { ref, computed, watch, nextTick } from 'vue'
import { useFullscreenModal } from '@/composables/useFullscreenModal'
import { useI18n } from 'vue-i18n'
import UiButton from '@/components/ui/Button.vue'

const { t } = useI18n()

// 弹窗类型
export type ModalType = 'content' | 'agreement' | 'confirm' | 'alert' | 'warning'

// Props 定义
interface Props {
  /** 是否可见 */
  visible: boolean
  /** 弹窗类型：content-普通内容, agreement-协议, confirm-确认, alert-提示, warning-警告 */
  type?: ModalType
  /** 标题文本 */
  title?: string
  /** 内容文本（简单内容时可用） */
  content?: string
  /** 确认按钮文本 */
  confirmText?: string
  /** 取消按钮文本 */
  cancelText?: string
  /** 是否危险操作（confirm类型下确认按钮变红） */
  danger?: boolean
  /** 是否可关闭 */
  closable?: boolean
  /** 是否显示关闭按钮 */
  showCloseBtn?: boolean
  /** 是否显示底部按钮区域 */
  showFooter?: boolean
  /** 是否全屏显示（覆盖整个内容区） */
  fullscreen?: boolean
  /** 点击遮罩是否关闭（已废弃，不再支持点击外部关闭） */
  maskClosable?: boolean
  /** 内容区域自定义类名 */
  bodyClass?: string
  /** 是否锁定背景滚动 */
  lockScroll?: boolean
  /** 是否显示背景遮罩，默认不显示 */
  showBackdrop?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'content',
  closable: true,
  showCloseBtn: true,
  showFooter: true,
  fullscreen: false,
  maskClosable: false,
  lockScroll: true,
  danger: false,
  showBackdrop: false
})

// Emits 定义
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

// 根据类型获取图标
const iconType = computed(() => {
  switch (props.type) {
    case 'confirm':
      return 'icon-help-circle'
    case 'alert':
      return 'icon-info'
    case 'warning':
      return 'icon-alert-triangle'
    case 'agreement':
      return 'icon-file-text'
    default:
      return ''
  }
})

// 全屏弹窗状态管理
const fullscreenModal = useFullscreenModal()

// Refs
const modalRef = ref<HTMLElement | null>(null)
const titleId = computed(() => `modal-title-${Math.random().toString(36).slice(2, 9)}`)

// Computed
const showHeader = computed(() => props.title || props.closable || slots.header)

// Slots
const slots = defineSlots<{
  default?: () => any
  header?: () => any
  footer?: () => any
  content?: () => any
}>()

// 关闭方法
const close = () => {
  // 全屏模式下同步关闭 TitleBar 状态
  if (props.fullscreen) {
    fullscreenModal.close()
  }
  emit('update:visible', false)
  emit('close')
}

// 打开方法
const open = () => {
  emit('update:visible', true)
  emit('open')
}

// 确认按钮处理
const handleConfirm = () => {
  emit('confirm')
  // 协议类型不自动关闭，由外部控制
  if (props.type !== 'agreement') {
    close()
  }
}

// 取消按钮处理
const handleCancel = () => {
  emit('cancel')
  // 协议类型不自动关闭，由外部控制
  if (props.type !== 'agreement') {
    close()
  }
}

// 点击遮罩处理（已废弃，不再支持点击外部关闭）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const handleBackdropClick = () => {
  // 点击外部不再关闭弹窗
}

// 键盘 ESC 关闭
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.visible && props.closable) {
    close()
  }
}

// 生命周期钩子
const onAfterEnter = () => {
  emit('opened')
}

const onAfterLeave = () => {
  emit('closed')
}

// 页面内容滑出/滑入控制
const togglePageContent = (isOpen: boolean) => {
  if (!props.fullscreen) return
  
  // 找到页面内容容器（.page-container）
  const pageContent = document.querySelector('.page-container') as HTMLElement
  if (!pageContent) return
  
  if (isOpen) {
    pageContent.classList.add('modal-page-slide-out')
  } else {
    pageContent.classList.remove('modal-page-slide-out')
  }
}

// 监听 visible 变化
watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => {
      modalRef.value?.focus()
    })
    document.addEventListener('keydown', handleKeydown)
    if (props.lockScroll) {
      const mainContent = document.querySelector('.main-content') as HTMLElement | null
      if (mainContent) {
        mainContent.style.overflow = 'hidden'
      }
    }
    // 全屏弹窗打开时，页面内容右滑离开
    togglePageContent(true)
    // 全屏模式下同步更新 TitleBar
    if (props.fullscreen && props.title) {
      fullscreenModal.open(props.title, close)
    }
  } else {
    document.removeEventListener('keydown', handleKeydown)
    if (props.lockScroll) {
      const mainContent = document.querySelector('.main-content') as HTMLElement | null
      if (mainContent) {
        mainContent.style.overflow = ''
      }
    }
    // 全屏弹窗关闭时，页面内容滑回，并重置全屏状态
    togglePageContent(false)
    // 只有关闭的是全屏弹窗时，才重置全屏弹窗状态
    if (props.fullscreen) {
      fullscreenModal.reset()
    }
  }
}, { immediate: true })

// 暴露方法
defineExpose({
  close,
  open
})
</script>

<style scoped src="@/styles/components/ContentModal.css"></style>