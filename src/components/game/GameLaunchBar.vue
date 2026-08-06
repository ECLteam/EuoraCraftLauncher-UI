<template>
  <div class="game-launch-bar">
    <div id="plugin-slot-game-launch-before" class="plugin-slot-container"></div>
    <div class="launch-action-row">
      <NButton
        v-if="versionsCount > 0"
        class="fab-launch-btn launch-main-button"
        type="primary"
        size="large"
        :disabled="launching || !selectedVersion || !hasAccount"
        @click="emit('launch')"
      >
        <template #icon><UiIcon name="play" :size="16" /></template>
        <span class="launch-main-content">
          <span class="launch-main-label">{{ launching ? t('game.launching') : t('game.launch') }}</span>
          <span class="launch-version">{{ selectedVersion }}</span>
        </span>
      </NButton>
      <NButton
        v-else
        class="fab-launch-btn no-version launch-main-button"
        type="primary"
        size="large"
        @click="emit('manageVersions')"
      >
        <template #icon><UiIcon name="download" :size="16" /></template>
        <span class="launch-main-label">{{ t('game.noVersionInstall') }}</span>
      </NButton>
      <NButton
        class="launch-manage-button"
        type="primary"
        secondary
        size="large"
        :title="t('versions.title')"
        :aria-label="t('versions.title')"
        @click="emit('manageVersions')"
      >
        <template #icon><UiIcon name="list" :size="17" /></template>
      </NButton>
    </div>
    <NButton
      class="launch-settings-button"
      secondary
      block
      :title="t('game.versionSettings')"
      :aria-label="t('game.versionSettings')"
      :disabled="!selectedVersion"
      @click="emit('versionSettings')"
    >
      <template #icon><UiIcon name="settings" :size="15" /></template>
      {{ t('game.versionSettings') }}
    </NButton>
  </div>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'
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
  versionSettings: []
}>()

const { t } = useI18n()
</script>

<style scoped>
.game-launch-bar {
  display: flex;
  width: 100%;
  margin-top: auto;
  flex-direction: column;
  gap: 10px;
}

.launch-action-row {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1fr) 48px;
  gap: 10px;
}

.launch-main-button {
  width: 100%;
  height: 48px;
  min-width: 0;
  border-radius: var(--r-md);
}

.launch-main-button :deep(.n-button__content) {
  min-width: 0;
}

.launch-main-content {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.launch-main-label {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 650;
}

.launch-manage-button {
  width: 48px;
  height: 48px;
  padding: 0;
  border-radius: var(--r-md);
  border: 1px solid var(--primary) !important;
  background: var(--primary-alpha-strong) !important;
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}

.launch-manage-button:hover:not(:disabled) {
  filter: brightness(0.92);
  transform: translateY(-1px);
}

.launch-version {
  overflow: hidden;
  max-width: 105px;
  padding-left: 10px;
  color: color-mix(in srgb, var(--text-on-primary) 72%, transparent);
  font-size: 11px;
  font-weight: 500;
  border-left: 1px solid color-mix(in srgb, var(--text-on-primary) 26%, transparent);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.launch-settings-button {
  height: 34px;
  border-radius: var(--r-md);
  color: var(--text-primary) !important;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--border-strong) !important;
  background: var(--bg-elevated) !important;
  box-shadow: var(--shadow-xs);
  transition:
    background-color var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard),
    color var(--duration-fast) var(--ease-standard),
    transform var(--duration-fast) var(--ease-standard);
}

.launch-settings-button:hover:not(:disabled) {
  color: var(--primary) !important;
  background: var(--bg-hover) !important;
  border-color: var(--border-hover) !important;
  transform: translateY(-1px);
}

.launch-settings-button:disabled {
  opacity: 0.45;
}
</style>
