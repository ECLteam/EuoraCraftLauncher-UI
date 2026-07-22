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
        <span
          v-if="filteredVersions.length > 0"
          class="version-count-badge"
        >
          {{ t('versions.download.versionCount', { count: filteredVersions.length }) }}
        </span>
        <button
          class="btn-refresh"
          @click="fetchVersions"
        >
          <UiIcon
            name="refresh"
            :size="14"
          />
          {{ t('versions.download.refreshList') }}
        </button>
        <div class="search-box">
          <UiIcon
            name="search"
            :size="16"
            class="search-icon"
          />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('versions.download.searchVersion')"
            class="search-input"
          >
          <button
            v-if="searchQuery"
            class="search-clear"
            type="button"
            @click="searchQuery = ''"
          >
            <UiIcon
              name="close"
              :size="14"
            />
          </button>
        </div>
        <div
          id="plugin-slot-versions-list-toolbar"
          class="plugin-slot-container"
        />
      </div>
    </div>

    <!-- 版本列表 -->
    <div class="version-panel">
      <div class="version-content">
        <!-- 加载中 -->
        <div
          v-if="loading"
          class="loading-state"
        >
          <UiIcon
            name="spinner"
            class="spin"
            :size="24"
          />
          <p>{{ t('versions.download.fetchingList') }}</p>
        </div>

        <!-- 空状态 -->
        <div
          v-else-if="filteredVersions.length === 0"
          class="empty-state"
        >
          <UiIcon
            name="cube"
            :size="48"
            class="empty-icon"
          />
          <p class="empty-text">
            {{ t('versions.download.noVersions') }}
          </p>
          <p class="empty-hint">
            {{ t('versions.download.checkNetwork') }}
          </p>
          <button
            class="btn-primary"
            @click="fetchVersions"
          >
            <UiIcon
              name="refresh"
              :size="16"
            />
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
          <div
            class="virtual-scroll-container"
            :style="{ height: `${totalHeight}px` }"
          >
            <div
              class="virtual-scroll-content"
              :style="{ transform: `translateY(${topOffset}px)` }"
            >
              <div
                v-for="version in visibleVersions"
                :key="version.id"
                class="version-item"
                :style="{ height: `${itemHeight}px` }"
              >
                <div
                  class="version-icon"
                  :class="[
                    version.type,
                    { 'has-image': Boolean(getVersionImage(version.type)) },
                  ]"
                >
                  <img
                    v-if="getVersionImage(version.type)"
                    :src="getVersionImage(version.type)"
                    alt=""
                    class="version-icon-img"
                  >
                  <UiIcon
                    v-else
                    :name="getVersionIcon(version.type)"
                    :size="18"
                  />
                </div>

                <div class="version-info">
                  <div class="version-header">
                    <span class="version-id">{{ version.id }}</span>
                    <span :class="['badge', getVersionBadgeClass(version.type)]">
                      {{ getVersionTypeLabel(version.type) }}
                    </span>
                  </div>
                  <span class="version-date">
                    <UiIcon
                      name="calendar"
                      :size="12"
                    />
                    {{ formatDate(version.releaseTime) }}
                  </span>
                </div>

                <div class="version-actions">
                  <button
                    class="btn-install"
                    :title="t('versions.download.install')"
                    :disabled="downloading === version.id"
                    @click="openInstallWithVersion(version.id)"
                  >
                    <UiIcon
                      name="download"
                      :size="16"
                    />
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
    <Modal
      v-model:visible="showInstallDialog"
      :title="t('versions.download.installTitle')"
    >
      <div class="form-group">
        <label>{{ t('versions.download.mcVersion') }} <span class="required">*</span></label>
        <div class="version-display">
          {{ installForm.mcVersion }}
        </div>
      </div>

      <div class="form-group">
        <label>{{ t('versions.download.versionName') }}</label>
        <UiInput
          v-model="installForm.versionName"
          :placeholder="defaultVersionName"
        />
        <p class="form-hint">
          {{ t('versions.download.versionNameHint') }}
        </p>
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

      <div
        v-if="installForm.loader && installForm.loader !== 'vanilla'"
        class="form-group"
      >
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
        <UiButton
          variant="ghost"
          @click="showInstallDialog = false"
        >
          {{ t('versions.download.cancel') }}
        </UiButton>
        <UiButton
          variant="primary"
          :loading="isInstalling"
          @click="startInstall"
        >
          {{ isInstalling ? t('versions.download.installing') : t('versions.download.startInstall') }}
        </UiButton>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import { useAutoRefreshCache, CACHE_KEYS, CACHE_GROUPS } from '@/cache/composable'
import Modal from '@/components/modals/Modal.vue'
import UiButton from '@/components/ui/Button.vue'
import UiIcon from '@/components/ui/Icon.vue'
import UiInput from '@/components/ui/Input.vue'
import UiSelect from '@/components/ui/Select.vue'
import { useAsyncAction } from '@/composables/useAsyncAction'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { globalTaskQueue } from '@/composables/useTaskQueue'
import {
  VERSION_FILTERS,
  INSTALLABLE_LOADERS,
  LOADER_COMMAND_MAP,
  getVersionIcon as _getVersionIcon,
  getVersionImage as _getVersionImage,
  getVersionBadgeClass as _getVersionBadgeClass,
  VERSION_LABEL_KEY_MAP,
} from '@/config/version'
import type {
  CommandPayloadMap,
  GameConfig,
  MinecraftPathEntry,
  MinecraftVersionCatalog,
  MinecraftVersionItem,
  MinecraftVersionType,
} from '@/types/api'

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
      const loaderData: unknown = res.data
      const list = Array.isArray(loaderData)
        ? loaderData
        : (loaderData && typeof loaderData === 'object' && 'all' in loaderData && Array.isArray(loaderData.all)
            ? loaderData.all
            : [])
      const mapped = list.map((v: unknown) => {
        if (v && typeof v === 'object') {
          const item = v as Record<string, unknown>
          return (item.LoaderVersion || item.version || String(v)) as string
        }
        return String(v)
      }).filter(Boolean)
      setLoaderVersions(loaderType, mapped.slice(0, 20))
      if (mapped.length === 0) {
        const loaderName = loaderType.charAt(0).toUpperCase() + loaderType.slice(1)
        glassMessage.warning(t('versions.download.noLoaderVersions', { loader: loaderName }))
      }
    } else {
      setLoaderVersions(loaderType, [])
    }
  } catch (e: unknown) {
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

const categories = computed(() =>
  VERSION_FILTERS.map(c => ({
    id: c.id,
    name: t(c.labelKey),
    icon: c.icon,
  }))
)

const categoryOptions = computed(() =>
  categories.value.map(c => ({
    value: c.id,
    label: `${c.name} (${getCategoryCount(c.id)})`,
  }))
)

const loaders = INSTALLABLE_LOADERS.map(l => ({
  value: l.value,
  label: l.label,
  icon: l.icon,
}))

function getCategoryCount(categoryId: string): number {
  const catalog = versionCatalog.value
  if (!catalog) return 0
  return catalog[categoryId as keyof MinecraftVersionCatalog]?.length || 0
}

/**
 * 构建版本 ID 到真实类型的映射表。
 * 后端返回的 all 数组中 type 可能全部为 'all'，需要按分类数组校正。
 */
const versionTypeMap = computed(() => {
  const catalog = versionCatalog.value
  const map = new Map<string, string>()
  if (!catalog) return map
  const typeKeys: (keyof MinecraftVersionCatalog)[] = ['release', 'snapshot', 'april_fools', 'old_beta', 'old_alpha']
  for (const type of typeKeys) {
    const list = catalog[type]
    if (!Array.isArray(list)) continue
    for (const v of list) {
      if (v?.id) map.set(v.id, type)
    }
  }
  return map
})

const filteredVersions = computed(() => {
  const catalog = versionCatalog.value
  let versions: MinecraftVersionItem[] = []
  if (catalog) {
    versions = catalog[selectedCategory.value as keyof MinecraftVersionCatalog] || []
  }

  // 校正 all 分类下版本的 type，避免全部显示为 'all'
  const typeMap = versionTypeMap.value
  versions = versions.map(v => {
    const realType = typeMap.get(v.id)
    if (realType && realType !== 'all' && v.type !== realType) {
      return { ...v, type: realType as MinecraftVersionType }
    }
    return v
  })

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

const defaultGamePath = ref('')
const gamePaths = ref<{ value: string; label: string }[]>([])

async function loadDefaultGamePath() {
  const res = await run(async () => backend.config.get<GameConfig>('game'))
  if (!res?.success || !res.data) return
  const data = res.data
  const paths = data.minecraft_paths || []
  gamePaths.value = paths.map((p: MinecraftPathEntry) => {
    const pathStr = typeof p === 'string' ? p : (p.path || '')
    const name = typeof p === 'object' ? (p.name || pathStr) : pathStr
    return { value: pathStr, label: name }
  })

  if (data.last_install_path) {
    defaultGamePath.value = data.last_install_path
  } else if (paths.length > 0) {
    const first = paths[0]
    if (first) {
      defaultGamePath.value = typeof first === 'string' ? first : (first.path || '')
    }
  }
}

async function saveLastInstallPath(path: string) {
  if (!path) return
  const res = await run(async () => backend.config.get<GameConfig>('game'))
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
    const params: CommandPayloadMap['install_version'] = {
      version_id: versionId,
      loader_type: loader,
      task_id: taskId,
    }
    if (versionName !== versionId) {
      params.version_name = versionName
    }
    if (loaderVersion) {
      if (loader === 'fabric') params.fabric_version = loaderVersion
      if (loader === 'forge') params.forge_version = loaderVersion
      if (loader === 'neoforge') params.neoforge_version = loaderVersion
      if (loader === 'quilt') params.quilt_version = loaderVersion
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
  } catch (e: unknown) {
    globalTaskQueue.updateTask(taskId, {
      status: 'error',
      message: (e instanceof Error ? e.message : String(e)) || t('versions.download.installFailed'),
    })
    glassMessage.error((e instanceof Error ? e.message : String(e)) || t('versions.download.installFailed'))
  } finally {
    downloading.value = null
  }
}

async function startInstall() {
  if (!installForm.value.mcVersion) return
  await doInstall()
}

function getVersionTypeLabel(type: string): string {
  return t(VERSION_LABEL_KEY_MAP[type] ?? type) || type
}

function getVersionBadgeClass(type: string): string {
  return _getVersionBadgeClass(type)
}

function getVersionIcon(type: string): string {
  return _getVersionIcon(type)
}

function getVersionImage(type: string): string {
  return _getVersionImage(type)
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

<style scoped src="@/styles/views/versions/VersionsTab.css"></style>
