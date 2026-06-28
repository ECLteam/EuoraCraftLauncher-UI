<template>
  <div class="install-page">
    <!-- 左侧类型筛选 - 280px -->
    <div class="filter-panel">
      <div class="filter-header">
        <h3 class="filter-title">
          <UiIcon name="filter" :size="16" />
          {{ t('versions.download.type') }}
        </h3>
      </div>

      <div class="filter-list">
        <div
          v-for="category in categories"
          :key="category.id"
          :class="['filter-item', { active: selectedCategory === category.id }]"
          @click="selectedCategory = category.id"
        >
          <div class="filter-indicator"></div>
          <UiIcon :name="category.icon" :size="16" class="filter-icon" />
          <span class="filter-name">{{ category.name }}</span>
          <span class="filter-count">{{ getCategoryCount(category.id) }}</span>
        </div>
      </div>

      <div class="filter-footer">
        <span class="footer-text">{{ t('versions.download.categoryCount', { count: allVersions?.length || 0 }) }}</span>
      </div>
    </div>

    <!-- 右侧版本列表 -->
    <div class="version-panel">
      <div class="panel-header">
        <div class="header-left">
          <h3 class="panel-title">
            <UiIcon name="cube" :size="16" />
            {{ currentCategoryName }}
          </h3>
          <span v-if="filteredVersions.length > 0" class="version-count-badge">
            {{ t('versions.download.versionCount', { count: filteredVersions.length }) }}
          </span>
        </div>
        <div class="header-right">
          <button class="btn-refresh" @click="fetchVersions">
            <UiIcon name="refresh" :size="14" />
            {{ t('versions.download.refreshList') }}
          </button>
          <UiInput
            v-model="searchQuery"
            :placeholder="t('versions.download.searchVersion')"
            clearable
            class="search-input"
          />
        </div>
      </div>

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
                  <UiIcon :name="getVersionIcon(version.type)" :size="18" />
                </div>

                <div class="version-info">
                  <div class="version-header">
                    <span class="version-id">{{ version.id }}</span>
                    <span :class="['badge', getVersionBadgeClass(version.type)]">
                      {{ getVersionTypeLabel(version.type) }}
                    </span>
                    <span v-if="isAprilFools(version.id)" class="badge badge-april">
                      {{ t('versions.download.aprilFools') }}
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
                    @click="quickInstall(version.id)"
                    :disabled="downloading === version.id"
                  >
                    <UiIcon name="download" :size="16" />
                    <span class="btn-install-text">{{ t('versions.download.install') }}</span>
                  </button>
                  <button
                    class="btn-advanced"
                    :title="t('versions.download.advanced')"
                    @click="openInstallWithVersion(version.id)"
                  >
                    <UiIcon name="settings" :size="14" />
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
    >
      <div class="form-group">
        <label>{{ t('versions.download.mcVersion') }} <span class="required">*</span></label>
        <div class="version-display">{{ installForm.mcVersion }}</div>
      </div>

      <div class="form-group">
        <label>{{ t('versions.download.loaderType') }}</label>
        <div class="loader-options">
          <button
            v-for="loader in loaders"
            :key="loader.value"
            class="loader-btn"
            :class="{ active: installForm.loader === loader.value }"
            @click="installForm.loader = loader.value"
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
          placeholder="最新版本"
        />
      </div>

      <div class="form-group">
        <label>{{ t('versions.download.gameDir') }}</label>
        <div class="input-with-button">
          <UiInput v-model="installForm.gamePath" :placeholder="t('instances.gamePathPlaceholder')" readonly />
          <UiButton variant="ghost" size="sm" @click="selectGamePath">{{ t('common.browse') }}</UiButton>
        </div>
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

    <ContentModal
      v-model:visible="showProgressDialog"
      :title="t('versions.download.installing')"
      :show-footer="false"
      :closable="false"
    >
      <div class="progress-body">
        <div class="progress-ring">
          <UiIcon name="spinner" class="spin" style="font-size: 48px;" />
        </div>
        <p class="progress-text">{{ progressMessage }}</p>
        <p class="progress-subtext">{{ installForm.mcVersion }} {{ installForm.loader ? `(${getLoaderLabel(installForm.loader)})` : '' }}</p>
      </div>
    </ContentModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import backend from '@/api/client'
import UiButton from '@/components/ui/Button.vue'
import UiIcon from '@/components/ui/Icon.vue'
import UiInput from '@/components/ui/Input.vue'
import UiSelect from '@/components/ui/Select.vue'
import ContentModal from '@/components/modals/ContentModal.vue'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { useAutoRefreshCache, CACHE_KEYS, CACHE_GROUPS } from '@/cache/composable'
import { globalCache } from '@/cache'
import type { MinecraftVersion } from '@/types/api'

const { t } = useI18n()
const glassMessage = useGlassMessage()

const downloading = ref<string | null>(null)
const searchQuery = ref('')
const selectedCategory = ref('all')

const {
  data: allVersions,
  loading,
  error: versionsError,
  fetchData: fetchVersionsData
} = useAutoRefreshCache<MinecraftVersion[]>(
  CACHE_KEYS.VERSIONS,
  async () => {
    const res = await backend.command('minecraft_versions')
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

async function loadFabricVersions(gameVersion: string) {
  if (!gameVersion) {
    fabricVersions.value = []
    return
  }
  try {
    const res = await backend.command('fabric_versions', { game_version: gameVersion })
    if (res.success && res.data) {
      const list = Array.isArray(res.data) ? res.data : (res.data.all || [])
      fabricVersions.value = list.map((v: any) => v.LoaderVersion || v.version || String(v)).slice(0, 20)
    }
  } catch (e) {
    console.error(t('versions.download.fetchFabricFailed'), e)
    fabricVersions.value = []
  }
}

const scrollContainerRef = ref<HTMLElement | null>(null)
const visibleRange = ref({ start: 0, end: 20 })
const itemHeight = 56
const bufferSize = 5

const showInstallDialog = ref(false)
const showProgressDialog = ref(false)
const isInstalling = ref(false)
const progressMessage = ref('准备安装...')

const installForm = ref({
  mcVersion: '',
  loader: 'vanilla',
  loaderVersion: '',
  gamePath: ''
})

const categories = [
  { id: 'all', name: '全部版本', icon: 'cube' },
  { id: 'release', name: '正式版', icon: 'check' },
  { id: 'snapshot', name: '快照版', icon: 'lab' },
  { id: 'old_beta', name: '旧版 Beta', icon: 'archive' },
  { id: 'old_alpha', name: '旧版 Alpha', icon: 'archive' },
  { id: 'april_fools', name: '愚人节版', icon: 'happy' }
]

const currentCategoryName = computed(() => {
  const cat = categories.find(c => c.id === selectedCategory.value)
  return cat ? cat.name : t('versions.download.installNew')
})

const loaders = [
  { value: 'vanilla', label: '原版', icon: 'cube' },
  { value: 'fabric', label: 'Fabric', icon: 'grid' },
  { value: 'forge', label: 'Forge', icon: 'fire' },
  { value: 'neoforge', label: 'NeoForge', icon: 'fire' },
  { value: 'quilt', label: 'Quilt', icon: 'grid' }
]

const aprilFoolsVersions = [
  '22w13oneblockatatime', '20w14infinite', '3d shareware v1.34',
  'java edition 3d shareware v1.34', '1.rv-pre1', '15w14a', '2.0',
]

function isAprilFools(versionId: string | null | undefined): boolean {
  if (!versionId) return false
  return aprilFoolsVersions.some(v => versionId.toLowerCase().includes(v.toLowerCase()))
}

function getCategoryCount(categoryId: string): number {
  if (!Array.isArray(allVersions.value)) return 0
  if (categoryId === 'all') return allVersions.value.length
  if (categoryId === 'april_fools') {
    return allVersions.value.filter(v => isAprilFools(v.id)).length
  }
  return allVersions.value.filter(v => v.type === categoryId).length
}

const filteredVersions = computed(() => {
  let versions = Array.isArray(allVersions.value) ? allVersions.value : []
  if (selectedCategory.value !== 'all') {
    if (selectedCategory.value === 'april_fools') {
      versions = versions.filter(v => isAprilFools(v.id))
    } else {
      versions = versions.filter(v => v.type === selectedCategory.value)
    }
  }
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    versions = versions.filter(v => v.id.toLowerCase().includes(query))
  }
  return versions
})

const visibleVersions = computed(() => {
  const { start, end } = visibleRange.value
  return (filteredVersions.value || []).slice(start, end)
})

const totalHeight = computed(() => (filteredVersions.value || []).length * itemHeight)
const topOffset = computed(() => visibleRange.value.start * itemHeight)

async function fetchVersions() {
  try {
    await fetchVersionsData()
    if (versionsError.value) {
      glassMessage.error(t('versions.download.fetchFailed'))
    }
  } catch (e) {
    glassMessage.error(t('versions.download.fetchFailed'))
  }
}

async function fetchLoaderVersions() {
  if (installForm.value.loader === 'fabric' && installForm.value.mcVersion) {
    await loadFabricVersions(installForm.value.mcVersion)
  }
}

function getLoaderVersionOptions(loader: string) {
  switch (loader) {
    case 'fabric': return (fabricVersions.value || []).map(v => ({ label: v, value: v }))
    default: return []
  }
}

function getLoaderLabel(loader: string): string {
  const found = loaders.find(l => l.value === loader)
  return found ? found.label : loader
}

async function selectGamePath() {
  try {
    const res = await backend.command('select_directory')
    if (res.success && res.data) installForm.value.gamePath = res.data.path
  } catch (e) { console.error('选择目录失败:', e) }
}

function openInstallWithVersion(versionId: string) {
  installForm.value = { mcVersion: versionId, loader: 'vanilla', loaderVersion: '', gamePath: '' }
  showInstallDialog.value = true
  fetchLoaderVersions()
}

let unlistenInstallProgress: (() => void) | null = null

async function doInstall() {
  const versionId = installForm.value.mcVersion
  const loader = installForm.value.loader
  const loaderVersion = installForm.value.loaderVersion
  const gamePath = installForm.value.gamePath || undefined

  showProgressDialog.value = true
  progressMessage.value = t('versions.download.preparingInstall')
  downloading.value = versionId

  // 监听安装进度
  unlistenInstallProgress = backend.on('game:install_progress', (payload: any) => {
    if (payload.phase === 'done') {
      progressMessage.value = t('versions.download.installComplete')
      glassMessage.success(t('versions.download.installSuccess', { version: versionId }))
      showProgressDialog.value = false
      downloading.value = null
    } else if (payload.phase === 'error') {
      progressMessage.value = payload.message || t('versions.download.installFailed')
      glassMessage.error(progressMessage.value)
      showProgressDialog.value = false
      downloading.value = null
    } else {
      progressMessage.value = payload.message || `${payload.done}/${payload.total}`
    }
  })

  try {
    const options: any = { loader_type: loader }
    if (loader === 'fabric' && loaderVersion) {
      options.fabric_version = loaderVersion
    }
    if (gamePath) {
      options.game_path = gamePath
    }

    const result = await backend.command('install_version', {
      version_id: versionId,
      options
    })

    if (!result.success) {
      progressMessage.value = result.message || t('versions.download.installFailed')
      glassMessage.error(progressMessage.value)
      showProgressDialog.value = false
      downloading.value = null
    }
  } catch (e: any) {
    progressMessage.value = e.message || t('versions.download.installFailed')
    glassMessage.error(progressMessage.value)
    showProgressDialog.value = false
    downloading.value = null
  }
}

async function quickInstall(versionId: string) {
  installForm.value.mcVersion = versionId
  installForm.value.loader = 'vanilla'
  installForm.value.loaderVersion = ''
  installForm.value.gamePath = ''
  await doInstall()
}

async function startInstall() {
  if (!installForm.value.mcVersion) return
  showInstallDialog.value = false
  await doInstall()
}

function getVersionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'release': t('versions.download.release'),
    'snapshot': t('versions.download.snapshot'),
    'old_beta': t('versions.download.oldBeta'),
    'old_alpha': t('versions.download.oldAlpha')
  }
  return labels[type] || type
}

function getVersionBadgeClass(type: string): string {
  const classes: Record<string, string> = {
    'release': 'badge-success',
    'snapshot': 'badge-warning',
    'old_beta': 'badge-info',
    'old_alpha': 'badge-info'
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

function handleScroll() {
  if (!scrollContainerRef.value || !filteredVersions.value) return
  const scrollTop = scrollContainerRef.value.scrollTop
  const containerHeight = scrollContainerRef.value.clientHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize)
  const endIndex = Math.min(
    filteredVersions.value.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferSize
  )
  visibleRange.value = { start: startIndex, end: endIndex }
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

watch(() => installForm.value.mcVersion, (mcVersion) => {
  if (installForm.value.loader === 'fabric' && mcVersion) {
    loadFabricVersions(mcVersion)
  }
})

watch(() => installForm.value.loader, (loader) => {
  if (loader === 'fabric' && installForm.value.mcVersion) {
    loadFabricVersions(installForm.value.mcVersion)
  } else if (loader !== 'fabric') {
    installForm.value.loaderVersion = ''
  }
})

onMounted(() => {
  // 清除旧格式缓存（后端已改为扁平数组格式）
  globalCache.delete(CACHE_KEYS.VERSIONS)

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
  if (unlistenInstallProgress) {
    unlistenInstallProgress()
  }
})
</script>

<style scoped>
.install-page {
  display: flex;
  gap: 0;
  height: 100%;
}

/* 左侧筛选面板 */
.filter-panel {
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
}

.filter-header {
  padding: 0 0 12px 0;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* 筛选列表 - 无卡片包裹 */
.filter-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.filter-item {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 12px;
  border-radius: var(--r-sm);
  cursor: pointer;
  position: relative;
  transition: background 150ms ease-out;
  gap: 10px;
}

.filter-item:hover {
  background: var(--bg-hover);
}

.filter-item.active {
  background: var(--primary-alpha);
}

.filter-indicator {
  position: absolute;
  left: 0;
  top: 4px;
  bottom: 4px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: var(--primary);
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.filter-item.active .filter-indicator {
  opacity: 1;
}

.filter-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
  margin-left: 8px;
}

.filter-item.active .filter-icon {
  color: var(--primary);
}

.filter-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.filter-count {
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: right;
}

.filter-footer {
  padding: 12px 0 0;
}

.footer-text {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 右侧版本面板 */
.version-panel {
  flex: 1;
  margin-left: var(--s-lg);
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 48px;
  border-bottom: 1px solid var(--divider);
  flex-shrink: 0;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: var(--s-sm);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.header-left { display: flex; align-items: center; gap: var(--s-sm); }
.header-right { display: flex; align-items: center; gap: var(--s-sm); }

.version-count-badge {
  font-size: 12px;
  color: var(--text-tertiary);
  background: var(--bg-base-alt);
  padding: 2px 8px;
  border-radius: var(--r-xs);
}

.search-input { width: 200px; }

.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.btn-refresh:hover {
  border-color: var(--primary);
  color: var(--primary);
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

.btn-primary:hover { background: var(--primary-hover); }

/* 版本内容 */
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
  padding: 0 12px;
  border-radius: var(--r-sm);
  transition: background 150ms ease-out;
  gap: 12px;
}

.version-item:hover {
  background: var(--bg-hover);
}

.version-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--r-sm);
  background: var(--primary-alpha);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  flex-shrink: 0;
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
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.version-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
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
  width: 32px;
  height: 32px;
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
  padding: 0 12px;
  background: var(--primary-hover);
}

.btn-install-text {
  display: none;
  font-size: 12px;
  font-weight: 500;
}

.btn-install:hover .btn-install-text {
  display: inline;
}

.btn-advanced {
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
  transition: all 150ms ease-out;
  opacity: 0;
}

.version-item:hover .btn-advanced {
  opacity: 1;
}

.btn-advanced:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}

/* 徽章 */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--r-xs);
  font-size: 11px;
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
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.empty-hint {
  font-size: 12px;
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