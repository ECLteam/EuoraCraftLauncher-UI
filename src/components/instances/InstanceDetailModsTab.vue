<template>
  <div
    class="mods-panel"
    @dragover.prevent
    @drop.prevent="handleModDrop"
    @dragenter.prevent="handleModDragEnter"
    @dragleave="handleModDragLeave"
  >
    <div v-if="modDragging" class="mods-drop-overlay">
      <UiIcon name="download" :size="22" />
      <span>{{ t('versions.mods.selectModFileHint') }}</span>
    </div>
    <div class="mods-panel-header">
      <div class="mods-panel-header-left">
        <div class="search-box">
          <UiIcon name="search" :size="15" class="search-icon" />
          <input
            v-model="modSearchQuery"
            type="text"
            class="search-input"
            :placeholder="t('versions.mods.searchPlaceholder')"
          />
          <button v-if="modSearchQuery" class="search-clear" type="button" @click="modSearchQuery = ''">
            <UiIcon name="close" :size="14" />
          </button>
        </div>
        <div class="mods-filter-tabs">
          <button
            v-for="f in modFilterOptions"
            :key="f.value"
            :class="['mods-filter-btn', { active: modFilter === f.value }]"
            @click="modFilter = f.value"
          >
            {{ f.label }}
          </button>
        </div>
      </div>
      <div class="mods-panel-header-right">
        <span v-if="filteredMods.length" class="mods-count">{{
          t('versions.mods.count', { count: filteredMods.length })
        }}</span>
        <NButton size="tiny" secondary @click="emit('openOnlineSearch')">
          <template #icon><UiIcon name="search" :size="14" /></template>
          {{ t('versions.mods.onlineSearch') }}
        </NButton>
        <NButton size="tiny" secondary @click="handleAddMod">
          <template #icon><UiIcon name="add" :size="14" /></template>
          {{ t('versions.mods.addMod') }}
        </NButton>
        <NButton size="tiny" secondary @click="handleOpenModsFolder">
          <template #icon><UiIcon name="folder" :size="14" /></template>
          {{ t('versions.mods.openFolder') }}
        </NButton>
      </div>
    </div>

    <div class="mods-panel-content">
      <NSpin :show="modsLoading" class="mods-spin">
        <template v-if="filteredMods.length">
          <div class="mods-grid">
            <article
              v-for="mod in filteredMods"
              :key="mod.filename"
              :class="['mod-card', { 'is-disabled': !mod.enabled }]"
            >
              <div class="mod-card-head">
                <div class="mod-card-identity">
                  <span class="mod-card-icon"><UiIcon name="cube" :size="18" /></span>
                  <div class="mod-card-title">
                    <strong>{{ mod.name || mod.filename.replace(/\.(jar|disabled)$/, '') }}</strong>
                    <span class="mod-card-filename">{{ mod.filename }}</span>
                  </div>
                </div>
                <span v-if="mod.loader_type" class="badge" :class="'badge-' + mod.loader_type.toLowerCase()">
                  {{ getLoaderName(mod.loader_type) }}
                </span>
                <span v-else class="badge badge-vanilla">{{ t('versions.manage.vanilla') }}</span>
              </div>

              <div class="mod-card-meta">
                <span class="meta-item" :title="t('versions.mods.modVersion')">
                  <UiIcon name="tags" :size="12" />
                  {{ mod.version || t('versions.mods.unknownVersion') }}
                </span>
                <span class="meta-item" :title="t('versions.mods.author')">
                  <UiIcon name="user" :size="12" />
                  {{ mod.author || t('versions.mods.unknownAuthor') }}
                </span>
                <span v-if="mod.game_version" class="meta-item" :title="t('versions.mods.gameVersion')">
                  <UiIcon name="globe" :size="12" />
                  {{ mod.game_version }}
                </span>
              </div>

              <div class="mod-card-foot">
                <div class="mod-card-info">
                  <span class="mod-size">
                    <UiIcon name="archive" :size="12" />
                    {{ formatFileSize(mod.size) }}
                  </span>
                  <span v-if="mod.dependencies.length" class="mod-deps" :title="mod.dependencies.join(', ')">
                    <UiIcon name="link" :size="12" />
                    {{ mod.dependencies.slice(0, 3).join(', ') }}{{ mod.dependencies.length > 3 ? '…' : '' }}
                  </span>
                  <span v-else class="mod-deps mod-deps-empty">
                    <UiIcon name="link" :size="12" />
                    {{ t('versions.mods.noDependencies') }}
                  </span>
                </div>
                <div class="mod-card-actions">
                  <button
                    v-if="mod.project_id"
                    class="btn-action"
                    :title="t('versions.mods.checkOnline')"
                    @click="handleOpenOnline(mod)"
                  >
                    <UiIcon name="external-link" :size="13" />
                  </button>
                  <button class="btn-action btn-delete" :title="t('common.delete')" @click="handleDeleteMod(mod)">
                    <UiIcon name="trash" :size="13" />
                  </button>
                  <NSwitch :value="mod.enabled" size="small" @update:value="handleToggleMod(mod)" />
                </div>
              </div>
            </article>
          </div>
        </template>
        <div v-else-if="!modsLoading" class="mods-empty empty-state">
          <UiIcon name="puzzle" :size="36" class="empty-icon" />
          <p class="empty-text">{{ t('versions.mods.noMods') }}</p>
          <div class="empty-actions" style="display: flex; gap: 8px; margin-top: 4px">
            <NButton size="small" secondary @click="handleAddMod">
              <template #icon><UiIcon name="add" :size="14" /></template>
              {{ t('versions.mods.addMod') }}
            </NButton>
            <NButton size="small" secondary @click="emit('openOnlineSearch')">
              <template #icon><UiIcon name="search" :size="14" /></template>
              {{ t('versions.mods.onlineSearch') }}
            </NButton>
          </div>
        </div>
      </NSpin>
    </div>
  </div>

  <ConfirmDialog
    v-model:visible="confirmVisible"
    :title="confirmTitle"
    :content="confirmContent"
    :loading="confirmLoading"
    :danger="true"
    :closeOnConfirm="false"
    @confirm="handleConfirm"
  />
</template>

<script setup lang="ts">
import { NButton, NSpin, NSwitch } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import ConfirmDialog from '@/components/modals/ConfirmDialog.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { getLoaderName } from '@/config/version'
import { localModsApi } from '@/features/instances/api/localModsApi'
import { modApi } from '@/features/mods/api/modApi'
import type { ModItem, ScannedVersion } from '@/types/api'

defineOptions({ name: 'InstanceDetailModsTab' })

const props = defineProps<{
  version: ScannedVersion | null
}>()

const emit = defineEmits<{
  openOnlineSearch: []
}>()

const { t } = useI18n()
const message = useLauncherMessage()

const mods = ref<ModItem[]>([])
const modsLoading = ref(false)
const modSearchQuery = ref('')
const modFilter = ref<'all' | 'enabled' | 'disabled'>('all')

const modFilterOptions = computed(() => [
  { label: t('versions.mods.filterAll'), value: 'all' as const },
  { label: t('versions.mods.filterEnabled'), value: 'enabled' as const },
  { label: t('versions.mods.filterDisabled'), value: 'disabled' as const },
])

const filteredMods = computed(() => {
  let list = mods.value
  // 筛选
  if (modFilter.value === 'enabled') list = list.filter((m) => m.enabled)
  else if (modFilter.value === 'disabled') list = list.filter((m) => !m.enabled)
  // 搜索
  const q = modSearchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter((m) => m.filename.toLowerCase().includes(q) || (m.name && m.name.toLowerCase().includes(q)))
  }
  return list
})

function getGamePath(): string | null {
  return props.version?.path || props.version?.jsonPath || null
}

async function loadMods() {
  const gamePath = getGamePath()
  if (!gamePath) return
  modsLoading.value = true
  try {
    mods.value = await localModsApi.list(gamePath)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.modAddFailed'))
  } finally {
    modsLoading.value = false
  }
}

async function handleToggleMod(mod: ModItem) {
  const gamePath = getGamePath()
  if (!gamePath) return
  try {
    const result = await localModsApi.toggle(gamePath, mod.filename)
    mod.enabled = result.enabled
    const actionText = result.enabled ? t('versions.mods.toggleEnabled') : t('versions.mods.toggleDisabled')
    message.success(t('versions.mods.modToggled', { name: mod.name || mod.filename, action: actionText }))
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.modToggleFailed'))
  }
}

function handleDeleteMod(mod: ModItem) {
  openConfirm(t('common.delete'), t('versions.mods.deleteConfirm', { name: mod.name || mod.filename }), async () => {
    const gamePath = getGamePath()
    if (!gamePath) return
    try {
      await localModsApi.remove(gamePath, mod.filename)
      mods.value = mods.value.filter((m) => m.filename !== mod.filename)
      message.success(t('versions.mods.modDeleted'))
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('versions.mods.modDeleteFailed'))
    }
  })
}

async function handleAddMod() {
  const gamePath = getGamePath()
  if (!gamePath) return
  try {
    const result = await backend.command('select_file')
    if (!result.success || !result.data?.path) return
    await localModsApi.add(gamePath, result.data.path)
    message.success(t('versions.mods.modAdded'))
    await loadMods()
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.modAddFailed'))
  }
}

const modDragging = ref(false)
let modDragDepth = 0

function handleModDragEnter() {
  modDragDepth += 1
  modDragging.value = true
}

function handleModDragLeave() {
  modDragDepth = Math.max(0, modDragDepth - 1)
  if (modDragDepth === 0) modDragging.value = false
}

async function handleModDrop(event: DragEvent) {
  modDragging.value = false
  modDragDepth = 0
  const gamePath = getGamePath()
  if (!gamePath) return
  const paths = [...(event.dataTransfer?.files || [])]
    .map((file) => (file as File & { path?: string }).path)
    .filter((path): path is string => Boolean(path))
  if (!paths.length) {
    message.warning(t('versions.mods.selectModFileHint'))
    return
  }
  try {
    for (const path of paths) await localModsApi.add(gamePath, path)
    message.success(t('versions.mods.modAdded'))
    await loadMods()
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.modAddFailed'))
  }
}

async function handleOpenModsFolder() {
  const gamePath = getGamePath()
  if (!gamePath) return
  try {
    await localModsApi.openFolder(gamePath)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.modAddFailed'))
  }
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[index]}`
}

async function handleOpenOnline(mod: ModItem) {
  if (!mod.project_id) return
  try {
    await modApi.openUrl(`https://modrinth.com/mod/${mod.project_id}`)
  } catch (error) {
    message.error(error instanceof Error ? error.message : t('versions.mods.openOnlineFailed'))
  }
}

// 实例切换时重新加载模组列表
watch(
  () => props.version?.versionId,
  () => void loadMods(),
  { immediate: true }
)

// ======================== 删除确认 ========================

const confirmVisible = ref(false)
const confirmTitle = ref('')
const confirmContent = ref('')
const confirmLoading = ref(false)
let confirmAction: (() => Promise<void>) | null = null

function openConfirm(title: string, content: string, action: () => Promise<void>) {
  confirmTitle.value = title
  confirmContent.value = content
  confirmAction = action
  confirmLoading.value = false
  confirmVisible.value = true
}

async function handleConfirm() {
  if (!confirmAction || confirmLoading.value) return
  confirmLoading.value = true
  try {
    await confirmAction()
    confirmVisible.value = false
    confirmAction = null
  } finally {
    confirmLoading.value = false
  }
}
</script>

<style scoped src="@/styles/views/instances/InstanceDetailModal.css"></style>
