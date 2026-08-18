<template>
  <section class="version-panel">
    <div class="panel-header">
      <div class="header-left">
        <h3 class="panel-title"><UiIcon name="cube" :size="16" />{{ pathName }}</h3>
        <span v-if="versions.length" class="version-count-badge"
          >{{ filteredVersions.length }}/{{ versions.length }}</span
        >
      </div>
      <div class="header-right">
        <button
          class="toolbar-button"
          :class="{ active: favoritesOnly }"
          title="只看收藏"
          @click="favoritesOnly = !favoritesOnly"
        >
          <UiIcon name="star" :size="14" />
        </button>
        <button
          class="toolbar-button"
          :class="{ active: pinnedOnly }"
          title="只看置顶"
          @click="pinnedOnly = !pinnedOnly"
        >
          <UiIcon name="pin" :size="14" />
        </button>
        <button
          class="toolbar-button"
          :class="{ active: showHidden }"
          title="显示隐藏实例"
          @click="showHidden = !showHidden"
        >
          <UiIcon :name="showHidden ? 'eye' : 'eye-off'" :size="14" />
        </button>
        <button class="toolbar-button" title="管理分类" @click="categoryManagerVisible = true">
          <UiIcon name="tags" :size="14" />
        </button>
        <select v-model="categoryFilter" class="toolbar-select" title="分类筛选">
          <option value="">全部分类</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
        </select>
        <select v-model="sortKey" class="toolbar-select sort-select" title="排序方式" @change="persistDisplaySettings">
          <option value="lastLaunchedAt">最近启动</option>
          <option value="totalRunDurationSeconds">累计时长</option>
          <option value="launchCount">启动次数</option>
          <option value="name">名称</option>
          <option value="gameVersion">游戏版本</option>
        </select>
        <button class="toolbar-button" title="切换排序方向" @click="toggleSortDirection">
          <UiIcon :name="sortDirection === 'desc' ? 'sort-descending' : 'sort-ascending'" :size="14" />
        </button>
        <div class="view-switch">
          <button :class="{ active: viewMode === 'card' }" title="卡片视图" @click="setViewMode('card')">
            <UiIcon name="layout-grid" :size="14" />
          </button>
          <button :class="{ active: viewMode === 'list' }" title="列表视图" @click="setViewMode('list')">
            <UiIcon name="list" :size="14" />
          </button>
        </div>
        <button class="toolbar-button" :disabled="refreshLoading" title="刷新" @click="emit('refresh')">
          <UiIcon name="refresh" :size="14" />
        </button>
        <button class="btn-install-version" @click="emit('install')">
          <UiIcon name="download" :size="14" /><span class="btn-text">{{ t('versions.download.installNew') }}</span>
        </button>
        <div class="search-box">
          <UiIcon name="search" :size="16" class="search-icon" />
          <input
            :value="searchQuery"
            type="text"
            placeholder="搜索别名、描述、标签、版本或加载器"
            class="search-input"
            @input="updateSearchQuery"
          />
          <button v-if="searchQuery" class="search-clear" type="button" @click="emit('update:searchQuery', '')">
            <UiIcon name="close" :size="14" />
          </button>
        </div>
      </div>
    </div>

    <div class="version-content">
      <div v-if="selectedPathIndex === -1" class="empty-state">
        <UiIcon name="folder" :size="48" class="empty-icon" />
        <p class="empty-text">{{ t('versions.manage.selectPathHint') }}</p>
        <button v-if="pathCount === 0" class="btn-primary" @click="emit('addPath')">
          <UiIcon name="add" :size="16" />{{ t('common.add') }}
        </button>
      </div>
      <div v-else-if="loading" class="loading-state">
        <UiIcon name="spinner" class="spin" :size="24" />
        <p>{{ t('versions.manage.scanning') }}</p>
      </div>
      <div v-else-if="versions.length === 0" class="empty-state">
        <UiIcon name="cube" :size="48" class="empty-icon" />
        <p class="empty-text">{{ t('versions.manage.noVersionsFound') }}</p>
        <p class="empty-hint">{{ pathLocation }}</p>
      </div>
      <div v-else-if="filteredVersions.length === 0" class="empty-state">
        <UiIcon name="filter-off" :size="42" class="empty-icon" />
        <p class="empty-text">没有符合当前筛选条件的实例</p>
      </div>

      <div v-else-if="viewMode === 'card'" class="instance-grid">
        <article
          v-for="version in filteredVersions"
          :key="instanceKey(version)"
          :class="['instance-card', { selected: selectedVersion === version.versionId, hidden: version.hidden }]"
          :style="coverStyle(version)"
          @contextmenu.prevent="showActionMenu($event, version)"
          @click="emit('selectVersion', version)"
        >
          <div class="card-heading">
            <InstanceIcon :version="version" :size="46" />
            <div class="card-title-copy">
              <strong>{{ instanceName(version) }}</strong>
              <span>{{ version.versionId }}</span>
            </div>
            <div class="state-actions">
              <button :class="{ active: version.pinned }" title="置顶" @click.stop="toggleFlag(version, 'pinned')">
                <UiIcon name="pin" :size="14" />
              </button>
              <button :class="{ active: version.favorite }" title="收藏" @click.stop="toggleFlag(version, 'favorite')">
                <UiIcon name="star" :size="14" />
              </button>
            </div>
          </div>
          <p v-if="version.description" class="card-description">{{ version.description }}</p>
          <div class="card-badges">
            <span :class="['badge', 'badge-' + getLoaderClass(version.primaryLoader)]">{{
              loaderDisplayName(version.primaryLoader)
            }}</span>
            <span class="category-badge" :style="categoryStyle(version.categoryId)">{{
              categoryName(version.categoryId)
            }}</span>
            <span v-for="tag in version.tags?.slice(0, 3)" :key="tag" class="tag-badge">#{{ tag }}</span>
          </div>
          <div class="card-stats">
            <span><UiIcon name="clock" :size="12" />{{ formatDate(version.lastLaunchedAt) }}</span>
            <span><UiIcon name="hourglass" :size="12" />{{ formatDuration(version.totalRunDurationSeconds) }}</span>
            <span><UiIcon name="rocket" :size="12" />{{ version.launchCount || 0 }} 次</span>
          </div>
          <div class="card-footer">
            <button title="隐藏实例" @click.stop="toggleFlag(version, 'hidden')">
              <UiIcon :name="version.hidden ? 'eye' : 'eye-off'" :size="14" />
            </button>
            <span class="card-spacer" />
            <button title="详情与个性化" @click.stop="emit('detail', version)">
              <UiIcon name="settings" :size="14" />
            </button>
            <button title="更多操作" @click.stop="showActionMenu($event, version)">
              <UiIcon name="more" :size="14" />
            </button>
            <button v-if="!version.isBroken" class="play-button" title="启动" @click.stop="emit('launch', version)">
              <UiIcon name="play" :size="14" />
            </button>
            <button class="delete-button" title="删除" @click.stop="emit('remove', version)">
              <UiIcon name="trash" :size="14" />
            </button>
          </div>
        </article>
      </div>

      <div v-else class="version-table">
        <div class="table-header">
          <span class="col-name">实例</span>
          <span class="col-game-version">游戏版本</span>
          <span class="col-loader">加载器</span>
          <span class="col-category">分类/标签</span>
          <span class="col-actions">操作</span>
        </div>
        <div class="table-body">
          <div
            v-for="version in filteredVersions"
            :key="instanceKey(version)"
            :class="['table-row', { selected: selectedVersion === version.versionId, hidden: version.hidden }]"
            @contextmenu.prevent="showActionMenu($event, version)"
            @click="emit('selectVersion', version)"
          >
            <div class="col-name name-cell">
              <InstanceIcon :version="version" :size="34" /><span
                ><strong>{{ instanceName(version) }}</strong
                ><small>{{ version.versionId }}</small></span
              >
            </div>
            <div class="col-game-version">
              <strong>{{ version.vanillaName || version.versionId }}</strong
              ><small>{{ versionTypeName(version.versionType) }}</small>
            </div>
            <div class="col-loader">
              <span :class="['badge', 'badge-' + getLoaderClass(version.primaryLoader)]">{{
                loaderDisplayName(version.primaryLoader)
              }}</span>
              <small v-if="loaderVersionText(version)">{{ loaderVersionText(version) }}</small>
            </div>
            <div class="col-category">
              <span class="category-badge" :style="categoryStyle(version.categoryId)">{{
                categoryName(version.categoryId)
              }}</span
              ><small>{{ version.tags?.map((tag) => `#${tag}`).join(' ') }}</small>
            </div>
            <div class="col-actions">
              <button
                v-if="!version.isBroken"
                class="btn-action quick-launch-button"
                title="快速启动"
                @click.stop="emit('launch', version)"
              >
                <UiIcon name="play" :size="14" />
              </button>
              <button
                :class="['btn-action', { active: version.favorite }]"
                :title="version.favorite ? '取消收藏' : '收藏'"
                @click.stop="toggleFlag(version, 'favorite')"
              >
                <UiIcon name="star" :size="13" />
              </button>
              <button
                :class="['btn-action', { active: version.pinned }]"
                :title="version.pinned ? '取消置顶' : '置顶'"
                @click.stop="toggleFlag(version, 'pinned')"
              >
                <UiIcon name="pin" :size="13" />
              </button>
              <button class="btn-action" title="详情与设置" @click.stop="emit('detail', version)">
                <UiIcon name="settings" :size="13" />
              </button>
              <button class="btn-action" title="更多操作" @click.stop="showActionMenu($event, version)">
                <UiIcon name="more" :size="13" />
              </button>
              <button class="btn-action delete-button" title="删除版本" @click.stop="emit('remove', version)">
                <UiIcon name="trash" :size="13" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <InstanceCategoryManager v-model:visible="categoryManagerVisible" @changed="handleCategoriesChanged" />
    <NDropdown
      placement="bottom-start"
      trigger="manual"
      :x="menuX"
      :y="menuY"
      :show="menuVisible"
      :options="actionOptions"
      @clickoutside="menuVisible = false"
      @select="handleActionSelect"
    />
  </section>
</template>

<script setup lang="ts">
import { NDropdown, type DropdownOption } from 'naive-ui'
import { computed, h, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import InstanceCategoryManager from '@/components/instances/InstanceCategoryManager.vue'
import InstanceIcon from '@/components/instances/InstanceIcon.vue'
import UiIcon from '@/components/ui/Icon.vue'
import { getLoaderClass, getLoaderName } from '@/config/version'
import { instanceProfileApi, targetFromVersion } from '@/features/instances/api/instanceProfileApi'
import { filterAndSortInstances, instanceDisplayName } from '@/features/instances/model/instancePresentation'
import { useSettingsStore } from '@/features/settings/stores/settingsStore'
import type { InstanceCategory, InstanceSortKey, ScannedVersion } from '@/types/api'

const props = defineProps<{
  versions: ScannedVersion[]
  selectedPathIndex: number
  pathCount: number
  pathName: string
  pathLocation?: string
  loading: boolean
  refreshLoading: boolean
  searchQuery: string
  selectedVersion: string
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  refresh: []
  changed: []
  install: []
  addPath: []
  selectVersion: [version: ScannedVersion]
  detail: [version: ScannedVersion]
  launch: [version: ScannedVersion]
  remove: [version: ScannedVersion]
  action: [action: string, version: ScannedVersion]
}>()

const { t } = useI18n()
const settingsStore = useSettingsStore()
const categories = ref<InstanceCategory[]>([])
const categoryFilter = ref('')
const favoritesOnly = ref(false)
const pinnedOnly = ref(false)
const showHidden = ref(false)
const viewMode = ref<'card' | 'list'>(settingsStore.ui.instanceManager?.viewMode || 'list')
const sortKey = ref<InstanceSortKey>(settingsStore.ui.instanceManager?.sortKey || 'lastLaunchedAt')
const sortDirection = ref<'asc' | 'desc'>(settingsStore.ui.instanceManager?.sortDirection || 'desc')
const categoryManagerVisible = ref(false)
const coverUrls = ref<Record<string, string>>({})
const menuVisible = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const menuVersion = ref<ScannedVersion | null>(null)
const icon = (name: string) => () => h(UiIcon, { name, size: 15 })
const actionOptions = computed<DropdownOption[]>(() => [
  { label: '进入实例工作台', key: 'overview', icon: icon('cube') },
  { type: 'divider', key: 'd1' },
  {
    label: '资源管理',
    key: 'manage',
    icon: icon('layout-grid'),
    children: [
      { label: 'Mod 管理', key: 'mods', icon: icon('cube') },
      { label: '存档管理', key: 'worlds', icon: icon('globe') },
      { label: '截图管理', key: 'screenshots', icon: icon('photo') },
      { label: '服务器管理', key: 'servers', icon: icon('server') },
    ],
  },
  {
    label: '打开文件夹',
    key: 'folders',
    icon: icon('folder-open'),
    children: [
      { label: '实例文件夹', key: 'folder-instance', icon: icon('folder-open') },
      { label: '模组文件夹', key: 'folder-mods', icon: icon('folder') },
      { label: '存档文件夹', key: 'folder-saves', icon: icon('globe') },
      { label: '截图文件夹', key: 'folder-screenshots', icon: icon('photo') },
      { label: '日志文件夹', key: 'folder-logs', icon: icon('file-text') },
      { label: '崩溃报告文件夹', key: 'folder-crash-reports', icon: icon('alert-triangle') },
    ],
  },
  { type: 'divider', key: 'd2' },
  { label: '修改图标、别名与描述', key: 'profile', icon: icon('edit') },
  { label: menuVersion.value?.favorite ? '取消收藏' : '收藏', key: 'favorite', icon: icon('star') },
  { label: menuVersion.value?.hidden ? '取消隐藏' : '隐藏', key: 'hidden', icon: icon('eye-off') },
])

function showActionMenu(event: MouseEvent, version: ScannedVersion) {
  menuVersion.value = version
  menuX.value = event.clientX
  menuY.value = event.clientY
  menuVisible.value = true
}
async function handleActionSelect(key: string) {
  menuVisible.value = false
  if (!menuVersion.value) return
  if (key === 'favorite' || key === 'hidden') {
    await toggleFlag(menuVersion.value, key)
    return
  }
  emit('action', key, menuVersion.value)
}

onMounted(async () => {
  categories.value = await instanceProfileApi.categories().catch(() => [])
})

async function handleCategoriesChanged() {
  categories.value = await instanceProfileApi.categories()
  emit('changed')
}

const filteredVersions = computed(() => {
  return filterAndSortInstances(
    props.versions,
    {
      query: props.searchQuery,
      showHidden: showHidden.value,
      favoritesOnly: favoritesOnly.value,
      pinnedOnly: pinnedOnly.value,
      categoryId: categoryFilter.value,
    },
    { key: sortKey.value, direction: sortDirection.value },
    categoryName
  )
})

function instanceName(version: ScannedVersion): string {
  return instanceDisplayName(version)
}

function instanceKey(version: ScannedVersion): string {
  return `${version.path}::${version.versionId}`
}

function categoryName(id?: string): string {
  return categories.value.find((category) => category.id === id)?.name || '未分类'
}

function categoryStyle(id?: string): Record<string, string> {
  const color = categories.value.find((category) => category.id === id)?.color || '#8b95a5'
  return { color, borderColor: `${color}66`, backgroundColor: `${color}18` }
}

function loaderDisplayName(loaderType: string | null): string {
  return !loaderType || ['Unknown', 'release', 'snapshot', 'Vanilla'].includes(loaderType)
    ? 'Vanilla'
    : getLoaderName(loaderType)
}

function loaderVersionText(version: ScannedVersion): string {
  if (loaderDisplayName(version.primaryLoader) === 'Vanilla') return ''
  return version.loaderVersion ? `v${version.loaderVersion}` : ''
}

function versionTypeName(versionType: ScannedVersion['versionType']): string {
  const names: Partial<Record<ScannedVersion['versionType'], string>> = {
    release: '正式版',
    snapshot: '快照版',
    april_fools: '愚人节版本',
    old_alpha: '远古 Alpha',
    old_beta: '远古 Beta',
  }
  return names[versionType] || 'Minecraft'
}

function formatDuration(seconds?: number): string {
  const total = Math.max(0, Number(seconds || 0))
  if (total < 60) return `${total} 秒`
  if (total < 3600) return `${Math.floor(total / 60)} 分钟`
  return `${Math.floor(total / 3600)} 小时 ${Math.floor((total % 3600) / 60)} 分`
}

function formatDate(value?: string | null): string {
  if (!value) return '从未启动'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '从未启动'
    : date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function updateSearchQuery(event: Event) {
  emit('update:searchQuery', (event.target as HTMLInputElement).value)
}

function coverStyle(version: ScannedVersion) {
  const cover = coverUrls.value[instanceKey(version)]
  if (!cover) return undefined
  return { '--instance-cover': `linear-gradient(rgba(20,24,32,.78),rgba(20,24,32,.9)), url(${JSON.stringify(cover)})` }
}

watch(
  () => props.versions.map((version) => `${instanceKey(version)}:${version.cover?.value || ''}`).join('|'),
  async () => {
    const next: Record<string, string> = {}
    await Promise.all(
      props.versions.map(async (version) => {
        if (!version.cover?.value) return
        const url = await backend.file.toUrl(version.cover.value)
        if (url) next[instanceKey(version)] = url
      })
    )
    coverUrls.value = next
  },
  { immediate: true }
)

async function persistDisplaySettings() {
  await settingsStore
    .patchUi({
      instanceManager: { viewMode: viewMode.value, sortKey: sortKey.value, sortDirection: sortDirection.value },
    })
    .catch(() => undefined)
}

function setViewMode(mode: 'card' | 'list') {
  viewMode.value = mode
  void persistDisplaySettings()
}

function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc'
  void persistDisplaySettings()
}

async function toggleFlag(version: ScannedVersion, field: 'favorite' | 'pinned' | 'hidden') {
  await instanceProfileApi.patch(targetFromVersion(version), { [field]: !version[field] })
  // 直接更新本地版本对象，避免触发全量扫描
  const flags = version as unknown as Record<string, boolean | undefined>
  flags[field] = !flags[field]
}
</script>

<style scoped src="@/styles/components/instances/InstalledInstanceList.css"></style>
