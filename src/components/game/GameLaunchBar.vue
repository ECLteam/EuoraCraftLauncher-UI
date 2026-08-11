<template>
  <div class="game-launch-bar">
    <div id="plugin-slot-game-launch-before" class="plugin-slot-container"></div>
    <div class="launch-action-row">
      <!-- 分裂按钮：启动实例 + 最近实例切换 -->
      <div
        v-if="versionsCount > 0"
        class="split-launch-btn"
        :class="{ disabled: launching || !selectedVersion || !hasAccount }"
      >
        <button
          class="split-main"
          :disabled="launching || !selectedVersion || !hasAccount"
          @click="emit('launch')"
        >
          <span class="split-main-icon"><UiIcon name="play" :size="16" /></span>
          <span class="launch-main-content">
            <span class="launch-main-label">{{ launching ? t('game.launching') : t('game.launch') }}</span>
            <span class="launch-version">{{ selectedVersion }}</span>
          </span>
        </button>
        <span class="split-divider"></span>
        <NPopover
          trigger="click"
          placement="top-end"
          :show-arrow="false"
          raw
        >
          <template #trigger>
            <button
              class="split-arrow"
              :disabled="launching"
              :title="t('game.recentInstances')"
            >
              <UiIcon name="chevron-up" :size="14" />
            </button>
          </template>
          <div class="recent-instances-popover">
            <div class="recent-popover-header">
              {{ t('game.recentInstances') }}
            </div>
            <div v-if="recentInstances.length === 0" class="recent-popover-empty">
              {{ t('game.noRecentInstances') }}
            </div>
            <button
              v-for="item in recentInstances"
              :key="`${item.gamePath}\0${item.versionId}`"
              class="recent-instance-item"
              :class="{ active: item.versionId === selectedVersion && item.gamePath === currentGamePath }"
              @click="handleSelectRecent(item)"
            >
              <span class="recent-instance-name">{{ item.versionName }}</span>
              <span class="recent-instance-path">{{ getPathDisplayName(item.gamePath) }}</span>
              <UiIcon v-if="item.versionId === selectedVersion && item.gamePath === currentGamePath" name="check" :size="12" />
            </button>
          </div>
        </NPopover>
      </div>

      <!-- 无版本时安装按钮 -->
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
import { NButton, NPopover } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import { getPathDisplayName, type RecentInstance } from '@/composables/useRecentInstances'

defineProps<{
  versionsCount: number
  launching: boolean
  selectedVersion: string
  currentGamePath: string
  hasAccount: boolean
  recentInstances: RecentInstance[]
}>()

const emit = defineEmits<{
  launch: []
  manageVersions: []
  versionSettings: []
  selectVersion: [versionId: string, gamePath?: string]
}>()

function handleSelectRecent(item: RecentInstance) {
  emit('selectVersion', item.versionId, item.gamePath)
}

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

/* ========== 分裂按钮 ========== */
.split-launch-btn {
  display: flex;
  width: 100%;
  height: 48px;
  border-radius: var(--r-md);
  background: var(--primary);
  overflow: hidden;
  transition:
    filter var(--duration-fast) var(--ease-standard),
    opacity var(--duration-fast) var(--ease-standard);
}

.split-launch-btn.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.split-launch-btn:not(.disabled):hover {
  filter: brightness(0.95);
}

.split-launch-btn:not(.disabled):active {
  filter: brightness(0.9);
}

.split-main {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 9px;
  height: 100%;
  padding: 0 14px;
  border: none;
  background: transparent;
  color: var(--text-on-primary);
  cursor: pointer;
  font-size: 13px;
  font-weight: 650;
  outline: none;
  transition: background var(--duration-fast) var(--ease-standard);
}

.split-main:hover {
  background: rgba(255, 255, 255, 0.06);
}

.split-main-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
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

.split-divider {
  width: 1px;
  align-self: stretch;
  margin: 10px 0;
  background: color-mix(in srgb, var(--text-on-primary) 26%, transparent);
  flex-shrink: 0;
}

.split-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 100%;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--text-on-primary);
  cursor: pointer;
  outline: none;
  transition: background var(--duration-fast) var(--ease-standard);
  border-radius: 0 var(--r-md) var(--r-md) 0;
}

.split-arrow:hover {
  background: rgba(255, 255, 255, 0.1);
}

.split-arrow:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ========== 最近实例 Popover ========== */
.recent-instances-popover {
  min-width: 180px;
  padding: 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-strong);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-lg);
}

.recent-popover-header {
  padding: 6px 10px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.recent-popover-empty {
  padding: 16px 10px;
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
}

.recent-instance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: var(--r-xs);
  background: transparent;
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  gap: 8px;
  transition: background var(--duration-fast) var(--ease-standard);
}

.recent-instance-item:hover {
  background: var(--bg-hover);
}

.recent-instance-item.active {
  color: var(--primary);
  font-weight: 600;
}

.recent-instance-item:not(:last-child) {
  margin-bottom: 1px;
}

.recent-instance-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
  min-width: 0;
}

.recent-instance-path {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 80px;
  font-size: 10px;
  font-weight: 400;
  color: var(--text-tertiary);
}

/* ========== 管理按钮 ========== */
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