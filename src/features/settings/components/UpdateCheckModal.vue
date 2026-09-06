<template>
  <FullscreenModal :visible="visible" :title="t('settings.aboutTab.update.title')" :showFooter="false" @close="close">
    <div class="update-check-modal">
      <NSpin :show="checking">
        <template v-if="result">
          <div class="update-check-modal__channel">
            <span class="update-check-modal__channel-tag" :class="`is-${result.channel}`">
              {{ t(`settings.aboutTab.update.channels.${result.channel}`) }}
            </span>
            <span class="update-check-modal__current">v{{ result.current_version }}</span>
          </div>

          <template v-if="result.status === 'update_available'">
            <div class="update-check-modal__new">
              <div class="update-check-modal__new-label">{{ t('settings.aboutTab.update.latest') }}</div>
              <div class="update-check-modal__new-version">v{{ result.latest_version }}</div>
            </div>
            <div v-if="result.latest_notes" class="update-check-modal__notes">
              <div class="update-check-modal__notes-title">{{ t('settings.aboutTab.update.notes') }}</div>
              <pre class="update-check-modal__notes-body">{{ result.latest_notes }}</pre>
            </div>
            <div class="update-check-modal__actions">
              <NButton v-if="result.latest_url" type="primary" @click="openDownload(result.latest_url)">
                {{ t('settings.aboutTab.update.download') }}
              </NButton>
            </div>
          </template>

          <template v-else-if="result.status === 'up_to_date'">
            <div class="update-check-modal__state">
              <UiIcon name="check" :size="34" class="update-check-modal__state-icon is-ok" />
              <div class="update-check-modal__state-text">{{ t('settings.aboutTab.update.upToDate') }}</div>
            </div>
          </template>

          <template v-else-if="result.status === 'disabled'">
            <div class="update-check-modal__state">
              <UiIcon name="error" :size="34" class="update-check-modal__state-icon is-muted" />
              <div class="update-check-modal__state-text">{{ result.message || t('settings.aboutTab.update.disabled') }}</div>
            </div>
          </template>

          <template v-else>
            <div class="update-check-modal__state">
              <UiIcon name="alert-triangle" :size="34" class="update-check-modal__state-icon is-warn" />
              <div class="update-check-modal__state-text">{{ result.message || t('settings.aboutTab.update.failed') }}</div>
            </div>
            <div class="update-check-modal__actions">
              <NButton type="primary" @click="retry">{{ t('settings.aboutTab.update.retry') }}</NButton>
            </div>
          </template>
        </template>
      </NSpin>
    </div>
  </FullscreenModal>
</template>

<script setup lang="ts">
import { NButton, NSpin } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { useUpdateCheck } from '../composables/useUpdateCheck'
import type { UpdateCheckResult } from '@/types/system'
import { openExternalUrl } from '@/utils/openExternal'

const { t } = useI18n()
const { checking, checkUpdate } = useUpdateCheck()

defineProps<{
  visible: boolean
  result: UpdateCheckResult | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

function close(): void {
  emit('update:visible', false)
  emit('close')
}

function openDownload(url: string): void {
  void openExternalUrl(url)
}

async function retry(): Promise<void> {
  await checkUpdate()
}
</script>

<style scoped src="@/styles/components/settings/UpdateCheckModal.css"></style>
