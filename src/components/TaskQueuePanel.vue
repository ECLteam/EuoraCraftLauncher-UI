<template>
  <ContentModal
    v-model:visible="panelVisible"
    :show-footer="false"
    fullscreen
    :title="t('taskQueue.title')"
    body-class="task-queue-body"
    wrapper-class="task-queue-wrapper"
  >
    <template #title>
      <div class="tq-header">
        <UiIcon name="download" :size="20" />
        <span>{{ t('taskQueue.title') }}</span>
        <span v-if="activeCount > 0" class="tq-active-badge">{{ activeCount }}</span>
      </div>
    </template>

    <div class="tq-content">
      <!-- 空状态 -->
      <div v-if="tasks.length === 0" class="tq-empty">
        <UiIcon name="cube" :size="48" class="tq-empty-icon" />
        <p class="tq-empty-text">{{ t('taskQueue.empty') }}</p>
        <p class="tq-empty-hint">{{ t('taskQueue.emptyHint') }}</p>
      </div>

      <!-- 任务列表 -->
      <div v-else class="tq-list">
        <div
          v-for="task in tasks"
          :key="task.id"
          :class="['tq-task', `tq-task--${task.status}`]"
        >
          <!-- 任务头部 -->
          <div class="tq-task-header" @click="toggleExpand(task.id)">
            <div class="tq-task-left">
              <div class="tq-task-icon">
                <UiIcon v-if="task.status === 'running'" name="spinner" :size="18" class="spin" />
                <UiIcon v-else-if="task.status === 'completed'" name="check" :size="18" class="tq-icon-success" />
                <UiIcon v-else-if="task.status === 'error'" name="x-mark" :size="18" class="tq-icon-error" />
                <UiIcon v-else-if="task.status === 'canceled'" name="x-mark" :size="18" class="tq-icon-muted" />
                <UiIcon v-else name="package" :size="18" class="tq-icon-muted" />
              </div>
              <div class="tq-task-info">
                <div class="tq-task-name">{{ task.name }}</div>
                <div class="tq-task-meta">
                  <span class="tq-task-type">{{ getLoaderLabel(task.loaderType) }}</span>
                  <span class="tq-task-ver">{{ task.versionId }}</span>
                </div>
              </div>
            </div>
            <div class="tq-task-right">
              <div class="tq-task-progress-wrap">
                <div class="tq-progress-bar">
                  <div
                    class="tq-progress-fill"
                    :class="{ 'tq-progress--indeterminate': task.status === 'running' && task.progress <= 0 }"
                    :style="{ width: task.progress > 0 ? task.progress + '%' : undefined }"
                  />
                </div>
                <span class="tq-progress-text">{{ task.status === 'completed' ? '100%' : task.progress > 0 ? task.progress + '%' : '...' }}</span>
              </div>
              <button
                v-if="task.status === 'completed' || task.status === 'error' || task.status === 'canceled'"
                class="tq-remove-btn"
                title="移除"
                @click.stop="removeTask(task.id)"
              >
                <UiIcon name="x-mark" :size="12" />
              </button>
            </div>
          </div>

          <!-- 展开详情 -->
          <Transition name="tq-expand">
            <div v-if="task.expanded" class="tq-task-detail">
              <div class="tq-task-message">
                <span class="tq-msg-label">{{ t('taskQueue.currentStatus') }}</span>
                <span>{{ task.message }}</span>
              </div>

              <!-- 子任务列表 -->
              <div v-if="task.subtasks.length > 0" class="tq-subtasks">
                <div
                  v-for="sub in task.subtasks"
                  :key="sub.id"
                  :class="['tq-subtask', `tq-subtask--${sub.status}`]"
                >
                  <UiIcon
                    v-if="sub.status === 'running'"
                    name="spinner"
                    :size="12"
                    class="spin"
                  />
                  <UiIcon
                    v-else-if="sub.status === 'completed'"
                    name="check"
                    :size="12"
                    class="tq-icon-success"
                  />
                  <UiIcon
                    v-else-if="sub.status === 'error'"
                    name="x-mark"
                    :size="12"
                    class="tq-icon-error"
                  />
                  <UiIcon
                    v-else
                    name="circle"
                    :size="8"
                    class="tq-icon-muted"
                  />
                  <span class="tq-subtask-name">{{ sub.name }}</span>
                  <span class="tq-subtask-msg">{{ sub.message }}</span>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div v-if="tasks.length > 0" class="tq-footer">
      <button
        class="tq-footer-btn"
        :disabled="completedCount === 0"
        @click="clearCompleted"
      >
        {{ t('taskQueue.clearCompleted', { count: completedCount }) }}
      </button>
    </div>
  </ContentModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ContentModal from '@/components/modals/ContentModal.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { globalTaskQueue } from '@/composables/useTaskQueue'
import { getLoaderLabel } from '@/utils/loader'

const { t } = useI18n()

const { tasks, panelVisible, activeCount, removeTask, clearCompleted, updateTask } = globalTaskQueue

const completedCount = computed(() => tasks.value.filter(t => t.status === 'completed' || t.status === 'error' || t.status === 'canceled').length)

function toggleExpand(taskId: string) {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    task.expanded = !task.expanded
  }
}
</script>

<style scoped>
.task-queue-wrapper {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.task-queue-body {
  background: transparent !important;
  padding: 0 !important;
}

.tq-header {
  display: flex;
  align-items: center;
  gap: 7px;
}

.tq-active-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--color-primary, #4a90d9);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
}

.tq-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 14px;
}

.tq-list {
  max-width: 630px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 11px 0;
}

.tq-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 43px 18px;
  text-align: center;
}

.tq-empty-icon {
  opacity: 0.3;
  margin-bottom: 14px;
  color: var(--color-text-secondary, #888);
}

.tq-empty-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text, #ddd);
  margin: 0 0 7px;
}

.tq-empty-hint {
  font-size: 12px;
  color: var(--color-text-secondary, #888);
  margin: 0;
}

.tq-task {
  background: var(--color-bg-card, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
  border-radius: 7px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.tq-task--running {
  border-color: var(--color-primary, rgba(74, 144, 217, 0.4));
}

.tq-task--completed {
  border-color: rgba(76, 175, 80, 0.3);
}

.tq-task--error {
  border-color: rgba(244, 67, 54, 0.3);
}

.tq-task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 11px;
  cursor: pointer;
  gap: 9px;
  user-select: none;
}

.tq-task-header:hover {
  background: rgba(255, 255, 255, 0.03);
}

.tq-task-left {
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1;
  min-width: 0;
}

.tq-task-icon {
  flex-shrink: 0;
  width: 23px;
  height: 23px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.06);
}

.tq-task-info {
  min-width: 0;
}

.tq-task-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text, #ddd);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tq-task-meta {
  display: flex;
  gap: 5px;
  margin-top: 1px;
}

.tq-task-type,
.tq-task-ver {
  font-size: 10px;
  color: var(--color-text-secondary, #888);
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 5px;
  border-radius: 3px;
}

.tq-task-right {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}

.tq-task-progress-wrap {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 108px;
}

.tq-progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.tq-progress-fill {
  height: 100%;
  background: var(--color-primary, #4a90d9);
  border-radius: 2px;
  transition: width 0.3s ease;
  min-width: 0;
}

.tq-progress-fill.tq-progress--indeterminate {
  width: 30% !important;
  animation: tq-indeterminate 1.5s ease-in-out infinite;
}

@keyframes tq-indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

.tq-progress-text {
  font-size: 10px;
  color: var(--color-text-secondary, #888);
  min-width: 25px;
  text-align: right;
}

.tq-remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-secondary, #888);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s, background 0.2s;
}

.tq-task:hover .tq-remove-btn {
  opacity: 1;
}

.tq-remove-btn:hover {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

/* 展开详情 */
.tq-task-detail {
  padding: 0 14px 13px 54px;
  border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.06));
}

.tq-task-message {
  font-size: 12px;
  color: var(--color-text-secondary, #888);
  padding: 9px 0 4px;
}

.tq-msg-label {
  color: var(--color-text, #ccc);
  font-weight: 500;
}

.tq-subtasks {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 7px;
}

.tq-subtask {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 4px 0;
  font-size: 11px;
  color: var(--color-text-secondary, #888);
}

.tq-subtask-name {
  font-weight: 500;
  color: var(--color-text, #ccc);
  min-width: 72px;
}

.tq-subtask-msg {
  color: var(--color-text-secondary, #888);
}

/* 状态颜色 */
.tq-icon-success { color: #4caf50; }
.tq-icon-error { color: #f44336; }
.tq-icon-muted { color: var(--color-text-secondary, #666); }

/* 展开动画 */
.tq-expand-enter-active,
.tq-expand-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.tq-expand-enter-from,
.tq-expand-leave-to {
  opacity: 0;
  max-height: 0;
}

.tq-expand-enter-to,
.tq-expand-leave-from {
  opacity: 1;
  max-height: 270px;
}

/* 底部 */
.tq-footer {
  display: flex;
  justify-content: flex-end;
  padding: 11px 22px;
  border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
}

.tq-footer-btn {
  padding: 5px 14px;
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.12));
  border-radius: 5px;
  background: transparent;
  color: var(--color-text-secondary, #888);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tq-footer-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text, #ddd);
}

.tq-footer-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* spinner animation */
.spin {
  animation: tq-spin 1s linear infinite;
}

@keyframes tq-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}</style>
