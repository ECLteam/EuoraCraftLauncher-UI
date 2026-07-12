<template>
  <div class="install-page">
    <!-- 顶部栏：类型筛选 + 搜索 -->
    <div class="panel-header">
      <UiSelect
        v-model="selectedCategory"
        :options="categoryOptions"
        class="category-select"
      />

      <div class="header-right">
        <span v-if="filteredVersions.length > 0" class="version-count-badge">
          {{ t('versions.download.versionCount', { count: filteredVersions.length }) }}
        </span>
        <button class="btn-refresh" @click="fetchVersions">
          <UiIcon name="refresh" :size="14" />
          {{ t('versions.download.refreshList') }}
        </button>
        <div class="search-box">
          <UiIcon name="search" :size="16" class="search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('versions.download.searchVersion')"
            class="search-input"
          />
          <button
            v-if="searchQuery"
            class="search-clear"
            @click="searchQuery = ''"
            type="button"
          >
            <UiIcon name="close" :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- 版本列表 -->
    <div class="version-panel">

      <div class="version-content">
        <!-- 加载中 -->
        <div v-if="loading" class="loading-state">
          <UiIcon name="spinner" class="spin" :size="24" />
          <p>{{ t('versions.download.fetchingList') }}</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="filteredVersions.length === 0" class="empty-state">
          <UiIcon name="cube" :size="48" class="empty-icon" />
          <p class="empty-text">{{ t('versions.download.noVersions') }}</p>
          <p class="empty-hint">{{ t('versions.download.checkNetwork') }}</p>
          <button class="btn-primary" @click="fetchVersions">
            <UiIcon name="refresh" :size="16" />
            {{ t('versions.download.refreshList') }}
          </button>
        </div>

        <!-- 版本列表 -->
        <div
          v-else
          ref="scrollContainerRef"
          class="version-list-scroll"
          @scroll="handleScroll"
        >
          <div class="virtual-scroll-container" :style="{ height: `${totalHeight}px` }">
            <div class="virtual-scroll-content" :style="{ transform: `translateY(${topOffset}px)` }">
              <div
                v-for="version in visibleVersions"
                :key="version.id"
                class="version-item"
                :style="{ height: `${itemHeight}px` }"
              >
                <div class="version-icon" :class="version.type">
                  <img v-if="version.type === 'release'" src="/img/item/grass.png" alt="" class="version-icon-img" />
                  <img v-else-if="version.type === 'snapshot'" src="/img/item/command.png" alt="" class="version-icon-img" />
                  <UiIcon v-else :name="getVersionIcon(version.type)" :size="18" />
                </div>

                <div class="version-info">
                  <div class="version-header">
                    <span class="version-id">{{ version.id }}</span>
                    <span :class="['badge', getVersionBadgeClass(version.type)]">
                      {{ getVersionTypeLabel(version.type) }}
                    </span>
                  </div>
                  <span class="version-date">
                    <UiIcon name="calendar" :size="12" />
                    {{ formatDate(version.releaseTime) }}
                  </span>
                </div>

                <div class="version-actions">
                  <button
                    class="btn-install"
                    :title="t('versions.download.install')"
                    @click="openInstallWithVersion(version.id)"
                    :disabled="downloading === version.id"
                  >
                    <UiIcon name="download" :size="16" />
                    <span class="btn-install-text">{{ t('versions.download.install') }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 安装弹窗 -->
    <ContentModal
      v-model:visible="showInstallDialog"
      :title="t('versions.download.installTitle')"
      show-backdrop
    >
      <div class="form-group">
        <label>{{ t('versions.download.mcVersion') }} <span class="required">*</span></label>
        <div class="version-display">{{ installForm.mcVersion }}</div>
      </div>

      <div class="form-group">
        <label>{{ t('versions.download.versionName') }}</label>
        <UiInput
          v-model="installForm.versionName"
          :placeholder="defaultVersionName"
        />
        <p class="form-hint">{{ t('versions.download.versionNameHint') }}</p>
      </div>

      <div class="form-group">
        <label>{{ t('versions.download.loaderType') }}</label>
        <div class="loader-options">
          <button
            v-for="loader in loaders"
            :key="loader.value"
            class="loader-btn"
            :class="{ active: installForm.loader === loader.value }"
            @click="selectLoader(loader.value)"
          >
            <UiIcon :name="loader.icon" />
            <span>{{ loader.label }}</span>
          </button>
        </div>
      </div>

      <div class="form-group" v-if="installForm.loader && installForm.loader !== 'vanilla'">
        <label>{{ t('versions.download.loaderVersion') }}</label>
        <UiSelect
          v-model="installForm.loaderVersion"
          :options="getLoaderVersionOptions(installForm.loader)"
          :placeholder="loaderVersionsLoading ? '加载中...' : '最新版本'"
        />
      </div>

      <div class="form-group">
        <label>{{ t('versions.download.gameDir') }}</label>
        <UiSelect
          v-model="installForm.gamePath"
          :options="gamePaths"
          :placeholder="t('instances.gamePathPlaceholder')"
        />
      </div>

      <template #footer>
        <UiButton variant="ghost" @click="showInstallDialog = false">{{ t('versions.download.cancel') }}</UiButton>
        <UiButton
          variant="primary"
          @click="startInstall"
          :loading="isInstalling"
        >
          {{ isInstalling ? t('versions.download.installing') : t('versions.download.startInstall') }}
        </UiButton>
      </template>
    </ContentModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAsyncAction } from '@/composables/useAsyncAction'
import backend from '@/api/client'
import UiButton from '@/components/ui/Button.vue'
import UiIcon from '@/components/ui/Icon.vue'
import UiInput from '@/components/ui/Input.vue'
import UiSelect from '@/components/ui/Select.vue'
import ContentModal from '@/components/modals/ContentModal.vue'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { useAutoRefreshCache, CACHE_KEYS, CACHE_GROUPS } from '@/cache/composable'
import { globalTaskQueue } from '@/composables/useTaskQueue'
import type { MinecraftVersionCatalog, MinecraftVersionItem } from '@/types/api'

const { t } = useI18n()
const glassMessage = useGlassMessage()
const { run } = useAsyncAction({ showSuccess: false, showError: false })

const downloading = ref<string | null>(null)
const searchQuery = ref('')
const selectedCategory = ref('all')

const {
  data: versionCatalog,
  loading,
  error: versionsError,
  fetchData: fetchVersionsData
} = useAutoRefreshCache<MinecraftVersionCatalog>(
  CACHE_KEYS.VERSIONS,
  async () => {
    const res = await backend.command('minecraft_versions_classified')
    if (res.success && res.data) return res.data
    throw new Error('获取版本列表失败')
  },
  {
    ttl: 10 * 60 * 1000,
    group: CACHE_GROUPS.VERSION,
    persistent: true
  }
)

const fabricVersions = ref<string[]>([])
const forgeVersions = ref<string[]>([])
const neoforgeVersions = ref<string[]>([])
const quiltVersions = ref<string[]>([])
const loaderVersionsLoading = ref(false)

/** 请求 ID，用于防止加载器版本请求的竞态条件 */
let loaderRequestId = 0

/** 加载器命令映射 */
const LOADER_COMMAND_MAP: Record<string, string> = {
  fabric: 'fabric_versions',
  forge: 'forge_versions',
  neoforge: 'neoforge_versions',
  quilt: 'quilt_versions',
}

/** 设置指定加载器的版本列表 */
function setLoaderVersions(loaderType: string, versions: string[]) {
  switch (loaderType) {
    case 'fabric': fabricVersions.value = versions; break
    case 'forge': forgeVersions.value = versions; break
    case 'neoforge': neoforgeVersions.value = versions; break
    case 'quilt': quiltVersions.value = versions; break
  }
}

/**
 * 通用加载器版本加载函数
 * 使用请求 ID 防止竞态条件：当新请求发起时，旧请求的响应将被忽略
 */
async function loadLoaderVersions(loaderType: string, gameVersion: string) {
  if (!gameVersion) {
    setLoaderVersions(loaderType, [])
    return
  }

  const command = LOADER_COMMAND_MAP[loaderType]
  if (!command) return

  const requestId = ++loaderRequestId
  loaderVersionsLoading.value = true
  try {
    const res = await backend.command(command, { game_version: gameVersion })
    // 如果请求 ID 不匹配，说明有更新的请求已发起，忽略此响应
    if (requestId !== loaderRequestId) return

    if (res.success && res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data.all || [])
      const mapped = list.map((v: any) => v.LoaderVersion || v.version || String(v)).filter(Boolean)
      setLoaderVersions(loaderType, mapped.slice(0, 20))
      if (mapped.length === 0) {
        const loaderName = loaderType.charAt(0).toUpperCase() + loaderType.slice(1)
        glassMessage.warning(t('versions.download.noLoaderVersions', { loader: loaderName }))
      }
    } else {
      setLoaderVersions(loaderType, [])
    }
  } catch (e: any) {
    if (requestId !== loaderRequestId) return
    console.error(`获取 ${loaderType} 版本失败:`, e)
    setLoaderVersions(loaderType, [])
  } finally {
    if (requestId === loaderRequestId) {
      loaderVersionsLoading.value = false
    }
  }
}

async function loadFabricVersions(gameVersion: string) {
  await loadLoaderVersions('fabric', gameVersion)
}

async function loadForgeVersions(gameVersion: string) {
  await loadLoaderVersions('forge', gameVersion)
}

async function loadNeoforgeVersions(gameVersion: string) {
  await loadLoaderVersions('neoforge', gameVersion)
}

async function loadQuiltVersions(gameVersion: string) {
  await loadLoaderVersions('quilt', gameVersion)
}

const scrollContainerRef = ref<HTMLElement | null>(null)
const visibleRange = ref({ start: 0, end: 20 })
const itemHeight = 56
const bufferSize = 5

const showInstallDialog = ref(false)
const isInstalling = ref(false)

const installForm = ref({
  mcVersion: '',
  versionName: '',
  loader: 'vanilla',
  loaderVersion: '',
  gamePath: ''
})

const categories = computed(() => [
  { id: 'all', name: t('versions.download.allVersions'), icon: 'cube' },
  { id: 'release', name: t('versions.download.release'), icon: 'check' },
  { id: 'snapshot', name: t('versions.download.snapshot'), icon: 'lab' },
  { id: 'april_fools', name: t('versions.download.aprilFools'), icon: 'happy' },
  { id: 'old_beta', name: t('versions.download.oldBeta'), icon: 'archive' },
  { id: 'old_alpha', name: t('versions.download.oldAlpha'), icon: 'archive' }
])

const currentCategoryName = computed(() => {
  const cat = categories.value.find(c => c.id === selectedCategory.value)
  return cat ? cat.name : t('versions.download.installNew')
})

const categoryOptions = computed(() =>
  categories.value.map(c => ({
    value: c.id,
    label: `${c.name} (${getCategoryCount(c.id)})`,
  }))
)

const loaders = [
  { value: 'vanilla', label: '原版', icon: 'cube' },
  { value: 'fabric', label: 'Fabric', icon: 'grid' },
  { value: 'forge', label: 'Forge', icon: 'fire' },
  { value: 'neoforge', label: 'NeoForge', icon: 'fire' },
  { value: 'quilt', label: 'Quilt', icon: 'grid' }
]

function getCategoryCount(categoryId: string): number {
  const catalog = versionCatalog.value
  if (!catalog) return 0
  return catalog[categoryId as keyof MinecraftVersionCatalog]?.length || 0
}

const filteredVersions = computed(() => {
  const catalog = versionCatalog.value
  let versions: MinecraftVersionItem[] = []
  if (catalog) {
    versions = catalog[selectedCategory.value as keyof MinecraftVersionCatalog] || []
  }
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    versions = versions.filter(v => v.id.toLowerCase().includes(query))
  }
  // 按发布时间降序排列
  return versions.slice().sort((a, b) => {
    const ta = a.releaseTime ? new Date(a.releaseTime).getTime() : 0
    const tb = b.releaseTime ? new Date(b.releaseTime).getTime() : 0
    return tb - ta
  })
})

const visibleVersions = computed(() => {
  const { start, end } = visibleRange.value
  return (filteredVersions.value || []).slice(start, end)
})

const totalHeight = computed(() => (filteredVersions.value || []).length * itemHeight)
const topOffset = computed(() => visibleRange.value.start * itemHeight)

async function fetchVersions() {
  await fetchVersionsData()
  if (versionsError.value) {
    glassMessage.error(t('versions.download.fetchFailed'))
  }
}

async function fetchLoaderVersions() {
  const mc = installForm.value.mcVersion
  if (!mc) return
  switch (installForm.value.loader) {
    case 'fabric': await loadFabricVersions(mc); break
    case 'forge': await loadForgeVersions(mc); break
    case 'neoforge': await loadNeoforgeVersions(mc); break
    case 'quilt': await loadQuiltVersions(mc); break
  }
}

function getLoaderVersionOptions(loader: string) {
  switch (loader) {
    case 'fabric': return (fabricVersions.value || []).map(v => ({ label: v, value: v }))
    case 'forge': return (forgeVersions.value || []).map(v => ({ label: v, value: v }))
    case 'neoforge': return (neoforgeVersions.value || []).map(v => ({ label: v, value: v }))
    case 'quilt': return (quiltVersions.value || []).map(v => ({ label: v, value: v }))
    default: return []
  }
}

function getLoaderLabel(loader: string): string {
  const found = loaders.find(l => l.value === loader)
  return found ? found.label : loader
}

const defaultGamePath = ref('')
const gamePaths = ref<{ value: string; label: string }[]>([])

async function loadDefaultGamePath() {
  const res = await run(async () => backend.config.get('game'))
  if (!res?.success || !res.data) return
  const data = res.data
  const paths = data.minecraft_paths || []
  gamePaths.value = paths.map((p: any) => {
    const pathStr = typeof p === 'string' ? p : (p.path || '')
    const name = typeof p === 'object' ? (p.name || pathStr) : pathStr
    return { value: pathStr, label: name }
  })

  if (data.last_install_path) {
    defaultGamePath.value = data.last_install_path
  } else if (paths.length > 0) {
    const first = paths[0]
    defaultGamePath.value = typeof first === 'string' ? first : (first.path || '')
  }
}

async function saveLastInstallPath(path: string) {
  if (!path) return
  const res = await run(async () => backend.config.get('game'))
  const gameCfg = (res?.success && res.data) ? res.data : {}
  await run(async () => backend.config.set('game', { ...gameCfg, last_install_path: path }))
}

function openInstallWithVersion(versionId: string) {
  installForm.value = { mcVersion: versionId, versionName: '', loader: 'vanilla', loaderVersion: '', gamePath: defaultGamePath.value }
  showInstallDialog.value = true
}

const defaultVersionName = computed(() => {
  const { mcVersion, loader, loaderVersion } = installForm.value
  if (loader === 'vanilla' || !loader) return mcVersion
  if (!loaderVersion) return `${mcVersion}-${loader}`
  return `${mcVersion}-${loader}-${loaderVersion}`
})

function selectLoader(loader: string) {
  installForm.value.loader = loader
  installForm.value.loaderVersion = ''
  fabricVersions.value = []
  forgeVersions.value = []
  neoforgeVersions.value = []
  quiltVersions.value = []
  if (loader !== 'vanilla') {
    fetchLoaderVersions()
  }
}

// 选择加载器版本后自动更新默认版本名
watch(() => installForm.value.loaderVersion, () => {
  installForm.value.versionName = ''
})

async function doInstall() {
  const versionId = installForm.value.mcVersion
  const versionName = installForm.value.versionName?.trim() || defaultVersionName.value
  const loader = installForm.value.loader
  const loaderVersion = installForm.value.loaderVersion
  const gamePath = installForm.value.gamePath || defaultGamePath.value

  if (!versionId) {
    glassMessage.warning(t('versions.download.noVersionId'))
    return
  }

  // 校验版本文件夹冲突
  try {
    const versionDirName = versionName
    const checkPath = `${gamePath}/versions/${versionDirName}`
    const existsRes = await backend.command('fs_exists', { path: checkPath })
    if (existsRes?.data?.exists) {
      glassMessage.error(t('versions.download.versionConflict', { version: versionDirName }))
      return
    }
  } catch (e) {
    console.warn('版本冲突校验失败:', e)
  }

  showInstallDialog.value = false
  downloading.value = versionId

  // 添加到任务队列
  const taskId = globalTaskQueue.addTask({
    type: 'install',
    name: versionName,
    versionId,
    loaderType: loader,
  })
  // 不自动打开面板，用户通过顶部栏按钮查看

  try {
    const params: Record<string, any> = {
      version_id: versionId,
      loader_type: loader,
      task_id: taskId,
    }
    if (versionName !== versionId) {
      params.version_name = versionName
    }
    if (loaderVersion) {
      const versionKey = `${loader}_version`
      params[versionKey] = loaderVersion
    }
    if (gamePath) {
      params.game_path = gamePath
    }

    const result = await backend.command('install_version', params)

    if (!result.success) {
      globalTaskQueue.updateTask(taskId, {
        status: 'error',
        message: result.message || t('versions.download.installFailed'),
      })
      glassMessage.error(result.message || t('versions.download.installFailed'))
    } else {
      glassMessage.success(t('versions.download.installSuccess', { version: versionId }))
      saveLastInstallPath(gamePath)
    }
  } catch (e: any) {
    globalTaskQueue.updateTask(taskId, {
      status: 'error',
      message: e.message || t('versions.download.installFailed'),
    })
    glassMessage.error(e.message || t('versions.download.installFailed'))
  } finally {
    downloading.value = null
  }
}

async function startInstall() {
  if (!installForm.value.mcVersion) return
  await doInstall()
}

function getVersionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'release': t('versions.download.release'),
    'snapshot': t('versions.download.snapshot'),
    'old_beta': t('versions.download.oldBeta'),
    'old_alpha': t('versions.download.oldAlpha'),
    'april_fools': t('versions.download.aprilFools'),
  }
  return labels[type] || type
}

function getVersionBadgeClass(type: string): string {
  const classes: Record<string, string> = {
    'release': 'badge-success',
    'snapshot': 'badge-warning',
    'old_beta': 'badge-info',
    'old_alpha': 'badge-info',
    'april_fools': 'badge-april',
  }
  return classes[type] || 'badge-default'
}

function getVersionIcon(type: string): string {
  const icons: Record<string, string> = {
    'release': 'check', 'snapshot': 'lab',
    'old_beta': 'archive', 'old_alpha': 'archive'
  }
  return icons[type] || 'cube'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}

let scrollRafId: number | null = null

function handleScroll() {
  if (scrollRafId !== null) return
  scrollRafId = requestAnimationFrame(() => {
    scrollRafId = null
    if (!scrollContainerRef.value || !filteredVersions.value) return
    const scrollTop = scrollContainerRef.value.scrollTop
    const containerHeight = scrollContainerRef.value.clientHeight
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize)
    const endIndex = Math.min(
      filteredVersions.value.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferSize
    )
    visibleRange.value = { start: startIndex, end: endIndex }
  })
}

watch(filteredVersions, (newVal) => {
  if (!newVal || newVal.length === 0) return
  nextTick(() => {
    if (scrollContainerRef.value) {
      scrollContainerRef.value.scrollTop = 0
      visibleRange.value = { start: 0, end: 20 + bufferSize * 2 }
    }
  })
})

onMounted(() => {
  loadDefaultGamePath()
  fetchVersions()
  nextTick(() => {
    if (scrollContainerRef.value) {
      visibleRange.value = {
        start: 0,
        end: Math.ceil(scrollContainerRef.value.clientHeight / itemHeight) + bufferSize * 2
      }
    }
  })
})

onUnmounted(() => {
})
</script>

<style scoped>
.install-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--card-bg);
  border-top: var(--card-border-top);
  border-bottom: var(--card-border-bottom);
  border-radius: var(--r-sm);
  overflow: hidden;
}

/* 顶部栏：类型筛选 + 搜索 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  height: 43px;
  border-bottom: 1px solid var(--divider);
  flex-shrink: 0;
  gap: 11px;
  min-width: 0;
}

.category-select {
  width: 144px;
  flex-shrink: 0;
  height: 29px;
}

.category-select :deep(.select-trigger) {
  height: 29px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  min-width: 0;
}

.version-count-badge {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: all 150ms;
  flex-shrink: 0;
}

.btn-refresh:hover:not(:disabled) {
  color: var(--primary);
  border-color: var(--primary);
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    width: 216px;
    min-width: 108px;
    height: 32px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    transition: border-color 150ms ease-out;
    flex-shrink: 1;
  }

@media (max-width: 1000px) {
  .panel-header {
    padding: 0 11px;
    gap: 7px;
  }
  .category-select {
    width: 117px;
  }
  .search-box {
    width: 144px;
  }
  .version-count-badge {
    max-width: 72px;
  }
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

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.required {
  color: var(--error);
}

.form-hint {
  margin: 4px 0 0;
  font-size: 10px;
  color: var(--text-tertiary);
}

.version-display {
  padding: 7px 11px;
  background: var(--bg-base);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.loader-options {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
}

.loader-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 13px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg-base);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 150ms;
}

.loader-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.loader-btn.active {
  border-color: var(--primary);
  background: var(--primary-alpha);
  color: var(--primary);
}

/* 版本列表容器 */
.version-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

.btn-primary:hover { background: var(--primary-hover); }

.version-content {
  flex: 1;
  overflow: hidden;
}

.version-list-scroll {
  height: 100%;
  overflow-y: auto;
  padding: var(--s-lg);
}

.virtual-scroll-container {
  position: relative;
}

.virtual-scroll-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 版本项 */
.version-item {
  display: flex;
  align-items: center;
  padding: 0 11px;
  border-radius: var(--r-sm);
  transition: background 150ms ease-out;
  gap: 11px;
}

.version-item:hover {
  background: var(--bg-hover);
}

.version-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--r-sm);
  background: var(--primary-alpha);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  flex-shrink: 0;
}

.version-icon.release,
.version-icon.snapshot {
  width: 40px;
  height: 40px;
  background: transparent;
}

.version-icon-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.version-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.version-header {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
}

.version-id {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.version-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.version-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

/* 安装按钮 - 图标按钮，hover显示文字 */
.btn-install {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 29px;
  height: 29px;
  border-radius: var(--r-sm);
  border: none;
  background: var(--primary);
  color: var(--text-on-primary);
  cursor: pointer;
  transition: all 150ms ease-out;
  overflow: hidden;
  white-space: nowrap;
}

.btn-install:hover {
  width: auto;
  padding: 0 11px;
  background: var(--primary-hover);
}

.btn-install-text {
  display: none;
  font-size: 11px;
  font-weight: 500;
}

.btn-install:hover .btn-install-text {
  display: inline;
}

/* 进度弹窗 */
.progress-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--s-md);
  padding: var(--s-xl) 0;
}

.progress-ring {
  color: var(--primary);
}

.progress-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.progress-subtext {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0;
}

/* 徽章 */
.badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: var(--r-xs);
  font-size: 10px;
  font-weight: 500;
}

.badge-success { background: var(--success-alpha); color: var(--success); }
.badge-warning { background: var(--warning-alpha); color: var(--warning); }
.badge-info { background: var(--info-alpha); color: var(--info); }
.badge-default { background: var(--bg-base-alt); color: var(--text-secondary); }
.badge-april { background: rgba(240, 168, 200, 0.15); color: #c880a0; }

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--s-md);
}

.empty-icon { color: var(--text-tertiary); }

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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: var(--s-md);
  color: var(--text-secondary);
}

.spin { animation: spin 1s linear infinite; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>