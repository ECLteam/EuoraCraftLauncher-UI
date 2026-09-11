<template>
  <Modal
    :visible="visible"
    :title="t('settings.aboutTab.update.title')"
    width="440px"
    :closable="!downloading"
    @update:visible="emit('update:visible', $event)"
    @close="emit('close')"
  >
    <div class="update-result-modal">
      <div class="update-result-modal__versions">
        <div class="update-result-modal__version">
          <span class="update-result-modal__label">{{ t('settings.aboutTab.update.currentVersion') }}</span>
          <strong class="update-result-modal__value">{{ result?.current_version }}</strong>
        </div>
        <UiIcon name="arrow-right" :size="16" class="update-result-modal__arrow" />
        <div class="update-result-modal__version is-latest">
          <span class="update-result-modal__label">{{ t('settings.aboutTab.update.latestVersion') }}</span>
          <strong class="update-result-modal__value">{{ version }}</strong>
        </div>
      </div>

      <div v-if="notes" class="update-result-modal__notes">
        <div class="update-result-modal__notes-head">{{ t('settings.aboutTab.update.notesTitle') }}</div>
        <p>{{ notes }}</p>
      </div>

      <div v-if="!selfUpdateEnabled" class="update-result-modal__hint">
        <UiIcon name="info" :size="14" />
        <span>{{ t('settings.aboutTab.update.selfUpdateDisabled') }}</span>
      </div>

      <div v-if="downloading && downloadPercent >= 0" class="update-result-modal__progress">
        <div class="update-result-modal__progress-bar" :style="{ width: downloadPercent + '%' }"></div>
        <span class="update-result-modal__progress-text">{{ downloadPercent }}%</span>
      </div>
    </div>

    <template #footer>
      <NButton :loading="checking" @click="refresh">
        {{ t('settings.aboutTab.update.refresh') }}
      </NButton>
      <NButton type="primary" :loading="downloading" :disabled="!selfUpdateEnabled" @click="updateNow">
        {{ downloading ? t('settings.aboutTab.update.downloading') : t('settings.aboutTab.update.updateNow') }}
      </NButton>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/modals/Modal.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { useUpdateCheck } from '../composables/useUpdateCheck'

defineOptions({ name: 'UpdateResultModal' })

defineProps<{ visible: boolean }>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

const { t } = useI18n()
const message = useLauncherMessage()
const {
  lastResult,
  checking,
  selfUpdateEnabled,
  downloading,
  downloadPercent,
  checkUpdate,
  downloadUpdate,
  applyUpdate,
} = useUpdateCheck()

const result = computed(() => lastResult.value)
const version = computed(() => result.value?.latest_version || '')
const notes = computed(() => result.value?.latest_notes || '')

async function refresh(): Promise<void> {
  if (checking.value) return
  const refreshResult = await checkUpdate()
  if (refreshResult && refreshResult.status !== 'update_available') {
    emit('update:visible', false)
    if (refreshResult.status === 'up_to_date') {
      message.success(t('settings.aboutTab.update.upToDate'), {})
    }
  }
}

async function updateNow(): Promise<void> {
  if (downloading.value || !selfUpdateEnabled.value) return
  const title = t('settings.aboutTab.update.title')
  const loadingMessage = message.loading(t('settings.aboutTab.update.preparing'))
  const targetVersion = await downloadUpdate()
  loadingMessage.destroy()
  if (!targetVersion) {
    message.error(t('settings.aboutTab.update.downloadFailed'), { title, duration: 6000 })
    return
  }
  const restarting = await applyUpdate()
  if (restarting) {
    message.success(t('settings.aboutTab.update.restarting', { version: targetVersion }), { title, duration: 6000 })
    emit('update:visible', false)
  } else {
    message.error(t('settings.aboutTab.update.applyFailed'), { title, duration: 6000 })
  }
}
</script>

<style scoped src="@/styles/views/settings/UpdateResultModal.css"></style>
