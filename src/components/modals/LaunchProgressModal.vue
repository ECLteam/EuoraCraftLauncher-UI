<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-show="visible"
        class="launch-progress-modal"
        role="dialog"
        :aria-modal="true"
        @click.self="handleOverlayClick"
      >
        <div class="progress-card" @click.stop>
          <button
            v-if="closable"
            class="progress-close-btn"
            @click="handleCancel"
            aria-label="关闭"
          >
            <span class="close-icon">×</span>
          </button>
          <div class="progress-icon">
            <UiIcon name="game-controller" />
          </div>

          <h3 class="progress-title">{{ t('launch.title') }}</h3>

          <p class="progress-stage">{{ stage }}</p>
          <p v-if="message" class="progress-message">{{ message }}</p>

          <div class="progress-bar-wrapper">
            <div class="progress-bar-track">
              <div
                class="progress-bar-fill"
                :style="{ width: clampedPercent + '%' }"
              />
            </div>
            <span class="progress-percent">{{ clampedPercent }}%</span>
          </div>

          <div class="progress-actions">
            <UiButton
              v-if="cancelable"
              variant="secondary"
              size="sm"
              @click="handleCancel"
            >
              {{ t('common.cancel') }}
            </UiButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import UiButton from '@/components/ui/Button.vue'

const { t } = useI18n()

const props = defineProps<{
  visible: boolean
  stage: string
  percent: number
  message?: string
  cancelable?: boolean
  closable?: boolean
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
}>()

const clampedPercent = computed(() => Math.max(0, Math.min(100, Math.round(props.percent))))

const handleCancel = () => {
  emit('cancel')
}

const handleOverlayClick = () => {
  if (props.cancelable || props.closable) {
    emit('cancel')
  }
}
</script>

<style scoped src="@/styles/LaunchProgressModal.css"></style>
