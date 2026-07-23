<template>
  <div class="fab-launch-bar" :class="{ 'no-version-bar': versionsCount === 0 }">
    <div id="plugin-slot-game-launch-before" class="plugin-slot-container" />
    <div class="fab-row-top">
      <button
        v-if="versionsCount > 0"
        class="fab-launch-btn"
        :disabled="launching || !selectedVersion || !hasAccount"
        @click="emit('launch')"
      >
        <UiIcon name="play" :size="16" />
        <span class="fab-launch-label">{{ launching ? t('game.launching') : t('game.launch') }}</span>
        <span class="fab-launch-version">{{ selectedVersion }}</span>
      </button>
      <button v-else class="fab-launch-btn no-version" @click="emit('manageVersions')">
        <UiIcon name="download" :size="16" />
        <span class="fab-launch-label">{{ t('game.noVersionInstall') }}</span>
      </button>
      <button class="fab-manage-btn" title="版本管理" @click="emit('manageVersions')">
        <UiIcon name="grid" :size="16" />
      </button>
    </div>
    <button v-if="versionsCount > 0" class="fab-settings-btn" title="版本设置" @click="emit('settings')">
      <UiIcon name="settings" :size="16" />
      <span class="fab-settings-label">版本设置</span>
    </button>
  </div>
</template>

<script setup lang="ts">
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
.fab-launch-bar {
  display: flex;
  flex-direction: column;
  gap: 7px;
  width: 100%;
  margin-top: auto;
}

.fab-launch-bar.no-version-bar {
  margin-bottom: 29px;
}

.fab-row-top {
  display: flex;
  align-items: center;
  gap: 7px;
}

.fab-launch-btn {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 7px;
  min-width: 180px;
  height: 43px;
  padding: 0 18px;
  border: none;
  border-radius: var(--r-sm);
  background: var(--primary);
  color: var(--text-on-primary);
  white-space: nowrap;
  cursor: pointer;
  transition: all var(--duration-fast) ease-out;
}

.fab-launch-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.fab-launch-btn:active:not(:disabled),
.fab-manage-btn:active,
.fab-settings-btn:active {
  transform: translateY(1px);
}

.fab-launch-btn:disabled {
  background: var(--bg-hover);
  color: var(--text-disabled);
  cursor: not-allowed;
}

.fab-launch-btn.no-version {
  background: var(--bg-base-alt);
  color: var(--text-secondary);
}

.fab-launch-btn.no-version:hover:not(:disabled) {
  filter: brightness(0.92);
  background: var(--bg-base-alt);
}

.fab-launch-label,
.fab-settings-label {
  font-size: 13px;
  font-weight: 600;
}

.fab-launch-version {
  overflow: hidden;
  max-width: 108px;
  margin-left: auto;
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fab-launch-btn:disabled .fab-launch-version {
  color: var(--text-disabled);
}

.fab-manage-btn,
.fab-settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 43px;
  border: 1px solid var(--border);
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  border-radius: var(--r-sm);
  background: var(--card-bg);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--duration-fast) ease-out;
}

.fab-manage-btn {
  flex-shrink: 0;
  width: 43px;
}

.fab-settings-btn {
  gap: 7px;
  width: 100%;
  font-size: 13px;
  font-weight: 500;
}

.fab-manage-btn:hover,
.fab-settings-btn:hover {
  border-color: var(--border-hover);
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
