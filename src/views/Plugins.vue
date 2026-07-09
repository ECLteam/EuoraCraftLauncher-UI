<template>
  <div class="plugins-page">
    <!-- 顶部工具栏 -->
    <div class="plugins-toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <UiIcon name="search" :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('plugins.searchPlugins')"
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
            :title="t('plugins.gridView')"
          >
            <UiIcon name="grid" :size="16" />
          </button>
          <button
            :class="['view-btn', { active: viewMode === 'list' }]"
            @click="viewMode = 'list'"
            :title="t('plugins.listView')"
          >
            <UiIcon name="menu" :size="16" />
          </button>
        </div>
        <button class="btn-create" @click="installPlugin">
          <UiIcon name="add" :size="16" />
          <span>{{ t('plugins.install') }}</span>
        </button>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="plugins-content">
      <!-- 空状态 -->
      <div v-if="filteredPlugins.length === 0 && !loading" class="empty-state">
        <UiIcon name="lab" :size="48" class="empty-icon" />
        <p class="empty-text">{{ t('plugins.noPlugins') }}</p>
        <p class="empty-hint">{{ t('plugins.noPluginsHint') }}</p>
        <button class="btn-primary" @click="installPlugin">
          <UiIcon name="add" :size="16" />
          {{ t('plugins.installFirst') }}
        </button>
      </div>

      <!-- 加载中 -->
      <div v-else-if="loading && filteredPlugins.length === 0" class="loading-state">
        <UiIcon name="loading" :size="24" class="loading-icon" />
        <span class="loading-text">{{ t('plugins.loading') }}</span>
      </div>

      <!-- 网格视图 -->
      <div v-else-if="viewMode === 'grid'" class="grid-view">
        <div
          v-for="plugin in filteredPlugins"
          :key="plugin.name"
          :class="['plugin-card', `plugin-card--${plugin.status}`]"
        >
          <div class="card-icon-area">
            <div class="card-icon">
              <UiIcon :name="plugin.icon || 'lab'" :size="28" />
            </div>
            <span :class="['status-badge', `status-${plugin.status}`]">
              {{ t(`plugins.${plugin.status}`) }}
            </span>
          </div>
          <div class="card-body">
            <div class="card-name">{{ plugin.title || plugin.name }}</div>
            <div class="card-meta">
              <span class="version-tag">{{ plugin.version }}</span>
              <span v-if="plugin.author" class="author-text">{{ plugin.author }}</span>
            </div>
            <p v-if="plugin.description" class="card-desc">{{ plugin.description }}</p>
          </div>
          <div class="card-actions">
            <button
              class="action-btn"
              :class="{ 'action-btn--active': plugin.status === 'enabled' }"
              :title="plugin.status === 'enabled' ? t('plugins.disable') : t('plugins.enable')"
              @click="togglePlugin(plugin)"
            >
              <UiIcon :name="plugin.status === 'enabled' ? 'check' : 'play'" :size="14" />
            </button>
            <button
              class="action-btn"
              :title="t('plugins.reload')"
              :disabled="reloadingPlugins.includes(plugin.name)"
              @click="reloadPlugin(plugin)"
            >
              <UiIcon name="refresh" :size="14" />
            </button>
            <button
              class="action-btn"
              :title="t('plugins.settings')"
              @click="openPluginSettings(plugin)"
            >
              <UiIcon name="settings" :size="14" />
            </button>
            <button
              class="action-btn action-btn--danger"
              :title="t('plugins.unload')"
              @click="unloadPlugin(plugin)"
            >
              <UiIcon name="trash" :size="14" />
            </button>
          </div>
        </div>
      </div>
      <div v-else class="list-view">
        <!-- 列表视图 -->
        <div class="list-header">
          <span class="col-name">{{ t('plugins.pluginName') }}</span>
          <span class="col-version">{{ t('plugins.version') }}</span>
          <span class="col-author">{{ t('plugins.author') }}</span>
          <span class="col-status">{{ t('plugins.status') }}</span>
          <span class="col-actions"></span>
        </div>
        <div
          v-for="plugin in filteredPlugins"
          :key="plugin.name"
          :class="['list-row', `list-row--${plugin.status}`]"
        >
          <div class="col-name">
            <div class="list-item-icon">
              <UiIcon :name="plugin.icon || 'lab'" :size="18" />
            </div>
            <div class="list-item-info">
              <span class="list-item-name">{{ plugin.title || plugin.name }}</span>
              <span v-if="plugin.description" class="list-item-desc">{{ plugin.description }}</span>
            </div>
          </div>
          <div class="col-version">
            <span class="version-tag">{{ plugin.version }}</span>
          </div>
          <div class="col-author">
            <span class="author-text">{{ plugin.author || '-' }}</span>
          </div>
          <div class="col-status">
            <span :class="['status-dot', `status-${plugin.status}`]"></span>
            <span class="status-text">{{ t(`plugins.${plugin.status}`) }}</span>
          </div>
          <div class="col-actions">
            <button
              class="row-action-btn"
              :title="plugin.status === 'enabled' ? t('plugins.disable') : t('plugins.enable')"
              @click="togglePlugin(plugin)"
            >
              <UiIcon :name="plugin.status === 'enabled' ? 'check' : 'play'" :size="14" />
            </button>
            <button
              class="row-action-btn"
              :title="t('plugins.reload')"
              :disabled="reloadingPlugins.includes(plugin.name)"
              @click="reloadPlugin(plugin)"
            >
              <UiIcon name="refresh" :size="14" />
            </button>
            <button
              class="row-action-btn row-action-danger"
              :title="t('plugins.unload')"
              @click="unloadPlugin(plugin)"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useGlassMessage } from '@/composables/useGlassMessage'
import backend from '@/api/client'
import UiIcon from '@/components/ui/Icon.vue'

interface Plugin {
  name: string
  title?: string
  version: string
  author?: string
  description?: string
  icon?: string
  status: 'enabled' | 'disabled' | 'error' | string
}

const router = useRouter()
const { t } = useI18n()
const message = useGlassMessage()

const plugins = ref<Plugin[]>([])
const loading = ref(false)
const reloadingPlugins = ref<string[]>([])
const searchQuery = ref('')
const activeFilter = ref('all')
const viewMode = ref<'grid' | 'list'>('grid')

const filters = computed(() => [
  { key: 'all', label: t('plugins.filterAll') },
  { key: 'enabled', label: t('plugins.filterEnabled') },
  { key: 'disabled', label: t('plugins.filterDisabled') },
])

const filteredPlugins = computed(() => {
  let result = plugins.value
  if (activeFilter.value === 'enabled') {
    result = result.filter(p => p.status === 'enabled')
  } else if (activeFilter.value === 'disabled') {
    result = result.filter(p => p.status === 'disabled' || p.status === 'error')
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.author && p.author.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    )
  }
  return result
})

async function loadPlugins() {
  loading.value = true
  try {
    const result = await backend.command('plugin_list')
    if (result.success && result.data) {
      plugins.value = result.data
    } else {
      plugins.value = []
    }
  } catch (e) {
    console.error('Failed to load plugins:', e)
  } finally {
    loading.value = false
  }
}

async function togglePlugin(plugin: Plugin) {
  const action = plugin.status === 'enabled' ? 'disable' : 'enable'
  try {
    const result = await backend.command(
      action === 'enable' ? 'plugin_enable' : 'plugin_disable',
      { plugin_name: plugin.name }
    )
    if (result.success) {
      message.success(t(`plugins.${action}Success`, { name: plugin.title || plugin.name }))
    } else {
      message.error(result.message || t(`plugins.${action}Failed`))
    }
  } catch (e) {
    message.error(t(`plugins.${action}Failed`))
  }
}

async function reloadPlugin(plugin: Plugin) {
  if (reloadingPlugins.value.includes(plugin.name)) return
  reloadingPlugins.value = [...reloadingPlugins.value, plugin.name]
  try {
    const result = await backend.command('plugin_reload', { plugin_name: plugin.name })
    if (result.success) {
      message.success(t('plugins.reloadSuccess', { name: plugin.title || plugin.name }))
    } else {
      message.error(result.message || t('plugins.reloadFailed'))
    }
  } catch (e) {
    message.error(t('plugins.reloadFailed'))
  } finally {
    reloadingPlugins.value = reloadingPlugins.value.filter(n => n !== plugin.name)
  }
}

async function unloadPlugin(plugin: Plugin) {
  try {
    const result = await backend.command('plugin_unload', { plugin_name: plugin.name })
    if (result.success) {
      message.success(t('plugins.unloadSuccess', { name: plugin.title || plugin.name }))
    } else {
      message.error(result.message || t('plugins.unloadFailed'))
    }
  } catch (e) {
    message.error(t('plugins.unloadFailed'))
  }
}

function openPluginSettings(plugin: Plugin) {
  router.push('/settings/plugins')
}

async function installPlugin() {
  try {
    const result = await backend.command('select_directory')
    if (!result.success || !result.data?.path) return

    const dirPath = result.data.path
    const installResult = await backend.command('plugin_install', { plugin_path: dirPath })
    if (installResult.success) {
      message.success(t('plugins.installSuccess'))
    } else {
      message.error(installResult.message || t('plugins.installFailed'))
    }
  } catch (e) {
    message.error(t('plugins.installFailed'))
  }
}

let unlistenPluginStatus: (() => void) | null = null
let loadDebounceTimer: ReturnType<typeof setTimeout> | null = null

function debouncedLoadPlugins() {
  if (loadDebounceTimer) clearTimeout(loadDebounceTimer)
  loadDebounceTimer = setTimeout(() => {
    loadPlugins()
  }, 150)
}

onMounted(() => {
  loadPlugins()
  unlistenPluginStatus = backend.on('plugin:status_changed', debouncedLoadPlugins)
})

onUnmounted(() => {
  if (loadDebounceTimer) clearTimeout(loadDebounceTimer)
  if (unlistenPluginStatus) {
    unlistenPluginStatus()
    unlistenPluginStatus = null
  }
})
</script>

<style scoped>
.plugins-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* ── 工具栏 ── */
.plugins-toolbar {
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

/* ── 搜索框 ── */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 240px;
  height: 36px;
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
  left: 10px;
  color: var(--text-tertiary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 100%;
  padding: 0 32px 0 32px;
  border: none;
  background: transparent;
  font-size: 13px;
  color: var(--text-primary);
  outline: none;
  border-radius: var(--r-sm);
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.search-clear {
  position: absolute;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
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

/* ── 筛选标签 ── */
.filter-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-chip {
  padding: 4px 12px;
  border-radius: var(--r-xs);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
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

/* ── 视图切换 ── */
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
  width: 32px;
  height: 32px;
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

/* ── 安装按钮 ── */
.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--r-sm);
  border: none;
  background: var(--primary);
  color: var(--text-on-primary);
  font-size: 13px;
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

/* ── 内容区 ── */
.plugins-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

/* ── 加载状态 ── */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--s-md);
}

.loading-icon {
  color: var(--text-tertiary);
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 13px;
  color: var(--text-tertiary);
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── 空状态 ── */
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
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.empty-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--s-sm);
  padding: 10px 20px;
  border-radius: var(--r-sm);
  border: none;
  background: var(--primary);
  color: var(--text-on-primary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

/* ── 网格视图 ── */
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--s-lg);
  padding-bottom: var(--s-lg);
}

.plugin-card {
  background: var(--card-bg);
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  border-radius: var(--r-sm);
  overflow: hidden;
  transition: all 150ms ease-out;
  display: flex;
  flex-direction: column;
}

.plugin-card:hover {
  border-color: var(--border-hover);
}

.plugin-card:hover .card-actions {
  opacity: 1;
}

/* 图标区域 */
.card-icon-area {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--bg-base-alt);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--r-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}

/* 状态标签 */
.status-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 2px 8px;
  border-radius: var(--r-xs);
  font-size: 11px;
  font-weight: 500;
}

.status-badge.status-enabled {
  background: var(--success);
  color: #fff;
}

.status-badge.status-disabled {
  background: var(--bg-elevated);
  color: var(--text-tertiary);
}

.status-badge.status-error {
  background: var(--error);
  color: #fff;
}

.status-badge.status-unknown {
  background: #e5a100;
  color: #fff;
}

/* 卡片主体 */
.card-body {
  padding: 12px 16px 8px;
  flex: 1;
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  margin-bottom: 6px;
}

.version-tag {
  padding: 2px 6px;
  border-radius: var(--r-xs);
  background: var(--bg-base-alt);
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.author-text {
  font-size: 11px;
  color: var(--text-tertiary);
}

.card-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 卡片底部操作 */
.card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  padding: 8px 12px;
  border-top: 1px solid var(--divider);
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--r-xs);
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.action-btn--active {
  color: var(--success);
}

.action-btn--active:hover {
  background: var(--success);
  color: #fff;
}

.action-btn--danger:hover {
  color: var(--error);
  background: var(--error-alpha);
}

/* ── 列表视图 ── */
.list-view {
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 36px;
  font-size: 12px;
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
  padding: 0 16px;
  height: 56px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--divider);
  transition: background 150ms ease-out;
}

.list-row:hover {
  background: var(--bg-hover);
}

.list-row:last-child {
  border-radius: 0 0 var(--r-sm) var(--r-sm);
  border-bottom: var(--card-border-bottom);
}

.list-row--enabled {
  border-left: 3px solid var(--success);
}

.list-row--error {
  border-left: 3px solid var(--error);
}

/* 列宽 */
.col-name {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--s-md);
}

.col-version { width: 100px; flex-shrink: 0; }
.col-author { width: 120px; flex-shrink: 0; }
.col-status { width: 100px; flex-shrink: 0; display: flex; align-items: center; gap: 6px; }
.col-actions { width: 110px; flex-shrink: 0; display: flex; justify-content: flex-end; gap: 4px; }

.list-item-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--r-sm);
  background: var(--bg-base-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.list-item-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.list-item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-item-desc {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.author-text {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 状态点 */
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.status-enabled { background: var(--success); }
.status-dot.status-disabled { background: var(--text-tertiary); }
.status-dot.status-error { background: var(--error); }
.status-dot.status-unknown { background: #e5a100; }

.status-text {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 行操作按钮 */
.row-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
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

.row-action-danger:hover {
  color: var(--error);
  background: var(--error-alpha);
}
</style>
