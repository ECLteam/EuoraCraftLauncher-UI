<template>
  <div class="tab-pane">
    <div class="toolbar">
      <div class="toolbar-left">
        <h3 class="toolbar-title">
          <UiIcon name="download" />
          {{ t('versions.download.installNew') }}
        </h3>
      </div>
      <div class="toolbar-right">
        <UiButton
          variant="ghost"
          size="sm"
          icon="refresh"
          @click="fetchVersions"
        >
          {{ t('versions.download.refreshList') }}
        </UiButton>
        <UiInput
          v-model="searchQuery"
          placeholder="搜索版本..."
          clearable
          class="search-input"
        />
      </div>
    </div>

    <div class="management-layout">
      <div class="panel paths-panel">
        <div class="panel-header">
          <h3>
            <UiIcon name="filter" />
            {{ t('versions.download.type') }}
          </h3>
        </div>

        <div class="panel-content paths-list">
          <div
            v-for="category in categories"
            :key="category.id"
            :class="['path-item', { active: selectedCategory === category.id }]"
            @click="selectedCategory = category.id"
          >
            <div class="path-info">
              <UiIcon :name="category.icon" />
              <div class="path-text-wrapper">
                <span class="path-name">{{ category.name }}</span>
              </div>
            </div>
            <span class="category-count">{{ getCategoryCount(category.id) }}</span>
          </div>
        </div>

        <div class="panel-footer">
          {{ t('versions.download.categoryCount', { count: allVersions?.length || 0 }) }}
        </div>
      </div>

      <div class="panel versions-panel">
        <div class="panel-header">
          <div class="header-left">
            <h3>
              <UiIcon name="cube" />
              {{ currentCategoryName }}
            </h3>
            <span v-if="filteredVersions.length > 0" class="version-count">
              {{ t('versions.download.versionCount', { count: filteredVersions.length }) }}
            </span>
          </div>
        </div>

        <div class="panel-content">
          <div v-if="loading" class="loading-container">
            <UiIcon name="spinner" class="spin" style="font-size: 32px;" />
            <p>{{ t('versions.download.fetchingList') }}</p>
          </div>

          <div v-else-if="filteredVersions.length === 0" class="empty-state">
            <UiIcon name="cube" />
            <p>{{ t('versions.download.noVersions') }}</p>
          </div>

          <div 
            v-else 
            ref="scrollContainerRef" 
            class="versions-list-scroll-container"
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
                  <div class="version-main">
                    <div class="version-left">
                      <div class="version-icon" :class="version.type">
                        <UiIcon :name="getVersionIcon(version.type)" />
                      </div>

                      <div class="version-info">
                        <div class="version-header">
                          <h4 class="version-name">{{ version.id }}</h4>
                          <span class="badge" :class="getVersionBadgeClass(version.type)">
                            {{ getVersionTypeLabel(version.type) }}
                          </span>
                          <span v-if="isAprilFools(version.id)" class="badge badge-april">
                            {{ t('versions.download.aprilFools') }}
                          </span>
                        </div>
                        <div class="version-meta">
                          <span class="meta-item">
                            <UiIcon name="calendar" />
                            {{ formatDate(version.releaseTime) }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="version-actions">
                      <UiButton
                        variant="primary"
                        size="sm"
                        icon="download"
                        @click="quickInstall(version.id)"
                        :loading="downloading === version.id"
                      >
                        {{ t('versions.download.install') }}
                      </UiButton>
                      <UiButton
                        variant="ghost"
                        size="sm"
                        icon="settings"
                        @click="openInstallWithVersion(version.id)"
                      >
                        {{ t('versions.download.advanced') }}
                      </UiButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from '@/api/client'
import UiButton from '@/components/ui/Button.vue'
import UiIcon from '@/components/ui/Icon.vue'
import UiInput from '@/components/ui/Input.vue'
import UiSelect from '@/components/ui/Select.vue'
import ContentModal from '@/components/modals/ContentModal.vue'
import { useGlassMessage } from '@/composables/useGlassMessage'
import { useAutoRefreshCache, CACHE_KEYS, CACHE_GROUPS } from '@/cache/composable'
import type { MinecraftVersion } from '@/types/api'

const { t } = useI18n()
const glassMessage = useGlassMessage()

const downloading = ref<string | null>(null)
const searchQuery = ref('')
const selectedCategory = ref('all')

// 使用全局缓存管理版本数据
const { 
  data: allVersions, 
  loading, 
  error: versionsError,
  fetchData: fetchVersionsData 
} = useAutoRefreshCache<MinecraftVersion[]>(
  CACHE_KEYS.VERSIONS,
  async () => {
    const res = await api.getMinecraftVersions()
    if (res.success && res.data) {
      return res.data
    }
    throw new Error('获取版本列表失败')
  },
  {
    ttl: 10 * 60 * 1000, // 10分钟缓存
    group: CACHE_GROUPS.VERSION,
    persistent: true
  }
)

// Fabric版本缓存
const { 
  data: fabricVersions,
  fetchData: fetchFabricVersionsData 
} = useAutoRefreshCache<string[]>(
  CACHE_KEYS.FABRIC_VERSIONS,
  async () => {
    const res = await api.getFabricVersions()
    if (res.success && res.data) {
      return res.data.slice(0, 20)
    }
    throw new Error('获取Fabric版本失败')
  },
  {
    ttl: 30 * 60 * 1000, // 30分钟缓存
    group: CACHE_GROUPS.VERSION
  }
)

// 虚拟滚动相关状态
const scrollContainerRef = ref<HTMLElement | null>(null)
const visibleRange = ref({ start: 0, end: 20 })
const itemHeight = 56 // 每个版本项的高度
const bufferSize = 5 // 缓冲区大小

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
  '22w13oneblockatatime',
  '20w14infinite',
  '3d shareware v1.34',
  'java edition 3d shareware v1.34',
  '1.rv-pre1',
  '15w14a',
  '2.0',
]

function isAprilFools(versionId: string): boolean {
  const lowerId = versionId.toLowerCase()
  return aprilFoolsVersions.some(v => lowerId.includes(v.toLowerCase()))
}

function getCategoryCount(categoryId: string): number {
  if (!allVersions.value) return 0
  
  if (categoryId === 'all') return allVersions.value.length
  if (categoryId === 'april_fools') {
    return allVersions.value.filter(v => isAprilFools(v.id)).length
  }
  return allVersions.value.filter(v => v.type === categoryId).length
}

const filteredVersions = computed(() => {
  let versions = allVersions.value || []

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

// 可见版本列表（虚拟滚动）
const visibleVersions = computed(() => {
  const { start, end } = visibleRange.value
  return (filteredVersions.value || []).slice(start, end)
})

// 总列表高度（用于虚拟滚动容器）
const totalHeight = computed(() => (filteredVersions.value || []).length * itemHeight)

// 上边距（用于虚拟滚动定位）
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
  try {
    await fetchFabricVersionsData()
  } catch (e) {
    console.error(t('versions.download.fetchFabricFailed'), e)
  }
}

function getLoaderVersionOptions(loader: string) {
  switch (loader) {
    case 'fabric':
      return (fabricVersions.value || []).map(v => ({ label: v, value: v }))
    default:
      return []
  }
}

function getLoaderLabel(loader: string): string {
  const found = loaders.find(l => l.value === loader)
  return found ? found.label : loader
}

async function selectGamePath() {
  try {
    const res = await api.selectDirectory()
    if (res.success && res.data) {
      installForm.value.gamePath = res.data.path
    }
  } catch (e) {
    console.error('选择目录失败:', e)
  }
}

function openInstallWithVersion(versionId: string) {
  installForm.value = {
    mcVersion: versionId,
    loader: 'vanilla',
    loaderVersion: '',
    gamePath: ''
  }
  showInstallDialog.value = true
  fetchLoaderVersions()
}

async function quickInstall(versionId: string) {
  installForm.value.mcVersion = versionId
  installForm.value.loader = 'vanilla'
  installForm.value.loaderVersion = ''
  installForm.value.gamePath = ''
  // 【待对接】安装功能暂不可用
  glassMessage.info('安装功能待对接')
  console.warn('[API] installVersion 待对接')
}

async function startInstall() {
  if (!installForm.value.mcVersion) return

  // 【待对接】安装功能暂不可用
  glassMessage.info('安装功能待对接')
  console.warn('[API] installVersion 待对接')
  showInstallDialog.value = false
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
    'release': 'check',
    'snapshot': 'lab',
    'old_beta': 'archive',
    'old_alpha': 'archive'
  }
  return icons[type] || 'cube'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// 滚动事件处理
function handleScroll() {
  if (!scrollContainerRef.value || !filteredVersions.value) return
  
  const scrollTop = scrollContainerRef.value.scrollTop
  const containerHeight = scrollContainerRef.value.clientHeight
  
  // 计算可见范围
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize)
  const endIndex = Math.min(
    filteredVersions.value.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferSize
  )
  
  visibleRange.value = { start: startIndex, end: endIndex }
}

// 监听过滤后的版本列表变化，重置滚动位置
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
  // 如果缓存中没有数据，则发起请求
  if (!allVersions.value || allVersions.value.length === 0) {
    fetchVersions()
  }
  
  // 加载Fabric版本（按需加载）
  if (!fabricVersions.value || fabricVersions.value.length === 0) {
    fetchLoaderVersions()
  }
  
  nextTick(() => {
    if (scrollContainerRef.value) {
      // 初始设置可见范围
      visibleRange.value = { 
        start: 0, 
        end: Math.ceil(scrollContainerRef.value.clientHeight / itemHeight) + bufferSize * 2 
      }
    }
  })
})
</script>

<style scoped>
.tab-pane {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.toolbar-title :deep(.icon) {
  color: var(--color-primary);
  font-size: 18px;
}

.search-input {
  width: 200px;
}

.management-layout {
  display: flex;
  flex: 1;
  gap: 12px;
  overflow: hidden;
  min-height: 0;
}

.panel {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-color);
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.panel-header h3 :deep(.icon) {
  color: var(--color-primary);
  font-size: 16px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.panel-footer {
  padding: 8px 14px;
  border-top: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-size: 11px;
  text-align: center;
  flex-shrink: 0;
}

.paths-panel {
  width: 200px;
  min-width: 200px;
}

.paths-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.path-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
  border: 1px solid transparent;
}

.path-item:hover {
  background: var(--bg-surface-hover);
}

.path-item.active {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.path-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  overflow: hidden;
}

.path-info :deep(.icon) {
  font-size: 16px;
  color: var(--color-primary);
  flex-shrink: 0;
}

.path-text-wrapper {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex: 1;
  min-width: 0;
}

.path-name {
  font-weight: 500;
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-count {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--bg-app);
  border-radius: 10px;
  color: var(--text-secondary);
  min-width: 20px;
  text-align: center;
}

.path-item.active .category-count {
  background: rgba(255, 255, 255, 0.3);
  color: var(--text-primary);
}

.versions-panel {
  flex: 1;
  min-width: 0;
}

.versions-panel .panel-content {
  padding: 10px;
  min-width: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.version-count {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-app);
  padding: 2px 10px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.loading-container,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 16px;
  color: var(--text-secondary);
}

.empty-state :deep(.icon) {
  font-size: 40px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 13px;
}

/* 虚拟滚动容器 */
.versions-list-scroll-container {
  height: 100%;
  overflow-y: auto;
  min-width: 0;
  width: 100%;
}

.virtual-scroll-container {
  position: relative;
  width: 100%;
}

.virtual-scroll-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.versions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  width: 100%;
}

.version-item {
  background: var(--bg-app);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  padding: 8px 12px;
  transition: var(--transition-fast);
  min-width: 0;
}

.version-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
  border-color: var(--color-primary);
}

.version-main {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.version-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.version-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  transition: all 0.2s;
}

.version-icon.release {
  background: rgba(82, 196, 26, 0.15);
  color: #52c41a;
  border: 1px solid rgba(82, 196, 26, 0.3);
}

.version-icon.snapshot {
  background: rgba(250, 173, 20, 0.15);
  color: #faad14;
  border: 1px solid rgba(250, 173, 20, 0.3);
}

.version-icon.old_beta {
  background: rgba(24, 144, 255, 0.15);
  color: #1890ff;
  border: 1px solid rgba(24, 144, 255, 0.3);
}

.version-icon.old_alpha {
  background: rgba(114, 46, 209, 0.15);
  color: #722ed1;
  border: 1px solid rgba(114, 46, 209, 0.3);
}

.version-info {
  flex: 1;
  min-width: 0;
}

.version-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.version-name {
  margin: 0;
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary);
}

.version-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
}

.meta-item :deep(.icon) {
  font-size: 12px;
}

.version-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  margin-left: auto;
  padding-left: 12px;
}

.badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.badge-success {
  background: var(--success-bg);
  color: var(--success-color);
}

.badge-warning {
  background: var(--warning-bg);
  color: var(--warning-color);
}

.badge-info {
  background: var(--info-bg);
  color: var(--info-color);
}

.badge-default {
  background: var(--bg-surface);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.badge-april {
  background: rgba(255, 107, 107, 0.08);
  color: #e85d5d;
  border: 1px solid rgba(255, 107, 107, 0.25);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--text-primary);
}

.form-group .required {
  color: var(--error-color);
}

.version-display {
  padding: 8px 10px;
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.input-with-button {
  display: flex;
  gap: 8px;
}

.input-with-button :deep(.ui-input-wrapper) {
  flex: 1;
}

.loader-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.loader-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.loader-btn:hover {
  border-color: var(--color-primary);
  color: var(--text-primary);
}

.loader-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.progress-body {
  text-align: center;
  padding: 20px;
}

.progress-ring {
  margin-bottom: 20px;
}

.progress-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.progress-subtext {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>