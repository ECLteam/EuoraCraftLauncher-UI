<template>
  <div class="game-launch-bar">
    <div id="plugin-slot-game-launch-before" class="plugin-slot-container"></div>
    <NSpace :size="8" :wrap="false">
      <NButton
        v-if="versionsCount > 0"
        class="fab-launch-btn launch-button"
        type="primary"
        size="large"
        :disabled="launching || !selectedVersion || !hasAccount"
        @click="emit('launch')"
      >
        <template #icon><UiIcon name="play" :size="16" /></template>
        {{ launching ? t('game.launching') : t('game.launch') }}
        <span class="launch-version">{{ selectedVersion }}</span>
      </NButton>
      <NButton v-else class="fab-launch-btn no-version launch-button" size="large" @click="emit('manageVersions')">
        <template #icon><UiIcon name="download" :size="16" /></template>
        {{ t('game.noVersionInstall') }}
      </NButton>
      <NButton size="large" :title="t('versions.title')" @click="emit('manageVersions')">
        <template #icon><UiIcon name="grid" :size="16" /></template>
      </NButton>
    </NSpace>
    <NButton v-if="versionsCount > 0" block @click="emit('settings')">
      <template #icon><UiIcon name="settings" :size="16" /></template>
      {{ t('settings.gameSettings') }}
    </NButton>
  </div>
</template>

<script setup lang="ts">
import { NButton, NSpace } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'

defineProps<{
  versionsCount: number
  launching: boolean
  selectedVersion: string
  hasAccount: boolean
}>()

const emit = defineEmits<{
  launch: []
  manageVersions: []
  settings: []
}>()

const { t } = useI18n()
</script>

<style scoped>
.game-launch-bar {
  display: flex;
  width: 100%;
  margin-top: auto;
  flex-direction: column;
  gap: 8px;
}

.launch-button {
  min-width: 0;
  flex: 1;
}

.launch-version {
  overflow: hidden;
  max-width: 110px;
  margin-left: 12px;
  opacity: 0.72;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.n-space) {
  width: 100%;
}

:deep(.n-space > div:first-child) {
  min-width: 0;
  flex: 1;
}
</style>
