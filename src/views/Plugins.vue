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
        <template v-if="activeFilter === 'disabled'">
          <p class="empty-text">{{ t('plugins.noDisabledPlugins') }}</p>
          <p class="empty-hint">{{ t('plugins.noDisabledPluginsHint') }}</p>
        </template>
        <template v-else>
          <p class="empty-text">{{ t('plugins.noPlugins') }}</p>
          <p class="empty-hint">{{ t('plugins.noPluginsHint') }}</p>
          <button class="btn-primary" @click="installPlugin">
            <UiIcon name="add" :size="16" />
            {{ t('plugins.installFirst') }}
          </button>
        </template>
      </div>

      <!-- 加载中 -->
      <div v-else-if="loading && filteredPlugins.length === 0" class="loading-state">
        <UiIcon name="loading" :size="24" class="loading-icon" />
        <span class="loading-text">{{ t('plugins.loading') }}</span>
      </div>

      <div class="list-view">
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
import { useAsyncAction } from '@/composables/useAsyncAction'
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
const { loading, run } = useAsyncAction({ showSuccess: false, showError: false })

const plugins = ref<Plugin[]>([])
const reloadingPlugins = ref<string[]>([])
const searchQuery = ref('')
const activeFilter = ref('all')

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
  const result = await run(async () => backend.command('plugin_list'))
  if (result?.success && result.data) {
    plugins.value = result.data
  } else {
    plugins.value = []
  }
}

async function togglePlugin(plugin: Plugin) {
  const action = plugin.status === 'enabled' ? 'disable' : 'enable'
  const command = action === 'enable' ? 'plugin_enable' : 'plugin_disable'
  const result = await run(
    async () => backend.command(command, { plugin_name: plugin.name }),
    {
      showSuccess: true,
      successMessage: t(`plugins.${action}Success`, { name: plugin.title || plugin.name }),
      showError: true,
      errorMessage: t(`plugins.${action}Failed`),
    }
  )
  if (!result?.success) return
  await loadPlugins()
}

async function reloadPlugin(plugin: Plugin) {
  if (reloadingPlugins.value.includes(plugin.name)) return
  reloadingPlugins.value = [...reloadingPlugins.value, plugin.name]
  const result = await run(
    async () => backend.command('plugin_reload', { plugin_name: plugin.name }),
    {
      showSuccess: true,
      successMessage: t('plugins.reloadSuccess', { name: plugin.title || plugin.name }),
      showError: true,
      errorMessage: t('plugins.reloadFailed'),
    }
  )
  reloadingPlugins.value = reloadingPlugins.value.filter(n => n !== plugin.name)
  if (result?.success) await loadPlugins()
}

async function unloadPlugin(plugin: Plugin) {
  const result = await run(
    async () => backend.command('plugin_unload', { plugin_name: plugin.name }),
    {
      showSuccess: true,
      successMessage: t('plugins.unloadSuccess', { name: plugin.title || plugin.name }),
      showError: true,
      errorMessage: t('plugins.unloadFailed'),
    }
  )
  if (result?.success) await loadPlugins()
}

function openPluginSettings(plugin: Plugin) {
  router.push('/settings/plugins')
}

async function installPlugin() {
  const result = await run(async () => backend.command('select_directory'))
  if (!result?.success || !result.data?.path) return

  const installResult = await run(
    async () => backend.command('plugin_install', { plugin_path: result.data.path }),
    {
      showSuccess: true,
      successMessage: t('plugins.installSuccess'),
      showError: true,
      errorMessage: t('plugins.installFailed'),
    }
  )
  if (installResult?.success) await loadPlugins()
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
  width: 216px;
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

/* ── 筛选标签 ── */
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

/* ── 安装按钮 ── */
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
  font-size: 12px;
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
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.empty-hint {
  font-size: 11px;
  color: var(--text-tertiary);
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

/* ── 列表视图 ── */
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

.col-version { width: 90px; flex-shrink: 0; }
.col-author { width: 108px; flex-shrink: 0; }
.col-status { width: 90px; flex-shrink: 0; display: flex; align-items: center; gap: 5px; }
.col-actions { width: 99px; flex-shrink: 0; display: flex; justify-content: flex-end; gap: 4px; }

.version-tag {
  padding: 2px 5px;
  border-radius: var(--r-xs);
  background: var(--bg-base-alt);
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 500;
}

.author-text {
  font-size: 10px;
  color: var(--text-tertiary);
}

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
}

.list-item-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.list-item-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-item-desc {
  font-size: 10px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.author-text {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* 状态点 */
.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.status-enabled { background: var(--success); }
.status-dot.status-disabled { background: var(--text-tertiary); }
.status-dot.status-error { background: var(--error); }
.status-dot.status-unknown { background: #e5a100; }

.status-text {
  font-size: 11px;
  color: var(--text-secondary);
}

/* 行操作按钮 */
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

.row-action-danger:hover {
  color: var(--error);
  background: var(--error-alpha);
}
</style>
