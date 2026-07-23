<template>
  <Modal
    :visible="visible"
    type="confirm"
    :title="title"
    :danger="danger"
    :closable="!loading"
    :showCloseBtn="!loading"
    @update:visible="updateVisible"
  >
    <slot>
      <p class="confirm-dialog-content">{{ content }}</p>
    </slot>

    <template #footer>
      <UiButton variant="secondary" :disabled="loading" @click="cancel">
        {{ cancelText || t('modal.cancel') }}
      </UiButton>
      <UiButton :variant="danger ? 'danger' : 'primary'" :loading="loading" @click="confirm">
        {{ confirmText || t('modal.confirm') }}
      </UiButton>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import Modal from '@/components/modals/Modal.vue'
import UiButton from '@/components/ui/Button.vue'

const props = withDefaults(
  defineProps<{
    visible: boolean
    title: string
    content?: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
    loading?: boolean
    closeOnConfirm?: boolean
  }>(),
  {
    content: '',
    confirmText: '',
    cancelText: '',
    danger: false,
    loading: false,
    closeOnConfirm: true,
  }
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: []
  cancel: []
}>()

const { t } = useI18n()

function updateVisible(value: boolean) {
  if (!props.loading) emit('update:visible', value)
}

function cancel() {
  if (props.loading) return
  emit('cancel')
  emit('update:visible', false)
}

function confirm() {
  if (props.loading) return
  emit('confirm')
  if (props.closeOnConfirm) emit('update:visible', false)
}
</script>

<style scoped>
.confirm-dialog-content {
  margin: 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}
</style>
