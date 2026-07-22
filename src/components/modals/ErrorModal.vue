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
      >
        <div
          ref="modalRef"
          class="modal-container error-modal-container"
          @click.stop
        >
          <header class="modal-header error-modal-header">
            <div class="header-content">
              <div class="header-title">
                <UiIcon
                  name="alert-triangle"
                  :size="20"
                  class="error-icon"
                />
                <h3
                  :id="titleId"
                  class="modal-title"
                >
                  {{ title || t('error.defaultTitle') }}
                </h3>
              </div>
            </div>
          </header>

          <main class="modal-body error-modal-body">
            <p class="error-message">
              {{ message }}
            </p>
            <div
              v-if="detail"
              class="error-detail-box"
            >
              <div class="error-detail-header">
                <span class="error-detail-label">{{ t('error.detail') }}</span>
              </div>
              <pre class="error-detail-text">{{ detail }}</pre>
            </div>
          </main>

          <footer class="modal-footer error-modal-footer">
            <UiButton
              variant="secondary"
              @click="handleClose"
            >
              {{ t('error.close') }}
            </UiButton>
            <UiButton
              variant="primary"
              :loading="exporting"
              @click="handleExportLogs"
            >
              <UiIcon
                name="download"
                :size="14"
              />
              {{ t('error.exportLogs') }}
            </UiButton>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import UiButton from '@/components/ui/Button.vue'
import UiIcon from '@/components/ui/Icon.vue'

defineOptions({ name: 'ErrorModal' })

const { t } = useI18n()

interface Props {
  visible: boolean
  title?: string
  message?: string
  detail?: string
  errorId?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '',
  message: '',
  detail: '',
  errorId: '',
})

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'open'): void
  (e: 'opened'): void
  (e: 'closed'): void
  (e: 'exported'): void
}

const emit = defineEmits<Emits>()

const modalRef = ref<HTMLElement | null>(null)
const exporting = ref(false)
const titleId = computed(() => `error-modal-title-${useId()}`)

const keydownHandler = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.visible) {
    handleClose()
  }
}

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

const onAfterEnter = () => {
  emit('opened')
}

const onAfterLeave = () => {
  emit('closed')
}

const handleExportLogs = async () => {
  if (exporting.value) return
  exporting.value = true
  try {
    const result = await backend.command('export_logs')
    if (result.success && result.data) {
      emit('exported')
    }
  } catch {
    /* 导出失败静默处理 */
  } finally {
    exporting.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => {
      modalRef.value?.focus()
    })
    document.addEventListener('keydown', keydownHandler)
    const mainContent = document.querySelector('.main-content') as HTMLElement | null
    if (mainContent) {
      mainContent.style.overflow = 'hidden'
    }
  } else {
    document.removeEventListener('keydown', keydownHandler)
    const mainContent = document.querySelector('.main-content') as HTMLElement | null
    if (mainContent) {
      mainContent.style.overflow = ''
    }
  }
}, { immediate: true })

defineExpose({ close: handleClose })
</script>

<style scoped src="@/styles/components/modals/ErrorModal.css"></style>