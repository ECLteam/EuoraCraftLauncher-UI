<template>
  <div
    class="oms-root"
    @dragover.prevent
    @drop.prevent="handleDrop"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
  >
    <div v-if="dragging" class="oms-drop-overlay">
      <UiIcon name="download" :size="26" />
      <span>{{ t('mods.dropToInstall') }}</span>
    </div>

    <div class="mods-search-toolbar">
      <div class="search-controls">
        <div class="search-controls-main">
          <NInput
            v-model:value="query"
            class="query-input"
            :placeholder="t('mods.searchPlaceholder')"
            clearable
            @keydown.enter="handleSearch"
          >
            <template #prefix><UiIcon name="search" :size="15" /></template>
          </NInput>
          <NButton type="primary" :loading="loading" @click="handleSearch">
            <template #icon><UiIcon name="search" :size="15" /></template>
            {{ t('mods.search') }}
          </NButton>
        </div>
        <ResourceInstanceSelect :target="target" class="oms-instance-select" @persist="onInstancePersist" />
      </div>

      <div class="search-filters">
        <NSelect
          v-model:value="categoryFilter"
          :options="categoryOptions"
          :placeholder="t('mods.category')"
          filterable
          class="filter-item"
        />
        <NSelect v-model:value="sortFilter" :options="sortOptions" class="filter-item-small" />
        <span class="search-result-count">
          {{ searched ? t('mods.resultCount', { count: results.length }) : '' }}
        </span>
      </div>
    </div>

    <div v-if="resourceType === 'datapack'" class="datapack-world-row">
      <NSelect
        v-model:value="selectedWorldId"
        :options="worldOptions"
        :loading="worldsLoading"
        :placeholder="t('mods.selectWorld')"
        filterable
        class="datapack-world-select"
      />
      <span v-if="!worldOptions.length" class="datapack-world-hint">{{ t('mods.noWorld') }}</span>
    </div>

    <div id="plugin-slot-online-mods-search-after" class="plugin-slot-container"></div>

    <div v-if="sourceWarnings.length" class="source-warnings">
      <NAlert v-for="warning in sourceWarnings" :key="warning.name" type="warning" :showIcon="false">
        <strong>{{ warning.name }}</strong> · {{ warning.error }}
      </NAlert>
    </div>

    <div class="mods-results-panel">
      <div v-if="results.length" class="mods-results-header">
        <span>{{ t('mods.resultCount', { count: results.length }) }}</span>
        <span v-if="effectiveQuery && effectiveQuery !== query.trim()" class="translated-query">
          {{ t('mods.translatedQuery', { query: effectiveQuery }) }}
        </span>
      </div>
      <div class="mods-results-content">
        <NSpin :show="loading" class="mods-results-spin">
          <NScrollbar v-if="results.length" class="mods-results-scroll">
            <div class="mod-list">
              <div v-for="mod in sortedResults" :key="mod.id" class="mod-card" @click="openDetails(mod)">
                <!-- 封面区 -->
                <div class="mod-card-cover">
                  <img v-if="mod.iconUrl" :src="mod.iconUrl" class="cover-img" :alt="mod.displayTitle" loading="lazy" />
                  <div v-else class="cover-fallback">
                    <UiIcon name="cube" :size="36" />
                  </div>
                  <div v-if="mod.alternatives.length" class="cover-platform">
                    <NTag
                      v-for="platform in mod.alternatives"
                      :key="`${platform.source}:${platform.projectId}`"
                      size="tiny"
                      :bordered="false"
                    >
                      {{ sourceLabel(platform.source) }}
                    </NTag>
                  </div>
                </div>

                <!-- 内容区 -->
                <div class="mod-card-body">
                  <h3 class="mod-card-title">{{ mod.displayTitle }}</h3>
                  <p class="mod-card-subtitle">{{ mod.displayTitle !== mod.title ? mod.title : mod.author }}</p>
                  <p class="mod-card-desc">{{ mod.wiki?.summary || mod.description }}</p>

                  <div class="mod-card-meta">
                    <span class="mod-meta-item">
                      <UiIcon name="user" :size="12" />
                      {{ mod.author }}
                    </span>
                    <span class="mod-meta-item">
                      <UiIcon name="download" :size="12" />
                      {{ formatDownloads(mod.downloads) }}
                    </span>
                  </div>

                  <div class="mod-card-tags">
                    <NTag v-if="mod.wiki" size="tiny" :bordered="false" type="info">MC 百科</NTag>
                    <NTag v-if="resourceType !== 'mod'" size="tiny" :bordered="false" type="info">
                      {{ t(`download.${resourceType}`) }}
                    </NTag>
                    <template v-if="resourceType === 'mod'">
                      <NTag v-for="loader in mod.loaders.slice(0, 3)" :key="loader" size="tiny" :bordered="false">
                        {{ loaderName(loader) }}
                      </NTag>
                    </template>
                    <NTag v-for="category in mod.categories.slice(0, 2)" :key="category" size="tiny" :bordered="false">
                      {{ category }}
                    </NTag>
                  </div>
                </div>

                <!-- 操作区 -->
                <div class="mod-card-actions">
                  <NButton type="primary" size="small" @click.stop="openDetails(mod)">
                    <template #icon><UiIcon name="download" :size="14" /></template>
                    {{ t('mods.install') }}
                  </NButton>
                  <NButton size="small" secondary @click.stop="openDetails(mod)">
                    {{ t('mods.chooseVersion') }}
                  </NButton>
                  <NButton
                    v-if="resourceType === 'mod' && isDownloadHost"
                    size="tiny"
                    quaternary
                    @click.stop="openInModPage(mod)"
                  >
                    {{ t('mods.viewOnModPage') }}
                  </NButton>
                </div>
              </div>
            </div>
          </NScrollbar>
          <NEmpty
            v-else-if="!loading"
            class="mods-results-empty"
            :description="searched ? t('mods.noResults') : t('mods.searchHint')"
          >
            <template #icon><UiIcon name="cloud-download" :size="42" /></template>
          </NEmpty>
        </NSpin>
      </div>
    </div>

    <Modal
      v-model:visible="detailsVisible"
      wrapperClass="mod-detail-modal"
      :title="selectedMod?.displayTitle || t('mods.details')"
      :width="'min(680px, calc(100vw - 36px))'"
    >
      <NSpin :show="detailLoading">
        <div v-if="selectedMod" class="detail-content">
          <div class="detail-hero">
            <div class="detail-hero-avatar">
              <NAvatar :size="72" :src="selectedMod.iconUrl" color="var(--ecl-surface-muted)">
                <UiIcon name="cube" :size="30" />
              </NAvatar>
            </div>
            <div class="detail-heading">
              <h2>{{ selectedMod.displayTitle }}</h2>
              <p>{{ selectedMod.title }} · {{ selectedMod.author }}</p>
              <div class="detail-links">
                <NButton v-if="activeSourceRef" size="small" secondary @click="openUrl(activeSourceRef.projectUrl)">
                  <template #icon><UiIcon name="external-link" :size="14" /></template>
                  {{ sourceLabel(activeSourceRef.source) }}
                </NButton>
                <NButton v-if="selectedMod.wiki" size="small" secondary @click="openUrl(selectedMod.wiki.url)">
                  <template #icon><UiIcon name="file-text" :size="14" /></template>
                  MC 百科
                </NButton>
              </div>
            </div>
          </div>

          <p class="detail-description">
            {{ selectedMod.wiki?.summary || selectedMod.description || detailInfo?.description }}
          </p>

          <div class="version-picker">
            <template v-if="selectedMod.alternatives.length > 1">
              <label>{{ t('mods.downloadSource') }}</label>
              <NSelect
                v-model:value="selectedSourceKey"
                class="detail-source-select"
                :options="detailSourceOptions"
                @update:value="loadSelectedSource"
              />
            </template>
            <label>{{ t('mods.compatibleVersion') }}</label>
            <NSelect
              v-model:value="selectedFileId"
              :options="versionOptions"
              :loading="detailLoading"
              :placeholder="versions.length ? t('mods.chooseVersion') : t('mods.noCompatibleVersion')"
            />
            <p class="version-hint">{{ t('mods.dependencyHint') }}</p>
          </div>
        </div>
      </NSpin>

      <template #footer>
        <div class="detail-footer">
          <span v-if="instance" class="install-target">
            {{ t('mods.installTo', { instance: instance.displayName }) }}
          </span>
          <NButton
            type="primary"
            :loading="installing"
            :disabled="!selectedFileId || !instance || !installTargetReady"
            @click="installSelected"
          >
            <template #icon><UiIcon name="download" :size="15" /></template>
            {{ installProgress || t('mods.install') }}
          </NButton>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { NAlert, NAvatar, NButton, NEmpty, NInput, NScrollbar, NSelect, NSpin, NTag } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import Modal from '@/components/modals/Modal.vue'
import ResourceInstanceSelect from '@/components/resources/ResourceInstanceSelect.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { instanceKey, useResourceInstallTarget } from '@/composables/useResourceInstallTarget'
import { globalTaskQueue } from '@/composables/useTaskQueue'
import { instanceWorkspaceApi, workspaceTarget } from '@/features/instances/api/instanceWorkspaceApi'
import { localModsApi } from '@/features/instances/api/localModsApi'
import { modApi } from '@/features/mods/api/modApi'
import type {
  GameResourceType,
  ModInfo,
  ModSearchItem,
  ModSourceReference,
  ModSourceStatus,
  ModVersion,
} from '@/types/api'
import { getErrorMessage } from '@/utils/error'
import { formatErrors, v } from '@/utils/validate'

const props = withDefaults(
  defineProps<{
    resourceType?: GameResourceType
  }>(),
  { resourceType: 'mod' }
)

const emit = defineEmits<{
  (e: 'installed'): void
}>()

const { t } = useI18n()
const message = useLauncherMessage()
const route = useRoute()
const router = useRouter()
const { loading, run } = useAsyncAction({ showSuccess: false, showError: false })

const target = useResourceInstallTarget(props.resourceType)
const instance = target.selectedInstance

const query = ref('')
const searched = ref(false)
const results = ref<ModSearchItem[]>([])
const sourceStatuses = ref<Record<string, ModSourceStatus>>({})
const effectiveQuery = ref('')
const detailsVisible = ref(false)
const detailLoading = ref(false)
const selectedMod = ref<ModSearchItem | null>(null)
const detailInfo = ref<ModInfo | null>(null)
const versions = ref<ModVersion[]>([])
const selectedSourceKey = ref('')
const selectedFileId = ref<string | null>(null)
const installing = ref(false)
const installProgress = ref('')
const querySchema = v.string().min(1, t('mods.queryRequired')).max(100, t('mods.queryTooLong'))

const dragging = ref(false)
let dragDepth = 0

const selectedWorldId = ref<string | null>(null)
const worldOptions = ref<Array<{ label: string; value: string }>>([])
const worldsLoading = ref(false)

// New filter state
const categoryFilter = ref('')
const sortFilter = ref('relevance')
const categoryOptions = computed(() => [
  { label: t('mods.allCategories'), value: '' },
  ...Array.from(new Set(results.value.flatMap((r) => r.categories)))
    .filter(Boolean)
    .map((cat) => ({ label: cat, value: cat })),
])
const sortOptions = [
  { label: t('mods.sortRelevance'), value: 'relevance' },
  { label: t('mods.sortDownloads'), value: 'downloads' },
  { label: t('mods.sortUpdated'), value: 'updated' },
]

const isDownloadHost = computed(() => route.name !== 'online-mods')

const sortedResults = computed(() => {
  const list = [...results.value]
  if (sortFilter.value === 'downloads') {
    list.sort((a, b) => b.downloads - a.downloads)
  } else if (sortFilter.value === 'updated') {
    list.sort(
      (a, b) =>
        (b.dateModified ? new Date(b.dateModified).getTime() : 0) -
        (a.dateModified ? new Date(a.dateModified).getTime() : 0)
    )
  }
  return list
})

// 实例就绪后自动加载热门列表
let popularLoaded = false
watch(
  () => target.ready.value,
  (readyVal) => {
    if (!readyVal) return
    const queryQ = typeof route.query.q === 'string' ? route.query.q : ''
    const queryInstance = typeof route.query.instance === 'string' ? route.query.instance : ''
    if (queryInstance) {
      const hit = target.installableInstances.value.find((version) => instanceKey(version) === queryInstance)
      if (hit) {
        target.setTarget(hit)
        void target.persist()
      }
    }
    // 有搜索参数：自动搜索；无参数：加载热门列表
    if (queryQ) {
      query.value = queryQ
      void handleSearch()
    } else if (!popularLoaded) {
      popularLoaded = true
      void loadPopular()
    }
  },
  { immediate: true }
)

const sourceWarnings = computed(() =>
  Object.entries(sourceStatuses.value)
    .filter(([, status]) => !status.available && status.error)
    .map(([name, status]) => ({ name: name === 'mcmod' ? 'MC 百科' : sourceLabel(name), error: status.error }))
)

const versionOptions = computed(() =>
  versions.value.map((version) => ({
    label: `${version.versionNumber || version.name} · ${version.filename}`,
    value: version.id,
  }))
)

function sourceKey(value: ModSourceReference): string {
  return `${value.source}:${value.projectId}`
}

const detailSourceOptions = computed(() =>
  (selectedMod.value?.alternatives ?? []).map((platform) => ({
    label: sourceLabel(platform.source),
    value: sourceKey(platform),
  }))
)

const activeSourceRef = computed(
  () => selectedMod.value?.alternatives.find((platform) => sourceKey(platform) === selectedSourceKey.value) ?? null
)

const installTargetReady = computed(() => {
  if (props.resourceType !== 'datapack') return true
  return Boolean(selectedWorldId.value)
})

function sourceLabel(value: string): string {
  if (value === 'modrinth') return 'Modrinth'
  if (value === 'curseforge') return 'CurseForge'
  return value
}

function loaderName(value: string): string {
  if (value === 'neoforge') return 'NeoForge'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDownloads(value: number): string {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function onInstancePersist(): void {
  void target.persist()
}

watch(
  () => [props.resourceType, instance.value?.path, instance.value?.versionId],
  async ([, path, versionId]) => {
    if (props.resourceType !== 'datapack' || !path || !versionId) {
      worldOptions.value = []
      selectedWorldId.value = null
      return
    }
    const selected = instance.value
    if (!selected) return
    worldsLoading.value = true
    try {
      const worlds = await instanceWorkspaceApi.worlds(workspaceTarget(selected))
      worldOptions.value = worlds.map((world) => ({ label: world.name, value: world.id }))
      selectedWorldId.value = worlds[0]?.id ?? null
    } catch {
      worldOptions.value = []
      selectedWorldId.value = null
    } finally {
      worldsLoading.value = false
    }
  }
)

async function handleSearch() {
  const trimmed = query.value.trim()
  const validated = querySchema.safeParse(trimmed)
  if (!validated.success) {
    message.error(formatErrors(validated.errors))
    return
  }
  if (!instance.value) {
    message.warning(t('mods.selectInstanceFirst'))
    return
  }

  searched.value = true
  const inst = instance.value
  const loader = props.resourceType === 'mod' ? inst.primaryLoader : ''
  const response = await run(() =>
    modApi.search({
      query: trimmed,
      source: 'modrinth',
      game_version: inst.vanillaName,
      loader_type: loader,
      resource_type: props.resourceType,
      limit: 24,
      offset: 0,
    })
  ).catch((error) => {
    message.error(getErrorMessage(error))
    return undefined
  })
  results.value = response?.items ?? []
  sourceStatuses.value = response?.sources ?? {}
  effectiveQuery.value = response?.query ?? trimmed
  searched.value = true
}

async function loadPopular() {
  const inst = instance.value
  if (!inst) return
  searched.value = true
  const loader = props.resourceType === 'mod' ? inst.primaryLoader : ''
  const response = await run(() =>
    modApi.search({
      query: '',
      source: 'modrinth',
      game_version: inst.vanillaName,
      loader_type: loader,
      resource_type: props.resourceType,
      limit: 30,
      offset: 0,
    })
  ).catch(() => undefined)
  results.value = response?.items ?? []
  sourceStatuses.value = response?.sources ?? {}
  effectiveQuery.value = ''
}

async function openDetails(mod: ModSearchItem) {
  selectedMod.value = mod
  const initialSource = mod.alternatives[0] ?? {
    source: mod.source,
    projectId: mod.projectId,
    slug: mod.slug,
    projectUrl: mod.projectUrl,
  }
  selectedSourceKey.value = sourceKey(initialSource)
  detailInfo.value = null
  versions.value = []
  selectedFileId.value = null
  detailsVisible.value = true
  await loadSelectedSource()
}

async function loadSelectedSource() {
  const inst = instance.value
  const platform = activeSourceRef.value
  if (!inst || !platform) return
  detailInfo.value = null
  versions.value = []
  selectedFileId.value = null
  detailLoading.value = true
  try {
    const loader = props.resourceType === 'mod' ? inst.primaryLoader : ''
    const [info, files] = await Promise.all([
      modApi.info({
        mod_id: platform.projectId,
        source: platform.source,
        resource_type: props.resourceType,
      }),
      modApi.versions({
        mod_id: platform.projectId,
        source: platform.source,
        game_version: inst.vanillaName,
        loader_type: loader,
        resource_type: props.resourceType,
      }),
    ])
    detailInfo.value = info
    versions.value = files
    selectedFileId.value = files[0]?.id ?? null
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    detailLoading.value = false
  }
}

async function installSelected() {
  const mod = selectedMod.value
  const inst = instance.value
  const platform = activeSourceRef.value
  const fileId = selectedFileId.value
  if (!mod || !inst || !platform || !fileId) return
  if (props.resourceType === 'datapack' && !selectedWorldId.value) {
    message.warning(t('mods.selectWorld'))
    return
  }
  installing.value = true
  installProgress.value = t('mods.resolvingDependencies')
  const loader = props.resourceType === 'mod' ? inst.primaryLoader : ''
  const taskId = globalTaskQueue.addTask({
    type: 'download',
    name: mod.displayTitle,
    versionId: inst.vanillaName,
    loaderType: loader,
  })
  try {
    const result = await modApi.install({
      mod_id: platform.projectId,
      source: platform.source,
      file_id: fileId,
      game_path: inst.path,
      instance_id: inst.versionId,
      game_version: inst.vanillaName,
      loader_type: loader,
      resource_type: props.resourceType,
      world_id: props.resourceType === 'datapack' ? (selectedWorldId.value ?? undefined) : undefined,
      task_id: taskId,
    })
    const successMessage = t('mods.installSuccess', { count: result.installed.length })
    globalTaskQueue.updateTask(taskId, { status: 'completed', progress: 100, message: successMessage })
    message.success(successMessage)
    detailsVisible.value = false
    await target.persist()
    emit('installed')
  } catch (error) {
    const messageText = getErrorMessage(error)
    globalTaskQueue.updateTask(taskId, { status: 'error', message: messageText })
    message.error(messageText)
  } finally {
    installing.value = false
    installProgress.value = ''
  }
}

async function openUrl(url: string) {
  if (!url) return
  await modApi.openUrl(url).catch((error) => message.error(getErrorMessage(error)))
}

function openInModPage(mod: ModSearchItem) {
  void router.push({ name: 'online-mods', query: { q: mod.title, type: 'mod' } })
}

function handleDragEnter() {
  dragDepth += 1
  dragging.value = true
}

function handleDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) dragging.value = false
}

async function handleDrop(event: DragEvent) {
  dragging.value = false
  dragDepth = 0
  const inst = instance.value
  if (!inst) {
    message.warning(t('mods.selectInstanceFirst'))
    return
  }
  const paths = [...(event.dataTransfer?.files || [])]
    .map((file) => (file as File & { path?: string }).path)
    .filter((path): path is string => Boolean(path))
  if (!paths.length) {
    message.warning(t('mods.dropToInstall'))
    return
  }
  try {
    if (props.resourceType === 'mod') {
      for (const path of paths) await localModsApi.add(inst.path, path)
    } else {
      const worldId = props.resourceType === 'datapack' ? (selectedWorldId.value ?? undefined) : undefined
      await instanceWorkspaceApi.installResources(workspaceTarget(inst), props.resourceType, paths, worldId)
    }
    message.success(t('mods.installSuccess', { count: paths.length }))
    await target.persist()
    emit('installed')
  } catch (error) {
    message.error(getErrorMessage(error))
  }
}
</script>

<style scoped src="@/styles/views/OnlineMods.css"></style>
