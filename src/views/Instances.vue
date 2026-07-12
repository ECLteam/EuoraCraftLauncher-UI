<template>
  <div class="instances-page">
    <!-- 顶部操作栏 -->
    <div class="instances-toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <UiIcon name="search" :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('instances.searchInstances')"
            class="search-input"
          />
          <button
            v-if="searchQuery"
            class="search-clear"
            @click="searchQuery = ''"
          >
            <UiIcon name="close" :size="14" />
          </button>
        </div>
        <div class="filter-group">
          <button
            v-for="f in filters"
            :key="f.key"
            :class="['filter-chip', { active: activeFilter === f.key }]"
            @click="activeFilter = f.key"
          >
            {{ f.label }}
          </button>
        </div>
      </div>
      <div class="toolbar-right">
        <div class="view-toggle">
          <button
            :class="['view-btn', { active: viewMode === 'grid' }]"
            @click="viewMode = 'grid'"
            :title="t('instances.gridView')"
          >
            <UiIcon name="grid" :size="16" />
          </button>
          <button
            :class="['view-btn', { active: viewMode === 'list' }]"
            @click="viewMode = 'list'"
            :title="t('instances.listView')"
          >
            <UiIcon name="menu" :size="16" />
          </button>
        </div>
        <button class="btn-create" @click="createInstance">
          <UiIcon name="add" :size="16" />
          <span>{{ t('instances.create') }}</span>
        </button>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="instances-content">
      <!-- 空状态 -->
      <div v-if="filteredInstances.length === 0" class="empty-state">
        <UiIcon name="folder" :size="48" class="empty-icon" />
        <p class="empty-text">{{ t('instances.noInstances') }}</p>
        <button class="btn-primary" @click="createInstance">
          <UiIcon name="add" :size="16" />
          {{ t('instances.createFirst') }}
        </button>
      </div>

      <!-- 网格视图 -->
      <div v-else-if="viewMode === 'grid'" class="grid-view">
        <div
          v-for="instance in filteredInstances"
          :key="instance.id"
          :class="['instance-card', { running: instance.isRunning }]"
          @click="launchInstance(instance)"
        >
          <div class="card-cover">
            <img
              v-if="instance.coverUrl"
              :src="instance.coverUrl"
              :alt="instance.name"
              class="cover-image"
            />
            <div v-else class="cover-placeholder">
              <UiIcon name="cube" :size="32" />
            </div>
            <div class="card-cover-overlay">
              <button
                class="overlay-btn overlay-play"
                :title="t('instances.launch')"
                @click.stop="launchInstance(instance)"
              >
                <UiIcon name="play" :size="18" />
              </button>
              <button
                class="overlay-btn overlay-edit"
                :title="t('common.edit')"
                @click.stop="editInstance(instance)"
              >
                <UiIcon name="settings" :size="14" />
              </button>
              <button
                class="overlay-btn overlay-delete"
                :title="t('common.delete')"
                @click.stop="confirmDelete(instance)"
              >
                <UiIcon name="trash" :size="14" />
              </button>
            </div>
            <span v-if="instance.isRunning" class="running-badge">{{ t('instances.running') }}</span>
          </div>
          <div class="card-body">
            <div class="card-name">{{ instance.name }}</div>
            <div class="card-meta">
              <span class="card-version-tag">{{ instance.version }}</span>
              <span class="card-time">{{ instance.lastPlayed || t('instances.neverPlayed') }}</span>
            </div>
          </div>
        </div>
      </div>

      </TransitionGroup>
      <!-- 列表视图 -->
      <div v-else class="list-view">
        <div class="list-header">
          <span class="col-name">{{ t('instances.instanceName') }}</span>
          <span class="col-version">{{ t('instances.version') }}</span>
          <span class="col-time">{{ t('instances.lastPlayed') }}</span>
          <span class="col-status">{{ t('instances.status') }}</span>
          <span class="col-actions"></span>
        </div>
        <div
          v-for="instance in filteredInstances"
          :key="instance.id"
          :class="['list-row', { running: instance.isRunning }]"
          @click="launchInstance(instance)"
        >
          <div class="col-name">
            <div class="list-item-icon">
              <img v-if="instance.coverUrl" :src="instance.coverUrl" class="item-thumb" />
              <UiIcon v-else name="cube" :size="20" />
            </div>
            <span class="list-item-name">{{ instance.name }}</span>
          </div>
          <div class="col-version">
            <span class="version-tag">{{ instance.version }}</span>
          </div>
          <div class="col-time">
            <span class="time-text">{{ instance.lastPlayed || t('instances.neverPlayed') }}</span>
          </div>
          <div class="col-status">
            <span :class="['status-dot', instance.isRunning ? 'status-running' : 'status-stopped']"></span>
            <span>{{ instance.isRunning ? t('instances.running') : t('instances.stopped') }}</span>
          </div>
          <div class="col-actions">
            <button
              class="row-action-btn"
              :title="t('instances.launch')"
              @click.stop="launchInstance(instance)"
            >
              <UiIcon name="play" :size="14" />
            </button>
            <button
              class="row-action-btn"
              :title="t('common.edit')"
              @click.stop="editInstance(instance)"
            >
              <UiIcon name="settings" :size="14" />
            </button>
            <button
              class="row-action-btn row-action-delete"
              :title="t('common.delete')"
              @click.stop="confirmDelete(instance)"
            >
              <UiIcon name="trash" :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useIntervalFn } from '@/composables/useIntervalFn'
import { useGlassMessage } from '@/composables/useGlassMessage'
import backend from '@/api/client'
import UiIcon from '@/components/ui/Icon.vue'

interface Instance {
  id: string
  name: string
  version: string
  coverUrl?: string
  lastPlayed?: string
  isRunning: boolean
  gamePath?: string
}

const { t } = useI18n()
const router = useRouter()
const message = useGlassMessage()
const { loading, run } = useAsyncAction({ showSuccess: false, showError: false })

const instances = ref<Instance[]>([])
const searchQuery = ref('')
const activeFilter = ref('all')
const viewMode = ref<'grid' | 'list'>('grid')

const filters = computed(() => [
  { key: 'all', label: t('instances.filterAll') },
  { key: 'running', label: t('instances.filterRunning') },
  { key: 'stopped', label: t('instances.filterStopped') },
])

const filteredInstances = computed(() => {
  let result = instances.value
  if (activeFilter.value === 'running') {
    result = result.filter(i => i.isRunning)
  } else if (activeFilter.value === 'stopped') {
    result = result.filter(i => !i.isRunning)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.version.toLowerCase().includes(q)
    )
  }
  return result
})

const { resume: startPolling } = useIntervalFn(loadInstances, 3000)

async function loadInstances() {
  const result = await run(async () => backend.command('instances_list'))
  if (result?.success && result.data) {
    instances.value = result.data
  } else {
    instances.value = []
  }
}

async function launchInstance(instance: Instance) {
  message.info(`${t('instances.launching')} ${instance.name}...`)
  const result = await run(
    async () => backend.command('launch_instance', {
      version_id: instance.version || instance.id,
      game_path: instance.gamePath
    }),
    {
      showSuccess: false,
      showError: true,
      errorMessage: t('instances.launchFailed'),
    }
  )
  if (result?.success) {
    await loadInstances()
  }
}

function createInstance() {
  router.push('/versions/versions')
}

function editInstance(instance: Instance) {
  message.info(`编辑实例: ${instance.name}`)
}

function confirmDelete(instance: Instance) {
  message.info(`删除实例: ${instance.name}`)
  // TODO: 实现确认弹窗
}

onMounted(() => {
  loadInstances()
  startPolling()
})
</script>

<style scoped>
.instances-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 工具栏 */
.instances-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-lg);
  margin-bottom: var(--s-lg);
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: var(--s-md);
  flex: 1;
  min-width: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  flex-shrink: 0;
}

/* 搜索框 */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 198px;
  height: 32px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  transition: border-color 150ms ease-out;
}

.search-box:focus-within {
  border-color: var(--border-hover);
}

.search-icon {
  position: absolute;
  left: 9px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 100%;
  padding: 0 29px 0 29px;
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--text-primary);
  outline: none;
  border-radius: var(--r-sm);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.search-clear {
  position: absolute;
  right: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: var(--r-xs);
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.search-clear:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

/* 筛选标签 */
.filter-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-chip {
  padding: 4px 11px;
  border-radius: var(--r-xs);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.filter-chip:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.filter-chip.active {
  background: var(--primary-alpha);
  color: var(--primary);
  border-color: var(--border-active);
}

/* 视图切换 */
.view-toggle {
  display: flex;
  border: 1px solid var(--border);
  border-radius: var(--r-xs);
  overflow: hidden;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 29px;
  height: 29px;
  border: none;
  background: var(--bg-elevated);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.view-btn:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.view-btn.active {
  background: var(--primary-alpha);
  color: var(--primary);
}

/* 创建按钮 */
.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: var(--r-sm);
  border: none;
  background: var(--primary);
  color: var(--text-on-primary);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.btn-create:hover {
  background: var(--primary-hover);
}

.btn-create:active {
  transform: translateY(1px);
}

/* 内容区 */
.instances-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--s-md);
}

.empty-icon {
  color: var(--text-tertiary);
}

.empty-text {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--s-sm);
  padding: 9px 18px;
  border-radius: var(--r-sm);
  border: none;
  background: var(--primary);
  color: var(--text-on-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-primary:active {
  transform: translateY(1px);
}

/* 网格视图 */
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(216px, 1fr));
  gap: var(--s-lg);
  padding-bottom: var(--s-lg);
}

.instance-card {
  background: var(--card-bg);
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  border-radius: var(--r-sm);
  overflow: hidden;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.instance-card:hover {
  border-color: var(--border-hover);
}

.instance-card.running {
  border-color: var(--primary);
}

/* 封面 */
.card-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--bg-base-alt);
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.card-cover-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--s-sm);
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.instance-card:hover .card-cover-overlay {
  opacity: 1;
}

.overlay-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-sm);
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.overlay-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.overlay-delete:hover {
  background: var(--error);
}

.running-badge {
  position: absolute;
  top: 7px;
  right: 7px;
  padding: 2px 7px;
  border-radius: var(--r-xs);
  background: var(--primary);
  color: var(--text-on-primary);
  font-size: 10px;
  font-weight: 500;
}

/* 卡片主体 */
.card-body {
  padding: 11px 14px;
}

.card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-version-tag {
  padding: 2px 5px;
  border-radius: var(--r-xs);
  background: var(--bg-base-alt);
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 500;
}

.card-time {
  font-size: 10px;
  color: var(--text-tertiary);
}

/* 列表视图 */
.list-view {
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  align-items: center;
  padding: 0 14px;
  height: 32px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--divider);
  background: var(--card-bg);
  border-top: var(--card-border-top);
  border-radius: var(--r-sm) var(--r-sm) 0 0;
}

.list-row {
  display: flex;
  align-items: center;
  padding: 0 14px;
  height: 50px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--divider);
  cursor: pointer;
  transition: background 150ms ease-out;
}

.list-row:hover {
  background: var(--bg-hover);
}

.list-row:last-child {
  border-radius: 0 0 var(--r-sm) var(--r-sm);
  border-bottom: var(--card-border-bottom);
}

.list-row.running {
  border-left: 3px solid var(--primary);
}

.col-name {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--s-md);
}

.col-version { width: 90px; flex-shrink: 0; }
.col-time { width: 126px; flex-shrink: 0; }
.col-status { width: 72px; flex-shrink: 0; }
.col-actions { width: 108px; flex-shrink: 0; display: flex; justify-content: flex-end; gap: 4px; }

.list-item-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--r-sm);
  background: var(--bg-base-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  flex-shrink: 0;
  overflow: hidden;
}

.item-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.list-item-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.version-tag {
  padding: 2px 7px;
  border-radius: var(--r-xs);
  background: var(--bg-base-alt);
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.time-text {
  font-size: 11px;
  color: var(--text-tertiary);
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  margin-right: 5px;
}

.status-running { background: var(--success); }
.status-stopped { background: var(--text-tertiary); }

.row-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  height: 25px;
  border-radius: var(--r-xs);
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  opacity: 0;
  transition: all 150ms ease-out;
}

.list-row:hover .row-action-btn {
  opacity: 1;
}

.row-action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.row-action-delete:hover {
  color: var(--error);
  background: var(--error-alpha);
}
</style>