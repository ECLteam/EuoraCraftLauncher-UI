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
            @keydown.enter="handleSearch()"
          >
            <template #prefix><UiIcon name="search" :size="15" /></template>
          </NInput>
          <NButton type="primary" :loading="loading" @click="handleSearch()">
            <template #icon><UiIcon name="search" :size="15" /></template>
            {{ t('mods.search') }}
          </NButton>
        </div>
      </div>

      <div class="search-filters">
        <div class="filter-group">
          <span class="filter-label">{{ t('mods.source') }}</span>
          <NSelect
            v-model:value="sourceFilter"
            :options="sourceOptions"
            :placeholder="t('mods.allSources')"
            size="small"
            class="filter-item-small"
          />
        </div>
        <div class="filter-group">
          <span class="filter-label">{{ t('mods.sort') }}</span>
          <NSelect v-model:value="sortFilter" :options="sortOptions" size="small" class="filter-item-small" />
        </div>
        <div class="filter-group">
          <span class="filter-label">{{ t('mods.version') }}</span>
          <NSelect
            v-model:value="versionFilter"
            :options="gameVersionOptions"
            :placeholder="t('mods.allVersions')"
            size="small"
            class="filter-item"
          />
        </div>
        <div v-if="resourceType === 'mod'" class="filter-group">
          <span class="filter-label">{{ t('mods.loaderType') }}</span>
          <NSelect
            v-model:value="loaderFilter"
            :options="loaderOptions"
            :placeholder="t('mods.allLoaders')"
            placement="bottom-end"
            size="small"
            class="filter-item"
          />
        </div>
      </div>

      <div class="instance-selector-row">
        <span class="instance-selector-label">{{ t('mods.selectInstance') }}</span>
        <ResourceInstanceSelect
          :target="target"
          :placeholder="t('mods.selectInstanceHint')"
          :showNoneOption="true"
          :noneLabel="t('mods.noneInstance')"
          class="oms-instance-select"
          @persist="onInstancePersist"
        />
        <div class="instance-selector-actions">
          <NButton quaternary circle size="small" title="刷新" @click="refreshResults">
            <template #icon><UiIcon name="refresh" :size="15" /></template>
          </NButton>
          <NButton size="small" quaternary @click="resetConditions">
            <template #icon><UiIcon name="close" :size="14" /></template>
            {{ t('mods.resetConditions') }}
          </NButton>
        </div>
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
      <div class="mods-results-content">
        <NSpin :show="loading" :description="t('mods.searching')" class="mods-results-spin">
          <NScrollbar v-if="results.length" class="mods-results-scroll">
            <div class="mod-list">
              <div v-for="mod in results" :key="mod.id" class="mod-row" @click="openDetails(mod)">
                <!-- 标识图标：小方块，只做识别不抢版面 -->
                <div class="mod-row-icon">
                  <img v-if="mod.iconUrl" :src="mod.iconUrl" :alt="mod.displayTitle" loading="lazy" />
                  <UiIcon v-else name="cube" :size="18" />
                </div>

                <!-- 主信息：单行紧凑 -->
                <div class="mod-row-main">
                  <div class="mod-row-title">
                    <span class="mod-row-name">
                      {{ mod.displayTitle }}{{ mod.title && mod.displayTitle !== mod.title ? ` | ${mod.title}` : '' }}
                    </span>
                    <div class="mod-row-tags">
                      <NTag v-if="mod.wiki" size="tiny" :bordered="false" type="info">MCMOD百科</NTag>
                      <NTag v-if="resourceType !== 'mod'" size="tiny" :bordered="false" type="info">
                        {{ t(`download.${resourceType}`) }}
                      </NTag>
                      <template v-if="resourceType === 'mod'">
                        <NTag
                          v-for="loader in mod.loaders.slice(0, 2)"
                          :key="`l:${loader}`"
                          size="tiny"
                          :bordered="false"
                        >
                          {{ loaderName(loader) }}
                        </NTag>
                      </template>
                      <NTag
                        v-for="category in mod.categories.slice(0, 1)"
                        :key="`c:${category}`"
                        size="tiny"
                        :bordered="false"
                      >
                        {{ category }}
                      </NTag>
                    </div>
                  </div>
                  <p class="mod-row-desc" :title="mod.wiki?.summary || mod.description">
                    {{ mod.wiki?.summary || mod.description }}
                  </p>
                  <div class="mod-row-meta">
                    <span v-if="mod.gameVersions[0]" class="mod-meta-item">
                      {{ mod.gameVersions[0]
                      }}{{ mod.gameVersions.length > 1 ? `+${mod.gameVersions.length - 1}` : '' }}
                    </span>
                    <span class="mod-meta-item">↓ {{ formatDownloads(mod.downloads) }}</span>
                    <span v-if="mod.dateModified" class="mod-meta-item">{{
                      formatRelativeTime(mod.dateModified)
                    }}</span>
                    <span class="mod-meta-item">{{ mod.author }}</span>
                    <span class="mod-meta-item mod-meta-source">{{ sourceLabel(mod.source) }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="totalPages > 1" class="mods-pagination">
              <NButton size="small" quaternary circle :disabled="page <= 1" @click="goToPage(1)">
                <template #icon><UiIcon name="chevrons-left" :size="14" /></template>
              </NButton>
              <NButton size="small" quaternary :disabled="page <= 1" @click="goToPage(page - 10)">
                <template #icon><UiIcon name="chevron-left" :size="14" /></template>
                {{ t('mods.prev10Pages') }}
              </NButton>
              <NButton size="small" quaternary :disabled="page <= 1" @click="goToPage(page - 1)">
                <template #icon><UiIcon name="chevron-left" :size="14" /></template>
                {{ t('mods.prevPage') }}
              </NButton>
              <span class="mods-pagination-info">{{ page }} / {{ totalPages }}</span>
              <NButton size="small" quaternary :disabled="page >= totalPages" @click="goToPage(page + 1)">
                {{ t('mods.nextPage') }}
                <template #icon><UiIcon name="chevron-right" :size="14" /></template>
              </NButton>
              <NButton size="small" quaternary :disabled="page >= totalPages" @click="goToPage(page + 10)">
                {{ t('mods.next10Pages') }}
                <template #icon><UiIcon name="chevron-right" :size="14" /></template>
              </NButton>
              <NButton size="small" quaternary circle :disabled="page >= totalPages" @click="goToPage(totalPages)">
                <template #icon><UiIcon name="chevrons-right" :size="14" /></template>
              </NButton>
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

    <FullscreenModal
      v-model:visible="detailsVisible"
      :title="selectedMod?.displayTitle || t('mods.details')"
      wrapperClass="mod-detail-fullscreen"
      bodyClass="mod-detail-body"
    >
      <div class="mod-detail-shell">
        <NSpin :show="detailLoading">
          <div v-if="selectedMod" class="mod-detail-content">
            <!-- 顶部紧凑介绍卡片：图标 + 名称 + 简介合并 -->
            <section class="mod-intro-card">
              <div class="mod-intro-avatar">
                <img
                  v-if="detailIcon && !iconError"
                  :src="detailIcon"
                  :alt="selectedMod.displayTitle"
                  @error="iconError = true"
                />
                <UiIcon v-else name="cube" :size="22" />
              </div>
              <div class="mod-intro-heading">
                <h2>{{ selectedMod.displayTitle }}</h2>
                <p>{{ selectedMod.title }} · {{ selectedMod.author }}</p>
                <div class="mod-intro-tags">
                  <NTag v-if="resourceType !== 'mod'" size="small" :bordered="false" type="info">
                    {{ t(`download.${resourceType}`) }}
                  </NTag>
                  <template v-if="resourceType === 'mod'">
                    <NTag
                      v-for="loader in selectedMod.loaders.slice(0, 4)"
                      :key="`l:${loader}`"
                      size="small"
                      :bordered="false"
                    >
                      {{ loaderName(loader) }}
                    </NTag>
                  </template>
                  <NTag
                    v-for="category in selectedMod.categories.slice(0, 3)"
                    :key="`c:${category}`"
                    size="small"
                    :bordered="false"
                  >
                    {{ category }}
                  </NTag>
                </div>
                <p class="mod-intro-description">
                  {{ selectedMod.wiki?.summary || selectedMod.description || detailInfo?.description }}
                </p>
                <div class="mod-intro-links">
                  <NButton v-if="activeSourceRef" size="small" secondary @click="openUrl(activeSourceRef.projectUrl)">
                    <template #icon><UiIcon name="external-link" :size="14" /></template>
                    {{ sourceLabel(activeSourceRef.source) }}
                  </NButton>
                  <NButton v-if="selectedMod.wiki" size="small" secondary @click="openUrl(selectedMod.wiki.url)">
                    <template #icon><UiIcon name="file-text" :size="14" /></template>
                    MCMOD百科
                  </NButton>
                </div>
              </div>
            </section>

            <!-- 中间：兼容实例选择 -->
            <section class="mod-instance-section">
              <div class="mod-section-title">
                <UiIcon name="game-controller" :size="15" />
                {{ t('mods.selectCompatibleInstance') }}
              </div>
              <ResourceInstanceSelect
                :target="target"
                :placeholder="t('mods.selectInstanceHint')"
                compatibleOnly
                @persist="onInstancePersist"
              />
              <p v-if="!compatibleInstances.length" class="no-compatible-hint">{{ t('mods.noCompatibleInstance') }}</p>
            </section>

            <!-- 下方：版本列表，逐条列出支持的版本，点击选中 -->
            <section class="mod-version-section">
              <div class="mod-section-title">
                <UiIcon name="layers" :size="15" />
                {{ t('mods.chooseVersion') }}
              </div>
              <template v-if="selectedMod.alternatives.length > 1">
                <label>{{ t('mods.downloadSource') }}</label>
                <NSelect
                  v-model:value="selectedSourceKey"
                  class="detail-source-select"
                  :options="detailSourceOptions"
                  @update:value="loadSelectedSource"
                />
              </template>
              <div v-if="versions.length" class="version-list">
                <button
                  v-for="version in versions"
                  :key="version.id"
                  type="button"
                  class="version-row"
                  :class="{ selected: selectedFileId === version.id }"
                  @click="selectedFileId = version.id"
                >
                  <span class="version-number">{{ version.versionNumber }}</span>
                  <span class="version-filename">{{ version.filename }}</span>
                  <span class="version-meta">
                    {{ version.gameVersions.join(' · ') }}
                    <template v-if="version.loaders.length">
                      · {{ version.loaders.map(loaderName).join('/') }}
                    </template>
                  </span>
                  <UiIcon v-if="selectedFileId === version.id" name="check" :size="15" class="version-check" />
                </button>
              </div>
              <p v-else class="version-hint">{{ t('mods.noCompatibleVersion') }}</p>
              <p class="version-hint">{{ t('mods.dependencyHint') }}</p>
            </section>
          </div>
        </NSpin>
      </div>

      <template #footer>
        <div class="mod-detail-footer">
          <NButton secondary :disabled="!selectedFileId" :loading="savingAs" @click="handleSaveAs">
            <template #icon><UiIcon name="save" :size="15" /></template>
            {{ t('common.saveAs') }}
          </NButton>
          <div class="mod-detail-install">
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
        </div>
      </template>
    </FullscreenModal>
  </div>
</template>

<script setup lang="ts">
import { NAlert, NButton, NEmpty, NInput, NScrollbar, NSelect, NSpin, NTag } from 'naive-ui'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import backend from '@/api/client'
import { unwrapResponse } from '@/app/runtime/errorPresentation'
import { globalCache, CACHE_GROUPS, CACHE_KEYS } from '@/cache'
import { useAutoRefreshCache } from '@/cache/composable'
import FullscreenModal from '@/components/modals/FullscreenModal.vue'
import ResourceInstanceSelect from '@/components/resources/ResourceInstanceSelect.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useLauncherMessage } from '@/composables/useLauncherMessage'
import { instanceKey, useResourceInstallTarget } from '@/composables/useResourceInstallTarget'
import { globalTaskQueue } from '@/composables/useTaskQueue'
import { LOADERS } from '@/config/version'
import { instanceInstallApi } from '@/features/instances/api/instanceInstallApi'
import { instanceWorkspaceApi, workspaceTarget } from '@/features/instances/api/instanceWorkspaceApi'
import { localModsApi } from '@/features/instances/api/localModsApi'
import { modApi } from '@/features/mods/api/modApi'
import type {
  GameResourceType,
  MinecraftVersionCatalog,
  MinecraftVersionItem,
  ModInfo,
  ModSearchItem,
  ModSourceReference,
  ModSourceStatus,
  ModVersion,
} from '@/types/api'
import { getErrorMessage } from '@/utils/error'

const props = withDefaults(
  defineProps<{
    resourceType?: GameResourceType
  }>(),
  { resourceType: 'mod' }
)

const emit = defineEmits<{
  (e: 'installed'): void
}>()

const { t, locale } = useI18n()
const message = useLauncherMessage()
const route = useRoute()
const router = useRouter()
const { loading, run } = useAsyncAction({ showSuccess: false, showError: false })

const target = useResourceInstallTarget(props.resourceType, true)
const instance = target.selectedInstance
const compatibleInstances = target.compatibleInstances

const query = ref('')
const searched = ref(false)
const results = ref<ModSearchItem[]>([])
const sourceStatuses = ref<Record<string, ModSourceStatus>>({})
const PAGE_SIZE = 20
const page = ref(1)
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))
const detailsVisible = ref(false)
const detailLoading = ref(false)
const selectedMod = ref<ModSearchItem | null>(null)
const detailInfo = ref<ModInfo | null>(null)
const versions = ref<ModVersion[]>([])
const selectedSourceKey = ref('')
const selectedFileId = ref<string | null>(null)
const installing = ref(false)
const installProgress = ref('')
const savingAs = ref(false)

const dragging = ref(false)
let dragDepth = 0

const selectedWorldId = ref<string | null>(null)
const worldOptions = ref<Array<{ label: string; value: string }>>([])
const worldsLoading = ref(false)

// 筛选与排序（作为搜索参数传给后端）
const versionFilter = ref('')
const loaderFilter = ref('')
const sourceFilter = ref('')
const sortFilter = ref('')

// 搜索结果缓存：状态缓存持久化上次视图，页缓存加速翻页
interface ModSearchCacheState {
  instanceKey: string
  query: string
  source: string
  version: string
  loader: string
  sort: string
  page: number
  results: ModSearchItem[]
  total: number
  sources: Record<string, ModSourceStatus>
}

const STATE_CACHE_TTL = 24 * 60 * 60 * 1000

function stateCacheKey(): string {
  return `mod-search-state:${props.resourceType}`
}

const pageCache = new Map<
  string,
  { results: ModSearchItem[]; total: number; sources: Record<string, ModSourceStatus> }
>()

function pageCacheKey(targetPage: number): string {
  const inst = instance.value
  const loader = props.resourceType === 'mod' ? loaderFilter.value || inst?.primaryLoader || '' : ''
  const gameVersion = versionFilter.value || inst?.vanillaName || ''
  return [
    props.resourceType,
    query.value.trim(),
    sourceFilter.value,
    gameVersion,
    loader,
    sortFilter.value,
    targetPage,
  ].join('\u0000')
}

function saveState(): void {
  globalCache.set<ModSearchCacheState>(
    stateCacheKey(),
    {
      instanceKey: target.selectedKey.value,
      query: query.value.trim(),
      source: sourceFilter.value,
      version: versionFilter.value,
      loader: loaderFilter.value,
      sort: sortFilter.value,
      page: page.value,
      results: results.value,
      total: total.value,
      sources: sourceStatuses.value,
    },
    { ttl: STATE_CACHE_TTL, persistent: false }
  )
}

function restoreState(): boolean {
  const cached = globalCache.get<ModSearchCacheState>(stateCacheKey())
  if (!cached || cached.instanceKey !== target.selectedKey.value) return false
  query.value = cached.query
  sourceFilter.value = cached.source
  versionFilter.value = cached.version
  loaderFilter.value = cached.loader
  sortFilter.value = cached.sort
  page.value = cached.page
  results.value = cached.results
  total.value = cached.total
  sourceStatuses.value = cached.sources
  searched.value = true
  return true
}

const { data: versionCatalogData, fetchData: fetchVersionCatalog } = useAutoRefreshCache<MinecraftVersionCatalog>(
  CACHE_KEYS.VERSIONS,
  () => instanceInstallApi.getCatalog(),
  { ttl: 10 * 60 * 1000, group: CACHE_GROUPS.VERSION, persistent: true, autoRefresh: false }
)

const versionCatalog = computed<MinecraftVersionItem[]>(() => versionCatalogData.value?.release ?? [])

const gameVersionOptions = computed(() => {
  if (versionCatalog.value.length) {
    return [
      { label: t('mods.allVersions'), value: '' },
      ...versionCatalog.value.map((v) => ({ label: v.id, value: v.id })),
    ]
  }
  return [
    { label: t('mods.allVersions'), value: '' },
    ...uniqueOptions(results.value.flatMap((item) => item.gameVersions)),
  ]
})

const loaderOptions = computed(() => {
  const modLoaders = LOADERS.filter((l) => !['vanilla', 'optifine', 'liteloader'].includes(l.value))
  return [{ label: t('mods.allLoaders'), value: '' }, ...modLoaders.map((l) => ({ label: l.label, value: l.value }))]
})

const curseforgeAvailable = ref(true)
const sourceOptions = computed(() => [
  { label: t('mods.allSources'), value: '' },
  { label: 'Modrinth', value: 'modrinth' },
  { label: 'CurseForge', value: 'curseforge', disabled: !curseforgeAvailable.value },
])
const sortOptions = [
  { label: t('mods.sortDefault'), value: '' },
  { label: t('mods.sortRelevance'), value: 'relevance' },
  { label: t('mods.sortDownloads'), value: 'downloads' },
  { label: t('mods.sortFollows'), value: 'follows' },
  { label: t('mods.sortNewest'), value: 'newest' },
  { label: t('mods.sortUpdated'), value: 'updated' },
]

// 实例就绪后自动加载热门列表
let popularLoaded = false
// 标记首屏视图（恢复缓存或热门列表）是否已加载，避免实例切换 watch 重复触发首次启动
let listBootstrapped = false
watch(
  () => target.ready.value,
  (readyVal) => {
    if (!readyVal) return
    void fetchVersionCatalog()
    void modApi
      .sourceConfig()
      .then((config) => {
        curseforgeAvailable.value = config.curseforge?.available ?? true
        if (!curseforgeAvailable.value && sourceFilter.value === 'curseforge') sourceFilter.value = ''
      })
      .catch(() => {})
    const queryQ = typeof route.query.q === 'string' ? route.query.q : ''
    const queryInstance = typeof route.query.instance === 'string' ? route.query.instance : ''
    if (queryInstance) {
      const hit = target.installableInstances.value.find((version) => instanceKey(version) === queryInstance)
      if (hit) {
        target.setTarget(hit)
        void target.persist()
      }
      // 应用一次后清除 query，避免切换页面时反复覆盖用户的选择
      const restQuery = { ...route.query }
      delete restQuery.instance
      void router.replace({ query: restQuery })
    }
    // 有搜索参数：自动搜索；无参数：恢复缓存视图或加载热门列表
    if (queryQ) {
      query.value = queryQ
      void handleSearch()
    } else if (!popularLoaded) {
      popularLoaded = true
      if (!restoreState()) {
        void loadPopular()
      }
    }
    listBootstrapped = true
  },
  { immediate: true }
)

// 实例切换后按新实例的派生条件（版本/加载器）刷新列表；用户手动条件仍优先
watch(
  () => target.selectedKey.value,
  (nextKey, prevKey) => {
    if (!target.ready.value || !listBootstrapped || nextKey === prevKey) return
    page.value = 1
    if (query.value.trim()) {
      void handleSearch(true)
    } else {
      void loadPopular(true)
    }
  }
)

const sourceWarnings = computed(() =>
  Object.entries(sourceStatuses.value)
    .filter(([, status]) => !status.available && status.error)
    .map(([name, status]) => ({ name: name === 'mcmod' ? 'MCMOD百科' : sourceLabel(name), error: status.error }))
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

// 弹窗内图标优先取项目详情（更完整），搜索命中兜底
const detailIcon = computed(() => detailInfo.value?.iconUrl || selectedMod.value?.iconUrl || '')
const iconError = ref(false)
watch(detailIcon, () => {
  iconError.value = false
})

const installTargetReady = computed(() => {
  if (props.resourceType !== 'datapack') return true
  return Boolean(selectedWorldId.value)
})

function sourceLabel(value: string): string {
  if (value === 'modrinth') return 'Modrinth'
  if (value === 'curseforge') return 'CurseForge'
  return value
}

function uniqueOptions(values: string[]): Array<{ label: string; value: string }> {
  return Array.from(new Set(values))
    .filter(Boolean)
    .map((value) => ({ label: value, value }))
}

function loaderName(value: string): string {
  if (value === 'neoforge') return 'NeoForge'
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatDownloads(value: number): string {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

const TIME_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
  { unit: 'year', seconds: 365 * 24 * 3600 },
  { unit: 'month', seconds: 30 * 24 * 3600 },
  { unit: 'week', seconds: 7 * 24 * 3600 },
  { unit: 'day', seconds: 24 * 3600 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
]

function formatRelativeTime(value: string): string {
  const delta = new Date(value).getTime() - Date.now()
  if (!Number.isFinite(delta)) return ''
  const absSeconds = Math.abs(delta) / 1000
  let matched = TIME_UNITS.find((entry) => absSeconds >= entry.seconds)
  if (!matched) matched = { unit: 'minute', seconds: 60 }
  const amount = Math.round(delta / 1000 / matched.seconds)
  return new Intl.RelativeTimeFormat(locale.value).format(amount, matched.unit)
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

async function fetchPage(targetPage: number, force = false) {
  const key = pageCacheKey(targetPage)
  if (!force) {
    const cached = pageCache.get(key)
    if (cached) {
      results.value = cached.results
      total.value = cached.total
      sourceStatuses.value = cached.sources
      page.value = targetPage
      return
    }
  }
  const inst = instance.value
  const loader = props.resourceType === 'mod' ? loaderFilter.value || inst?.primaryLoader || '' : ''
  const response = await run(() =>
    modApi.search({
      query: query.value.trim(),
      source: sourceFilter.value || 'modrinth',
      game_version: versionFilter.value || inst?.vanillaName || '',
      loader_type: loader,
      resource_type: props.resourceType,
      limit: PAGE_SIZE,
      offset: (targetPage - 1) * PAGE_SIZE,
      sort: sortFilter.value,
    })
  ).catch((error) => {
    message.error(getErrorMessage(error))
    return undefined
  })
  if (!response) return
  const items = response.items ?? []
  const totalCount = response.total ?? items.length
  const sources = response.sources ?? {}
  results.value = items
  total.value = totalCount
  sourceStatuses.value = sources
  page.value = targetPage
  pageCache.set(key, { results: items, total: totalCount, sources })
  saveState()
}

async function handleSearch(force = false) {
  const trimmed = query.value.trim()
  if (trimmed.length > 100) {
    message.error(t('mods.queryTooLong'))
    return
  }

  searched.value = true
  query.value = trimmed
  await fetchPage(1, force)
}

async function loadPopular(force = false) {
  searched.value = true
  query.value = ''
  await fetchPage(1, force)
}

async function goToPage(targetPage: number) {
  if (targetPage < 1 || targetPage > totalPages.value || targetPage === page.value) return
  await fetchPage(targetPage)
}

function refreshResults(): void {
  void (query.value.trim() ? handleSearch(true) : loadPopular(true))
}

function resetConditions(): void {
  versionFilter.value = ''
  loaderFilter.value = ''
  sourceFilter.value = ''
  sortFilter.value = ''
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
  // 先按所选模组的版本/加载器收紧实例列表，再打开弹窗触发版本加载
  target.setCompatibleFilter({ gameVersions: mod.gameVersions, loaders: mod.loaders })
  detailsVisible.value = true
}

// 弹窗关闭后清除兼容筛选，避免影响搜索页工具栏的实例选择
watch(detailsVisible, (val) => {
  if (!val) target.setCompatibleFilter(null)
})

// 打开弹窗、切换下载源或切换兼容实例时，按当前实例重新加载版本
watch(
  () => [detailsVisible.value, selectedSourceKey.value, instance.value?.path, instance.value?.versionId],
  () => {
    if (detailsVisible.value && selectedMod.value && activeSourceRef.value) {
      void loadSelectedSource()
    }
  }
)

async function loadSelectedSource() {
  const inst = instance.value
  const platform = activeSourceRef.value
  if (!platform) return
  detailInfo.value = null
  versions.value = []
  selectedFileId.value = null
  detailLoading.value = true
  try {
    const loader = props.resourceType === 'mod' ? (inst?.primaryLoader ?? '') : ''
    const [info, files] = await Promise.all([
      modApi.info({
        mod_id: platform.projectId,
        source: platform.source,
        resource_type: props.resourceType,
      }),
      modApi.versions({
        mod_id: platform.projectId,
        source: platform.source,
        game_version: inst?.vanillaName ?? '',
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

async function handleSaveAs() {
  const mod = selectedMod.value
  const platform = activeSourceRef.value
  const fileId = selectedFileId.value
  if (!mod || !platform || !fileId) return
  const selected = unwrapResponse(await backend.command('select_save_file', { purpose: 'mod-file' }), '选择保存位置')
  if (!selected.path) return
  savingAs.value = true
  try {
    await modApi.downloadToPath({
      mod_id: platform.projectId,
      source: platform.source,
      file_id: fileId,
      save_path: selected.path,
      resource_type: props.resourceType,
    })
    message.success(t('mods.saveAsSuccess', { path: selected.path }))
  } catch (error) {
    message.error(getErrorMessage(error))
  } finally {
    savingAs.value = false
  }
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
