<template>
  <div class="plugins-page">
    <section class="plugins-panel ecl-surface">
      <header class="plugins-toolbar">
        <div class="plugins-title">
          <UiIcon name="plugin" :size="17" />
          <span>{{ t('sidebar.plugins') }}</span>
        </div>

        <NInput
          v-model:value="searchQuery"
          class="plugins-search"
          clearable
          size="small"
          :placeholder="t('plugins.searchPlugins')"
        >
          <template #prefix><UiIcon name="search" :size="14" /></template>
        </NInput>

        <NRadioGroup v-model:value="activeFilter" size="small">
          <NRadioButton v-for="filter in filters" :key="filter.key" :value="filter.key">
            {{ filter.label }}
          </NRadioButton>
        </NRadioGroup>

        <NButton type="primary" size="small" @click="installPlugin">
          <template #icon><UiIcon name="add" :size="14" /></template>
          {{ t('plugins.install') }}
        </NButton>
      </header>

      <div id="plugin-slot-plugins-toolbar-after" class="plugin-slot-container"></div>

      <div class="plugins-table-header">
        <span>{{ t('plugins.pluginName') }}</span>
        <span>{{ t('plugins.version') }}</span>
        <span>{{ t('plugins.status') }}</span>
        <span></span>
      </div>

      <div class="plugins-list-body">
        <NSpin :show="loading" class="plugins-spin">
          <div v-if="filteredPlugins.length" class="plugins-list">
            <article v-for="plugin in filteredPlugins" :key="plugin.name" class="plugin-row">
              <div class="plugin-identity">
                <div class="plugin-icon">
                  <UiIcon :name="plugin.icon || 'plugin'" :size="16" />
                </div>
                <div class="plugin-content">
                  <span class="plugin-name">{{ plugin.title || plugin.name }}</span>
                  <div class="plugin-description">{{ pluginDescription(plugin) }}</div>
                </div>
              </div>

              <div class="plugin-version">
                <NTag size="small" :bordered="false">v{{ plugin.version }}</NTag>
              </div>

              <div class="plugin-status">
                <NTag size="small" :type="statusType(plugin.status)">
                  {{ t(`plugins.${plugin.status}`) }}
                </NTag>
              </div>

              <NSpace class="plugin-actions" :size="3" :wrap="false">
                <NButton
                  v-if="plugin.settings?.length"
                  quaternary
                  size="tiny"
                  :title="t('plugins.settings')"
                  @click="openSettings(plugin)"
                >
                  <template #icon><UiIcon name="settings" :size="13" /></template>
                </NButton>
                <NButton quaternary size="tiny" @click="togglePlugin(plugin)">
                  {{ plugin.status === 'enabled' ? t('plugins.disable') : t('plugins.enable') }}
                </NButton>
                <NButton
                  quaternary
                  size="tiny"
                  :loading="reloadingPlugins.includes(plugin.name)"
                  :title="t('plugins.reload')"
                  @click="reloadPlugin(plugin)"
                >
                  <template #icon><UiIcon name="refresh" :size="13" /></template>
                </NButton>
                <NPopconfirm @positiveClick="unloadPlugin(plugin)">
                  <template #trigger>
                    <NButton quaternary size="tiny" type="error" :title="t('plugins.unload')">
                      <template #icon><UiIcon name="trash" :size="13" /></template>
                    </NButton>
                  </template>
                  {{ t('plugins.unload') }} {{ plugin.title || plugin.name }}?
                </NPopconfirm>
              </NSpace>
            </article>
          </div>

          <NEmpty
            v-else-if="!loading"
            class="plugins-empty"
            :description="activeFilter === 'disabled' ? t('plugins.noDisabledPlugins') : t('plugins.noPlugins')"
          >
            <template #extra>
              <NButton v-if="activeFilter !== 'disabled'" type="primary" size="small" @click="installPlugin">
                {{ t('plugins.installFirst') }}
              </NButton>
            </template>
          </NEmpty>
        </NSpin>
        <div id="plugin-slot-plugins-list-bottom" class="plugin-slot-container"></div>
      </div>
    </section>

    <PluginSettingsModal
      :visible="settingsModalVisible"
      :plugin="settingsTarget"
      @close="settingsModalVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { NButton, NEmpty, NInput, NPopconfirm, NRadioButton, NRadioGroup, NSpace, NSpin, NTag } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import UiIcon from '@/components/ui/Icon.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import PluginSettingsModal from '@/features/plugins/components/PluginSettingsModal.vue'
import { usePluginStore } from '@/features/plugins/stores/pluginStore'
import type { PluginInfo } from '@/types/api'

const { t } = useI18n()
const { run } = useAsyncAction({ showSuccess: false, showError: false })
const pluginStore = usePluginStore()
const { plugins, loading, reloadingPlugins } = storeToRefs(pluginStore)
const searchQuery = ref('')
const activeFilter = ref('all')
const settingsModalVisible = ref(false)
const settingsTarget = ref<PluginInfo | null>(null)

const filters = computed(() => [
  { key: 'all', label: t('plugins.filterAll') },
  { key: 'enabled', label: t('plugins.filterEnabled') },
  { key: 'disabled', label: t('plugins.filterDisabled') },
])

const filteredPlugins = computed(() => {
  let result = plugins.value
  if (activeFilter.value === 'enabled') {
    result = result.filter((plugin) => plugin.status === 'enabled')
  } else if (activeFilter.value === 'disabled') {
    result = result.filter((plugin) => plugin.status === 'disabled' || plugin.status === 'error')
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return result
  return result.filter(
    (plugin) =>
      plugin.name.toLowerCase().includes(query) ||
      plugin.title?.toLowerCase().includes(query) ||
      plugin.author?.toLowerCase().includes(query) ||
      plugin.description?.toLowerCase().includes(query)
  )
})

function statusType(status: string): 'success' | 'error' | 'default' {
  if (status === 'enabled') return 'success'
  if (status === 'error') return 'error'
  return 'default'
}

function pluginDescription(plugin: PluginInfo): string {
  return [plugin.description || plugin.name, plugin.author].filter(Boolean).join(' · ')
}

async function togglePlugin(plugin: PluginInfo) {
  const action = plugin.status === 'enabled' ? 'disable' : 'enable'
  await run(async () => pluginStore.toggle(plugin), {
    showSuccess: true,
    successMessage: t(`plugins.${action}Success`, { name: plugin.title || plugin.name }),
    showError: true,
    errorMessage: t(`plugins.${action}Failed`),
  })
}

async function reloadPlugin(plugin: PluginInfo) {
  if (reloadingPlugins.value.includes(plugin.name)) return
  await run(async () => pluginStore.reload(plugin.name), {
    showSuccess: true,
    successMessage: t('plugins.reloadSuccess', { name: plugin.title || plugin.name }),
    showError: true,
    errorMessage: t('plugins.reloadFailed'),
  })
}

async function unloadPlugin(plugin: PluginInfo) {
  await run(async () => pluginStore.unload(plugin.name), {
    showSuccess: true,
    successMessage: t('plugins.unloadSuccess', { name: plugin.title || plugin.name }),
    showError: true,
    errorMessage: t('plugins.unloadFailed'),
  })
}

async function installPlugin() {
  await run(async () => pluginStore.install(), {
    showSuccess: true,
    successMessage: t('plugins.installSuccess'),
    showError: true,
    errorMessage: t('plugins.installFailed'),
  })
}

function openSettings(plugin: PluginInfo) {
  settingsTarget.value = plugin
  settingsModalVisible.value = true
}

onMounted(() => void pluginStore.start().catch(() => {}))
onUnmounted(() => pluginStore.stop())
</script>

<style scoped src="@/styles/views/Plugins.css"></style>
