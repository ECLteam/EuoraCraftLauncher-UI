<template>
  <FullscreenModal
    v-model:visible="panelVisible"
    :showFooter="false"
    :title="t('taskQueue.title')"
    bodyClass="task-queue-body"
    wrapperClass="task-queue-wrapper"
  >
    <div class="tq-content">
      <div
        id="plugin-slot-task-queue-top"
        class="plugin-slot-container"
      />
      <!-- 空状态 -->
      <div
        v-if="tasks.length === 0"
        class="tq-empty"
      >
        <UiIcon
          name="cube"
          :size="48"
          class="tq-empty-icon"
        />
        <p class="tq-empty-text">
          {{ t('taskQueue.empty') }}
        </p>
        <p class="tq-empty-hint">
          {{ t('taskQueue.emptyHint') }}
        </p>
      </div>

      <!-- 任务列表 -->
      <div
        v-else
        class="tq-list"
      >
        <div
          v-for="task in tasks"
          :key="task.id"
          :class="['tq-task', `tq-task--${task.status}`]"
        >
          <div
            class="tq-task-header"
            @click="toggleExpand(task.id)"
          >
            <div class="tq-task-main">
              <div class="tq-task-icon">
                <UiIcon
                  v-if="task.status === 'running'"
                  name="spinner"
                  :size="18"
                  class="spin"
                />
                <UiIcon
                  v-else-if="task.status === 'completed'"
                  name="check"
                  :size="18"
                  class="tq-icon-success"
                />
                <UiIcon
                  v-else-if="task.status === 'error'"
                  name="x-mark"
                  :size="18"
                  class="tq-icon-error"
                />
                <UiIcon
                  v-else-if="task.status === 'canceled'"
                  name="x-mark"
                  :size="18"
                  class="tq-icon-muted"
                />
                <UiIcon
                  v-else
                  name="package"
                  :size="18"
                  class="tq-icon-muted"
                />
              </div>
              <div class="tq-task-info">
                <div class="tq-task-name">
                  {{ task.name }}
                </div>
                <div class="tq-task-meta">
                  <span class="tq-task-type">{{ getLoaderLabel(task.loaderType) }}</span>
                  <span class="tq-task-ver">{{ task.versionId }}</span>
                </div>
              </div>
            </div>

            <div class="tq-task-progress">
              <div class="tq-progress-bar">
                <div
                  class="tq-progress-fill"
                  :class="{ 'tq-progress--indeterminate': task.status === 'running' && task.progress <= 0 }"
                  :style="{ width: task.progress > 0 ? task.progress + '%' : undefined }"
                />
              </div>
              <span class="tq-progress-text">
                {{ task.status === 'completed' ? '100%' : task.progress > 0 ? task.progress + '%' : '...' }}
              </span>
            </div>

            <button
              v-if="task.status === 'completed' || task.status === 'error' || task.status === 'canceled'"
              class="tq-remove-btn"
              :title="t('common.remove')"
              @click.stop="removeTask(task.id)"
            >
              <UiIcon
                name="x-mark"
                :size="12"
              />
            </button>
          </div>

          <Transition name="tq-expand">
            <div
              v-if="task.expanded"
              class="tq-task-detail"
            >
              <div class="tq-task-message">
                <span class="tq-msg-label">{{ t('taskQueue.currentStatus') }}</span>
                <span>{{ task.message }}</span>
              </div>

              <div
                v-if="task.subtasks.length > 0"
                class="tq-subtasks"
              >
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
        <div
          id="plugin-slot-task-queue-item-actions"
          class="plugin-slot-container"
        />
      </div>
    </div>

    <div
      v-if="tasks.length > 0"
      class="tq-footer"
    >
      <span class="tq-status-text">
        {{ activeCount > 0 ? t('taskQueue.runningCount', { count: activeCount }) : t('taskQueue.allDone') }}
      </span>
      <button
        class="tq-footer-btn"
        :disabled="completedCount === 0"
        @click="clearCompleted"
      >
        {{ t('taskQueue.clearCompleted', { count: completedCount }) }}
      </button>
    </div>
  </FullscreenModal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { globalTaskQueue } from '@/composables/useTaskQueue'
import { getLoaderLabel } from '@/utils/loader'

defineOptions({ name: 'TaskQueuePanel' })

const { t } = useI18n()

const { tasks, panelVisible, activeCount, removeTask, clearCompleted: queueClearCompleted } = globalTaskQueue

const completedCount = computed(() =>
  tasks.value.filter(t => t.status === 'completed' || t.status === 'error' || t.status === 'canceled').length
)

function clearCompleted() {
  queueClearCompleted()
  if (tasks.value.length === 0) {
    panelVisible.value = false
  }
}

function toggleExpand(taskId: string) {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    task.expanded = !task.expanded
  }
}

let closeTimer: ReturnType<typeof setTimeout> | null = null

function cancelAutoClose() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

watch(activeCount, (val, oldVal) => {
  cancelAutoClose()
  if (val === 0 && oldVal > 0 && panelVisible.value) {
    closeTimer = setTimeout(() => {
      panelVisible.value = false
    }, 2000)
  }
})

watch(panelVisible, (val) => {
  if (!val) cancelAutoClose()
})
</script>

<style scoped src="@/styles/components/panels/TaskQueuePanel.css"></style>