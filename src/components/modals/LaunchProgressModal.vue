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

<style scoped>
.launch-progress-modal {
  position: fixed;
  top: 42px;
  left: 0;
  width: 100vw;
  height: calc(100vh - 42px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.progress-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  padding: 32px 40px;
  width: 380px;
  max-width: 90%;
  will-change: transform, opacity;
}

.progress-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary-light);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.progress-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.progress-stage {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
}

.progress-message {
  margin: 0;
  font-size: 12px;
  color: var(--text-disabled);
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.progress-bar-track {
  flex: 1;
  height: 8px;
  background: var(--bg-elevated);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-percent {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  min-width: 36px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.progress-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  transition: background 0.2s, color 0.2s;
}

.progress-close-btn:hover {
  background: var(--bg-elevated);
  color: var(--text-primary);
}

.progress-card {
  position: relative;
}

.progress-actions {
  margin-top: 8px;
}

/* 进入/离开动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .progress-card,
.modal-leave-active .progress-card {
  transition: transform 0.25s var(--ease-spring), opacity 0.25s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .progress-card,
.modal-leave-to .progress-card {
  opacity: 0;
  transform: scale(0.95) translateY(8px);
}
</style>
