<template>
  <div class="plugins-page">
    <!-- 顶部工具栏 -->
    <div class="plugins-toolbar">
      <div class="toolbar-left">
        <div class="search-box">
          <UiIcon
            name="search"
            :size="16"
            class="search-icon"
          />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('plugins.searchPlugins')"
            class="search-input"
          >
          <button
            v-if="searchQuery"
            class="search-clear"
            @click="searchQuery = ''"
          >
            <UiIcon
              name="close"
              :size="14"
            />
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
        <button
          class="btn-create"
          @click="installPlugin"
        >
          <UiIcon
            name="add"
            :size="16"
          />
          <span>{{ t('plugins.install') }}</span>
        </button>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="plugins-content">
      <!-- 空状态 -->
      <div
        v-if="filteredPlugins.length === 0 && !loading"
        class="empty-state"
      >
        <UiIcon
          name="lab"
          :size="48"
          class="empty-icon"
        />
        <template v-if="activeFilter === 'disabled'">
          <p class="empty-text">
            {{ t('plugins.noDisabledPlugins') }}
          </p>
          <p class="empty-hint">
            {{ t('plugins.noDisabledPluginsHint') }}
          </p>
        </template>
        <template v-else>
          <p class="empty-text">
            {{ t('plugins.noPlugins') }}
          </p>
          <p class="empty-hint">
            {{ t('plugins.noPluginsHint') }}
          </p>
          <button
            class="btn-primary"
            @click="installPlugin"
          >
            <UiIcon
              name="add"
              :size="16"
            />
            {{ t('plugins.installFirst') }}
          </button>
        </template>
      </div>

      <!-- 加载中 -->
      <div
        v-else-if="loading && filteredPlugins.length === 0"
        class="loading-state"
      >
        <UiIcon
          name="loading"
          :size="24"
          class="loading-icon"
        />
        <span class="loading-text">{{ t('plugins.loading') }}</span>
      </div>

      <div class="list-view">
        <!-- 列表视图 -->
        <div class="list-header">
          <span class="col-name">{{ t('plugins.pluginName') }}</span>
          <span class="col-version">{{ t('plugins.version') }}</span>
          <span class="col-author">{{ t('plugins.author') }}</span>
          <span class="col-status">{{ t('plugins.status') }}</span>
          <span class="col-actions" />
        </div>
        <div
          v-for="plugin in filteredPlugins"
          :key="plugin.name"
          :class="['list-row', `list-row--${plugin.status}`]"
        >
          <div class="col-name">
            <div class="list-item-icon">
              <UiIcon
                :name="plugin.icon || 'lab'"
                :size="18"
              />
            </div>
            <div class="list-item-info">
              <span class="list-item-name">{{ plugin.title || plugin.name }}</span>
              <span
                v-if="plugin.description"
                class="list-item-desc"
              >{{ plugin.description }}</span>
            </div>
          </div>
          <div class="col-version">
            <span class="version-tag">{{ plugin.version }}</span>
          </div>
          <div class="col-author">
            <span class="author-text">{{ plugin.author || '-' }}</span>
          </div>
          <div class="col-status">
            <span :class="['status-dot', `status-${plugin.status}`]" />
            <span class="status-text">{{ t(`plugins.${plugin.status}`) }}</span>
          </div>
          <div class="col-actions">
            <button
              class="row-action-btn"
              :title="plugin.status === 'enabled' ? t('plugins.disable') : t('plugins.enable')"
              @click="togglePlugin(plugin)"
            >
              <UiIcon
                :name="plugin.status === 'enabled' ? 'check' : 'play'"
                :size="14"
              />
            </button>
            <button
              class="row-action-btn"
              :title="t('plugins.reload')"
              :disabled="reloadingPlugins.includes(plugin.name)"
              @click="reloadPlugin(plugin)"
            >
              <UiIcon
                name="refresh"
                :size="14"
              />
            </button>
            <button
              class="row-action-btn row-action-danger"
              :title="t('plugins.unload')"
              @click="unloadPlugin(plugin)"
            >
              <UiIcon
                name="trash"
                :size="14"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import UiIcon from '@/components/ui/Icon.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'

interface Plugin {
  name: string
  title?: string
  version: string
  author?: string
  description?: string
  icon?: string
  status: 'enabled' | 'disabled' | 'error' | string
}

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

<style scoped src="@/styles/Plugins.css"></style>

